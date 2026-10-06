"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), http = require("node:http");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const blank = require("../src/blank-farm.cjs"), S = require("../src/simulator.cjs");
const root = path.resolve(__dirname, "..");
(async () => {
  const server = http.createServer((req, res) => {
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
    const load = raw => page.evaluate(raw => VirtueApp.loadFile(new File([JSON.stringify(raw)], "Synthetic-Farm.json")), raw);
    assert.equal(await page.locator("#epic-details").getAttribute("open"), null);
    assert.equal(await page.locator("#col-details").getAttribute("open"), null);
    assert.match(await page.locator("#epic-summary").innerText(), /0 \/ 22/);
    assert.match(await page.locator("#col-totals").innerText(), /No Colleggtible bonuses/);
    // Native disclosure is keyboard-operable and does not unlock imported inputs.
    await page.locator("#epic-details>summary").focus(); await page.keyboard.press("Enter");
    assert.ok(await page.locator("#epic-hold_to_hatch").isVisible()); assert.ok(await page.locator("#epic-hold_to_hatch").isDisabled());
    await page.keyboard.press("Enter");
    const backup = { game: { soulEggsD: 1e20, permitLevel: 1, epicResearch: S.D.epic.map(r => ({ id: r.id, level: r.levels })) }, virtue: { eovEarned: Array(5).fill(5), eggsDelivered: Array(5).fill(S.D.te[4]), shiftCount: 0, afx: {} }, settings: { lastBackupTime: 1791300600 }, artifactsDb: { missionInfos: [], virtueAfxDb: { inventoryItems: [], activeArtifacts: { slots: [] } } }, contracts: { archive: S.D.customEggs.map(e => ({ contract: { customEggId: e.identifier }, maxFarmSizeReached: 1e10, timeAccepted: 1791300600 })) }, farms: [{ eggType: 50, unclaimedCash: 1e12, habs: [0, 19, 19, 19], vehicles: [0], silosOwned: 1 }] };
    await load({ backup });
    assert.match(await page.locator("#epic-summary").innerText(), /22 \/ 22 researches maxed/);
    assert.match(await page.locator("#epic-key-levels").innerText(), /FTL Drive Upgrades 60 \/ 60/);
    assert.match(await page.locator("#col-totals").innerText(), /Away earnings ×6/);
    assert.equal(await page.locator('#account-data-card [data-source]').innerText(), "Imported Backup");
    assert.equal(await page.locator('#colleggtibles-card [data-source]').innerText(), "Imported Backup");
    assert.ok(await page.locator("#import-backup-time").isVisible());
    const before = await page.evaluate(() => VirtueApp.getConfig());
    await page.locator("#col-details>summary").click(); await page.locator("#col-details>summary").click();
    assert.deepEqual(await page.evaluate(() => VirtueApp.getConfig()), before);
    await page.check("#manualAccountData");
    assert.ok(await page.locator("#epic-hold_to_hatch").isVisible()); assert.ok(await page.locator("#col-fields").isVisible());
    assert.equal(await page.locator('#account-data-card [data-source]').innerText(), "Manual Override");
    await page.fill("#epic-hold_to_hatch", "0"); await page.evaluate(() => VirtueApp.refresh());
    assert.match(await page.locator("#epic-summary").innerText(), /21 \/ 22/);
    await page.uncheck("#manualAccountData");
    assert.ok(await page.locator("#epic-hold_to_hatch").isHidden()); assert.ok(await page.locator("#epic-hold_to_hatch").isDisabled());
    assert.equal(await page.inputValue("#epic-hold_to_hatch"), "0");
    assert.equal(await page.locator('#epic-research-card [data-source]').innerText(), "Manually Edited");
    const editedSave = await page.evaluate(() => VirtueApp.getConfig());
    await load(editedSave);
    assert.equal(await page.locator('#epic-research-card [data-source]').innerText(), "Manually Edited");
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("virtue-optimizer.session.v1") || "{}").config?.uiProvenance?.epic === "manual");
    await page.reload(); await page.waitForFunction(() => !!globalThis.VirtueApp);
    await page.click("#restore-session");
    assert.equal(await page.locator('#epic-research-card [data-source]').innerText(), "Manually Edited");
    assert.equal(await page.inputValue("#epic-hold_to_hatch"), "0");
    // Account-only imports keep the existing farm and explicitly label that fact.
    const accountOnly = structuredClone(backup); accountOnly.farms = [{ eggType: 1 }];
    await load({ backup: accountOnly });
    assert.equal(await page.locator('#starting-farm-card [data-source]').innerText(), "Retained Farm");
    assert.equal(await page.locator('#account-data-card [data-source]').innerText(), "Imported Backup");
    const missingContracts = structuredClone(accountOnly); delete missingContracts.contracts;
    await load({ backup: missingContracts });
    assert.equal(await page.locator('#colleggtibles-card [data-source]').innerText(), "Review Tiers");
    assert.match(await page.locator("#col-note").innerText(), /progress was missing/);
    const saved = await page.evaluate(() => VirtueApp.getConfig()); await load(saved);
    assert.deepEqual((await page.evaluate(() => VirtueApp.getConfig())).farm, saved.farm);
    // Invalid fields are linked directly, with closed details opened before review.
    await page.check("#manualAccountData"); await page.fill("#epic-hold_to_hatch", "999"); await page.evaluate(() => VirtueApp.refresh());
    await page.locator("#epic-details>summary").click();
    assert.ok(await page.locator("#planning-guidance").isVisible());
    await page.click("#planning-guidance-actions button");
    assert.ok(await page.locator("#epic-hold_to_hatch").isVisible());
    assert.equal(await page.evaluate(() => document.activeElement.id), "epic-hold_to_hatch");
    await page.fill("#epic-hold_to_hatch", "0");
    await page.waitForFunction(() => document.getElementById("planning-guidance").hidden);
    assert.match(await page.locator("#notice").innerText(), /Ready to plan/);
    // Artifact previews become stale immediately after an input changes.
    await page.click('[data-tab="artifacts"]');
    assert.equal(await page.locator("#delivery-set-source").innerText(), "Starting Farm Preview");
    await page.check("#manualFarmArtifacts"); assert.equal(await page.locator("#delivery-set-source").innerText(), "Manual Override");
    await page.uncheck("#manualFarmArtifacts");
    await page.click('[data-tab="farm"]'); await page.uncheck("#manualAccountData");
    // Exercise the actual UI message handlers with deterministic worker events.
    // Search calculations remain untouched; a real worker is checked below.
    await page.evaluate(() => { window.realWorker = Worker; window.Worker = class { constructor() { window.testWorker = this; } postMessage(message) { this.lastMessage = message; } terminate() { this.terminated = true; } }; });
    await page.click('[data-tab="planning"]'); await page.click("#optimize");
    await page.evaluate(() => testWorker.onmessage({ data: { type: "progress", progress: { phase: "openings", openingCompared: 1, openingTotal: 4, openingBudget: { c1MaxMinutes: 30, k1MaxMinutes: 60 }, stage: "C3", bestSeconds: 86400 } } }));
    assert.equal(await page.locator("#run-summary").innerText(), "Checking Opening 2 / 4");
    assert.equal(await page.locator("#run-progress").getAttribute("value"), "1");
    assert.equal(await page.locator("#search-best").innerText(), "1d");
    assert.equal(await page.locator("#search-stage").innerText(), "C3 · Curiosity Complete");
    assert.match(await page.locator("#search-openings").innerText(), /1 \/ 4 completed/);
    await page.waitForFunction(() => document.getElementById("search-elapsed").textContent !== "0s");
    assert.match(await page.locator("#search-elapsed").innerText(), /s$/);
    const out = path.join(root, "tmp/planning-clarity"); fs.mkdirSync(out, { recursive: true });
    await page.screenshot({ path: path.join(out, "search-desktop.png") });
    await page.evaluate(() => testWorker.onmessage({ data: { type: "progress", progress: { depth: 10, explored: 2500, bestSeconds: 86400 } } }));
    assert.equal(await page.locator("#run-progress").getAttribute("value"), null);
    assert.equal(await page.locator("#search-openings").innerText(), "4 / 4 completed");
    assert.match(await page.locator("#search-stage").innerText(), /Free Routing · 2,500/);
    await page.click("#stop"); assert.ok(await page.evaluate(() => testWorker.lastMessage.cancel));
    await page.evaluate(() => testWorker.onmessage({ data: { type: "error", error: "No feasible plan found: the next switch costs 2Q Soul Eggs but the farm has 1Q." } }));
    assert.ok(await page.locator("#search-status").isHidden());
    await page.getByRole("button", { name: "Review Soul Eggs", exact: true }).click();
    assert.equal(await page.evaluate(() => document.activeElement.id), "manualAccountData");
    await page.check("#manualAccountData"); await page.getByRole("button", { name: "Review Soul Eggs", exact: true }).click();
    assert.equal(await page.evaluate(() => document.activeElement.id), "soulEggs");
    await page.click('[data-tab="planning"]'); await page.click("#optimize");
    await page.evaluate(() => testWorker.onmessage({ data: { type: "error", error: "No feasible plan found within the search and planning limits." } }));
    assert.match(await page.locator("#planning-guidance-detail").innerText(), /does not prove.*impossible/);
    await page.getByRole("button", { name: "Review Planning Days", exact: true }).click();
    assert.equal(await page.evaluate(() => document.activeElement.id), "maxDays");
    await page.screenshot({ path: path.join(out, "guidance-desktop.png") });
    await page.click('[data-tab="planning"]'); await page.click("#optimize");
    await page.evaluate(() => testWorker.onerror({ message: "Synthetic worker failure" }));
    assert.match(await page.locator("#planning-guidance-detail").innerText(), /Windows launcher/);
    await page.getByRole("button", { name: "Try Search Again", exact: true }).click();
    assert.ok(await page.locator("#search-status").isVisible());
    await page.click('[data-tab="planning"]'); await page.fill("#target", "26");
    await page.evaluate(() => testWorker.onmessage({ data: { type: "error", error: "No feasible plan found within the search and planning limits." } }));
    assert.match(await page.locator("#planning-guidance-detail").innerText(), /inputs at the start of the search/);
    // A real completed worker plan still passes replay and preserves the math.
    await page.evaluate(() => { window.Worker = realWorker; });
    const ready = blank(); Object.assign(ready.farm, { cash: 1e12, claimed: Array(5).fill(5), manualAccountData: false, manualFarmData: false });
    ready.plan.target = 25; ready.plan.strategy = "auto"; ready.farm.artifactInventory = [];
    await load(ready); await page.click('[data-tab="planning"]'); await page.click("#optimize");
    await page.waitForFunction(() => !!VirtueApp.getResult());
    assert.equal((await page.evaluate(() => VirtueApp.getResult())).validatedReplay, true);
    assert.ok(await page.locator("#planning-guidance").isHidden());
    assert.ok(await page.locator("#search-status").isHidden());
    const plan = await page.evaluate(() => ({ config: VirtueApp.getConfig(), result: VirtueApp.getResult() }));
    plan.result.artifactRecommendations = { delivery: plan.config.farm.loadouts.delivery };
    await load({ version: 1, ...plan }); await page.click('[data-tab="artifacts"]');
    assert.equal(await page.locator("#delivery-set-source").innerText(), "Calculated for This Plan");
    await page.click('[data-tab="planning"]'); await page.fill("#target", "26");
    await page.click('[data-tab="artifacts"]');
    assert.equal(await page.locator("#delivery-set-source").innerText(), "Starting Farm Preview");
    await load({ version: 1, ...plan }); await page.click('[data-tab="results"]'); await page.click("#next-ascension");
    assert.equal(await page.locator('#starting-farm-card [data-source]').innerText(), "Projected from Plan");
    assert.equal(await page.locator('#truth-egg-progress [data-source]').innerText(), "Projected from Plan");
    await load({ backup }); await page.click('[data-tab="farm"]');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(out, "summaries-desktop.png"), fullPage: true });
    for (const width of [1440, 1280, 1050, 800, 500, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const tab of ["farm", "planning", "artifacts", "results"]) { await page.click(`[data-tab="${tab}"]`); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tab + " overflow at " + width); }
    }
    const offline = await browser.newPage(); await offline.goto("file://" + path.join(root, "index.html")); await offline.waitForFunction(() => !!globalThis.VirtueApp);
    assert.ok(await offline.locator("#epic-details").isVisible()); assert.ok(await offline.locator("#epic-fields").isHidden());
    assert.deepEqual(errors, []);
    console.log("PASS compact summaries, keyboard disclosures, manual edit locks, real backup imports and timestamps, retained-farm/partial-data labels, save/load values, direct error focus, truthful worker progress, cancellation, real replayed worker plan, offline display and layouts 1440–320px.");
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
