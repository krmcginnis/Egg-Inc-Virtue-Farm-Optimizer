'use strict';
// Optional model audit, separate from solver quality. The reference bundle must
// export unmodified upstream Wasmegg formulas; see the current release audit.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const S=require('../src/simulator.cjs'),T=require('../src/staged-route.cjs'),P=require('../src/ships.cjs'),C=require('../src/colleggtibles.cjs');
const {fixture}=require('./research-sale-plans.cjs');
if(!process.env.WASMEGG_REFERENCE)throw Error('Set WASMEGG_REFERENCE to the independent upstream reference bundle.');
const R=require(path.resolve(process.env.WASMEGG_REFERENCE)),sec=s=>Date.parse(s)/1000;
const report={compoundResearchPrices:0,priceRoundingDifferences:0,integerPriceDifferences:0,maxIntegerPriceDifference:0,maxPriceRelativeDifference:0,priceRoundingExamples:[],passiveIntegrals:0,dstIntegrals:0,fuelCases:0,eventBoundaryChecks:0,eventComparisons:[],pendingTEBonus:false};
function close(a,b,label,absolute=1e-6){assert.ok(Math.abs(a-b)<=Math.max(absolute,Math.max(1,Math.abs(b))*1e-10),label+': '+a+' != '+b);}
function raw(date='2026-10-12T00:00:00Z'){
 const x=fixture();Object.assign(x.plan,{start:sec(date),solverVersion:2,strategy:'user',autoSequence:false,sequence:'C K I R H',maxDays:10,eventTimezone:'America/Los_Angeles',sleep:{enabled:true,start:'08:00',end:'10:00'},actionSeconds:0,shiftSeconds:0});
 x.farm.cash=0;return x;
}
function rates(s,c){
 const {state,context}=T.adapt(s,c);
 // Reference rates have no event multiplier. Event timestamps below come
 // directly from upstream, rather than from this app's calendar/adapter.
 state.earningsBoost={active:false,multiplier:2};state.activeSales.research=false;
 const b=R.computeSnapshot(state,context,{skipGrowth:true,skipEpochConversion:true});
 return {online:b.onlineEarnings,offline:b.offlineEarnings*(c.pro?1:.5),delivery:b.elr,laying:b.layRate,coverage:R.totalAwayTime(s.silos,c.epic.silo_capacity)*60};
}
function boosted(t){return R.getNextEarningsBoostEnd(t)<R.getNextEarningsBoostStart(t);}
const pacific=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
// Compound research discounts: Cube rarity, colleggtible, Epic discount, and
// sale multiply before rounding. Check every level, not just a few endpoints.
const cubes=S.D.artifacts.filter(a=>a.target==='research cost');
assert.ok(cubes.length,'research Cube variants are present');
for(const cube of [null,...cubes])for(const highCol of [false,true])for(const epic of [0,10]){
 const x=raw('2026-10-01T17:00:00Z');x.farm.loadouts={current:cube?[{artifactId:cube.id,stones:[]}]:[]};x.farm.epic.cheaper_research=epic;
 const {s,c}=S.prepare(x),tiers=Object.fromEntries(S.D.customEggs.map(e=>[e.identifier,highCol?e.buffs.length-1:-1]));c.col=C.combine(tiers);
 const col=R.modifiersFromColleggtibleTiers(tiers),refCube=cube?R.getArtifact(T.adapt(s,c).state.artifactLoadout[0].artifactId).effectDelta:0;
 for(const sale of [false,true]){s.t=sec(sale?'2026-10-02T17:00:00Z':'2026-10-01T17:00:00Z');
  for(const [i,data]of S.D.research.entries())for(let level=0;level<data.levels;level++){
   s.r[i]=level;const price=R.getDiscountedVirtuePrice(R.getResearchById(data.id),level,{labUpgradeLevel:epic,researchCostMultiplier:col.researchCost,puzzleCubeMultiplier:1+refCube},sale);
   const actual=S.price(s,c,{type:'research',i});
   // Record ceil/multiplication-order discrepancies rather than erase them
   // through a broad relative tolerance. Permit at most one gem or float ULPs.
   if(actual!==price){report.priceRoundingDifferences++;const error=Math.abs(actual-price)/Math.max(1,price),example={cube:cube?.id||null,highCol,epic,sale,research:data.id,level,actual,reference:price};if(error>report.maxPriceRelativeDifference){report.maxPriceRelativeDifference=error;report.worstPriceRounding=example;}if(price<=Number.MAX_SAFE_INTEGER){report.integerPriceDifferences++;report.maxIntegerPriceDifference=Math.max(report.maxIntegerPriceDifference,Math.abs(actual-price));}if(report.priceRoundingExamples.length<5)report.priceRoundingExamples.push(example);}
   assert.ok(Math.abs(actual-price)<=Math.max(1,Math.abs(price)*Number.EPSILON*4),'Compound price discrepancy exceeds integer/float rounding');report.compoundResearchPrices++;
  }
 }
}
// Two full calendar days: independently integrate minute intervals through
// Pacific Monday boost, forced offline sleep, and real silo exhaustion.
for(const pro of [false,true])for(const lunar of [false,true])for(const mode of ['online','offline'])for(const silos of [1,2]){
 const x=raw();Object.assign(x.farm,{proPermit:pro,silos,earningsMode:'offline',loadouts:{current:lunar?[{artifactId:'lunar-totem-4-3',stones:['lunar-stone-3']}]:[]}});x.farm.epic.silo_capacity=0;
 const {s,c}=S.prepare(x),b=rates(s,c),end=s.t+172800;let cash=0,productive=0;
 for(let t=s.t;t<end;t+=60){
  const parts=pacific.formatToParts(new Date(t*1000)),hour=Number(parts.find(p=>p.type==='hour').value),minute=Number(parts.find(p=>p.type==='minute').value),clock=hour*3600+minute*60;
  const asleep=hour>=8&&hour<10,producing=!asleep||clock-8*3600<b.coverage;
  if(producing){cash+=60*(asleep||mode==='offline'?b.offline:b.online)*(boosted(t)?2:1);productive+=60;}
 }
 const n=S.advance(s,c,end,'Independent reference integration',true,mode);
 close(n.cash,cash,'Passive cash');close(n.eggs[s.egg]-s.eggs[s.egg],productive*b.delivery,'Passive delivery');
 assert.equal(n.path.action.siloEmptySeconds,2*Math.max(0,7200-b.coverage));report.passiveIntegrals++;
}
// DST nights are explicit UTC spans: coverage is elapsed time, not wall time.
for(const [start,end,nightSeconds]of [['2026-03-08T07:00:00Z','2026-03-08T14:00:00Z',25200],['2026-11-01T06:00:00Z','2026-11-01T15:00:00Z',32400]]){
 const x=raw(start);x.plan.sleep={enabled:true,start:'23:00',end:'07:00'};x.farm.epic.silo_capacity=0;x.farm.silos=2;
 const {s,c}=S.prepare(x),b=rates(s,c),n=S.advance(s,c,sec(end),'DST independent reference',true,'online');
 close(n.cash,Math.min(nightSeconds,b.coverage)*b.offline,'DST cash');close(n.eggs[0]-s.eggs[0],Math.min(nightSeconds,b.coverage)*b.delivery,'DST delivery');
 assert.equal(n.path.action.siloEmptySeconds,nightSeconds-b.coverage);report.dstIntegrals++;
}
// Pending TE affects the target only; unclaimed eggs do not grant earnings.
{
 const {s,c}=S.prepare(raw()),b=rates(s,c),n=S.clone(s);n.eggs[0]=R.TE_BREAKPOINTS[50];
 close(S.stats(n,c).online,b.online,'Pending TE earnings');assert.ok(S.totalTE(n,c)>S.totalTE(s,c));
 report.pendingTEBonus=false;
}
// Single-launch conservation and parallel tank/farm timing. Reference defines
// required fuel and laying rate; the transfer rate is entered explicitly.
for(const storedFraction of [0,.25,1]){
 const x=raw('2026-10-08T17:00:00Z');x.plan.sleep.enabled=false;x.farm.virtue='humility';x.plan.sequence='H I';x.farm.cash=1e100;
 x.plan.ships={mode:'legacy',slots:3,missions:[{ship:'HENERPRISE',duration:'EPIC',count:1}]};x.farm.fuelTank={capacity:500e12,outputPerMinute:9e12,amounts:{}};
 const refFuel=R.VIRTUE_FUEL_REQUIREMENTS[R.Spaceship.HENERPRISE][R.DurationType.EPIC],fuels=Object.fromEntries(refFuel.map(f=>[f.egg,f.amount]));
 for(const egg of S.EGGS)x.farm.fuelTank.amounts[egg]=(fuels[egg]||0)*(egg==='humility'?storedFraction:1);
 const {s,c}=S.prepare(x),b=rates(s,c),h=fuels.humility||0,q=9e12/60,first=Math.min(s.fuel[2]/q,h/(q+b.laying)),farm=(h-first*(q+b.laying))/b.laying,foreign=refFuel.filter(f=>f.egg!=='humility').reduce((v,f)=>v+f.amount,0);
 const expected=first+Math.max(farm,foreign/q),n=P.launch(s,c),a=n.path.action;
 close(n.t-s.t,expected,'Ship launch time');for(const [i,egg]of S.EGGS.entries())close(n.fuel[i],i===2?s.fuel[2]-first*q:0,'Fuel inventory '+egg);
 close(n.eggs[2]-s.eggs[2],Math.max(0,foreign/q-farm)*b.delivery,'Only nondiverted ship time delivers TE',b.delivery*1e-6);
 assert.equal(a.launches[0].returnAt-a.launches[0].t,R.getEffectiveDuration(R.Spaceship.HENERPRISE,R.DurationType.EPIC,c.ships.ftl));report.fuelCases++;
}
// Low shipping does not slow fuel diversion. Empty silos do stop laying.
{
 const x=raw('2026-10-08T05:00:00Z');x.plan.sleep={enabled:true,start:'23:00',end:'07:00'};x.farm.habs=[0,0,0,0];x.farm.research={};x.farm.vehicles=Array.from({length:17},()=>({id:null,cars:1}));x.farm.epic.silo_capacity=0;x.farm.silos=1;
 x.plan.ships={mode:'legacy',slots:3,missions:[{ship:'HENERPRISE',duration:'EPIC',count:1}]};x.farm.fuelTank={capacity:500e12,outputPerMinute:9e12,amounts:{}};
 const {s,c}=S.prepare(x),b=rates(s,c),amount=b.laying*3*3600,n=P.store(s,c,amount);assert.equal(b.delivery,0);assert.ok(b.laying>0);
 // Start 22:00 PDT: one awake hour + one covered hour + one after wake.
 assert.equal(n.t,sec('2026-10-08T15:00:00Z'));assert.equal(n.cash,s.cash);assert.deepEqual(n.eggs,s.eggs);close(n.fuel[0]-s.fuel[0],amount,'Stored fuel');report.fuelCases++;
}
// Pacific event start/end and one second on either side agree independently,
// regardless of the selected sleep/display timezone.
for(const date of ['2026-03-06T00:00:00Z','2026-10-02T00:00:00Z','2026-10-30T00:00:00Z','2026-12-04T00:00:00Z'])for(const zone of ['America/Los_Angeles','America/New_York','UTC','Asia/Kathmandu']){
 const start=sec(date),x=raw(date);x.plan.eventTimezone=zone;const {c}=S.prepare(x);
 for(const [fn,field,before,after]of [['getNextSaleStart','sale',1,.3],['getNextSaleEnd','sale',.3,1],['getNextEarningsBoostStart','earnings',1,2],['getNextEarningsBoostEnd','earnings',2,1]]){
  const edge=R[fn](start);assert.equal(S.at(c,edge-1)[field],before);assert.equal(S.at(c,edge)[field],after);assert.equal(S.at(c,edge+1)[field],after);report.eventBoundaryChecks+=3;
 }
}
// Selected zones no longer override the physical game-event timestamps.
for(const date of ['2026-10-02T00:00:00Z','2026-12-04T00:00:00Z'])for(const zone of ['America/Los_Angeles','America/New_York','UTC','Asia/Kathmandu']){
 const start=sec(date),calendar=S.calendar(start,start+2*86400,zone),ours=calendar.find(e=>e.t>start&&e.sale===.3)?.t,reference=R.getNextSaleStart(start);
 assert.ok(Number.isFinite(ours));assert.equal(ours,reference);
 report.eventComparisons.push({date,zone,offsetSeconds:ours-reference});
}
report.passed=true;report.date=new Date().toISOString();
fs.mkdirSync(path.resolve(__dirname,'../tmp/model-audit'),{recursive:true});fs.writeFileSync(path.resolve(__dirname,'../tmp/model-audit/game-model-audit.json'),JSON.stringify(report,null,2));console.log(report);
