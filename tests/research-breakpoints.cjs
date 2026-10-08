'use strict';
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),R=require('../src/route-solver.cjs');
const B=require('../src/research-breakpoints.cjs'),I=require('../src/plan-incumbents.cjs');
const {fixture}=require('./research-sale-plans.cjs');
async function run(){
 const raw=fixture();raw.farm.research.comfy_nests--;
 const prepared=R.prepare(raw,R.routes(raw)[0],3),{s,c}=prepared;
 const bought=S.buy(s,c,{type:'research',i:S.RMAP.comfy_nests});
 const waited=S.advance(bought,c,bought.t+1200,'Earn cash for more research',true,'online');
 const short=S.advance(waited,c,waited.t+1,'Purchase interaction time',true,'online');
 const chosen=B.select([s,bought,waited,short],c);
 assert.ok(chosen.includes(bought),'before-wait anchor includes the full paid purchase interaction');
 assert.equal(chosen.filter(n=>n===bought).length,1);
 assert.ok(chosen.length<=12);assert.deepEqual(B.select([],c),[]);
 // Tier, slot, and train-length breakpoints remain detectable independently.
 const empty=require('../src/blank-farm.cjs')(1791993600),p=R.prepare(empty,R.routes(empty)[0],3);
 const tier=S.clone(p.s);tier.r[S.RMAP.comfy_nests]=50;tier.r[S.RMAP.nutritional_sup]=30;
 assert.ok(B.signature(tier,p.c).tier>B.signature(p.s,p.c).tier);
 for(const id of ['autonomous_vehicles','micro_coupling']){
  const upgraded=S.clone(p.s);upgraded.r[S.RMAP[id]]=S.D.research[S.RMAP[id]].levels;
  const key=id==='autonomous_vehicles'?'slots':'cars';
  assert.ok(B.signature(upgraded,p.c)[key]>B.signature(p.s,p.c)[key]);
 }
 const result=await R.solve(structuredClone(raw),{maxMs:700,width:4});
 const incumbent={config:raw,result},restored=I.restore(raw,incumbent,R.replay);
 assert.equal(restored.length,result.shiftPlans.length);
 for(const change of [r=>r.plan.target++,r=>r.plan.start++,r=>r.plan.maxShifts=1,r=>r.farm.videoDoubler=!r.farm.videoDoubler,
  r=>r.plan.minOfflineMinutes=123,r=>r.plan.sequence='C R H',r=>r.farm.loadouts.current=[{artifactId:'lunar-totem-4-3',stones:[]}]]){
  const different=structuredClone(raw);change(different);assert.equal(I.restore(different,incumbent,R.replay).length,0,'changed inputs reject incumbents');
 }
 const paid=R.seedRoute(bought,c,180),paidActions=S.history(paid).map((a,i)=>i?a:{...a,routeSearch:{version:2,sequence:R.routes(raw)[0],researchSales:3},initialSiloRule:'one'});
 const paidIncumbent={config:raw,result:{solverVersion:2,end:paid.t,seconds:paid.t-c.start,switches:paid.stage,actions:paidActions}};
 assert.equal(I.restore(raw,paidIncumbent,R.replay).length,1);
 const corrupt=structuredClone(paidIncumbent),index=corrupt.result.actions.findIndex(a=>a.type==='research');
 assert.ok(index>=0);corrupt.result.actions.splice(index+1,1);
 assert.equal(I.restore(raw,corrupt,R.replay).length,0,'missing interaction history cannot seed a solve');
 const custom=fixture();Object.assign(custom.plan,{strategy:'user',autoSequence:false,sequence:'C K I C H K C R H I'});
 const route=R.routes(custom)[0],pCustom=R.prepare(custom,route,3),initial=pCustom.s,context=pCustom.c;
 const candidate=R.seedRoute(initial,context,180),completed=[];
 const control={breakpointAnchors:0,breakpointComparisons:0,cancelled:()=>false,yield:async()=>{},consider:n=>{if(n)completed.push(n);}};
 await R.compareResearchBreakpoints(custom,{initial,c:context,route,state:candidate},3,Date.now()+5000,control);
 assert.ok(control.breakpointComparisons>0,'custom routes also compare paid breakpoint continuations');
 for(const n of completed){const actions=S.history(n).map((a,i)=>i?a:{...a,routeSearch:{version:2,sequence:route,researchSales:3},initialSiloRule:'one'});assert.equal(R.replay(custom,actions,true).s.t,n.t);}
 const resumed=await R.solve(structuredClone(raw),{maxMs:100,width:4,incumbent},()=>{},()=>true);
 for(const entry of result.shiftPlans){const retained=resumed.shiftPlans.find(x=>x.switches===entry.switches);assert.ok(retained);assert.ok(retained.plan.seconds<=entry.plan.seconds);assert.equal(R.replay(raw,retained.plan.actions,true).s.t,retained.plan.end);}
 console.log('PASS research breakpoints and incumbents: paid before-wait anchors, structural transitions, identical-input retention, changed-input rejection, strict interaction replay, cancellation with prior winners.');
}
if(require.main===module)run().catch(error=>{console.error(error.stack);process.exitCode=1;});
module.exports={run};
