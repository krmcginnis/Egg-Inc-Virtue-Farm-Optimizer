"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), http = require("node:http"), crypto = require("node:crypto"), { execFileSync } = require("node:child_process");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const blank = require("../src/blank-farm.cjs"), S = require("../src/simulator.cjs"), catalog = require("../assets/brand/farm-icons.json");
const root = path.resolve(__dirname, "..");
(async () => {
  for (const [kind, items] of [["hab", S.D.habs], ["vehicle", S.D.vehicles]]) for (const item of items) {
    const image = catalog.icons[kind + ":" + item.id]; assert.ok(image, item.name);
    assert.equal(image.name, item.name); assert.equal(image.sourceFile, path.basename(item.iconPath));
    if (kind === "vehicle") assert.ok(image.sourceHeight * 48 / catalog.iconSize <= 28, "Vehicle artwork must fit without clipping");
  }
  assert.equal(Object.keys(catalog.icons).length, S.D.habs.length + S.D.vehicles.length + 1);
  assert.equal(crypto.createHash("sha256").update(fs.readFileSync(path.join(root, catalog.asset))).digest("hex"), catalog.sha256);
  execFileSync(process.platform === "win32" ? "python" : "python3", ["-c", "import json,hashlib,sys;from PIL import Image;from pathlib import Path;r=Path(sys.argv[1]);c=json.loads((r/'assets/brand/farm-icons.json').read_text());im=Image.open(r/c['asset']).convert('RGBA');assert im.size==(c['width'],c['height']);\nfor v in c['icons'].values():\n x=v['x']+(64-v['sourceWidth'])//2;y=v['y']+(64-v['sourceHeight'])//2;p=im.crop((x,y,x+v['sourceWidth'],y+v['sourceHeight']));assert hashlib.sha256(p.tobytes()).hexdigest()==v['pixelSHA256']", root]);
  const server = http.createServer((req, res) => {
    const name = new URL(req.url, "http://localhost").pathname.slice(1) || "index.html";
    if (name.includes("..") || !fs.existsSync(path.join(root, name))) { res.writeHead(404); res.end(); return; }
    res.setHeader("Content-Type", ({ ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".json": "application/json" })[path.extname(name)] || "text/html");
    res.end(fs.readFileSync(path.join(root, name)));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve)); let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"], env: { ...process.env, LD_LIBRARY_PATH: process.env.CHROMIUM_LIB_DIR || "", FONTCONFIG_PATH: process.env.CHROMIUM_FONT_DIR || "" } });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto("http://127.0.0.1:" + server.address().port); await page.waitForFunction(() => !!globalThis.VirtueApp);
    const load = raw => page.evaluate(raw => VirtueApp.loadFile(new File([JSON.stringify(raw)], "Synthetic-Farm.json")), raw);
    const farm = blank(); Object.assign(farm.farm, { cash: 1e40, soulEggs: 1e20, claimed: Array(5).fill(5), proPermit: true, manualFarmData: true, manualAccountData: true, epic: Object.fromEntries(S.D.epic.map(r => [r.id, r.levels])), research: Object.fromEntries(S.D.research.map(r => [r.id, r.levels])) });
    Object.assign(farm.plan, { target: 25, maxSwitches: 0, strategy: "user", autoSequence: false, sequence: ["curiosity"] });
    await load(farm);
    for (const [kind, items, id] of [["hab", S.D.habs, "hab-0"], ["vehicle", S.D.vehicles, "vehicle-0"]]) {
      for (const item of items) {
        await page.selectOption("#" + id, String(item.id));
        const artwork = page.locator("#" + id).locator("..").locator(".farm-icon");
        assert.equal(await artwork.getAttribute("data-farm-icon"), kind + ":" + item.id);
        assert.equal(await artwork.getAttribute("aria-hidden"), "true");
        assert.equal(await page.locator("#" + id).getAttribute("title"), item.name);
        assert.equal(await page.locator("#" + id + " option:checked").innerText(), item.name);
      }
    }
    await page.selectOption("#hab-1", "18"); await page.selectOption("#hab-2", "17");
    await page.selectOption("#hab-3", "16"); await page.selectOption("#vehicle-1", "10");
    await page.fill("#cars-0", "10"); await page.evaluate(() => VirtueApp.refresh());
    const saved = await page.evaluate(() => VirtueApp.getConfig());
    await page.uncheck("#manualFarmData");
    assert.ok(await page.getByRole("combobox", { name: "Habitat 1", exact: true }).isDisabled());
    assert.ok(await page.getByLabel("Fleet Slot 1 Vehicle", { exact: true }).isDisabled());
    assert.ok(await page.locator('#hab-fields [data-farm-icon="hab:18"]').first().isVisible());
    const locked = await page.evaluate(() => VirtueApp.getConfig()); await load(locked);
    assert.deepEqual((await page.evaluate(() => VirtueApp.getConfig())).farm.habs, saved.farm.habs);
    assert.deepEqual((await page.evaluate(() => VirtueApp.getConfig())).farm.vehicles, saved.farm.vehicles);
    const out = path.join(root, "tmp/farm-artwork"); fs.mkdirSync(out, { recursive: true });
    await page.locator("#hab-fields").scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(out, "farm-desktop.png") });
    await page.check("#manualFarmData"); await page.selectOption("#hab-0", "");
    assert.ok(await page.locator('#hab-0').locator('..').locator('.farm-icon').isHidden());
    assert.equal(await page.inputValue("#hab-0"), "");
    // Replay small synthetic plans to exercise all three purchase-timeline layers.
    for (const kind of ["hab", "vehicle"]) {
      const fixture = structuredClone(farm); fixture.farm.virtue = kind === "hab" ? "integrity" : "kindness"; fixture.plan.sequence = [fixture.farm.virtue];
      const initial = S.prepare(fixture); let state = S.buy(initial.s, initial.c, { type: kind, slot: 0, id: kind === "hab" ? 18 : 11 });
      if (kind === "vehicle") state = S.buy(state, initial.c, { type: "car", slot: 0 });
      state = S.advance(state, initial.c, state.t + 60, "Synthetic break", true, "offline");
      const result = { version: 1, start: initial.c.start, end: state.t, seconds: 60, target: 25, actions: S.history(state), frontier: [], explored: 0, method: "Synthetic UI fixture", termination: "complete" };
      await load({ version: 1, config: fixture, result }); assert.match(await page.locator("#notice").innerText(), /replayed/);
      const icon = kind + ":" + (kind === "hab" ? 18 : 11);
      assert.ok(await page.locator(`.activity-chip [data-farm-icon="${icon}"]`).isVisible());
      await page.locator(".shift-summary>summary").click();
      assert.ok(await page.locator(`.guide-item [data-farm-icon="${icon}"]`).isVisible());
      await page.locator(".full-breakdown>summary").click();
      assert.ok(await page.locator(`.action.${kind} [data-farm-icon="${icon}"]`).isVisible());
      if (kind === "vehicle") {
        assert.ok(await page.locator('.activity-chip [data-farm-icon="car:hyperloop"]').isVisible());
        assert.ok(await page.locator('.guide-item [data-farm-icon="car:hyperloop"]').isVisible());
        assert.ok(await page.locator('.action.car [data-farm-icon="car:hyperloop"]').isVisible());
      }
      assert.deepEqual((await page.evaluate(() => VirtueApp.getResult())).actions, S.history(state));
    }
    await page.screenshot({ path: path.join(out, "timeline-desktop.png") });
    for (const width of [1440, 1280, 1050, 800, 500, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const section of ["farm", "results"]) { await page.click(`[data-tab="${section}"]`); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), section + " overflow at " + width); }
    }
    const offline = await browser.newPage(); await offline.route("http://**/*", route => route.abort()); await offline.route("https://**/*", route => route.abort());
    await offline.goto("file://" + path.join(root, "index.html")); await offline.waitForFunction(() => !!globalThis.VirtueApp);
    await offline.evaluate(raw => VirtueApp.loadFile(new File([JSON.stringify(raw)], "Offline-Farm.json")), saved);
    await offline.evaluate(asset => new Promise((resolve, reject) => { const image = new Image(); image.onload = resolve; image.onerror = reject; image.src = asset; }), catalog.asset);
    assert.deepEqual((await offline.evaluate(() => VirtueApp.getConfig())).farm.vehicles, saved.farm.vehicles);
    await page.route("**/farm-icons.png", route => route.abort()); await page.reload(); await page.waitForFunction(() => !!globalThis.VirtueApp); await load(saved);
    assert.ok(await page.getByRole("combobox", { name: "Habitat 1", exact: true }).isEnabled());
    assert.equal(await page.inputValue("#hab-0"), "18"); assert.equal(await page.locator("#vehicle-0 option:checked").innerText(), "Hyperloop Train");
    assert.deepEqual(errors, []);
    console.log("PASS all 32 catalog mappings and original pixels, live selected-item icons, native labels/values, empty slots, manual edit locks, saved-farm round trips, replayed timeline layers and Hyperloop cars, 1440–320px layouts, offline images and missing-art text fallback.");
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
