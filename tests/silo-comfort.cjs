'use strict';
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),R=require('../src/route-solver.cjs');
const L=require('../src/optimizer-legacy.cjs'),Q=require('../src/silo-comfort.cjs'),O=require('../src/optimizer.cjs');
const {fixture}=require('./research-sale-plans.cjs'),{validateInteractions}=require('./sleep-schedule.cjs');
function rawCase(){const raw=fixture();Object.assign(raw.farm,{virtue:'resilience',silos:1,cash:1e80});Object.assign(raw.plan,{strategy:'user',autoSequence:false,sequence:'R K C',solverVersion:2,target:101,floors:[20,20,20,21,20]});return raw;}
function check(raw,context,state){
 const actions=S.history(state).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence:R.routes(raw)[0],researchSales:3}});
 const replay=O.replay(raw,JSON.parse(JSON.stringify(actions)),true);assert.equal(replay.s.t,state.t);assert.equal(replay.s.silos,state.silos);assert.equal(replay.s.stage,state.stage);assert.ok(S.reached(replay.s,replay.c));validateInteractions(actions,context);return actions;
}
async function run(){
 const raw=rawCase(),{s,c}=R.prepare(raw,R.routes(raw)[0],3),base=L.finishHere(s,c),comfort=Q.improve(s,c,base);
 assert.equal(comfort.silos,8);assert.equal(comfort.t,base.t);assert.equal(comfort.stage,base.stage);
 const actions=check(raw,c,comfort),purchases=actions.filter(a=>a.type==='silo');assert.equal(purchases.length,7);
 assert.deepEqual(purchases.map((a,i)=>a.cost),Array.from({length:7},(_,i)=>1e8*(i+1)**(3*(i+1)+15)));assert.equal(comfort.siloComfort.added,7);
 const paid=purchases.reduce((sum,a)=>sum+a.cost,0);assert.ok(paid>0);
 // A large wait for an unaffordable silo is rejected. Cheap additional silos
 // can still fit in delivery time, so partial coverage is retained.
 for(const [cash,expected] of [[0,1],[1e8,2],[3e14,3]]){
  const limitedRaw=rawCase();Object.assign(limitedRaw.farm,{cash,earningsScale:1e-6,claimed:[0,0,0,0,0],research:{},vehicles:Array.from({length:17},(_,i)=>({id:i<4?11:null,cars:1}))});Object.assign(limitedRaw.plan,{target:1,floors:[0,0,0,1,0]});
  const p=R.prepare(limitedRaw,R.routes(limitedRaw)[0],3),original=L.finishHere(p.s,p.c),n=Q.improve(p.s,p.c,original);
  assert.equal(n.silos,expected);assert.equal(n.t,original.t);assert.equal(n.stage,original.stage);check(limitedRaw,p.c,n);
 }
 const standardRaw=rawCase();standardRaw.farm.proPermit=false;const standard=R.prepare(standardRaw,R.routes(standardRaw)[0],3),standardBase=L.finishHere(standard.s,standard.c),standardComfort=Q.improve(standard.s,standard.c,standardBase);
 assert.equal(standardComfort.silos,2);assert.equal(standardComfort.t,standardBase.t);check(standardRaw,standard.c,standardComfort);
 const many={...s,silos:9},manyBase=L.finishHere(many,c);assert.equal(Q.improve(many,c,manyBase),manyBase,'owned coverage above the comfort target is preserved');
 const stopped=Q.improve(s,c,base,{checkpoint(){throw Error('Stopped');}});assert.equal(stopped,base);
 const noRRaw=rawCase();noRRaw.farm.virtue='kindness';noRRaw.plan.sequence='K C';noRRaw.plan.floors=[20,20,20,20,21];const noR=R.prepare(noRRaw,R.routes(noRRaw)[0],3),noRBase=L.finishHere(noR.s,noR.c);
 assert.equal(Q.improve(noR.s,noR.c,noRBase),noRBase,'no extra R trip is inserted');
 const lateRaw=rawCase();lateRaw.farm.virtue='kindness';lateRaw.plan.sequence='K R C';Object.assign(lateRaw.plan,{target:102,floors:[20,20,20,21,21]});
 const late=R.prepare(lateRaw,R.routes(lateRaw)[0],3),lateBase=L.tail(late.s,late.c),lateComfort=Q.improve(late.s,late.c,lateBase);
 assert.equal(lateComfort.silos,8);assert.equal(lateComfort.t,lateBase.t);assert.equal(lateComfort.stage,lateBase.stage);check(lateRaw,late.c,lateComfort);
 // Near bedtime, full purchase durations must fit awake. The next morning's
 // upgrades are paid and may not retrospectively change first-night coverage.
 const sleepRaw=rawCase();sleepRaw.plan.start=Date.parse('2026-10-08T22:59:59Z')/1000;sleepRaw.plan.eventTimezone='UTC';sleepRaw.plan.sleep={enabled:true,start:'23:00',end:'07:00'};
 const sleep=R.prepare(sleepRaw,R.routes(sleepRaw)[0],3),sleepBase=L.finishHere(sleep.s,sleep.c),sleepComfort=Q.improve(sleep.s,sleep.c,sleepBase);assert.equal(sleepComfort.silos,8);assert.ok(sleepComfort.t<=sleepBase.t);check(sleepRaw,sleep.c,sleepComfort);
 assert.ok(S.history(sleepComfort).some(a=>a.type==='silo'&&a.t>=Date.parse('2026-10-09T07:00:00Z')/1000));
 const nearGoal=structuredClone(sleepRaw);nearGoal.farm.delivered[3]=S.D.te[20]-S.stats(sleep.s,sleep.c).delivery*1800;
 const near=R.prepare(nearGoal,R.routes(nearGoal)[0],3),nearBase=L.finishHere(near.s,near.c),nearComfort=Q.improve(near.s,near.c,nearBase);
 assert.equal(nearComfort.silos,4,'buy only the extra silos that fit before bed when TE finishes during that sleep');assert.equal(nearComfort.t,nearBase.t);check(nearGoal,near.c,nearComfort);
 // Comfort comes after time and shift count, before earning-break ties.
 assert.ok(!R.better({t:101,stage:0,silos:8},{t:100,stage:0,silos:1}));
 assert.ok(!R.better({t:100,stage:1,silos:8},{t:100,stage:0,silos:1}));
 assert.ok(R.better({t:100,stage:0,silos:8,path:null},{t:100,stage:0,silos:3,path:null}));
 assert.ok(!Q.preferred({silos:10},{silos:8}),'no preference for purchasing above eight');
 // Exercise the actual solve/finalize path and saved-plan replay.
 const solved=await O.solve(raw,{maxMs:2500,width:4});assert.ok(solved.finalStats.siloHours>=24);assert.equal(solved.end,base.t);assert.ok(solved.siloComfort?.added>0);check(raw,c,O.replay(raw,solved.actions,true).s);
 console.log('PASS silo comfort: paid upgrades within unchanged delivery time, partial/unaffordable purchases, standard permits, existing coverage, cancellation, no extra shifts, sleep boundaries, priority order, solver finalization, and JSON replay.');
}
if(require.main===module)run().catch(error=>{console.error(error.stack);process.exitCode=1;});
module.exports={run};
