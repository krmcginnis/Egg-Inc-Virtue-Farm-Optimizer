'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const REPOSITORY='krmcginnis/Egg-Inc-Virtue-Farm-Optimizer';
function safePath(file){
 if(!file||file.split('/').some(p=>p==='..'||p.startsWith('.updates'))||/(?:^|\/)(?:node_modules|tmp|__pycache__)(?:\/|$)/.test(file))return false;
 if(/(?:customer|workbook|virtue-farm|saved-farm|backup|\.zip$|\.env|\.pem$|\.key$)/i.test(file))return false;
 if(['package.json','package-lock.json','VALIDATION.json','index.html','style.css','session.js','Start-Virtue-Optimizer.cmd','Local-Helper.ps1','Update-Core.ps1','Update-App.ps1','.gitignore','AGENTS.md'].includes(file))return true;
 if(/^(?:src|scripts|tests)\/[A-Za-z0-9_./-]+\.(?:cjs|js|ts|py|ps1|json|txt|md)$/.test(file))return !file.endsWith('/workbook-farm.json');
 if(/^\.github\/workflows\/[A-Za-z0-9_-]+\.yml$/.test(file))return true;
 if(/^assets\/[A-Za-z0-9_./-]+\.(?:png|webp|svg|json|txt)$/.test(file))return true;
 return /^[A-Za-z0-9_.-]+\.(?:md|txt)$/.test(file);
}
function prepare(root){
 const git=(args,encoding='utf8')=>execFileSync('git',args,{cwd:root,encoding,stdio:['ignore','pipe','pipe']});
 if(git(['symbolic-ref','--short','HEAD']).trim()!=='main')throw Error('Prepare publishing from main only.');
 const remote=git(['remote','get-url','origin']).trim();if(remote!=='https://github.com/'+REPOSITORY+'.git')throw Error('Origin must be the approved public app repository.');
 const base=git(['rev-parse','origin/main']).trim();if(git(['rev-parse','HEAD']).trim()!==base)throw Error('Fetch origin/main and reconcile local commits before preparing a connector publish.');
 const changes=git(['diff','--cached','--name-status','--no-renames','-z']).split('\0');
 const entries=[];
 for(let i=0;i<changes.length-1;i+=2){
  const status=changes[i],file=changes[i+1];if(!safePath(file)&&!(status==='D'&&['app.js','worker-source.js'].includes(file)))throw Error('Refusing a private or unsupported publish path: '+file);
  if(status==='D'){entries.push({path:file,mode:'100644',type:'blob',sha:null});continue;}
  if(!['A','M','T'].includes(status))throw Error('Unsupported staged change: '+status);
  const line=git(['ls-files','--stage','--',file]).trim(),match=/^(100644|100755) ([a-f0-9]{40}) 0\t/.exec(line);
  if(!match)throw Error('Only ordinary staged files may be published: '+file);
  const bytes=git(['cat-file','blob',match[2]],null),text=bytes.toString('utf8'),binary=bytes.includes(0)||!Buffer.from(text).equals(bytes);
  if(!binary&&/EI(?!0{16}\b)\d{16}\b/.test(text))throw Error('Refusing an account identifier in staged content: '+file);
  if(binary&&!file.startsWith('assets/'))throw Error('Only artwork assets may contain binary data: '+file);
  entries.push({path:file,mode:match[1],type:'blob',content:binary?bytes.toString('base64'):text,...(binary?{encoding:'base64'}:{})});
 }
 if(!entries.length)throw Error('Stage the intended changes explicitly before preparing a publish.');
 return {repository:REPOSITORY,branch:'main',baseCommit:base,baseTree:git(['rev-parse',base+'^{tree}']).trim(),entries};
}
module.exports={safePath,prepare};
if(require.main===module){try{const root=path.resolve(__dirname,'..'),plan=prepare(root),output=path.join(root,'tmp','publish-plan.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(plan),{mode:0o600});console.log('Prepared '+plan.entries.length+' reviewed paths in tmp/publish-plan.json. No remote changes made.');for(const entry of plan.entries)console.log((entry.sha===null?'Delete':'Write')+' '+entry.path);}catch(e){console.error(e.message);process.exitCode=1;}}
