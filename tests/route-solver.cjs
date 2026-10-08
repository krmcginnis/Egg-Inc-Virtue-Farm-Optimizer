'use strict';
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),O=require('../src/optimizer.cjs');
const R=require('../src/route-solver.cjs'),L=require('../src/optimizer-legacy.cjs'),Plans=require('../src/research-sale-plans.cjs');
const ShiftPlans=require('../src/shift-plans.cjs'),Automatic=require('../src/automatic-routes.cjs');
const {fixture}=require('./research-sale-plans.cjs');
function verify(raw,result){
 Plans.validate(result);ShiftPlans.validate(result);
 for(const entry of result.researchSalePlans||result.shiftPlans||[{plan:result}]){if(entry.status&&entry.status!=='complete')continue;
  const p=entry.plan,checked=O.replay(raw,p.actions,true,{enforceOpeningCaps:true});
  assert.equal(checked.s.t,p.end);assert.equal(checked.s.stage,p.switches);assert.ok(S.reached(checked.s,checked.c));
  assert.equal(p.solverVersion,2);assert.equal(p.openingTimeLimits,false);assert.ok(p.actualResearchSales<=p.researchSales);
  if(raw.plan.strategy!=='user')assert.ok(p.switches<=Automatic.limit(raw),'returned plans respect the shift ceiling');
  const actions=S.history(checked.s);assert.deepEqual(actions[0].routeSearch,p.actions[0].routeSearch);
  assert.equal(O.replay(raw,actions).s.t,p.end,'second save/load retains solver rules');
  let stage=0;for(const a of p.actions){if(a.type==='shift'){stage++;assert.equal(a.egg,checked.c.sequence[stage]);}
   if(a.type==='research'){assert.ok(stage<checked.c.finalCStage,'final C is research-free');assert.ok(a.t+checked.c.actionsSeconds<=p.researchDeadline+1e-6);}}
 }
 return result;
}
async function run(){
 assert.ok(R.better({t:100,stage:1,path:null},{t:100,stage:2,path:null}));
 assert.ok(!R.better({t:101,stage:1,path:null},{t:100,stage:2,path:null}));
 // Completed paid paths can recover neighboring shift counts without
 // inventing purchases or padding a timeline with unnecessary shifts.
 const deliveryCase=fixture();Object.assign(deliveryCase.plan,{strategy:'user',autoSequence:false,sequence:'C K I R H',target:105,floors:Array(5).fill(21)});
 const deliveryContext=R.prepare(deliveryCase,R.routes(deliveryCase)[0],3),paid=L.tail(deliveryContext.s,deliveryContext.c);assert.ok(paid&&paid.stage===4);
 const flexible=structuredClone(deliveryCase);flexible.plan.floors=Array(5).fill(0);
 const flexibleContext=R.prepare(flexible,R.routes(flexible)[0],3);
 const source={state:paid,context:flexibleContext.c,route:R.routes(flexible)[0],count:3};
 const shorter=R.completionAlternatives(flexible,source,[3,2]);assert.deepEqual(shorter.map(n=>n.stage),[3,2]);
 for(const n of shorter){const actions=S.history(n).map((a,i)=>i?a:{...a,routeSearch:{version:2,sequence:source.route,researchSales:3},initialSiloRule:'one'});const checked=O.replay(flexible,actions);assert.ok(S.reached(checked.s,checked.c));assert.equal(checked.s.t,n.t);assert.equal(actions.filter(a=>a.type==='shift').length,n.stage);}
 assert.equal(R.completionAlternatives(deliveryCase,{...source,context:deliveryContext.c},[3,2]).length,0,'required per-Virtue floors cannot be dropped to fill comparisons');
 assert.throws(()=>R.completionAlternatives(flexible,source,[3],()=>{throw Error('Cancelled');}),/Cancelled/);
 // Higher earnings on the current C visit can lose to shifting earlier,
 // paying for K/I, and spending the research time on the next C instead.
 const buildCase=require('../src/blank-farm.cjs')(1791993600);
 const gear=[{artifactId:'lunar-totem-4-3',stones:['lunar-stone-4']},{artifactId:'demeters-necklace-4-3',stones:[]},{artifactId:'tungsten-ankh-3-3',stones:[]},{artifactId:'puzzle-cube-4-2',stones:[]}];
 Object.assign(buildCase.farm,{soulEggs:1e30,claimed:Array(5).fill(32),delivered:Array(5).fill(S.D.te[31]),epic:Object.fromEntries(S.D.epic.map(r=>[r.id,r.levels])),proPermit:true,videoDoubler:true,colleggtibles:{awayEarnings:6},loadouts:{current:gear,earnings:structuredClone(gear),delivery:structuredClone(gear)}});
 Object.assign(buildCase.plan,{strategy:'user',autoSequence:false,sequence:'C K I C H K C R H I',target:180});
 const buildContext=R.prepare(buildCase,R.routes(buildCase)[0],3),T=require('../src/staged-route.cjs'),Recipes=require('../src/wasmegg-stage-engine.cjs');
 const prefix=minutes=>T.step(buildContext.s,buildContext.c,'C1',0,(s,c)=>Recipes.runC1(s,c,minutes*60),minutes*60);
 const earlierBuild=prefix(180),laterBuild=prefix(1440),continued=[];
 assert.ok(S.stats(laterBuild,buildContext.c).earning>S.stats(earlierBuild,buildContext.c).earning,'longer C1 has higher immediate earnings');
 const departures=await R.compareDepartures([laterBuild,earlierBuild],buildContext.c,Date.now()+15000,{width:4,continuationsCompared:0,cancelled:()=>false,yield:async()=>{},consider:n=>continued.push(n)});
 assert.equal(departures.length,2);assert.ok(departures[0].state===earlierBuild,'paid whole-plan completion favors earlier C1 departure over higher current earnings');
 assert.ok(departures[0].end.t<departures[1].end.t-86400);
 for(const n of continued){const actions=S.history(n).map((a,i)=>i? a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence:R.routes(buildCase)[0],researchSales:3}});const checked=O.replay(buildCase,actions);assert.ok(S.reached(checked.s,checked.c));assert.equal(checked.s.t,n.t);}
 assert.ok(continued.some(n=>S.history(n).some(a=>a.type==='vehicle'||a.type==='car')),'continuations pay for physical purchases');
 const sampled=R.openingDepartures(buildContext.s,buildContext.c,S.history(continued[0]));assert.ok(sampled.every(n=>n.stage===0));assert.ok(sampled.some(n=>n.t<laterBuild.t));
 // A shortened route's last pre-launch C/K visits must collect fuel;
 // legacy phase names must not skip fueling on an arbitrary new route.
 const fuelCase=fixture();Object.assign(fuelCase.plan,{strategy:'user',autoSequence:false,sequence:'C K I C R H C',target:105,ships:{mode:'custom-two-visits',slots:3,visits:[{missions:[{ship:'HENERPRISE',duration:'EPIC',count:1}]},{missions:[]}]}});
 fuelCase.farm.fuelTank={capacity:500e12,outputPerMinute:9e12,amounts:Object.fromEntries(S.EGGS.map(e=>[e,0]))};
 const fuelContext=R.prepare(fuelCase,R.routes(fuelCase)[0],3),fueled=R.seedRoute(fuelContext.s,fuelContext.c,180,()=>{});assert.ok(fueled&&fueled.shipsDone);
 const fuelActions=S.history(fueled),launchIndex=fuelActions.findIndex(a=>a.type==='ship-run');assert.ok(launchIndex>=0);assert.ok(fuelActions.slice(0,launchIndex).some(a=>a.type==='fuel'&&a.egg===0));assert.ok(fuelActions.slice(0,launchIndex).some(a=>a.type==='fuel'&&a.egg===4));
 const fuelMarked=fuelActions.map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence:R.routes(fuelCase)[0],researchSales:3}});assert.ok(S.reached(O.replay(fuelCase,fuelMarked).s,fuelContext.c));
 assert.equal(R.completionAlternatives(fuelCase,{state:fueled,context:fuelContext.c,route:R.routes(fuelCase)[0],count:3},[4]).length,0,'missing shift comparisons cannot omit a required Humility launch');
 const raw=fixture(),fastest=verify(raw,await O.solve(raw,{maxMs:1800,width:4}));assert.equal(fastest.researchSalePlans,undefined);assert.equal(fastest.selectedResearchSales,undefined);assert.ok(fastest.shiftPlans.length<=3);assert.equal(new Set(fastest.shiftPlans.map(e=>e.switches)).size,fastest.shiftPlans.length);assert.equal(fastest.selectedSwitches,fastest.recommendedSwitches);for(let i=1;i<fastest.shiftPlans.length;i++)assert.ok(!R.better({t:fastest.shiftPlans[i].plan.end,stage:fastest.shiftPlans[i].switches},{t:fastest.shiftPlans[i-1].plan.end,stage:fastest.shiftPlans[i-1].switches}));const opts={maxMs:1800,width:4,returnComparisons:true};
 assert.equal(R.routes(raw)[0].at(-1),'integrity');assert.ok(R.routes(raw).some(route=>route.at(-1)==='humility'),'a faster delivery order may finish elsewhere');
 const result=verify(raw,await O.solve(raw,opts));assert.deepEqual(result.researchSalePlans.map(e=>e.status),['complete','complete','complete']);
 const baseline=await L.solve(raw,{disableOpeningSearch:true,disableOfflineBatches:true});
 for(const e of result.researchSalePlans){const p=R.prepare(raw,e.plan.route,e.researchSales),end=require('../src/staged-route.cjs').run(p.s,{...p.c,enforceOpeningCaps:true,c1MaxMinutes:60,k1MaxMinutes:60},e.researchSales,L.completionGoals);assert.ok(e.plan.end<=end.t+1e-6,'compatible baseline retained under the SAME route/final-farm constraint');}
 // An arbitrary three-C route uses two research visits, preserves every
 // transition, and enforces a manual TE floor on the final delivery visits.
 const custom=fixture();custom.farm.research.comfy_nests=40;
 Object.assign(custom.plan,{strategy:'user',autoSequence:false,sequence:'C K I C H K C I R H',floors:[29,20,20,20,20],c1MaxMinutes:'obsolete invalid',k1MaxMinutes:-1});
 const manual=verify(custom,await O.solve(custom,opts));assert.ok(manual.finalTE[0]>=29);assert.ok(manual.actions.some(a=>a.type==='research'));
 assert.deepEqual(manual.route,R.routes(custom)[0]);assert.equal(R.prepare(custom,manual.route,1).c.finalResearchStage,3);
 for(const sequence of ['C K I R H','K I R H']){
  const f=fixture();f.farm.research.comfy_nests=40;f.farm.virtue=sequence[0]==='K'?'kindness':'curiosity';Object.assign(f.plan,{strategy:'user',autoSequence:false,sequence});
  const r=verify(f,await O.solve(f,{maxMs:800,width:4,returnComparisons:true}));assert.ok(r.researchSalePlans.every(e=>e.status==='complete'));assert.ok(!r.actions.some(a=>a.type==='research'),'one or zero C visits use existing research');
 }
 const reached=fixture();reached.plan.target=100;const done=verify(reached,await O.solve(reached,opts));assert.equal(done.seconds,0);
 for(const ceiling of [0,2,4,8]){const f=fixture();f.plan.maxShifts=ceiling;f.plan.target=ceiling===0?100:105;const r=verify(f,await O.solve(f,{maxMs:800,width:4}));assert.ok(r.shiftPlans.every(e=>e.switches<=ceiling));if(ceiling===0){assert.equal(r.selectedSwitches,0);assert.equal(r.seconds,0);}}
 const invalidCeiling=fixture();invalidCeiling.plan.maxShifts=-1;await assert.rejects(()=>O.solve(invalidCeiling,opts),/Maximum new shifts/);
 const corruptShift=structuredClone(fastest);corruptShift.shiftPlans.push(corruptShift.shiftPlans[0]);assert.throws(()=>ShiftPlans.validate(corruptShift),/shift-count/);
 const partial=fixture();let stop=false;const stopped=verify(partial,await O.solve(partial,opts,p=>{if(p.researchSales===2)stop=true;},()=>stop));assert.equal(stopped.researchSalePlans[0].status,'complete');assert.equal(stopped.researchSalePlans[2].status,'not-completed');
 const invalid=structuredClone(manual);invalid.actions[0].routeSearch.sequence=['curiosity','humility'];assert.throws(()=>O.replay(custom,invalid.actions),/route differs/);
 // Calendar deadlines include a currently active sale and respect timezone.
 const friday=fixture();friday.plan.start=Date.UTC(2026,9,9,9)/1000;friday.plan.eventTimezone='UTC';const pc=R.prepare(friday,R.routes(friday)[0],1);
 assert.equal(pc.c.researchDeadline,Date.UTC(2026,9,10,9)/1000);assert.equal(R.prepare(friday,R.routes(friday)[0],3).c.researchDeadline,Date.UTC(2026,9,24,9)/1000);
 const last={...pc.s,stage:pc.c.finalCStage};assert.equal(S.allowed(last,pc.c,{type:'research',i:S.RMAP.comfy_nests}),false);
 // Physical upgrades can have future delivery value despite an immediate
 // shipping bottleneck, including when there is only one Integrity visit.
 const build=fixture();build.farm.habs=[0,null,null,null];build.farm.vehicles=build.farm.vehicles.map((v,i)=>({id:i?null:0,cars:1}));
 Object.assign(build.plan,{strategy:'user',autoSequence:false,sequence:'C I K C H C'});
 const prepared=R.prepare(build,R.routes(build)[0],1),onI=S.buy(prepared.s,prepared.c,{type:'shift',egg:1});
 assert.ok(R.scored(onI,prepared.c).some(x=>x.a.type==='hab'&&x.a.id===18),'future K/research supports useful hab capacity');
 const early={...prepared.s,path:null,cash:10},late=S.advance(early,prepared.c,early.t+60,'test',false);assert.ok(R.dominates(early,late,prepared.c));
 const legacySaved=baseline.researchSalePlans[0].plan;assert.equal(O.replay(raw,legacySaved.actions,false,{enforceOpeningCaps:true}).s.t,legacySaved.end);
 console.log('PASS route/shift solver: neighboring shift-count recovery with replay, required floors/missions and cancellation, whole-plan departure opportunity cost, later physical upgrades, arbitrary-route fueling, ceiling and distinct ranked shift plans, zero-shift completion, preserved legacy baseline/replay, internal sale windows, arbitrary three-C route, final-C rules, delivery-only single/no-C routes, manual floors, uncapped timing, calendar boundaries, physical lookahead, saved rule replay, cancellation, and route integrity.');
}
module.exports={verify};if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
