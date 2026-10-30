'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
function writeback(root,source,git=(args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']})){
 const proof=JSON.parse(fs.readFileSync(path.join(root,'tmp/release-validation.json')));
 if(proof.status!=='accepted-public-release'||proof.sourceCommit!==source)throw Error('Only accepted public release evidence may be recorded.');
 if(git(['ls-remote','origin','refs/heads/main']).split(/\s/)[0]!==source){console.log('Main advanced; acceptance remains in the release-validation artifact. No source files overwritten.');return false;}
 const audit='AUDIT-v'+proof.candidate.version+'.md';
 git(['config','user.name','github-actions[bot]']);git(['config','user.email','41898282+github-actions[bot]@users.noreply.github.com']);
 git(['add','--','VALIDATION.json',audit]);
 const changed=git(['diff','--cached','--name-only']).trim().split('\n').filter(Boolean);
 if(changed.some(file=>!['VALIDATION.json',audit].includes(file)))throw Error('Unexpected staged file in acceptance record.');
 if(!changed.length)return true;
 git(['commit','-m','Record v'+proof.candidate.version+' automated release acceptance']);
 try{git(['push','origin','HEAD:main']);return true;}catch(error){console.log('Acceptance writeback could not fast-forward main; complete evidence remains in the release-validation artifact.');return false;}
}
module.exports={writeback};
if(require.main===module)try{writeback(path.resolve(__dirname,'..'),process.env.GITHUB_SHA);}catch(error){console.error(error.message);process.exitCode=1;}
