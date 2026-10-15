'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),version=require('../package.json').version;
(async()=>{
 let result={ok:false,version,message:'The update failed; the previous app was restored. Injected restart failure.'},checkError=false,available=false,installed=false,installRequests=0;
 const server=http.createServer((req,res)=>{
  if(req.url.startsWith('/api/update/')){res.setHeader('Content-Type','application/json');const route=req.url.split('/').pop();if(route==='start')installed=false;if(route==='install'){installed=true;installRequests++;}if(route==='acknowledge'){result=null;res.end('{"ok":true}');return}if(route==='check'&&checkError){res.writeHead(409);res.end(JSON.stringify({error:'Injected update check failure.'}));return}res.end(JSON.stringify({version:route==='check'&&available?'9.0.0':version,repository:'example/test',configured:true,available,pending:false,result,job:available?{state:installed?'complete':'ready',message:'Ready'}:null}));return}
  if(req.url==='/session.js'){res.setHeader('Content-Type','text/javascript');res.end("globalThis.VIRTUE_PROXY_TOKEN='test-token';");return}
  const pathname=new URL(req.url,'http://localhost').pathname,file=path.join(root,pathname==='/'?'index.html':pathname);if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404);res.end();return}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));
 });await new Promise(r=>server.listen(8789,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR||'',FONTCONFIG_PATH:process.env.CHROMIUM_FONT_DIR||''}});const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8789');
  await page.waitForFunction(()=>document.getElementById('update-dialog').open&&document.getElementById('update-error-text').textContent.includes('Injected restart failure'));
  const failure=await page.locator('#update-error-text').innerText();await page.click('#update-copy-error');assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),failure);assert.equal(await page.locator('#update-error-text').innerText(),failure);
  await page.click('#update-close');await page.evaluate(()=>VirtueApp.refresh());await page.reload();await page.waitForFunction(()=>!!globalThis.VirtueApp);await page.click('#update-app');await page.waitForFunction(()=>document.getElementById('update-status').textContent.includes('up to date'));assert.equal(await page.locator('#update-error-text').innerText(),failure);assert.ok(await page.locator('#update-error').isVisible());
  await page.click('#update-check');await page.waitForFunction(()=>document.getElementById('update-error').hidden);checkError=true;await page.click('#update-check');await page.waitForFunction(()=>document.getElementById('update-error-text').textContent.includes('Injected update check failure'));await page.click('#update-close');await page.click('#update-app');await page.waitForFunction(()=>!document.getElementById('update-check').disabled);assert.match(await page.locator('#update-error-text').innerText(),/Injected update check failure/);assert.deepEqual(errors,[]);
  console.log('PASS rollback failures stay in the dialog, error copy works, reload/reopen preserve details, and only an explicit retry clears them.');
  available=true;checkError=false;result=null;const blocked=await browser.newContext();await blocked.addInitScript(()=>{IDBFactory.prototype.open=function(){throw Error('Injected database restriction')};for(const name of ['setItem','removeItem']){const original=Storage.prototype[name];Storage.prototype[name]=function(key,...args){if(key==='virtue-optimizer.update-session.v1')throw Error('Injected storage restriction');return original.call(this,key,...args)}}});const restricted=await blocked.newPage(),restrictedErrors=[];restricted.on('pageerror',e=>restrictedErrors.push(e.message));await restricted.goto('http://127.0.0.1:8789');await restricted.waitForFunction(()=>!!globalThis.VirtueApp);await restricted.click('#update-app');await restricted.waitForFunction(()=>!document.getElementById('update-install').disabled);const requestsBeforeFailure=installRequests;await restricted.click('#update-install');await restricted.waitForFunction(()=>document.getElementById('update-error-text').textContent.includes('cannot preserve this session'));assert.ok(await restricted.locator('#update-error').isVisible());assert.equal(installRequests,requestsBeforeFailure,'never install without a committed recovery session');assert.deepEqual(restrictedErrors,[]);await blocked.close();console.log('PASS unavailable browser storage stops installation and retains the actionable error without throwing during cleanup.');
  const handoff=await browser.newContext(),restored=await handoff.newPage();await restored.goto('http://127.0.0.1:8789');await restored.waitForFunction(()=>!!globalThis.VirtueApp);
  const farm=require('../src/blank-farm.cjs')(1791300623);Object.assign(farm.farm,{manualFarmData:true,manualAccountData:true,claimed:Array(5).fill(5),soulEggs:1e20,cash:123456789});farm.plan.target=25;
  await restored.evaluate(raw=>VirtueApp.loadFile(new File([JSON.stringify(raw)],'Synthetic-Handoff.json')),farm);await restored.click('[data-tab="farm"]');await restored.click('#loadout-tab-earnings');const before=await restored.evaluate(()=>VirtueApp.getConfig());
  await restored.click('#update-app');await restored.waitForFunction(()=>!document.getElementById('update-install').disabled);await restored.click('#update-install');
  await restored.waitForFunction(()=>document.getElementById('notice').textContent.includes('session was restored after updating'));
  assert.equal(await restored.locator('#page-title').innerText(),'Virtue Farm');assert.equal(await restored.locator('#loadout-tab-earnings').getAttribute('aria-selected'),'true');assert.deepEqual(await restored.evaluate(()=>VirtueApp.getConfig()),before);
  for(const tab of ['research','artifacts','farm']){await restored.evaluate(({config,tab})=>localStorage.setItem('virtue-optimizer.update-session.v1',JSON.stringify({version:'0.8.9',snapshot:{version:1,savedAt:Date.now()/1000,config,tab,loadoutTab:'delivery'}})),{config:before,tab});await restored.reload();await restored.waitForFunction(()=>document.getElementById('notice').textContent.includes('session was restored after updating'));assert.equal(await restored.locator('#page-title').innerText(),'Virtue Farm');assert.deepEqual(await restored.evaluate(()=>VirtueApp.getConfig()),before);assert.equal(await restored.locator('#loadout-tab-current').getAttribute('aria-selected'),'true');if(tab==='research')assert.ok(await restored.locator('#common-research-details').evaluate(n=>n.open));}
  await handoff.close();console.log('PASS actual browser update capture/reload/restore retains farm and selected artifact tab; legacy research/artifact handoffs route to Virtue Farm.');
  // Exceed the real localStorage quota with a complete replayable plan. The
  // updater must retain the full payload, including comparison metadata.
  const largeContext=await browser.newContext(),large=await largeContext.newPage(),largeErrors=[];
  large.on('pageerror',e=>largeErrors.push(e.message));
  const S=require('../src/simulator.cjs'),prepared=S.prepare(farm);
  let state=S.buy(prepared.s,prepared.c,{type:'research',i:0});state=S.advance(state,prepared.c,state.t+60,'Synthetic break',true,'offline');
  const plan={version:1,config:farm,result:{version:1,actions:S.history(state),start:prepared.c.start,end:state.t,seconds:state.t-prepared.c.start,switches:0,target:25,explored:0,frontier:[],method:'Synthetic large recovery',termination:'complete',recoveryFixture:'complete-session-'.repeat(400000)}};
  await large.goto('http://127.0.0.1:8789');await large.waitForFunction(()=>!!globalThis.VirtueApp);
  await large.evaluate(raw=>VirtueApp.loadFile(new File([JSON.stringify(raw)],'Synthetic-Large-Plan.json'),{planOnly:true}),plan);
  assert.match(await large.locator('#notice').innerText(),/Saved plan loaded and replayed/);
  const beforeLarge=await large.evaluate(()=>({config:VirtueApp.getConfig(),result:VirtueApp.getResult()}));
  assert.ok(JSON.stringify(beforeLarge).length>6*1024*1024);
  assert.ok(await large.evaluate(()=>{try{localStorage.setItem('synthetic-too-large',JSON.stringify(VirtueApp.getResult()));return false;}catch(error){return error.name==='QuotaExceededError';}}),'reproduce the actual localStorage quota failure');
  await large.evaluate(()=>{let i=0;try{for(;i<20;i++)localStorage.setItem('synthetic-fill-'+i,'x'.repeat(512*1024));}catch{};return i;});
  await large.click('#update-app');await large.waitForFunction(()=>!document.getElementById('update-install').disabled);await large.click('#update-install');
  await large.waitForFunction(()=>document.getElementById('notice').textContent.includes('session was restored after updating'));
  assert.deepEqual(await large.evaluate(()=>({config:VirtueApp.getConfig(),result:VirtueApp.getResult()})),beforeLarge,'large farm and complete plan survive restart exactly');
  assert.equal(await large.evaluate(()=>localStorage.getItem('virtue-optimizer.update-session.v1')),null);
  await large.reload();await large.waitForFunction(()=>!!globalThis.VirtueApp);await large.click('#update-app');await large.waitForFunction(()=>!document.getElementById('update-install').disabled);
  assert.equal(await large.evaluate(()=>VirtueApp.getResult()),null,'a consumed database handoff is cleared after successful restoration');
  assert.deepEqual(largeErrors,[]);await largeContext.close();console.log('PASS a plan over 6 MiB restores exactly through IndexedDB with full localStorage, then clears the consumed session.');
  // Smaller sessions can still update when IndexedDB is disabled.
  const fallbackContext=await browser.newContext();await fallbackContext.addInitScript(()=>{IDBFactory.prototype.open=function(){throw Error('Injected database restriction')}});
  const fallback=await fallbackContext.newPage();await fallback.goto('http://127.0.0.1:8789');await fallback.waitForFunction(()=>!!globalThis.VirtueApp);
  await fallback.evaluate(raw=>VirtueApp.loadFile(new File([JSON.stringify(raw)],'Synthetic-Fallback.json')),farm);
  const beforeFallback=await fallback.evaluate(()=>VirtueApp.getConfig());await fallback.click('#update-app');await fallback.waitForFunction(()=>!document.getElementById('update-install').disabled);await fallback.click('#update-install');await fallback.waitForFunction(()=>document.getElementById('notice').textContent.includes('session was restored after updating'));
  assert.deepEqual(await fallback.evaluate(()=>VirtueApp.getConfig()),beforeFallback);await fallbackContext.close();console.log('PASS localStorage fallback restores the session when IndexedDB is unavailable.');
  // A successful write request is not a committed transaction. Abort after
  // request success and refuse the fallback; install must never be submitted.
  const abortContext=await browser.newContext();await abortContext.addInitScript(()=>{
    const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){const request=put.apply(this,args);request.onsuccess=()=>this.transaction.abort();return request;};
    const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,...args){if(key==='virtue-optimizer.update-session.v1')throw Error('Injected fallback restriction');return set.call(this,key,...args);};
  });
  const aborted=await abortContext.newPage();await aborted.goto('http://127.0.0.1:8789');await aborted.waitForFunction(()=>!!globalThis.VirtueApp);await aborted.click('#update-app');await aborted.waitForFunction(()=>!document.getElementById('update-install').disabled);
  const beforeAbort=installRequests;await aborted.click('#update-install');await aborted.waitForFunction(()=>document.getElementById('update-error-text').textContent.includes('cannot preserve this session'));
  assert.equal(installRequests,beforeAbort,'an aborted handoff transaction cannot start installation');await abortContext.close();console.log('PASS aborting the storage transaction after write success blocks installation.');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
