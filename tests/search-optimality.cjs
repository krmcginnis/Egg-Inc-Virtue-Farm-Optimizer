'use strict';
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),R=require('../src/route-solver.cjs'),L=require('../src/optimizer-legacy.cjs');
const Bounds=require('../src/search-bounds.cjs'),{Patterns}=require('../src/milestone-bound.cjs'),Finite=require('../src/finite-purchases.cjs'),Orders=require('../src/purchase-order-reduction.cjs'),Quality=require('../src/search-quality.cjs'),Verify=require('../src/plan-verification.cjs'),Departures=require('../src/calendar-departures.cjs');
const {fixture}=require('./research-sale-plans.cjs');
let seed=88141;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;},pick=n=>Math.floor(random()*n);
function exhaustiveEggs(s,c,available){
 const te=S.teByEgg(s,c);let best=Infinity;
 function visit(egg,total,cost){if(egg===5){if(total>=c.target)best=Math.min(best,cost);return;}
  for(let n=Math.max(te[egg],c.floors[egg]);n<=(available.has(egg)?98:te[egg]);n++)visit(egg+1,total+n,cost+(n>te[egg]?Math.max(0,S.D.te[n-1]-s.eggs[egg]):0));
 }visit(0,0,0);return best;
}
// Independent recursive oracle: no finite-search frontier, deduplication,
// proposal ranking, or optimistic-bound pruning is used here.
function oracle(s,c,actions,evaluate){
 let best=null,nodes=0;function walk(n,remaining){nodes++;const end=evaluate(n);if(R.better(end,best))best=end;
  for(let i=0;i<remaining.length;i++)try{const a=remaining[i],ready=S.afford(n,c,a);if(ready)walk(S.buy(ready,c,a),remaining.filter((_,j)=>i!==j));}catch{}
 }walk(s,actions);return {best,nodes};
}
function verificationFixture(){
 const raw=require('./research-sale-plans.cjs').fixture(),ids=S.D.research.filter(r=>r.categories==='internal_hatchery_rate').slice(0,5).map(r=>r.id);
 Object.assign(raw.farm,{cash:1e100});for(const id of ids)raw.farm.research[id]--;
 Object.assign(raw.plan,{solverVersion:2,strategy:'user',autoSequence:false,sequence:'C I C',target:101,ships:{mode:'none'},actionSeconds:.3});
 const route=R.routes(raw)[0],{s,c}=R.prepare(raw,route,3);let n=s;for(const id of ids)n=S.buy(n,c,{type:'research',i:S.RMAP[id]});n=L.tail(n,c);
 const actions=S.history(n).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence:route,researchSales:3}});
 return {version:1,config:raw,result:{version:1,solverVersion:2,initialSiloRule:'one',start:c.start,end:n.t,seconds:n.t-c.start,target:c.target,switches:n.stage,soulCost:n.lost,pendingTE:S.totalTE(n,c)-c.claimedTotal,finalTE:S.teByEgg(n,c),finalCash:n.cash,finalStats:S.stats(n,c),actions,frontier:[],explored:0,method:'Synthetic finite verification case',termination:'complete',researchDeadline:c.researchDeadline,actualResearchSales:0}};
}

