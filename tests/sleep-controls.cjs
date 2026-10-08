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
  const set=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
  const enabled=value=>{$('sleepEnabled').checked=value;$('sleepEnabled').dispatchEvent(new w.Event('input',{bubbles:true}));app.refresh();};
  assert.equal($('sleepEnabled').checked,false);assert.equal($('sleep-settings').hidden,true);assert.equal($('sleepStart').disabled,true);assert.equal($('sleepStart').value,'23:00');assert.equal($('sleepEnd').value,'07:00');
  enabled(true);assert.equal($('sleep-settings').hidden,false);assert.equal($('sleepStart').disabled,false);assert.ok(app.getConfig().plan.sleep.enabled);
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
  assert.deepEqual(errors,[]);console.log('PASS sleep controls: opt-in defaults, validation, shared/Automatic timezone, compact choices, uncommon saved selections, legacy files, and built app timeline rendering (DOM harness).');
 }finally{dom.window.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
