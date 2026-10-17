'use strict';
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),R=require('../src/route-solver.cjs'),L=require('../src/optimizer-legacy.cjs');
const E=require('../src/purchase-economics.cjs'),P=require('../src/schedule-proposals.cjs');
const {fixture}=require('./research-sale-plans.cjs'),{missedSale}=require('./earnings-first-research.cjs');
function pay(s,c,actions){for(const a of actions){const ready=S.afford(s,c,a);assert.ok(ready);s=S.buy(ready,c,a);}return s;}
function marked(s,route){return S.history(s).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence:route,researchSales:3}});}
function capacityPlan(){
 const {raw,route}=missedSale();raw.plan.start=Date.parse('2026-10-16T10:00:00-07:00')/1000;
 raw.farm.research.micro_coupling=2;raw.farm.vehicles=raw.farm.vehicles.map(v=>({...v,cars:7}));raw.farm.earningsScale*=100;raw.farm.cash=0;
 const {s,c}=R.prepare(raw,route,3),purchases=['micro_coupling','atomic_purification','wormhole_dampening'].map(id=>({type:'research',i:S.RMAP[id]}));
 const state=L.tail(pay(s,c,purchases),c);assert.ok(state);
 return {raw,route,state,plan:{solverVersion:2,start:c.start,end:state.t,seconds:state.t-c.start,switches:state.stage,target:c.target,actions:marked(state,route)}};
}
async function run(){
 const test=capacityPlan(),before=JSON.stringify(test.raw),p=R.prepare(test.raw,test.route,3),actions=test.plan.actions,edits=E.proposals(p.s,p.c,actions);
 const micro=actions.find(a=>a.type==='research'&&a.i===S.RMAP.micro_coupling);
 assert.equal(micro.before.earning,micro.after.earning,'unused train length earns nothing now');
 const reorder=edits.find(x=>x.kind==='after-earnings'&&x.i===micro.i);assert.ok(reorder);
 const paid=P.execute(p.s,p.c,reorder.actions,{retime:true,recomputeFunding:true});assert.ok(paid.t<test.state.t-20,'actual income before inactive train length improves the complete goal');
 assert.deepEqual(paid.r,test.state.r,'ordering comparison buys every selected level');
 assert.equal(R.replay(test.raw,marked(paid,test.route)).s.t,paid.t);
 // Enumerate all six legal orders independently of proposal ranking. The
 // bounded comparison must retain at least this known same-build improvement.
 const ids=['micro_coupling','atomic_purification','wormhole_dampening'];let exhaustive=Infinity;
 for(const a of ids)for(const b of ids.filter(x=>x!==a)){const order=[a,b,ids.find(x=>x!==a&&x!==b)];const n=L.tail(pay(p.s,p.c,order.map(id=>({type:'research',i:S.RMAP[id]}))),p.c);exhaustive=Math.min(exhaustive,n.t);}
 let best=test.state,comparisons=0;
 const control={cancelled:()=>false,yield:async()=>{},consider:n=>{comparisons++;assert.equal(R.replay(test.raw,marked(n,test.route)).s.t,n.t);if(R.better(n,best))best=n;}};
 await R.comparePurchaseEconomics(test.raw,{state:test.state,route:test.route,count:3},Date.now()+5000,control);
 assert.ok(best.t<=exhaustive+.01);assert.ok(comparisons>2);assert.ok(control.purchaseEconomicsComparisons>0);assert.equal(JSON.stringify(test.raw),before);
 // A capacity level that raises delivery remains valuable after the last
 // income purchase. Omitting all capacity cannot win by receiving free rate.
 const productive=edits.find(x=>x.kind==='omit'&&x.i===S.RMAP.wormhole_dampening);assert.ok(productive);
 const less=P.execute(p.s,p.c,productive.actions,{retime:true,recomputeFunding:true});assert.ok(S.stats(less,p.c).delivery<S.stats(test.state,p.c).delivery);assert.ok(less.t>test.state.t+86400,'productive hab research pays back through the delivery goal');

 // Omitting an engine removes its cars; omitting an early car removes the
 // remaining levels, rather than silently buying them at the wrong price.
 const physical=fixture();physical.farm.virtue='kindness';physical.farm.vehicles[0]={id:null,cars:1};physical.farm.cash=1e100;
 Object.assign(physical.plan,{strategy:'user',autoSequence:false,sequence:'K C R I H K',solverVersion:2,target:200});
 const q=R.prepare(physical,R.routes(physical)[0],3),engine=pay(q.s,q.c,[{type:'vehicle',slot:0,id:11},{type:'car',slot:0},{type:'car',slot:0}]);
 const engineEdits=E.proposals(q.s,q.c,S.history(engine)),omitEngine=engineEdits.find(x=>x.kind==='omit'&&x.type==='vehicle'),omitCar=engineEdits.find(x=>x.kind==='omit'&&x.type==='car'&&!x.actions.some(a=>a.type==='car'));
 assert.ok(omitEngine);assert.ok(!omitEngine.actions.some(a=>E.purchase(a)));
 assert.equal(omitCar.actions.filter(a=>a.type==='car').length,0);
 const missing=E.closure(q.s,q.c,S.history(engine),[0]);assert.equal(missing.size,3);
 // Fleet slots and Micro-coupling are real prerequisites for later K buys.
 const dependency=structuredClone(test.raw);dependency.plan.sequence='C K C R I H';dependency.farm.cash=1e100;
 const d=R.prepare(dependency,R.routes(dependency)[0],3);let n=pay(d.s,d.c,[{type:'research',i:S.RMAP.micro_coupling}]);n=pay(n,d.c,[{type:'shift',egg:4},{type:'car',slot:0}]);
 const dep=E.proposals(d.s,d.c,S.history(n)),removed=dep.find(x=>x.kind==='omit'&&x.i===S.RMAP.micro_coupling);assert.ok(removed);assert.ok(!removed.actions.some(a=>a.type==='car'));
 assert.ok(!dep.some(x=>x.kind==='later-visit'&&x.i===S.RMAP.micro_coupling),'cannot defer train-length research beyond the car that needs it');
 const fleet=fixture();fleet.farm.cash=1e100;fleet.farm.research.autonomous_vehicles=4;fleet.farm.vehicles[16]={id:null,cars:1};
 Object.assign(fleet.plan,{strategy:'user',autoSequence:false,sequence:'C K C H C',solverVersion:2,target:140});
 const f=R.prepare(fleet,R.routes(fleet)[0],3);const fn=pay(f.s,f.c,[{type:'research',i:S.RMAP.autonomous_vehicles},{type:'shift',egg:4},{type:'vehicle',slot:16,id:11},{type:'car',slot:16}]);
 const omitSlot=E.proposals(f.s,f.c,S.history(fn)).find(x=>x.kind==='omit'&&x.i===S.RMAP.autonomous_vehicles);assert.ok(omitSlot);assert.ok(!omitSlot.actions.some(a=>['vehicle','car'].includes(a.type)));

 // A later legal visit is a real alternative when capacity is not required
 // on the intervening K; it retains every selected research level.
 const later=pay(d.s,d.c,[{type:'research',i:S.RMAP.micro_coupling},{type:'shift',egg:4},{type:'shift',egg:0},{type:'research',i:S.RMAP.atomic_purification}]);
 const deferred=E.proposals(d.s,d.c,S.history(later)).find(x=>x.kind==='later-visit'&&x.i===S.RMAP.micro_coupling);assert.ok(deferred);
 const moved=P.execute(d.s,d.c,deferred.actions,{retime:true,recomputeFunding:true});assert.ok(moved);assert.equal(moved.r[S.RMAP.micro_coupling],3);assert.equal(R.replay(dependency,marked(moved,R.routes(dependency)[0])).s.t,moved.t);
 let stopped=pay(d.s,d.c,[{type:'research',i:S.RMAP.micro_coupling},{type:'shift',egg:4}]);
 stopped=S.advance(stopped,d.c,stopped.t+100,'Collect Kindness share of the Truth Egg target');
 const delivered=stopped.eggs[4];stopped=pay(stopped,d.c,[{type:'shift',egg:0},{type:'research',i:S.RMAP.atomic_purification}]);
 const afterStop=E.proposals(d.s,d.c,S.history(stopped)).find(x=>x.kind==='later-visit'&&x.i===S.RMAP.micro_coupling);assert.ok(afterStop);
 const completed=P.execute(d.s,d.c,afterStop.actions,{retime:true,recomputeFunding:true});assert.ok(completed.eggs[4]>=delivered);assert.equal(completed.r[S.RMAP.micro_coupling],3,'a delivery stop cannot silently drop a deferred purchase');assert.equal(completed.r[S.RMAP.atomic_purification],28);assert.equal(R.replay(dependency,marked(completed,R.routes(dependency)[0])).s.t,completed.t);

 // All physical families receive comparisons, including sleep coverage.
 const all=fixture();all.farm.cash=1e100;all.farm.virtue='integrity';all.farm.habs=[17,18,18,18];all.farm.vehicles[0]={id:null,cars:1};
 Object.assign(all.plan,{strategy:'user',autoSequence:false,sequence:'I K R C H C',solverVersion:2,target:200});
 const z=R.prepare(all,R.routes(all)[0],3),allPaid=pay(z.s,z.c,[{type:'hab',slot:0,id:18},{type:'shift',egg:4},{type:'vehicle',slot:0,id:11},{type:'car',slot:0},{type:'shift',egg:3},{type:'silo'}]);
 const allEdits=E.proposals(z.s,z.c,S.history(allPaid));for(const type of ['hab','vehicle','car','silo'])assert.ok(allEdits.some(x=>x.type===type),'comparison covers '+type);
 assert.throws(()=>E.proposals(z.s,z.c,S.history(allPaid),{checkpoint:()=>{throw Error('Cancelled');}}),/Cancelled/);
 const cancelled={...control,cancelled:()=>true,consider:()=>assert.fail('cancelled comparison')};await R.comparePurchaseEconomics(test.raw,{state:test.state,route:test.route,count:3},Date.now()+5000,cancelled);
 console.log('PASS purchase economics: six-order paid comparison, unused capacity deferral, useful capacity retention, all research/physical types, level/tier/engine/car/slot dependencies, later legal visits, immutable input, cancellation and complete target replay.');
}
module.exports={run,capacityPlan};if(require.main===module)run().catch(e=>{console.error(e.stack);process.exitCode=1;});
