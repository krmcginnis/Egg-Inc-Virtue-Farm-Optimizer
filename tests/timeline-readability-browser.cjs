"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), http = require("node:http");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const blank = require("../src/blank-farm.cjs"), S = require("../src/simulator.cjs"), U = require("../src/shift-summary.cjs");
const Numbers = require("../src/number-format.cjs");
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
    assert.deepEqual(await page.locator('#strategy option').evaluateAll(nodes=>nodes.map(n=>[n.value,n.textContent])),[['wasmegg','Optimized Sequence'],['user','User Selected Sequence']]);
    assert.equal(await page.inputValue('#strategy'),'wasmegg');assert.ok(await page.locator('#effort').isDisabled());
    const load = async raw => { await page.evaluate(raw => VirtueApp.loadFile(new File([JSON.stringify(raw)], "Synthetic-Readability.json")), raw); await page.click(raw.result ? '[data-tab="results"]' : '[data-tab="farm"]'); };
    const farm = blank(1791244800);
    Object.assign(farm.farm, { cash: 1e18, soulEggs: 1e20, claimed: Array(5).fill(5), proPermit: true, manualFarmData: true, manualAccountData: true });
    farm.farm.habs[0] = 18; farm.farm.vehicles[0] = { id: 10, cars: 1 };
    const loadout = [{ artifactId: "vial-martian-dust-4-3", stones: ["lunar-stone-4", "quantum-stone-4"] }];
    farm.farm.loadouts = Object.fromEntries(["current", "earnings", "delivery"].map(key => [key, structuredClone(loadout)]));
    Object.assign(farm.plan, { target: 25, maxSwitches: 1, strategy: "user", autoSequence: false, sequence: ["curiosity", "integrity"], shiftSeconds: 0, actionSeconds: 0 });
    await load(farm);
    const legacyFarm=structuredClone(farm);Object.assign(legacyFarm.plan,{strategy:'auto',strategyVersion:2,autoSequence:true});await load(legacyFarm);assert.equal(await page.inputValue('#strategy'),'wasmegg');assert.equal((await page.evaluate(()=>VirtueApp.getConfig())).plan.strategy,'wasmegg');await load(farm);
    assert.ok(await page.locator('#effort').isEnabled());
    assert.equal(await page.locator("#pick-vehicle-0").getAttribute("title"),"Quantum Transporter");
    assert.equal(await page.locator("#hab-0-full-name").count(),0);
    assert.ok(await page.locator("#pick-hab-0").isEnabled());
    assert.ok(await page.locator("#pick-vehicle-0").isEnabled());
    assert.ok(await page.evaluate(() => Math.abs(document.getElementById("pick-hab-0").getBoundingClientRect().top - document.getElementById("pick-hab-1").getBoundingClientRect().top) < 1));
    await page.locator("#pick-hab-0").focus(); await page.keyboard.press("Enter");
    await page.locator('#gear-picker [data-item-id="0"]').click();
    assert.equal(await page.inputValue("#hab-0"), "0");
    await page.selectOption("#hab-0", "",{force:true}); await page.selectOption("#hab-0", "18",{force:true});
    await page.setViewportSize({width:1000,height:1000});await page.setViewportSize({width:1440,height:1000});
    await page.uncheck("#manualFarmData");
    assert.ok(await page.locator("#pick-hab-0").isDisabled());
    assert.ok(await page.locator('#hab-fields [data-farm-icon="hab:18"]').isVisible());
    await page.check("#manualFarmData"); await page.evaluate(()=>VirtueApp.tab("artifacts"));await page.click("#loadout-tab-earnings");
    await page.setViewportSize({ width: 1160, height: 1000 });
    assert.equal(await page.locator("#artifact-earnings-0-full-name").count(),0);
    assert.ok(await page.locator('#pick-artifact-earnings-0').isEnabled());
    assert.match(await page.locator("#loadout-card-earnings-0").innerText(), /running chicken bonus/);
    assert.match(await page.locator("#loadout-card-earnings-0").innerText(), /away earnings/);
    const saved = await page.evaluate(() => VirtueApp.getConfig()); await load(saved);
    assert.deepEqual((await page.evaluate(() => VirtueApp.getConfig())).farm.loadouts, saved.farm.loadouts);
    assert.deepEqual((await page.evaluate(() => VirtueApp.getConfig())).farm.habs, saved.farm.habs);
    const out = path.join(root, "tmp/timeline-readability"); fs.mkdirSync(out, { recursive: true });
    await page.evaluate(()=>VirtueApp.tab("artifacts"));await page.click("#loadout-tab-earnings");
    await page.locator("#earnings-loadout-fields").screenshot({ path: path.join(out, "long-names-desktop.png") });
    // Replayed actions deliberately span unsorted research purchases, a folded
    // short wait, both visible wait modes, and a final shift containing only a wait.
    const fixture = structuredClone(farm); fixture.farm.habs = [0, null, null, null]; fixture.farm.vehicles[0] = { id: 0, cars: 1 };
    fixture.farm.research[S.D.research[0].id] = 30;
    const initial = S.prepare(fixture); let state = initial.s;
    for (const i of [4, 1, 0, 0]) state = S.buy(state, initial.c, { type: "research", i });
    state = S.advance(state, initial.c, state.t + 3, "Brief online pause", true, "online");
    state = S.buy(state, initial.c, { type: "research", i: 0 });
    state = S.advance(state, initial.c, state.t + 62, "Collect offline earnings", true, "offline");
    state = S.buy(state, initial.c, { type: "research", i: 1 });
    state = S.advance(state, initial.c, state.t + 23, "Finish Curiosity deliveries", true, "online");
    state = S.buy(state, initial.c, { type: "shift", egg: 1 });
    state = S.advance(state, initial.c, state.t + 43, "Finish Integrity deliveries", true, "online");
    const result = { version: 1, start: initial.c.start, end: state.t, seconds: state.t - initial.c.start, target: 25, actions: S.history(state), frontier: [], explored: 0, method: "Synthetic UI fixture", termination: "complete" };
    const summary = U.summarize(fixture, result);
    await load({ version: 1, config: fixture, result }); assert.match(await page.locator("#notice").innerText(), /replayed/);
    assert.doesNotMatch(await page.locator('#result-content').innerText(),/Switch Tradeoffs Found/i);
    assert.ok(await page.locator('.plan-start').evaluate(n=>n.nextElementSibling.classList.contains('plan-end')));
    assert.equal(await page.locator(".shift-summary").count(), 2);
    for (const [i, shift] of summary.shifts.entries()) {
      const group = page.locator(".shift-summary").nth(i);
      assert.equal(await group.locator('.shift-start').getAttribute('datetime'),new Date(shift.start*1000).toISOString());
      assert.ok(await group.locator('.shift-start').evaluate(n=>n.getBoundingClientRect().bottom<=n.nextElementSibling.getBoundingClientRect().top));
      for(const key of ['earning','shipping','laying']) {
        const value=group.locator(':scope>summary .shift-max-rates [data-rate="'+key+'"] dd');
        assert.equal(await value.textContent(),Numbers.format(shift.maxRates[key]*3600)+'/hour');
        assert.ok(await value.locator('[data-unit-icon="'+(key==='earning'?'gem':S.EGGS[shift.egg])+'"] img').isVisible());
        assert.equal(await value.evaluate(n=>getComputedStyle(n).textAlign),'left');
      }
      assert.equal(await group.locator('.shift-duration [data-unit-icon]').getAttribute('data-unit-icon'),S.EGGS[shift.egg]);
      if(shift.hasSwitch)assert.ok(await group.locator('.shift-cost [data-unit-icon="soul"] img').isVisible());
      assert.equal(await group.locator(".action").count(), 0, "full breakdown remains lazy");
      await group.locator(":scope>summary").click();
      assert.equal(await group.locator(".guide-complete").count(), 1, "one finish strip even when the shift ends with a break");
      assert.equal(await group.locator(".guide-complete time").getAttribute("datetime"), new Date(shift.end * 1000).toISOString());
      assert.ok(await group.locator(".guide-complete").evaluate(node => node === node.parentElement.lastElementChild));
      for(const key of ['earning','shipping','laying'])assert.equal(await group.locator('.guide-complete [data-rate="'+key+'"] dd').innerText(),await group.locator(':scope>summary [data-rate="'+key+'"] dd').innerText());
      const pauses = shift.quickGuide.filter(step => step.break).map(step => step.break);
      assert.equal(await group.locator(".guide-break").count(), pauses.length);
      for (const [j, pause] of pauses.entries()) {
        const box = group.locator(".guide-break").nth(j);
        assert.equal(await box.locator(".guide-resume").getAttribute("datetime"), new Date(pause.end * 1000).toISOString());
        assert.equal(await box.locator(".guide-break-duration").innerText(), pause.seconds === 62 ? "1m 2s" : pause.seconds + "s");
        assert.equal(await box.locator("b").innerText(), pause.mode === "offline" ? "Offline Break" : "Online Wait");
      }
      await group.locator(".full-breakdown>summary").click();
      assert.equal(await group.locator(".action.wait.offline").count(), pauses.filter(p => p.mode === "offline").length);
      assert.equal(await group.locator(".guide-break").count(), pauses.length);
    }
    assert.deepEqual(await page.locator(".shift-summary").first().locator(".guide-step").first().locator("[data-research-index]").evaluateAll(nodes => nodes.map(node => Number(node.dataset.researchIndex))), [0, 1, 4]);
    assert.ok(await page.locator(".guide-item.research").evaluateAll(nodes => nodes.every(node => { const name = node.firstElementChild.getBoundingClientRect(), level = node.lastElementChild.getBoundingClientRect(); return Math.abs((name.top + name.bottom - level.top - level.bottom) / 2) < 1; })), "research targets stay beside their names");
    assert.match(await page.locator(".shift-summary").first().locator(".guide-overhead").innerText(), /3s/);
    assert.equal(await page.locator(".shift-summary").last().locator(".guide-step-heading").count(), 0, "a wait-only shift needs no duplicate purchase heading");
    assert.deepEqual((await page.evaluate(() => VirtueApp.getResult())).actions, result.actions);
    // Older saved reasons are displayed as gems without altering replay data.
    const old=structuredClone(result);old.actions.find(a=>a.type==='wait'&&a.end-a.t===62).reason='Accumulate cash before purchase';await load({version:1,config:fixture,result:old});
    await page.locator('.shift-summary').first().locator(':scope>summary').click();
    await page.locator('.shift-summary').first().locator('.full-breakdown>summary').click();assert.doesNotMatch(await page.locator('#result-content').innerText(),/\bcash\b/i);assert.equal((await page.evaluate(()=>VirtueApp.getResult())).actions.find(a=>a.type==='wait'&&a.end-a.t===62).reason,'Accumulate cash before purchase');
    await page.locator(".shift-summary").first().screenshot({ path: path.join(out, "timeline-desktop.png") });
    for (const width of [1440, 1280, 1050, 1000]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const section of ["account", "farm", "planning", "results"]) {
        await page.click(`[data-tab="${section}"]`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), section + " overflow at " + width);
        if (section === "farm" && width >= 1050) assert.ok(await page.evaluate(() => document.getElementById("farm-state-column").getBoundingClientRect().right <= document.getElementById("farm-equipment-column").getBoundingClientRect().left + 1), "two-panel layout at " + width);
      }
      assert.ok(await page.locator(".loadout-item-name").evaluateAll(nodes => nodes.every(n => n.scrollWidth <= n.clientWidth + 1)), "long title overflow at " + width);
    }
    await page.locator(".shift-summary").first().screenshot({path:path.join(out,"timeline-small-desktop.png")});
    assert.deepEqual(errors, []);
    console.log("PASS clipped/short/empty selected names, keyboard labels and locks, resize/tab updates, artifact effects and saved values, exact break modes/durations/resume dates, one finish strip per shift, tier order, folded waits, lazy detail, unchanged replay actions and compact layouts 1440–1000px.");
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
