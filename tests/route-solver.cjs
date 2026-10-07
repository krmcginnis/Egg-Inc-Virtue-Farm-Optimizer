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
 console.log('PASS route/shift solver: ceiling and distinct ranked shift plans, zero-shift completion, preserved legacy baseline/replay, internal sale windows, arbitrary three-C route, final-C rules, delivery-only single/no-C routes, manual floors, uncapped timing, calendar boundaries, physical lookahead, saved rule replay, cancellation, and route integrity.');
}
module.exports={verify};if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
