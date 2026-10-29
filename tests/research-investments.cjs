'use strict';
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),R=require('../src/route-solver.cjs'),L=require('../src/optimizer-legacy.cjs'),P=require('../src/schedule-proposals.cjs'),I=require('../src/research-investments.cjs');
const {fixture}=require('./research-sale-plans.cjs');
function mark(n,route){return S.history(n).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence:route,researchSales:3}});}
function make({sleep=false,later=false}={}){
 const raw=fixture(),route=later?['curiosity','integrity','curiosity','kindness','humility','curiosity','resilience']:['curiosity','kindness','humility','curiosity','integrity','resilience'];
 Object.assign(raw.plan,{start:Date.parse('2026-10-30T09:00:00-07:00')/1000,eventTimezone:'America/Los_Angeles',strategy:'user',autoSequence:false,solverVersion:2,sequence:route,target:200,maxDays:366,ships:{mode:'none'},sleep:{enabled:sleep,start:'23:00',end:'07:00'},actionSeconds:.3});
 Object.assign(raw.farm.research,{timeline_diversion:37,micro_coupling:2,neural_net_refine:11});raw.farm.vehicles.forEach(v=>v.cars=7);raw.farm.cash=0;raw.farm.silos=8;
 const a=id=>({type:'research',i:S.RMAP[id]});let p=R.prepare(raw,route,3);const cost=S.price(p.s,p.c,a('timeline_diversion'));
 raw.farm.cash=S.price(p.s,p.c,a('micro_coupling'))+S.price(p.s,p.c,a('neural_net_refine'))+.4*cost;
 raw.farm.earningsScale=.6*cost/(20*3600*S.stats(p.s,p.c).earning);p=R.prepare(raw,route,3);let n=p.s;
 for(const id of ['neural_net_refine','micro_coupling'])n=S.buy(S.afford(n,p.c,a(id)),p.c,a(id));
 if(later){n=S.buy(n,p.c,{type:'shift',egg:1});n=S.buy(n,p.c,{type:'shift',egg:0});n=S.advance(n,p.c,n.t+600,'A later research visit',true,'online');}
 n=S.buy(n,p.c,{type:'shift',egg:4});for(let slot=0;slot<17;slot++)n=S.buy(S.afford(n,p.c,{type:'car',slot}),p.c,{type:'car',slot});
 n=L.tail(n,p.c);assert.ok(n);const plan={solverVersion:2,start:p.c.start,end:n.t,seconds:n.t-p.c.start,switches:n.stage,target:raw.plan.target,actions:mark(n,route)};
 R.replay(raw,plan.actions,true);return {raw,route,state:n,context:p.c,count:3,plan};
}
async function compare(test,ms=5000){
 let best=test.state,context=test.context;const control={cancelled:()=>false,yield:async()=>{},consider:n=>{assert.equal(R.replay(test.raw,mark(n,test.route),true).s.t,n.t);if(R.better(n,best)){best=n;context=control.context;}}};
 await R.compareResearchInvestments(test.raw,test,Date.now()+ms,control);return {state:best,context,control};
}
async function run(){
 const test=make(),pristine=JSON.stringify({raw:test.raw,actions:S.history(test.state)}),found=await compare(test),index=S.RMAP.timeline_diversion;
 assert.equal(found.state.r[index],38);assert.ok(found.state.t<test.state.t-3600);assert.equal(found.state.stage,test.state.stage);assert.equal(S.totalTE(found.state,found.context),200);
 const first=S.history(found.state).find(a=>a.type==='research');assert.equal(first.i,index,'compare buying the productive level before selected shipping research');
 const baselineExit=S.history(test.state).find(a=>a.type==='shift'),newExit=S.history(found.state).find(a=>a.type==='shift');assert.ok(newExit.t>baselineExit.t+18*3600,'pay the longer funding wait rather than granting a free upgrade');
 assert.ok(found.control.researchInvestmentPasses>0);assert.ok(found.control.researchInvestmentReplays>0);assert.equal(JSON.stringify({raw:test.raw,actions:S.history(test.state)}),pristine);
 const count=found.control.researchInvestmentComparisons;await R.compareResearchInvestments(test.raw,test,Date.now()+5000,found.control);assert.equal(found.control.researchInvestmentComparisons,count,'completed source trials are not repeated');

 const later=make({later:true}),p=R.prepare(later.raw,later.route,3,{artifactReplay:true,artifactSets:S.recordedArtifactSets(later.plan.actions)}),trials=[...I.proposals(p.s,p.c,later.plan.actions)];
 assert.ok(trials.some(x=>x.stage===0&&x.action.i===index));assert.ok(trials.some(x=>x.stage===2&&x.action.i===index),'every eligible Curiosity visit is included');
 const at=I.anchors(p.s,p.c,later.plan.actions);assert.ok(at.every(x=>later.plan.actions[x.index].type!=='wait'||!/interaction time|Switch overhead/.test(later.plan.actions[x.index].reason||'')));
 const paidLater=trials.find(x=>x.stage===2&&x.action.i===index),laterState=P.execute(p.s,p.c,paidLater.actions,{retime:true,recomputeFunding:true,honorTargets:true});R.replay(later.raw,mark(laterState,later.route),true);
 // Moving an already selected later level earlier pays for it once, keeps
 // its dependents, and does not accidentally buy the following level twice.
 const advanced=[...I.proposals(p.s,p.c,mark(laterState,later.route))].find(x=>x.stage===0&&x.action.i===index);
 const once=P.execute(p.s,p.c,advanced.actions,{retime:true,recomputeFunding:true,honorTargets:true});
 assert.equal(S.history(once).filter(a=>a.type==='research'&&a.i===index).length,1);assert.equal(once.r[index],38);R.replay(later.raw,mark(once,later.route),true);

 const families=structuredClone(test.raw);Object.assign(families.farm.research,{comfy_nests:49,leafsprings:29,wormhole_dampening:24,atomic_purification:27});
 const q=R.prepare(families,test.route,3),fake=[{type:'wait',t:q.s.t,end:q.s.t+1,egg:0,reason:'Probe',earningsMode:'online'}],ids=new Set([...I.proposals(q.s,q.c,fake)].map(x=>S.D.research[x.action.i].id));
 for(const id of ['timeline_diversion','comfy_nests','leafsprings','wormhole_dampening','atomic_purification','micro_coupling'])assert.ok(ids.has(id),'enumerate '+id);
 assert.ok(!ids.has('neural_linking'),'do not add modeled-inert unlock filler');
 const locked=S.clone(q.s);locked.r=S.D.research.map(()=>0);const lockedTrials=[...I.proposals(locked,q.c,fake)];assert.ok(!lockedTrials.some(x=>x.action.i===index),'respect tier prerequisites');
 const regular=structuredClone(test.raw);regular.plan.start-=86400;const z=R.prepare(regular,test.route,3),regularActions=[{...fake[0],t:z.s.t,end:z.s.t+1}],policies=[...I.proposals(z.s,z.c,regularActions)].filter(x=>x.action.i===index);
 assert.equal(policies.length,2);assert.equal(S.at(z.c,policies[1].action.t).sale,.3,'compare the next Friday sale as well as earliest purchase');
 assert.throws(()=>[...I.proposals(q.s,q.c,fake,{checkpoint:()=>{throw Error('Cancelled');}})],/Cancelled/);
 let called=0;await R.compareResearchInvestments(test.raw,test,Date.now()-1,{cancelled:()=>false,consider:()=>called++});assert.equal(called,0);
 const interrupted={cancelled:()=>true,consider:()=>called++};await R.compareResearchInvestments(test.raw,test,Date.now()+1000,interrupted);assert.equal(called,0);
 let stop=false;const resumable={cancelled:()=>stop,yield:async()=>{stop=true;},consider:()=>{}};
 await R.compareResearchInvestments(test.raw,test,Date.now()+5000,resumable);const partial=resumable.researchInvestmentComparisons;assert.ok(partial>0);assert.ok(!resumable.researchInvestmentPasses);
 stop=false;resumable.yield=async()=>{};await R.compareResearchInvestments(test.raw,test,Date.now()+5000,resumable);assert.ok(resumable.researchInvestmentComparisons>partial);assert.equal(resumable.researchInvestmentPasses,1);
 const ships=require('./plan-continuation.cjs').ships(),marker=ships.result.actions[0].routeSearch,shipContext=R.prepare(ships.config,marker.sequence,marker.researchSales,{artifactReplay:true,artifactSets:S.recordedArtifactSets(ships.result.actions)});
 assert.doesNotThrow(()=>[...I.proposals(shipContext.s,shipContext.c,ships.result.actions)],'anchor replay retains mission/fuel interactions');
 const slept=make({sleep:true}),awake=await compare(slept);assert.ok(awake.state.t<slept.state.t);require('./sleep-schedule.cjs').validateInteractions(mark(awake.state,slept.route),awake.context);

 // The same full-plan pass improves other production families; it is not
 // keyed to Timeline Diversion, a particular level, or the supplied account.
 for(const id of ['comfy_nests','neural_net_refine','wormhole_dampening']){
  const raw=fixture(),route=test.route;Object.assign(raw.plan,{solverVersion:2,strategy:'user',autoSequence:false,sequence:route,target:140,maxDays:366,ships:{mode:'none'}});raw.farm.cash=1e100;
  raw.farm.research[id]=S.D.research[S.RMAP[id]].levels-1;
  raw.farm.vehicles.forEach(v=>v.cars=id==='neural_net_refine'?1:10);
  const p=R.prepare(raw,route,3),state=L.tail(p.s,p.c),got=await compare({raw,route,state,context:p.c,count:3});
  assert.ok(got.state.t<state.t-1,'full-plan improvement for '+id);assert.equal(got.state.r[S.RMAP[id]],S.D.research[S.RMAP[id]].levels);
 }

 const result=await R.solve(test.raw,{maxMs:1200,width:4,incumbent:{config:test.raw,result:test.plan},disableAdaptiveRefinement:true});
 assert.ok(result.end<=found.state.t+.01,'the normal saved-plan search gets the improvement before optional package refinement');assert.ok(result.search.researchInvestmentComparisons>0);R.replay(test.raw,result.actions,true);
 console.log('PASS productive research investments: full paid finish comparisons before pruning, long waits, purchase order, every Curiosity visit, all productive families, sale timing, prerequisites, single charging of moved levels, sleep, cancellation, immutable input, trial reuse, and ordinary solver integration.');
}
module.exports={make,run};if(require.main===module)run().catch(e=>{console.error(e.stack);process.exitCode=1;});
