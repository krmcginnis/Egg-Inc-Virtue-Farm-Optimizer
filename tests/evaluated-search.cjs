'use strict';
const assert=require('assert/strict'),{EvaluatedSearch}=require('../src/evaluated-search.cjs');
const Plans=require('../src/shift-plans.cjs'),Verify=require('../src/plan-verification.cjs'),R=require('../src/route-solver.cjs'),S=require('../src/simulator.cjs'),L=require('../src/optimizer-legacy.cjs'),C=require('../src/plan-continuation.cjs');
function fixture(){
 const base=require('./search-optimality.cjs').verificationFixture(),raw=base.config;
 Object.assign(raw.plan,{strategy:'wasmegg',autoSequence:true,maxShifts:1,maxSwitches:1,continuation:{version:1,totalShiftBudget:1,consumedShifts:0,remainingShiftBudget:1,snapshotTime:raw.plan.start}});raw.farm.delivered[1]=S.D.te[20]-1e6;
 const entries=[1,0].map(switches=>{
  const route=switches?['curiosity','integrity']:['curiosity'],{s,c}=R.prepare(raw,route,3);let n=s;
  for(const a of base.result.actions.filter(a=>a.type==='research'))n=S.buy(n,c,{type:'research',i:a.i});
  if(switches)n=S.buy(n,c,{type:'shift',egg:1});n=L.tail(n,c);
  const actions=S.history(n).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence:route,researchSales:3}});
  return {switches,plan:C.verified(raw,{...base.result,actions,start:c.start,end:n.t,seconds:n.t-c.start,switches})};
 });
 return {raw,result:Plans.create(entries)};
}
function fakeRun(raw,result,{failCreation=-1}={}){
 const workers=[];let created=0,reply;const progress=[];
 const factory=()=>{if(created++===failCreation)throw Error('Worker limit');const w={messages:[],postMessage(m){this.messages.push(m);},terminate(){this.stopped=true;}};workers.push(w);return w;};
 const pool=new EvaluatedSearch(factory,{workers:2,purchaseCheckMs:4000});pool.onmessage=({data})=>data.type==='progress'?progress.push(data.progress):reply=data;
 pool.postMessage({config:raw,options:{maxMs:1000}});
 const finishSearch=()=>{for(const w of workers.slice(0,2))w.onmessage({data:{type:'result',result}});};
 return {pool,workers,progress,finishSearch,get reply(){return reply;}};
}
async function respond(worker,options={}){
 const request=worker.messages.find(m=>m.verification),result=await Verify.search(request.verification.config,request.verification.result,{maxMs:2000},()=>{},options.cancelled||(()=>false));
 worker.onmessage({data:{type:'verification',result}});return result;
}
async function run(){
 const f=fixture(),test=fakeRun(f.raw,f.result);
 assert.ok(test.workers.every(w=>w.messages[0].options.disableExactRefinement),'spend checking time on merged choices, not one island winner');
 test.finishSearch();assert.equal(test.reply,undefined);assert.equal(test.workers.length,4);assert.ok(test.workers.slice(0,2).every(w=>w.stopped));
 const checks=test.workers.slice(2);assert.deepEqual(checks.map(w=>w.messages[0].verification.result.switches),[1,0]);
 assert.ok(checks.every(w=>w.messages[0].options.absoluteDeadline>Date.now()+2000),'purchase checks receive a fresh budget after route search');
 await respond(checks[0]);assert.equal(test.reply,undefined,'wait for both checked choices');await respond(checks[1]);
 const result=test.reply.result;assert.equal(result.purchaseEvaluation.status,'complete');assert.equal(result.purchaseEvaluation.plans.length,2);assert.equal(result.purchaseEvaluation.workers,2);
 for(const e of result.shiftPlans){assert.ok(e.plan.verification.complete);const original=f.result.shiftPlans.find(p=>p.switches===e.switches).plan;assert.ok(e.plan.end<=original.end);assert.ok(e.plan.actions.filter(a=>a.type==='research').length<original.actions.filter(a=>a.type==='research').length,'both plans remove unnecessary paid purchases');R.replay(f.raw,e.plan.actions,true);}
 assert.ok(test.progress.some(p=>p.phase==='purchase-evaluation'));assert.equal(Plans.select(result,0).purchaseEvaluation.status,'complete');
 const restored=Plans.replay(f.raw,JSON.parse(JSON.stringify(Plans.select(result,0))),(raw,p)=>{R.replay(raw,p.actions,true);return p;});assert.ok(restored.verification.complete);

 const stopped=fakeRun(f.raw,f.result);stopped.pool.postMessage({cancel:true});stopped.finishSearch();assert.equal(stopped.workers.length,2);assert.equal(stopped.reply.result.purchaseEvaluation.status,'paused');assert.ok(stopped.reply.result.purchaseEvaluation.plans.every(p=>p.status==='not-started'));
 const paused=fakeRun(f.raw,f.result);paused.finishSearch();paused.pool.postMessage({cancel:true});assert.ok(paused.workers.slice(2).every(w=>w.messages.some(m=>m.cancel)));
 for(const w of paused.workers.slice(2))await respond(w,{cancelled:()=>true});assert.equal(paused.reply.result.purchaseEvaluation.status,'paused');assert.ok(paused.reply.result.shiftPlans.every(e=>e.plan.verification&&!e.plan.verification.complete));
 const failed=fakeRun(f.raw,f.result);failed.finishSearch();const a=failed.workers[2],b=failed.workers[3],original=a.messages[0].verification.result;
 a.onmessage({data:{type:'verification',result:{...original,end:original.end+1}}});await respond(b);
 assert.equal(failed.reply.result.purchaseEvaluation.status,'partial');assert.equal(failed.reply.result.shiftPlans.find(e=>e.switches===1).plan.end,original.end);assert.equal(failed.reply.result.shiftPlans.find(e=>e.switches===1).plan.automaticPurchaseCheck.status,'error');
 const fallback=fakeRun(f.raw,f.result,{failCreation:3});fallback.finishSearch();assert.equal(fallback.workers.length,3);assert.ok(fallback.workers[2].messages[0].options.maxMs<=2000);
 await respond(fallback.workers[2]);assert.equal(fallback.workers.length,4);await respond(fallback.workers[3]);assert.equal(fallback.reply.result.purchaseEvaluation.status,'complete');assert.equal(fallback.reply.result.purchaseEvaluation.workers,1);

 // If checking changes the fastest count, retain other searched counts and
 // automatically check its new exact-one-fewer alternative as well.
 const example=require('./shift-plans.cjs').preferenceCase(),entries=example.entries.slice(0,3),legacy={...entries[0].plan,shiftPlans:entries,selectedSwitches:5,shiftComparisonVersion:1},rerank=fakeRun(example.raw,legacy);
 rerank.finishSearch();for(const w of rerank.workers.slice(2,4)){
  const request=w.messages[0].verification;
  if(request.result.switches===4){
   const {s,c}=R.replay(example.raw,request.result.actions.slice(0,-1),true),n=S.advance(s,c,c.start+900,'Improved four-shift order',true,'online');
   request.result={...request.result,actions:S.history(n).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:request.result.actions[0].routeSearch}),end:n.t,seconds:900};
  }
  await respond(w);
 }
 assert.equal(rerank.reply,undefined);assert.equal(rerank.workers.length,5);assert.equal(rerank.workers[4].messages[0].verification.result.switches,3);
 await respond(rerank.workers[4]);assert.deepEqual(rerank.reply.result.shiftPlans.map(e=>e.switches),[4,3]);assert.equal(rerank.reply.result.purchaseEvaluation.attemptedPlans,3);

 // Use the actual compiled worker for both final checks, with a deterministic
 // paid search result so this verifies checking rather than route heuristics.
 const nativeFactory=require('./search-pool.cjs').factory;let count=0,searchWorkers=[];
 const native=new EvaluatedSearch(()=>{if(count++>=2)return nativeFactory();const w={postMessage(){},terminate(){}};searchWorkers.push(w);return w;},{workers:2,purchaseCheckMs:3000});
 const paid=await new Promise((resolve,reject)=>{native.onmessage=({data})=>{if(data.type!=='progress')data.type==='result'?resolve(data.result):reject(Error(data.error));};native.postMessage({config:f.raw,options:{maxMs:1000}});for(const w of searchWorkers)w.onmessage({data:{type:'result',result:f.result}});});
 assert.ok(paid.shiftPlans.every(e=>e.plan.verification.complete));assert.ok(paid.end<f.result.end);native.terminate();

 const req=require('./plan-continuation.cjs').partialResearch(),prepared=C.prepare(req),baseline=C.baseline(prepared);let reply;const ws=[];
 const continued=new EvaluatedSearch(()=>{const w={messages:[],postMessage(m){this.messages.push(m);},terminate(){}};ws.push(w);return w;},{workers:2,purchaseCheckMs:2000});
 continued.onmessage=({data})=>{if(data.type!=='progress')reply=data;};continued.postMessage({continuation:req,options:{maxMs:1000}});
 for(const w of ws.slice(0,2))w.onmessage({data:{type:'continuation',continuation:{...prepared,report:undefined,result:Plans.create([{switches:baseline.switches,plan:baseline}]),baseline}}});
 await respond(ws[2]);assert.equal(reply.type,'continuation');assert.equal(reply.continuation.sourceKey,prepared.sourceKey);assert.equal(reply.continuation.originalEnd,prepared.originalEnd);C.verified(reply.continuation.config,reply.continuation.result);
 console.log('PASS automatic final-plan checks: paid improvements to both choices, fresh shared budget and one-worker fallback, stop/skip/resume metadata, invalid-result recovery, changed-pair rechecking, real compiled workers, saved per-plan checks and continuation identity.');
}
module.exports={fixture,run};if(require.main===module)run().catch(e=>{console.error(e.stack);process.exitCode=1;});
