'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const S=require('../src/simulator.cjs'),U=require('../src/shift-summary.cjs'),blank=require('../src/blank-farm.cjs'),Strategy=require('../src/planning-strategy.cjs'),gems=require('../src/gems-text.cjs'),Q=require('../src/walkthrough-pdf.cjs');
(async()=>{
 for(const mode of ['offline','online']){
  // Tuesday's boost ends before the stronger set is equipped. Multiplying the
  // strongest gear by an earlier event would overstate this visit's peak.
  const raw=blank(Date.parse('2026-10-06T15:58:00Z')/1000);Object.assign(raw.farm,{virtue:'humility',cash:1e40,soulEggs:1e30,claimed:Array(5).fill(20),proPermit:true,manualFarmData:true,earningsMode:mode,earningsScale:1.7,videoDoubler:true,habs:Array(4).fill(18),vehicles:Array.from({length:17},()=>({id:11,cars:10})),research:Object.fromEntries(S.D.research.map(r=>[r.id,r.levels])),epic:{epic_egg_laying:20,transportation_lobbyist:30},colleggtibles:{awayEarnings:6}});
  const strong=[{artifactId:'demeters-necklace-4-3',stones:['lunar-stone-4','lunar-stone-4','lunar-stone-4']}],delivery=[{artifactId:'quantum-metronome-4-3',stones:['tachyon-stone-4','tachyon-stone-4','tachyon-stone-4']},{artifactId:'interstellar-compass-4-3',stones:['quantum-stone-4','quantum-stone-4']}];
  raw.farm.loadouts={current:[],earnings:strong,delivery};Object.assign(raw.plan,{strategy:'user',autoSequence:false,maxSwitches:1,sequence:['humility','kindness'],target:100,shiftSeconds:0,actionSeconds:0,eventTimezone:'America/Los_Angeles'});
  const {s,c}=S.prepare(raw);let n=S.advance(s,c,s.t+180,'Accumulate cash',true,mode);const weak=S.stats(s,c);n=S.buy(n,c,{type:'set',set:'earnings'});const earned=S.stats(n,c);n=S.advance(n,c,n.t+60,'Preserve Cash',true,mode);n=S.buy(n,c,{type:'set',set:'delivery'});const shipped=S.stats(n,c);n=S.advance(n,c,n.t+60,'Collect gems',true,mode);n=S.buy(n,c,{type:'shift',egg:4});n=S.advance(n,c,n.t+70,'Collect eggs',true,mode);
  const actions=S.history(n),saved=JSON.stringify(actions),result={version:1,start:c.start,end:n.t,seconds:n.t-c.start,actions,target:100,switches:1,frontier:[],explored:0,method:'Synthetic peak-rate regression',termination:'complete'},summary=U.summarize(raw,result);
  assert.equal(summary.shifts.length,2);const first=summary.shifts[0].maxRates;
  assert.equal(first.earning,Math.max(weak.earning*2,earned.earning,shipped.earning));assert.ok(first.earning<earned.earning*2);
  assert.equal(first.shipping,Math.max(weak.shipping,earned.shipping,shipped.shipping));assert.equal(first.laying,Math.max(weak.laying,earned.laying,shipped.laying));assert.deepEqual(summary.shifts[1].maxRates,{earning:shipped.earning,shipping:shipped.shipping,laying:shipped.laying});
  assert.equal(JSON.stringify(actions),saved,'presentation never edits raw actions/reasons');
  // Historical before/after snapshots are optional: reconstruct rate states
  // from the configuration and purchases rather than trusting summary fields.
  const legacy=structuredClone(result);legacy.actions.forEach(a=>{delete a.before;delete a.after;});assert.deepEqual(U.summarize(raw,legacy).shifts.map(s=>s.maxRates),summary.shifts.map(s=>s.maxRates));
  if(mode==='offline'){const dir=path.join(__dirname,'../tmp/shift-rates');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'synthetic-plan.json'),JSON.stringify({version:1,config:raw,result}));fs.writeFileSync(path.join(dir,'walkthrough.pdf'),await Q.create(raw,result));}
 }
 for(const strategy of ['auto','free','wasmegg'])assert.equal(Strategy.selected({strategy,strategyVersion:2,autoSequence:true}),'wasmegg');
 assert.equal(Strategy.selected({autoSequence:false,sequence:['curiosity']}),'user');assert.equal(Strategy.selected({autoSequence:true,sequence:['curiosity']}),'wasmegg');assert.equal(Strategy.selected({strategy:'user',autoSequence:false}),'user');
 assert.equal(gems('cash Cash CASH cashGained cashew'),'gems Gems GEMS cashGained cashew');
 console.log('PASS per-visit peak earning/shipping/laying, exact event/gear pairing, both earnings modes, calibration, inherited rates, legacy action snapshots, immutable actions, strategy migration and gem wording; PDF generated.');
})().catch(e=>{console.error(e);process.exitCode=1});
