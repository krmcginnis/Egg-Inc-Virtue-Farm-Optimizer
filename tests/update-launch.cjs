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
async function request(base,route,body,token){const response=await fetch(base+'/api/update/'+route,{signal:AbortSignal.timeout(20000),...(body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','X-Virtue-Token':token},body:JSON.stringify(body)})});const data=await response.json();if(!response.ok)throw Error(data.error||JSON.stringify(data));return data;}
function cleanup(app){const target=path.join(app,'Local-Helper.ps1');if(process.platform==='win32'){spawnSync(executable,['-NoProfile','-Command',`$target=${quote(target)}; Get-CimInstance Win32_Process | Where-Object {$_.CommandLine -and $_.CommandLine.Contains($target) -and $_.ProcessId -ne $PID} | ForEach-Object {Stop-Process -Id $_.ProcessId -Force}`],{env});}else{const r=spawnSync('ps',['-eo','pid,args'],{encoding:'utf8'});for(const line of r.stdout.split('\n'))if(line.includes(target)){try{process.kill(Number(line.trim().split(/\s+/)[0]));}catch{}}}}
async function run(kind,index){
 const dir=path.join(testRoot,kind);fs.mkdirSync(dir);const app=path.join(dir,'installed app with spaces');
 python('import zipfile,sys,pathlib,shutil; z=zipfile.ZipFile(sys.argv[1]); z.extractall(sys.argv[2]); shutil.move(str(pathlib.Path(sys.argv[2])/"Egg-Inc-Virtue-Farm-Optimizer"),sys.argv[3])',path.join(root,'tmp/release/Egg-Inc-Virtue-Farm-Optimizer.zip'),dir,app);
 const releasePath=path.join(dir,'release.json'),archive=path.join(dir,'release.zip');
 fs.appendFileSync(path.join(app,'Update-Core.ps1'),`\n# Isolated test-only network replacements.\nfunction Get-UpdateRelease { param($Repository,$CurrentVersion,$TemporaryDirectory); return (Read-UpdateJson ${quote(releasePath)}) }\nfunction Save-UpdateDownload { param($Url,$Path,$Limit); [IO.File]::Copy(${quote(archive)},$Path,$true) }\n`);
 fs.writeFileSync(path.join(app,'update-config.json'),JSON.stringify({repository:'example/update-test'}));fs.writeFileSync(path.join(app,'my-farm.json'),'private test farm');
 let manifest=JSON.parse(fs.readFileSync(path.join(app,'Update-Files.json')));
 const refresh=(where,m)=>({...m,files:m.files.map(f=>{const bytes=fs.readFileSync(path.join(where,f.path));return {...f,size:bytes.length,sha256:hash(bytes)};})});
 manifest=refresh(app,manifest);fs.writeFileSync(path.join(app,'Update-Files.json'),JSON.stringify(manifest));
 const stage=path.join(dir,'next');fs.cpSync(app,stage,{recursive:true});const pkg=JSON.parse(fs.readFileSync(path.join(stage,'package.json')));pkg.version=next;fs.writeFileSync(path.join(stage,'package.json'),JSON.stringify(pkg));
 fs.renameSync(path.join(stage,`AUDIT-v${current}.md`),path.join(stage,`AUDIT-v${next}.md`));
 if(kind==='startup-failure')fs.writeFileSync(path.join(stage,'Local-Helper.ps1'),"throw 'Injected helper startup failure'\n");
 const updated=refresh(stage,{...manifest,version:next,files:manifest.files.map(f=>({...f,path:f.path===`AUDIT-v${current}.md`?`AUDIT-v${next}.md`:f.path}))});fs.writeFileSync(path.join(stage,'Update-Files.json'),JSON.stringify(updated));
 python('import zipfile,json,sys,pathlib; r=pathlib.Path(sys.argv[1]); m=json.loads((r/"Update-Files.json").read_text()); z=zipfile.ZipFile(sys.argv[2],"w",zipfile.ZIP_DEFLATED); [z.write(r/f,"Egg-Inc-Virtue-Farm-Optimizer/"+f) for f in [x["path"] for x in m["files"]]+["Update-Files.json","update-config.json"]]; z.close()',stage,archive);
 const bytes=fs.readFileSync(archive);fs.writeFileSync(releasePath,JSON.stringify({configured:true,available:true,version:next,repository:'example/update-test',url:`https://github.com/example/update-test/releases/download/v${next}/Egg-Inc-Virtue-Farm-Optimizer.zip`,size:bytes.length,sha256:hash(bytes)}));
 const base='http://127.0.0.1:'+(8780+index),before=hash(fs.readFileSync(path.join(app,'app.js')));
 const helper=spawn(executable,['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(app,'Local-Helper.ps1'),'-NoBrowser','-Port',String(8780+index)],{env,cwd:app});let log='';helper.stdout.on('data',b=>log+=b);helper.stderr.on('data',b=>log+=b);helper.on('error',e=>log+=e);
 try{
  let health;for(let i=0;i<60;i++){try{health=await request(base,'health');break}catch{await pause(250)}}assert.equal(health?.version,current,'Initial helper failed: '+log);
  const session=await(await fetch(base+'/session.js')).text(),token=session.match(/'([a-f0-9]{32})'/)[1];
  assert.equal((await request(base,'check',{},token)).version,next);await request(base,'start',{version:next},token);
  let state;for(let i=0;i<90;i++){state=await request(base,'status');if(['ready','failed'].includes(state.job?.state))break;await pause(250)}assert.equal(state.job?.state,'ready',JSON.stringify(state));
  await request(base,'install',{},token);
  for(let i=0;i<180;i++){try{state=await request(base,'health');if(state.result&&!state.pending)break}catch{}await pause(300)}
  assert.ok(state?.result,'Update did not finish: '+JSON.stringify(state));assert.equal(state.result.ok,kind==='success',JSON.stringify(state));assert.equal(state.version,kind==='success'?next:current,JSON.stringify(state));
  assert.equal(fs.readFileSync(path.join(app,'my-farm.json'),'utf8'),'private test farm');assert.equal(JSON.parse(fs.readFileSync(path.join(app,'update-config.json'))).repository,'example/update-test');
  if(kind==='startup-failure')assert.equal(hash(fs.readFileSync(path.join(app,'app.js'))),before);
  console.log('PASS native helper/worker '+kind+': launch, verification, stop, restart and retained farm/source.');
 }catch(error){console.error('Fixture diagnostics:',dir,log);for(const name of fs.readdirSync(path.join(app,'.updates')).filter(n=>n.startsWith('job-'))){const job=path.join(app,'.updates',name);for(const file of fs.readdirSync(job).filter(n=>/\.log$|status\.json$/.test(n)))console.error(file,fs.readFileSync(path.join(job,file),'utf8'));}throw error;}
 finally{helper.kill();cleanup(app);}
}
(async()=>{await run('success',0);await run('startup-failure',1);})().catch(e=>{console.error(e);process.exitCode=1});
