"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),http=require("node:http");
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || "playwright"),blank=require("../src/blank-farm.cjs"),S=require("../src/simulator.cjs"),Defaults=require("../src/ui-defaults.cjs");
const root=path.resolve(__dirname,"..");
(async()=>{
  assert.equal(Defaults.target([98,98,98,98,98]),490);assert.equal(Defaults.target([10,20,30,40,50]),190);assert.equal(Defaults.target([NaN,0,0,0,0]),null);
  const server=http.createServer((req,res)=>{
    const name=new URL(req.url,"http://localhost").pathname.slice(1)||"index.html",file=path.join(root,name);
    if(name.includes("..")||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
    res.setHeader("Content-Type",({".js":"text/javascript",".css":"text/css",".png":"image/png",".webp":"image/webp"})[path.extname(name)]||"text/html");res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR||"",FONTCONFIG_PATH:process.env.CHROMIUM_FONT_DIR||""}});
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on("pageerror",e=>errors.push(e.message));
    const url="http://127.0.0.1:"+server.address().port;
    await page.goto(url);await page.waitForFunction(()=>!!globalThis.VirtueApp);
    const farm=blank(Date.parse("2026-10-07T16:00:00Z")/1000);Object.assign(farm.farm,{claimed:Array(5).fill(5),manualFarmData:true,manualAccountData:true,proPermit:true});Object.assign(farm.plan,{target:25,strategy:"user",autoSequence:false,maxSwitches:0,sequence:["curiosity"]});
    const load=async raw=>{await page.evaluate(raw=>VirtueApp.loadFile(new File([JSON.stringify(raw)],"Synthetic-Gear.json")),raw);await page.evaluate(()=>VirtueApp.tab("artifacts"));};
    await load(farm);
    const choose=async(control,id)=>{await page.click("#pick-"+control);assert.ok(await page.locator("#gear-picker").isVisible());await page.locator(`#gear-picker [data-item-id="${id}"]`).click();await page.waitForFunction(()=>!document.getElementById("gear-picker").open);assert.equal(await page.inputValue("#"+control),id);};
    assert.equal(await page.locator('#current-loadout-fields .loadout-item-artwork').count(),4);
    assert.equal(await page.locator('#current-loadout-fields select:visible').count(),0);
    await choose("artifact-current-0","puzzle-cube-4-3");
    assert.equal(await page.locator('#loadout-card-current-0 .loadout-stone-socket').count(),3);
    assert.equal(await page.evaluate(()=>document.activeElement.id),"pick-artifact-current-0");
    await page.click('#pick-stone-current-0-0');await page.getByRole('searchbox',{name:'Filter items'}).fill('quantum');
    assert.ok(await page.locator('#gear-picker [data-item-id="quantum-stone-4"] img').isVisible());
    await page.locator('#gear-picker [data-item-id="quantum-stone-4"]').click();
    assert.equal(await page.inputValue('#stone-current-0-0'),'quantum-stone-4');
    assert.match(await page.locator('#loadout-card-current-0').innerText(),/\+5% shipping rate/);
    await page.locator('#pick-stone-current-0-0').focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#gear-picker [data-item-id="quantum-stone-4"]').getAttribute('aria-pressed'),'true');
    await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'pick-stone-current-0-0');
    assert.equal(await page.inputValue('#stone-current-0-0'),'quantum-stone-4');
    await choose('stone-current-0-0','');
    for(const id of ['puzzle-cube-4-2','puzzle-cube-4-1','puzzle-cube-1-0','']){
      await choose('artifact-current-0',id);
      assert.equal(await page.locator('#loadout-card-current-0 .loadout-stone-socket').count(),S.AMAP[id]?.slots||0);
    }
    await choose('artifact-current-0','puzzle-cube-4-3');await choose('stone-current-0-0','lunar-stone-4');
    const saved=await page.evaluate(()=>VirtueApp.getConfig());await load(saved);
    assert.deepEqual((await page.evaluate(()=>VirtueApp.getConfig())).farm.loadouts,saved.farm.loadouts);
    await page.uncheck('#manualFarmArtifacts');assert.ok(await page.locator('#pick-artifact-current-0').isDisabled());assert.ok(await page.locator('#pick-stone-current-0-0').isDisabled());
    await page.check('#manualFarmArtifacts');
    // Duplicate families route review to the visible image control, then clearing fixes the error.
    await choose('artifact-current-1','puzzle-cube-1-0');await page.waitForFunction(()=>document.getElementById('notice').textContent.includes('one artifact per family'));
    await page.click('#review-inputs');assert.equal(await page.evaluate(()=>document.activeElement.id),'pick-artifact-current-1');assert.equal(await page.locator('#pick-artifact-current-1').getAttribute('aria-invalid'),'true');
    await choose('artifact-current-1','');await page.waitForFunction(()=>!document.getElementById('pick-artifact-current-1').hasAttribute('aria-invalid'));
    assert.equal(await page.locator('#pick-artifact-current-1').getAttribute('aria-invalid'),null);
    const out=path.join(root,'tmp/visual-gear');fs.mkdirSync(out,{recursive:true});
    await page.locator('#current-loadout-fields').screenshot({path:path.join(out,'current-desktop.png')});
    await page.click('#pick-artifact-current-0');await page.getByRole('searchbox',{name:'Filter items'}).fill('cube');
    await page.screenshot({path:path.join(out,'artifact-popup-desktop.png')});
    for(const width of [1440,1280,1050,1000]){
      await page.setViewportSize({width,height:1000});
      assert.ok(await page.locator('#gear-picker').evaluate(n=>n.scrollWidth<=n.clientWidth+1),'dialog overflow '+width);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow '+width);
      assert.ok(await page.locator('.gear-choice').evaluateAll(ns=>ns.every(n=>n.scrollWidth<=n.clientWidth+1)),'choice overflow '+width);
    }
    await page.screenshot({path:path.join(out,'artifact-popup-small-desktop.png')});await page.keyboard.press('Escape');
    await page.click('#pick-stone-current-0-0');await page.screenshot({path:path.join(out,'stone-popup-small-desktop.png')});await page.keyboard.press('Escape');
    await page.setViewportSize({width:1440,height:1000});await page.click('[data-tab="farm"]');
    await page.locator('header').screenshot({path:path.join(out,'header-desktop.png')});await page.locator('#hab-fields').screenshot({path:path.join(out,'habs-desktop.png')});
    await page.click('[data-tab="account"]');await page.selectOption('#proPermit','false');await page.evaluate(()=>VirtueApp.tab("artifacts"));assert.equal(await page.locator('#current-loadout-fields .loadout-item-artwork').count(),2);
    // Searching/canceling does not dirty an existing replayed plan or change gear.
    const initial=S.prepare(farm),state=S.advance(initial.s,initial.c,initial.s.t+60,'Synthetic offline wait',true,'offline');
    const result={version:1,start:initial.s.t,end:state.t,seconds:60,target:25,actions:S.history(state),frontier:[],explored:0,method:'Synthetic fixture',termination:'complete'};
    await load({version:1,config:farm,result});const beforeSearch=await page.evaluate(()=>VirtueApp.getConfig());const notice=await page.locator('#notice').innerText();
    await page.click('#pick-artifact-current-0');await page.getByRole('searchbox',{name:'Filter items'}).fill('no such gear');
    assert.match(await page.locator('#gear-picker [role="status"]').innerText(),/No matches/);
    for(let i=0;i<6;i++){await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.getElementById('gear-picker').contains(document.activeElement)));}
    await page.keyboard.press('Escape');await page.waitForTimeout(350);
    assert.equal(await page.locator('#notice').innerText(),notice);assert.deepEqual((await page.evaluate(()=>VirtueApp.getConfig())).farm.loadouts,beforeSearch.farm.loadouts);
    await page.click('[data-tab="results"]');await page.click('#next-ascension');
    assert.equal((await page.evaluate(()=>VirtueApp.getConfig())).plan.target,65);
    assert.equal((await page.evaluate(()=>VirtueApp.getConfig())).plan.targetMode,'claimed-plus-40');
    // Zone defaults support IANA zones outside the original three choices and preserve explicit saved zones.
    for(const zone of ['UTC','America/New_York','Asia/Kolkata']){
      const local=await browser.newPage({timezoneId:zone});await local.goto(url);await local.waitForFunction(()=>!!globalThis.VirtueApp);
      const detected=await local.evaluate(()=>Intl.DateTimeFormat().resolvedOptions().timeZone);
      assert.equal(await local.inputValue('#eventTimezone'),'automatic');
      assert.equal((await local.evaluate(()=>VirtueApp.getConfig())).plan.eventTimezone,detected);
      const timezoneCount=await local.locator('#eventTimezone option').count();
      assert.ok(timezoneCount>1&&timezoneCount<=28,'common timezone choices stay compact');
      await local.click('[data-tab="planning"]');await local.selectOption('#eventTimezone','Asia/Kathmandu');await local.evaluate(()=>VirtueApp.refresh());
      assert.equal((await local.evaluate(()=>VirtueApp.getConfig())).plan.eventTimezone,'Asia/Kathmandu');
      await local.selectOption('#eventTimezone','automatic');await local.evaluate(()=>VirtueApp.refresh());
      assert.equal((await local.evaluate(()=>VirtueApp.getConfig())).plan.eventTimezone,detected);
      assert.equal(await local.evaluate(({zone,detected})=>new Intl.DateTimeFormat('en-US',{timeZone:zone,dateStyle:'full',timeStyle:'long'}).format(1791388800000)===new Intl.DateTimeFormat('en-US',{timeZone:detected,dateStyle:'full',timeStyle:'long'}).format(1791388800000),{zone,detected}),true);
      await local.evaluate(raw=>VirtueApp.loadFile(new File([JSON.stringify(raw)],'Saved-Pacific.json')),farm);
      assert.equal(await local.inputValue('#eventTimezone'),'America/Los_Angeles');await local.close();
    }
    const offline=await browser.newPage();await offline.route('http://**/*',r=>r.abort());await offline.route('https://**/*',r=>r.abort());
    await offline.goto('file://'+path.join(root,'index.html'));await offline.waitForFunction(()=>!!globalThis.VirtueApp);await offline.click('[data-tab="farm"]');await offline.check('#manualFarmData');await offline.evaluate(()=>VirtueApp.tab("artifacts"));await offline.click('#pick-artifact-current-0');
    await offline.locator('#gear-picker [data-item-id="puzzle-cube-4-3"]').click();assert.equal(await offline.locator('#loadout-card-current-0 .loadout-stone-socket').count(),3);
    assert.deepEqual(errors,[]);console.log('PASS image artifact/stone choices, 0–3 sockets, rarity/effects, clear/search/cancel, keyboard/focus, manual locks, duplicate-family review, save/load, permit changes, 1440–1000px popups, offline choices, claimed+40 cap and IANA detection/saved-zone retention.');
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
