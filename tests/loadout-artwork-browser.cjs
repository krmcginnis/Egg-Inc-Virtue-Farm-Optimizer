"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), http = require("node:http"), crypto = require("node:crypto");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const blank = require("../src/blank-farm.cjs"), D = require("../src/game-data.json"), catalog = require("../assets/brand/artifact-icons.json");
const root = path.resolve(__dirname, "..");
const slot = (artifactId, ...stones) => ({ artifactId, stones });

(async () => {
  // Every selectable tier has verified, bundled artwork. Rarities share a tier image.
  for (const item of [...D.artifacts, ...D.stones]) assert.ok(catalog.icons[item.afxId + ":" + item.afxLevel], item.id);
  for (const [file, record] of Object.entries(catalog.files)) {
    const bytes = fs.readFileSync(path.join(root, "assets/brand", file));
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), record.sha256, file);
    assert.equal(bytes.readUInt32BE(16), 128); assert.equal(bytes.readUInt32BE(20), 128);
  }
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const name = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    if (name.includes("..") || !["index.html", "app.js", "style.css", "worker-source.js", "session.js"].includes(name) && !name.startsWith("assets/")) { res.writeHead(404); res.end(); return; }
    const types = { ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp" };
    if (!fs.existsSync(path.join(root, name))) { res.writeHead(404); res.end(); return; }
    res.setHeader("Content-Type", types[path.extname(name)] || "text/html");
    res.end(fs.readFileSync(path.join(root, name)));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"], env: { ...process.env, LD_LIBRARY_PATH: process.env.CHROMIUM_LIB_DIR || "", FONTCONFIG_PATH: process.env.CHROMIUM_FONT_DIR || "" } });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const farm = blank(); Object.assign(farm.farm, { manualAccountData: true, manualFarmData: true, proPermit: true });
    const loadout = [slot("puzzle-cube-4-3", "lunar-stone-4", "lunar-stone-4", "shell-stone-4"), slot("lunar-totem-4-2", "lunar-stone-4", null), slot("tungsten-ankh-3-3", "shell-stone-3", "shell-stone-4", "lunar-stone-4"), slot("demeters-necklace-1-0")];
    farm.farm.loadouts = Object.fromEntries(["current", "earnings", "delivery"].map(key => [key, structuredClone(loadout)]));
    async function load(target, value) { await target.evaluate(raw => VirtueApp.loadFile(new File([JSON.stringify(raw)], "Synthetic-Farm.json")), value); await target.evaluate(()=>VirtueApp.tab("artifacts"));await target.click("#loadout-tab-earnings"); }
    async function images(target) { await target.waitForFunction(() => [...document.querySelectorAll(".loadout-card img")].every(image => image.complete && image.naturalWidth === 128)); }
    await page.goto("http://127.0.0.1:" + server.address().port); await page.waitForFunction(() => !!globalThis.VirtueApp);
    await load(page, farm); await images(page);
    assert.equal(await page.locator("#earnings-loadout-fields .loadout-card").count(), 4);
    const cube = page.locator("#loadout-card-earnings-0");
    assert.match(await cube.innerText(), /T4 · Legendary/); assert.match(await cube.innerText(), /-60% research cost/);
    assert.match(await cube.innerText(), /2 × T4C Lunar Stone\s+\+40% away earnings each/);
    assert.equal(await cube.locator(".loadout-stone-image").count(), 3);
    const stoneBoxes = await cube.locator(".loadout-stone-socket").evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, bottom: r.bottom }; }));
    assert.ok(stoneBoxes.every(r => r.y === stoneBoxes[0].y)); assert.ok(stoneBoxes[0].x < stoneBoxes[1].x && stoneBoxes[1].x < stoneBoxes[2].x);
    assert.ok((await cube.locator(".loadout-artifact-image").boundingBox()).y < stoneBoxes[0].y);
    assert.ok((await cube.locator(".loadout-item-effects").boundingBox()).y >= stoneBoxes[0].bottom);
    assert.equal(await page.locator("#loadout-card-earnings-1 .is-empty").count(), 1);
    assert.match(await page.locator("#loadout-card-earnings-3").innerText(), /No Stone Slots/);
    await page.selectOption("#stone-earnings-0-0", "quantum-stone-4", {force:true}); await images(page);
    assert.match(await cube.innerText(), /\+5% shipping rate/); assert.doesNotMatch(await cube.innerText(), /2 × T4C Lunar/);
    assert.equal((await page.evaluate(() => VirtueApp.getConfig())).farm.loadouts.earnings[0].stones[0], "quantum-stone-4");
    await page.selectOption("#artifact-earnings-0", "puzzle-cube-1-0", {force:true}); await images(page);
    assert.match(await cube.innerText(), /-5% research cost/); assert.equal(await cube.locator(".loadout-stone-image").count(), 0); assert.equal(await page.locator("#stones-earnings-0 select").count(), 0);
    await page.selectOption("#artifact-earnings-0", "", {force:true}); assert.match(await cube.innerText(), /Empty Artifact Slot/);
    await load(page, farm);
    const savedBefore = await page.evaluate(() => VirtueApp.getConfig());
    await page.uncheck("#manualFarmArtifacts");
    assert.ok(await page.locator("#artifact-earnings-0").isHidden()); assert.ok(await cube.isVisible());
    assert.ok(await page.locator("#earnings-loadout-fields").evaluate(node => node.disabled));
    const automatic = structuredClone(farm); automatic.farm.manualFarmData = false;
    automatic.farm.artifactInventory = [...loadout.map(x => ({ id: x.artifactId, kind: "artifact", quantity: 1, stones: x.stones.filter(Boolean) })), { id: "quantum-stone-4", kind: "stone", quantity: 6 }, { id: "tachyon-stone-4", kind: "stone", quantity: 6 }, { id: "interstellar-compass-4-3", kind: "artifact", quantity: 1, stones: [] }, { id: "quantum-metronome-4-3", kind: "artifact", quantity: 1, stones: [] }, { id: "ornate-gusset-4-3", kind: "artifact", quantity: 1, stones: [] }];
    await load(page, automatic); await images(page);
    assert.equal(await page.locator("#earnings-set-source").innerText(), "Starting Farm Preview");
    const selected = await page.evaluate(() => VirtueApp.getConfig());
    for (const key of ["earnings", "delivery"]) for (let i = 0; i < 4; i++) assert.equal(await page.locator(`#loadout-card-${key}-${i}`).getAttribute("data-artifact-id"), selected.farm.loadouts[key][i]?.artifactId || "");
    await load(page, savedBefore); await images(page);
    assert.deepEqual((await page.evaluate(() => VirtueApp.getConfig())).farm.loadouts, savedBefore.farm.loadouts);
    for (const width of [1440, 1280, 1000, 800, 500, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "page overflow at " + width);
      assert.ok(await page.locator(".loadout-card").evaluateAll(nodes => nodes.every(n => n.scrollWidth <= n.clientWidth + 1)), "card overflow at " + width);
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
    const out = path.join(root, "tmp/loadout-artwork"); fs.mkdirSync(out, { recursive: true });
    await page.locator("#earnings-loadout-fields").screenshot({ path: path.join(out, "earnings-desktop.png") });
    const offline = await browser.newPage(); await offline.route("http://**/*", route => route.abort()); await offline.route("https://**/*", route => route.abort());
    await offline.goto("file://" + path.join(root, "index.html")); await offline.waitForFunction(() => !!globalThis.VirtueApp); await load(offline, farm); await images(offline);
    assert.deepEqual((await offline.evaluate(() => VirtueApp.getConfig())).farm.loadouts, farm.farm.loadouts);
    // Missing artwork retains the readable item, rarity, effects and manual controls.
    await page.evaluate(() => { document.querySelector("#loadout-card-earnings-0 img").src = "assets/brand/missing.png"; });
    await page.waitForFunction(() => document.querySelector("#loadout-card-earnings-0 img").hidden);
    assert.match(await cube.innerText(), /Puzzle Cube/); assert.match(await cube.innerText(), /-60% research cost/);
    await page.check("#manualFarmArtifacts"); assert.ok(await page.locator("#artifact-earnings-0").isEnabled());
    await page.click('[data-tab="account"]'); await page.selectOption("#proPermit", "false"); await page.evaluate(()=>VirtueApp.tab("artifacts"));
    assert.equal(await page.locator("#earnings-loadout-fields .loadout-card").count(), 2);
    assert.deepEqual(errors, []);
    console.log("PASS catalog checksums, artifact tier/rarity, horizontal sockets, exact effect text, manual edits/locks, automatic inventory sets, saved-farm roundtrip, layouts 1440–320px, offline artwork, missing-image fallback and Standard Permit slots.");
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
