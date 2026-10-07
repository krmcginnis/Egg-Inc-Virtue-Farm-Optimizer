'use strict';
// Exercise the actual local helper and its detached Windows updater, without
// network substitution in production or access to any personal farm fixtures.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawn,spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),testRoot=fs.mkdtempSync(path.join(root,'tmp','update-launch-'));
const executable=process.env.POWERSHELL_EXECUTABLE||(process.platform==='win32'?'powershell.exe':'pwsh');
const env={...process.env};
if(process.platform==='win32')for(const key of Object.keys(env))if(key.toUpperCase()==='PSMODULEPATH')delete env[key];
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const current=JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version;
const parts=current.split('.').map(Number);parts[2]++;const next=parts.join('.');
function python(code,...args){const r=spawnSync(process.platform==='win32'?'python':'python3',['-c',code,...args],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||String(r.error));}
async function request(base,route,body,token){const response=await fetch(base+'/api/update/'+route,{signal:AbortSignal.timeout(route==='health'?1000:5000),...(body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','X-Virtue-Token':token},body:JSON.stringify(body)})});const data=await response.json();if(!response.ok)throw Error(data.error||JSON.stringify(data));return data;}
function cleanup(app){const target=path.join(app,'Local-Helper.ps1');if(process.platform==='win32'){spawnSync(executable,['-NoProfile','-Command',`$target=${quote(target)}; Get-CimInstance Win32_Process | Where-Object {$_.CommandLine -and $_.CommandLine.Contains($target) -and $_.ProcessId -ne $PID} | ForEach-Object {Stop-Process -Id $_.ProcessId -Force}`],{env});}else{const r=spawnSync('ps',['-eo','pid,args'],{encoding:'utf8'});for(const line of r.stdout.split('\n'))if(line.includes(target)){try{process.kill(Number(line.trim().split(/\s+/)[0]));}catch{}}}}
async function run(kind,index){
 console.log('START native update launch fixture: '+kind);
 const dir=path.join(testRoot,kind);fs.mkdirSync(dir);const app=path.join(dir,'installed app with spaces');
 python('import zipfile,sys,pathlib,shutil; z=zipfile.ZipFile(sys.argv[1]); z.extractall(sys.argv[2]); shutil.move(str(pathlib.Path(sys.argv[2])/"Egg-Inc-Virtue-Farm-Optimizer"),sys.argv[3])',path.join(root,'tmp/release/Egg-Inc-Virtue-Farm-Optimizer.zip'),dir,app);
 const releasePath=path.join(dir,'release.json'),archive=path.join(dir,'release.zip');
 if(kind==='legacy-worker'){
  const script=path.join(app,'Update-App.ps1');
  fs.writeFileSync(script,fs.readFileSync(script,'utf8').replace("    if ($env:OS -eq 'Windows_NT') { $options.WindowStyle = 'Hidden'; $options.ArgumentList += '-Background' }\n    else {", "    if ($env:OS -ne 'Windows_NT') {"));
 }

 fs.appendFileSync(path.join(app,'Update-Core.ps1'),`\n# Isolated test-only network replacements.\nfunction Get-UpdateRelease { param($Repository,$CurrentVersion,$TemporaryDirectory); return (Read-UpdateJson ${quote(releasePath)}) }\nfunction Save-UpdateDownload { param($Url,$Path,$Limit); [IO.File]::Copy(${quote(archive)},$Path,$true) }\n`);
 const hostScript=path.join(app,'Local-Helper.ps1');fs.writeFileSync(hostScript,fs.readFileSync(hostScript,'utf8').replace('$client = $listener.AcceptTcpClient()',"$client = $listener.AcceptTcpClient(); Write-Host 'TEST accepted connection'").replace("$path = $first[1].Split('?')[0]","$path = $first[1].Split('?')[0]; Write-Host ('TEST request ' + $method + ' ' + $path)"));
 fs.writeFileSync(path.join(app,'update-config.json'),JSON.stringify({repository:'example/update-test'}));fs.writeFileSync(path.join(app,'my-farm.json'),'private test farm');
 let manifest=JSON.parse(fs.readFileSync(path.join(app,'Update-Files.json')));
 const refresh=(where,m)=>({...m,files:m.files.map(f=>{const bytes=fs.readFileSync(path.join(where,f.path));return {...f,size:bytes.length,sha256:hash(bytes)};})});
 manifest=refresh(app,manifest);fs.writeFileSync(path.join(app,'Update-Files.json'),JSON.stringify(manifest));
 const stage=path.join(dir,'next');fs.cpSync(app,stage,{recursive:true});const pkg=JSON.parse(fs.readFileSync(path.join(stage,'package.json')));pkg.version=next;fs.writeFileSync(path.join(stage,'package.json'),JSON.stringify(pkg));
 fs.renameSync(path.join(stage,`AUDIT-v${current}.md`),path.join(stage,`AUDIT-v${next}.md`));
 fs.appendFileSync(path.join(stage,'app.js'),'\n// Isolated next-version fixture.\n');
 if(kind==='startup-failure')fs.writeFileSync(path.join(stage,'Local-Helper.ps1'),"throw 'Injected helper startup failure'\n");
 const updated=refresh(stage,{...manifest,version:next,files:manifest.files.map(f=>({...f,path:f.path===`AUDIT-v${current}.md`?`AUDIT-v${next}.md`:f.path}))});fs.writeFileSync(path.join(stage,'Update-Files.json'),JSON.stringify(updated));
 python('import zipfile,json,sys,pathlib; r=pathlib.Path(sys.argv[1]); m=json.loads((r/"Update-Files.json").read_text()); z=zipfile.ZipFile(sys.argv[2],"w",zipfile.ZIP_DEFLATED); [z.write(r/f,"Egg-Inc-Virtue-Farm-Optimizer/"+f) for f in [x["path"] for x in m["files"]]+["Update-Files.json","update-config.json"]]; z.close()',stage,archive);
 const bytes=fs.readFileSync(archive);fs.writeFileSync(releasePath,JSON.stringify({configured:true,available:true,version:next,repository:'example/update-test',url:`https://github.com/example/update-test/releases/download/v${next}/Egg-Inc-Virtue-Farm-Optimizer.zip`,size:bytes.length,sha256:hash(bytes)}));
 const base='http://127.0.0.1:'+(8780+index),before=hash(fs.readFileSync(path.join(app,'app.js')));
 const helper=process.platform==='win32'
  ? spawn('cmd.exe',['/d','/s','/c',`""${path.join(app,'Start-Virtue-Optimizer.cmd')}" -NoBrowser -Port ${8780+index}"`],{env,cwd:app,windowsVerbatimArguments:true})
  : spawn(executable,['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(app,'Local-Helper.ps1'),'-NoBrowser','-Port',String(8780+index)],{env,cwd:app});let log='';helper.stdout.on('data',b=>log+=b);helper.stderr.on('data',b=>log+=b);helper.on('error',e=>log+=e);
 try{
  let health;const bootDeadline=Date.now()+15000;while(Date.now()<bootDeadline){try{health=await request(base,'health');break}catch{await pause(250)}}assert.equal(health?.version,current,'Initial helper failed: '+log);console.log(kind+': initial helper ready');
  const duplicate=spawnSync(executable,['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(app,'Local-Helper.ps1'),'-NoBrowser','-Port',String(8780+index),'-Console'],{env,encoding:'utf8',timeout:10000});assert.notEqual(duplicate.status,0,'A second app helper shared the live port');assert.match(duplicate.stderr,/Cannot open a local app port/);
  const session=await(await fetch(base+'/session.js')).text(),token=session.match(/'([a-f0-9]{32})'/)[1];
  if(process.platform==='win32'){
   const inspect=()=>{
    const result=spawnSync(executable,['-NoProfile','-Command',`$target=${quote(hostScript)}; $items=@(Get-CimInstance Win32_Process | Where-Object {$_.CommandLine -and $_.CommandLine.Contains($target) -and $_.ProcessId -ne $PID} | ForEach-Object {$p=Get-Process -Id $_.ProcessId; [PSCustomObject]@{pid=$p.Id;window=[long]$p.MainWindowHandle;command=$_.CommandLine}}); ConvertTo-Json -InputObject $items -Compress`],{env,encoding:'utf8',timeout:10000});
    assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);
   };
   const running=inspect();assert.equal(running.length,1);assert.equal(running[0].window,0);assert.match(running[0].command,/-WindowStyle Hidden/);assert.match(running[0].command,/-Background/);
   const reopened=spawnSync(executable,['-NoProfile','-ExecutionPolicy','Bypass','-File',hostScript,'-NoBrowser','-Background'],{env,cwd:app,encoding:'utf8',timeout:15000});
   assert.equal(reopened.status,0,reopened.stderr);
   const processes=inspect();
   assert.equal(processes.length,1,'Repeat launch left another hidden helper');assert.equal(processes[0].pid,running[0].pid);
   assert.equal(await(await fetch(base+'/session.js')).text(),session,'Repeat launch changed the session/origin');
   console.log('PASS actual CMD launch from a path with spaces: hidden helper and repeat-launch reuse.');
  }
  assert.equal((await request(base,'check',{},token)).version,next);await request(base,'start',{version:next},token);
  console.log(kind+': download worker started');
  let state;for(let i=0;i<90;i++){state=await request(base,'status');if(['ready','failed'].includes(state.job?.state))break;await pause(250)}assert.equal(state.job?.state,'ready',JSON.stringify(state));
  await request(base,'install',{},token);
  console.log(kind+': install worker started');const restartDeadline=Date.now()+60000;
  while(Date.now()<restartDeadline){try{state=await request(base,'health');if(state.result&&!state.pending)break}catch{}await pause(300)}
  assert.ok(state?.result,'Update did not finish: '+JSON.stringify(state));assert.equal(state.result.ok,kind!=='startup-failure',JSON.stringify(state));assert.equal(state.version,kind!=='startup-failure'?next:current,JSON.stringify(state));
  if(process.platform==='win32'){
   const hidden=spawnSync(executable,['-NoProfile','-Command',`$target=${quote(hostScript)}; $items=@(Get-CimInstance Win32_Process | Where-Object {$_.CommandLine -and $_.CommandLine.Contains($target) -and $_.ProcessId -ne $PID} | ForEach-Object {$p=Get-Process -Id $_.ProcessId; [PSCustomObject]@{window=[long]$p.MainWindowHandle;command=$_.CommandLine}}); ConvertTo-Json -InputObject $items -Compress`],{env,encoding:'utf8',timeout:10000});
   assert.equal(hidden.status,0,hidden.stderr);const running=JSON.parse(hidden.stdout);assert.equal(running.length,1);assert.equal(running[0].window,0);if(kind!=='legacy-worker')assert.match(running[0].command,/-Background/);
   console.log('PASS hidden '+kind+' restart helper.');
  }
  assert.equal(fs.readFileSync(path.join(app,'my-farm.json'),'utf8'),'private test farm');assert.equal(JSON.parse(fs.readFileSync(path.join(app,'update-config.json'))).repository,'example/update-test');
  if(kind==='startup-failure')assert.equal(hash(fs.readFileSync(path.join(app,'app.js'))),before);
  console.log('PASS native helper/worker '+kind+': launch, verification, stop, restart and retained farm/source.');
 }catch(error){console.error('Fixture diagnostics:',dir,log);const resultPath=path.join(app,'.update-result.json');if(fs.existsSync(resultPath))console.error('Update result:',fs.readFileSync(resultPath,'utf8'));const jobs=path.join(app,'.updates');if(fs.existsSync(jobs))for(const name of fs.readdirSync(jobs).filter(n=>n.startsWith('job-'))){const job=path.join(jobs,name);for(const file of fs.readdirSync(job).filter(n=>/\.log$|status\.json$/.test(n)))console.error(file,fs.readFileSync(path.join(job,file),'utf8'));}throw error;}
 finally{helper.kill();cleanup(app);}
}
(async()=>{await run('success',0);await run('startup-failure',1);await run('legacy-worker',2);})().catch(e=>{console.error(e);process.exitCode=1});
