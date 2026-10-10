'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),blank=require('../src/blank-farm.cjs'),S=require('../src/simulator.cjs'),A=require('../src/api.cjs');
const root=path.resolve(__dirname,'..'),start=Date.now()/1000-3600,eid='EI0000000000000000',token='synthetic-plan-progress';
function fixture(){
 const raw=blank(start);Object.assign(raw.farm,{cash:1e18,soulEggs:1e30,shiftCount:47,claimed:Array(5).fill(5),manualAccountData:true,manualFarmData:true,proPermit:true});
 Object.assign(raw.plan,{target:25,strategy:'auto',autoSequence:true,maxShifts:1,maxSwitches:1,ships:{mode:'none'},sleep:{enabled:false,start:'22:00',end:'06:00'},eventTimezone:'America/New_York'});
 const {s,c}=S.prepare(raw);let state=S.buy(s,c,{type:'research',i:0});state=S.buy(state,c,{type:'research',i:0});state=S.advance(state,c,state.t+60,'Synthetic earning break',true,'offline');state=S.buy(state,c,{type:'research',i:1});
 const result=n=>({version:1,start:c.start,end:n.t,seconds:n.t-c.start,target:25,switches:n.stage,actions:S.history(n),frontier:[],explored:0,method:'Synthetic progress fixture',termination:'complete'});
 const single=result(state),withShift=result(S.buy(state,c,{type:'shift',egg:4}));
 return {raw,saved:{version:1,config:raw,result:single},alternative:{version:1,config:raw,result:{...single,shiftPlans:[{switches:0,plan:single},{switches:1,plan:withShift}],selectedSwitches:0,recommendedSwitches:0,shiftComparisonVersion:1}}};
}
const {raw,saved,alternative}=fixture();
function snapshot(level=1,timestamp=start+100){const f=structuredClone(raw);f.farm.research={[S.D.research[0].id]:level};f.importInfo={scope:'farm',timestamp};return f;}
function backup(active=true,timestamp=start+500){return {userName:'ProgressTester',settings:{lastBackupTime:timestamp},game:{permitLevel:1,soulEggsD:1e30},virtue:{shiftCount:47,eovEarned:Array(5).fill(5),eggsDelivered:Array(5).fill(0)},farms:active?[{eggType:50,habs:[0,19,19,19],vehicles:[0,...Array(16).fill(12)],silosOwned:1,commonResearch:[{id:S.D.research[0].id,level:2}]}]:[{eggType:1}]};}
(async()=>{
 let response=backup(),hold=false,releaseHeld,heldArrived,updateAvailable=false,installed=false;const requestErrors=[];
 const server=http.createServer(async(req,res)=>{
  try{
   if(req.url==='/api/backup'&&req.method==='POST'){
    const chunks=[];for await(const c of req)chunks.push(c);const body=JSON.parse(Buffer.concat(chunks));assert.equal(body.eid,eid);assert.equal(req.headers['x-virtue-token'],token);
    const payload=A.base64(A.Resp.encode(A.Resp.create({backup:response})).finish());if(hold)await new Promise(r=>{releaseHeld=r;heldArrived();});res.setHeader('Content-Type','text/plain');res.end(payload);return;
   }
   if(req.url==='/session.js'){res.setHeader('Content-Type','text/javascript');res.end('globalThis.VIRTUE_PROXY_TOKEN='+JSON.stringify(token));return;}
   if(req.url.startsWith('/api/update/')){if(req.url==='/api/update/install')installed=true;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({version:require('../package.json').version,repository:'example/test',configured:true,available:updateAvailable,pending:false,result:null,job:updateAvailable?{state:installed?'complete':'ready',message:'Ready'}:null}));return;}
   const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html',file=path.join(root,name);
   if(name.includes('..')||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
   res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(name)]||'text/html');res.end(fs.readFileSync(file));
  }catch(e){requestErrors.push(e.message);res.writeHead(500);res.end('Synthetic test failed');}
 });
 await new Promise(r=>server.listen(8786,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR||'',FONTCONFIG_PATH:process.env.CHROMIUM_FONT_DIR||''}});
  const page=await browser.newPage({viewport:{width:1440,height:1000},timezoneId:'America/Los_Angeles'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!globalThis.VirtueApp);
  const load=async doc=>{await page.evaluate(doc=>VirtueApp.loadFile(new File([JSON.stringify(doc)],'Synthetic-Plan.json'),{planOnly:true}),doc);assert.match(await page.locator('#notice').innerText(),/Saved plan loaded and replayed/);};
  const check=async(doc,message='Farm progress checked')=>{
   await page.evaluate(()=>document.getElementById('notice').textContent='');const chooser=page.waitForEvent('filechooser');await page.click('#check-plan-file');await(await chooser).setFiles({name:'Synthetic-Current-Farm.json',mimeType:'application/json',buffer:Buffer.from(typeof doc==='string'?doc:JSON.stringify(doc))});
   await page.waitForFunction(message=>document.getElementById('notice').textContent.includes(message),message);assert.equal(await page.inputValue('#progress-file-input'),'');
  };
  const exportPlan=async()=>{const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save Plan',exact:true}).click();return JSON.parse(fs.readFileSync(await(await pending).path(),'utf8'));};
  const state=()=>page.evaluate(()=>({config:VirtueApp.getConfig(),result:VirtueApp.getResult(),progress:document.getElementById('plan-progress').innerText}));
  await load(saved);assert.ok(await page.locator('#check-plan-file').isVisible());assert.match(await page.locator('#plan-progress').innerText(),/Load a current farm file/);
  const original=await page.evaluate(()=>VirtueApp.getResult());
  await check(snapshot());assert.equal(await page.locator('#plan-progress').getAttribute('data-status'),'matched');assert.match(await page.locator('#plan-progress-status').innerText(),/C1.*0 new shifts/);assert.match(await page.locator('#plan-progress-next').innerText(),/Comfortable Nests 1 → 2/);
  assert.match(await page.locator('#plan-progress').innerText(),/EDT/,'snapshot dates use the saved selected display zone');assert.match(await page.locator('#plan-stale').innerText(),/original plan's schedule/);assert.match(await page.locator('.result-summary h2').innerText(),/Original Plan/);assert.deepEqual(await page.evaluate(()=>VirtueApp.getResult()),original,'checking a farm preserves the original timeline');
  await check(snapshot(2,start+200));assert.match(await page.locator('#plan-progress-next').innerText(),/Synthetic earning break/,'elapsed backup time does not confirm a wait');
  const waitIndex=original.actions.findIndex(a=>a.reason==='Synthetic earning break');
  await page.locator('.progress-checklist>summary').click();assert.match(await page.locator('.progress-checklist').innerText(),/current 2 \/ visit target 2/);
  await page.locator(`[data-progress-index="${waitIndex}"] button`).click();assert.match(await page.locator('#plan-progress-next').innerText(),/Nutritional Supplements 0 → 1/);assert.ok(await page.locator('.progress-checklist').evaluate(n=>n.open));assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Undo Confirmation');
  await page.locator(`[data-progress-index="${waitIndex}"] button`).click();assert.match(await page.locator('#plan-progress-next').innerText(),/Synthetic earning break/);await page.locator(`[data-progress-index="${waitIndex}"] button`).click();
  const exported=await exportPlan();assert.deepEqual(exported.config,raw);assert.equal(exported.progress.snapshot.farm.research[S.D.research[0].id],2);assert.deepEqual(exported.progress.confirmed,[waitIndex]);assert.ok(!JSON.stringify(exported).includes(eid));
  await page.click('#clear-data');assert.equal(await page.evaluate(()=>VirtueApp.getResult()),null);await page.click('#undo-reset');assert.match(await page.locator('#plan-progress-next').innerText(),/Nutritional Supplements/);assert.match(await page.locator('#plan-stale').innerText(),/original plan's schedule/);
  await page.click('#clear-data');await load(exported);assert.deepEqual((await exportPlan()).progress,exported.progress);assert.equal((await page.evaluate(()=>VirtueApp.getConfig())).farm.research[S.D.research[0].id],2);assert.match(await page.locator('#plan-progress-next').innerText(),/Nutritional Supplements/);
  updateAvailable=true;await page.click('#update-app');await page.waitForFunction(()=>!document.getElementById('update-install').disabled);await page.click('#update-install');await page.waitForFunction(()=>document.getElementById('notice').textContent.includes('session was restored after updating'));updateAvailable=false;
  assert.deepEqual((await exportPlan()).progress,exported.progress,'actual update capture and restore retains progress confirmations');assert.match(await page.locator('#plan-progress-next').innerText(),/Nutritional Supplements/);
  const brokenProgress=structuredClone(exported);brokenProgress.progress.snapshot.farm.research[S.D.research[0].id]=999;await load(brokenProgress);assert.match(await page.locator('#notice').innerText(),/Saved progress could not be restored/);assert.match(await page.locator('#plan-progress').innerText(),/Load a current farm file/);await load(exported);
  // Invalid files and older progress cannot replace the last successful comparison.
  const before=await state();await check('{broken','Could not load file:');assert.deepEqual(await state(),before);await check(saved,'Select a current farm file');assert.deepEqual(await state(),before);
  const invalid=snapshot(999,start+300);await check(invalid,'Could not load file:');assert.deepEqual(await state(),before);await check(snapshot(1,start+150),'older than the last progress check');assert.deepEqual(await state(),before);
  const wrong=snapshot(2,start+300);wrong.farm.virtue='kindness';await check(wrong);assert.equal(await page.locator('#plan-progress').getAttribute('data-status'),'mismatch');assert.match(await page.locator('#plan-progress-next').innerText(),/Review the snapshot/);assert.equal(await page.locator('.progress-checklist').count(),0);assert.deepEqual(await page.evaluate(()=>VirtueApp.getResult()),original);
  const undated=snapshot(1);delete undated.importInfo;await check(undated);assert.match(await page.locator('#plan-progress').innerText(),/No snapshot timestamp/);assert.match(await page.locator('#plan-progress-next').innerText(),/1 → 2/);
  // A confirmation belongs to one exact selected plan, including alternatives.
  await load(alternative);await check(snapshot(2));await page.locator('.progress-checklist>summary').click();await page.locator(`[data-progress-index="${waitIndex}"] button`).click();await page.click('[data-shifts="1"]');assert.match(await page.locator('#plan-progress-next').innerText(),/Synthetic earning break/);assert.match(await page.locator('#plan-stale').innerText(),/original plan's schedule/);await page.click('[data-shifts="0"]');assert.match(await page.locator('#plan-progress-next').innerText(),/Nutritional Supplements/);
  await page.click('[data-shifts="1"]');const different=await exportPlan();await load(different);assert.match(await page.locator('#plan-progress-next').innerText(),/Synthetic earning break/);assert.deepEqual((await exportPlan()).progress.confirmed,[]);
  // Real replayed shifts identify C2 even when C1 and C2 are on the same date.
  const repeated=structuredClone(raw);repeated.plan.maxShifts=repeated.plan.maxSwitches=2;const prepared=S.prepare(repeated);let route=S.buy(prepared.s,prepared.c,{type:'shift',egg:4});route=S.buy(route,prepared.c,{type:'shift',egg:0});route=S.afford(route,prepared.c,{type:'research',i:0});route=S.buy(route,prepared.c,{type:'research',i:0});
  const repeatedPlan={version:1,config:repeated,result:{...saved.result,actions:S.history(route),end:route.t,seconds:route.t-start,switches:2}};await load(repeatedPlan);
  const c2=snapshot(0);c2.farm.shiftCount+=2;await check(c2);assert.match(await page.locator('#plan-progress-status').innerText(),/C2.*2 new shifts/);assert.equal(await page.locator('#plan-progress').getAttribute('data-status'),'matched');
  // Account refresh retains the plan and comparisons; an account-only response
  // cannot invent a current farm or overwrite the last confirmed snapshot.
  await load(saved);await check(snapshot());await page.fill('#eid',eid);await page.click('#check-plan-account');await page.waitForFunction(()=>document.getElementById('notice').textContent.includes('Farm progress checked;'));
  assert.match(await page.locator('#plan-progress-next').innerText(),/Synthetic earning break/);assert.deepEqual(await page.evaluate(()=>VirtueApp.getResult()),original);const tracked=(await exportPlan()).progress;
  response=backup(false,start+600);await page.click('#check-plan-account');await page.waitForFunction(()=>document.getElementById('notice').textContent.includes('no current Virtue farm was found'));
  assert.deepEqual((await exportPlan()).progress,tracked);assert.deepEqual(await page.evaluate(()=>VirtueApp.getResult()),original);await check({backup:response},'No current Virtue farm was found');assert.deepEqual((await exportPlan()).progress,tracked);
  // Importing and searching disable snapshot and confirmation controls.
  response=backup(true,start+700);hold=true;const held=new Promise(r=>heldArrived=r);await page.locator('.progress-checklist>summary').click();await page.click('#check-plan-account');await held;
  for(const selector of ['#check-plan-file','#check-plan-account','.progress-checklist button','#load-plan','#optimize'])assert.ok(await page.locator(selector).isDisabled(),selector+' during account import');
  hold=false;releaseHeld();await page.waitForFunction(()=>!document.getElementById('check-plan-account').disabled);assert.ok(await page.locator('#check-plan-file').isEnabled());
  const out=path.join(root,'tmp/plan-progress');fs.mkdirSync(out,{recursive:true});
  for(const width of [1920,1440,1000]){await page.setViewportSize({width,height:1000});await page.locator('.progress-checklist>summary').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow at '+width);await page.locator('#plan-progress').screenshot({path:path.join(out,'progress-'+width+'.png')});await page.locator('.progress-checklist>summary').click();}
  await page.evaluate(()=>{globalThis.Worker=class{postMessage(){}terminate(){}};});await page.click('#optimize');for(const selector of ['#check-plan-file','#check-plan-account','.progress-checklist button'])assert.ok(await page.locator(selector).isDisabled(),selector+' during search');
  const busy=await state();await page.evaluate(doc=>VirtueApp.loadFile(new File([JSON.stringify(doc)],'Busy-Current.json'),{trackOnly:true}),snapshot(2));assert.deepEqual(await state(),busy);assert.match(await page.locator('#notice').innerText(),/Stop or finish/);await page.click('#clear-data');await page.click('#undo-reset');
  // Reset invalidates a delayed file read as well as a delayed account response.
  await page.evaluate(doc=>{globalThis.finishProgressRead=null;globalThis.pendingProgressRead=VirtueApp.loadFile({text:()=>new Promise(r=>{globalThis.finishProgressRead=()=>r(JSON.stringify(doc));})},{trackOnly:true});},snapshot(2,start+800));
  await page.click('#clear-data');await page.evaluate(async()=>{finishProgressRead();await pendingProgressRead;});assert.equal(await page.evaluate(()=>VirtueApp.getResult()),null);assert.match(await page.locator('#notice').innerText(),/Data cleared/);
  await load(saved);await check(snapshot());hold=true;const heldReset=new Promise(r=>heldArrived=r);await page.click('#check-plan-account');await heldReset;await page.click('#clear-data');hold=false;releaseHeld();await page.waitForFunction(()=>!document.getElementById('eid').disabled);assert.equal(await page.evaluate(()=>VirtueApp.getResult()),null);
  assert.deepEqual(errors,[]);assert.deepEqual(requestErrors,[]);
  console.log('PASS saved-plan progress browser flow: current file/account, partial research, repeated C visits, original timeline/dates, manual confirm/undo/focus, save/load/reset/update recovery, alternate isolation, malformed/stale/mismatched snapshots, no-active-farm handling, busy/reset guards, and desktop layouts.');
 }finally{releaseHeld?.();await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