async function run(){
 const base=S.prepare(fixture()),patterns=new Patterns(4);
 for(let i=0;i<100;i++){
  const s=S.clone(base.s),c={...base.c,floors:Array(5).fill(0)};s.eggs=s.eggs.map(()=>S.D.te[94+pick(4)]);
  const te=S.teByEgg(s,c);c.floors=te.map(n=>Math.min(98,n+pick(2)));c.target=Math.min(490,c.floors.reduce((a,b)=>a+b,0)+pick(4));
  const available=new Set([0,1,2,3,4].filter(()=>random()>.25)),expected=exhaustiveEggs(s,c,available);
  assert.equal(patterns.required(s,c,available),expected);assert.equal(patterns.required(s,c,available),expected);
 }
 assert.ok(patterns.hits>=100);assert.ok(patterns.tables.size<=4);
 const example=require('./purchase-economics.cjs').capacityPlan(),actions=['micro_coupling','atomic_purification','wormhole_dampening'].map(id=>({type:'research',i:S.RMAP[id]}));
 for(const mode of ['online','offline'])for(const actionSeconds of [0,.3]){
  const raw=structuredClone(example.raw);raw.farm.earningsMode=mode;raw.plan.actionSeconds=actionSeconds;
  const {s,c}=R.prepare(raw,example.route,3),evaluate=n=>{try{return L.tail(n,c);}catch{return null;}},expected=oracle(s,c,actions,evaluate),session=Finite.fresh(actions);let best=null;
  await Finite.run(s,c,session,{evaluate,consider:n=>{if(R.better(n,best))best=n;}});
  assert.ok(session.complete);assert.equal(best.t,expected.best.t);assert.ok(session.examined<=expected.nodes);
  assert.ok(Bounds.analyze(s,c,best.t).lower<=best.t+.01);assert.equal(Bounds.deadline(s,c,s.t-1).impossible,true);
  const interrupted=Finite.fresh(actions);let resumedBest=null;
  await Finite.run(s,c,interrupted,{evaluate,consider:n=>{if(R.better(n,resumedBest))resumedBest=n;},cancelled:()=>interrupted.examined>=2});assert.ok(!interrupted.complete);
  const saved=JSON.parse(JSON.stringify(interrupted));await Finite.run(s,c,saved,{evaluate,consider:n=>{if(R.better(n,resumedBest))resumedBest=n;}});
  assert.ok(saved.complete);assert.equal(resumedBest.t,expected.best.t);assert.equal(saved.examined,session.examined);
  const during=Finite.fresh(actions);let stop=false;
  await Finite.run(s,c,during,{evaluate:()=>{stop=true;return null;},consider:()=>assert.fail('a paused evaluation cannot be accepted'),cancelled:()=>stop});
  assert.deepEqual(during.frontier,[[]],'an interrupted node returns to the frontier');assert.equal(during.examined,0);
  stop=false;let afterPause=null;await Finite.run(s,c,during,{evaluate,consider:n=>{if(R.better(n,afterPause))afterPause=n;}});assert.equal(afterPause.t,expected.best.t);
 }
 // Identical resource states are merged only in a COMPLETE finite problem;
 // pruning alternative orders before a bounded beam could lose both paths.
 const zero=fixture();zero.farm.cash=1e100;const neutralId=S.D.research.find(r=>r.categories.includes('internal_hatchery_rate')).id;zero.farm.research[neutralId]--;zero.farm.research.micro_coupling--;
 Object.assign(zero.plan,{strategy:'user',autoSequence:false,solverVersion:2,sequence:'C I C',ships:{mode:'none'},target:101});
 const p=R.prepare(zero,R.routes(zero)[0],3),neutral=[{type:'research',i:S.RMAP[neutralId]},{type:'research',i:S.RMAP.micro_coupling}];
 assert.ok(Orders.pair(p.s,p.c,...neutral));let reduced=Finite.fresh(neutral),full=Finite.fresh(neutral);
 for(const [session,reduce] of [[reduced,true],[full,false]])await Finite.run(p.s,p.c,session,{evaluate:()=>null,consider:()=>{},reduce});
 assert.ok(reduced.reduced>0);assert.ok(reduced.examined<full.examined);
 for(const type of ['hab','fleet','silo']){
  const raw=fixture();raw.farm.cash=1e100;raw.farm.virtue=type==='hab'?'integrity':type==='fleet'?'kindness':'resilience';
  Object.assign(raw.plan,{solverVersion:2,strategy:'user',autoSequence:false,sequence:type==='hab'?'I C':type==='fleet'?'K C':'R C',target:101,ships:{mode:'none'}});
  let purchases;
  if(type==='hab'){raw.farm.habs=[17,17,18,18];purchases=[{type:'hab',slot:0,id:18},{type:'hab',slot:1,id:18}];}
  else if(type==='fleet'){raw.farm.vehicles[0]={id:null,cars:1};purchases=[{type:'vehicle',slot:0,id:11},{type:'car',slot:0},{type:'car',slot:0}];}
  else purchases=[{type:'silo'},{type:'silo'}];
  const {s,c}=R.prepare(raw,R.routes(raw)[0],3),evaluate=n=>{try{return L.tail(n,c);}catch{return null;}},expected=oracle(s,c,purchases,evaluate);let best=null;const session=Finite.fresh(purchases);
  await Finite.run(s,c,session,{evaluate,consider:n=>{if(R.better(n,best))best=n;}});assert.equal(best.t,expected.best.t,'exact physical ordering: '+type);assert.ok(session.complete);
 }
 const productive={type:'research',i:S.RMAP.atomic_purification};assert.equal(Orders.pair(p.s,p.c,neutral[0],productive),false);
 const {s,c}=R.prepare(example.raw,example.route,3),rate=S.stats(s,c).delivery,threshold=s.t+(S.D.te[S.teByEgg(s,c)[s.egg]]-s.eggs[s.egg])/rate;
 const wait={type:'wait',t:s.t,end:threshold+300,reason:'Accumulate cash online',earningsMode:'online'},points=Departures.critical(s,c,wait,{limit:100});
 assert.ok(points.some(n=>Math.abs(n.t-threshold)<.001));for(const n of points){assert.deepEqual(n.r,s.r);assert.equal(n.cash,S.advance(s,c,n.t,undefined,true,'online').cash);}
 const quality=Quality.measure(example.raw,example.plan);assert.equal(quality.status,'bounded-under-model');assert.ok(quality.lowerSeconds<=example.plan.seconds);assert.equal(quality.globalOptimalityProven,false);
 const verified=await Verify.search(example.raw,example.plan,{maxMs:3000});assert.ok(verified.end<=example.plan.end);assert.ok(verified.verification.examined>0);assert.equal(verified.verification.globalOptimalityProven,false);R.replay(example.raw,verified.actions,true);
 const stopped=await Verify.search(example.raw,example.plan,{maxMs:100},()=>{},()=>true);assert.ok(!stopped.verification.complete);
 const continued=await Verify.search(example.raw,JSON.parse(JSON.stringify(stopped)),{maxMs:3000});assert.equal(continued.end,verified.end);assert.ok(continued.verification.examined>=verified.verification.examined);
 // Whole-route coverage is not inferred from the local finite search.
 assert.match(continued.verification.scope,/fixed source route/);assert.equal(continued.optimality.globalOptimalityProven,false);
 const neutralCase=verificationFixture(),np=R.prepare(neutralCase.config,R.routes(neutralCase.config)[0],3),pool=neutralCase.result.actions.filter(a=>a.type==='research'),all=oracle(np.s,np.c,pool,n=>L.tail(n,np.c));
 const merged=Finite.fresh(pool);let winner=null;await Finite.run(np.s,np.c,merged,{evaluate:n=>L.tail(n,np.c),consider:n=>{if(R.better(n,winner))winner=n;}});
 assert.equal(all.nodes,326);assert.equal(merged.examined,32);assert.equal(winner.t,all.best.t);
 console.log('PASS independent exhaustive milestone/purchase oracles, online/offline interactions, exact-state order reduction, interrupted frontier resume, calculated departures, safe model bounds, and honest local verification scope.');
}
module.exports={run,oracle,exhaustiveEggs,verificationFixture};if(require.main===module)run().catch(error=>{console.error(error.stack);process.exitCode=1;});
