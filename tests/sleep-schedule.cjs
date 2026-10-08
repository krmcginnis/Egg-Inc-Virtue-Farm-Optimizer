'use strict';
const assert=require('node:assert/strict'),Sleep=require('../src/sleep-schedule.cjs');
const S=require('../src/simulator.cjs'),O=require('../src/optimizer.cjs'),Ships=require('../src/ships.cjs');
const Summary=require('../src/shift-summary.cjs'),Incumbents=require('../src/plan-incumbents.cjs');
const {fixture}=require('./research-sale-plans.cjs');
const t=value=>Date.parse(value)/1000,DAY=86400;
function schedule(start,end,zone='UTC',date='2026-10-08T00:00:00Z',days=3){return Sleep.compile({enabled:true,start,end,timezone:zone},t(date),t(date)+days*DAY);}
function close(actual,expected){assert.ok(Math.abs(actual-expected)<=Math.max(1,Math.abs(expected))*1e-10,actual+' differs from '+expected);}
function rawAt(date='2026-10-08T22:59:59Z'){
 const raw=fixture();Object.assign(raw.plan,{start:t(date),eventTimezone:'UTC',solverVersion:2,maxDays:10,target:101,strategy:'user',autoSequence:false,sequence:'C K I R H',sleep:{enabled:true,start:'23:00',end:'07:00'}});return raw;
}
function validateInteractions(actions,c){for(const a of actions){
 if(a.type==='wait')continue;
 if(a.type==='ship-run'){assert.ok(a.interactions.length);for(const i of a.interactions)Sleep.assertActive(c.sleep,i.t,i.end-i.t);}
 else Sleep.assertActive(c.sleep,a.t,a.type==='shift'?c.shiftSeconds:['research','hab','vehicle','car','silo','set'].includes(a.type)?c.actionsSeconds:0);
}}
async function run(){
 const overnight=schedule('23:00','07:00');
 assert.equal(Sleep.nextActive(overnight,t('2026-10-08T23:00:00Z')),t('2026-10-09T07:00:00Z'));
 assert.equal(Sleep.nextActive(overnight,t('2026-10-08T22:59:59Z'),1),t('2026-10-08T22:59:59Z'));
 assert.equal(Sleep.nextActive(overnight,t('2026-10-08T22:59:59Z'),2),t('2026-10-09T07:00:00Z'));
 assert.ok(Sleep.active(overnight,t('2026-10-09T07:00:00Z')));
 assert.equal(Sleep.seconds(overnight,t('2026-10-08T00:00:00Z'),t('2026-10-09T00:00:00Z')),8*3600);
 assert.equal(Sleep.activeDeadline(overnight,t('2026-10-08T22:00:00Z'),2*3600),t('2026-10-09T08:00:00Z'));
 const daytime=schedule('12:00','14:00');assert.equal(Sleep.nextActive(daytime,t('2026-10-08T13:00:00Z')),t('2026-10-08T14:00:00Z'));
 const nepal=schedule('23:00','07:00','Asia/Kathmandu');assert.equal(Sleep.nextActive(nepal,t('2026-10-08T17:15:00Z')),t('2026-10-09T01:15:00Z'));
 const spring=schedule('23:00','07:00','America/Los_Angeles','2026-03-08T00:00:00Z');assert.equal(Sleep.seconds(spring,t('2026-03-08T07:00:00Z'),t('2026-03-08T14:00:00Z')),7*3600);
 const fall=schedule('23:00','07:00','America/Los_Angeles','2026-11-01T00:00:00Z');assert.equal(Sleep.seconds(fall,t('2026-11-01T06:00:00Z'),t('2026-11-01T15:00:00Z')),9*3600);
 const skipped=schedule('02:30','04:00','America/Los_Angeles','2026-03-08T00:00:00Z');assert.equal(Sleep.boundary(skipped,t('2026-03-08T09:00:00Z')),t('2026-03-08T10:00:00Z'));
 const repeated=schedule('01:15','01:45','America/Los_Angeles','2026-11-01T00:00:00Z');assert.equal(Sleep.nextActive(repeated,t('2026-11-01T08:15:00Z')),t('2026-11-01T09:45:00Z'));
 assert.throws(()=>schedule('23:00','23:00'),/must differ/);assert.throws(()=>schedule('24:00','07:00'),/HH:MM/);assert.throws(()=>schedule('23:00','07:00','Invalid/Zone'),/timezone/);
 assert.equal(Sleep.compile({enabled:false,start:'invalid'},1,2),undefined);
 const sharedRaw=rawAt();sharedRaw.plan.eventTimezone='Asia/Kathmandu';sharedRaw.plan.sleep.timezone='America/Los_Angeles';
 const shared=S.prepare(sharedRaw);assert.equal(shared.c.sleep.timezone,shared.c.zone);assert.equal(shared.c.sleep.timezone,'Asia/Kathmandu','a legacy independent sleep timezone cannot override the plan timezone');
 const sharedChanged=structuredClone(sharedRaw);sharedChanged.plan.eventTimezone='America/Los_Angeles';const changed=S.prepare(sharedChanged);assert.equal(changed.c.sleep.timezone,'America/Los_Angeles');assert.notEqual(Sleep.nextActive(shared.c.sleep,t('2026-10-08T18:00:00Z')),Sleep.nextActive(changed.c.sleep,t('2026-10-08T18:00:00Z')));
 assert.equal(Sleep.productiveSeconds(fall,t('2026-11-01T06:00:00Z'),t('2026-11-01T15:00:00Z'),8*3600),8*3600,'fall-back nights use real silo coverage');
 assert.equal(Sleep.requiredCoverage(fall,t('2026-10-31T20:00:00Z'),t('2026-11-02T00:00:00Z')),9*3600);
 assert.equal(Sleep.requiredCoverage(fall,t('2026-10-31T20:00:00Z'),t('2026-11-01T05:00:00Z')),0,'do not buy coverage for nights beyond the planning horizon');
 assert.equal(Sleep.requiredCoverage(overnight,t('2026-10-08T22:00:00Z'),t('2026-10-09T02:00:00Z')),3*3600,'a horizon ending during sleep needs only its covered portion');
 // Compare cash against an independent minute-by-minute integral, including
 // a Monday double-earnings boundary and standard-permit offline earnings.
 const cashRaw=rawAt('2026-10-12T00:00:00Z');cashRaw.plan.sleep={enabled:true,start:'08:00',end:'10:00',timezone:'UTC'};cashRaw.plan.eventTimezone='UTC';cashRaw.farm.proPermit=false;cashRaw.farm.earningsMode='online';cashRaw.farm.loadouts={current:[]};
 const cashCase=S.prepare(cashRaw),rates=S.stats(cashCase.s,cashCase.c),end=cashCase.s.t+DAY;
 let expected=cashCase.s.cash;
 for(let time=cashCase.s.t;time<end;time+=60){const hour=new Date(time*1000).getUTCHours();expected+=60*(hour>=8&&hour<10?rates.offline:rates.online)*(hour>=9?2:1);}
 const accrued=S.advance(cashCase.s,cashCase.c,end,'Cash oracle',true,'online');close(accrued.cash,expected);close(accrued.eggs[0]-cashCase.s.eggs[0],rates.delivery*DAY);assert.equal(accrued.path.action.forcedOfflineSeconds,7200);
 // With one hour of silo coverage, an eight-hour sleep has seven hours of
 // stopped production. Both funding and TE completion include that downtime.
 const emptyRaw=rawAt('2026-10-08T22:00:00Z');emptyRaw.farm.epic.silo_capacity=0;emptyRaw.farm.silos=1;
 const emptyCase=S.prepare(emptyRaw),emptyRates=S.stats(emptyCase.s,emptyCase.c),morning=t('2026-10-09T08:00:00Z');assert.equal(emptyRates.siloHours,1);
 const stalled=S.advance(emptyCase.s,emptyCase.c,morning,'Silo expiry test',true,'online');close(stalled.cash-emptyCase.s.cash,emptyRates.online*2*3600+emptyRates.offline*3600);close(stalled.eggs[0]-emptyCase.s.eggs[0],emptyRates.delivery*3*3600);assert.equal(stalled.path.action.siloEmptySeconds,7*3600);assert.equal(S.productionEnd(emptyCase.s,emptyCase.c,3*3600),morning);
 // Independent repeated-night oracle: a Lunar earning set must not bypass
 // silo expiry. Real paid R purchases persist after shifts to other Virtues.
 for(const count of [1,2,3])for(const mode of ['online','offline']){
  const probe=rawAt('2026-10-08T22:00:00Z');Object.assign(probe.farm,{silos:count,earningsMode:'offline',loadouts:{current:[{artifactId:'lunar-totem-4-3',stones:[]}],earnings:[],delivery:[]}});
  probe.plan.eventTimezone='UTC';const prepared=S.prepare(probe),r=S.stats(prepared.s,prepared.c);let cash=prepared.s.cash,production=0;
  assert.ok(r.offline>r.online);
  for(let elapsed=0;elapsed<2*DAY;elapsed+=60){const time=prepared.s.t+elapsed,hour=new Date(time*1000).getUTCHours(),asleep=hour>=23||hour<7,sleepElapsed=hour>=23?(hour-23)*3600:(hour+1)*3600;
   if(!asleep||sleepElapsed<r.siloHours*3600){cash+=60*(asleep||mode==='offline'?r.offline:r.online)*S.at(prepared.c,time).earnings;production+=60;}
  }
  const n=S.advance(prepared.s,prepared.c,prepared.s.t+2*DAY,'Repeated-night cash and delivery oracle',true,mode);
  close(n.cash,cash);close(n.eggs[0]-prepared.s.eggs[0],production*r.delivery);assert.equal(n.path.action.siloEmptySeconds,2*Math.max(0,8-r.siloHours)*3600);
 }
 // Visiting R before bedtime buys only enough coverage, pays every silo,
 // and retains that coverage after leaving. Delaying R loses first-night
 // cash and delivered eggs, not just the ability to make purchases.
 const T=require('../src/staged-route.cjs'),Ref=require('../src/wasmegg-stage-engine.cjs');
 const earlyRaw=rawAt('2026-10-08T22:00:00Z');earlyRaw.plan.sequence='C R K';earlyRaw.farm.cash=1e80;
 const earlyCase=S.prepare(earlyRaw),onR=S.buy(earlyCase.s,earlyCase.c,{type:'shift',egg:3});
 const enough=T.step(onR,earlyCase.c,'R1',3,Ref.runR1,3600),oldRecipe=T.step(onR,earlyCase.c,'Candidate',3,Ref.runR1,3600);
 assert.equal(enough.silos,3);assert.ok(oldRecipe.silos>enough.silos&&oldRecipe.t>enough.t,'sleep seed avoids paying for unnecessary coverage');
 const purchases=S.history(enough).filter(a=>a.type==='silo');assert.equal(purchases.length,2);assert.deepEqual(purchases.map(a=>a.cost),[1e8,1e8*2**21]);
 const onK=S.buy(enough,earlyCase.c,{type:'shift',egg:4}),covered=S.advance(onK,earlyCase.c,morning,'Covered first night',true,'online');assert.equal(covered.silos,3);assert.equal(covered.path.action.siloEmptySeconds,0);
 const delayed=S.advance(earlyCase.s,earlyCase.c,morning,'R delayed until morning',true,'online');assert.equal(delayed.path.action.siloEmptySeconds,5*3600);
 const kRates=S.stats(onK,earlyCase.c);close(covered.cash,onK.cash+kRates.online*(t('2026-10-08T23:00:00Z')-onK.t+3600)+kRates.offline*8*3600);
 const lateR=S.buy(delayed,earlyCase.c,{type:'shift',egg:3}),lateEnough=T.step(lateR,earlyCase.c,'R1',3,Ref.runR1,3600);assert.equal(lateEnough.silos,3);
 const bedtimeR=S.advance(onR,earlyCase.c,t('2026-10-08T23:00:00Z'),'Bedtime before a silo purchase',true,'online'),afterWake=S.buy(bedtimeR,earlyCase.c,{type:'silo'});
 const wakeActions=S.history(afterWake);assert.equal(wakeActions.findLast(a=>a.type==='silo').t,t('2026-10-09T07:00:00Z'));assert.equal(wakeActions.findLast(a=>a.type==='wait'&&/^Sleep hours/.test(a.reason)).siloEmptySeconds,5*3600,'a purchase at wake does not retroactively extend the preceding night');
 // A standard permit cannot buy away the uncovered portion of an eight-hour
 // night; two max-Epic silos cover six hours and the rest remains stopped.
 const standardRaw=structuredClone(earlyRaw);standardRaw.farm.proPermit=false;const standard=S.prepare(standardRaw),standardR=S.buy(standard.s,standard.c,{type:'shift',egg:3}),standardBuilt=T.step(standardR,standard.c,'R1',3,Ref.runR1,3600);
 assert.equal(standardBuilt.silos,2);assert.equal(S.advance(standardBuilt,standard.c,morning,'Standard coverage',true,'online').path.action.siloEmptySeconds,2*3600);
 const noNight={...earlyCase.c,end:t('2026-10-08T22:30:00Z')};assert.equal(T.step(onR,noNight,'R1',3,Ref.runR1,3600).silos,1);
 const fallRaw=structuredClone(earlyRaw);fallRaw.plan.start=t('2026-10-31T20:00:00Z');fallRaw.plan.eventTimezone='America/Los_Angeles';fallRaw.farm.virtue='resilience';fallRaw.plan.sequence='R C K';fallRaw.farm.epic.silo_capacity=0;
 const fallCase=S.prepare(fallRaw),fallBuilt=T.step(fallCase.s,fallCase.c,'R1',3,Ref.runR1,3600);assert.equal(fallBuilt.silos,9,'low Epic coverage buys nine real hours for the fall-back night');
 // Fully funded purchases still wait until the full interaction fits while
 // awake. A five-second shift at 22:59:59 cannot straddle bedtime.
 const raw=rawAt(),{s,c}=S.prepare(raw);const shifted=S.buy(s,c,{type:'shift',egg:4});const shift=S.history(shifted).find(a=>a.type==='shift');assert.equal(shift.t,t('2026-10-09T07:00:00Z'));validateInteractions(S.history(shifted),c);
 assert.throws(()=>S.buy({...s,t:t('2026-10-08T23:01:00Z')},{...c,shipReplay:true},{type:'set',set:s.set}),/sleep/);
 const tiny={...c,sleep:schedule('00:01','00:00'),end:s.t+DAY};assert.throws(()=>S.interactionReady(s,tiny,61),/planning limit/);
 // Affordability is calculated using offline income during sleep. Sale
 // prices are recalculated at wake time, rather than carrying bedtime prices.
 const researchRaw=rawAt('2026-10-10T08:59:00Z');researchRaw.plan.eventTimezone='UTC';researchRaw.plan.sleep={enabled:true,start:'09:00',end:'10:00',timezone:'UTC'};researchRaw.farm.research.comfy_nests--;
 const researchCase=S.prepare(researchRaw),a={type:'research',i:S.RMAP.comfy_nests},cost=S.price({...researchCase.s,t:t('2026-10-10T10:00:00Z')},researchCase.c,a),income=S.stats(researchCase.s,researchCase.c).online;
 researchCase.c.earningsScale*=cost/(income*10000);
 const poor={...researchCase.s,cash:cost*.29};
 const ready=S.afford(poor,researchCase.c,a);assert.ok(ready);assert.ok(ready.t>=t('2026-10-10T10:00:00Z'));assert.ok(S.price(ready,researchCase.c,a)<=ready.cash);validateInteractions(S.history(S.buy(ready,researchCase.c,a)),researchCase.c);
 assert.equal(S.afford(poor,{...researchCase.c,routeResearchRule:true,researchDeadline:t('2026-10-10T09:30:00Z')},a),null,'sale deadline is real time, even while asleep');
 // An independent one-second cash scan checks the earliest funded awake
 // purchase across bedtime, wake time, and the end of a weekly sale.
 for(const date of ['2026-10-08T08:59:00Z','2026-10-10T08:59:00Z'])for(const permit of [false,true]){
  const probe=rawAt(date);probe.plan.eventTimezone='UTC';probe.plan.sleep={enabled:true,start:'09:00',end:'09:20',timezone:'UTC'};probe.farm.proPermit=permit;probe.farm.loadouts={current:[]};probe.farm.research.comfy_nests--;
  const prepared=S.prepare(probe),ctx=prepared.c,action={type:'research',i:S.RMAP.comfy_nests},fullCost=S.price({...prepared.s,t:prepared.s.t+3600},ctx,action);
  ctx.earningsScale*=fullCost/(S.stats(prepared.s,ctx).online*2000);const initial={...prepared.s,cash:0},r=S.stats(initial,ctx);let cash=0,oracle=null;
  for(let elapsed=0;elapsed<=10000;elapsed++){const time=initial.t+elapsed,hour=new Date(time*1000).getUTCHours(),minute=new Date(time*1000).getUTCMinutes(),asleep=hour===9&&minute<20;
   if(!asleep&&S.price({...initial,t:time},ctx,action)<=cash){oracle=time;break;}
   cash+=(asleep?r.offline:r.online)*S.at(ctx,time).earnings;
  }
  const computed=S.afford(initial,ctx,action);assert.ok(computed&&oracle);assert.ok(computed.t<=oracle+.002&&computed.t>oracle-1.01,'sleep affordability matches exhaustive earliest-second oracle');
 }
 // Funding oracle with actual silo exhaustion. Money banked before the
 // cutoff is retained, but no new earnings appear until the player wakes.
 for(const permit of [false,true])for(const lunar of [false,true]){
  const probe=rawAt('2026-10-08T08:59:00Z');probe.plan.eventTimezone='UTC';probe.plan.sleep={enabled:true,start:'09:00',end:'17:00',timezone:'UTC'};
  Object.assign(probe.farm,{proPermit:permit,silos:1,loadouts:{current:lunar?[{artifactId:'lunar-totem-4-3',stones:[]}]:[]}});probe.farm.epic.silo_capacity=0;probe.farm.research.comfy_nests--;
  const prepared=S.prepare(probe),ctx=prepared.c,action={type:'research',i:S.RMAP.comfy_nests},cost=S.price(prepared.s,ctx,action);ctx.earningsScale*=cost/(S.stats(prepared.s,ctx).online*10000);
  const initial={...prepared.s,cash:0},r=S.stats(initial,ctx);let cash=0,oracle=null;
  for(let elapsed=0;elapsed<50000;elapsed++){const time=initial.t+elapsed,hour=new Date(time*1000).getUTCHours(),asleep=hour>=9&&hour<17,productive=!asleep||hour===9;
   if(!asleep&&S.price({...initial,t:time},ctx,action)<=cash){oracle=time;break;}
   if(productive)cash+=(asleep?r.offline:r.online)*S.at(ctx,time).earnings;
  }
  const computed=S.afford(initial,ctx,action);assert.ok(computed&&oracle);assert.ok(computed.t<=oracle+.002&&computed.t>oracle-1.01,'funding respects empty silos and retained overnight cash');
  assert.equal(computed.path.action.siloEmptySeconds,7*3600);
 }
 // Ships returning while asleep wait to be collected and launched. Filling
 // a configured ship/tank remains passive once started while awake.
 const shipRaw=rawAt('2026-10-08T22:59:00Z');shipRaw.farm.virtue='humility';shipRaw.plan.sequence='H I';shipRaw.plan.ships={mode:'legacy',slots:1,missions:[{ship:'CHICKEN_ONE',duration:'SHORT',count:3}]};
 const shipCase=S.prepare(shipRaw),launched=Ships.launch(shipCase.s,shipCase.c),runAction=launched.path.action;assert.equal(runAction.count,3);assert.ok(runAction.interactions.some(i=>i.type==='collect'&&i.t>=t('2026-10-09T07:00:00Z')));validateInteractions([runAction],shipCase.c);close(runAction.onlineSeconds+runAction.offlineSeconds+runAction.interactionSeconds+runAction.fuelSeconds,runAction.end-runAction.t);
 const fuelRaw=rawAt('2026-10-08T22:59:50Z');fuelRaw.plan.ships={mode:'legacy',slots:3,missions:[{ship:'HENERPRISE',duration:'EPIC',count:1}]};fuelRaw.farm.fuelTank={capacity:500e12,outputPerMinute:9e12,amounts:{}};
 const fuelCase=S.prepare(fuelRaw),laying=S.stats(fuelCase.s,fuelCase.c).laying,amount=Math.min(laying*120,fuelCase.c.ships.targets[0]),stored=Ships.store(fuelCase.s,fuelCase.c,amount);assert.ok(stored.t>t('2026-10-08T23:00:00Z'));assert.equal(stored.cash,fuelCase.s.cash);assert.deepEqual(stored.eggs,fuelCase.s.eggs);
 const emptyFuelRaw=structuredClone(fuelRaw);emptyFuelRaw.plan.start=emptyRaw.plan.start;emptyFuelRaw.farm.epic.silo_capacity=0;emptyFuelRaw.farm.silos=1;
 const emptyFuel=S.prepare(emptyFuelRaw);emptyFuel.c.col.elr*=1e-6;const fuel=Ships.store(emptyFuel.s,emptyFuel.c,S.stats(emptyFuel.s,emptyFuel.c).laying*3*3600);assert.equal(fuel.t,morning);assert.equal(fuel.path.action.siloEmptySeconds,7*3600);
 const emptyShipRaw=structuredClone(shipRaw);emptyShipRaw.plan.start=emptyRaw.plan.start;emptyShipRaw.farm.epic.silo_capacity=0;emptyShipRaw.farm.silos=1;emptyShipRaw.farm.research={};emptyShipRaw.farm.habs=[0,0,0,0];emptyShipRaw.farm.vehicles=Array.from({length:17},(_,i)=>({id:i<4?11:null,cars:1}));emptyShipRaw.plan.ships.missions[0].count=1;
 const emptyShip=S.prepare(emptyShipRaw);emptyShip.c.col.elr*=5e6/(S.stats(emptyShip.s,emptyShip.c).laying*3*3600);const lateShip=Ships.launch(emptyShip.s,emptyShip.c);assert.ok(Math.abs(lateShip.t-(morning+emptyShip.c.actionsSeconds))<.01);assert.equal(lateShip.path.action.siloEmptySeconds,7*3600);validateInteractions([lateShip.path.action],emptyShip.c);
 // Disabling sleep preserves the original actions and supports old files and
 // incumbents; enabled or changed windows cannot reuse an incompatible plan.
 const disabled=structuredClone(raw);disabled.plan.sleep.enabled=false;const absent=structuredClone(disabled);delete absent.plan.sleep;
 const d=S.prepare(disabled),b=S.prepare(absent);assert.deepEqual(S.history(S.buy(d.s,d.c,{type:'shift',egg:4})),S.history(S.buy(b.s,b.c,{type:'shift',egg:4})));assert.equal(Incumbents.key(disabled),Incumbents.key(absent));assert.notEqual(Incumbents.key(raw),Incumbents.key(absent));
 const result=await O.solve(raw,{maxMs:1500});assert.ok(result.validatedReplay);assert.ok(result.shiftPlans.length);const checked=O.replay(raw,result.actions,true);assert.equal(checked.s.t,result.end);validateInteractions(result.actions,checked.c);assert.equal(O.replay(raw,JSON.parse(JSON.stringify(S.history(checked.s)))).s.t,result.end);
 const summary=Summary.summarize(raw,result);assert.ok(summary.totals.sleepSeconds>0);close(summary.totals.onlineSeconds+summary.totals.offlineSeconds+summary.totals.interactionSeconds+summary.totals.fuelSeconds,result.seconds);
 const tampered=structuredClone(result.actions),manual=tampered.find(a=>a.type==='shift');manual.t=t('2026-10-08T23:01:00Z');assert.throws(()=>O.replay(raw,tampered),/sleep/);
 assert.deepEqual(Incumbents.restore(absent,{config:raw,result},O.replay),[]);
 const shipResult=await O.solve(shipRaw,{maxMs:1500}),savedRun=shipResult.actions.find(a=>a.type==='ship-run');assert.ok(savedRun);assert.equal(O.replay(shipRaw,shipResult.actions).s.t,shipResult.end);
 for(const corrupt of [run=>run.interactions[0].t++,run=>run.launches[0].t++,run=>run.end++]){const actions=structuredClone(shipResult.actions);corrupt(actions.find(a=>a.type==='ship-run'));assert.throws(()=>O.replay(shipRaw,actions),/Ship interaction schedule/);}
 const {Checkpoints}=require('../src/search-checkpoints.cjs'),cache=new Checkpoints();assert.notEqual(cache.key(s,c,'sleep-test'),cache.key(s,{...c,sleep:undefined},'sleep-test'));
 const siloRaw=structuredClone(emptyRaw);siloRaw.farm.virtue='resilience';siloRaw.farm.cash=1e40;Object.assign(siloRaw.plan,{maxDays:60,target:102,sequence:'R C K',floors:[21,20,20,20,21]});
 const R=require('../src/route-solver.cjs'),L=require('../src/optimizer-legacy.cjs'),siloCase=R.prepare(siloRaw,R.routes(siloRaw)[0],3);
 assert.ok(R.scored(siloCase.s,siloCase.c).some(x=>x.a.type==='silo'&&x.score>0),'search values sleep coverage rather than treating silos as zero delivery gain');
 const unfilled=L.tail(siloCase.s,siloCase.c),built=R.seedRoute(siloCase.s,siloCase.c,180);assert.ok(built&&built.t<unfilled.t,'paid silo coverage shortens a real completion on an arbitrary route');assert.ok(S.history(built).some(a=>a.type==='silo'));
 console.log('PASS sleep boundaries, timezones, DST, passive earnings/delivery, affordability, sale deadlines, shifts, ship handling, fuel transfers, disabled compatibility, saved replay, and summary accounting.');
}
if(require.main===module)run().catch(error=>{console.error(error.stack);process.exitCode=1;});
module.exports={run,validateInteractions};
