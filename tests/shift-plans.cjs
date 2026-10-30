'use strict';
const assert=require('node:assert/strict'),Plans=require('../src/shift-plans.cjs');
const R=require('../src/route-solver.cjs'),S=require('../src/simulator.cjs'),{SearchPool}=require('../src/search-pool.cjs');
function entry(switches,seconds,start=1e9){return {switches,plan:{switches,seconds,start,end:start+seconds,actions:[]}};}
function preferenceCase(){
 const raw=require('./research-sale-plans.cjs').fixture();
 Object.assign(raw.plan,{autoSequence:true,strategy:'wasmegg',maxShifts:6,target:100});
 const route=['curiosity','integrity','kindness','resilience','humility','curiosity'];
 const entries=[[5,1000],[4,1001],[3,1002],[2,1050],[1,1100]].map(([shifts,seconds])=>{
  const sequence=route.slice(0,shifts+1),{s,c}=R.prepare(raw,sequence,3);let n=s;
  for(const egg of sequence.slice(1))n=S.buy(n,c,{type:'shift',egg:S.EGGS.indexOf(egg)});
  n=S.advance(n,c,c.start+seconds,'Synthetic complete alternative',true,'online');
  const actions=S.history(n).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence,researchSales:3}});
  const paid=R.replay(raw,actions,true);assert.ok(S.reached(paid.s,paid.c));
  return {switches:shifts,plan:{version:1,solverVersion:2,initialSiloRule:'one',openingTimeLimits:false,actions,start:c.start,end:n.t,seconds,switches:shifts,target:c.target,soulCost:n.lost,finalTE:S.teByEgg(n,c),pendingTE:S.totalTE(n,c)-c.claimedTotal,finalCash:n.cash,finalStats:S.stats(n,c),validatedReplay:true,route:sequence,researchSales:3,researchDeadline:c.researchDeadline,actualResearchSales:0,frontier:[],explored:0,method:'Synthetic shift preference case',termination:'complete'}};
 });
 return {raw,entries};
}
function run(){
 const entries=[entry(12,100),entry(11,102),entry(10,105),entry(9,110.25),entry(8,115.7625)];
 for(const order of [entries,entries.slice().reverse(),[...entries.slice(2),...entries.slice(0,2)]]){
  const result=Plans.create(order);assert.equal(result.switches,12);assert.equal(result.recommendedSwitches,undefined);
  assert.deepEqual(result.shiftPlans.map(e=>e.switches),[12,11]);Plans.validate(result);
 }
 for(const seconds of [102,105,105.0001,500]){
  const result=Plans.create([entry(12,100),entry(11,seconds)]);assert.equal(result.switches,12,'always default to fastest, without a slowdown preference');
  assert.equal(result.shiftPlans[1].plan.seconds,seconds,'keep the exact one-fewer option regardless of delay');
 }
 assert.deepEqual(Plans.create([entry(12,100),entry(10,101)]).shiftPlans.map(e=>e.switches),[12],'do not replace a missing one-fewer plan with a different count');
 assert.deepEqual(Plans.create([entry(4,101),entry(3,100),entry(2,200)]).shiftPlans.map(e=>e.switches),[3,2],'the second choice is not merely the next-fastest overall');
 assert.equal(Plans.create([entry(3,0),entry(2,0),entry(1,1)]).switches,2,'equal-time fastest plans favor fewer shifts');
 assert.deepEqual(Plans.create([entry(0,10),entry(1,11)]).shiftPlans.map(e=>e.switches),[0]);
 assert.deepEqual(Plans.shortlist([]),[]);assert.throws(()=>Plans.create([]),/No complete/);
 const duplicates=Plans.create([entry(6,100),entry(5,200),entry(5,150),entry(4,120)]);
 assert.deepEqual(duplicates.shiftPlans.map(e=>[e.switches,e.plan.seconds]),[[6,100],[5,150]],'retain the fastest candidate at the exact lower count');
 const read=x=>({seconds:x.time,switches:x.count});
 assert.deepEqual(Plans.shortlist([{count:3,time:1},{count:2,time:2},{count:1,time:3}],read).map(x=>x.count),[3,2]);
 const selected=Plans.select(duplicates,5),saved=JSON.parse(JSON.stringify(selected));
 assert.equal(selected.switches,5);assert.equal(selected.recommendedSwitches,undefined);
 const replayed=Plans.replay({},saved,(_,p)=>p);assert.equal(replayed.switches,5,'manual choices survive save/load');
 const current=11892579.52011633,deep11=11892618.884424925,ten=13048127.404732943;
 const benchmark=Plans.create([entry(12,current),entry(11,deep11),entry(10,ten)]);
 assert.equal(benchmark.switches,12);assert.deepEqual(benchmark.shiftPlans.map(e=>e.switches),[12,11]);

 // Legacy saves retain their selected timeline and validate every stored plan,
 // but expose only the current pair and discard obsolete recommendation data.
 const example=preferenceCase(),legacyEntries=example.entries.slice(0,3),legacy={...legacyEntries[2].plan,shiftPlans:legacyEntries,selectedSwitches:3,recommendedSwitches:3,shiftComparisonVersion:1};
 const checked=[];const restored=Plans.replay(example.raw,legacy,(raw,p)=>{const {s,c}=R.replay(raw,p.actions,true);assert.ok(S.reached(s,c));checked.push(p.switches);return p;});
 assert.deepEqual(checked,[5,4,3]);assert.equal(restored.selectedSwitches,3);assert.equal(restored.recommendedSwitches,undefined);
 assert.deepEqual(Plans.shortlist(restored.shiftPlans).map(e=>e.switches),[5,4]);
 const corrupt=structuredClone(legacy);corrupt.shiftPlans[2].plan.actions[0]={type:'research',i:999};
 assert.throws(()=>Plans.replay(example.raw,corrupt,(raw,p)=>{R.replay(raw,p.actions,true);return p;}));

 // The merger keeps every paid per-count winner internally. A later fastest
 // plan changes the pair, including a previously hidden lower-count winner.
 for(const lateWinner of [false,true])for(const order of [example.entries,example.entries.slice().reverse()]){
  const pool=new SearchPool(()=>({postMessage(){},terminate(){}}),{workers:2});let reply;
  pool.onmessage=({data})=>{reply=data;};pool.postMessage({config:example.raw,options:{maxMs:1000}});
  for(const [i,e] of order.entries())assert.ok(pool.accept({config:example.raw,result:e.plan},i%2));
  assert.equal(pool.best.size,5);
  const two=example.entries.find(e=>e.switches===2),worse=structuredClone(two.plan),paid=R.replay(example.raw,worse.actions,true);
  const delayed=S.advance(paid.s,paid.c,paid.s.t+1,'Extra delay',true,'online');worse.actions=S.history(delayed);worse.seconds++;worse.end++;
  assert.equal(pool.accept({config:example.raw,result:worse},0),false);assert.equal(pool.best.get(2).plan.seconds,1050);
  if(lateWinner){
   const old=example.entries.find(e=>e.switches===4).plan,{s,c}=R.replay(example.raw,old.actions.slice(0,-1),true),n=S.advance(s,c,c.start+900,'Faster four-shift winner',true,'online');
   const actions=S.history(n).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:old.actions[0].routeSearch});
   const improved={...old,actions,end:n.t,seconds:n.t-c.start};assert.ok(pool.accept({config:example.raw,result:improved},1));
  }
  pool.receive(0,{type:'result',result:example.entries[0].plan});pool.receive(1,{type:'result',result:two.plan});
  assert.equal(reply.type,'result');assert.equal(reply.result.switches,lateWinner?4:5);assert.equal(reply.result.recommendedSwitches,undefined);
  assert.deepEqual(reply.result.shiftPlans.map(e=>e.switches),lateWinner?[4,3]:[5,4]);
  for(const e of reply.result.shiftPlans){const {s,c}=R.replay(example.raw,e.plan.actions,true);assert.ok(S.reached(s,c));}
  pool.terminate();
 }
 console.log('PASS two plan choices: fastest default without recommendations, exact one-fewer count at any delay, gaps/zero/ties/custom metrics, fastest per-count winners, retained legacy selection and full replay, manual save/load, and multi-worker reanchoring without pruning hidden counts.');
}
module.exports={run,preferenceCase};if(require.main===module)run();
