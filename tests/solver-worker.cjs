'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const O=require('../src/optimizer.cjs'),S=require('../src/simulator.cjs'),{fixture}=require('./research-sale-plans.cjs');
async function run(){
 const raw=fixture();let result,error;
 // A worker's self IS its global object. Supply browser APIs, without require
 // or Node modules, and execute the actual generated release bundle.
 const context={setTimeout,clearTimeout,console,structuredClone,performance,TextEncoder,TextDecoder,URL,URLSearchParams,atob,btoa,
  crypto:require('node:crypto').webcrypto,postMessage(message){if(message.type==='result')result=message.result;if(message.type==='error')error=message.error;}};
 context.self=context;vm.createContext(context);
 vm.runInContext(fs.readFileSync(require.resolve('../worker-source.js'),'utf8'),context);
 vm.runInContext(context.VIRTUE_WORKER_SOURCE,context);
 await context.onmessage({data:{config:raw,options:{maxMs:1500}}});
 assert.equal(error,undefined);assert.ok(result?.validatedReplay);assert.ok(result.search.checkpoints);
 for(const entry of result.shiftPlans){const verified=O.replay(raw,entry.plan.actions);assert.ok(S.reached(verified.s,verified.c));assert.equal(verified.s.t,entry.plan.end);}
 const previous=result;result=undefined;
 await context.onmessage({data:{config:raw,options:{maxMs:100,incumbent:{config:raw,result:previous}}}});
 assert.equal(error,undefined);assert.ok(result?.search.retainedPlans>0);
 for(const entry of previous.shiftPlans){const kept=result.shiftPlans.find(p=>p.switches===entry.switches);assert.ok(kept);assert.ok(kept.plan.seconds<=entry.plan.seconds);assert.equal(O.replay(raw,kept.plan.actions).s.t,kept.plan.end);}
 const comfort=fixture();Object.assign(comfort.farm,{virtue:'kindness',cash:1e80,silos:1});Object.assign(comfort.plan,{strategy:'user',autoSequence:false,sequence:'K R C',solverVersion:2,target:102,floors:[20,20,20,21,21]});
 result=undefined;await context.onmessage({data:{config:comfort,options:{maxMs:2500}}});assert.equal(error,undefined);assert.ok(result?.validatedReplay);assert.ok(result.finalStats.siloHours>=24);
 const checked=O.replay(comfort,JSON.parse(JSON.stringify(result.actions)),true);assert.equal(checked.s.t,result.end);assert.equal(checked.s.silos,8);assert.ok(S.reached(checked.s,checked.c));
 const sleep=fixture();Object.assign(sleep.plan,{start:Date.parse('2026-10-08T22:59:59Z')/1000,eventTimezone:'UTC',strategy:'user',autoSequence:false,sequence:'C K',solverVersion:2,target:101,floors:[20,20,20,20,21],sleep:{enabled:true,start:'23:00',end:'07:00',timezone:'America/Los_Angeles'}});
 result=undefined;await context.onmessage({data:{config:sleep,options:{maxMs:1500}}});assert.equal(error,undefined);assert.ok(result?.validatedReplay);
 assert.equal(result.actions.find(a=>a.type==='shift').t,Date.parse('2026-10-09T07:00:00Z')/1000,'worker uses the plan timezone rather than the obsolete separate sleep zone');
 const awake=O.replay(sleep,result.actions);assert.equal(awake.c.sleep.timezone,'UTC');require('./sleep-schedule.cjs').validateInteractions(result.actions,awake.c);assert.equal(awake.s.t,result.end);
 console.log('PASS built browser worker: standalone search bundle, checkpoint metadata, distinct plans, extra paid silos after earlier delivery visits, shared sleep timezone, and independent replay.');
}
run().catch(error=>{console.error(error.message);process.exitCode=1;});
