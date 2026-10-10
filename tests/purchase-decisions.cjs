'use strict';
const assert = require('node:assert/strict'), S = require('../src/simulator.cjs');
const Decisions = require('../src/purchase-decisions.cjs'), U = require('../src/shift-summary.cjs'), blank = require('../src/blank-farm.cjs');
function farm() {
  const raw = blank(Date.parse('2026-10-14T16:00:00Z') / 1000);
  Object.assign(raw.farm,{cash:1e80,soulEggs:1e30,proPermit:true,claimed:Array(5).fill(90),habs:[18,18,18,18],vehicles:Array.from({length:17},(_,i)=>({id:i<4?11:null,cars:1}))});
  Object.assign(raw.plan,{autoSequence:true,maxShifts:12,target:450,actionSeconds:0,shiftSeconds:0});
  delete raw.farm.colleggtibleTiers;
  return raw;
}
function unlock(raw, tier) { for (const r of S.D.research) if (r.tier < tier) raw.farm.research[r.id] = r.levels; }
function run(raw, recipe) {
  const {s,c} = S.prepare(raw); let end = s;
  for (const a of recipe) { const ready = S.afford(end,c,a); assert.ok(ready,'fixture can fund ' + a.type); end = S.buy(ready,c,a); }
  const actions = S.history(end), before = structuredClone({raw,actions}), purchases = Decisions.build(s,c,actions);
  assert.deepEqual({raw,actions},before,'explanations never change saved inputs or replay actions');
  return {s,c,end,actions,purchases,raw};
}
function text(test, id, from=0, to=Infinity) { return Decisions.range(test.purchases,S.RMAP[id],from,to).text; }
const research = id => ({type:'research',i:S.RMAP[id]});
function cases() {
  // A genuine immediate gain, independent of weekly event multipliers.
  const raw=farm(); const earned=run(raw,[research('nutritional_sup')]);
  assert.match(text(earned,'nutritional_sup'),/Raises earnings now by 25%/);
  assert.deepEqual(Decisions.build(earned.s,earned.c,earned.actions.map(a=>({...a,before:{earning:99},after:{earning:0}}))),earned.purchases,'recorded stats cannot fabricate purchase reasons');
  for(const mode of ['online','offline']) {const r=structuredClone(raw);r.farm.earningsMode=mode;assert.match(text(run(r,[research('nutritional_sup')]),'nutritional_sup'),/25%/);}
  const noDelivery=farm();noDelivery.farm.vehicles.forEach(v=>v.id=null);
  assert.match(text(run(noDelivery,[research('nutritional_sup')]),'nutritional_sup'),/No immediate earnings gain.*delivery is still zero/);
  // Laying and shipping research must use the bottleneck at purchase time.
  assert.match(text(run(farm(),[research('comfy_nests')]),'comfy_nests'),/No immediate earnings gain.*shipping still limits/);
  const laying=farm();unlock(laying,3);laying.farm.colleggtibles.shippingCap=1000;
  assert.match(text(run(laying,[research('leafsprings')]),'leafsprings'),/No immediate earnings gain.*laying still limits/);
  laying.farm.colleggtibles.shippingCap=1;
  assert.match(text(run(laying,[research('leafsprings')]),'leafsprings'),/Raises earnings now/);
  // A filler level unlocks the tier; a different level only contributes to it.
  const tier=farm();tier.farm.research.comfy_nests=29;
  const unlocks=run(tier,[research('better_incubators'),research('padded_packaging')]);
  assert.match(text(unlocks,'better_incubators'),/No immediate earnings gain.*Unlocks Tier 2/);
  const prereq=farm();prereq.farm.research.comfy_nests=28;
  const contributes=run(prereq,[research('better_incubators'),research('better_incubators'),research('padded_packaging')]);
  assert.match(text(contributes,'better_incubators',0,1),/Adds 1 prerequisite level toward Tier 2/);
  assert.match(text(contributes,'better_incubators',0,2),/Unlocks Tier 2/);
  assert.ok(!text(contributes,'better_incubators',0,2).includes('toward Tier 2'),'do not repeat a tier contribution after the grouped range unlocks it');
  const both=farm();both.farm.research.comfy_nests=29;
  assert.match(text(run(both,[research('nutritional_sup')]),'nutritional_sup'),/Raises earnings now.*Unlocks Tier 2/);
  assert.match(text(run(farm(),[research('better_incubators')]),'better_incubators'),/full habitats and no running chickens/);
  // Slots wait for actual Kindness purchases; no later use is also honest.
  const fleet=farm();unlock(fleet,3);
  const delayed=run(fleet,[research('vehicle_reliablity'),{type:'shift',egg:4},{type:'vehicle',slot:4,id:11}]);
  assert.match(text(delayed,'vehicle_reliablity'),/No immediate earnings gain.*Adds 1 vehicle slot for later Kindness purchases/);
  assert.match(text(run(fleet,[research('vehicle_reliablity')]),'vehicle_reliablity'),/existing vehicles are unchanged/);
  const interleaved=farm();unlock(interleaved,5);interleaved.farm.research.vehicle_reliablity=0;
  const mixed=run(interleaved,[research('vehicle_reliablity'),research('excoskeletons'),research('vehicle_reliablity')]);
  assert.match(text(mixed,'vehicle_reliablity'),/Adds 2 vehicle slots/,'do not attribute an interleaved different upgrade to this research');
  // Train length is a permission, not an automatic addition of cars.
  const trains=farm();unlock(trains,12);trains.farm.vehicles.forEach(v=>{if(v.id===11)v.cars=5;});
  const train=run(trains,[research('micro_coupling'),{type:'shift',egg:4},{type:'car',slot:0}]);
  assert.match(text(train,'micro_coupling'),/No immediate earnings gain.*maximum train length 5 → 6 for later Kindness/);
  assert.match(text(run(trains,[research('micro_coupling')]),'micro_coupling'),/existing trains keep their current cars/);
  // Special capacity cannot help equipment that is not yet owned.
  const hover=farm();unlock(hover,9);hover.farm.vehicles=Array.from({length:17},(_,i)=>({id:i<4?2:null,cars:1}));
  assert.match(text(run(hover,[research('hover_upgrades'),{type:'shift',egg:4},{type:'vehicle',slot:0,id:9}]),'hover_upgrades'),/Prepares hover vehicle capacity for later Kindness/);
  const portal=farm();unlock(portal,12);portal.farm.habs=[0,0,0,0];
  assert.match(text(run(portal,[research('wormhole_dampening'),{type:'shift',egg:1},{type:'hab',slot:0,id:18}]),'wormhole_dampening'),/Prepares portal habitat capacity for later Integrity/);
  // Gear changes can change which research pays back immediately.
  const gear=farm();unlock(gear,3);gear.farm.virtue='humility';
  const {s,c}=S.prepare(gear);c.mods.current.shipping=1e12;
  const actions=[{type:'shift',egg:0,t:s.t}, {...research('leafsprings'),from:0,to:1,t:s.t}, {type:'shift',egg:2,t:s.t}, {type:'set',set:'delivery',t:s.t}, {type:'shift',egg:0,t:s.t}, {...research('leafsprings'),from:1,to:2,t:s.t}];
  const explanations=Decisions.build(s,c,actions);
  assert.match(Decisions.range(explanations,S.RMAP.leafsprings,0,1).text,/No immediate earnings gain/);
  assert.match(Decisions.range(explanations,S.RMAP.leafsprings,1,2).text,/Raises earnings now/);
  // Multi-level historical actions and partially useful grouped ranges.
  const levels=run(farm(),[research('nutritional_sup'),research('nutritional_sup')]);
  const grouped=[{...levels.actions[0],to:2}];
  assert.equal(Decisions.range(Decisions.build(levels.s,levels.c,grouped),S.RMAP.nutritional_sup,0,2).text,text(levels,'nutritional_sup'));
  assert.throws(()=>Decisions.build(levels.s,levels.c,[{...grouped[0],to:999}]),/invalid research level/);
  const mixedEffects=farm();mixedEffects.farm.habs=[0,null,null,null];
  const base=S.prepare(mixedEffects);base.c.col.shippingCap=S.stats(base.s,base.c).laying*1.15/S.stats(base.s,base.c).shipping;
  const partial=Decisions.build(base.s,base.c,[{...research('comfy_nests'),t:base.s.t,from:0,to:3}]);
  assert.match(Decisions.range(partial,S.RMAP.comfy_nests,0,3).text,/2 of 3 purchased levels/);
  // Max-tier chips still expose every research explanation in Summary.
  const max=farm();max.farm.research=Object.fromEntries(S.D.research.map(r=>[r.id,r.tier===1?r.levels-1:0]));
  const maxed=run(max,S.D.research.map((r,i)=>({r,i})).filter(x=>x.r.tier===1).map(x=>({type:'research',i:x.i})));
  const result={actions:maxed.actions,start:maxed.s.t,end:maxed.end.t};
  const summary=U.summarize(max,result);assert.ok(summary.shifts[0].activities.some(a=>a.kind==='tier'));assert.equal(summary.shifts[0].researchDecisions.length,4);
  assert.ok(summary.shifts[0].quickGuide.every(step=>step.activities.filter(a=>a.kind==='research').every(a=>a.explanation?.text)));
  return delayed;
}
if (require.main === module) {cases();console.log('PASS state-derived research earnings, paired bottlenecks, tier prerequisites, delayed capacity, interleaved/grouped levels, gear changes, immutable plans and max-tier explanations.');}
module.exports = {farm, run, research, cases};
