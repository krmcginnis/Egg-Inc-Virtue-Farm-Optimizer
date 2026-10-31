'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const R=require('../src/route-solver.cjs'),S=require('../src/simulator.cjs'),C=require('../src/plan-continuation.cjs'),P=require('../src/plan-progress.cjs'),Plans=require('../src/shift-plans.cjs'),Run=require('../src/run-shifts.cjs'),U=require('../src/shift-summary.cjs');
const root=path.resolve(__dirname,'..');
// Synthetic paid timelines with a multi-day / 4.59% tradeoff, no account data.
function resultFor(raw,counts=[[7,10531210],[6,10532210],[5,11015589]],loadouts={}){
 const route=['curiosity','humility','kindness','curiosity','resilience','humility','integrity','curiosity'];
 return Plans.create(counts.map(([switches,seconds])=>{
  const sequence=route.slice(0,switches+1),{s,c}=R.prepare(raw,sequence,3);let state=s;
  for(const egg of sequence.slice(1)){
   state=S.buy(state,c,{type:'shift',egg:S.EGGS.indexOf(egg)});
   if(egg==='humility'&&loadouts[switches]&&state.set!==loadouts[switches])state=S.buy(state,c,{type:'set',set:loadouts[switches]});
  }
  state=S.advance(state,c,c.start+seconds,'Synthetic complete alternative',true,'online');
  const actions=S.history(state).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence,researchSales:3}});
  const plan=C.verified(raw,{version:1,solverVersion:2,initialSiloRule:'one',target:c.target,start:c.start,end:state.t,seconds:state.t-c.start,switches,actions,route:sequence,researchSales:3,researchDeadline:c.researchDeadline,actualResearchSales:0,frontier:[],explored:0,method:'Synthetic plan choice fixture',termination:'complete'});
  return {switches,plan};
 }),raw.plan.shiftComparisonVersion===2?raw.plan.maxShifts:undefined);
}
function fixture(start=1793381041.952){
 const config=require('./research-sale-plans.cjs').fixture();
 Object.assign(config.farm,{shiftCount:62});
 Object.assign(config.plan,{start,solverVersion:2,maxDays:366,maxShifts:6,maxSwitches:6,shiftComparisonVersion:2,strategy:'wasmegg',autoSequence:true,target:100,ships:{mode:'none'},sleep:{enabled:false},eventTimezone:'America/Los_Angeles'});
 config.runShifts=Run.create(config,6,12);
 return {version:1,config,result:resultFor(config)};
}
async function run(){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Not implemented: (navigation|HTMLCanvasElement)/.test(e.message))errors.push(e.message);});
 const dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,workers=[];let download;
 w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.Blob=Blob;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLAnchorElement.prototype.click=()=>{};
 w.URL.createObjectURL=blob=>{download=blob;return 'blob:synthetic';};w.URL.revokeObjectURL=()=>{};
 w.fetch=async()=>({ok:true,json:async()=>({version:require('../package.json').version,configured:false})});
 w.Worker=class{constructor(){this.messages=[];workers.push(this);}postMessage(data){this.messages.push(data);}terminate(){}};
 w.addEventListener('error',e=>errors.push(e.error?.stack||e.message));
 const $=selector=>w.document.querySelector(selector),load=raw=>w.VirtueApp.loadFile({text:async()=>JSON.stringify(raw)},{planOnly:true});
 const save=async()=>{$('#save-plan').click();return JSON.parse(await download.text());};
 try{
  w.eval(fs.readFileSync(root+'/worker-source.js','utf8'));w.eval(fs.readFileSync(root+'/app.js','utf8'));const app=w.VirtueApp,doc=fixture();
  await load(doc);assert.ok(app.getResult(),$('#notice').textContent);
  assert.equal($('#result-content').firstElementChild.id,'plan-choices');
  assert.equal($('.result-summary'),null);assert.equal($('.plan-choice-earliest'),null);
  assert.ok($('#plan-choices .plan-comparison-header #save-plan'));assert.ok($('#plan-choices .plan-comparison-header .plan-jump'));
  assert.match($('#plan-choices .plan-actions').textContent,/Save PlanExport WalkthroughCheck Farm Progress/);
  assert.deepEqual([...w.document.querySelectorAll('[data-shifts]')].map(n=>n.dataset.shifts),['7','6','5']);
  assert.deepEqual([...w.document.querySelectorAll('[data-plan-role]')].map(n=>n.dataset.planRole),['extra','specified','fewer']);
  assert.equal(app.getResult().selectedSwitches,6,'N defaults even though N+1 is faster');assert.equal($('[aria-pressed="true"][data-shifts]').dataset.shifts,'6');
  assert.equal(w.document.querySelectorAll('.plan-comparison-table thead th').length,4);
  assert.deepEqual([...w.document.querySelectorAll('.plan-comparison-table tbody tr')].map(n=>n.dataset.metricRow),['shifts','seconds','end','laying','shipping','soul']);
  assert.ok([...w.document.querySelectorAll('.plan-comparison-table tbody tr')].every(n=>n.children[0].scope==='row'&&n.children.length===4));
  assert.equal(w.document.querySelectorAll('.plan-comparison-table tbody [data-plan-shifts="6"].plan-comparison-selected').length,6,'the selected column is highlighted across all metrics');
  assert.doesNotMatch($('#plan-choices').textContent,/recommend|allowance|preference|\b(?:AM|PM)\b/i);
  for(const e of doc.result.shiftPlans){
   const summary=U.summarize(doc.config,e.plan),values=Object.fromEntries([...w.document.querySelectorAll(`tbody [data-plan-shifts="${e.switches}"][data-metric]`)].map(n=>[n.dataset.metric,Number(n.dataset.value)]));
   assert.deepEqual(values,{shifts:e.switches,seconds:e.plan.seconds,end:e.plan.end,laying:Math.max(...summary.shifts.map(s=>s.maxRates.laying))*3600,shipping:Math.max(...summary.shifts.map(s=>s.maxRates.shipping))*3600,soul:R.replay(doc.config,e.plan.actions,true).s.lost});
  }
  const deltas=()=>[...w.document.querySelectorAll('.plan-metric-delta')].map(n=>({text:n.textContent,tone:n.className,percent:n.dataset.percent}));
  const delta=(metric,shifts)=>$(`[data-metric="${metric}"][data-plan-shifts="${shifts}"] .plan-metric-delta`);
  assert.match(delta('seconds',7).textContent,/<0.01% faster vs N/);assert.ok(delta('seconds',7).classList.contains('better'));
  assert.ok(delta('seconds',5).classList.contains('worse'));assert.ok(delta('soul',7).classList.contains('worse'));assert.ok(delta('soul',5).classList.contains('better'));
  assert.ok(delta('laying',7).classList.contains('neutral'));assert.match(delta('shipping',6).textContent,/N baseline/);
  const comparisons=deltas();
  $('[data-shifts="7"]').click();assert.equal(app.getResult().selectedSwitches,7);assert.equal(w.document.activeElement.dataset.shifts,'7');assert.deepEqual(deltas(),comparisons,'changing selection never changes the N baseline');
  $('[data-shifts="5"]').click();assert.match($('.plan-choice-tradeoff').textContent,/later.*2 fewer shifts/);
  const saved=await save();await load(saved);assert.equal(app.getResult().selectedSwitches,5);assert.equal(app.getResult().specifiedSwitches,6);assert.match($('[data-shifts="5"]').textContent,/Selected/);
  $('[data-shifts="7"]').click();assert.equal(app.getResult().selectedSwitches,7);assert.equal($('.plan-choice-earliest'),null);
  assert.deepEqual(JSON.parse(JSON.stringify(app.getResult().summary)),JSON.parse(JSON.stringify(U.summarize(doc.config,app.getResult()))));
  const varied=fixture();varied.config.farm.loadouts={current:[],earnings:[{artifactId:'quantum-metronome-4-3',stones:[]},{artifactId:'interstellar-compass-4-3',stones:[]}],delivery:[{artifactId:'quantum-metronome-4-3',stones:['tachyon-stone-4','tachyon-stone-4','tachyon-stone-4']},{artifactId:'interstellar-compass-4-3',stones:['quantum-stone-4','quantum-stone-4']}]};
  varied.result=resultFor(varied.config,undefined,{7:'delivery',6:'earnings'});await load(varied);
  for(const metric of ['laying','shipping']){
   assert.ok(delta(metric,7).classList.contains('better'),metric+' capacity increase is green');assert.ok(delta(metric,5).classList.contains('worse'),metric+' capacity decrease is red');
   for(const shifts of [7,5]){const value=Number($(`[data-metric="${metric}"][data-plan-shifts="${shifts}"]`).dataset.value),base=Number($(`[data-metric="${metric}"][data-plan-shifts="6"]`).dataset.value);assert.ok(Math.abs(Number(delta(metric,shifts).dataset.percent)-(value-base)/base*100)<1e-10);}
  }
  // Check all three plans before showing the remaining-plan proposal. The
  // selected N and an explicitly selected alternative survive save and apply.
  const current=fixture(Date.now()/1000-30),snapshot=structuredClone(current.config);snapshot.importInfo={scope:'farm',timestamp:Date.now()/1000-1};
  current.progress={snapshot,confirmed:[],launched:{},planKey:P.key(current.result)};await load(current);const original=JSON.stringify(app.getResult());
  $('#reoptimize-remaining').click();assert.equal(workers.length,4);assert.ok($('#plan-choices .plan-choice-option').disabled);
  assert.ok(!$('#save-plan').disabled,'moving Save Plan must not lock it during background search');assert.equal(JSON.stringify((await save()).result),original);
  const request=workers[0].messages[0].continuation,prepared=C.prepare(request),remaining=resultFor(prepared.config),proposal={...prepared,report:undefined,result:remaining,baseline:Plans.fastest(remaining.shiftPlans).plan,baselineError:''};
  assert.equal(S.prepare(prepared.config).c.maxSwitches,7,'only one extra shift is searched');
  for(const worker of workers.slice(0,4))worker.onmessage({data:{type:'continuation',continuation:structuredClone(proposal)}});
  assert.equal(workers.length,6);assert.match($('#search-status-heading').textContent,/Checking Final Plan Purchases/);
  for(let i=4;i<workers.length;i++){const worker=workers[i],posted=worker.messages[0].verification,checked=await require('../src/plan-verification.cjs').search(posted.config,posted.result,{maxMs:1000});worker.onmessage({data:{type:'verification',result:checked}});}
  assert.equal(workers.length,7,'three final plans use two check workers at a time');assert.equal(w.document.querySelectorAll('#remaining-plan-choices .plan-choice-check').length,3);
  assert.equal($('#plan-choices'),null);assert.match($('#remaining-plan-choices .plan-choice-selected').textContent,/Selected to apply: 6 remaining shifts/);assert.equal(JSON.stringify(app.getResult()),original);
  assert.ok($('#remaining-plan-choices .plan-comparison-header #save-plan'));assert.match($('#remaining-plan-choices .plan-actions button.secondary').title,/proposed remaining plan/);
  $('#remaining-plan-choices [data-shifts="7"]').click();assert.equal(app.getResult().selectedSwitches,6,'preview retains original timeline');
  const preview=await save();await load(preview);assert.match($('#remaining-plan-choices .plan-choice-selected').textContent,/7 remaining shifts/);
  $('#use-remaining-plan').click();assert.equal(app.getResult().selectedSwitches,7,$('#notice').textContent);assert.equal($('#remaining-plan-choices'),null);assert.ok($('#verify-purchases').hidden);
  const applied=await save();assert.ok(applied.result.shiftPlans.every(e=>e.plan.verification.complete));assert.equal(C.verified(applied.config,applied.result).selectedSwitches,7);await load(applied);assert.equal(app.getResult().selectedSwitches,7);
  // Missing exact counts are explicit, never replaced by a different count.
  const missing=fixture();missing.result=Plans.create(missing.result.shiftPlans.filter(e=>e.switches!==6),6);await load(missing);assert.equal(app.getResult().selectedSwitches,7);assert.match($('[data-plan-role="specified"] .plan-choice-availability').textContent,/No complete plan found/);assert.ok(deltas().every(d=>d.text==='N unavailable'&&d.tone.includes('neutral')));
  const single=fixture();single.result=Plans.create([single.result.shiftPlans.find(e=>e.switches===6)],6);await load(single);assert.equal(app.getResult().selectedSwitches,6);assert.equal($('.plan-choice-earliest'),null);
  const tied=fixture();tied.result=resultFor(tied.config,[[5,1000],[6,1000],[7,1000]]);await load(tied);assert.equal(app.getResult().selectedSwitches,6);assert.doesNotMatch($('#plan-choices').textContent,/NaN|Infinity|null/);
  const zero=fixture();zero.config.plan.maxShifts=0;delete zero.config.runShifts;zero.result=resultFor(zero.config,[[0,1000],[1,1100]]);await load(zero);assert.equal(app.getResult().selectedSwitches,0);assert.match($('[data-plan-role="fewer"]').textContent,/Not applicable when zero shifts/);assert.match(delta('soul',1).textContent,/higher · N is zero/);assert.ok(delta('soul',1).classList.contains('worse'));assert.doesNotMatch($('#plan-choices').textContent,/NaN|Infinity/);
  const old=fixture();old.result=old.result.shiftPlans[1].plan;await load(old);assert.ok($('#plan-choices #save-plan'),'a single legacy plan retains the relocated actions');assert.equal($('.result-summary'),null);assert.ok((await save()).result);
  // Older selected timelines and checked progress are retained on loading.
  const manual=fixture(),four=resultFor(manual.config,[[4,12000000]]).shiftPlans[0];delete manual.config.plan.shiftComparisonVersion;
  manual.result={...four.plan,shiftPlans:[manual.result.shiftPlans.find(e=>e.switches===6),manual.result.shiftPlans.find(e=>e.switches===5),four],selectedSwitches:4,recommendedSwitches:4,shiftComparisonVersion:1};
  manual.progress={snapshot:structuredClone(manual.config),confirmed:[],launched:{},planKey:P.key(manual.result)};await load(manual);
  assert.equal(app.getResult().selectedSwitches,4,$('#notice').textContent);assert.equal($('[data-shifts="4"]'),null);assert.match($('.plan-choice-legacy').textContent,/older shift-count/);
  const legacySaved=await save();assert.deepEqual(legacySaved.progress,manual.progress);await load(legacySaved);assert.equal(app.getResult().selectedSwitches,4);$('[data-shifts="6"]').click();assert.equal(app.getResult().selectedSwitches,6);
  assert.deepEqual(errors,[]);console.log('PASS compiled adjacent plan comparison: N+1/N/N-1 order, fixed N percentage baseline, better/worse colors for all four metrics, zero/missing baselines, relocated actions including saving during search, replayed rates/costs, manual/save/load/preview/application, automatic checks, legacy progress and 24-hour dates.');
 }finally{w.close();}
}
module.exports={run,fixture,resultFor};if(require.main===module)run().catch(e=>{console.error(String(e.stack).split('\n').filter(line=>line.length<500).join('\n'));process.exitCode=1;});
