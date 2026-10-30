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
 assert.equal(w.document.getElementById("wasmegg-sequence-description"),null);
 assert.doesNotMatch(w.document.querySelector('[data-page="planning"]')?.textContent||w.document.body.textContent,/Automatic Planning Details/);
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
 const old=require('./search-optimality.cjs').verificationFixture();
 old.result.search={parallel:{workers:2},adaptive:{jobs:36}};
 const before=workers.length;
 await w.VirtueApp.loadFile({text:async()=>JSON.stringify(old)},{planOnly:true});
 assert.equal(workers.length,before,'loading an old timeline does not start a search');
 assert.equal(w.VirtueApp.getResult().end,old.result.end);assert.equal(w.VirtueApp.getResult().search.parallel.workers,2);
 w.document.querySelector('[data-tab="planning"]').click();w.document.getElementById('optimize').click();
 const rerun=workers.slice(before);assert.equal(rerun.length,4);
 for(const worker of rerun){const posted=worker.messages[0];assert.equal(posted.options.deepSearch,true);assert.equal(posted.options.maxMs,180000);assert.equal(posted.options.incumbent.result.end,old.result.end);assert.notEqual(posted.options.legacySolver,true);}
 w.document.getElementById('stop').click();for(const worker of rerun)worker.onmessage({data:{type:'error',error:'Synthetic stopped rerun'}});
 const remaining=require('./plan-continuation.cjs').partialResearch();remaining.result.search={parallel:{workers:2},adaptive:{jobs:36}};
 await w.VirtueApp.loadFile({text:async()=>JSON.stringify({version:1,config:remaining.config,result:remaining.result,progress:remaining.progress})},{planOnly:true});
 const count=workers.length,reoptimize=w.document.getElementById('reoptimize-remaining');assert.ok(reoptimize&&!reoptimize.disabled);
 reoptimize.click();const resumed=workers.slice(count);assert.equal(resumed.length,4);
 for(const worker of resumed){const posted=worker.messages[0];assert.ok(posted.continuation);assert.equal(posted.options.deepSearch,true);assert.equal(posted.options.maxMs,180000);assert.equal(posted.options.width,32);assert.notEqual(posted.options.legacySolver,true);}
 w.document.getElementById('stop').click();for(const worker of resumed)worker.onmessage({data:{type:'error',error:'Synthetic stopped continuation'}});
 assert.deepEqual(errors,[]);
 process.stdout.write('PASS compiled Deep app defaults and saved plans: loading preserves the timeline, rerun/reoptimization use four workers and the current 180-second Deep profile, retain compatible seeds, and propagate stop.\n');
}finally{w.close();}})().catch(e=>{process.stderr.write(e.stack+'\n');process.exitCode=1;});
