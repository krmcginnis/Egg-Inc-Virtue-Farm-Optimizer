'use strict';
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),R=require('../src/route-solver.cjs'),L=require('../src/optimizer-legacy.cjs'),Sleep=require('../src/sleep-schedule.cjs'),Calendar=require('../src/calendar-departures.cjs'),Automatic=require('../src/automatic-routes.cjs'),{fixture}=require('./research-sale-plans.cjs'),{validateInteractions}=require('./sleep-schedule.cjs');
function make({start='2026-10-08T22:30:00Z',hours=48,fundHours=8,route='C R C K C',permit=true,zone='UTC'}={}){
 const raw=fixture();Object.assign(raw.plan,{start:Date.parse(start)/1000,eventTimezone:zone,strategy:'user',autoSequence:false,sequence:route,target:301,floors:[61,60,60,60,60],maxDays:5,actionSeconds:1,shiftSeconds:30,sleep:{enabled:true,start:'23:00',end:'07:00'}});
 Object.assign(raw.farm,{cash:0,silos:1,claimed:Array(5).fill(60),proPermit:permit,loadouts:{current:[]},vehicles:Array.from({length:17},()=>({id:11,cars:10}))});raw.farm.research.wormhole_dampening--;
 const p=R.prepare(raw,R.routes(raw)[0],3),rate=S.stats(p.s,p.c).delivery,cost=S.price(p.s,p.c,{type:'research',i:S.RMAP.wormhole_dampening});raw.farm.earningsScale*=cost/(S.stats(p.s,p.c).online*fundHours*3600);raw.farm.delivered[0]=S.D.te[60]-rate*hours*3600;
 return raw;
}
// Exhaust every legal purchase/shift order in these one-research fixtures,
// including at most one explicit hold at the next sleep/sale boundary. Funding
// waits are always paid. This finite domain is not a global game optimum proof.
function exhaustive(raw,{waits=1}={}){
 const {s,c}=R.prepare(raw,R.routes(raw)[0],3);let best=null,nodes=0,seen=new Set();
 function visit(n,left){
  const key=JSON.stringify([n.stage,n.r[S.RMAP.wormhole_dampening],n.silos,n.t,n.cash,n.eggs,left]);if(seen.has(key))return;seen.add(key);nodes++;
  const done=L.finishHere(n,c);if(R.better(done,best))best=done;
  const next=[];
  for(const a of L.candidates(n,c))if(S.allowed(n,c,a))try{const funded=S.afford(n,c,a);if(funded)next.push(S.buy(funded,c,a));}catch{}
  if(n.stage+1<c.sequence.length)try{next.push(S.buy(n,c,{type:'shift',egg:c.sequence[n.stage+1]}));}catch{}
  for(const m of next)visit(m,left);
  if(left){const night=c.sleep.intervals.find(p=>p.end>n.t),sale=c.calendar.find(e=>e.t>n.t&&e.sale===.3);const times=[night?.start-c.shiftSeconds,night?.end,sale?.t].filter(t=>Number.isFinite(t)&&t>n.t&&t<c.end);
   for(const t of times)try{visit(S.advance(n,c,t,'Oracle calendar decision',true,'online'),left-1);}catch{}
  }
 }
 visit(s,waits);return {s,c,best,nodes};
}
async function run(){
 // Quality checks need enough wall time on slower Windows runners; the app
 // keeps its 90-second default. Assertions still require the exact optimum.
 const qualityMs=8000,rows=[];
 for(const opts of [{},{fundHours:20},{route:'C R C'},{route:'C R C',permit:false},{start:'2026-10-09T08:30:00Z'},{start:'2026-10-10T08:30:00Z'},{start:'2026-10-12T22:30:00Z',fundHours:20},{start:'2026-11-01T05:30:00Z',zone:'America/Los_Angeles'},{start:'2026-11-01T05:30:00Z',zone:'America/Los_Angeles',permit:false}]){
  const raw=make(opts),exact=exhaustive(raw),found=await R.solve(raw,{maxMs:qualityMs,width:8});
  assert.ok(exact.nodes>50);assert.ok(exact.best);
  assert.ok(Math.abs(found.seconds-(exact.best.t-exact.c.start))<.05,'matches the finite exhaustive optimum: '+JSON.stringify({opts,actual:found.seconds,expected:exact.best.t-exact.c.start}));
  const checked=R.replay(raw,JSON.parse(JSON.stringify(found.actions)),true);assert.equal(checked.s.t,found.end);assert.ok(S.reached(checked.s,checked.c));validateInteractions(found.actions,checked.c);
  assert.ok(found.actions.some(a=>a.type==='silo'),'funds sleep coverage rather than assuming it');
  rows.push({case:opts,enumerated:exact.nodes,seconds:found.seconds,gapSeconds:found.seconds-(exact.best.t-exact.c.start)});
 }
 const raw=make(),{s,c}=R.prepare(raw,R.routes(raw)[0],3),end=s.t+24*3600;
 const wait=S.advance(s,c,end,'Accumulate gems',true,'online').path.action,cuts=Calendar.duringWait(s,c,wait);
 const bed=c.sleep.intervals.find(p=>p.start>s.t).start;
 assert.ok(cuts.some(n=>n.t===bed-c.shiftSeconds),'compares the last full awake shift before bed');
 assert.ok(cuts.some(n=>n.t===c.sleep.intervals[0].end),'compares wake time');
 for(const n of cuts){Sleep.assertActive(c.sleep,n.t,c.shiftSeconds);const expected=S.advance(s,c,n.t,'oracle',false,'online');assert.equal(n.cash,expected.cash);assert.deepEqual(n.eggs,expected.eggs);assert.equal(n.r[S.RMAP.wormhole_dampening],s.r[S.RMAP.wormhole_dampening]);}
 assert.deepEqual(Calendar.duringWait(s,{...c,sleep:undefined},wait),[]);
 assert.deepEqual(Calendar.duringWait(s,c,{...wait,reason:'Purchase interaction time'}),[]);
 const shortRaw=make({start:'2026-10-08T22:59:00Z'}),short=R.prepare(shortRaw,R.routes(shortRaw)[0],3);
 short.c.earningsMode='offline';const offline=S.advance(short.s,short.c,short.s.t+3600,'Offline funding',true,'offline').path.action;
 const prefix=Calendar.duringWait(short.s,short.c,offline).find(n=>n.t-short.s.t===30);assert.ok(prefix);assert.equal(prefix.path.action.earningsMode,'online','a 30-second departure cannot claim the offline minimum');
 Object.assign(raw.plan,{strategy:'auto',strategyVersion:2,autoSequence:true,maxShifts:12});const routes=Automatic.generate(raw);
 assert.ok(routes.some(r=>r[1]==='resilience'),'reserves R before physical upgrades');assert.ok(routes.some(r=>r[3]==='resilience'),'also compares R after the first physical visits');
 assert.ok(routes.length<=14);assert.ok(routes.every(r=>r.length-1<=12));
 for(const maxShifts of [10,11]){const shorter=Automatic.generate({...raw,plan:{...raw.plan,maxShifts}});assert.ok(shorter.some(r=>r[1]==='resilience'),'early coverage proposals also fit smaller ceilings');assert.ok(shorter.length<=14&&shorter.every(r=>r.length-1<=maxShifts));}
 assert.throws(()=>Automatic.generate({...raw,plan:{...raw.plan,maxDays:1e10}}),/Planning limit/);
 const absent=structuredClone(raw);delete absent.plan.sleep;const disabled=structuredClone(raw);disabled.plan.sleep.enabled=false;assert.deepEqual(Automatic.generate(absent),Automatic.generate(disabled));
 const covered=structuredClone(raw);covered.farm.silos=8;assert.deepEqual(Automatic.generate(covered),Automatic.generate({...covered,plan:{...covered.plan,sleep:{enabled:false}}}),'no extra coverage routes when owned silos cover the nights');
 const brief=make({route:'C R C'}),exactBrief=exhaustive(brief);Object.assign(brief.plan,{strategy:'auto',strategyVersion:2,autoSequence:true,maxShifts:2});
 assert.ok(Automatic.generate(brief).some(r=>r.join(' ')==='curiosity resilience curiosity'),'two shifts can buy coverage and return without requiring unrelated farms');
 const quick=await R.solve(brief,{maxMs:qualityMs,width:8});assert.equal(quick.switches,2);assert.ok(Math.abs(quick.seconds-(exactBrief.best.t-exactBrief.c.start))<.05);const replayed=R.replay(brief,quick.actions,true);assert.equal(replayed.s.t,quick.end);validateInteractions(quick.actions,replayed.c);
 console.log('PASS sleep search quality: exhaustive paid research/silo/shift orders, early coverage, later-C research, both permits, sale/earnings boundaries, awake calendar departures, and unchanged sleep-disabled proposals.');
 return rows;
}
module.exports={make,exhaustive,run};
if(require.main===module)run().then(rows=>console.log(JSON.stringify(rows))).catch(error=>{console.error(error.stack);process.exitCode=1;});
