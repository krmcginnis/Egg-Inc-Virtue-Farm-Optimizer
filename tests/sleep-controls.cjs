'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom'),blank=require('../src/blank-farm.cjs');
(async()=>{
 const root=path.resolve(__dirname,'..'),html=fs.readFileSync(root+'/index.html','utf8');
 const dom=new JSDOM(html,{url:'http://localhost',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,errors=[];w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.AbortController=AbortController;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLCanvasElement.prototype.getContext=()=>({measureText:text=>({width:text.length*7})});
 w.fetch=async()=>({ok:true,json:async()=>({version:require('../package.json').version,pending:false})});w.addEventListener('error',e=>errors.push(e.error));
 try{
  w.eval(fs.readFileSync(root+'/worker-source.js','utf8'));w.eval(fs.readFileSync(root+'/app.js','utf8'));
  const $=id=>w.document.getElementById(id),app=w.VirtueApp;assert.ok(app);const load=async raw=>app.loadFile({name:'Synthetic-Sleep.json',text:async()=>JSON.stringify(raw)});
  const ids=[...w.document.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length,'no duplicate IDs after form rendering');
  for(const node of w.document.querySelectorAll('[aria-controls]'))for(const id of node.getAttribute('aria-controls').split(/\s+/))assert.ok($(id),'control target exists after form rendering: '+id);
  assert.ok($('eventTimezone').closest('label').textContent.includes('Sleep & Display Timezone'));
  assert.ok(w.document.querySelector('[data-page="help"]').textContent.includes('Pacific Time (America/Los_Angeles), following PST/PDT'));
  app.tab('help');assert.equal($('page-title').textContent,'How It Works');assert.equal(w.document.querySelector('[data-page="help"]').hidden,false);assert.equal($('assumptions').closest('[data-page]').dataset.page,'help');assert.equal(w.document.querySelectorAll('main > [data-page]').length,5,'rewritten help remains a separate navigation page');
  for(const link of w.document.querySelectorAll('[data-page="help"] a[href]')){const href=link.getAttribute('href');if(href.startsWith('#'))assert.ok($(href.slice(1)),'help topic exists: '+href);else if(!link.href.startsWith('https:'))assert.ok(fs.existsSync(path.join(root,href)),'help links resolve to bundled files');}
  app.tab('planning');
  const set=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
  const enabled=value=>{$('sleepEnabled').checked=value;$('sleepEnabled').dispatchEvent(new w.Event('input',{bubbles:true}));app.refresh();};
  assert.equal($('sleepEnabled').checked,true);assert.equal($('sleep-settings').hidden,false);assert.equal($('sleepStart').disabled,false);assert.equal($('sleepEnd').disabled,false);assert.equal($('sleepStart').value,'23:00');assert.equal($('sleepEnd').value,'07:00');assert.ok(app.getConfig().plan.sleep.enabled);
  assert.equal($('sleep-settings').querySelector('p'),null,'the highlighted sleep paragraph is removed');
  enabled(false);assert.equal($('sleep-settings').hidden,true);assert.equal($('sleepStart').disabled,true);assert.equal($('sleepEnd').disabled,true);const disabled=app.getConfig();await load(disabled);assert.equal($('sleepEnabled').checked,false,'an explicitly disabled saved schedule stays disabled');
  $('clear-data').click();assert.equal($('sleepEnabled').checked,true);assert.equal($('sleep-settings').hidden,false);assert.equal($('sleepStart').value,'23:00');assert.equal($('sleepEnd').value,'07:00');assert.ok(app.getConfig().plan.sleep.enabled,'reset creates a fresh enabled schedule');
  $('undo-reset').click();assert.equal($('sleepEnabled').checked,false,'undo restores the saved disabled preference');enabled(true);
  assert.equal($('sleepTimezone'),null);assert.ok($('eventTimezone').options.length<=28);
  set('eventTimezone','America/Los_Angeles');set('sleepStart','22:30');set('sleepEnd','06:15');assert.equal(app.refresh(),true);
  const saved=app.getConfig();assert.equal(saved.plan.sleep.timezone,undefined);assert.equal(saved.plan.eventTimezone,'America/Los_Angeles');assert.equal(require('../src/simulator.cjs').prepare(saved).c.sleep.timezone,'America/Los_Angeles');await load(saved);assert.equal($('sleepStart').value,'22:30');assert.equal($('sleepEnd').value,'06:15');assert.equal($('eventTimezone').value,'America/Los_Angeles');assert.equal($('sleep-settings').hidden,false);
  set('eventTimezone','automatic');assert.equal(app.refresh(),true);const automatic=app.getConfig();assert.equal(automatic.plan.eventTimezoneMode,'automatic');assert.equal(require('../src/simulator.cjs').prepare(automatic).c.sleep.timezone,require('../src/ui-defaults.cjs').timezone());
  const uncommon=structuredClone(saved);uncommon.plan.eventTimezone='Asia/Tehran';uncommon.plan.eventTimezoneMode='explicit';uncommon.plan.sleep.timezone='UTC';await load(uncommon);assert.equal($('eventTimezone').value,'Asia/Tehran');assert.ok([...$('eventTimezone').options].some(o=>o.value==='Asia/Tehran'));assert.equal(require('../src/simulator.cjs').prepare(app.getConfig()).c.sleep.timezone,'Asia/Tehran','saved sleep overrides are ignored');
  set('sleepEnd','22:30');assert.equal(app.refresh(),false);assert.equal($('sleepEnd').getAttribute('aria-invalid'),'true');enabled(false);assert.equal(app.refresh(),true,'disabled invalid settings do not block planning');
  await load(blank(1791993600));assert.equal($('sleepEnabled').checked,false);assert.equal($('sleep-settings').hidden,true,'older files without sleep load with it disabled');
  const fixture=require('./research-sale-plans.cjs').fixture();Object.assign(fixture.plan,{start:Date.parse('2026-10-08T22:59:59Z')/1000,eventTimezone:'UTC',solverVersion:2,maxDays:366,target:105,strategy:'user',autoSequence:false,sequence:'C K I R H',sleep:{enabled:true,start:'23:00',end:'07:00'}});
  const result=await require('../src/optimizer.cjs').solve(fixture,{maxMs:1500});await load({version:1,config:fixture,result});assert.ok(app.getResult());assert.ok(w.document.querySelector('.sleep-plan-note'));assert.ok(w.document.querySelector('#result-content').textContent.toLowerCase().includes('sleep included'));assert.ok(!$('notice').classList.contains('error'),'saved result loads and displays');
  assert.ok(w.document.querySelector('.sleep-plan-note').textContent.includes('UTC'));assert.ok(!w.document.querySelector('.sleep-plan-note').textContent.includes('undefined'));
  const selected=new Intl.DateTimeFormat('en-US',{timeZone:'UTC',year:'numeric',month:'short',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit',second:'2-digit',timeZoneName:'short'}),dates=w.document.querySelectorAll('.shift-start,.shift-end');assert.ok(dates.length);
  for(const node of dates)assert.ok(node.textContent.endsWith(selected.format(new Date(node.dateTime))),'shift dates display in the selected timezone, not the event timezone');
  const prepared=require('../src/simulator.cjs').prepare(app.getConfig());assert.equal(prepared.c.zone,'UTC');assert.equal(prepared.c.sleep.timezone,'UTC');
  const friday=Date.parse('2026-10-09T16:00:00Z')/1000,S=require('../src/simulator.cjs');assert.equal(S.at(prepared.c,friday-1).sale,1);assert.equal(S.at(prepared.c,friday).sale,.3);
  assert.deepEqual(errors,[]);console.log('PASS sleep controls: enabled fresh/reset defaults, disabled save/load and reset undo, removed hint, validation, shared/Automatic timezone, compact choices, uncommon saved selections, legacy files, and built app timeline rendering (DOM harness).');
 }finally{dom.window.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
