'use strict';
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),R=require('../src/route-solver.cjs');
const Goals=require('../src/te-goals.cjs'),Bounds=require('../src/search-bounds.cjs'),{Reserve}=require('../src/search-reserve.cjs');
const Neighborhoods=require('../src/purchase-neighborhoods.cjs'),Schedules=require('../src/schedule-proposals.cjs');
const {fixture}=require('./research-sale-plans.cjs');
let seed=713;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;},pick=n=>Math.floor(random()*n);
function polledCalendar(start,end){
 const fmt=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',weekday:'short',hour:'2-digit',hourCycle:'h23'});
 const event=t=>{const p=Object.fromEntries(fmt.formatToParts(new Date(t*1000)).map(x=>[x.type,x.value])),h=+p.hour;return {earnings:(p.weekday==='Mon'&&h>=9)||(p.weekday==='Tue'&&h<9)?2:1,sale:(p.weekday==='Fri'&&h>=9)||(p.weekday==='Sat'&&h<9)?.3:1};};
 const out=[{t:start,...event(start)}];let previous=out[0];
 for(let t=(Math.floor(start/900)+1)*900;t<=end+7*86400;t+=900){const e=event(t);if(e.earnings!==previous.earnings||e.sale!==previous.sale){out.push({t,...e});previous=e;}}
 out.push({t:Infinity,earnings:1,sale:1});return out;
}
function brute(te,eggs,minimum,needed,available,limit,current){
 let best=null;function visit(egg,total,visits,cost,goals){if(egg===5){if(total===needed&&(!best||cost<best.cost||cost===best.cost&&visits<best.visits))best={cost,visits,goals};return;}
  const max=available.has(egg)?Math.min(98-te[egg],needed-total):0;
  for(let k=minimum[egg];k<=max;k++){const count=visits+Number(k>0&&egg!==current);if(count<=limit)visit(egg+1,total+k,count,cost+(k?Math.max(0,S.D.te[te[egg]+k-1]-eggs[egg]):0),[...goals,te[egg]+k]);}
 }visit(0,0,0,0,[]);return best;
}
function marked(state,route){return S.history(state).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence:route,researchSales:3}});}
function run(){
 const raw=fixture(),{s,c}=S.prepare(raw);
 for(let sample=0;sample<240;sample++){
  const n=S.clone(s);n.r=S.D.research.map(r=>pick(r.levels+1));n.h=n.h.map(()=>pick(19));n.v=n.v.map(()=>({id:pick(13)-1,cars:1+pick(10)}));for(const v of n.v)if(v.id===-1)v.id=null;
  n.t+=sample*3600;n.silos=pick(10);
  assert.deepEqual(S.stats(n,c),S.stats(n,{...c,researchCache:null}));
  const copy=S.clone(n),before=S.stats(n,c);copy.r[0]=(copy.r[0]+1)%(S.D.research[0].levels+1);
  assert.deepEqual(S.stats(copy,c),S.stats(copy,{...c,researchCache:null}));assert.deepEqual(S.stats(n,c),before);
 }
 const copied=structuredClone(c);assert.notEqual(copied.researchCache,c.researchCache);assert.equal(copied.researchCache.arrays,undefined);assert.deepEqual(S.stats(s,copied),S.stats(s,c));assert.ok(copied.researchCache.arrays instanceof WeakMap);
 const original=S.stats(s,c);c.col.shippingCap*=1.1;c.mods[s.set].laying*=1.2;c.earningsScale*=2;
 assert.deepEqual(S.stats(s,c),S.stats(s,{...c,researchCache:null}));assert.notEqual(S.stats(s,c).earning,original.earning);
 assert.ok(c.researchCache.hits>0);assert.ok(c.researchCache.values.size<=2048);
 for(const start of ['1990-03-30T16:00:00Z','2026-03-06T17:00:00Z','2026-10-30T16:00:00Z','2026-10-16T16:00:00.001Z','2032-12-31T23:12:13Z']){
  const t=Date.parse(start)/1000;assert.deepEqual(S.calendar(t,t+35*86400),polledCalendar(t,t+35*86400));
 }
 for(let sample=0;sample<300;sample++){
  const te=Array.from({length:5},()=>96+pick(3)),eggs=te.map(n=>n?S.D.te[n-1]:0),minimum=te.map(n=>pick(99-n)),needed=pick(8),available=new Set([0,1,2,3,4].filter(()=>random()>.2)),limit=pick(5),current=pick(5);
  const expected=brute(te,eggs,minimum,needed,available,limit,current),got=Goals.allocate(te,eggs,minimum,needed,available,limit,current);
  if(!expected){assert.equal(got,null);continue;}assert.ok(got);
  const cost=got.reduce((sum,n,i)=>sum+(n>te[i]?Math.max(0,S.D.te[n-1]-eggs[i]):0),0),visits=got.filter((n,i)=>i!==current&&n>te[i]).length;
  assert.equal(cost,expected.cost);assert.equal(visits,expected.visits);
 }
 const test=require('./purchase-economics.cjs').capacityPlan(),p=R.prepare(test.raw,test.route,3);let state=p.s;
 for(const action of test.plan.actions){
  assert.ok(Bounds.earliest(state,p.c)<=test.plan.end+.01,'optimistic bound never exceeds a feasible paid finish');assert.ok(Bounds.minimumStage(state,p.c)<=test.plan.switches);
  state=action.type==='wait'?S.advance(state,p.c,action.end,action.reason,true,action.earningsMode||'auto'):S.buy(state,{...p.c,actionsSeconds:0,shiftSeconds:0,shipReplay:true},action);
 }

 const Departures=require('../src/calendar-departures.cjs'),Routes=require('../src/route-neighborhoods.cjs'),Sleep=require('../src/sleep-schedule.cjs');
 const passive={type:'wait',t:p.s.t,end:p.s.t+7200,reason:'Accumulate cash online',earningsMode:'online'};
 for(const prefix of Departures.fractions(p.s,p.c,passive,[.25,.5,.75])){assert.ok(prefix.t>passive.t&&prefix.t<passive.end);assert.deepEqual(prefix.r,p.s.r);assert.equal(prefix.cash,S.advance(p.s,p.c,prefix.t,undefined,true,'online').cash);}
 assert.deepEqual(Departures.fractions(p.s,p.c,{...passive,reason:'Purchase interaction time'}),[]);
 const sleepy=structuredClone(test.raw);sleepy.plan.eventTimezone='UTC';sleepy.plan.sleep={enabled:true,start:'23:00',end:'07:00'};
 const sp=R.prepare(sleepy,test.route,3),wait={...passive,t:sp.s.t,end:sp.s.t+2*86400};for(const prefix of Departures.fractions(sp.s,sp.c,wait,[.25,.5,.75]))assert.ok(Sleep.active(sp.c.sleep,prefix.t,sp.c.shiftSeconds));
 const routeEdits=Routes.proposals(['curiosity','kindness','integrity','curiosity','humility'],'curiosity',4);assert.ok(routeEdits.length);assert.ok(routeEdits.every(route=>route[0]==='curiosity'&&route.length<=5));
 // A bound remains optimistic with legal artifact changes, fuel and launches.
 const mission=require('./plan-continuation.cjs').ships(),mp=R.prepare(mission.config,R.routes(mission.config)[0],3);
 const full=R.replay(mission.config,mission.result.actions,true);assert.ok(Bounds.earliest(mp.s,mp.c)<=full.s.t+.01);assert.ok(Bounds.minimumStage(mp.s,mp.c)<=full.s.stage);

 for(const sample of [require('./plan-continuation.cjs').ships(),require('./plan-continuation.cjs').automaticArtifacts()]){
  const route=sample.result.actions[0].routeSearch.sequence,q=R.prepare(sample.config,route,3,{artifactSets:S.recordedArtifactSets(sample.result.actions)});let n=q.s;
  for(const action of sample.result.actions){assert.ok(Bounds.earliest(n,q.c)<=sample.result.end+.01,'bounds remain optimistic with fuel, flights and owned artifact changes');assert.ok(Bounds.minimumStage(n,q.c)<=sample.result.switches);n=action.type==='wait'?S.advance(n,q.c,action.end,action.reason,true,action.earningsMode||'auto'):S.buy(n,{...q.c,actionsSeconds:action.type==='ship-run'?q.c.actionsSeconds:0,shiftSeconds:0,shipReplay:true},action);}
 }
 const reserve=new Reserve(2);reserve.add([p.s,p.s,state],p.c,test.route,3);assert.equal(reserve.items.length,2);assert.equal(reserve.added,2);const item=reserve.peek()[0];assert.ok(reserve.take(item.id));assert.equal(reserve.items.length,1);
 const bundle=fixture();bundle.farm.cash=1e100;bundle.farm.research.atomic_purification=S.D.research[S.RMAP.atomic_purification].levels-3;
 Object.assign(bundle.plan,{strategy:'user',autoSequence:false,sequence:'C K C',target:101,ships:{mode:'none'}});
 const route=R.routes(bundle)[0],q=R.prepare(bundle,route,3);let n=q.s;
 for(let i=0;i<3;i++)n=S.buy(n,q.c,{type:'research',i:S.RMAP.atomic_purification});
 const edits=Neighborhoods.proposals(q.s,q.c,S.history(n));assert.ok(edits.some(x=>!x.actions.some(a=>a.type==='research')),'a whole paid family can be reconsidered');
 for(const edit of edits){const paid=Schedules.execute(q.s,q.c,edit.actions,{retime:true,recomputeFunding:true});if(paid)assert.equal(R.replay(bundle,marked(paid,route)).s.t,paid.t);}
 console.log('PASS search efficiency: cached research with live gear/calibration, clone isolation, direct Pacific calendar versus exhaustive polling, dense TE allocation versus exhaustive choices, optimistic paid-plan bounds, bounded branch reserve and dependency-aware purchase blocks.');
}
async function routeRecovery(){
 const raw=fixture();Object.assign(raw.plan,{strategy:'auto',strategyVersion:2,autoSequence:true,maxShifts:3,maxSwitches:3,target:102,floors:[20,21,20,20,21],ships:{mode:'none'},sleep:{enabled:false}});
 const route=['curiosity','kindness','integrity','curiosity'],p=R.prepare(raw,route,3);let n=p.s;
 for(const egg of [4,1]){n=S.buy(n,p.c,{type:'shift',egg});n=S.advance(n,p.c,n.t+S.D.te[20]/S.stats(n,p.c).delivery+.001,'Collect required milestones');}
 n=S.buy(n,p.c,{type:'shift',egg:0});const item={state:n,context:p.c,route,count:3},Recipes=require('../src/wasmegg-stage-engine.cjs'),original=Recipes.runC1;let openings=0,found=[];
 Recipes.runC1=(...args)=>{openings++;return original(...args);};
 try{await R.compareRouteNeighborhoods(raw,item,Date.now()+3000,{cancelled:()=>false,yield:()=>Promise.resolve(),consider:state=>found.push(state),worthwhile:()=>true},1);}finally{Recipes.runC1=original;}
 assert.equal(openings,0,'route recovery must depart the already-paid common visit without restarting C1');assert.ok(found.some(state=>state.stage===2&&state.t<n.t),'deleting an unnecessary final shift yields a replayed improvement');
 console.log('PASS route neighborhood: reused paid opening, no repeated C1 recipe, independently replayed shorter route.');
}
module.exports={run,routeRecovery};if(require.main===module)Promise.resolve().then(run).then(routeRecovery).catch(error=>{console.error(error.stack);process.exitCode=1;});
