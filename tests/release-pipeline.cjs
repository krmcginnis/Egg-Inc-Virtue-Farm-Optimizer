'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),manifest=require('../scripts/release-suites.json'),checks=require('../scripts/release-checks.cjs');
const required=['release-state','prepare-publish','subscription-import','research-sale-plans','route-solver','automatic-routes','shift-plans','search-efficiency','search-quality','investment-search','research-breakpoints','timezones','shift-rates','sleep-schedule','silo-comfort','sleep-search-quality','earnings-incumbents','earnings-first-research','purchase-economics','search-refinements','plan-progress','run-shifts','research-cleanup','research-investments','date-time','plan-continuation','purchase-decisions','quick-guide-order','cooperative-refinement','deep-search-dom','run-shifts-dom','time-display-dom','plan-choices-dom','search-pool','evaluated-search','search-optimality','search-optimality-dom','solver-worker','update-core','update-launch'].map(s=>'tests/'+s+'.cjs');
const all=Object.values(manifest.groups).flat();assert.equal(new Set(all).size,all.length);for(const suite of required)assert.ok(all.includes(suite),'missing existing check '+suite);
const workflow=fs.readFileSync(root+'/.github/workflows/release.yml','utf8');assert.match(workflow,/group: \[model, ui, native\]/);assert.match(workflow,/needs: \[prepare, checks\]/);assert.match(workflow,/needs\.checks\.result == 'success'/);assert.match(workflow,/release-acceptance.py --gate/);assert.match(workflow,/release-acceptance.py --accept/);assert.match(workflow,/release-acceptance.py --verify-only/);assert.doesNotMatch(workflow,/continue-on-error: true|--reuse/);
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'release-cache-test-')),oldSHA=process.env.GITHUB_SHA,oldActions=process.env.GITHUB_ACTIONS;
try{
 for(const dir of ['src','scripts','tests','assets'])fs.mkdirSync(path.join(fixture,dir));
 fs.writeFileSync(path.join(fixture,'src/model.cjs'),'original');fs.writeFileSync(path.join(fixture,'package.json'),JSON.stringify({version:'1.2.4',devDependencies:{example:'1.0.0'}}));fs.writeFileSync(path.join(fixture,'package-lock.json'),JSON.stringify({version:'1.2.4',packages:{'':{version:'1.2.4',devDependencies:{example:'1.0.0'}}}}));
 process.env.GITHUB_SHA='a'.repeat(40);delete process.env.GITHUB_ACTIONS;let calls=0;
 const first=checks.runGroup(fixture,'model',{quiet:true,execute:()=>{calls++;return {status:0};}});assert.ok(first.passed);const initial=calls;
 const reused=checks.runGroup(fixture,'model',{reuse:true,quiet:true,execute:()=>{throw Error('cached checks reran');}});assert.equal(reused.reused,true);assert.equal(calls,initial);
 fs.writeFileSync(path.join(fixture,'package.json'),JSON.stringify({version:'1.2.5',devDependencies:{example:'1.0.0'}}));assert.equal(checks.fingerprint(fixture),first.fingerprint,'version-only metadata reuses implementation checks');
 fs.writeFileSync(path.join(fixture,'src/model.cjs'),'changed');assert.notEqual(checks.fingerprint(fixture),first.fingerprint);checks.runGroup(fixture,'model',{reuse:true,quiet:true,execute:()=>{calls++;return {status:0};}});assert.ok(calls>initial);
 assert.throws(()=>checks.runGroup(fixture,'model',{reuse:true,ci:true}),/forbidden/);process.env.GITHUB_ACTIONS='true';assert.throws(()=>checks.runGroup(fixture,'model',{reuse:true}),/forbidden/);delete process.env.GITHUB_ACTIONS;
 assert.throws(()=>checks.runGroup(fixture,'model',{quiet:true,execute:()=>({status:1})}),/failed/);let reran=0;checks.runGroup(fixture,'model',{reuse:true,quiet:true,execute:()=>{reran++;return {status:0};}});assert.ok(reran>0,'a fresh failure invalidates a prior passed cache');
 const depKey=checks.fingerprint(fixture);fs.writeFileSync(path.join(fixture,'package-lock.json'),JSON.stringify({version:'1.2.5',packages:{'':{version:'1.2.5',devDependencies:{example:'2.0.0'}}}}));assert.notEqual(checks.fingerprint(fixture),depKey,'dependency changes invalidate cached checks');
 const {writeback}=require('../scripts/release-record.cjs'),proof=path.join(fixture,'tmp/release-validation.json');fs.writeFileSync(proof,JSON.stringify({status:'accepted-public-release',sourceCommit:'a'.repeat(40),candidate:{version:'1.2.4'}}));
 const commands=[],git=args=>{commands.push(args);if(args[0]==='ls-remote')return 'a'.repeat(40)+'\trefs/heads/main';if(args[0]==='diff')return 'VALIDATION.json\nAUDIT-v1.2.4.md\n';return '';};
 assert.equal(writeback(fixture,'a'.repeat(40),git),true);assert.deepEqual(commands.find(a=>a[0]==='add'),['add','--','VALIDATION.json','AUDIT-v1.2.4.md']);assert.deepEqual(commands.at(-1),['push','origin','HEAD:main']);
 assert.equal(writeback(fixture,'a'.repeat(40),args=>{assert.equal(args[0],'ls-remote');return 'b'.repeat(40)+'\trefs/heads/main';}),false,'advanced main is never overwritten');
 assert.throws(()=>writeback(fixture,'b'.repeat(40),git),/accepted public/);
}finally{if(oldActions===undefined)delete process.env.GITHUB_ACTIONS;else process.env.GITHUB_ACTIONS=oldActions;if(oldSHA===undefined)delete process.env.GITHUB_SHA;else process.env.GITHUB_SHA=oldSHA;fs.rmSync(fixture,{recursive:true,force:true});}
const python=process.platform==='win32'?'python':'python3';
const result=cp.spawnSync(python,['-c',String.raw`
import runpy,tempfile,json,zipfile,hashlib,copy,sys
from pathlib import Path
root=Path(sys.argv[1]);verify=runpy.run_path(str(root/'scripts/release-verify.py'));acceptance=runpy.run_path(str(root/'scripts/release-acceptance.py'))
def rejects(call):
 try:call()
 except (AssertionError,FileNotFoundError,KeyError,zipfile.BadZipFile):return
 raise AssertionError('Invalid evidence/package was accepted')
with tempfile.TemporaryDirectory() as temp:
 r=Path(temp);(r/'tmp').mkdir();(r/'scripts').mkdir();manifest=json.loads((root/'scripts/release-suites.json').read_text());(r/'scripts/release-suites.json').write_text(json.dumps(manifest))
 content={'package.json':b'{"version":"1.2.4"}','index.html':b'<title>Egg Inc. Virtue Farm Optimizer 1.2.4</title>','app.js':b'compiled app','worker-source.js':b'compiled worker','AUDIT-v1.2.4.md':b'audit'}
 digest=lambda b:hashlib.sha256(b).hexdigest()
 fm={'schema':1,'app':verify['APP'],'version':'1.2.4','updater':1,'files':[{'path':k,'size':len(v),'sha256':digest(v)} for k,v in content.items()]}
 def archive(extra=None):
  p=r/'candidate.zip'
  with zipfile.ZipFile(p,'w') as z:
   for k,v in content.items():z.writestr(verify['FOLDER']+'/'+k,v)
   z.writestr(verify['FOLDER']+'/Update-Files.json',json.dumps(fm));z.writestr(verify['FOLDER']+'/update-config.json',json.dumps({'repository':verify['REPOSITORY']}))
   if extra:z.writestr(extra,b'private')
  b=p.read_bytes();return p,{'schema':1,'app':verify['APP'],'version':'1.2.4','archive':verify['FOLDER']+'.zip','size':len(b),'sha256':digest(b)}
 p,m=archive();candidate=verify['verify_archive'](p,m,verify['REPOSITORY'],r/'extracted');candidate['sourceCommit']='a'*40
 assert candidate['runtimeFileHashes']==5 and (r/'extracted'/verify['FOLDER']/'app.js').read_bytes()==b'compiled app'
 wrong=copy.deepcopy(m);wrong['sha256']='0'*64;rejects(lambda:verify['verify_archive'](p,wrong,verify['REPOSITORY']))
 for extra in [verify['FOLDER']+'/private.json',verify['FOLDER']+'/../escape']:
  p,m=archive(extra);rejects(lambda:verify['verify_archive'](p,m,verify['REPOSITORY']))
 (r/'tmp/release-candidate.json').write_text(json.dumps(candidate))
 def reports():
  for group,items in manifest['groups'].items():(r/('tmp/release-checks-'+group+'.json')).write_text(json.dumps({'group':group,'sourceCommit':'a'*40,'platform':'win32','passed':True,'reused':False,'candidate':candidate,'fingerprint':'fingerprint','seconds':1,'suites':[{'suite':s,'passed':True} for s in items]}))
 reports();proof=acceptance['gate'](r,'a'*40);assert proof['requiredSuitesPassed']==42
 f=r/'tmp/release-checks-ui.json';bad=json.loads(f.read_text());bad['suites'].pop();f.write_text(json.dumps(bad));rejects(lambda:acceptance['gate'](r,'a'*40));reports()
 bad=json.loads(f.read_text());bad['reused']=True;f.write_text(json.dumps(bad));rejects(lambda:acceptance['gate'](r,'a'*40));reports()
 bad=json.loads(f.read_text());bad['candidate']={**candidate,'archiveSha256':'0'*64};f.write_text(json.dumps(bad));rejects(lambda:acceptance['gate'](r,'a'*40));reports()
 public={**candidate,'anonymous':True};browser={'passed':True,'sourceCommit':'a'*40,'appSha256':candidate['appSha256'],'workerSha256':candidate['workerSha256']}
 accepted=acceptance['accept'](r,proof,public,browser);assert accepted['published']
 rejects(lambda:acceptance['accept'](r,proof,{**public,'sourceCommit':'b'*40},browser));rejects(lambda:acceptance['accept'](r,proof,public,{**browser,'passed':False}))
 (r/'VALIDATION.json').write_text(json.dumps({'version':'1.2.4','limitations':[]}));(r/'AUDIT-v1.2.4.md').write_text('# Audit\n\nPrepublication review.\n');acceptance['record'](r,accepted,123,verify['REPOSITORY']);v=json.loads((r/'VALIDATION.json').read_text());assert v['published'] and v['windowsRelease']['requiredSuitesPassed']==42
print('PASS closed archive/digest/extraction guards and source/build-bound full Windows acceptance; missing/reused/foreign results rejected.')
`,root],{encoding:'utf8'});assert.equal(result.status,0,result.stdout+result.stderr);process.stdout.write(result.stdout);
console.log('PASS parallel release pipeline: all existing checks retained, independent groups and mandatory gate, implementation/dependency cache invalidation, failed-cache eviction and CI reuse rejection.');
