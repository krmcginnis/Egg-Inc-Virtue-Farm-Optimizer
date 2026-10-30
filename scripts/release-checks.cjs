'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const suites=require('./release-suites.json'),groups=Object.keys(suites.groups);
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function fingerprint(root){
 const files=[];
 function walk(dir){for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const name=dir+'/'+entry.name;if(entry.isDirectory()&&entry.name!=='__pycache__')walk(name);else if(entry.isFile())files.push(name);}}
 for(const dir of ['src','scripts','tests','assets'])if(fs.existsSync(path.join(root,dir)))walk(dir);
 for(const name of ['package.json','package-lock.json','index.html','style.css','session.js','Local-Helper.ps1','Update-Core.ps1','Update-App.ps1','Start-Virtue-Optimizer.cmd','.github/workflows/release.yml'])if(fs.existsSync(path.join(root,name)))files.push(name);
 const digest=crypto.createHash('sha256');digest.update(JSON.stringify({node:process.version,platform:process.platform,arch:process.arch,chrome:process.env.CHROME_EXECUTABLE||'system-chrome'}));
 for(const name of files.sort()){
  let bytes=fs.readFileSync(path.join(root,name));
  // Version labels and release prose do not change the tested implementation.
  // Preflight always rebuilds and verifies the current version/package again.
  if(['package.json','package-lock.json'].includes(name)){const data=JSON.parse(bytes);delete data.version;if(data.packages?.[''])delete data.packages[''].version;bytes=Buffer.from(JSON.stringify(data));}
  if(name==='index.html')bytes=Buffer.from(bytes.toString().replace(/(<title>Egg Inc\. Virtue Farm Optimizer )[^<]+/,'$1VERSION').replace(/(<span class="version">)[^<]+/,'$1VERSION').replace(/AUDIT-v[0-9.]+\.md/g,'AUDIT-vVERSION.md'));
  digest.update(name+'\0');digest.update(bytes);digest.update('\0');
 }
 return digest.digest('hex');
}
function runGroup(root,group,{reuse=false,ci=false,execute,quiet=false}={}){
 const log=quiet?()=>{}:console.log;
 if(!groups.includes(group))throw Error('Unknown release check group: '+group);
 if(reuse&&(ci||process.env.GITHUB_ACTIONS==='true'))throw Error('CI must run every check; local cache reuse is forbidden.');
 const key=fingerprint(root),file=path.join(root,'tmp','release-cache',key,group+'.json'),list=suites.groups[group];
 if(reuse&&fs.existsSync(file)){
  let old;try{old=JSON.parse(fs.readFileSync(file));}catch{}
  if(old?.passed===true&&old.fingerprint===key&&JSON.stringify(old.suites?.map(x=>x.suite))===JSON.stringify(list)&&old.suites.every(x=>x.passed)){const report={...old,reused:true};const output=path.join(root,'tmp','release-checks-'+group+'.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');log('REUSE '+group+': '+list.length+' unchanged local checks.');return report;}
 }
 const sourceCommit=process.env.GITHUB_SHA||cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const report={schema:1,group,sourceCommit,fingerprint:key,platform:process.platform,node:process.version,reused:false,passed:false,startedAt:new Date().toISOString(),suites:[]};
 const candidate=path.join(root,'tmp','release-candidate.json');if(fs.existsSync(candidate))report.candidate=JSON.parse(fs.readFileSync(candidate));
 const output=path.join(root,'tmp','release-checks-'+group+'.json');fs.mkdirSync(path.dirname(output),{recursive:true});
 const run=execute||((suite)=>cp.spawnSync(process.execPath,[suite],{cwd:root,stdio:'inherit',timeout:180000}));
 try{
  for(const suite of list){const started=Date.now();log('RUN '+suite);const result=run(suite);report.suites.push({suite,passed:result.status===0,seconds:(Date.now()-started)/1000});if(result.status!==0)throw Error('Release check failed: '+suite+(result.error?' ('+result.error.message+')':''));}
  report.passed=true;
 }finally{report.finishedAt=new Date().toISOString();report.seconds=report.suites.reduce((n,s)=>n+s.seconds,0);fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');if(!report.passed&&fs.existsSync(file))fs.unlinkSync(file);if(report.passed&&!ci){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');}}
 log('PASS release group '+group+': '+report.suites.length+' checks ('+report.seconds.toFixed(1)+'s).');return report;
}
function preflight(root){
 const run=(cmd,args)=>{const r=cp.spawnSync(cmd,args,{cwd:root,stdio:'inherit',env:{...process.env,PYTHONUTF8:'1',RELEASE_REPOSITORY:process.env.RELEASE_REPOSITORY||'krmcginnis/Egg-Inc-Virtue-Farm-Optimizer'},shell:process.platform==='win32'});if(r.status!==0)throw Error('Preflight failed: '+cmd+' '+args.join(' '));};
 const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json')));delete lock.version;if(lock.packages?.[''])delete lock.packages[''].version;
 const key=hash(JSON.stringify(lock)),stamp=path.join(root,'tmp','release-dependencies.json');
 if(!fs.existsSync(path.join(root,'node_modules'))||!fs.existsSync(stamp)||JSON.parse(fs.readFileSync(stamp)).key!==key){run('npm',['ci']);fs.mkdirSync(path.dirname(stamp),{recursive:true});fs.writeFileSync(stamp,JSON.stringify({key}));}
 run('npm',['run','build']);run(process.platform==='win32'?'python':'python3',['scripts/package.py']);run(process.platform==='win32'?'python':'python3',['scripts/release-verify.py','--candidate']);
}
async function main(){
 const root=path.resolve(__dirname,'..'),args=process.argv.slice(2);if(args.includes('--preflight')){preflight(root);return;}
 const at=args.indexOf('--group'),chosen=at>=0?[args[at+1]]:groups.filter(g=>g!=='native'||process.platform==='win32');
 if(args.includes('--local'))preflight(root);
 for(const group of chosen)runGroup(root,group,{reuse:args.includes('--reuse'),ci:args.includes('--ci')});
}
module.exports={fingerprint,runGroup,preflight};
if(require.main===module)main().catch(e=>{console.error(e.stack);process.exitCode=1});
