'use strict';
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),R=require('../src/route-solver.cjs'),E=require('../src/earnings-incumbents.cjs'),I=require('../src/plan-incumbents.cjs');
const {make}=require('./sleep-search-quality.cjs'),{validateInteractions}=require('./sleep-schedule.cjs');
async function run(){
 const weak=make();weak.farm.earningsMode='offline';weak.farm.loadouts={current:[{artifactId:'lunar-totem-4-3',stones:['lunar-stone-3']}],earnings:[{artifactId:'lunar-totem-4-3',stones:['lunar-stone-3']}]};
 const strong=structuredClone(weak);strong.farm.loadouts.current[0].stones=['lunar-stone-4'];
 const before=JSON.stringify(strong);assert.ok(E.compatible(strong,weak));assert.equal(JSON.stringify(strong),before);
 assert.ok(!E.compatible(weak,strong));assert.ok(!E.compatible(weak,weak));
 for(const change of [r=>r.plan.target++,r=>r.plan.sleep.start='22:00',r=>r.plan.eventTimezone='America/Los_Angeles',r=>r.farm.silos++,r=>r.farm.artifactInventory=[{anything:1}],r=>r.farm.loadouts.current=[{artifactId:'ornate-gusset-4-3',stones:[]}],r=>r.farm.loadouts.current=[{artifactId:'puzzle-cube-4-2',stones:[]}]]){const changed=structuredClone(strong);change(changed);assert.ok(!E.compatible(changed,weak),'only an earnings-only starting upgrade can propose the old order');}
 const result=await R.solve(weak,{maxMs:1800,width:8}),incumbent={config:weak,result};assert.equal(I.restore(strong,incumbent,R.replay).length,0,'changed inputs cannot inherit old replay states');
 const adapted=E.adapt(strong,incumbent,{prepare:R.prepare,replay:R.replay});assert.ok(adapted.length);
 for(const entry of result.shiftPlans)assert.ok(adapted.some(item=>item.state.stage===entry.switches&&item.state.t<=entry.plan.end+1e-6),'reexecute every verified shift count before compressing waits');
 for(const item of adapted){const old=result.shiftPlans.find(e=>e.switches===item.state.stage);assert.ok(old);assert.ok(item.state.t<=old.plan.end+1e-6);assert.ok(S.reached(item.state,item.context));validateInteractions(S.history(item.state),item.context);assert.equal(item.context.mods.current.away,S.modifiers(strong.farm.loadouts.current).away);}
 assert.equal(JSON.stringify(strong),before);assert.deepEqual(E.adapt(strong,incumbent,{prepare:R.prepare,replay:R.replay,checkpoint(){throw Error('Stopped');}}),[]);
 const malformed=structuredClone(incumbent);malformed.result.shiftPlans=[null,{plan:null}];assert.deepEqual(E.adapt(strong,malformed,{prepare:R.prepare,replay:R.replay}),[]);
 const corrupt=structuredClone(incumbent);for(const entry of corrupt.result.shiftPlans){const index=entry.plan.actions.findIndex(a=>a.type==='silo');assert.ok(index>=0);entry.plan.actions.splice(index+1,1);}
 assert.deepEqual(E.adapt(strong,corrupt,{prepare:R.prepare,replay:R.replay}),[],'the old source must itself strictly replay, including interactions');
 const solved=await R.solve(strong,{maxMs:5000,width:8,incumbent});assert.ok(solved.search.earningsAdaptations>0);
 for(const entry of result.shiftPlans){const next=solved.shiftPlans.find(e=>e.switches===entry.switches);assert.ok(next);assert.ok(next.plan.seconds<=entry.plan.seconds+1e-6);const checked=R.replay(strong,JSON.parse(JSON.stringify(next.plan.actions)),true);assert.equal(checked.s.t,next.plan.end);validateInteractions(next.plan.actions,checked.c);}
 console.log('PASS earnings upgrades: fully paid schedule reexecution, preserved time/shift counts, actual starting gear, sleep/calendar handling, strict old/new replay, unrelated input/production/price/inventory rejection, cancellation, malformed and corrupt results.');
}
module.exports={run};if(require.main===module)run().catch(error=>{console.error(error.stack);process.exitCode=1;});
