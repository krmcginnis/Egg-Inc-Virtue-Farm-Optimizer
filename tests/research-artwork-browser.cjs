"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), http = require("node:http"), crypto = require("node:crypto"), { execFileSync } = require("node:child_process");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const blank = require("../src/blank-farm.cjs"), S = require("../src/simulator.cjs"), catalog = require("../assets/brand/research-icons.json");
const titleCase = require("../src/ui-text.cjs");
const root = path.resolve(__dirname, "..");
(async () => {
  for (const item of [...S.D.research, ...S.D.epic]) assert.ok(catalog.icons[item.id], item.id);
  assert.equal(crypto.createHash("sha256").update(fs.readFileSync(path.join(root, catalog.asset))).digest("hex"), catalog.sha256);
  // Packing must preserve every source pixel, including non-square icons.
  execFileSync(process.platform === "win32" ? "python" : "python3", ["-c", "import json,hashlib,sys;from PIL import Image;from pathlib import Path;r=Path(sys.argv[1]);c=json.loads((r/'assets/brand/research-icons.json').read_text());im=Image.open(r/c['asset']).convert('RGBA');assert im.size==(c['width'],c['height']);\nfor v in c['icons'].values():\n x=v['x']+(64-v['sourceWidth'])//2;y=v['y']+(64-v['sourceHeight'])//2;p=im.crop((x,y,x+v['sourceWidth'],y+v['sourceHeight']));assert hashlib.sha256(p.tobytes()).hexdigest()==v['pixelSHA256']", root]);
  const server = http.createServer((req, res) => {
    const name = new URL(req.url, "http://localhost").pathname.slice(1) || "index.html";
    if (name.includes("..") || !fs.existsSync(path.join(root, name))) { res.writeHead(404); res.end(); return; }
    const types = { ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp" };
    res.setHeader("Content-Type", types[path.extname(name)] || "text/html"); res.end(fs.readFileSync(path.join(root, name)));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve)); let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"], env: { ...process.env, LD_LIBRARY_PATH: process.env.CHROMIUM_LIB_DIR || "", FONTCONFIG_PATH: process.env.CHROMIUM_FONT_DIR || "" } });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), errors = []; page.on("pageerror", e => errors.push(e.message));
    const farm = blank(); Object.assign(farm.farm, { cash: 1e18, claimed: Array(5).fill(5), manualAccountData: true, manualFarmData: true, epic: Object.fromEntries(S.D.epic.map((r, i) => [r.id, i % (r.levels + 1)])) });
    Object.assign(farm.plan, { target: 25, maxSwitches: 0, autoSequence: false, strategy: "user", sequence: ["curiosity"] });
    await page.goto("http://127.0.0.1:" + server.address().port); await page.waitForFunction(() => !!globalThis.VirtueApp);
    await page.evaluate(raw => VirtueApp.loadFile(new File([JSON.stringify(raw)], "Synthetic-Farm.json")), farm);
    assert.equal(await page.locator("#epic-fields .research-icon").count(), 22); assert.equal(await page.locator("#research-body .research-icon").count(), 56);
    const before = await page.evaluate(() => VirtueApp.getConfig());
    for (const r of S.D.epic) { assert.equal(await page.getByLabel(titleCase(r.name), { exact: true }).inputValue(), String(farm.farm.epic[r.id])); assert.equal(await page.locator(`[data-research-icon="${r.id}"] .research-icon`).getAttribute("aria-hidden"), "true"); }
    assert.deepEqual(before.farm.epic, farm.farm.epic);
    await page.evaluate(() => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(); image.onerror = reject; image.src = "assets/brand/research-icons.png"; }));
    const out = path.join(root, "tmp/research-artwork"); fs.mkdirSync(out, { recursive: true });
    await page.locator("#epic-fields").screenshot({ path: path.join(out, "epic-desktop.png") });
    await page.click('[data-tab="research"]');
    await page.fill("#research-filter", "leafsprings"); assert.equal(await page.locator("#research-body tr:visible").count(), 1);
    assert.equal(await page.locator('#research-body tr:visible [data-research-icon]').getAttribute("data-research-icon"), "leafsprings");
    await page.locator("#research-body tr:visible").screenshot({ path: path.join(out, "common-desktop.png") });
    await page.fill("#research-filter", ""); await page.getByLabel(S.D.research[0].name + " current level", { exact: true }).fill("2"); await page.evaluate(() => VirtueApp.refresh());
    assert.equal((await page.evaluate(() => VirtueApp.getConfig())).farm.research[S.D.research[0].id], 2);
    await page.uncheck("#manualFarmResearch"); assert.ok(await page.locator("#research-" + S.D.research[0].id).isDisabled()); assert.ok(await page.locator("#research-body .research-icon").first().isVisible());
    await page.click('[data-tab="farm"]'); await page.uncheck("#manualAccountData"); assert.ok(await page.locator("#epic-hold_to_hatch").isDisabled()); assert.ok(await page.locator("#epic-fields .research-icon").first().isVisible());
    // A small replayed plan exercises all three timeline layers without a search.
    const initial = S.prepare(farm); let state = initial.s;
    state = S.buy(state, initial.c, { type: "research", i: 0 }); state = S.buy(state, initial.c, { type: "research", i: 0 });
    state = S.advance(state, initial.c, state.t + 60, "Synthetic earning break", true, "offline"); state = S.buy(state, initial.c, { type: "research", i: 1 });
    const result = { version: 1, start: initial.c.start, end: state.t, seconds: 60, target: 25, actions: S.history(state), frontier: [], explored: 0, method: "Synthetic UI fixture", termination: "complete" };
    await page.evaluate(raw => VirtueApp.loadFile(new File([JSON.stringify(raw)], "Synthetic-Plan.json")), { version: 1, config: farm, result });
    assert.match(await page.locator("#notice").innerText(), /replayed/);
    assert.equal(await page.locator(".activity-chip.research .research-icon").count(), 2);
    await page.locator(".shift-summary>summary").first().click(); assert.equal(await page.locator(".guide-item.research .research-icon").count(), 2);
    await page.locator(".full-breakdown>summary").first().click(); assert.equal(await page.locator(".action.research .research-icon").count(), 2);
    assert.deepEqual((await page.evaluate(() => VirtueApp.getResult())).actions, S.history(state));
    for (const width of [1440, 1280, 1000, 800, 500, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const tab of ["farm", "research", "results"]) { await page.click(`[data-tab="${tab}"]`); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tab + " overflow at " + width); }
    }
    const offline = await browser.newPage(); await offline.route("http://**/*", r => r.abort()); await offline.route("https://**/*", r => r.abort());
    await offline.goto("file://" + path.join(root, "index.html")); await offline.waitForFunction(() => !!globalThis.VirtueApp);
    await offline.evaluate(raw => VirtueApp.loadFile(new File([JSON.stringify(raw)], "Offline-Farm.json")), farm);
    await offline.evaluate(() => new Promise((resolve, reject) => { const image = new Image(); image.onload = resolve; image.onerror = reject; image.src = "assets/brand/research-icons.png"; }));
    assert.deepEqual((await offline.evaluate(() => VirtueApp.getConfig())).farm.epic, farm.farm.epic);
    const saved = await offline.evaluate(() => VirtueApp.getConfig()); await offline.evaluate(raw => VirtueApp.loadFile(new File([JSON.stringify(raw)], "Saved-Farm.json")), saved);
    assert.deepEqual((await offline.evaluate(() => VirtueApp.getConfig())).farm.research, saved.farm.research);
    // The text/control remains usable when the decorative artwork is unavailable.
    await page.route("**/research-icons.png", r => r.abort()); await page.reload(); await page.waitForFunction(() => !!globalThis.VirtueApp);
    await page.evaluate(raw => VirtueApp.loadFile(new File([JSON.stringify(raw)], "Missing-Art-Farm.json")), farm);
    assert.ok(await page.getByLabel("Hold to Hatch", { exact: true }).isEnabled()); assert.equal(await page.locator("#epic-fields label").count(), 22);
    assert.deepEqual(errors, []);
    console.log("PASS all research mappings and original pixels, inline icons, unchanged labels/values, edit locks, filtering, replayed timeline layers, layouts 1440–320px, offline display, saved-farm roundtrip and missing-art text fallback.");
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
