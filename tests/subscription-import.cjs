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
console.log('PASS active ULTRA Pro in numeric/named/snake-case backups and real protobuf decoding, farm/account/automatic imports, inactive/non-Pro retention, permit independence, priority retention, non-mutation, and transaction privacy.');
