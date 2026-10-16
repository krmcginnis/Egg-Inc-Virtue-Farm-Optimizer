'use strict';
const assert=require('node:assert/strict'),blank=require('../src/blank-farm.cjs'),S=require('../src/simulator.cjs'),P=require('../src/plan-progress.cjs');
const start=1791388800,now=start+3600;
function farm(){const raw=blank(start);Object.assign(raw.farm,{cash:1e18,soulEggs:1e30,shiftCount:47,claimed:Array(5).fill(5),manualAccountData:true,manualFarmData:true,proPermit:true});Object.assign(raw.plan,{target:30,ships:{mode:'none'}});return raw;}
function plan(actions,target=30){return {start,end:start+1800,target,actions:actions.map((a,i)=>({t:start+i*10,...a}))};}
function live(raw,stage=0,egg=0){const next=structuredClone(raw);next.farm.shiftCount+=stage;next.farm.virtue=S.EGGS[egg];next.importInfo={scope:'farm',timestamp:start+1000};return next;}
const check=(raw,r,f,opts={})=>P.compare(raw,r,f,{now,...opts});
const raw=farm(),r=plan([
 {type:'research',i:0,from:0,to:1},
 {type:'wait',end:start+11,reason:'Purchase interaction time'},
 {type:'shift',egg:4},
 {type:'vehicle',slot:0,id:2},
 {type:'shift',egg:0},
 {type:'research',i:0,from:1,to:2},
 {type:'fuel',egg:0,amount:100},
 {type:'wait',end:start+1200,reason:'Sleep hours; resume interactions at wake time'},
 {type:'shift',egg:1},
 {type:'hab',slot:0,id:2},
 {type:'shift',egg:3},
 {type:'silo'},
 {type:'shift',egg:0},
 {type:'research',i:0,from:2,to:3},
 {type:'shift',egg:2},
 {type:'ship-run',count:3},
 {type:'fuel-dump'},
 {type:'wait',end:start+1800,reason:'Collect 5 Truth Eggs'}
]);
// Lifetime shifts distinguish repeated visits without depending on dates.
let f=live(raw);let report=check(raw,r,f);assert.equal(report.stage,0);assert.equal(report.next.index,0);
f=live(raw,2);f.farm.research[S.D.research[0].id]=1;f.farm.vehicles[0].id=3;
report=check(raw,r,f);assert.equal(report.status,'matched');assert.equal(report.stage,2);assert.equal(report.next.index,5);assert.equal(report.next.remainingFrom,1);assert.equal(report.rows[0].status,'present');assert.equal(report.rows[3].status,'present');assert.equal(report.rows[1].status,'interaction');
const sameClock=live(raw);sameClock.importInfo.timestamp=f.importInfo.timestamp;assert.equal(check(raw,r,sameClock).stage,0);
f.farm.research[S.D.research[0].id]=2;report=check(raw,r,f);assert.equal(report.next.index,6);assert.equal(report.rows[6].status,'pending');assert.equal(report.rows[7].status,'pending');
report=check(raw,r,f,{confirmed:[6]});assert.equal(report.next.index,7);
report=check(raw,r,f,{confirmed:[6,7,5,1,-1,999,'6']});assert.equal(report.next.index,8);assert.equal(report.rows[5].status,'present');assert.equal(report.rows[1].status,'interaction');
assert.equal(check(raw,r,f,{confirmed:null}).next.index,6,'malformed confirmation data has no effect');
const partial=live(raw,2);partial.farm.research[S.D.research[0].id]=2;
report=check(raw,r,partial);assert.equal(report.status,'mismatch');assert.equal(report.next,null);assert.match(report.warnings.join(' '),/Earlier required upgrades/);
f=live(raw,5);f.farm.research[S.D.research[0].id]=2;f.farm.vehicles[0].id=4;f.farm.habs[0]=3;f.farm.silos=3;
report=check(raw,r,f);assert.equal(report.status,'matched');assert.equal(report.stage,5);assert.equal(report.next.index,13);assert.equal(report.confirmedPurchases,5);assert.equal(report.purchaseCount,6);assert.match(report.warnings.join(' '),/Earlier fuel transfers/);
const missingStart=structuredClone(raw);missingStart.farm.habs[1]=4;assert.equal(check(missingStart,r,f).status,'mismatch');
// A higher permanent upgrade proves the smaller planned upgrade is present.
const physical=plan([{type:'vehicle',slot:0,id:11},{type:'car',slot:0,fromCars:1,toCars:2},{type:'car',slot:0,fromCars:2,toCars:3},{type:'hab',slot:0,id:3},{type:'silo'},{type:'silo'}]);
const upgraded=live(raw);upgraded.farm.vehicles[0]={id:11,cars:5};upgraded.farm.habs[0]=4;upgraded.farm.silos=4;
report=check(raw,physical,upgraded);assert.equal(report.confirmedPurchases,6);assert.equal(report.next,null);
const noFreeSilo=farm();noFreeSilo.farm.silos=0;const initialOne=plan([{type:'silo'}]);initialOne.initialSiloRule='one';const twoSilos=live(noFreeSilo);twoSilos.farm.silos=2;assert.equal(check(noFreeSilo,initialOne,twoSilos).rows[0].siloTarget,2);
assert.equal(check(noFreeSilo,initialOne,live(noFreeSilo)).status,'mismatch','a plan with the free starting silo requires it in the snapshot');
// Never treat elapsed time, stored fuel, or returned flights as launch proof.
const manual=plan([{type:'wait',end:start+20,reason:'Sleep hours; resume interactions at wake time'},{type:'fuel',egg:0,amount:100},{type:'ship-run',count:2},{type:'ship-visit',visit:2},{type:'fuel-dump'}]);
f=live(raw);f.importInfo.timestamp=now;f.farm.fuelTank.amounts.curiosity=100;f.farm.shipFlights=[{slot:1,returnAt:start+30}];
report=check(raw,manual,f);assert.equal(report.rows[0].status,'elapsed');assert.ok(report.rows.slice(1).every(row=>row.status==='pending'));assert.equal(report.next.index,1);assert.equal(check(raw,manual,f,{confirmed:[0,1,2,3,4]}).next,null);
// Observed purchases supersede funding waits; snapshot time proves sleep ended.
const funding=plan([{type:'wait',end:start+20,reason:'Go offline, then return to collect earnings'},{type:'research',i:0,from:0,to:1},{type:'wait',end:start+60,reason:'Sleep hours; resume interactions at wake time'},{type:'research',i:1,from:0,to:1}]);
f=live(raw);f.farm.research={[S.D.research[0].id]:1,[S.D.research[1].id]:1};report=check(raw,funding,f);assert.equal(report.rows[0].status,'superseded');assert.equal(report.rows[2].status,'elapsed');assert.equal(report.next,null);
const undatedFunding=structuredClone(f);delete undatedFunding.importInfo;assert.equal(check(raw,funding,undatedFunding).next.index,2,'without a backup clock, sleep still needs confirmation');
// Passed sale/earnings/wake times must not block the current purchase batch.
{
 const reasons=['Wait for the Friday research sale','Wait for double earnings','Wait for the weekly event boundary','Preserve cash for the Friday research sale','Preserve the proposed research sale','Compare research purchases during the next sale','Compare departure at a weekly event boundary','Sleep hours; resume interactions at wake time','Sleep hours; resume ship interactions at wake time'];
 for(const reason of reasons){
  const clockPlan=plan([{type:'wait',end:start+60,reason,earningsMode:'offline'},{type:'research',i:0,from:0,to:1,t:start+60}]),current=live(raw);
  current.importInfo.timestamp=start+59;assert.equal(check(raw,clockPlan,current).next.index,0,'the PC clock does not complete '+reason);
  for(const t of [start+60,start+1000]){current.importInfo.timestamp=t;const checked=check(raw,clockPlan,current);assert.equal(checked.rows[0].status,'elapsed');assert.equal(checked.rows[0].canConfirm,false);assert.equal(checked.next.index,1);const group=P.nextGroup(checked,current);assert.equal(group.break,null);assert.equal(group.activities[0].value,'0 → 1');}
  delete current.importInfo;assert.equal(check(raw,clockPlan,current).next.index,0,'undated snapshots do not complete '+reason);
  current.importInfo={timestamp:now+301};assert.equal(check(raw,clockPlan,current).status,'mismatch');assert.equal(check(raw,clockPlan,current).rows[0].status,'pending');
 }
 const resourcePlan=plan([{type:'wait',end:start+20,reason:'Collect 5 Truth Eggs'},{type:'wait',end:start+30,reason:'Wait for an earlier ship to return'},{type:'research',i:0,from:0,to:1}]);
 const current=live(raw);assert.equal(check(raw,resourcePlan,current).next.index,0,'time alone proves neither delivery milestones nor ship work');assert.ok(check(raw,resourcePlan,current).rows.slice(0,2).every(row=>row.status==='pending'));
 const missedPurchase=plan([{type:'research',i:0,from:0,to:1},{type:'wait',end:start+60,reason:reasons[0]},{type:'research',i:1,from:0,to:1,t:start+60}]);const checked=check(raw,missedPurchase,current);assert.equal(checked.next.index,0,'ended waits do not bypass an unpurchased upgrade');assert.equal(checked.rows[1].status,'elapsed');assert.equal(P.nextGroup(checked,current).break,null,'elapsed waits never reappear in the next batch');
 const overnightFunding=plan([{type:'wait',end:start+20,reason:'Go offline, then return to collect earnings'},{type:'wait',end:start+60,reason:reasons[7]},{type:'research',i:0,from:0,to:1,t:start+60}]);current.farm.research[S.D.research[0].id]=1;const overnight=check(raw,overnightFunding,current);assert.equal(overnight.rows[0].status,'superseded','an ended sleep wait cannot hide the observed funded purchase');assert.equal(overnight.rows[1].status,'elapsed');assert.equal(overnight.next,null);
 const separateBatches=plan([{type:'wait',end:start+20,reason:'Go offline, then return to collect earnings'},{type:'research',i:0,from:0,to:1,t:start+20},{type:'wait',end:start+60,reason:reasons[7]},{type:'research',i:1,from:0,to:1,t:start+60}]);const separate=check(raw,separateBatches,current);assert.equal(separate.rows[0].status,'superseded','a completed funding batch does not inherit the next batch after sleep');assert.equal(separate.next.index,3);
}
const grouped=plan([{type:'research',i:0,from:0,to:5}]);assert.equal(check(raw,grouped,f).next.remainingFrom,1);
// Actual equipped gear supersedes older sets only in the current visit.
const artifact=S.D.artifacts.find(a=>a.target==='research cost'),other=S.D.artifacts.find(a=>a.target==='egg laying rate');assert.ok(artifact&&other);
const gearRaw=farm();gearRaw.farm.loadouts={current:[],earnings:[{artifactId:artifact.id,stones:[]}],delivery:[{artifactId:other.id,stones:[]}]};
const equipment=plan([{type:'set',set:'earnings',loadout:gearRaw.farm.loadouts.earnings},{type:'set',set:'delivery',loadout:gearRaw.farm.loadouts.delivery}]);
f=live(gearRaw);f.farm.activeSet='delivery';report=check(gearRaw,equipment,f);assert.equal(report.rows[0].status,'superseded');assert.equal(report.rows[1].status,'present');assert.equal(report.next,null);assert.equal(report.purchaseCount,0);
f.farm.activeSet='current';assert.equal(check(gearRaw,equipment,f).next.index,0);
// TE totals use delivered milestones and claimed lower bounds; egg floors matter.
const targetPlan=plan([{type:'wait',end:start+60,reason:'Collect 1 Truth Egg'},{type:'ship-run',count:1}],26);
f=live(raw);f.farm.delivered[0]=S.D.te[5];report=check(raw,targetPlan,f);assert.equal(report.totalTE,26);assert.equal(report.targetReached,true);assert.equal(report.rows[0].status,'target-met');assert.equal(report.next.index,1,'required launches remain in the plan');
const floorRaw=structuredClone(raw);floorRaw.plan.floors=[5,6,5,5,5];report=check(floorRaw,targetPlan,f);assert.equal(report.targetReached,false);assert.equal(report.next.index,0);
f.farm.claimed[0]=6;report=check(raw,targetPlan,f);assert.equal(report.status,'claimed-target');assert.equal(report.next,null);
assert.equal(check(floorRaw,targetPlan,f).status,'mismatch','claiming the total alone does not satisfy a missing egg floor');
f=live(raw);f.farm.claimed[0]=6;assert.equal(check(raw,r,f).status,'mismatch');
const deliveredRaw=farm();deliveredRaw.farm.delivered[0]=S.D.te[7];assert.equal(check(deliveredRaw,r,live(raw)).status,'mismatch');
f=live(raw);f.farm.virtue='kindness';assert.equal(check(raw,r,f).status,'mismatch');f=live(raw,99);assert.equal(check(raw,r,f).status,'mismatch');f=live(raw);f.farm.shiftCount--;assert.equal(check(raw,r,f).status,'mismatch');
f=live(raw);f.importInfo.timestamp=start-1;assert.match(check(raw,r,f).warnings.join(' '),/predates/);f.importInfo.timestamp=now+301;assert.match(check(raw,r,f).warnings.join(' '),/future/);delete f.importInfo;report=check(raw,r,f);assert.equal(report.status,'matched');assert.equal(report.time,null);assert.match(report.warnings.join(' '),/No snapshot timestamp/);
// A remaining plan starts after its source backup. That backup and later
// backups remain usable; earlier or unrelated data must still be rejected.
{
let f;const remainingRaw=structuredClone(raw),sourceTime=start-600;remainingRaw.importInfo={timestamp:sourceTime};remainingRaw.plan.continuation={version:1,snapshotTime:sourceTime};
for(const time of [sourceTime,sourceTime+1,start-1,start,start+1]){const current=live(raw);current.importInfo.timestamp=time;const matched=check(remainingRaw,r,current);assert.equal(matched.status,'matched','remaining snapshot boundary '+time);assert.equal(matched.next.index,0);}
f=live(raw);f.importInfo.timestamp=sourceTime-1;report=check(remainingRaw,r,f);assert.equal(report.status,'mismatch');assert.match(report.warnings.join(' '),/older than the starting farm snapshot/);
f=live(raw);f.importInfo.timestamp=start-1;
for(const change of [x=>delete x.importInfo,x=>x.plan.continuation.version=2,x=>x.plan.continuation.snapshotTime=sourceTime-1,x=>x.plan.continuation.snapshotTime=NaN,x=>x.plan.continuation.snapshotTime=null,x=>{x.importInfo.timestamp=start+1;x.plan.continuation.snapshotTime=start+1;}]){const unrelated=structuredClone(remainingRaw);change(unrelated);assert.equal(check(unrelated,r,f).status,'mismatch','invalid/unbound continuation metadata cannot relax the plan-start guard');}
f=live(raw);f.importInfo.timestamp=sourceTime;f.farm.virtue='kindness';assert.equal(check(remainingRaw,r,f).status,'mismatch');f=live(raw);f.importInfo.timestamp=now+301;assert.match(check(remainingRaw,r,f).warnings.join(' '),/future/);
}
// Comparisons validate farm values but do not depend on an unfinished planning draft.
f.plan={target:'unfinished',ships:{mode:'bad'},sequence:[],sleep:{enabled:true,start:'bad'}};assert.equal(check(raw,r,f).status,'matched');f.farm.research[S.D.research[0].id]=999;assert.throws(()=>check(raw,r,f),/level/);
f=live(raw);f.importInfo.timestamp=Infinity;assert.throws(()=>check(raw,r,f),/snapshot timestamp/);f.importInfo.timestamp=1e100;assert.throws(()=>check(raw,r,f),/snapshot timestamp/);
const pristine=[structuredClone(raw),structuredClone(r),live(raw)];const before=JSON.stringify(pristine);check(...pristine);assert.equal(JSON.stringify(pristine),before,'comparison must not change the saved plan or snapshot');assert.notEqual(P.key(r),P.key({...r,actions:[...r.actions,{type:'wait'}]}));
console.log('PASS snapshot progress: repeated visits, partial research, permanent upgrades, silo baseline, gear, manual waits/fuel/launches, funding waits, TE/floors, ascension/stale/mismatched backups, draft independence, and immutable inputs.');
// The next step lists every remaining purchase funded by its preceding break.
const fundedGroupPlan=plan([
 {type:'wait',t:start,end:start+70,reason:'One offline break to fund a batch of purchases',earningsMode:'offline'},
 {type:'research',i:0,from:0,to:1,t:start+70},
 {type:'research',i:0,from:1,to:3,t:start+70},
 {type:'research',i:1,from:0,to:2,t:start+70},
 {type:'wait',t:start+70,end:start+170,reason:'One offline break to fund a batch of purchases',earningsMode:'offline'},
 {type:'research',i:1,from:2,to:3,t:start+170}
]);
const partialBatch=live(raw);partialBatch.farm.research.comfy_nests=2;
let batchReport=check(raw,fundedGroupPlan,partialBatch),batch=P.nextGroup(batchReport,partialBatch);
assert.equal(batch.break.seconds,70);assert.deepEqual(batch.activities.map(a=>[a.i,a.value]),[[0,'2 → 3'],[1,'0 → 2']]);
partialBatch.farm.research.comfy_nests=3;batchReport=check(raw,fundedGroupPlan,partialBatch);assert.equal(batchReport.next.index,0,'one completed research does not confirm a whole funded batch');
partialBatch.farm.research.nutritional_sup=2;batchReport=check(raw,fundedGroupPlan,partialBatch);assert.equal(batchReport.next.index,4,'all purchases present supersede their funding break');batch=P.nextGroup(batchReport,partialBatch);assert.equal(batch.break.seconds,100);assert.equal(batch.activities[0].value,'2 → 3');
batchReport=check(raw,fundedGroupPlan,live(raw),{confirmed:[0]});batch=P.nextGroup(batchReport,live(raw));assert.equal(batch.break,null);assert.equal(batch.activities.length,2);
assert.equal(P.nextGroup({status:'mismatch'},live(raw)),null);
