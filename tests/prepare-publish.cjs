'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process'),{prepare,safePath}=require('../scripts/prepare-publish.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'virtue-publish-test-'));
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
try{
 git('init','-b','main');git('config','user.name','Publish test');git('config','user.email','publish-test@example.invalid');git('remote','add','origin','https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer.git');
 fs.mkdirSync(path.join(root,'src'));fs.mkdirSync(path.join(root,'assets'));
 fs.writeFileSync(path.join(root,'package.json'),'{}');fs.writeFileSync(path.join(root,'src/change.cjs'),'old');fs.writeFileSync(path.join(root,'app.js'),'generated');
 git('add','package.json','src/change.cjs','app.js');git('commit','-m','Baseline');const base=git('rev-parse','HEAD').trim();git('update-ref','refs/remotes/origin/main',base);
 fs.writeFileSync(path.join(root,'src/change.cjs'),'staged');git('add','src/change.cjs');fs.writeFileSync(path.join(root,'src/change.cjs'),'unfinished local draft');
 fs.writeFileSync(path.join(root,'virtue-farm-test.json'),'private local farm');const p=prepare(root);assert.equal(p.baseCommit,base);assert.equal(p.entries.length,1);assert.equal(p.entries[0].content,'staged');assert.equal(fs.readFileSync(path.join(root,'src/change.cjs'),'utf8'),'unfinished local draft');
 git('add','virtue-farm-test.json');assert.throws(()=>prepare(root),/private or unsupported/);git('reset','--','virtue-farm-test.json');
 git('rm','--cached','app.js');assert.ok(prepare(root).entries.some(e=>e.path==='app.js'&&e.sha===null));assert.ok(fs.existsSync(path.join(root,'app.js')));
 fs.writeFileSync(path.join(root,'assets/test.png'),Buffer.from([137,80,78,71,0,255]));git('add','assets/test.png');assert.equal(prepare(root).entries.find(e=>e.path==='assets/test.png').encoding,'base64');
 fs.writeFileSync(path.join(root,'src/change.cjs'),'EI'+'1234567890123456');git('add','src/change.cjs');assert.throws(()=>prepare(root),/account identifier/);git('restore','--staged','src/change.cjs');
 git('switch','-c','feature');assert.throws(()=>prepare(root),/main only/);
 for(const file of ['update-config.json','.env','saved-farm.json','src/workbook-farm.json','tmp/publish-plan.json','app.js','assets/../../private.json'])assert.equal(safePath(file),false,file);
 console.log('PASS staged-only public changes, retained private/draft files, binary artwork, generated-file removal and branch/account/path guards.');
}finally{fs.rmSync(root,{recursive:true,force:true});}
