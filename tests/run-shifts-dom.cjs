'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM,VirtualConsole}=require('jsdom');
const Run=require('../src/run-shifts.cjs'),A=require('../src/api.cjs'),S=require('../src/simulator.cjs'),C=require('../src/plan-continuation.cjs');
const root=path.resolve(__dirname,'..'),eid='EI0000000000000000',other='EI'+'1'.repeat(16),store=new Map();
let count=62,claimed=32,reset=2,clock=Date.now()/1000-30;
function backup(){return {backup:{userName:'SyntheticTester',settings:{lastBackupTime:clock},game:{permitLevel:1,soulEggsD:1e30},virtue:{shiftCount:count,resets:reset,eovEarned:Array(5).fill(claimed),eggsDelivered:Array(5).fill(S.D.te[claimed-1])},farms:[{eggType:50,habs:[0,19,19,19],vehicles:[0],trainLength:[1],unclaimedCash:1e18}]}};}
function open(){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Not implemented: (navigation|HTMLCanvasElement)/.test(e.message))errors.push(e.message);});
 const dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window;
 w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 for(const [key,value] of store)w.localStorage.setItem(key,value);
 w.fetch=async(url,options)=>url==='/api/backup'?{ok:true,text:async()=>A.base64(A.Resp.encode(A.Resp.create(backup())).finish())}:{ok:true,json:async()=>({configured:false,available:false,version:require('../package.json').version})};
 w.VIRTUE_PROXY_TOKEN='synthetic-run-shifts';w.addEventListener('error',e=>errors.push(e.error?.stack||e.message));
 w.eval(fs.readFileSync(root+'/worker-source.js','utf8'));w.eval(fs.readFileSync(root+'/app.js','utf8'));
 const $=id=>w.document.getElementById(id),app=w.VirtueApp;
 const input=(id,value)=>{$(id).value=String(value);$(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
 async function sync(id=eid){input('eid',id);$('load-account').click();for(let i=0;$('load-account').disabled&&i<1000;i++)await new Promise(r=>setTimeout(r,5));assert.equal($('load-account').disabled,false);}
 function close(){for(let i=0;i<w.localStorage.length;i++){const k=w.localStorage.key(i);store.set(k,w.localStorage.getItem(k));}assert.deepEqual(errors,[]);dom.window.close();}
 return {w,$,app,input,sync,close};
}
(async()=>{
 let ui=open();let {$,app,input}=ui;
 assert.equal($('import-help'),null);assert.equal($('eid').getAttribute('aria-describedby'),null);
 await ui.sync();assert.equal($('run-shifts-used').value,'','a first mid-run import cannot infer shifts used');
 input('run-shifts-used',6);assert.equal(app.refresh(),true);assert.equal(app.getConfig().plan.maxShifts,6);assert.equal(app.getConfig().runShifts.startShiftCount,56);assert.match($('run-shift-summary').textContent,/6 used.*6 remaining of 12/);
 count=65;clock+=1;await ui.sync();assert.equal(app.getConfig().plan.maxShifts,3);assert.equal($('run-shifts-used').value,'9');
 input('maxShifts',4);app.refresh();assert.equal(app.getConfig().runShifts.totalShiftBudget,13);
 input('run-shift-limit',12);app.refresh();assert.equal(app.getConfig().plan.maxShifts,3);
 $('clear-data').click();assert.equal(app.getResult(),null);assert.equal($('run-shifts-used').value,'');await ui.sync();assert.equal(app.getConfig().plan.maxShifts,3,'Start from Scratch retains the account anchor');
 ui.close();ui=open();({$,app,input}=ui);await ui.sync();assert.equal(app.getConfig().plan.maxShifts,3,'restart plus account load restores allowance without a farm file');
 const portable=app.getConfig();assert.ok(!JSON.stringify(portable).includes(eid));
 await ui.sync(other);assert.equal($('run-shifts-used').value,'','different account never borrows the anchor');assert.equal(app.getConfig().plan.maxShifts,12);
 await ui.sync(eid);assert.equal(app.getConfig().plan.maxShifts,3);
 const before=JSON.stringify(app.getConfig());clock-=10;await ui.sync();assert.match($('notice').textContent,/older than the last run shift check/);assert.equal(JSON.stringify(app.getConfig()),before);
 clock+=11;claimed++;await ui.sync();assert.equal($('run-shifts-used').value,'','changed claimed TE needs a new run anchor');assert.equal(app.getConfig().plan.maxShifts,12);
 input('run-shifts-used',0);app.refresh();reset++;count=0;clock++;await ui.sync();assert.equal(app.getConfig().runShifts.startShiftCount,0);assert.equal(app.getConfig().plan.maxShifts,12);
 const load=raw=>app.loadFile({text:async()=>JSON.stringify(raw)});
 await load(portable);assert.equal(app.getConfig().runShifts.startShiftCount,56,'saved farm carries its anchor');
 input('run-shifts-used',66);assert.equal(app.refresh(),false);assert.equal($('run-shifts-used').getAttribute('aria-invalid'),'true');
 // Legacy remaining plans carry enough metadata to recover the true baseline.
 const request=require('./plan-continuation.cjs').partialResearch();request.config.plan.continuation={version:1,totalShiftBudget:12,consumedShifts:6,remainingShiftBudget:6};
 await load({version:1,config:request.config,result:request.result});assert.equal(app.getConfig().runShifts.startShiftCount,request.config.farm.shiftCount-6);assert.equal(app.getConfig().plan.maxShifts,6);
 const checkedFarm=structuredClone(request.progress.snapshot);await app.loadFile({text:async()=>JSON.stringify(checkedFarm)},{trackOnly:true});assert.equal(app.getConfig().plan.maxShifts,6,'checking a farm file retains the run anchor');
 const tracked=app.getConfig(),prepared=C.prepare({config:tracked,result:request.result,progress:{...request.progress,snapshot:{...request.progress.snapshot,runShifts:tracked.runShifts}},start:Date.now()/1000});
 assert.equal(prepared.totalShiftBudget,12);assert.equal(prepared.consumedShifts,6);assert.equal(prepared.remainingShiftBudget,6);
 const shifted=require('./plan-continuation.cjs').automaticArtifacts();shifted.config.runShifts=Run.create(shifted.config,6,12);
 const continued=C.prepare(shifted);assert.equal(continued.consumedShifts,7);assert.equal(continued.remainingShiftBudget,5);assert.equal(continued.config.runShifts.startShiftCount,shifted.config.farm.shiftCount-6);
 // Exercise the generated worker as well as the UI-to-worker request boundary.
 const workerRequest=require('./plan-continuation.cjs').partialResearch();workerRequest.config.runShifts=Run.create(workerRequest.config,6,12);
 Object.assign(workerRequest.config.plan,{maxShifts:6,autoSequence:false,strategy:'user'});
 let completed,failure;const workerContext={setTimeout,clearTimeout,structuredClone,performance,TextEncoder,TextDecoder,URL,URLSearchParams,atob,btoa,crypto:require('node:crypto').webcrypto,postMessage(data){if(data.type==='continuation')completed=data.continuation;if(data.type==='error')failure=data.error;}};
 workerContext.self=workerContext;vm.createContext(workerContext);vm.runInContext(ui.w.VIRTUE_WORKER_SOURCE,workerContext);await workerContext.onmessage({data:{continuation:workerRequest,options:{maxMs:500,width:4}}});
 assert.equal(failure,undefined);assert.equal(completed.consumedShifts,6);assert.equal(completed.remainingShiftBudget,6);assert.ok(completed.result.switches<=6);C.verified(completed.config,completed.result);
 // A fresh search also passes its remembered allowance to the actual worker.
 let posted;ui.w.URL.createObjectURL=()=> 'blob:test';ui.w.URL.revokeObjectURL=()=>{};ui.w.Worker=class{postMessage(data){if(data.config)posted=data.config;}terminate(){}};
 input('strategy','wasmegg');app.refresh();app.tab('planning');$('optimize').click();assert.equal(posted.plan.autoSequence,true);assert.equal(posted.plan.maxShifts,6);assert.equal(posted.runShifts.startShiftCount,tracked.runShifts.startShiftCount);$('clear-data').click();
 count=request.config.farm.shiftCount;claimed=request.config.farm.claimed[0];clock=Date.now()/1000;await ui.sync();assert.equal(app.getConfig().runShifts.startShiftCount,count-6,'a loaded plan seeds account tracking even after clearing its farm');assert.equal(app.getConfig().plan.maxShifts,6);
 ui.close();console.log('PASS built app run tracking: first mid-run entry, automatic updates, editable allowance, reset/restart persistence, account isolation, stale/new-run handling, portable farms, legacy continuation recovery, validation, worker request, and removed sidebar hint.');
})().catch(e=>{console.error(String(e.stack).split('\n').filter(line=>line.length<500).join('\n'));process.exitCode=1;});
