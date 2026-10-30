'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const R=require('../src/route-solver.cjs'),S=require('../src/simulator.cjs'),C=require('../src/plan-continuation.cjs'),P=require('../src/plan-progress.cjs'),Plans=require('../src/shift-plans.cjs'),Run=require('../src/run-shifts.cjs'),U=require('../src/shift-summary.cjs');
const root=path.resolve(__dirname,'..');
// Synthetic paid timelines with a multi-day / 4.59% tradeoff, no account data.
function resultFor(raw,counts=[[5,11015589],[6,10532210]]){
 const route=['curiosity','humility','kindness','curiosity','resilience','humility','integrity'];
 return Plans.create(counts.map(([switches,seconds])=>{
  const sequence=route.slice(0,switches+1),{s,c}=R.prepare(raw,sequence,3);let state=s;
  for(const egg of sequence.slice(1))state=S.buy(state,c,{type:'shift',egg:S.EGGS.indexOf(egg)});
  state=S.advance(state,c,c.start+seconds,'Synthetic complete alternative',true,'online');
  const actions=S.history(state).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence,researchSales:3}});
  const plan=C.verified(raw,{version:1,solverVersion:2,initialSiloRule:'one',target:c.target,start:c.start,end:state.t,seconds:state.t-c.start,switches,actions,route:sequence,researchSales:3,researchDeadline:c.researchDeadline,actualResearchSales:0,frontier:[],explored:0,method:'Synthetic plan choice fixture',termination:'complete'});
  return {switches,plan};
 }));
}
function fixture(start=1793381041.952){
 const config=require('./research-sale-plans.cjs').fixture();
 Object.assign(config.farm,{shiftCount:62});
 Object.assign(config.plan,{start,solverVersion:2,maxDays:366,maxShifts:6,maxSwitches:6,strategy:'wasmegg',autoSequence:true,target:100,ships:{mode:'none'},sleep:{enabled:false},eventTimezone:'America/Los_Angeles'});
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
  assert.equal($('#result-content').firstElementChild.id,'plan-choices','choices precede the summary and progress');
  assert.match($('.plan-choice-selected').textContent,/Selected timeline: 5 new shifts/);
  assert.match($('.plan-choice-finish').textContent,/Mar 6, 2027.*21:17:10 PST/);
  assert.match($('.plan-choice-tradeoff').textContent,/5d 14h 16m later \(\+4\.59%\).*1 fewer shift/);
  assert.match($('.plan-choice-reason').textContent,/4\.59% more time, within your 5% allowance/);
  assert.match($('[data-shifts="5"]').textContent,/Selected.*Recommended · fewer shifts/);
  assert.match($('[data-shifts="6"]').textContent,/Earliest finish found/);
  assert.doesNotMatch($('.result-summary').textContent,/Finish time comes first/);
  assert.doesNotMatch($('#plan-choices').textContent,/\b(?:AM|PM)\b/);
  const config=app.getConfig();$('.plan-choice-earliest').click();
  assert.equal(app.getResult().selectedSwitches,6);assert.equal(app.getResult().recommendedSwitches,5);
  assert.equal(app.getResult().end,doc.result.shiftPlans.find(e=>e.switches===6).plan.end);
  assert.equal($('[data-shifts][aria-pressed="true"]').dataset.shifts,'6');assert.equal(w.document.activeElement.dataset.shifts,'6');
  assert.match($('.plan-choice-selected').textContent,/Selected timeline: 6 new shifts.*Earliest finish found/);
  assert.equal($('.plan-choice-earliest'),null);assert.equal($('.plan-choice-reason'),null);
  assert.deepEqual(app.getConfig(),config);assert.deepEqual(JSON.parse(JSON.stringify(app.getResult().summary)),JSON.parse(JSON.stringify(U.summarize(doc.config,app.getResult()))));
  const saved=await save();assert.equal(saved.result.selectedSwitches,6);assert.equal(saved.result.recommendedSwitches,5);
  await load(saved);assert.equal(app.getResult().selectedSwitches,6);assert.match($('[data-shifts="6"]').textContent,/Selected/);
  $('[data-shifts="5"]').click();assert.equal(app.getResult().selectedSwitches,5);assert.ok($('.plan-choice-earliest'));
  // Proposals have their own choice. Changing it leaves the old timeline intact
  // until applying, then exports and a save/load keep the selected faster plan.
  const current=fixture(Date.now()/1000-30),snapshot=structuredClone(current.config);
  snapshot.importInfo={scope:'farm',timestamp:Date.now()/1000-1};
  current.progress={snapshot,confirmed:[],launched:{},planKey:P.key(current.result)};
  await load(current);const original=JSON.stringify(app.getResult());
  assert.ok(!$('#reoptimize-remaining').disabled);$('#reoptimize-remaining').click();
  assert.equal(workers.length,4);assert.ok($('#plan-choices button').disabled,'choices are locked while the source is in use');
  const request=workers[0].messages[0].continuation,prepared=C.prepare(request),remaining=resultFor(prepared.config);
  const proposal={...prepared,report:undefined,result:remaining,baseline:Plans.fastest(remaining.shiftPlans).plan,baselineError:''};
  for(const worker of workers)worker.onmessage({data:{type:'continuation',continuation:structuredClone(proposal)}});
  assert.ok($('#remaining-plan-choices'));assert.equal($('#plan-choices'),null,'avoid mixing original and preview choice cards');
  assert.match($('#remaining-plan-choices .plan-choice-selected').textContent,/Selected to apply: 5 remaining shifts/);
  assert.match($('#remaining-plan-comparison').textContent,/Earliest finish found \(6 remaining shifts\)/i);
  assert.equal(JSON.stringify(app.getResult()),original,'the original timeline is retained for review');
  $('#remaining-plan-choices .plan-choice-earliest').click();
  assert.equal(app.getResult().selectedSwitches,5,'preview changes do not select the original timeline');
  assert.match($('#remaining-plan-choices .plan-choice-selected').textContent,/Selected to apply: 6 remaining shifts/);
  const preview=await save();assert.equal(preview.remainingProposal.result.selectedSwitches,6);
  await load(preview);assert.match($('#remaining-plan-choices .plan-choice-selected').textContent,/6 remaining shifts/);
  assert.ok(!$('#use-remaining-plan').disabled);$('#use-remaining-plan').click();
  assert.equal(app.getResult().selectedSwitches,6,$('#notice').textContent);assert.equal($('#remaining-plan-choices'),null);
  assert.match($('#plan-choices .plan-choice-selected').textContent,/Selected timeline: 6 remaining shifts/);
  const applied=await save();C.verified(applied.config,applied.result);assert.equal(applied.result.end,Plans.fastest(remaining.shiftPlans).plan.end);
  await load(applied);assert.equal(app.getResult().selectedSwitches,6);
  // A single plan and tied finishes have no artificial penalty / fast CTA.
  const single=fixture();single.result=Plans.create([single.result.shiftPlans[1]]);await load(single);
  assert.match($('.plan-choice-selected').textContent,/Only one complete plan found/);assert.equal($('.plan-choice-earliest'),null);
  const tied=fixture();tied.result=resultFor(tied.config,[[5,1000],[6,1000]]);await load(tied);
  assert.equal(app.getResult().selectedSwitches,5);assert.equal($('.plan-choice-earliest'),null);assert.doesNotMatch($('#plan-choices').textContent,/NaN|Infinity|null|later/);
  const manual=fixture();manual.result=Plans.select(resultFor(manual.config,[[4,12000000],[5,11015589],[6,10532210]]),4);await load(manual);
  assert.equal(app.getResult().recommendedSwitches,5);assert.match($('.plan-choice-reason').textContent,/You selected this plan.*recommendation is 5 new shifts/);
  assert.doesNotMatch($('[data-shifts="4"]').textContent,/Recommended/);
  assert.deepEqual(errors,[]);console.log('PASS compiled plan choices: prominent 5% tradeoff, independent selected/recommended/earliest labels, direct fastest choice, summary and saved exports, preview isolation and apply/save/load, busy locks, single/tied plans, and 24-hour dates.');
 }finally{w.close();}
}
module.exports={run,fixture};if(require.main===module)run().catch(e=>{console.error(String(e.stack).split('\n').filter(line=>line.length<500).join('\n'));process.exitCode=1;});
