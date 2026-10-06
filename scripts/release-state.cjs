'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
function parseVersion(version){
 if(typeof version!=='string'||!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version))throw Error('A stable major.minor.patch version is required.');
 const parts=version.split('.').map(Number);if(parts.some(n=>!Number.isSafeInteger(n)))throw Error('Version component is too large.');return parts;
}
function compare(a,b){const x=parseVersion(a),y=parseVersion(b);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i]?1:-1;return 0;}
function releaseDecision({version,previousVersion=null,latestVersion=null,existing=false,event,refType,refName,verifyOnly=false}){
 parseVersion(version);
 if(refType==='tag'&&refName!=='v'+version)throw Error('Release tag must match package.json version.');
 if(verifyOnly)return {build:true,publish:false,reason:'Verification only; no release will be created.'};
 if(event==='push'&&refType==='branch'){
  if(refName!=='main')return {build:false,publish:false,reason:'Only main publishes automatic releases.'};
  if(previousVersion&&compare(version,previousVersion)===0)return {build:false,publish:false,reason:'App version unchanged; no release needed.'};
  if(previousVersion&&compare(version,previousVersion)<0)throw Error('Automatic release version must increase.');
 }
 if(event!=='push'&&event!=='workflow_dispatch')throw Error('Unsupported release event.');
 if(existing){
  if(event==='push')return {build:false,publish:false,reason:'This version already has a release; nothing is overwritten.'};
  throw Error('This version already has a release. Increment the version before publishing.');
 }
 if(latestVersion&&compare(version,latestVersion)<=0)throw Error('New release must be newer than the latest public release.');
 return {build:true,publish:true,reason:'New version will be published after Windows validation.'};
}
async function readRelease(repository,route){
 const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'virtue-optimizer-release'};
 if(process.env.GH_TOKEN)headers.Authorization='Bearer '+process.env.GH_TOKEN;
 const response=await fetch('https://api.github.com/repos/'+repository+'/releases/'+route,{headers,signal:AbortSignal.timeout(30000)});
 if(response.status===404)return null;
 if(!response.ok)throw Error('GitHub release lookup failed (HTTP '+response.status+').');
 return response.json();
}
async function main(){
 const root=path.resolve(__dirname,'..'),repository=process.env.RELEASE_REPOSITORY;
 if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository||''))throw Error('A valid release repository is required.');
 const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;parseVersion(version);
 const event=process.env.RELEASE_EVENT,refType=process.env.RELEASE_REF_TYPE,refName=process.env.RELEASE_REF_NAME,verifyOnly=process.env.RELEASE_VERIFY_ONLY==='true';
 let previousVersion=null;
 if(event==='push'&&refType==='branch'){
  const before=process.env.RELEASE_BEFORE;
  if(!/^[a-f0-9]{40}$/i.test(before||''))throw Error('The previous commit is required for automatic release detection.');
  if(!/^0+$/.test(before))previousVersion=JSON.parse(execFileSync('git',['show',before+':package.json'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']})).version;
 }
 // Check intent before any network request; same-version source changes are a no-op.
 const initial=releaseDecision({version,previousVersion,event,refType,refName,verifyOnly});
 let decision=initial;
 if(initial.publish){
  const [existing,latest]=await Promise.all([readRelease(repository,'tags/v'+version),readRelease(repository,'latest')]);
  decision=releaseDecision({version,previousVersion,event,refType,refName,verifyOnly,existing:!!existing,latestVersion:latest?latest.tag_name.replace(/^v/,''):null});
 }
 console.log(decision.reason);
 if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,'build='+decision.build+'\npublish='+decision.publish+'\n');
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'### Release v'+version+'\n\n'+decision.reason+'\n');
}
module.exports={parseVersion,compare,releaseDecision};
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});
