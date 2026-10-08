'use strict';
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),R=require('../src/route-solver.cjs');
const P=require('../src/schedule-proposals.cjs'),{fixture}=require('./research-sale-plans.cjs');
function marked(raw,c,state){return S.history(state).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence:R.routes(raw)[0],researchSales:c.researchSales}});}
async function run(){
 const raw=fixture();raw.farm.virtue='integrity';raw.farm.habs=[18,0,0,0];raw.farm.vehicles=raw.farm.vehicles.map(x=>({...x,cars:10}));
 Object.assign(raw.plan,{strategy:'user',autoSequence:false,sequence:'I K C H C I',target:125});
 const {s,c}=R.prepare(raw,R.routes(raw)[0],3),baseline=R.seedRoute(S.buy(s,c,{type:'shift',egg:4}),c,180);
 let best=baseline;const completed=[],control={width:8,cancelled:()=>false,yield:async()=>{},physicalComparisons:0,continuationsCompared:0,explored:0,consider:n=>{completed.push(n);if(R.better(n,best))best=n;}};
 await R.comparePhysicalInvestments([s],c,Date.now()+5000,control);
 assert.ok(best.t<baseline.t-86400,'a paid early hab investment beats leaving it for the final I');
 assert.ok(S.history(best).some(a=>a.type==='hab'&&a.id===18));
 for(const n of completed){const checked=R.replay(raw,marked(raw,c,n));assert.equal(checked.s.t,n.t);assert.ok(S.reached(checked.s,checked.c));}
 const prefixes=R.physicalPrefixes(s,c,S.history(best));
 assert.ok(prefixes.every(n=>[1,4].includes(n.egg)&&n.stage<c.finalResearchStage));
 assert.ok(prefixes.every(n=>!n.path||n.path.action.type==='wait'),'physical branches occur after full purchase interactions');
 const cancelled={...control,cancelled:()=>true,consider:()=>assert.fail('cancelled physical comparison published a candidate')};
 await R.comparePhysicalInvestments([s],c,Date.now()+1000,cancelled);

 const weak=fixture();weak.farm.manualFarmData=true;weak.farm.earningsMode='offline';
 weak.farm.loadouts={current:[{artifactId:'lunar-totem-4-3',stones:['lunar-stone-3']}],earnings:[{artifactId:'lunar-totem-4-3',stones:['lunar-stone-3']}]};
 const strong=structuredClone(weak);strong.farm.loadouts.current[0].stones=['lunar-stone-4'];
 const before=JSON.stringify(strong),reference=P.earningReference(strong);
 assert.deepEqual(reference.farm.loadouts.current,weak.farm.loadouts.current);
 assert.equal(JSON.stringify(strong),before,'proposal generation never replaces actual starting gear');
 assert.equal(P.earningReference(weak),null,'equal earnings need no shadow proposal');
 const wrong=structuredClone(strong);wrong.farm.loadouts.earnings=[{artifactId:'ornate-gusset-4-3',stones:[]}];
 assert.equal(P.earningReference(wrong),null,'different production capacity is not an earnings-only reference');
 wrong.farm.loadouts.earnings=[{artifactId:'puzzle-cube-4-2',stones:[]}];assert.equal(P.earningReference(wrong),null,'different research prices cannot supply a reference');
 const online=structuredClone(strong);online.farm.earningsMode='online';assert.equal(P.earningReference(online),null,'away stones do not change online earnings');
 const pw=R.prepare(weak,R.routes(weak)[0],3),ps=R.prepare(strong,R.routes(strong)[0],3);
 const wait=S.advance(pw.s,pw.c,pw.s.t+900,'Earn gems for the opening',true,'offline'),proposal=R.seedRoute(wait,pw.c,180);
 assert.ok(proposal);const actions=S.history(proposal);
 const faster=P.execute(ps.s,ps.c,actions,{compress:true}),timed=P.execute(ps.s,ps.c,actions);
 assert.ok(faster.t<=proposal.t+1e-6);assert.ok(timed.t<=proposal.t+1e-6,'upgraded gear retains the conservative candidate');
 for(const n of [faster,timed]){const verified=R.replay(strong,marked(strong,ps.c,n));assert.equal(verified.s.t,n.t);assert.ok(S.reached(verified.s,verified.c));}
 const short=P.earningWait(ps.s,ps.c,actions[0]);assert.ok(short<900&&short>=S.offlineMinimum(ps.c));
 const earned=S.advance(ps.s,ps.c,ps.s.t+short,'test',false,'offline');assert.ok(earned.cash-ps.s.cash>=actions[0].cashGained*(1-1e-12));
 assert.throws(()=>P.execute(ps.s,ps.c,actions,{checkpoint:()=>{throw Error('Cancelled');}}),/Cancelled/);
 const poor={...ps.s,cash:0,egg:1,h:[0,0,0,0]};
 assert.throws(()=>P.execute(poor,ps.c,[{type:'hab',slot:0,id:18,cost:0,t:poor.t}]),/not affordable/,'template prices never grant free purchases');
 const noResearch={...ps.s,stage:ps.c.finalCStage};
 assert.throws(()=>P.execute(noResearch,ps.c,[{type:'research',i:0,t:noResearch.t}]),/unavailable/,'the last C remains delivery only');
 let count=0;await R.compareDeliveryResearch([noResearch],ps.c,Date.now()+1000,{...control,consider:()=>count++});assert.equal(count,0,'last C cannot enter final research refinement');
 console.log('PASS investment search: paid hab-first improvement on an arbitrary route, full continuations and replay, physical interaction checkpoints, cancellation, earnings-only proposal validation, actual upgraded gear execution, compressed/offline waits, actual prices, and final-C delivery rules.');
}
module.exports={run};if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
