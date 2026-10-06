"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const blank = require("../src/blank-farm.cjs"), S = require("../src/simulator.cjs");
const root = path.resolve(__dirname, "..");
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"], env: { ...process.env, LD_LIBRARY_PATH: process.env.CHROMIUM_LIB_DIR || "", FONTCONFIG_PATH: process.env.CHROMIUM_FONT_DIR || "" } });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } }), errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("file://" + path.join(root, "index.html")); await page.waitForFunction(() => !!globalThis.VirtueApp);
    const load = raw => page.evaluate(raw => VirtueApp.loadFile(new File([JSON.stringify(raw)], "Synthetic-Farm.json")), raw);
    const farm = blank();
    Object.assign(farm.farm, { cash: 1e18, soulEggs: 1e20, claimed: Array(5).fill(5), proPermit: true, manualFarmData: true, manualAccountData: true, epic: Object.fromEntries(S.D.epic.map(r => [r.id, r.levels])) });
    Object.assign(farm.plan, { target: 25, maxSwitches: 0, strategy: "user", autoSequence: false, sequence: ["curiosity"] });
    await load(farm);
    const initial = S.prepare(farm), unlocked = S.stats(initial.s, initial.c).slots;
    assert.equal(await page.locator(".fleet-slot").count(), 17);
    assert.equal(await page.locator(".fleet-slot:visible").count(), unlocked);
    assert.match(await page.locator("#fleet-status").innerText(), new RegExp(unlocked + " unlocked slots"));
    assert.ok(await page.locator("#cars-0").isHidden());
    assert.deepEqual((await page.evaluate(() => VirtueApp.getConfig())).farm.vehicles, farm.farm.vehicles);
    await page.selectOption("#vehicle-0", "11"); await page.evaluate(() => VirtueApp.refresh());
    assert.ok(await page.getByLabel("Fleet Slot 1 Train Cars", { exact: true }).isVisible());
    await page.fill("#cars-0", "3"); await page.evaluate(() => VirtueApp.refresh());
    await page.selectOption("#vehicle-0", "0"); await page.evaluate(() => VirtueApp.refresh());
    assert.ok(await page.locator("#cars-0").isHidden());
    assert.equal((await page.evaluate(() => VirtueApp.getConfig())).farm.vehicles[0].cars, 3);
    // Hidden controls retain their values and invalid data can still be corrected.
    await page.evaluate(() => { document.getElementById("cars-16").value = "0"; VirtueApp.refresh(); });
    assert.ok(await page.locator("#cars-16").isVisible());
    assert.ok(await page.locator("#cars-16").isEnabled());
    assert.equal(await page.locator("#run-detail").innerText(), "Review your inputs to continue.");
    assert.match(await page.locator("#notice").innerText(), /Train cars/);
    await page.click("#review-inputs");
    assert.equal(await page.evaluate(() => document.activeElement.id), "cars-16");
    await page.fill("#cars-16", "1"); await page.evaluate(() => VirtueApp.refresh());
    assert.ok(await page.locator("#cars-16").isHidden());
    const saved = await page.evaluate(() => VirtueApp.getConfig()); await load(saved);
    assert.deepEqual((await page.evaluate(() => VirtueApp.getConfig())).farm.vehicles, saved.farm.vehicles);
    await page.uncheck("#manualFarmData");
    await page.evaluate(() => { document.getElementById("cars-16").value = "0"; VirtueApp.refresh(); });
    assert.ok(await page.locator("#cars-16").isVisible()); assert.ok(await page.locator("#cars-16").isDisabled());
    await page.click("#review-inputs"); assert.equal(await page.evaluate(() => document.activeElement.id), "manualFarmData");
    await page.check("#manualFarmData"); await page.fill("#cars-16", "1"); await page.evaluate(() => VirtueApp.refresh());
    const maxed = structuredClone(saved); maxed.farm.research = Object.fromEntries(S.D.research.map(r => [r.id, r.levels]));
    maxed.farm.vehicles[16] = { id: 11, cars: 10 };
    await load(maxed); assert.equal(await page.locator(".fleet-slot:visible").count(), 17);
    assert.ok(await page.locator("#cars-16").isVisible());
    await page.uncheck("#manualFarmData"); assert.ok(await page.locator("#cars-16").isDisabled());
    assert.equal((await page.evaluate(() => VirtueApp.getConfig())).farm.vehicles[16].cars, 10);
    const occupiedLocked = structuredClone(farm); occupiedLocked.farm.vehicles[16].id = 0;
    await load(occupiedLocked); assert.match(await page.locator("#notice").innerText(), /not unlocked/);
    assert.ok(await page.locator("#vehicle-16").isVisible());
    await load(saved);
    const output = path.join(root, "tmp/ui-polish"); fs.mkdirSync(output, { recursive: true });
    await page.locator("#vehicle-fields").scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(output, "fleet-after.png") });
    // The sidebar scrolls independently; keyboard focus does not jump the main page.
    await page.setViewportSize({ width: 1366, height: 440 }); await page.click('[data-tab="farm"]');
    await page.evaluate(() => { window.scrollTo(0, 500); document.querySelector("aside").scrollTop = 0; });
    const scrollBefore = await page.evaluate(() => scrollY);
    await page.locator("#update-app").focus();
    assert.equal(await page.evaluate(() => scrollY), scrollBefore);
    const update = await page.locator("#update-app").boundingBox();
    assert.ok(update.y >= 0 && update.y + update.height <= 440, "Update App must be reachable in a short window");
    await page.keyboard.press("Enter"); assert.ok(await page.locator("#update-dialog").isVisible());
    await page.keyboard.press("Escape");
    await page.screenshot({ path: path.join(output, "short-after.png") });
    await page.setViewportSize({ width: 1366, height: 768 });
    const checkbox = await page.locator("#manualFarmData").boundingBox(); assert.ok(checkbox.height <= 20);
    // Exercise all planning-bar controls together, as they appear during a search.
    await page.evaluate(() => { document.getElementById("stop").hidden = false; document.getElementById("review-inputs").hidden = false; document.getElementById("run-progress").hidden = false; document.getElementById("run-summary").textContent = "Checking Opening 100 / 100"; document.getElementById("run-detail").textContent = "C1: 300m · K1: 300m · Best so far: 137d 18h · Searching for 59s"; });
    for (const [width, height] of [[1366, 768], [1100, 620], [1050, 620], [900, 600], [800, 600], [683, 384], [390, 600], [320, 600]]) {
      await page.setViewportSize({ width, height });
      for (const section of ["farm", "research", "artifacts", "results", "help"]) {
        await page.click(`[data-tab="${section}"]`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), section + " overflow at " + width);
      }
      const controls = await page.locator('.run-bar button:not([hidden]), .run-bar progress:not([hidden])').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
      for (const rect of controls) assert.ok(rect.x >= 0 && rect.right <= width + 1 && rect.y >= 0 && rect.bottom <= height + 1, "Planning control outside viewport at " + width);
      for (let i = 0; i < controls.length; i++) for (let j = i + 1; j < controls.length; j++) {
        const a = controls[i], b = controls[j]; assert.ok(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top, "Planning controls overlap at " + width);
      }
      await page.click('[data-tab="farm"]'); await page.locator("#maxDays").focus();
      const focused = await page.locator("#maxDays").boundingBox(), bar = await page.locator(".run-bar").boundingBox();
      assert.ok(focused.y + focused.height < bar.y, "Focused field obscured at " + width);
    }
    assert.deepEqual(errors, []);
    console.log("PASS fleet visibility/unlocks, hidden-value round trips and correction, Hyperloop controls and edit locks, short-window sidebar/update access, independent focus scrolling, checkbox sizing and planning controls at 1366–320px including desktop zoom.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
