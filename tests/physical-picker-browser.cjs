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
    const farm=blank(Date.parse("2026-10-07T16:00:23Z")/1000);
    Object.assign(farm.farm,{cash:0,claimed:Array(5).fill(5),manualFarmData:true,manualAccountData:true});
    Object.assign(farm.plan,{target:25,strategy:"user",autoSequence:false,maxSwitches:0,sequence:["curiosity"]});
    const load=async raw=>{await page.evaluate(raw=>VirtueApp.loadFile(new File([JSON.stringify(raw)],"Synthetic-Physical.json")),raw);await page.click('[data-tab="farm"]');};
    await load(farm);
    const initial=await page.evaluate(()=>VirtueApp.getConfig());
    const out=path.join(root,"tmp/physical-picker");fs.mkdirSync(out,{recursive:true});
    for(const kind of ["hab","vehicle"]){
      await page.click("#pick-"+kind+"-0");
      const items=kind==="hab" ? S.D.habs : S.D.vehicles;
      assert.equal(await page.locator("#gear-picker .farm-choice").count(),items.length);
      for(const item of items){
        const row=page.locator(`#gear-picker [data-item-id="${item.id}"]`);
        assert.ok(await row.locator(`[data-farm-icon="${kind}:${item.id}"]`).isVisible());
        assert.match(await row.innerText(),/gems/);assert.match(await row.innerText(),item.id ? /to afford/ : /Affordable now/);
      }
      await page.getByRole("searchbox",{name:"Filter items"}).fill(kind==="hab" ? "portal" : "hyperloop");
      await page.screenshot({path:path.join(out,kind+"-desktop.png")});
      for(const width of [1440,1050,800,500,390,320]){
        await page.setViewportSize({width,height:1000});
        assert.ok(await page.locator("#gear-picker").evaluate(n=>n.scrollWidth<=n.clientWidth+1));
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      }
      await page.screenshot({path:path.join(out,kind+"-mobile.png")});
      await page.keyboard.press("Escape");assert.equal(await page.evaluate(()=>document.activeElement.id),"pick-"+kind+"-0");
      assert.deepEqual((await page.evaluate(()=>VirtueApp.getConfig())).farm,initial.farm,"cancel/search cannot change farm");
      await page.setViewportSize({width:1440,height:1000});
    }
    const choose=async(kind,id)=>{await page.click("#pick-"+kind+"-0");await page.locator(`#gear-picker [data-item-id="${id}"]`).click();await page.evaluate(()=>VirtueApp.refresh());};
    await choose("hab","18");await choose("vehicle","11");
    assert.equal(await page.inputValue("#hab-0"),"18");assert.equal(await page.inputValue("#vehicle-0"),"11");
    assert.ok(await page.locator("#cars-0").isVisible());await page.fill("#cars-0","3");await page.evaluate(()=>VirtueApp.refresh());
    await page.click("#pick-vehicle-0");assert.match(await page.locator('#gear-picker [data-item-id="11"]').innerText(),/3 cars/);await page.keyboard.press("Escape");
    assert.equal((await page.locator("#pick-hab-0 .farm-icon").boundingBox()).width,42);
    const vehicleSize=await page.locator("#pick-vehicle-0 .farm-icon").boundingBox();assert.ok([18,36].includes(vehicleSize.width));
    await page.uncheck("#manualFarmData");assert.ok(await page.locator("#pick-hab-0").isDisabled());assert.ok(await page.locator("#pick-vehicle-0").isDisabled());await page.check("#manualFarmData");
    const saved=await page.evaluate(()=>VirtueApp.getConfig());await load(saved);assert.deepEqual((await page.evaluate(()=>VirtueApp.getConfig())).farm,saved.farm);
    assert.deepEqual(await page.locator("#fuel-fields input").evaluateAll(ns=>ns.map(n=>n.id)),["fuel-curiosity","fuel-kindness","fuel-integrity","fuel-resilience","fuel-humility"]);
    assert.deepEqual(await page.locator("#progress-body tr input:first-child").evaluateAll(ns=>ns.map(n=>n.id)).then(ns=>ns.filter(n=>n.startsWith("claimed"))),["claimed-0","claimed-4","claimed-1","claimed-3","claimed-2"]);
    const fuelBoxes=await page.locator("#fuel-fields>label").evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().toJSON()));
    assert.ok(fuelBoxes.every((box,i)=>i===0 || box.top>=fuelBoxes[i-1].bottom));
    const update=await page.locator("#update-app").boundingBox();assert.ok(update.y+update.height>=960,"Update button at sidebar bottom");
    await page.click('[data-tab="account"]');await page.locator("#account-data-card").screenshot({path:path.join(out,"account-desktop.png")});
    await page.click('[data-tab="planning"]');
    const before=await page.inputValue("#start"),timestamp=(await page.evaluate(()=>VirtueApp.getConfig())).plan.start;
    await page.click(".date-picker-launch");assert.ok(await page.locator("#date-picker").isVisible());
    await page.getByRole("button",{name:"Ok",exact:true}).click();assert.equal((await page.evaluate(()=>VirtueApp.getConfig())).plan.start,timestamp,"unchanged minute preserves saved seconds");
    await page.click("#start");await page.getByLabel("Start date",{exact:true}).fill("2026-10-09");await page.getByLabel("Start time",{exact:true}).fill("13:45");
    await page.getByRole("button",{name:"Cancel",exact:true}).click();assert.equal(await page.inputValue("#start"),before);assert.equal(await page.evaluate(()=>document.activeElement.id),"start");
    await page.click(".date-picker-launch");await page.getByLabel("Start date",{exact:true}).fill("2026-10-09");await page.getByLabel("Start time",{exact:true}).fill("13:45");
    await page.screenshot({path:path.join(out,"date-desktop.png")});
    await page.setViewportSize({width:320,height:600});assert.ok(await page.locator("#date-picker").evaluate(n=>n.scrollWidth<=n.clientWidth+1));await page.screenshot({path:path.join(out,"date-mobile.png")});
    await page.getByRole("button",{name:"Ok",exact:true}).click();assert.equal(await page.inputValue("#start"),"2026-10-09T13:45");
    assert.equal((await page.evaluate(()=>VirtueApp.getConfig())).plan.start,await page.evaluate(()=>new Date("2026-10-09T13:45").getTime()/1000));
    await page.click(".date-picker-launch");await page.getByLabel("Start date",{exact:true}).fill("");await page.getByRole("button",{name:"Ok",exact:true}).click();assert.ok(await page.locator("#date-picker").isVisible());await page.keyboard.press("Escape");
    assert.deepEqual(errors,[]);console.log('PASS hab/vehicle visual choices and metadata, size reduction, Hyperloop cars, cancel/focus/locks/save, C K I R H vertical fuel/progress, bottom sidebar and date OK/cancel/validation/precision, 1440–320px.');
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
