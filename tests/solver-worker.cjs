'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const O=require('../src/optimizer.cjs'),S=require('../src/simulator.cjs'),{fixture}=require('./research-sale-plans.cjs');
async function run(){
 const raw=fixture();let result,error,continuation,progressHook;
 // A worker's self IS its global object. Supply browser APIs, without require
 // or Node modules, and execute the actual generated release bundle.
 const context={setTimeout,clearTimeout,console,structuredClone,performance,TextEncoder,TextDecoder,URL,URLSearchParams,atob,btoa,
  crypto:require('node:crypto').webcrypto,postMessage(message){if(message.type==='result')result=message.result;if(message.type==='continuation')continuation=message.continuation;if(message.type==='error')error=message.error;if(message.type==='progress')progressHook?.(message.progress);}};
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
 // The generated worker must use Pacific earnings even with UTC sleep/dates.
 // A completed farm has constant rates, so cash across 09:00 PDT has an exact
 // independent integral: one hour at normal earnings, one hour at double.
 for(const [start,end]of [['2026-10-12T15:00:00Z','2026-10-12T17:00:00Z'],['2026-11-02T16:00:00Z','2026-11-02T18:00:00Z']]){
  const probe=fixture();Object.assign(probe.plan,{start:Date.parse(start)/1000,eventTimezone:'UTC',strategy:'user',autoSequence:false,sequence:'C',target:101,solverVersion:2,shiftSeconds:0,actionSeconds:0});
  probe.farm.cash=0;const p=S.prepare(probe),rate=S.stats(p.s,p.c);probe.farm.delivered[0]=S.D.te[20]-rate.delivery*7200;
  result=undefined;await context.onmessage({data:{config:probe,options:{maxMs:1000}}});assert.equal(error,undefined);assert.ok(result?.validatedReplay);assert.ok(Math.abs(result.end-Date.parse(end)/1000)<.01);
  // Include the solver's millisecond TE-threshold margin at the replayed end.
  const paid=O.replay(probe,JSON.parse(JSON.stringify(result.actions)),true),expected=rate.online*(3600+2*(paid.s.t-probe.plan.start-3600));
  assert.ok(Math.abs(paid.s.cash-expected)<=expected*1e-9,'built worker integrates the Pacific Monday boost under UTC selection');
 }
 const weak=require('./sleep-search-quality.cjs').make();weak.farm.earningsMode='offline';weak.farm.loadouts={current:[{artifactId:'lunar-totem-4-3',stones:['lunar-stone-3']}]};
 result=undefined;await context.onmessage({data:{config:weak,options:{maxMs:1800}}});assert.equal(error,undefined);const old=result;
 const strong=structuredClone(weak);strong.farm.loadouts.current[0].stones=['lunar-stone-4'];result=undefined;
 await context.onmessage({data:{config:strong,options:{maxMs:5000,incumbent:{config:weak,result:old}}}});assert.equal(error,undefined);assert.ok(result.search.earningsAdaptations>0);
 for(const entry of old.shiftPlans){const next=result.shiftPlans.find(e=>e.switches===entry.switches);assert.ok(next);assert.ok(next.plan.seconds<=entry.plan.seconds+1e-6);const paid=O.replay(strong,next.plan.actions,true);assert.equal(paid.s.t,next.plan.end);require('./sleep-schedule.cjs').validateInteractions(next.plan.actions,paid.c);}
 const short=require('./sleep-search-quality.cjs').make({route:'C R C'});Object.assign(short.plan,{strategy:'auto',strategyVersion:2,autoSequence:true,maxShifts:2});result=undefined;
 await context.onmessage({data:{config:short,options:{maxMs:8000,width:8}}});assert.equal(error,undefined);assert.equal(result.switches,2);assert.ok(Math.abs(result.seconds-172832.00099992752)<.05);
 const covered=O.replay(short,JSON.parse(JSON.stringify(result.actions)),true);assert.equal(covered.s.t,result.end);require('./sleep-schedule.cjs').validateInteractions(result.actions,covered.c);
 // Continuations run through the same standalone bundle, including incumbent
 // replay and cancellation, rather than a Node-only implementation.
 const C=require('../src/plan-continuation.cjs'),fixtures=require('./plan-continuation.cjs'),partial=fixtures.partialResearch();
 await context.onmessage({data:{continuation:partial,options:{maxMs:800,width:4}}});assert.equal(error,undefined);assert.ok(continuation?.result.validatedReplay);assert.equal(continuation.remainingShiftBudget,0);assert.equal(continuation.result.switches,0);assert.ok(continuation.result.end<=continuation.baseline.end+.01);C.verified(continuation.config,JSON.parse(JSON.stringify(continuation.result)));
 const fleet=fixtures.ships(),index=fleet.result.actions.findIndex(a=>a.type==='ship-run');fleet.progress.launched[index]=[1];continuation=undefined;
 await context.onmessage({data:{continuation:fleet,options:{maxMs:1200,width:4}}});assert.equal(error,undefined);assert.equal(continuation.consumedShifts,1);assert.equal(continuation.remainingLaunches,2);assert.equal(continuation.result.actions.filter(a=>a.type==='ship-run').reduce((n,a)=>n+a.count,0),2);assert.deepEqual(continuation.config.farm.shipFlights,fleet.progress.snapshot.farm.shipFlights);C.verified(continuation.config,JSON.parse(JSON.stringify(continuation.result)));
 continuation=undefined;let stopped=false;progressHook=p=>{if(!stopped&&p.bestSeconds!==null&&Number.isFinite(p.bestSeconds)){stopped=true;context.onmessage({data:{cancel:true}});}};
 await context.onmessage({data:{continuation:partial,options:{maxMs:5000,width:4}}});progressHook=undefined;assert.equal(error,undefined);assert.ok(stopped,'stop after a replayed candidate is available');assert.ok(continuation?.result.validatedReplay);assert.ok(continuation.result.search.retainedPlans>0);assert.ok(continuation.result.end<=continuation.baseline.end+.01);C.verified(continuation.config,JSON.parse(JSON.stringify(continuation.result)));
 console.log('PASS built browser worker: standalone search bundle, checkpoint metadata, distinct plans, extra paid silos after earlier delivery visits, shared sleep timezone, earnings-only upgrade reexecution, remaining-plan launch/shift accounting, stop-and-keep-original-candidate, and independent replay.');
}
run().catch(error=>{console.error(error.message);process.exitCode=1;});
