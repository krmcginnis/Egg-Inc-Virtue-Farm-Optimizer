'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM,VirtualConsole}=require('jsdom');
const S=require('../src/simulator.cjs'),R=require('../src/route-solver.cjs'),L=require('../src/optimizer-legacy.cjs'),Q=require('../src/walkthrough-pdf.cjs'),D=require('../src/date-time.cjs'),root=path.resolve(__dirname,'..');
function fixture(){
 const raw=require('./research-sale-plans.cjs').fixture();raw.farm.cash=1e100;raw.farm.earningsMode='offline';raw.farm.research.comfy_nests--;
 Object.assign(raw.plan,{solverVersion:2,strategy:'user',autoSequence:false,sequence:'C I C',maxShifts:2,maxSwitches:2,target:101,eventTimezone:'America/Los_Angeles',sleep:{enabled:false,start:'23:00',end:'07:00'},start:Date.parse('2026-10-29T01:30:00Z')/1000,ships:{mode:'none'}});
 const route=R.routes(raw)[0],{s,c}=R.prepare(raw,route,3);let n=S.advance(s,c,Date.parse('2026-10-30T16:00:00Z')/1000,'Preserve the proposed research sale',true,'offline');n=S.buy(n,c,{type:'research',i:S.RMAP.comfy_nests});n=L.finishHere(n,c);
 const actions=S.history(n).map((a,i)=>i?a:{...a,routeSearch:{version:2,sequence:route,researchSales:3},initialSiloRule:'one'});
 return {version:1,config:raw,result:{version:1,solverVersion:2,initialSiloRule:'one',start:c.start,end:n.t,seconds:n.t-c.start,switches:n.stage,target:c.target,actions,frontier:[],explored:0,method:'Synthetic 24-hour display fixture',termination:'complete',researchDeadline:c.researchDeadline,actualResearchSales:1,soulCost:n.lost,finalTE:S.teByEgg(n,c),pendingTE:S.totalTE(n,c)-c.claimedTotal,finalCash:n.cash,finalStats:S.stats(n,c)}};
}
async function run(){
 const vc=new VirtualConsole(),errors=[];vc.on('jsdomError',e=>{if(!/Not implemented: (navigation|HTMLCanvasElement)/.test(e.message))errors.push(e.message);});
 const dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window;
 w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.fetch=async()=>({ok:true,json:async()=>({version:require('../package.json').version,configured:false})});w.addEventListener('error',e=>errors.push(e.error?.message||e.message));
 const css=w.document.createElement('style');css.textContent=fs.readFileSync(root+'/style.css','utf8');w.document.head.append(css);
 try{
  w.eval(fs.readFileSync(root+'/worker-source.js','utf8'));w.eval(fs.readFileSync(root+'/app.js','utf8'));const app=w.VirtueApp,$=id=>w.document.getElementById(id),doc=fixture();
  await app.loadFile({text:async()=>JSON.stringify(doc)},{planOnly:true});assert.ok(app.getResult());assert.ok(!$('notice').classList.contains('error'),$('notice').textContent);
  const breaks=[...w.document.querySelectorAll('.guide-break')];assert.ok(breaks.length);
  for(const box of breaks){assert.match(box.children[1].textContent,/^Starts /);assert.ok(box.children[2].classList.contains('guide-resume'));assert.ok(Number(w.getComputedStyle(box.children[2]).fontWeight)>=600,'Resume remains bold');assert.ok(!/\b(?:AM|PM)\b/.test(box.textContent));}
  assert.match(breaks[0].children[1].textContent,/18:30:00 PDT/);assert.match(breaks[0].children[2].textContent,/09:00:00 PDT/);
  for(const node of w.document.querySelectorAll('#result-content time,.plan-start,.plan-end'))assert.ok(!/\b(?:AM|PM)\b/.test(node.textContent),'all rendered timeline clock times use 24 hours');
  assert.match($('start').value,/^\d{4}-\d\d-\d\d \d\d:\d\d$/);for(const id of ['start','sleepStart','sleepEnd'])assert.equal($(id).type,'text','native locale cannot force AM/PM on '+id);
  $('start').click();const dialog=$('date-picker'),date=dialog.querySelector('[type="date"]'),time=dialog.querySelector('[data-time]');assert.ok(dialog.open);time.value='24:00';dialog.querySelector('[data-ok]').click();assert.ok(dialog.open,'invalid 24:00 is not accepted');time.value='23:15';dialog.querySelector('[data-ok]').click();assert.ok(!dialog.open);assert.equal($('start').value,date.value+' 23:15');assert.equal(app.getConfig().plan.start,D.parseLocal(date.value+' 23:15'));
  const pdf=await Q.create(doc.config,doc.result);assert.ok(pdf.length>1000);fs.mkdirSync(root+'/tmp',{recursive:true});fs.writeFileSync(root+'/tmp/time-display-qa.pdf',pdf);
  assert.deepEqual(errors,[]);console.log('PASS built 24-hour UI: summary/timeline/break dates, Starts before bold Resume, duration retained, local and sleep inputs, picker validation/commit, and walkthrough PDF generation.');
 }finally{dom.window.close();}
}
module.exports={run,fixture};if(require.main===module)run().catch(e=>{console.error(e.stack);process.exitCode=1;});
