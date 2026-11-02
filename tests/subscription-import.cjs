'use strict';
const assert=require('node:assert/strict'),I=require('../src/importer.cjs'),S=require('../src/simulator.cjs'),A=require('../src/api.cjs'),blank=require('../src/blank-farm.cjs');
const now=1791388800;
function fixture(){return {approxTime:now,game:{permitLevel:1,soulEggsD:1e20},virtue:{eovEarned:Array(5).fill(20),eggsDelivered:Array(5).fill(0),afx:{}},farms:[{eggType:50,habs:[0,19,19,19],vehicles:[0],silosOwned:1}]};}
const existing=blank(now-3600);Object.assign(existing.farm,{claimed:Array(5).fill(5),videoDoubler:false,cash:12345});existing.plan.priority='switches';
for(const scope of ['farm','account','auto']){
 for(const info of [{subscriptionLevel:1,status:1},{subscriptionLevel:'PRO',status:'ACTIVE'},{subscription_level:'PRO',status:'ACTIVE'}]){
  const b=fixture();b.sub_info={...info,original_transaction_id:'synthetic-private-transaction',period_end:now+86400};if(scope==='auto')b.farms=[{eggType:1}];
  const cfg=I.importBackup({backup:b},existing,now,{scope});assert.equal(cfg.farm.videoDoubler,true);assert.equal(cfg.importInfo.ultraProActive,true);assert.equal(S.prepare(cfg).c.video,2);assert.equal(cfg.plan.priority,'switches');assert.ok(cfg.importInfo.warnings.some(w=>w.includes('active (2×) from ULTRA Pro')));assert.ok(!JSON.stringify(cfg).includes('synthetic-private-transaction'));assert.equal(existing.farm.videoDoubler,false);
  if(scope!=='farm'){assert.equal(cfg.farm.cash,12345);assert.equal(cfg.plan.start,existing.plan.start);}
 }
 for(const info of [undefined,{}, {subscriptionLevel:0,status:1},{subscriptionLevel:'STANDARD',status:'ACTIVE'},...[0,2,3,4,5].map(status=>({subscriptionLevel:1,status})),...['UNKNOWN','EXPIRED','REVOKED','GRACE_PERIOD','PAUSE_HOLD'].map(status=>({subscriptionLevel:'PRO',status}))]){
  const b=fixture();b.subInfo=info;if(scope==='auto')b.farms=[];const cfg=I.importBackup(b,existing,now,{scope});assert.equal(cfg.farm.videoDoubler,false,JSON.stringify({scope,info}));assert.equal(cfg.importInfo.ultraProActive,false);const active=structuredClone(existing);active.farm.videoDoubler=true;assert.equal(I.importBackup(b,active,now,{scope}).farm.videoDoubler,true,'non-Pro imports preserve manual active settings');
 }
}
// The protobuf decoder used by actual EID imports delivers the same decision.
const b=fixture();b.subInfo={subscriptionLevel:1,status:1};const decoded=A.decodeResponse(A.Resp.encode(A.Resp.create({backup:b})).finish());assert.equal(I.importAll(decoded,existing,now).farm.videoDoubler,true);
b.game.permitLevel=0;assert.equal(I.importAll(b,existing,now).farm.videoDoubler,true,'ULTRA Pro is independent of the one-time permit');
// Current-run Virtue launch history includes collected missions, deduplicates
// archive/active copies, and never counts a ship still on the fueling pad.
const H=require('../src/mission-history.cjs'),ships=fixture();ships.virtue.resets=2;
const mission=(id,extra={})=>({identifier:id,type:1,resetIndex:2,ship:9,durationType:2,status:10,startTimeDerived:now-600,durationSeconds:1200,...extra});
ships.artifactsDb={missionInfos:[mission('active-1'),mission('active-2'),mission('active-3'),mission('collected',{status:20})],missionArchive:[mission('collected',{status:25}),mission('old-run',{resetIndex:1,status:25}),mission('home',{type:0,status:25})],virtueAfxDb:{fuelingMission:mission('ready',{type:undefined,status:5,startTimeDerived:0})}};
const original=JSON.stringify(ships),imported=I.importAll(ships,existing,now),summary=H.summarize(imported);assert.equal(summary.total,4);assert.equal(summary.active,3);assert.equal(summary.returned,1);assert.equal(imported.farm.shipFlights.length,3);assert.equal(imported.farm.preparedShip.ship,'HENERPRISE');assert.equal(imported.farm.preparedShip.status,'PREPARE_TO_LAUNCH');assert.equal(JSON.stringify(ships),original);
const since=H.summarize(imported,{start:now-100,initial:existing});assert.equal(since.total,0,'launches before the plan start are not credited to its obligations');
const rows=[{index:10,action:{type:'ship-run',batches:[{ship:'HENERPRISE',duration:'EPIC',count:3}]}},{index:20,action:{type:'ship-run',batches:[{ship:'HENERPRISE',duration:'EPIC',count:7}]}}];assert.deepEqual(H.counts(existing,{start:now-3600},imported,rows).launched,{'10':[3],'20':[1]});
const encoded=A.Resp.encode(A.Resp.create({backup:ships})).finish(),fromProto=I.importAll(A.decodeResponse(encoded),existing,now);assert.equal(H.summarize(fromProto).total,4);assert.equal(fromProto.farm.preparedShip.ship,'HENERPRISE');
const account=I.importAccount(ships,existing,now);assert.equal(H.summarize(account).total,4);assert.equal(account.farm.preparedShip.ship,'HENERPRISE');
const fueling=structuredClone(ships);fueling.artifactsDb.virtueAfxDb.fuelingMission.status=0;const inProgress=I.importAll(fueling,imported,now);assert.equal(inProgress.farm.preparedShip,null);assert.equal(H.summarize(inProgress).total,4);assert.ok(inProgress.importInfo.warnings.some(w=>/Finish fueling/.test(w)));
const missing=fixture(),without=I.importAll(missing,imported,now);assert.equal(H.summarize(without),null,'missing history is not a newly observed zero or retained from another account');assert.equal(without.farm.preparedShip,null);const reset=structuredClone(imported);reset.importInfo.virtueResetIndex++;assert.equal(H.summarize(reset),null);
const empty=fixture();empty.artifactsDb={};const emptyDecoded=A.decodeResponse(A.Resp.encode(A.Resp.create({backup:empty})).finish());assert.equal(H.summarize(I.importAll(emptyDecoded,existing,now)).total,0,'omitted empty repeated protobuf fields still supply an automatic recorded zero');
const Fleet=require('../src/ships.cjs'),fuelFarm={preparedShip:imported.farm.preparedShip,fuelTank:{capacity:500e12,amounts:{}},epic:{afx_mission_time:60}},efficient=Fleet.prepare(fuelFarm,{ships:{mode:'efficient-two-visits'}},S.number);
assert.equal(Fleet.collectionTargets({preparedShip:efficient.prepared},{ships:efficient})[0],150e12);assert.equal(Fleet.collectionTargets({preparedShip:null},{ships:efficient})[0],175e12,'H2 cannot reuse the ready ship credit');
const maximum=Fleet.prepare(fuelFarm,{ships:{mode:'custom-two-visits',visits:[{missions:[{ship:'HENERPRISE',duration:'EPIC',count:1},{ship:'HENERPRISE',duration:'EPIC',count:null}]},{missions:[]}]}},S.number);assert.equal(maximum.runs[0].count,8,'Tank Maximum credits one loaded ship, once across duplicate groups');
console.log('PASS active ULTRA Pro in numeric/named/snake-case backups and real protobuf decoding, farm/account/automatic imports, inactive/non-Pro retention, permit independence, priority retention, non-mutation, and transaction privacy.');
