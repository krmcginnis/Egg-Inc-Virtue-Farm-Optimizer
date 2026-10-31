// DOM behavior uses real generated workers; visual layout needs a real browser.
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{Worker}=require('worker_threads'),{JSDOM,VirtualConsole}=require('jsdom'),root=require('path').resolve(__dirname,'..');
const R=require('../src/route-solver.cjs'),S=require('../src/simulator.cjs'),A=require('../src/api.cjs'),fixture=require('./search-optimality.cjs').verificationFixture();
const sandbox={};vm.runInNewContext(fs.readFileSync(root+'/worker-source.js','utf8'),sandbox);
const errors=[],virtualConsole=new VirtualConsole();
virtualConsole.on('jsdomError',e=>{if(!/Not implemented: (navigation|HTMLCanvasElement)/.test(e.message))errors.push(e.message);});
const dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole}),w=dom.window,active=new Set();
const $=id=>w.document.getElementById(id),query=selector=>w.document.querySelector(selector);
let pause=true,lastBlob,scrolledTo,scrollTop=0,scrollLeft=0,releaseBackup,backupPosts=0;
w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.VIRTUE_PROXY_TOKEN='synthetic-dom-test';
w.fetch=async(url,options)=>{
  if(url==='/api/backup'){
    assert.equal(JSON.parse(options.body).eid,'EI0000000000000000');backupPosts++;
    await new Promise(resolve=>{releaseBackup=resolve;});
    const backup={userName:'SyntheticTester',settings:{lastBackupTime:fixture.config.plan.start},game:{permitLevel:1,soulEggsD:1e30},virtue:{shiftCount:47,eovEarned:Array(5).fill(5),eggsDelivered:Array(5).fill(0)},farms:[{eggType:1}]};
    return {ok:true,text:async()=>A.base64(A.Resp.encode(A.Resp.create({backup})).finish())};
  }
  return {ok:true,json:async()=>({configured:false,available:false,version:'1.1.0'}),text:async()=>''};
};
Object.defineProperties(w,{scrollY:{get:()=>scrollTop},scrollX:{get:()=>scrollLeft}});
w.scrollTo=({top=0,left=0})=>{scrollTop=top;scrollLeft=left;};
w.HTMLElement.prototype.scrollIntoView=function(){scrolledTo=this.id;};
w.URL.createObjectURL=blob=>{lastBlob=blob;return 'blob:synthetic';};w.URL.revokeObjectURL=()=>{};
w.Worker=class{
  constructor(){
    const worker=new Worker("const {parentPort}=require('worker_threads');globalThis.self=globalThis;globalThis.postMessage=m=>parentPort.postMessage(m);parentPort.on('message',data=>self.onmessage({data}));\n"+sandbox.VIRTUE_WORKER_SOURCE,{eval:true});
    this.worker=worker;active.add(worker);worker.on('message',data=>this.onmessage?.({data}));worker.on('error',e=>this.onerror?.(e));
  }
  postMessage(data){this.worker.postMessage(structuredClone(data));if(data.verification&&pause){pause=false;this.worker.postMessage({cancel:true});}}
  terminate(){active.delete(this.worker);this.worker.terminate();}
};
w.addEventListener('error',e=>errors.push(e.error?.stack||e.message));
w.eval(fs.readFileSync(root+'/worker-source.js','utf8'));w.eval(fs.readFileSync(root+'/app.js','utf8'));
const wait=async f=>{
  const until=Date.now()+30000;
  while(!f()){if(Date.now()>until)throw Error('DOM integration timeout: '+$('notice').textContent+'; '+errors.join('\n'));await new Promise(r=>setTimeout(r,10));}
};
const load=doc=>w.VirtueApp.loadFile({name:'Synthetic-Plan.json',text:async()=>JSON.stringify(doc)},{planOnly:true});
async function exportPlan(){
  $('save-plan').click();
  const text=await new Promise((resolve,reject)=>{const reader=new w.FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsText(lastBlob);});
  return JSON.parse(text);
}
(async()=>{
  await wait(()=>w.VirtueApp);
  // Both visible loading and the existing keyboard shortcut use the saved ID,
  // including when the input displays a player name after a successful load.
  const eid=$('eid'),loadAccount=$('load-account');
  eid.focus();eid.value='EI0000000000000000';eid.dispatchEvent(new w.Event('input',{bubbles:true}));eid.blur();
  for(const action of ['button','repeat','enter']){
    if(action==='enter'){eid.focus();eid.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));}
    else loadAccount.click();
    assert.ok(loadAccount.disabled&&eid.disabled,'account import prevents duplicate requests');
    assert.match(loadAccount.textContent,/Loading/);releaseBackup();
    await wait(()=>!loadAccount.disabled);eid.blur();
    assert.equal(eid.value,'SyntheticTester');assert.match($('notice').textContent,/Account information has been loaded/);
  }
  assert.equal(backupPosts,3);

  // Adjacent exact counts retain the specified default and manual selections.
  const preference=require('./shift-plans.cjs').preferenceCase(),ShiftPlans=require('../src/shift-plans.cjs');
  Object.assign(preference.raw.plan,{maxShifts:4,shiftComparisonVersion:2});
  const fastestResult=ShiftPlans.create(preference.entries,4);
  await load({version:1,config:preference.raw,result:fastestResult});
  assert.equal(w.VirtueApp.getResult().switches,4);
  assert.deepEqual([...w.document.querySelectorAll('[data-shifts]')].map(n=>n.dataset.shifts),['5','4','3']);
  assert.match(query('[data-shifts="4"]').textContent,/Specified shifts/);
  assert.match(query('[data-shifts="5"]').textContent,/Specified \+ 1 shift/);
  assert.doesNotMatch(query('.plan-choice-selected').textContent,/recommend|allowance|preference/i);
  query('[data-shifts="3"]').click();
  const selectedSaved=await exportPlan();await load(selectedSaved);
  assert.equal(w.VirtueApp.getResult().switches,3);assert.equal(w.VirtueApp.getResult().recommendedSwitches,undefined);

  const replay=R.replay(fixture.config,fixture.result.actions,true),later=S.buy(replay.s,replay.c,{type:'shift',egg:S.EGGS.indexOf('integrity')});
  const alternate={...fixture.result,end:later.t,seconds:later.t-fixture.result.start,switches:later.stage,actions:S.history(later).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:fixture.result.actions[0].routeSearch})};
  const comparison={...fixture,result:{...fixture.result,shiftPlans:[{switches:fixture.result.switches,plan:fixture.result},{switches:alternate.switches,plan:alternate}],selectedSwitches:fixture.result.switches,recommendedSwitches:fixture.result.switches,shiftComparisonVersion:1}};
  await load(comparison);
  assert.equal($('result-content').firstElementChild.id,'plan-choices','selected plan and alternatives precede the timeline');
  assert.equal(query('.result-summary'),null,'the redundant summary card is removed');
  assert.equal($('plan-choices').nextElementSibling.id,'plan-progress','current progress follows Compare Plans');
  assert.ok(query('[data-shifts="'+alternate.switches+'"]'));assert.equal(w.VirtueApp.getResult().switches,fixture.result.switches);
  const savedAlternative=await exportPlan();await load(savedAlternative);
  assert.equal(w.VirtueApp.getResult().selectedSwitches,fixture.result.switches,'selection survives saving with the new layout');
  await load(fixture);
  query('.plan-jump').click();assert.equal(scrolledTo,'plan-progress-heading');assert.equal(w.document.activeElement.id,'plan-progress-heading');
  w.scrollTo({top:640});query('[data-tab="farm"]').click();w.scrollTo({top:180});query('[data-tab="results"]').click();assert.equal(w.scrollY,640,'returning to the timeline retains scroll');
  $('expand-timeline').click();assert.ok([...w.document.querySelectorAll('.timeline-group,.full-breakdown,.purchase-decisions')].every(d=>d.open));
  $('expand-timeline').click();assert.ok([...w.document.querySelectorAll('.timeline-group,.full-breakdown,.purchase-decisions')].every(d=>!d.open));
  assert.equal(query('.plan-details,.optimality-bound,.search-details,.purchase-check,#verify-purchases'),null);

  // Stale inputs and checked progress offer different, actionable recovery.
  const target=$('target');target.value=fixture.config.plan.target+1;target.dispatchEvent(new w.Event('input',{bubbles:true}));
  assert.ok(!$('plan-stale').hidden);assert.match($('plan-stale').textContent,/Inputs changed/i);
  await load(fixture);
  const snapshot=structuredClone(fixture.config);snapshot.importInfo={scope:'farm',timestamp:fixture.config.plan.start};
  await w.VirtueApp.loadFile({text:async()=>JSON.stringify(snapshot)},{trackOnly:true});
  assert.ok($('reoptimize-remaining'),'checked progress retains its reoptimization action');
  query('.plan-jump').click();assert.equal(scrolledTo,'plan-progress-next');assert.equal(w.document.activeElement.id,'plan-progress-next');
  await load(fixture);

  // The removed manual UI does not discard saved purchase-check frontiers.
  // Exercise the generated worker directly, then round-trip its real checkpoint
  // through the visible Save Plan and Load Plan actions.
  const check=result=>new Promise((resolve,reject)=>{
    const worker=new w.Worker(),timer=setTimeout(()=>{worker.terminate();reject(Error('Purchase worker timed out'));},30000);
    const finish=()=>{clearTimeout(timer);worker.terminate();};
    worker.onerror=e=>{finish();reject(e);};
    worker.onmessage=({data})=>{if(data.type==='verification'){finish();resolve(data.result);}else if(data.type==='error'){finish();reject(Error(data.error));}};
    worker.postMessage({verification:{config:fixture.config,result},options:{maxMs:30000}});
  });
  const paused=await check(fixture.result);assert.equal(paused.verification.complete,false);assert.ok(paused.verification.blocks.some(b=>b.frontier.length));
  await load({...fixture,result:paused});const saved=await exportPlan();assert.deepEqual(saved.result.verification,JSON.parse(JSON.stringify(paused.verification)));
  await load(saved);assert.deepEqual(JSON.parse(JSON.stringify(w.VirtueApp.getResult().verification)),JSON.parse(JSON.stringify(paused.verification)));
  const completed=await check(saved.result);await load({...saved,result:completed});
  const done=structuredClone(w.VirtueApp.getResult());assert.ok(done.end<=fixture.result.end);assert.ok(done.verification.complete);
  R.replay(fixture.config,done.actions,true);assert.equal(query('.plan-details,.purchase-check,#verify-purchases'),null);
  assert.ok(query('.final-result .next-ascension-section').contains($('next-ascension')));
  query('.next-ascension-section>summary').click();$('next-ascension').click();
  assert.equal(w.VirtueApp.getResult(),null);assert.equal(w.VirtueApp.getConfig().plan.start,done.end);
  assert.deepEqual(errors,[]);
  console.log('PASS DOM/real-worker integration: account button and Enter, navigation/scroll, next-step focus, stale/progress guidance, removed Plan Details, generated-worker paused checkpoint save/load/resume and next ascension.');
})().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(()=>{for(const worker of active)worker.terminate();w.close();});
