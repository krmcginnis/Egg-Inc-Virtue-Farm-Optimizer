'use strict';
// Optional independent audit. WASMEGG_REFERENCE points to an esbuild bundle
// exporting the named functions from the unmodified Wasmegg TypeScript source.
// This intentionally does not use the app's bundled purchase proposal engine.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const S=require('../src/simulator.cjs'),C=require('../src/colleggtibles.cjs'),P=require('../src/ships.cjs'),T=require('../src/staged-route.cjs');
if(!process.env.WASMEGG_REFERENCE)throw Error('Set WASMEGG_REFERENCE to a bundle of the pinned unmodified Wasmegg source (see audit).');
const R=require(path.resolve(process.env.WASMEGG_REFERENCE));
const report={referenceCommit:'9c2c0e4e7e5ac8bbf179f423f9fdb9a960993e67',states:0,researchPrices:0,habPrices:0,vehiclePrices:0,carPrices:0,tierChecks:0,colleggtibleSelections:0,shipChecks:0,maxRelativeError:0,maxRelativeErrorWithoutHabRounding:0,maxHabRoundingDifference:0,roundingStates:0};
let seed=0x15cafe;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;},pick=n=>Math.floor(random()*n);
function close(a,b,label,rel=1e-10,absolute=0){assert.ok(Math.abs(a-b)<=Math.max(absolute,Math.max(1,Math.abs(b))*rel),label+': '+a+' != '+b);}
const plan=process.env.WASMEGG_AUDIT_PLAN ? JSON.parse(fs.readFileSync(process.env.WASMEGG_AUDIT_PLAN)) : {config:require('../src/blank-farm.cjs')(1790812800),result:{actions:[]}};
const raw=structuredClone(plan.config),{s:initial,c:base}=S.prepare(raw);
function snapshot(s,c){
 const a=S.stats(s,c),{state,context}=T.adapt(s,c),b=R.computeSnapshot(state,context,{skipGrowth:true,skipEpochConversion:true});report.states++;
 const habDelta=Math.abs(a.hab-b.habCapacity);report.maxHabRoundingDifference=Math.max(report.maxHabRoundingDifference,habDelta);if(habDelta)report.roundingStates++;
 // Different multiplication grouping may ceil one extra chicken per hab.
 close(a.hab,b.habCapacity,'Habitat capacity',1e-12,4);
 for(const [ours,theirs]of [['laying','layRate'],['shipping','shippingCapacity'],['delivery','elr'],['eggValue','eggValue'],['online','onlineEarnings'],['offline','offlineEarnings']]){
  const value=b[theirs]/(['online','offline'].includes(ours)?S.at(c,s.t).earnings:1)*(ours==='offline'&&!c.pro?.5:1),error=Math.abs(a[ours]-value)/Math.max(1,Math.abs(value));report.maxRelativeError=Math.max(report.maxRelativeError,error);if(!habDelta)report.maxRelativeErrorWithoutHabRounding=Math.max(report.maxRelativeErrorWithoutHabRounding,error);
  close(a[ours],value,ours,Math.max(1e-10,habDelta/Math.max(1,b.habCapacity)+1e-12));
 }
 for(let i=0;i<S.D.research.length;i++){assert.equal(S.isUnlocked(s,i),R.isTierUnlocked(state.researchLevels,S.D.research[i].tier));report.tierChecks++;}
 close(a.siloHours*60,R.totalAwayTime(s.silos,c.epic.silo_capacity),'Silo coverage');
}
// Include real intermediate states, early tier unlocks, events, and both sets.
let state=initial;snapshot(state,base);
for(const [i,a]of plan.result.actions.entries()){
 state=a.type==='wait'?S.advance(state,base,a.end,a.reason,false,a.earningsMode||'auto'):S.buy(state,{...base,shiftSeconds:0,actionsSeconds:0,shipReplay:true},a,false);
 if(i%20===0||['set','shift'].includes(a.type))snapshot(state,base);
}
for(let sample=0;sample<240;sample++){
 const s=S.clone(initial),c={...base,epic:{...base.epic},claimedTotal:pick(491),video:pick(2)+1,pro:sample%2===0};s.r.fill(0);s.t=base.start+pick(150)*86400+pick(86400);
 const count=pick(S.D.research.reduce((n,r)=>n+r.levels,0)+1);
 for(let level=0;level<count;level++){const choices=S.D.research.map((r,i)=>s.r[i]<r.levels&&S.isUnlocked(s,i)?i:-1).filter(i=>i>=0);if(!choices.length)break;s.r[choices[pick(choices.length)]]++;}
 for(const r of S.D.epic)c.epic[r.id]=pick(r.levels+1);
 const tiers=Object.fromEntries(S.D.customEggs.map(e=>[e.identifier,pick(e.buffs.length+1)-1]));c.col=C.combine(tiers);assert.deepEqual(c.col,R.modifiersFromColleggtibleTiers(tiers));report.colleggtibleSelections++;
 s.h=Array.from({length:4},()=>sample%9===0?null:pick(19));s.silos=pick(c.pro?11:3);s.set=Object.keys(c.mods)[pick(Object.keys(c.mods).length)];
 const stats=S.stats(s,c);s.v=Array.from({length:17},(_,i)=>({id:i<stats.slots?pick(13)-1:null,cars:pick(stats.trainLength)+1}));for(const v of s.v)if(v.id===-1)v.id=null;
 snapshot(s,c);
}
assert.deepEqual(S.D.te,R.TE_BREAKPOINTS);assert.deepEqual(S.D.tierUnlock,R.TIER_UNLOCK_THRESHOLDS);
for(const threshold of R.TE_BREAKPOINTS)for(const factor of [1-1e-9,1,1+1e-9])assert.equal(S.countTE(threshold*factor),R.countTEThresholdsPassed(threshold*factor));
for(const discounts of [0,5,10]){
 const c={...base,calendar:S.calendar(Date.parse('2026-10-01T00:00:00Z')/1000,base.end,base.zone),epic:{...base.epic,cheaper_research:discounts,cheaper_contractors:discounts,bust_unions:discounts}},s=S.clone(initial);s.r.fill(0);
 for(const sale of [false,true]){s.t=Date.parse(sale?'2026-10-02T10:00:00-07:00':'2026-10-01T10:00:00-07:00')/1000;
  for(let i=0;i<S.D.research.length;i++){const data=S.D.research[i];for(let level=0;level<data.levels;level++){s.r[i]=level;const ref=R.getDiscountedVirtuePrice(R.getResearchById(data.id),level,{labUpgradeLevel:discounts,researchCostMultiplier:c.col.researchCost,puzzleCubeMultiplier:c.mods[s.set].research},sale);close(S.price(s,c,{type:'research',i}),ref,'Research price');report.researchPrices++;}s.r[i]=0;}
 }
 for(const h of R.habTypes)for(let copies=0;copies<4;copies++){s.h=[null,...Array(3).fill(null)];for(let i=1;i<=copies;i++)s.h[i]=h.id;close(S.price(s,c,{type:'hab',slot:0,id:h.id}),R.getDiscountedHabPrice(h,copies,{cheaperContractorsLevel:discounts,habCostMultiplier:c.col.habCost}),'Hab price');report.habPrices++;}
 for(const v of R.vehicleTypes)for(let copies=0;copies<17;copies++){s.v=Array.from({length:17},(_,i)=>({id:i>0&&i<=copies?v.id:null,cars:1}));close(S.price(s,c,{type:'vehicle',slot:0,id:v.id}),R.getDiscountedVehiclePrice(v.id,copies,{bustUnionsLevel:discounts,vehicleCostMultiplier:c.col.vehicleCost}),'Vehicle price');report.vehiclePrices++;}
 for(let cars=1;cars<10;cars++){s.v[0]={id:11,cars};close(S.price(s,c,{type:'car',slot:0}),R.getDiscountedTrainCarPrice(cars,{bustUnionsLevel:discounts,vehicleCostMultiplier:c.col.vehicleCost}),'Car price');report.carPrices++;}
}
for(let owned=0;owned<10;owned++)close(S.price({...initial,silos:owned},base,{type:'silo'}),R.nextSiloCost(owned),'Silo price');
for(let i=0;i<200;i++){const s={...initial,soul:10**(11+random()*24),shiftCount:pick(10001)};close(S.shiftCost(s),R.shiftCost(s.soul,s.shiftCount),'Switch cost');}
for(const ship of P.DATA.ships)for(const mission of ship.missions)for(const ftl of [0,1,30,60]){
 const actual=P.mission(ship.id,mission.id,ftl),shipId=R.Spaceship[ship.id],duration=R.DurationType[mission.id];assert.equal(actual.seconds,R.getEffectiveDuration(shipId,duration,ftl));assert.equal(actual.cost,R.SHIP_INFO[shipId].price);
 const fuels=Object.fromEntries(R.VIRTUE_FUEL_REQUIREMENTS[shipId][duration].map(x=>[x.egg,x.amount]));for(const [i,egg]of S.EGGS.entries())assert.equal(actual.fuel[i],fuels[egg]||0);report.shipChecks++;
}
// Explicit isolated coverage supplements the seeded intermediate farm samples.
for(const research of S.D.research) for(const level of [0,Math.floor(research.levels/2),research.levels]) {
 const s=S.clone(initial);s.r=S.D.research.map(r=>r.tier<research.tier?r.levels:0);s.r[S.RMAP[research.id]]=level;s.h=Array(4).fill(18);s.v=Array.from({length:17},(_,i)=>({id:i<4?11:null,cars:5}));snapshot(s,base);
}
for(const epic of S.D.epic) for(const level of [0,Math.floor(epic.levels/2),epic.levels]) {
 const c={...base,epic:Object.fromEntries(S.D.epic.map(r=>[r.id,0]))};c.epic[epic.id]=level; snapshot(initial,c);
}
for(const pro of [false,true]) for(const h of S.D.habs) {
 const s=S.clone(initial);s.r.fill(0);s.h=[h.id,null,null,null];s.v=Array.from({length:17},(_,i)=>({id:i===0?0:null,cars:1}));snapshot(s,{...base,pro});
}
for(const vehicle of S.D.vehicles) for(const maxed of [false,true]) {
 const s=S.clone(initial);s.r=S.D.research.map(r=>maxed?r.levels:0);s.v=Array.from({length:17},(_,i)=>({id:i===0?vehicle.id:null,cars:vehicle.id===11&&maxed?10:1}));snapshot(s,base);
}
for(const a of S.D.artifacts) {
 const tier=R.allPossibleTiers.find(t=>t.afx_id===a.afxId&&t.afx_level===a.afxLevel),ref=R.getArtifact(tier.family.id+'-'+tier.tier_number+'-'+a.rarity);
 assert.equal(a.delta,ref.effectDelta);assert.equal(a.target,ref.effectTarget);assert.equal(a.slots,ref.slots);
 const gear=[{artifactId:a.id,stones:[]}],c={...base,loadouts:{test:gear},mods:{test:S.modifiers(gear)}},s={...S.clone(initial),set:'test'};snapshot(s,c);
}
for(const stone of S.D.stones) {
 const ref=R.getStone(stone.id);if(ref){assert.equal(stone.delta,ref.effectDelta);assert.equal(stone.target,ref.effectTarget);}
 const gear=[{artifactId:'ornate-gusset-4-3',stones:[stone.id]}],c={...base,loadouts:{test:gear},mods:{test:S.modifiers(gear)}},s={...S.clone(initial),set:'test'};snapshot(s,c);
}
report.isolatedCoverage={commonResearch:S.D.research.length,epicResearch:S.D.epic.length,artifacts:S.D.artifacts.length,stones:S.D.stones.length,habs:S.D.habs.length,vehicles:S.D.vehicles.length};
report.passed=true;report.date=new Date().toISOString();fs.mkdirSync(path.resolve(__dirname,'../tmp/model-audit'),{recursive:true});fs.writeFileSync(path.resolve(__dirname,'../tmp/model-audit/reference-math.json'),JSON.stringify(report,null,2));console.log(report);
