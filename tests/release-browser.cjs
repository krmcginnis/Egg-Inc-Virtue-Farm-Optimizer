'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium}=require('playwright-core'),S=require('../src/simulator.cjs'),R=require('../src/route-solver.cjs'),C=require('../src/plan-continuation.cjs'),Plans=require('../src/shift-plans.cjs');
const project=path.resolve(__dirname,'..'),args=process.argv.slice(2),argument=name=>{const i=args.indexOf(name);return i>=0?args[i+1]:undefined;};
let root=argument('--app-root')||process.env.RELEASE_APP_ROOT;
if(!root){const p=require('node:child_process').spawnSync(process.platform==='win32'?'python':'python3',['scripts/release-verify.py','--candidate','--extract','tmp/browser-candidate'],{cwd:project,encoding:'utf8'});if(p.status!==0)throw Error(p.stderr||p.stdout);root=JSON.parse(fs.readFileSync(project+'/tmp/release-candidate.json')).appRoot;}
root=path.resolve(root);
const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version;
const reportPath=path.resolve(argument('--report')||project+'/tmp/release-browser.json');
const report={schema:1,passed:false,sourceCommit:process.env.GITHUB_SHA||require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:project,encoding:'utf8'}).trim(),appSha256:require('crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'app.js'))).digest('hex'),workerSha256:require('crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'worker-source.js'))).digest('hex')};
fs.mkdirSync(path.dirname(reportPath),{recursive:true});
function previewPlans(raw){
 const route=['curiosity','kindness','integrity','curiosity','kindness','resilience','curiosity','humility','kindness','curiosity','resilience','humility','integrity','humility'];
 return Plans.create([[13,11870000],[12,11892579],[11,11892619]].map(([switches,seconds])=>{
  const sequence=route.slice(0,switches+1),{s,c}=R.prepare(raw,sequence,3);let n=s;
  for(const egg of sequence.slice(1))n=S.buy(n,c,{type:'shift',egg:S.EGGS.indexOf(egg)});
  n=S.advance(n,c,c.start+seconds,'Illustrative preview duration',true,'online');
  const actions=S.history(n).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence,researchSales:3}});
  return {switches,plan:C.verified(raw,{version:1,solverVersion:2,initialSiloRule:'one',target:c.target,start:c.start,end:n.t,seconds:n.t-c.start,switches,actions,frontier:[],explored:0,method:'Illustrative preview plans, not a search benchmark',termination:'complete',researchDeadline:c.researchDeadline,actualResearchSales:0})};
 }),12);
}
(async()=>{
 const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
  if(name.startsWith('api/update/')){res.setHeader('content-type','application/json');return res.end(JSON.stringify({version,configured:false}));}
  const file=path.join(root,name);if(name.includes('..')||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('content-type',({'.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'text/html');res.end(fs.readFileSync(file));
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{channel:'chrome'}),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});report.browser=browser.version();
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!globalThis.VirtueApp);
  const raw=require('../tests/plan-choices-dom.cjs').fixture().config;raw.plan.maxShifts=12;raw.runShifts=require('../src/run-shifts.cjs').create(raw,0,12);
  await page.evaluate(raw=>VirtueApp.loadFile(new File([JSON.stringify(raw)],'Synthetic-Farm.json')),raw);
  await page.evaluate(()=>{
   const Native=Worker;window.searchWorkers=[];window.checkWorkers=0;
   window.Worker=class{constructor(url){if(searchWorkers.length>=4){checkWorkers++;return new Native(url);}this.messages=[];searchWorkers.push(this);}postMessage(m){this.messages.push(m);}terminate(){}};
   VirtueApp.tab('planning');document.getElementById('optimize').click();
  });
  const requested=await page.evaluate(()=>searchWorkers[0].messages[0].config),result=previewPlans(requested);
  await page.evaluate(result=>{for(const w of searchWorkers)w.onmessage({data:{type:'result',result}});},result);
  await page.waitForFunction(()=>VirtueApp.getResult()?.purchaseEvaluation?.status==='complete',{},{timeout:30000});
  assert.equal(await page.evaluate(()=>checkWorkers),3,'actual Blob workers start after search workers finish');
  assert.deepEqual(await page.locator('[data-shifts]').evaluateAll(nodes=>nodes.map(n=>n.dataset.shifts)),['13','12','11']);
  assert.equal(await page.locator('.plan-choice-check').count(),3);
  assert.equal(await page.locator('#verify-purchases').count(),0);
  assert.ok(await page.locator('#search-status').isHidden());
  assert.equal(await page.evaluate(()=>VirtueApp.getResult().selectedSwitches),12);
  assert.equal(await page.locator('.result-summary,.plan-choice-earliest').count(),0);
  assert.equal(await page.locator('.plan-comparison-header #save-plan,.plan-comparison-header .plan-jump').count(),2);
  const delta=(metric,shifts)=>page.locator(`[data-metric="${metric}"][data-plan-shifts="${shifts}"] .plan-metric-delta`);
  assert.match(await delta('seconds',13).innerText(),/^-\d+(?:\.\d+)?%$/);assert.match(await delta('seconds',11).innerText(),/^\+\d+(?:\.\d+)?%$/);
  assert.equal(await page.locator('[data-plan-shifts="12"] .plan-metric-delta').count(),0);assert.equal(await page.locator('.plan-details,.purchase-check,.search-details,.plan-choice-policy,.plan-comparison-scope').count(),0);
  assert.ok((await page.locator('.plan-metric-delta').allTextContents()).every(text=>/^(?:[+-]\d+(?:\.\d+)?|0)%$/.test(text)));
  assert.match(await delta('soul',13).getAttribute('class'),/worse/);assert.match(await delta('soul',11).getAttribute('class'),/better/);
  assert.equal(await delta('seconds',13).evaluate(n=>getComputedStyle(n).color),'rgb(121, 217, 180)');assert.equal(await delta('soul',13).evaluate(n=>getComputedStyle(n).color),'rgb(255, 158, 158)');
  const baselineDeltas=await page.locator('.plan-metric-delta').allTextContents();
  await page.locator('[data-shifts="11"]').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>VirtueApp.getResult().selectedSwitches),11);assert.deepEqual(await page.locator('.plan-metric-delta').allTextContents(),baselineDeltas);
  for(const shifts of ['13','11','12']){await page.locator(`[data-shifts="${shifts}"]`).click();assert.ok(await page.evaluate(()=>VirtueApp.getResult().verification.complete));assert.equal(await page.locator('#verify-purchases').count(),0);}
  assert.equal(await page.locator('.plan-comparison-table thead th').count(),4);assert.equal(await page.locator('.plan-comparison-table tbody tr').count(),6);assert.doesNotMatch(await page.locator('#plan-choices').innerText(),/\b(?:AM|PM)\b/);
  const downloadPromise=page.waitForEvent('download');await page.locator('#save-plan').click();await (await downloadPromise).saveAs(project+'/tmp/release-browser-saved-plan.json');
  const saved=JSON.parse(fs.readFileSync(project+'/tmp/release-browser-saved-plan.json'));assert.ok(saved.result.shiftPlans.every(e=>e.plan.verification.complete));
  const popupPromise=page.waitForEvent('popup');await page.getByRole('button',{name:'Export Walkthrough',exact:true}).click();const popup=await popupPromise;
  await popup.waitForFunction(()=>document.documentElement.dataset.pdfReady==='true',{},{timeout:60000});
  const pdfStart=await popup.evaluate(async()=>Array.from(new Uint8Array(await(await fetch(document.getElementById('save-pdf').href)).arrayBuffer()).slice(0,5)));assert.equal(Buffer.from(pdfStart).toString(),'%PDF-');await popup.close();
  await page.locator('.plan-comparison-header .plan-jump').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'plan-progress-heading');
  await page.evaluate(saved=>VirtueApp.loadFile(new File([JSON.stringify(saved)],'Synthetic-Checked.json'),{planOnly:true}),saved);
  for(const width of [1440,1000,500]){await page.setViewportSize({width,height:1100});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.evaluate(()=>scrollTo(0,0));if(process.env.UI_SCREENSHOT_DIR){fs.mkdirSync(process.env.UI_SCREENSHOT_DIR,{recursive:true});await page.locator('#plan-choices').screenshot({path:path.join(process.env.UI_SCREENSHOT_DIR,'compare-plans-'+width+'.png')});}}
  const fuelDoc=require('./fuel-rounding.cjs').fixture();
  await page.evaluate(doc=>VirtueApp.loadFile(new File([JSON.stringify(doc)],'Synthetic-Fuel.json'),{planOnly:true}),fuelDoc);
  const opening=page.locator('.timeline-group').first();await opening.locator('summary').first().click();
  assert.doesNotMatch(await opening.innerText(),/Store .*Fuel|Discard|Fuel Collection|Fueling/i);
  await opening.locator('.full-breakdown>summary').click();assert.equal(await opening.locator('.action.fuel,.action.fuel-dump').count(),0);
  if(process.env.UI_SCREENSHOT_DIR)await opening.screenshot({path:path.join(process.env.UI_SCREENSHOT_DIR,'fuel-rounding.png')});
  const fuelValues=await page.locator('.guide-item.fuel b').allTextContents();assert.ok(fuelValues.length>0);assert.ok(fuelValues.every(value=>/^\d+T$/.test(value)));
  await page.evaluate(doc=>VirtueApp.loadFile(new File([JSON.stringify({...doc.config,importInfo:{scope:'farm',timestamp:doc.result.start}})],'Synthetic-Current-Fuel.json'),{trackOnly:true}),fuelDoc);
  assert.match(await page.locator('#plan-progress-next').innerText(),/Switch to Humility/i);assert.equal(await page.locator('[data-progress-index="0"],[data-progress-index="1"]').count(),0);
  // Replay recomputes earnings with each engine's Math functions. Compare the
  // exact fuel fields under test, rather than unrelated last-bit earnings.
  const fuelActions=actions=>{
    const rows=actions.filter(a=>['fuel','fuel-dump'].includes(a.type)).map(({type,t,end,egg,amount,removed})=>({type,t,end,egg,amount,removed}));
    return JSON.parse(JSON.stringify(rows));
  };
  const replayed=await page.evaluate(()=>JSON.parse(JSON.stringify(VirtueApp.getResult())));
  assert.deepEqual(fuelActions(replayed.actions),fuelActions(fuelDoc.result.actions),'rounding does not edit recorded fuel amounts or collection times');
  assert.equal(replayed.end,fuelDoc.result.end,'fuel display does not change the plan finish');
  assert.deepEqual(errors,[]);report.passed=true;report.widths=[1440,1000,500];report.liveCheckWorkers=3;report.planOrder=[13,12,11];report.defaultSelected=12;report.fuelRoundingPassed=true;console.log('PASS real Chromium: signed comparison, no N labels/footer/details, colors, moved Save/PDF/Progress actions, keyboard/save/load, real Blob checks, responsive layouts, rounded fuel with no tiny rows/breaks/checklist blockers and immutable recorded amounts.');
 }finally{fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
