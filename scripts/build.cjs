// Developer rebuild only; users launch index.html or the CMD file without Node.
const fs=require('fs'),esbuild=require('esbuild'),path=require('path');process.chdir(path.resolve(__dirname,'..'));
const version=require('../package.json').version;
const html=fs.readFileSync('index.html','utf8').replace(/(<title>Egg Inc\. Virtue Farm Optimizer )[^<]+/, '$1'+version).replace(/(<span class="version">)[^<]+/, '$1'+version+' · PC EDITION').replace(/href="AUDIT-v[^"]+\.md"/g,'href="AUDIT-v'+version+'.md"');
fs.writeFileSync('index.html',html);
const comparison=fs.readFileSync('Wasmegg-Comparison.md','utf8').replace(/(\]\()AUDIT-v[^)]+\.md(\))/g,'$1AUDIT-v'+version+'.md$2');
fs.writeFileSync('Wasmegg-Comparison.md',comparison);
(async()=>{const worker=await esbuild.build({absWorkingDir:process.cwd(),entryPoints:['src/worker.cjs'],bundle:true,write:false,platform:'browser',format:'iife',target:'es2020',minify:true});fs.writeFileSync('worker-source.js','globalThis.VIRTUE_WORKER_SOURCE='+JSON.stringify(worker.outputFiles[0].text)+';\n');await esbuild.build({absWorkingDir:process.cwd(),entryPoints:['src/app.cjs'],bundle:true,outfile:'app.js',platform:'browser',format:'iife',target:'es2020',minify:true});console.log('Built offline app.');})().catch(e=>{console.error(e);process.exit(1)});
