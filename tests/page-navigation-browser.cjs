"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), http = require("node:http");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const blank = require("../src/blank-farm.cjs"), S = require("../src/simulator.cjs"), A = require("../src/api.cjs");
const root = path.resolve(__dirname, "..");
(async () => {
  let syncBackup, syncPosts = 0;
  const server = http.createServer(async (req, res) => {
    if (req.url === "/session.js") { res.setHeader("Content-Type", "text/javascript"); res.end('globalThis.VIRTUE_PROXY_TOKEN="synthetic-navigation";'); return; }
    if (req.url === "/api/backup" && req.method === "POST") {
      const chunks=[]; for await (const chunk of req) chunks.push(chunk);
      const request=JSON.parse(Buffer.concat(chunks));
      if (request.eid !== "EI0000000000000000" || req.headers["x-virtue-token"] !== "synthetic-navigation") {res.writeHead(400);res.end("Invalid synthetic request");return;}
      syncPosts++; res.end(A.base64(A.Resp.encode(A.Resp.create({backup:syncBackup})).finish())); return;
    }
    const name = new URL(req.url, "http://localhost").pathname.slice(1) || "index.html";
    if (name.includes("..") || !fs.existsSync(path.join(root, name))) { res.writeHead(404); res.end(); return; }
    res.setHeader("Content-Type", ({ ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp" })[path.extname(name)] || "text/html");
    res.end(fs.readFileSync(path.join(root, name)));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve)); let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"], env: { ...process.env, LD_LIBRARY_PATH: process.env.CHROMIUM_LIB_DIR || "", FONTCONFIG_PATH: process.env.CHROMIUM_FONT_DIR || "" } });
    const page = await browser.newPage({timezoneId:"Europe/Berlin", viewport: { width: 1440, height: 1000 } }), errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto("http://127.0.0.1:" + server.address().port); await page.waitForFunction(() => !!globalThis.VirtueApp);
    const load = raw => page.evaluate(raw => VirtueApp.loadFile(new File([JSON.stringify(raw)], "Synthetic-Navigation.json")), raw);
    const navigate=async name=>page.click(`[data-tab="${name}"]`);
    assert.equal(await page.locator("#page-title").innerText(),"Account");
    assert.deepEqual(await page.locator("nav [data-tab]").allTextContents(),["Account","Virtue Farm","Planning","Purchase Timeline","How It Works"]);
    assert.ok(await page.locator("#eid").isVisible());assert.ok(await page.locator("#account-data-card").isVisible());assert.ok(await page.locator("#starting-farm-card").isHidden());
    assert.equal((await page.evaluate(()=>VirtueApp.getConfig())).plan.target,40);
    await page.check("#manualAccountData");await page.fill("#claimed-0","5");assert.equal((await page.evaluate(()=>VirtueApp.getConfig())).plan.target,45);
    await page.getByRole("button",{name:"Continue to Virtue Farm",exact:true}).click();
    assert.equal(await page.locator("#page-title").innerText(),"Virtue Farm");
    for(const id of ["starting-farm-card","hab-fields","vehicle-fields","artifacts-card","common-research-card","account-fuel-fields","flight-status"]) assert.ok(await page.locator("#"+id).isVisible(),id);
    assert.ok(await page.locator("aside #eid").isVisible());assert.ok(await page.locator("#truth-egg-progress").isHidden());
    assert.ok(await page.locator("#common-research-details").evaluate(n=>n.open));
    assert.ok(await page.locator("#current-loadout-fields").isVisible());assert.ok(await page.locator("#earnings-loadout-fields").isHidden());assert.ok(await page.locator("#delivery-loadout-fields").isHidden());
    const beforeTabs=await page.evaluate(()=>VirtueApp.getConfig());
    await page.locator("#loadout-tab-current").focus();await page.keyboard.press("ArrowRight");assert.equal(await page.evaluate(()=>document.activeElement.id),"loadout-tab-earnings");assert.ok(await page.locator("#earnings-loadout-fields").isVisible());
    await page.keyboard.press("End");assert.ok(await page.locator("#earnings-loadout-fields").isVisible());await page.keyboard.press("Home");assert.ok(await page.locator("#current-loadout-fields").isVisible());
    assert.deepEqual(await page.evaluate(()=>VirtueApp.getConfig()),beforeTabs);
    await page.getByRole("button",{name:"Continue to Planning",exact:true}).click();assert.equal(await page.locator("#page-title").innerText(),"Planning");
    assert.ok(await page.locator("#planning-card").isVisible());await page.click("#review-farm");assert.equal(await page.locator("#page-title").innerText(),"Virtue Farm");
    const farm=blank(1791300623);Object.assign(farm.farm,{cash:1.23456789e12,soulEggs:1e20,claimed:Array(5).fill(5),delivered:Array(5).fill(S.D.te[5]),proPermit:true,manualFarmData:true,manualAccountData:true});
    Object.assign(farm.plan,{target:45,maxSwitches:12,strategy:"user",autoSequence:false,sequence:["curiosity","kindness","integrity","curiosity","kindness","resilience","curiosity","humility","kindness","curiosity","integrity","resilience","humility"],floors:Array(5).fill(0),minOfflineMinutes:15});
    const artifacts=S.D.artifacts.filter(a=>a.slots>0),stone=S.D.stones[0].id;
    farm.farm.loadouts=Object.fromEntries(["current","earnings","delivery"].map((key,i)=>[key,[{artifactId:artifacts[i].id,stones:Array(artifacts[i].slots).fill(stone)}]]));
    await load(farm);assert.equal(await page.locator("#page-title").innerText(),"Account");
    await navigate("planning");await page.fill("#target","46");await page.click("#add-ship-1");await page.click("#copy-ships");
    const plan=(await page.evaluate(()=>VirtueApp.getConfig())).plan;assert.equal(plan.ships.visits[0].missions.length,1);
    await page.click("#review-farm");await page.fill("#cash","1.564Q");await page.evaluate(()=>VirtueApp.refresh());
    await page.click("#loadout-tab-earnings");
    const alternatives=(await page.evaluate(()=>VirtueApp.getConfig())).farm.loadouts;
    for(const key of ["earnings"]){await page.click("#loadout-tab-"+key);await page.click("#copy-"+key);const f=(await page.evaluate(()=>VirtueApp.getConfig())).farm;assert.deepEqual(f.loadouts.current,alternatives[key]);assert.deepEqual(f.loadouts.earnings,alternatives.earnings);assert.deepEqual(f.loadouts.delivery,alternatives.delivery);assert.equal(f.activeSet,"current");assert.ok(await page.locator("#current-loadout-fields").isVisible());}
    const savedDownload=page.waitForEvent("download");await page.click("#save-file");const download=await savedDownload,saved=JSON.parse(fs.readFileSync(await download.path(),"utf8"));assert.equal(saved.farm.cash,1.564e18);assert.deepEqual(saved.plan,plan);
    await load(saved);assert.deepEqual((await page.evaluate(()=>VirtueApp.getConfig())).farm,saved.farm);assert.deepEqual((await page.evaluate(()=>VirtueApp.getConfig())).plan,saved.plan);
    // Validation navigates to the correct page, hidden artifact tab and collapsed research.
    await navigate("farm");await page.selectOption("#artifact-delivery-1",saved.farm.loadouts.delivery[0].artifactId,{force:true});await page.evaluate(()=>VirtueApp.refresh());await navigate("account");await page.click("#review-inputs");assert.equal(await page.locator("#page-title").innerText(),"Virtue Farm");assert.ok(await page.locator("#delivery-loadout-fields").isVisible());assert.equal(await page.evaluate(()=>document.activeElement.id),"pick-artifact-delivery-1");
    await page.selectOption("#artifact-delivery-1","",{force:true});await page.evaluate(()=>VirtueApp.refresh());
    await page.evaluate(()=>{document.getElementById("research-comfy_nests").value="999";VirtueApp.refresh();});await navigate("account");await page.click("#review-inputs");assert.ok(await page.locator("#common-research-details").evaluate(n=>n.open));assert.equal(await page.evaluate(()=>document.activeElement.id),"research-comfy_nests");await page.fill("#research-comfy_nests","0");await page.evaluate(()=>VirtueApp.refresh());
    await navigate("account");await page.uncheck("#manualAccountData");await navigate("farm");assert.ok(await page.locator("#fuel-curiosity").isDisabled());await page.check("#manualAccountFuel");assert.ok(await page.locator("#fuel-curiosity").isEnabled());await navigate("account");assert.ok(await page.isChecked("#manualAccountData"));
    await navigate("farm");await page.click("#loadout-tab-earnings");const beforeReset=await page.evaluate(()=>VirtueApp.getConfig());await page.click("#clear-data");assert.equal(await page.locator("#page-title").innerText(),"Account");await page.click("#undo-reset");assert.equal(await page.locator("#page-title").innerText(),"Virtue Farm");assert.equal(await page.locator("#loadout-tab-earnings").getAttribute("aria-selected"),"true");assert.deepEqual(await page.evaluate(()=>VirtueApp.getConfig()),beforeReset);
    // Legacy update page names still route to the integrated controls.
    await page.evaluate(()=>VirtueApp.tab("research"));assert.equal(await page.locator("#page-title").innerText(),"Virtue Farm");assert.ok(await page.locator("#common-research-details").evaluate(n=>n.open));await page.evaluate(()=>VirtueApp.tab("artifacts"));assert.ok(await page.locator("#artifacts-card").isVisible());
    assert.ok(await page.locator("#review-inputs").isHidden(),"valid farm and missions before visual/layout checks");
    await page.evaluate(()=>{document.getElementById("common-research-details").open=false;document.getElementById("col-details").open=false;document.getElementById("epic-details").open=false;});
    const out=path.join(root,"tmp/page-navigation");fs.mkdirSync(out,{recursive:true});
    for(const section of ["account","farm","planning"]){await navigate(section);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,section+"-desktop.png"),fullPage:true});}
    for(const width of [1440,1280,1050,1000]){await page.setViewportSize({width,height:1000});let headerBox;for(const section of ["account","farm","planning","results","help"]){await navigate(section);const box=await page.locator("main>header").boundingBox();if(headerBox){assert.ok(Math.abs(box.y-headerBox.y)<1 && Math.abs(box.height-headerBox.height)<1,"consistent header on "+section);}else headerBox=box;assert.ok(await page.locator("aside #eid").isVisible());const eidBox=await page.locator("#eid").boundingBox(),menuBox=await page.locator("nav button").first().boundingBox();assert.equal(await page.locator("#import-eid").count(),0);assert.ok(Math.abs(eidBox.x-menuBox.x)<1 && Math.abs(eidBox.width-menuBox.width)<1,"input matches menu width");assert.equal(await page.locator("#eid").evaluate(n=>getComputedStyle(n).fontSize),await page.locator("nav button").first().evaluate(n=>getComputedStyle(n).fontSize));assert.ok((await page.locator(".sidebar-account").boundingBox()).y+(await page.locator(".sidebar-account").boundingBox()).height<=(await page.getByRole("navigation", {name:"App sections"}).boundingBox()).y,"import above page menu");assert.equal(await page.locator("main>header .import-controls,main>header time").count(),0);assert.ok((await page.locator("#update-app").boundingBox()).y+40>=960);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),section+" overflow "+width);if(["account","farm","planning"].includes(section)&&width>=1050)assert.ok(await page.locator(`[data-page="${section}"] .farm-workspace`).evaluate(n=>n.children[0].getBoundingClientRect().right<=n.children[1].getBoundingClientRect().left+1));}}
    for(const section of ["account","farm"]){await navigate(section);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,section+"-small-desktop.png"),fullPage:true});}
    // Import still uses the real protobuf/API path and preserves identity preferences.
    await page.setViewportSize({width:1440,height:1000});await page.click("#clear-data");
    syncBackup={userName:"SyntheticTester",game:{soulEggsD:1e20,permitLevel:1,epicResearch:S.D.epic.map(r=>({id:r.id,level:r.levels}))},virtue:{eovEarned:Array(5).fill(5),eggsDelivered:Array(5).fill(S.D.te[5]),shiftCount:0,afx:{}},settings:{lastBackupTime:1791300600},artifactsDb:{missionInfos:[],virtueAfxDb:{inventoryItems:[],activeArtifacts:{slots:[]}}},contracts:{archive:[]},farms:[{eggType:50,unclaimedCash:1e12,habs:[0,19,19,19],vehicles:[0],silosOwned:1}]};
    await navigate("planning");
    await page.fill("#eid","EI0000000000000000");await page.press("#eid","Enter");await page.waitForFunction(()=>document.getElementById("notice").textContent.startsWith("Account information and the current Virtue farm"));assert.equal(syncPosts,1);assert.equal(await page.inputValue("#eid"),"SyntheticTester");assert.equal((await page.evaluate(()=>VirtueApp.getConfig())).plan.target,65);assert.equal(await page.inputValue("#epic-hold_to_research"),"20");
    assert.equal(await page.locator("#page-title").innerText(),"Planning");assert.ok(await page.locator("aside #import-backup-time").isVisible());assert.doesNotMatch(await page.locator("#import-backup").innerText(),/backup|\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),|\d{2}:\d{2}:\d{2}/i);await navigate("account");
    await page.screenshot({path:path.join(out,"sidebar-import-desktop.png")});
    await page.click("#optimize");assert.equal(await page.locator("#page-title").innerText(),"Virtue Farm");assert.ok(await page.locator("#pick-vehicle-0").isVisible());assert.ok(await page.locator("#pick-artifact-current-0").isDisabled());await page.click("#optimize");assert.equal(await page.locator("#page-title").innerText(),"Planning");
    await page.reload();await page.waitForFunction(()=>!!globalThis.VirtueApp);assert.equal(await page.locator("#page-title").innerText(),"Account");assert.equal(await page.inputValue("#eid"),"SyntheticTester");await page.locator("#eid").focus();assert.equal(await page.inputValue("#eid"),"EI0000000000000000");
    assert.deepEqual(errors, []);
    console.log("PASS Account → Virtue Farm → Planning, integrated panel locations, keyboard loadout tabs, unchanged goals/gear/precision, copies and save/load, cross-page validation, research disclosure, linked fuel locks, Reset/Undo tab state, legacy page routing, real EID/protobuf import and persistent identity, 1440–1000px paired-column layouts.");
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
