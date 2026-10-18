'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),S=require('../src/simulator.cjs'),R=require('../src/route-solver.cjs'),L=require('../src/optimizer-legacy.cjs');
const root=path.resolve(__dirname,'..');
const {verificationFixture:fixture}=require('./search-optimality.cjs');
(async()=>{
 const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html',file=path.join(root,name);if(name.includes('..')||!fs.existsSync(file)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(name)]||'text/html');res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR||'',FONTCONFIG_PATH:process.env.CHROMIUM_FONT_DIR||''}});
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{const Native=globalThis.Worker;globalThis.pauseVerification=true;globalThis.Worker=class extends Native{postMessage(data,...rest){super.postMessage(data,...rest);if(data.verification&&globalThis.pauseVerification){globalThis.pauseVerification=false;super.postMessage({cancel:true});}}};});
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!globalThis.VirtueApp);
  const load=doc=>page.evaluate(doc=>VirtueApp.loadFile(new File([JSON.stringify(doc)],'Synthetic-Verification.json'),{planOnly:true}),doc),source=fixture();
  await load(source);await page.evaluate(()=>VirtueApp.tab('results'));assert.ok(await page.locator('#verify-purchases').isEnabled());
  await page.locator('.search-details>summary').click();assert.match(await page.locator('.optimality-bound').innerText(),/At most.*Global optimality has not been verified/);
  if(!await page.locator('.purchase-check').evaluate(d=>d.open))await page.locator('.purchase-check>summary').click();await page.click('#verify-purchases');await page.waitForFunction(()=>!!VirtueApp.getResult()?.verification,{},{timeout:30000});
  const paused=await page.evaluate(()=>VirtueApp.getResult());assert.equal(paused.verification.complete,false);assert.ok(paused.verification.blocks.some(b=>b.frontier.length));assert.match(await page.locator('#verify-purchases').innerText(),/Continue Purchase Check/);
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Save Plan',exact:true}).click();const saved=JSON.parse(fs.readFileSync(await(await download).path(),'utf8'));assert.deepEqual(saved.result.verification,paused.verification);
  await load(saved);if(!await page.locator('.purchase-check').evaluate(d=>d.open))await page.locator('.purchase-check>summary').click();await page.click('#verify-purchases');await page.waitForFunction(()=>VirtueApp.getResult()?.verification?.complete,{},{timeout:30000});
  const checked=await page.evaluate(()=>VirtueApp.getResult());R.replay(source.config,checked.actions,true);assert.ok(checked.end<=source.result.end);assert.ok(await page.locator('#verify-purchases').isDisabled());assert.match(await page.locator('.purchase-verification').innerText(),/declared purchase blocks checked.*Routes and departure times remain outside/s);
  for(const width of [1440,1000]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  if(process.env.UI_SCREENSHOT){await page.locator('.search-details>summary').click();await page.locator('.result-summary').screenshot({path:process.env.UI_SCREENSHOT});}
  assert.deepEqual(errors,[]);console.log('PASS real browser/worker purchase verification: model gap, immediate pause, saved frontier, load/resume, full replay, scoped completion, and desktop layout.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
