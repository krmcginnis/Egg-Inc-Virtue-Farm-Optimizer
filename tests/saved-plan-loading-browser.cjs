'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {fixture}=require('./research-sale-plans.cjs'),O=require('../src/optimizer.cjs'),ShiftPlans=require('../src/shift-plans.cjs');
const root=path.resolve(__dirname,'..');
(async()=>{
 const raw=fixture();Object.assign(raw.plan,{solverVersion:2,maxShifts:12,target:105,eventTimezone:'America/Los_Angeles',sleep:{enabled:true,start:'22:00',end:'06:00'}});
 const result=await O.solve(raw,{maxMs:1800,width:4});
 const selected=ShiftPlans.select(result,result.shiftPlans.at(-1).switches),saved={version:1,config:raw,result:selected};
 const server=http.createServer((req,res)=>{
  if(req.url==='/session.js'){res.setHeader('Content-Type','text/javascript');res.end('');return;}
  if(req.url.startsWith('/api/update/')){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({version:require('../package.json').version,pending:false,result:null}));return;}
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html',file=path.join(root,name);
  if(name.includes('..')||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(name)]||'text/html');res.end(fs.readFileSync(file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR||'',FONTCONFIG_PATH:process.env.CHROMIUM_FONT_DIR||''}});
  const page=await browser.newPage({viewport:{width:1440,height:1000},timezoneId:'America/Los_Angeles'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!globalThis.VirtueApp);
  const snapshot=()=>page.evaluate(()=>({config:VirtueApp.getConfig(),result:VirtueApp.getResult()}));
  const load=async(doc,message='Saved plan loaded and replayed.')=>{
   await page.evaluate(()=>document.getElementById('notice').textContent='');
   const chooser=page.waitForEvent('filechooser');await page.click('#load-plan');await(await chooser).setFiles({name:'Synthetic-Saved-Plan.json',mimeType:'application/json',buffer:Buffer.from(typeof doc==='string'?doc:JSON.stringify(doc))});
   await page.waitForFunction(message=>document.getElementById('notice').textContent.includes(message),message);
   assert.equal(await page.inputValue('#plan-file-input'),'','file picker permits loading the same file again');
  };
  assert.ok(await page.locator('#load-plan').isVisible());assert.equal(await page.evaluate(()=>VirtueApp.getResult()),null);
  await load(saved);assert.equal(await page.locator('#page-title').innerText(),'Purchase Timeline');
  let loaded=await page.evaluate(()=>VirtueApp.getResult());assert.equal(loaded.end,selected.end);assert.equal(loaded.selectedSwitches,selected.selectedSwitches);assert.equal(loaded.shiftPlans.length,result.shiftPlans.length);assert.equal(loaded.validatedReplay,true);
  const config=await page.evaluate(()=>VirtueApp.getConfig());assert.equal(config.plan.start,raw.plan.start);assert.deepEqual(config.plan.sleep,raw.plan.sleep);assert.equal(config.plan.eventTimezone,raw.plan.eventTimezone);assert.ok(await page.locator('#plan-stale').isHidden());
  for(const entry of loaded.shiftPlans){await page.click(`[data-shifts="${entry.switches}"]`);assert.equal((await page.evaluate(()=>VirtueApp.getResult())).end,entry.plan.end);}
  await page.click(`[data-shifts="${selected.selectedSwitches}"]`);
  // Save the selected alternative, replace it with a fresh farm, and restore
  // through the actual Load Plan file picker.
  const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Save Plan',exact:true}).click();const exported=JSON.parse(fs.readFileSync(await(await downloading).path(),'utf8'));
  await page.click('#clear-data');assert.equal(await page.evaluate(()=>VirtueApp.getResult()),null);await load(exported);assert.equal((await page.evaluate(()=>VirtueApp.getResult())).selectedSwitches,selected.selectedSwitches);
  const before=await snapshot();
  await load(raw,'Select a saved plan JSON');assert.deepEqual(await snapshot(),before);
  await load('{broken json','Could not load file:');assert.deepEqual(await snapshot(),before);
  const corrupt=structuredClone(exported);corrupt.result.shiftPlans[0].plan.actions[0]={type:'research',i:999};
  await load(corrupt,'Could not load file:');assert.deepEqual(await snapshot(),before,'invalid unselected alternatives cannot replace the current plan');
  await load(exported);assert.ok(await page.locator('#plan-stale').isHidden());
  // Single-plan exports and the existing Load Farm entry remain compatible.
  const single={version:1,config:raw,result:result.shiftPlans[0].plan};await load(single);assert.equal(await page.locator('[data-shifts]').count(),0);assert.equal((await page.evaluate(()=>VirtueApp.getResult())).end,single.result.end);
  await page.evaluate(doc=>VirtueApp.loadFile(new File([JSON.stringify(doc)],'Synthetic-Generic-Plan.json')),exported);assert.equal((await page.evaluate(()=>VirtueApp.getResult())).end,exported.result.end);
  const out=path.join(root,'tmp/saved-plan-loading');fs.mkdirSync(out,{recursive:true});
  for(const width of [1920,1440,1000]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow at '+width);assert.ok(await page.locator('#load-plan').isVisible());await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,'loaded-'+width+'.png')});}
  // Hold the worker so both the visible button and programmatic loading can
  // be checked without waiting through a real 90-second search.
  await page.evaluate(()=>{globalThis.Worker=class{postMessage(){}terminate(){}};});await page.click('#optimize');assert.ok(await page.locator('#load-plan').isDisabled());
  const running=await snapshot();await page.evaluate(doc=>VirtueApp.loadFile(new File([JSON.stringify(doc)],'Busy-Plan.json'),{planOnly:true}),single);assert.match(await page.locator('#notice').innerText(),/Stop or finish the current search or account import/);assert.deepEqual(await snapshot(),running);
  await page.click('#clear-data');assert.ok(await page.locator('#load-plan').isEnabled());assert.deepEqual(errors,[]);
  console.log('PASS Load Plan file picker, selected/all alternatives, saved inputs/sleep/dates, save/reset/load round trip, repeated selection, single plans, Load Farm compatibility, atomic wrong/corrupt files, search guards, and desktop layouts.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
