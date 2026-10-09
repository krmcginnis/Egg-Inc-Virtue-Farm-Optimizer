'use strict';
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),R=require('../src/route-solver.cjs');
const E=require('../src/earnings-first-research.cjs'),P=require('../src/schedule-proposals.cjs'),L=require('../src/optimizer-legacy.cjs');
const {fixture}=require('./research-sale-plans.cjs');
function farm(){
 const raw=fixture();Object.assign(raw.plan,{start:1791993600,strategy:'user',autoSequence:false,sequence:'C K C H C',target:101,solverVersion:2,actionSeconds:.3});
 raw.farm.vehicles=Array.from({length:17},(_,i)=>({id:i<4?11:null,cars:1}));
 raw.farm.research.vehicle_reliablity=1;raw.farm.research.nutritional_sup=39;
 return raw;
}
function proposed(s,c,ids){return ids.map(id=>({type:'research',i:S.RMAP[id],from:s.r[S.RMAP[id]],to:s.r[S.RMAP[id]]+1,t:s.t}));}
function pay(s,c,actions){let n=s;for(const a of actions){const ready=S.afford(n,c,a);assert.ok(ready);n=S.buy(ready,c,a);}return n;}
function marked(n,route){return S.history(n).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence:route,researchSales:3}});}
async function run(){
 const raw=farm(),route=R.routes(raw)[0],p=R.prepare(raw,route,3),s={...p.s,cash:0},c={...p.c};
 // Normalize only this tiny synthetic context's income so the funding waits
 // are measurable. Enumerate both legal orders independently of the sorter.
 const actions=proposed(s,c,['vehicle_reliablity','nutritional_sup']);
 c.earningsScale*=S.price(s,c,actions[0])/600/S.stats(s,c).earning;
 const normal=pay(s,c,actions),reverse=pay(s,c,actions.slice().reverse()),ordered=E.run(s,c,actions).state;
 assert.ok(reverse.t<normal.t-1,'early income repays before an unused vehicle slot');
 assert.equal(ordered.t,Math.min(normal.t,reverse.t),'matches the exhaustive two-purchase minimum');
 assert.deepEqual(ordered.r,normal.r);assert.equal(S.stats(ordered,c).delivery,S.stats(normal,c).delivery);
 assert.equal(S.history(ordered).find(a=>a.type==='research').i,S.RMAP.nutritional_sup);
 assert.equal(S.history(ordered).filter(a=>a.type==='research').at(-1).earningsFirstReason,'departure');

 // Shipping research really does earn immediately on a shipping-limited
 // farm. Do not defer every capacity category as a blanket rule.
 const active=S.clone(s);active.r[S.RMAP.leafsprings]=29;
 const activeActions=proposed(active,c,['leafsprings','nutritional_sup']);
 assert.ok(S.stats(S.mutate(active,c,activeActions[0]),c).earning>S.stats(active,c).earning);
 const activeOrder=E.run(active,c,activeActions).state;assert.equal(S.history(activeOrder).find(a=>a.type==='research').i,S.RMAP.leafsprings);

 // Shipping headroom is useful only after laying catches up. Buy the laying
 // level that earns now before its complementary shipping level.
 const complementary=S.clone(p.s);complementary.r[S.RMAP.comfy_nests]=49;complementary.r[S.RMAP.leafsprings]=29;
 const complementContext={...p.c,mods:structuredClone(p.c.mods)},rates=S.stats(complementary,complementContext);
 complementContext.mods[complementary.set].shipping*=rates.laying*1.003/rates.shipping;
 const complementActions=proposed(complementary,complementContext,['leafsprings','comfy_nests']);
 assert.equal(S.stats(S.mutate(complementary,complementContext,complementActions[0]),complementContext).earning,S.stats(complementary,complementContext).earning);
 const complementOrder=E.run(complementary,complementContext,complementActions).state;
 assert.equal(S.history(complementOrder).find(a=>a.type==='research').i,S.RMAP.comfy_nests);
 assert.deepEqual(complementOrder.r,pay(complementary,complementContext,complementActions).r);
 const balanced={...complementContext,mods:structuredClone(complementContext.mods)};
 balanced.mods[complementary.set].shipping/=1.003;
 const together=E.run(complementary,balanced,complementActions).state;
 assert.ok(S.stats(together,balanced).earning>S.stats(complementary,balanced).earning);
 assert.equal(S.history(together).find(a=>a.type==='research').earningsFirstReason,'enables earnings');

 // A cheap, non-income prerequisite unlocks a selected income upgrade even
 // when another earning level remains available. Enumerate the dependency.
 const blank=require('../src/blank-farm.cjs')(1791993600);Object.assign(blank.farm,{cash:1e30,soulEggs:1e30,research:{comfy_nests:50,nutritional_sup:29},habs:[18,18,18,18],vehicles:Array.from({length:17},(_,i)=>({id:i<4?11:null,cars:1}))});
 Object.assign(blank.plan,{strategy:'user',autoSequence:false,sequence:'C K C',target:1});
 const q=R.prepare(blank,R.routes(blank)[0],3),needed=proposed(q.s,q.c,['nutritional_sup','leafsprings']);
 assert.ok(!S.isUnlocked(q.s,S.RMAP.leafsprings));
 const unlocked=E.run(q.s,q.c,needed).state;assert.equal(unlocked.r[S.RMAP.nutritional_sup],30);assert.equal(unlocked.r[S.RMAP.leafsprings],1);
 const nonIncome=proposed(q.s,q.c,['better_incubators','leafsprings','nutritional_sup']);
 const prereq=E.run(q.s,q.c,nonIncome).state;assert.equal(S.history(prereq).find(a=>a.type==='research').i,S.RMAP.better_incubators);
 assert.equal(S.history(prereq).find(a=>a.type==='research').earningsFirstReason,'tier unlock');

 const offline={...c,earningsMode:'offline',offlineMinSeconds:600,earningsScale:c.earningsScale/100};offline.mods={...c.mods,[s.set]:{...c.mods[s.set],away:100}};
 const away=E.run(s,offline,actions).state,breaks=S.history(away).filter(a=>a.type==='wait'&&a.earningsMode==='offline');
 assert.ok(breaks.length>0);assert.ok(breaks.every(a=>a.end-a.t>=600));
 const sale=c.calendar.find(event=>event.sale===.3),discounted=actions.map(a=>({...a,t:sale.t}));
 const saleOrder=E.run(p.s,p.c,discounted).state;
 assert.ok(S.history(saleOrder).filter(a=>a.type==='research').every(a=>a.t>=sale.t&&S.at(p.c,a.t).sale===.3),'preserves selected sale prices');
 assert.throws(()=>E.run({...s,egg:1},c,actions),/Curiosity/);
 assert.throws(()=>E.run(s,{...c,end:s.t+.1},actions),/Cannot fund/);
 assert.throws(()=>E.run(s,c,actions,{checkpoint:()=>{throw Error('Cancelled');}}),/Cancelled/);
 assert.throws(()=>E.run(s,c,[{type:'research',i:999,to:1,t:s.t}]),/Invalid proposed/);
 assert.throws(()=>E.run(s,c,[{...actions[0],from:Infinity}]),/Invalid proposed/);
 assert.throws(()=>E.run(s,c,[{...actions[0],from:actions[0].from-1}]),/Invalid proposed/);
 assert.throws(()=>E.run(s,c,[{...actions[0],t:NaN}]),/Invalid proposed/);
 const grouped=S.clone(s);grouped.r[S.RMAP.vehicle_reliablity]=0;
 const group=E.targets(grouped,c,[{type:'research',i:S.RMAP.vehicle_reliablity,to:2,t:s.t}]);
 assert.equal(group.order.get(S.RMAP.vehicle_reliablity+':0'),0);assert.equal(group.order.get(S.RMAP.vehicle_reliablity+':1'),0);
 assert.equal(E.run(grouped,c,[{type:'research',i:S.RMAP.vehicle_reliablity,to:2,t:s.t}]).purchases,2);

 // Reexecute two different C visits, then strictly replay the complete paid
 // route. Selection changes no farming input, goals or allowed visit order.
 const full=farm();full.farm.research.padded_packaging=29;full.farm.research.autonomous_vehicles=4;
 const prepared=R.prepare(full,R.routes(full)[0],3);let n=prepared.s;
 n=pay(n,prepared.c,proposed(n,prepared.c,['vehicle_reliablity','nutritional_sup']));
 n=S.buy(n,prepared.c,{type:'shift',egg:4});n=S.buy(n,prepared.c,{type:'shift',egg:0});
 n=pay(n,prepared.c,proposed(n,prepared.c,['autonomous_vehicles','padded_packaging']));
 const baseline=L.tail(n,prepared.c);assert.ok(baseline);
 const template=marked(baseline,R.routes(full)[0]);assert.equal(R.replay(full,template).s.t,baseline.t);
 const all=P.execute(prepared.s,prepared.c,template,{earningsFirst:true,retime:true,compress:true});assert.ok(all);assert.equal(R.replay(full,marked(all,R.routes(full)[0])).s.t,all.t);
 const purchases=S.history(all).filter(a=>a.type==='research');
 assert.ok(purchases.findIndex(a=>a.i===S.RMAP.nutritional_sup)<purchases.findIndex(a=>a.i===S.RMAP.vehicle_reliablity));
 assert.ok(purchases.findIndex(a=>a.i===S.RMAP.padded_packaging)<purchases.findIndex(a=>a.i===S.RMAP.autonomous_vehicles));
 let comparisons=0;const control={researchOrderComparisons:0,cancelled:()=>false,yield:async()=>{},consider:state=>{comparisons++;assert.equal(R.replay(full,marked(state,R.routes(full)[0])).s.t,state.t);}};
 await R.compareResearchOrders(full,{state:baseline,route:R.routes(full)[0],count:3},Date.now()+5000,control);
 assert.ok(comparisons>=2);assert.ok(control.researchOrderComparisons>=2);
 await R.compareResearchOrders(full,{state:baseline,route:R.routes(full)[0],count:3},Date.now()+5000,{...control,cancelled:()=>true,consider:()=>assert.fail('cancelled comparison')});
 const found=await R.solve(full,{maxMs:500,width:4,incumbent:{config:full,result:{solverVersion:2,end:baseline.t,seconds:baseline.t-prepared.c.start,switches:baseline.stage,actions:template}}});
 assert.ok(found.end<=baseline.t+1e-6);assert.ok(found.search.researchOrderComparisons>0);
 console.log('PASS earnings-first research: exhaustive two-order funding optimum, inactive slots versus productive shipping, complementary capacity, tier unlocks, sale prices, offline minimums, invalid/deadline/cancellation guards, both C visits, full paid replay and solver/incumbent integration.');
}
module.exports={run};if(require.main===module)run().catch(e=>{console.error(e.stack);process.exitCode=1;});
