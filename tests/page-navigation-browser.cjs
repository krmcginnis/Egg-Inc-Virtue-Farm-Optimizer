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
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto("http://127.0.0.1:" + server.address().port); await page.waitForFunction(() => !!globalThis.VirtueApp);
    const load = raw => page.evaluate(raw => VirtueApp.loadFile(new File([JSON.stringify(raw)], "Synthetic-Navigation.json")), raw);
    assert.equal(await page.locator("#page-title").innerText(), "Farm & Account");
    assert.ok(await page.locator("#eid").isVisible()); assert.ok(await page.locator("#account-data-card").isVisible());
    assert.ok(await page.locator("#target").isHidden()); assert.ok(await page.locator("#ship-planning").isHidden()); assert.ok(await page.locator("#assumptions").isHidden());
    assert.deepEqual(await page.locator('nav [data-tab]').allTextContents(), ['Farm & Account','Artifacts','Common Research','Planning','Purchase Timeline','How It Works']);
    assert.equal(await page.locator('.side-note, #import-details, #import-details-summary, #import-note').count(), 0);
    assert.ok(await page.locator('#eid').evaluate(n => n.closest('.page-heading') && n.getBoundingClientRect().top >= document.getElementById('page-title').getBoundingClientRect().bottom));
    // Three review steps keep exact labels and never start a worker.
    await page.getByRole("button", { name: "Continue to Artifacts", exact: true }).click();
    assert.equal(await page.locator("#page-title").innerText(), "Artifacts");
    assert.equal(await page.locator('[data-tab="artifacts"]').innerText(), "Artifacts");
    assert.ok(await page.locator("#loadout-fields").isVisible());
    assert.ok(await page.locator("#search-status").isHidden());
    assert.ok(await page.locator("#copy-earnings").isDisabled());
    assert.ok(await page.locator("#copy-delivery").isDisabled());
    await page.getByRole("button", { name: "Continue to Common Research", exact: true }).click();
    assert.equal(await page.locator("#page-title").innerText(), "Common Research");
    assert.ok(await page.locator("#research-body").isVisible());
    assert.ok(await page.locator("#search-status").isHidden());
    await page.getByRole("button", { name: "Continue to Planning", exact: true }).click();
    assert.equal(await page.locator("#page-title").innerText(), "Planning");
    assert.equal(await page.locator('[data-tab="planning"]').getAttribute("aria-current"), "page");
    assert.ok(await page.locator("#planning-card").isVisible()); assert.ok(await page.locator("#ship-planning").isVisible()); assert.ok(await page.locator("#planning-timing").isVisible()); assert.ok(await page.locator("#assumptions").isVisible());
    assert.ok(await page.locator("#eid").isHidden()); assert.ok(await page.locator("#account-data-card").isHidden()); assert.ok(await page.locator("#search-status").isHidden());
    assert.equal(await page.locator("#planning-backup-time").innerText(), "No Backup Loaded");
    await page.click("#review-farm"); assert.equal(await page.locator("#page-title").innerText(), "Farm & Account");
    const farm = blank(1791300600);
    Object.assign(farm.farm, { cash: 1.23456789e12, soulEggs: 1e20, claimed: Array(5).fill(5), delivered: Array(5).fill(S.D.te[5]), proPermit: true, manualFarmData: true, manualAccountData: true });
    Object.assign(farm.plan, { target: 40, maxSwitches: 12, strategy: "user", autoSequence: false, sequence: ["curiosity", "kindness", "integrity", "curiosity", "kindness", "resilience", "curiosity", "humility", "kindness", "curiosity", "integrity", "resilience", "humility"], c1MaxMinutes: 180, k1MaxMinutes: 240, minOfflineMinutes: 15, maxDays: 210, searchEffort: "quick", floors: [8, 8, 8, 8, 8], shiftSeconds: 12, actionSeconds: 1 });
    await load(farm); await page.click('[data-tab="planning"]');
    assert.match(await page.locator("#planning-virtue").innerText(), /Curiosity/);
    assert.match(await page.locator("#planning-starting-te").innerText(), /25 Claimed\s+\+5 Pending/);
    await page.fill("#target", "45"); await page.fill("#minOfflineMinutes", "20");
    await page.click("#add-ship-1"); await page.click("#copy-ships");
    const configured = await page.evaluate(() => VirtueApp.getConfig());
    assert.equal(configured.plan.target, 45); assert.equal(configured.plan.minOfflineMinutes, 20);
    assert.equal(configured.plan.ships.visits[0].missions.length, 1); assert.equal(configured.plan.ships.visits[1].missions.length, 1);
    await page.click("#review-farm"); await page.fill("#cash", "1.564Q"); await page.evaluate(() => VirtueApp.refresh());
    await page.click('[data-tab="planning"]');
    assert.equal(await page.inputValue("#target"), "45"); assert.equal(await page.inputValue("#c1MaxMinutes"), "180"); assert.equal(await page.inputValue("#k1MaxMinutes"), "240");
    assert.deepEqual((await page.evaluate(() => VirtueApp.getConfig())).plan, configured.plan);
    // Save while Planning is hidden, then reload while account fields are hidden.
    await page.click("#review-farm");
    const savedDownload = page.waitForEvent("download"); await page.click("#save-file");
    const download = await savedDownload, saved = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
    assert.equal(saved.farm.cash, 1.564e18); assert.deepEqual(saved.plan, configured.plan);
    await page.click('[data-tab="planning"]'); await page.fill("#target", "46"); await load(saved); await page.click('[data-tab="planning"]');
    assert.equal(await page.inputValue("#target"), "45"); assert.deepEqual((await page.evaluate(() => VirtueApp.getConfig())).plan, saved.plan);
    // Real backup imports retain planning inputs and clearly distinguish a retained farm.
    const lockedFarm = structuredClone(saved); lockedFarm.farm.manualFarmData = false; delete lockedFarm.uiProvenance;
    await load(lockedFarm);
    const backup = { game: { soulEggsD: 1e20, permitLevel: 1, epicResearch: S.D.epic.map(r => ({ id: r.id, level: r.levels })) }, virtue: { eovEarned: Array(5).fill(5), eggsDelivered: Array(5).fill(S.D.te[5]), shiftCount: 0, afx: {} }, settings: { lastBackupTime: 1791300600 }, artifactsDb: { missionInfos: [], virtueAfxDb: { inventoryItems: [], activeArtifacts: { slots: [] } } }, contracts: { archive: [] }, farms: [{ eggType: 1 }] };
    await load({ backup }); await page.click('[data-tab="planning"]');
    assert.equal(await page.locator('#planning-farm-summary [data-source="farm"]').innerText(), "Retained Farm");
    assert.equal(await page.locator("#planning-backup-time").getAttribute("datetime"), new Date(1791300600 * 1000).toISOString());
    assert.deepEqual((await page.evaluate(() => VirtueApp.getConfig())).plan, saved.plan);
    const activeBackup = structuredClone(backup); activeBackup.farms = [{ eggType: 50, unclaimedCash: 1e12, habs: [0, 19, 19, 19], vehicles: [0], silosOwned: 1 }];
    await load({ backup: activeBackup }); await page.click('[data-tab="planning"]');
    assert.equal(await page.locator('#planning-farm-summary [data-source="farm"]').innerText(), "Imported Backup");
    assert.equal((await page.evaluate(() => VirtueApp.getConfig())).plan.target, 45);
    // Invalid planning input must not hide the starting-farm context or trap navigation.
    await page.fill("#stagedSales", "0"); await page.evaluate(() => VirtueApp.refresh());
    assert.match(await page.locator("#planning-starting-te").innerText(), /25 Claimed/);
    await page.click("#review-inputs"); assert.equal(await page.locator("#page-title").innerText(), "Planning"); assert.equal(await page.evaluate(() => document.activeElement.id), "stagedSales");
    await page.click("#review-farm"); assert.ok(await page.getByRole("button", { name: "Continue to Artifacts", exact: true }).isEnabled());
    await page.click("#optimize"); assert.equal(await page.locator("#page-title").innerText(), "Artifacts"); await page.click("#optimize"); assert.equal(await page.locator("#page-title").innerText(), "Common Research"); assert.ok(await page.locator("#optimize").isEnabled()); await page.click("#optimize"); await page.fill("#stagedSales", "3"); await page.evaluate(() => VirtueApp.refresh());
    // Copy each distinct alternate loadout (including stones) into Current, with no source aliasing.
    const sets = structuredClone(saved);
    const artifacts = S.D.artifacts.filter(a => a.slots > 0), stone = S.D.stones[0].id;
    const makeSet = artifact => Array.from({length:4}, (_,i) => i === 0 ? {artifactId:artifact.id,stones:Array(artifact.slots).fill(stone)} : {artifactId:null,stones:[]});
    sets.farm.loadouts = {current:makeSet(artifacts[0]),earnings:makeSet(artifacts[1]),delivery:makeSet(artifacts[2])};
    sets.farm.activeSet = "delivery";
    await load(sets); await page.click('[data-tab="artifacts"]');
    assert.equal(await page.locator("#copy-earnings").innerText(), "Copy Earnings to Current");
    assert.equal(await page.locator("#copy-delivery").innerText(), "Copy Delivery to Current");
    const alternates = (await page.evaluate(() => VirtueApp.getConfig())).farm.loadouts;
    for (const key of ["earnings", "delivery"]) {
      await page.click("#copy-" + key);
      const copied = (await page.evaluate(() => VirtueApp.getConfig())).farm;
      assert.deepEqual(copied.loadouts.current, alternates[key]);
      assert.deepEqual(copied.loadouts.earnings, alternates.earnings);
      assert.deepEqual(copied.loadouts.delivery, alternates.delivery);
      assert.equal(copied.activeSet, "current");
    }
    await page.selectOption("#artifact-current-0", ""); await page.evaluate(() => VirtueApp.refresh());
    assert.deepEqual((await page.evaluate(() => VirtueApp.getConfig())).farm.loadouts.delivery, alternates.delivery);
    await page.click("#optimize"); await page.click("#optimize");
    // Reset/Undo retains goals, missions and the Planning page; browser recovery is absent.
    const beforeReset = await page.evaluate(() => VirtueApp.getConfig());
    await page.click("#clear-data"); assert.equal(await page.locator("#page-title").innerText(), "Farm & Account");
    await page.click("#undo-reset"); assert.equal(await page.locator("#page-title").innerText(), "Planning");
    assert.deepEqual(await page.evaluate(() => VirtueApp.getConfig()), beforeReset);
    assert.equal(await page.locator("#session-autosave").count(), 0);
    assert.equal(await page.locator("#session-recovery").count(), 0);
    await page.fill("#minOfflineMinutes", "21"); await page.evaluate(() => VirtueApp.refresh());
    assert.equal(await page.evaluate(() => localStorage.getItem("virtue-optimizer.session.v1")), null);
    const out = path.join(root, "tmp/page-navigation"); fs.mkdirSync(out, { recursive: true });
    await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(out, "planning-desktop.png"), fullPage: true });
    await page.click("#review-farm");
    for (const id of ["colleggtibles-card", "epic-research-card"]) assert.equal(await page.locator("#" + id).evaluate(node => node.parentElement.id), "farm-state-column");
    assert.ok(await page.locator("#col-fields select").first().isEnabled()); await page.uncheck("#manualAccountData"); assert.ok(await page.locator("#col-fields select").first().isDisabled()); assert.ok(await page.locator("#epic-fields input").first().isDisabled());
    await page.screenshot({ path: path.join(out, "farm-account-desktop.png"), fullPage: true });
    await page.locator("header").screenshot({path:path.join(out,"farm-header-desktop.png")});
    for (const width of [1440, 1280, 1050, 1000, 800, 500, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const section of ["farm", "planning", "research", "artifacts", "results", "help"]) {
        await page.click(`[data-tab="${section}"]`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), section + " overflow at " + width);
        if (["farm", "planning"].includes(section) && width >= 1050) assert.ok(await page.locator('[data-page="' + section + '"] .farm-workspace').evaluate(node => { const [left, right] = [...node.children].map(n => n.getBoundingClientRect()); return left.right <= right.left + 1; }), section + " two-panel layout at " + width);
      }
    }
    await page.click('[data-tab="farm"]'); await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:path.join(out,"farm-account-mobile.png"),fullPage:true});
    await page.locator("header").screenshot({path:path.join(out,"farm-header-mobile.png")});
    // Exercise EID sync through the real protobuf/API path, including fleet rendering and identity preferences.
    syncBackup = {...activeBackup,userName:"SyntheticTester"};
    await page.click('[data-tab="farm"]');
    await page.fill("#eid","EI0000000000000000");await page.click("#import-eid");
    await page.waitForFunction(()=>document.getElementById("notice").textContent.startsWith("Account information and the current Virtue farm"));
    assert.equal(syncPosts,1);assert.ok(await page.locator("#vehicle-0").isVisible());
    assert.equal(await page.inputValue("#eid"),"SyntheticTester");
    assert.equal(await page.inputValue("#epic-hold_to_research"),"20");
    assert.equal(await page.locator('#colleggtibles-card [data-source]').innerText(),"Imported Backup");
    await page.click("#optimize");assert.equal(await page.locator("#page-title").innerText(),"Artifacts");
    await page.click("#optimize");assert.equal(await page.locator("#page-title").innerText(),"Common Research");
    await page.click("#optimize");assert.equal(await page.locator("#page-title").innerText(),"Planning");
    await page.reload();await page.waitForFunction(()=>!!globalThis.VirtueApp);
    assert.equal(await page.inputValue("#eid"),"SyntheticTester");
    await page.locator("#eid").focus();assert.equal(await page.inputValue("#eid"),"EI0000000000000000");
    assert.deepEqual(errors, []);
    console.log("PASS Farm → Artifacts → Common Research → Planning, exact Continue labels/menu order, EID below heading, removed sidebar info/import details, real synthetic EID sync/identity, directional loadout copies with stones, left account panels, tier-compatible navigation and primary action, page-specific controls, live farm/TE/backup context, imported/retained labels, cross-page saved goals/ships/precision, import retention, error routing, Reset/Undo, browser recovery removal and two-panel layouts 1440–320px.");
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
