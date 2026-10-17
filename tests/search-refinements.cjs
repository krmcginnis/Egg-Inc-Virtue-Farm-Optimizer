'use strict';
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),R=require('../src/route-solver.cjs'),P=require('../src/schedule-proposals.cjs'),E=require('../src/purchase-economics.cjs');
const {Prefixes}=require('../src/schedule-prefixes.cjs'),Packages=require('../src/purchase-packages.cjs'),Adaptive=require('../src/adaptive-refinement.cjs');
const C=require('../src/plan-continuation.cjs'),Progress=require('../src/plan-progress.cjs'),ShiftPlans=require('../src/shift-plans.cjs');
const Ships=require('../src/ships.cjs');
const {fixture}=require('./research-sale-plans.cjs'),{capacityPlan}=require('./purchase-economics.cjs');
function mark(n,route){return S.history(n).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence:route,researchSales:3}});}
function savedAlternatives(){
 const raw=fixture(),now=Date.now()/1000;Object.assign(raw.farm,{shiftCount:47,cash:1e50,manualFarmData:true});
 Object.assign(raw.plan,{start:now-600,strategy:'auto',autoSequence:true,maxShifts:2,maxSwitches:2,target:102,floors:[21,20,20,20,21],ships:{mode:'none'},sleep:{enabled:false}});
 const routes=[['curiosity','kindness','curiosity'],['curiosity','kindness']],p=R.prepare(raw,routes[0],3),rate=S.stats(p.s,p.c).delivery;
 raw.farm.delivered[0]=S.D.te[20]-rate*60;raw.farm.delivered[4]=S.D.te[20]-rate*60;
 const plans=routes.map((route,i)=>{
  const p=R.prepare(raw,route,3);let n=p.s;
  if(i===1)n=S.advance(n,p.c,n.t+60.001,'Collect Curiosity Truth Egg milestones');
  n=S.buy(n,p.c,{type:'shift',egg:4});n=S.advance(n,p.c,n.t+60.001,'Collect Kindness Truth Egg milestones');
  if(i===0){n=S.buy(n,p.c,{type:'shift',egg:0});n=S.advance(n,p.c,n.t+60.001,'Collect Curiosity Truth Egg milestones');}
  return {version:1,solverVersion:2,target:102,start:p.c.start,end:n.t,seconds:n.t-p.c.start,switches:n.stage,actions:mark(n,route)};
 });
 const result=ShiftPlans.select({shiftPlans:plans.map(plan=>({switches:plan.switches,plan})),recommendedSwitches:2},2),snapshot=structuredClone(raw);snapshot.importInfo={scope:'farm',timestamp:now-1};
 return {config:raw,result,start:now,progress:{snapshot,confirmed:[],launched:{},planKey:Progress.key(result)}};
}
function launchAlternatives(incompatible=false){
 const base=require('./plan-continuation.cjs').ships(),raw=base.config,now=Date.now()/1000;
 Object.assign(raw.plan,{strategy:'auto',autoSequence:true,maxShifts:5,maxSwitches:5,sleep:{enabled:false}});
 const routes=incompatible?[['curiosity','humility','kindness','integrity','curiosity','humility'],['curiosity','kindness','humility','curiosity','humility']]:[['curiosity','humility','kindness','curiosity','humility'],['curiosity','humility','curiosity','humility']];
 const plans=routes.map((route,i)=>{const {s,c}=R.prepare(raw,route,3),ctx={...c,shipReplay:true,sleepReplay:false,deferShips:true};let n=i===0?S.advance(s,c,s.t+1,'Different saved opening'):s;
  for(const egg of route.slice(1)){n=S.buy(n,ctx,{type:'shift',egg:S.EGGS.indexOf(egg)});if(egg==='humility')n=Ships.launch(n,ctx);}
  return {version:1,solverVersion:2,target:raw.plan.target,start:c.start,end:n.t,seconds:n.t-c.start,switches:n.stage,actions:mark(n,route)};});
 const result=ShiftPlans.select({shiftPlans:plans.map(plan=>({switches:plan.switches,plan})),recommendedSwitches:plans[0].switches},plans[0].switches),index=result.actions.findIndex(a=>a.type==='ship-run');
 return {config:raw,result,start:now,progress:{snapshot:base.progress.snapshot,confirmed:[],launched:{[index]:[1]},planKey:Progress.key(result)}};
}
async function run(){
 const test=capacityPlan(),p=R.prepare(test.raw,test.route,3),cache=new Prefixes(p.s,p.c),options={retime:true,recomputeFunding:true},edits=E.proposals(p.s,p.c,test.plan.actions);
 for(const actions of [test.plan.actions,...edits.slice(0,6).map(e=>e.actions)]){
  const plain=P.execute(p.s,p.c,actions,options),reused=P.execute(p.s,p.c,actions,{...options,prefixes:cache});
  assert.deepEqual(S.history(reused),S.history(plain),'prefix reuse exactly preserves prices, funding, interactions and delivery');assert.equal(reused.t,plain.t);assert.equal(R.replay(test.raw,mark(reused,test.route)).s.t,reused.t);
 }
 assert.ok(cache.hits>0);assert.ok(cache.entries<=768);
 const first=P.execute(p.s,p.c,test.plan.actions,{...options,prefixes:cache}),end=first.t;first.r[0]=0;first.cash=0;assert.equal(P.execute(p.s,p.c,test.plan.actions,{...options,prefixes:cache}).t,end);
 assert.throws(()=>P.execute(S.clone(p.s),p.c,test.plan.actions,{...options,prefixes:cache}),/different starting farm/);
 assert.throws(()=>P.execute(p.s,p.c,test.plan.actions,{...options,preserveCalendar:false,prefixes:cache}),/different execution mode/);
 assert.throws(()=>P.execute(p.s,p.c,test.plan.actions,{...options,prefixes:cache,checkpoint:()=>{throw Error('Cancelled');}}),/Cancelled/);
 const small=new Prefixes(p.s,p.c,{maxEntries:2});P.execute(p.s,p.c,test.plan.actions,{...options,prefixes:small});assert.equal(small.entries,2);
 const atomic={type:'research',i:S.RMAP.atomic_purification},ready=S.afford(p.s,p.c,atomic),earlyIncome=S.buy(ready,p.c,atomic);
 const continued=P.execute(earlyIncome,p.c,test.plan.actions,{...options,honorTargets:true});
 assert.deepEqual(continued.r,test.state.r,'a new package still funds every unpaid template level');
 assert.equal(S.history(continued).filter(a=>a.type==='research'&&a.i===atomic.i).length,1,'a paid package level is not charged twice by its continuation');
 assert.equal(R.replay(test.raw,mark(continued,test.route)).s.t,continued.t);
 const missions=require('./plan-continuation.cjs').ships(),m=R.prepare(missions.config,R.routes(missions.config)[0],3),missionCache=new Prefixes(m.s,m.c);
 const missionPlain=P.execute(m.s,m.c,missions.result.actions,options);P.execute(m.s,m.c,missions.result.actions,{...options,prefixes:missionCache});
 const missionReused=P.execute(m.s,m.c,missions.result.actions,{...options,prefixes:missionCache});assert.deepEqual(S.history(missionReused),S.history(missionPlain));assert.equal(missionReused.t,missionPlain.t);assert.equal(R.replay(missions.config,mark(missionReused,R.routes(missions.config)[0])).s.t,missionReused.t);

 // A seed's replay context has no inventory search model. Any automatic
 // equip selected by a new continuation must keep its owned-gear snapshot.
 const gear=require('./plan-continuation.cjs').automaticArtifacts(),equip=gear.result.actions.find(a=>a.type==='set'),gearReplay=R.replay(gear.config,gear.result.actions,true);
 assert.ok(!gearReplay.c.artifactModel);const continuedEquip=S.artifactAction(equip.set,gearReplay.c);
 assert.deepEqual(continuedEquip.loadout,equip.loadout);assert.deepEqual(S.recordedArtifactSets([continuedEquip])[equip.set],equip.loadout);


 // Neither side of an exactly balanced production bottleneck earns by
 // itself. The new package search must pay for both unselected levels.
 const raw=fixture();Object.assign(raw.farm,{cash:1e100});Object.assign(raw.farm.research,{comfy_nests:49,leafsprings:29});Object.assign(raw.plan,{strategy:'user',autoSequence:false,sequence:'C K C H C',target:140});
 const q=R.prepare(raw,R.routes(raw)[0],3),rates=S.stats(q.s,q.c);q.c.mods[q.s.set].shipping*=rates.laying/rates.shipping;
 const before=S.stats(q.s,q.c),lay=S.RMAP.comfy_nests,ship=S.RMAP.leafsprings;
 for(const i of [lay,ship])assert.ok(S.stats(S.mutate(q.s,q.c,{type:'research',i}),q.c).delivery<=before.delivery*(1+1e-12));
 const grown=Packages.grow(q.s,q.c,{maxDepth:2}),pair=grown.candidates.find(x=>x.actions.some(a=>a.i===lay)&&x.actions.some(a=>a.i===ship));assert.ok(pair);assert.ok(S.stats(pair.state,q.c).delivery>before.delivery*1.001);assert.equal(pair.state.r[lay],50);assert.equal(pair.state.r[ship],30);
 const purchases=S.history(pair.state).filter(a=>a.type==='research');assert.equal(purchases.length,2);assert.ok(purchases.every(a=>a.cost>0));
 const earned=S.history(pair.state).filter(a=>a.type==='wait').reduce((n,a)=>n+a.cashGained,0),paid=purchases.reduce((n,a)=>n+a.cost,0);assert.ok(Math.abs(pair.state.cash-(q.s.cash+earned-paid))<=q.s.cash*1e-12);
 const physical=fixture();physical.farm.virtue='kindness';physical.farm.vehicles[0]={id:null,cars:1};physical.farm.cash=1e100;Object.assign(physical.plan,{strategy:'user',autoSequence:false,sequence:'K C H C',target:140});
 const h=R.prepare(physical,R.routes(physical)[0],3),engines=Packages.grow(h.s,h.c,{maxDepth:3});assert.ok(engines.candidates.some(x=>x.actions[0]?.type==='vehicle'&&x.actions[0].id===11&&x.actions.some(a=>a.type==='car')),'engine and car capacity are paid together');
 assert.throws(()=>Packages.grow(q.s,q.c,{checkpoint:()=>{throw Error('Cancelled');}}),/Cancelled/);

 // New winners open fresh work, completed work is never repeated, and an
 // exhausted queue stops without consuming the remainder of its time budget.
 let best=test.state,revision=0;const calls=[],better=edits.find(e=>e.kind==='after-earnings'&&e.i===S.RMAP.micro_coupling);
 const result=await Adaptive.run({deadline:Date.now()+1000,maxJobs:6,jobs:()=>['orders','packages'].map(kind=>({id:revision+':'+kind,kind,level:0,run:async()=>{calls.push(revision+':'+kind);const n=P.execute(p.s,p.c,better.actions,options);if(R.better(n,best)){best=n;revision++;}}})),quality:()=>({revision,best:best.t})});
 assert.ok(best.t<test.state.t-20);assert.equal(new Set(calls).size,calls.length);assert.equal(result.termination,'exhausted');assert.ok(result.jobs>=3);
 const stopped=await Adaptive.run({jobs:()=>assert.fail('cancelled queue requested work'),deadline:Date.now()+1000,cancelled:()=>true});assert.equal(stopped.jobs,0);assert.equal(stopped.termination,'cancelled');

 const req=savedAlternatives(),pristine=JSON.stringify(req),prepared=C.prepare(req),alternatives=C.alternatives(req,prepared);assert.equal(alternatives.length,1);assert.equal(alternatives[0].remainingSwitches,1);assert.equal(alternatives[0].plan.target,102);C.verified(prepared.config,alternatives[0].plan);
 const found=await C.search(req,{maxMs:600,width:4});assert.ok(found.result.search.retainedPlans>=2);assert.ok(found.result.end<=alternatives[0].end+.01);assert.equal(found.remainingShiftBudget,2);assert.equal(JSON.stringify(req),pristine);
 const bad=structuredClone(req);bad.result.shiftPlans.find(e=>e.switches===1).plan.end++;assert.equal(C.alternatives(bad,C.prepare(bad)).length,0,'a corrupt saved alternative cannot enter the search');
 const expired=C.alternatives(req,prepared,{checkpoint:()=>{throw Error('Cancelled');}});assert.equal(expired.length,0);
 const launched=launchAlternatives(),launchInput=JSON.stringify(launched),launchPrepared=C.prepare(launched),launchSeeds=C.alternatives(launched,launchPrepared);assert.equal(launchSeeds.length,1);
 assert.deepEqual(launchSeeds[0].plan.actions.filter(a=>a.type==='ship-run').map(a=>a.count),[1,1],'partial reviewed launches map across different action indices');assert.equal(launchPrepared.remainingLaunches,2);assert.equal(JSON.stringify(launched),launchInput);
 const incompatible=launchAlternatives(true);assert.equal(C.alternatives(incompatible,C.prepare(incompatible)).length,0,'a different visited prefix cannot inherit launch reviews');
 let packageCount=0;await R.comparePurchasePackages(test.raw,{state:test.state,route:test.route,count:3},Date.now()+2000,{cancelled:()=>false,yield:async()=>{},consider:n=>{packageCount++;assert.equal(R.replay(test.raw,mark(n,test.route)).s.t,n.t);}});assert.ok(packageCount>0);
 const refined=await R.solve(test.raw,{maxMs:5000,width:4,incumbent:{config:test.raw,result:test.plan}});assert.ok(refined.search.adaptive?.jobs>0);assert.ok(refined.search.packageComparisons>0);assert.ok(refined.end<=test.plan.end+.01);assert.equal(R.replay(test.raw,refined.actions).s.t,refined.end);

 console.log('PASS search refinements: exact paid prefix reuse, bounded isolated caches, cancellation, new complementary capacity and engine/car packages, adaptive distinct work, and revalidated alternative routes within the original shift budget.');
}
module.exports={run,savedAlternatives};if(require.main===module)run().catch(e=>{console.error(e.stack);process.exitCode=1;});
