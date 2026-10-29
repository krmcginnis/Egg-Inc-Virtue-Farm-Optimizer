'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM,VirtualConsole}=require('jsdom'),path=require('path');
const root=path.resolve(__dirname,'..'),errors=[],console=new VirtualConsole();
console.on('jsdomError',e=>{if(!/Not implemented: (navigation|HTMLCanvasElement)/.test(e.message))errors.push(e.message);});
const dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:console}),w=dom.window,workers=[];
w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
w.URL.createObjectURL=()=> 'blob:synthetic-worker';w.URL.revokeObjectURL=()=>{};
w.fetch=async()=>({ok:true,json:async()=>({version:require('../package.json').version,configured:false})});
w.Worker=class{constructor(){this.messages=[];workers.push(this);}postMessage(data){this.messages.push(data);}terminate(){this.stopped=true;}};
(async()=>{try{
 w.eval(fs.readFileSync(root+'/worker-source.js','utf8'));w.eval(fs.readFileSync(root+'/app.js','utf8'));
 await w.VirtueApp.loadFile({text:async()=>JSON.stringify(require('./research-sale-plans.cjs').fixture())});
 w.document.querySelector('[data-tab="planning"]').click();w.document.getElementById('optimize').click();
 assert.equal(workers.length,4,'new searches request four workers independently of reported CPU count');
 const requests=workers.map(worker=>worker.messages[0]);
 for(const request of requests){assert.equal(request.options.maxMs,180000);assert.equal(request.options.deepSearch,true);assert.equal(request.options.width,32);}
 assert.equal(new Set(requests.map(x=>x.options.absoluteDeadline)).size,1,'workers share one deadline');
 assert.deepEqual(requests.map(x=>x.options.portfolioVariant),[0,1,2,3]);
 assert.match(w.document.getElementById('search-description').textContent,/four workers.*three-minute/);
 w.document.getElementById('stop').click();assert.ok(workers.every(worker=>worker.messages.some(x=>x.cancel)));
 for(const worker of workers)worker.onmessage({data:{type:'error',error:'Synthetic stopped search'}});
 assert.ok(workers.every(worker=>worker.stopped));assert.deepEqual(errors,[]);
 process.stdout.write('PASS compiled Deep app defaults: four worker requests, 180-second common deadline, width 32, enabled Deep profile, distinct portfolios, and stop propagation.\n');
}finally{w.close();}})().catch(e=>{process.stderr.write(e.stack+'\n');process.exitCode=1;});
