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
  const result=Plans.create(order);assert.equal(result.switches,10);assert.equal(result.recommendedSwitches,10);
  assert.equal(Plans.fastest(result.shiftPlans).switches,12);assert.equal(result.shiftPlans.length,3);Plans.validate(result);
 }
 assert.equal(Plans.create([entry(12,100),entry(11,105)]).switches,11,'exactly 5% is included');
 assert.equal(Plans.create([entry(12,100),entry(11,105.0001)]).switches,12,'more than 5% is excluded');
 assert.equal(Plans.create([entry(12,100),entry(11,104),entry(10,108)]).switches,11,'the allowance cannot compound');
 assert.equal(Plans.create([entry(12,100),entry(11,111)]).switches,12,'compare durations, not large absolute end timestamps');
 assert.equal(Plans.create([entry(3,0),entry(2,0),entry(1,1)]).switches,2,'zero-duration reference does not allow positive delay');
 assert.equal(Plans.create([entry(0,10)]).switches,0);
 const many=[12,11,10,9,8].map(n=>entry(n,100+(12-n)));
 const compact=Plans.create(many);assert.equal(compact.switches,8);assert.ok(compact.shiftPlans.some(e=>e.switches===12),'the fastest reference survives the card cap');
 const selected=Plans.select(compact,12);assert.equal(selected.switches,12);assert.equal(selected.recommendedSwitches,8,'manual choice does not change recommendation');
 const saved=JSON.parse(JSON.stringify({...selected,recommendedSwitches:12}));
 const replayed=Plans.replay({},saved,(_,p)=>p);assert.equal(replayed.switches,12);assert.equal(replayed.recommendedSwitches,8,'older recommendations are refreshed without changing saved selection');
 const current=11892579.52011633,deep11=11892618.884424925,ten=13048127.404732943;
 assert.equal(Plans.create([entry(12,current),entry(11,deep11)]).switches,11);
 assert.equal(Plans.create([entry(12,current),entry(11,deep11),entry(10,ten)]).switches,11,'the benchmark ten-shift alternative is outside the allowance');

 // Exercise the real paid-candidate merger, including arrival order and more
 // than three shift counts. A faster candidate of the SAME count still wins.
 const example=preferenceCase();
 for(const order of [example.entries,example.entries.slice().reverse()]){
  const fake=[],pool=new SearchPool(()=>{const w={postMessage(){},terminate(){}};fake.push(w);return w;},{workers:2});let reply;
  pool.onmessage=({data})=>{reply=data;};pool.postMessage({config:example.raw,options:{maxMs:1000}});
  for(const [i,e] of order.entries())assert.ok(pool.accept({config:example.raw,result:e.plan},i%2));
  const two=example.entries.find(e=>e.switches===2),worse=structuredClone(two.plan),paid=R.replay(example.raw,worse.actions,true);
  const delayed=S.advance(paid.s,paid.c,paid.s.t+1,'Extra delay',true,'online');worse.actions=S.history(delayed);worse.seconds++;worse.end++;
  assert.equal(pool.accept({config:example.raw,result:worse},0),false);assert.equal(pool.best.get(2).plan.seconds,1050);
  pool.receive(0,{type:'result',result:example.entries[0].plan});pool.receive(1,{type:'result',result:two.plan});
  assert.equal(reply.type,'result');assert.equal(reply.result.switches,2);assert.equal(reply.result.recommendedSwitches,2);
  assert.equal(Plans.fastest(reply.result.shiftPlans).switches,5);assert.equal(reply.result.shiftPlans.length,3);
  for(const e of reply.result.shiftPlans){const {s,c}=R.replay(example.raw,e.plan.actions,true);assert.ok(S.reached(s,c));}
  pool.terminate();
 }
 console.log('PASS shift preference: inclusive 5% of elapsed duration, noncompounding threshold, fewest eligible shifts, zero duration, retained fastest reference before card cap, manual/save/load selection, benchmark tradeoff, and paid multi-worker candidate merging.');
}
module.exports={run,preferenceCase};if(require.main===module)run();
