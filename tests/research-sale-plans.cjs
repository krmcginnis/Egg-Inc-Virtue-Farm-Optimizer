'use strict';
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),O=require('../src/optimizer-legacy.cjs'),T=require('../src/staged-route.cjs'),E=require('../src/opening-search.cjs'),W=require('../src/waiting-objective.cjs'),Plans=require('../src/research-sale-plans.cjs'),Route=require('../src/switch-sequence.cjs'),blank=require('../src/blank-farm.cjs');
// Synthetic fully upgraded farm: no account data or EID is included.
function fixture(){
 const raw=blank(1791388800);delete raw.plan.solverVersion;
 Object.assign(raw.farm,{cash:1e18,soulEggs:1e30,claimed:Array(5).fill(20),epic:Object.fromEntries(S.D.epic.map(r=>[r.id,r.levels])),habs:Array(4).fill(18),vehicles:Array.from({length:17},()=>({id:11,cars:1})),research:Object.fromEntries(S.D.research.map(r=>[r.id,r.levels])),proPermit:true,earningsMode:'online'});
 Object.assign(raw.plan,{saleComparisonVersion:1,target:140,maxSwitches:0,stagedSales:6,c1MaxMinutes:30,k1MaxMinutes:30});return raw;
}
function replayOne(raw,plan){const checked=O.replay(raw,plan.actions,true,{enforceOpeningCaps:true,oneStartingSilo:true});assert.equal(checked.s.t,plan.end);assert.equal(checked.s.stage,plan.switches);assert.ok(S.reached(checked.s,checked.c));return {...plan,validatedReplay:true};}
async function run(){
 for(const virtue of S.EGGS){const raw=fixture();raw.farm.virtue=virtue;const {c}=S.prepare(raw);assert.equal(c.maxSwitches,Route.defaultSwitches(virtue));assert.equal(c.stagedSales,3);}
 const custom=fixture();Object.assign(custom.plan,{strategy:'user',autoSequence:false,sequence:['curiosity','humility','kindness','humility']});assert.equal(S.prepare(custom).c.maxSwitches,3);assert.equal(S.prepare(custom).c.sequence.length,4);
 const raw=fixture(),result=await O.solve(raw,{disableOpeningSearch:true,disableOfflineBatches:true});Plans.validate(result);
 assert.deepEqual(result.researchSalePlans.map(e=>[e.researchSales,e.status]),[[1,'complete'],[2,'complete'],[3,'complete']]);assert.equal(result.selectedResearchSales,1);assert.equal(result.recommendedResearchSales,1);
 assert.notDeepEqual(result.researchSalePlans[0].plan.actions,result.researchSalePlans[2].plan.actions);assert.notEqual(result.researchSalePlans[0].plan.seconds,result.researchSalePlans[2].plan.seconds);
 // Independently run each exact sale horizon without sharing opening/suffix caches.
 const {s,c}=S.prepare(raw,{enforceOpeningCaps:true,oneStartingSilo:true});
 for(const entry of result.researchSalePlans){const independent=T.run(s,c,entry.researchSales,O.completionGoals);assert.equal(entry.plan.end,independent.t);assert.deepEqual(entry.plan.actions,S.history(independent).map((a,i)=>i===0?{...a,initialSiloRule:'one'}:a));replayOne(raw,entry.plan);}
 // Retain a separate winner for every sale horizon across all offline policies.
 const offline=fixture();offline.farm.earningsMode='offline';offline.farm.loadouts.current=[{artifactId:'lunar-totem-4-3',stones:[]}];offline.farm.research.comfy_nests--;
 const batched=await O.solve(offline,{disableOpeningSearch:true});assert.equal(batched.waitingRoutesCompared,9);
 const prepared=S.prepare(offline,{enforceOpeningCaps:true,oneStartingSilo:true});
 for(const entry of batched.researchSalePlans){let best;for(const batchMode of [null,'short-online','all-waits']){const candidate=T.run(prepared.s,{...prepared.c,batchOffline:!!batchMode,batchMode},entry.researchSales,O.completionGoals);if(W.better(candidate,best))best=candidate;}assert.equal(entry.plan.end,best.t);assert.deepEqual(entry.plan.actions,S.history(best).map((a,i)=>i===0?{...a,initialSiloRule:'one'}:a));assert.ok(entry.plan.actions.some(a=>a.type==='research'));replayOne(offline,entry.plan);}
 // Increasing ceilings keeps the fastest candidate for EACH horizon, not just the winner.
 const larger=structuredClone(raw);larger.plan.c1MaxMinutes=larger.plan.k1MaxMinutes=60;const compared=await O.solve(larger,{disableOfflineBatches:true});
 assert.equal(compared.openingSearch.combinationsCompared,4);
 for(const entry of compared.researchSalePlans){let best;const initial=S.prepare(larger,{enforceOpeningCaps:true,oneStartingSilo:true});for(const c1MaxMinutes of E.budgets(60))for(const k1MaxMinutes of E.budgets(60)){const candidate=T.run(initial.s,{...initial.c,c1MaxMinutes,k1MaxMinutes},entry.researchSales,O.completionGoals);if(W.better(candidate,best))best=candidate;}assert.equal(entry.plan.end,best.t);assert.ok(entry.plan.seconds<=result.researchSalePlans[entry.researchSales-1].plan.seconds+1e-6);replayOne(larger,entry.plan);}
 const chosen=Plans.select(result,3),saved=JSON.parse(JSON.stringify(chosen)),restored=Plans.replay(raw,saved,(config,plan)=>replayOne(config,plan));assert.equal(restored.selectedResearchSales,3);assert.equal(restored.recommendedResearchSales,1);assert.equal(restored.end,result.researchSalePlans[2].plan.end);assert.equal(restored.researchSalePlans.length,3);
 // All alternatives are validated before loading, including non-selected plans.
 const corrupt=structuredClone(saved);corrupt.researchSalePlans[0].plan.actions[0]={type:'research',i:999};assert.throws(()=>Plans.replay(raw,corrupt,replayOne));
 for(const change of [r=>r.researchSalePlans=null,r=>r.researchSalePlans[0]=null,r=>r.selectedResearchSales=4,r=>r.recommendedResearchSales=4,r=>r.researchSalePlans[0].plan.researchSalePlans=[]]){const invalid=structuredClone(saved);change(invalid);assert.throws(()=>Plans.replay(raw,invalid,replayOne));}
 let stop=false;const partial=await O.solve(raw,{disableOpeningSearch:true,disableOfflineBatches:true},p=>{if(p.researchSales===2)stop=true;},()=>stop);assert.deepEqual(partial.researchSalePlans.map(e=>e.status),['complete','not-completed','not-completed']);replayOne(raw,partial);assert.throws(()=>Plans.select(partial,2));
 const limited=structuredClone(raw);limited.plan.maxDays=51;const unavailable=await O.solve(limited,{disableOpeningSearch:true,disableOfflineBatches:true});assert.deepEqual(unavailable.researchSalePlans.map(e=>e.status),['complete','complete','unavailable']);assert.throws(()=>Plans.select(unavailable,3));
 const legacy=structuredClone(raw);delete legacy.plan.saleComparisonVersion;Object.assign(legacy.plan,{maxSwitches:12,stagedSales:1});const old=await O.solve(legacy,{disableOpeningSearch:true,disableOfflineBatches:true});assert.equal(old.researchSalePlans,undefined);assert.deepEqual(old.actions,result.researchSalePlans[0].plan.actions);assert.equal(Plans.replay(legacy,old,replayOne).end,old.end);assert.equal(S.prepare({...legacy,plan:{...legacy.plan,maxSwitches:0}}).c.maxSwitches,0);
 const reached=fixture();reached.plan.target=100;assert.equal((await O.solve(reached)).researchSalePlans,undefined);
 console.log('PASS independent 1/2/3 sale runs, full switch allowance from all starting Virtues, per-sale opening comparisons, all-plan replay/save/load, selection, stopped/unavailable options, already-reached targets, and legacy single-plan compatibility.');
}
module.exports={fixture};if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
