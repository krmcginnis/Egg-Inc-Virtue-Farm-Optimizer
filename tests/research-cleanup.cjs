'use strict';
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),R=require('../src/route-solver.cjs'),L=require('../src/optimizer-legacy.cjs'),C=require('../src/research-cleanup.cjs'),W=require('../src/waiting-objective.cjs');
const {fixture}=require('./research-sale-plans.cjs');
function setup(raw){const route=R.routes(raw)[0],prepared=R.prepare(raw,route,3);return {...prepared,route,raw};}
function base(){const raw=fixture();Object.assign(raw.farm,{cash:1e100,earningsMode:'offline',shiftCount:0});raw.farm.loadouts.current=[{artifactId:'lunar-totem-4-3',stones:[]}];Object.assign(raw.plan,{solverVersion:2,strategy:'user',autoSequence:false,sequence:'C I C',maxShifts:2,maxSwitches:2,target:101,ships:{mode:'none'}});return raw;}
function finish(p,state){const end=L.finishHere(state,p.c);assert.ok(end);return {state:end,context:p.c,route:p.route,count:3};}
function caseWithoutUse(){const raw=base();raw.farm.research.neural_linking=20;raw.farm.research.enlightened_chickens=39;const p=setup(raw);let n=p.s;
 for(let i=0;i<3;i++)n=S.buy(n,p.c,{type:'research',i:S.RMAP.neural_linking});
 for(let i=0;i<16;i++)n=S.buy(n,p.c,{type:'research',i:S.RMAP.enlightened_chickens});
 return {...p,item:finish(p,n)};
}
function prerequisite(later=false){
 const raw=base();raw.farm.research=Object.fromEntries(S.D.research.map(r=>[r.id,r.tier<12?r.levels:0]));raw.farm.research.neural_linking=20;raw.farm.research.enlightened_chickens=39;
 const total=Object.values(raw.farm.research).reduce((a,b)=>a+b,0);raw.farm.research.internal_hatchery5-=total-(S.D.tierUnlock[11]-1);
 if(later){raw.plan.sequence='C K C H C';raw.plan.maxShifts=raw.plan.maxSwitches=4;}
 const p=setup(raw);assert.equal(S.isUnlocked(p.s,S.RMAP.neural_net_refine),false);let n=S.buy(p.s,p.c,{type:'research',i:S.RMAP.neural_linking});
 if(later){n=S.buy(n,p.c,{type:'shift',egg:4});n=S.buy(n,p.c,{type:'shift',egg:0});}
 for(const id of ['neural_net_refine','neural_linking','enlightened_chickens']){const a={type:'research',i:S.RMAP[id]},ready=S.afford(n,p.c,a);assert.ok(ready,'Fund '+id+' on stage '+n.stage);n=S.buy(ready,p.c,a);}
 return {...p,item:finish(p,n)};
}
async function run(){
 const example=caseWithoutUse(),snapshot=JSON.stringify(S.history(example.item.state)),clean=R.cleanResearch(example.raw,example.item);
 assert.ok(clean.state.t<=example.item.state.t);assert.equal(S.totalTE(clean.state,clean.context),101);assert.equal(clean.state.stage,example.item.state.stage);assert.equal(W.offlineBreaks(clean.state),W.offlineBreaks(example.item.state));assert.equal(clean.researchCleanup.removedLevels,19);assert.equal(W.purchaseCount(example.item.state)-W.purchaseCount(clean.state),19);assert.ok(R.better({...clean.state,t:example.item.state.t},example.item.state));assert.equal(JSON.stringify(S.history(example.item.state)),snapshot);
 assert.equal(S.history(clean.state).filter(a=>a.type==='research').length,0);assert.equal(clean.state.r[S.RMAP.neural_linking],20);assert.equal(clean.state.r[S.RMAP.enlightened_chickens],39);
 for(const policy of ['cheap','income','balanced','fleet'])assert.ok(!R.scored(example.s,example.c,policy).some(x=>x.a.type==='research'&&!C.affectsFarm(x.a.i)),'no filler when useful higher research is already satisfied: '+policy);
 for(const later of [false,true]){const p=prerequisite(later),needed=R.cleanResearch(p.raw,p.item),research=S.history(needed.state).filter(a=>a.type==='research');assert.equal(needed.researchCleanup.removedLevels,2);assert.equal(research.filter(a=>a.i===S.RMAP.neural_linking).length,1);assert.ok(research.some(a=>a.i===S.RMAP.neural_net_refine));assert.equal(needed.state.r[S.RMAP.neural_net_refine],1);assert.equal(needed.state.stage,p.item.state.stage);assert.ok(needed.state.t<=p.item.state.t);}
 for(const id of ['micro_coupling','hover_upgrades','hyper_portalling','wormhole_dampening','autonomous_vehicles','comfy_nests'])assert.equal(C.affectsFarm(S.RMAP[id]),true,'preserve potential capacity, prices, and production: '+id);
 assert.strictEqual(R.cleanResearch(example.raw,example.item,{checkpoint:()=>{throw Error('cancelled');}}),example.item);
 // Arrival at the target still wins ahead of simplicity, comfort, or breaks.
 assert.ok(R.better({...example.item.state,t:clean.state.t-1},clean.state));assert.ok(!R.better({...clean.state,t:example.item.state.t+1},example.item.state));
 const actions=S.history(example.item.state).map((a,i)=>i?a:{...a,routeSearch:{version:2,sequence:example.route,researchSales:3},initialSiloRule:'one'}),plan={solverVersion:2,start:example.c.start,end:example.item.state.t,seconds:example.item.state.t-example.c.start,switches:0,target:101,actions};
 const searched=await R.solve(example.raw,{maxMs:100,width:4,disableAdaptiveRefinement:true,incumbent:{config:example.raw,result:plan}},()=>{},()=>true);
 assert.ok(searched.validatedReplay);assert.ok(!searched.actions.some(a=>a.type==='research'&&!C.affectsFarm(a.i)),'final cleanup also runs when returning a cancelled saved incumbent');R.replay(example.raw,searched.actions,true);
 console.log('PASS research cleanup: 19 unused levels removed, no useless unlock scoring, completed future research, minimum current/later prerequisites retained, dormant capacity retained, equal-time simplicity, faster-plan priority, cancellation, immutable inputs, and returned-plan replay.');
}
module.exports={run,caseWithoutUse,prerequisite};if(require.main===module)run().catch(e=>{console.error(e.stack);process.exitCode=1;});
