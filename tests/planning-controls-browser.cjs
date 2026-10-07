"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), http = require("node:http");
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const S = require("../src/simulator.cjs"), blank = require("../src/blank-farm.cjs");
const root = path.resolve(__dirname, "..");
(async () => {
  const server = http.createServer((req,res) => {
    if (req.url === "/session.js") {res.setHeader("Content-Type","text/javascript");res.end('globalThis.VIRTUE_PROXY_TOKEN="synthetic-planning-controls";');return;}
    if (req.url.startsWith("/api/update/")) {res.setHeader("Content-Type","application/json");res.end(JSON.stringify({version:require("../package.json").version,pending:false,result:null}));return;}
    const name = new URL(req.url,"http://localhost").pathname.slice(1) || "index.html", file = path.join(root,name);
    if (name.includes("..") || !fs.existsSync(file)) {res.writeHead(404);res.end();return;}
    res.setHeader("Content-Type",({".js":"text/javascript",".css":"text/css",".png":"image/png",".webp":"image/webp"})[path.extname(file)] || "text/html");
    res.end(fs.readFileSync(file));
  });
  await new Promise(r=>server.listen(8787,"127.0.0.1",r));let browser;
  try {
    browser = await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR||"",FONTCONFIG_PATH:process.env.CHROMIUM_FONT_DIR||""}});
    const page = await browser.newPage({viewport:{width:1440,height:1000}}), errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto("http://127.0.0.1:"+server.address().port);await page.waitForFunction(()=>!!globalThis.VirtueApp);
    const planning = () => page.click('[data-tab="planning"]');
    const refresh = () => page.evaluate(()=>VirtueApp.refresh());
    const config = () => page.evaluate(()=>VirtueApp.getConfig());
    const load = async raw => {await page.evaluate(raw=>VirtueApp.loadFile(new File([JSON.stringify(raw)],"Synthetic-Controls.json")),raw);await planning();};
    const save = async () => {const pending=page.waitForEvent("download");await page.click("#save-file");return JSON.parse(fs.readFileSync(await(await pending).path(),"utf8"));};
    await planning();const fresh=await config();
    assert.ok(await page.isChecked("#autoTeAllocation"));assert.ok(await page.locator("#te-minimums").isHidden());assert.ok(await page.locator("#floor-0").isDisabled());
    assert.equal(await page.locator("#planPriority,#priorityMaxDays,#priorityMaxShifts,#target-default-help").count(),0);
    assert.equal(await page.inputValue("#actionSeconds"),"0.3");assert.equal(S.prepare(fresh).c.actionsSeconds,0.3);
    assert.equal(await page.locator("#start").evaluate(n=>n.closest("label").firstChild.textContent),"Plan Start (PC Local Time)");
    assert.equal(await page.locator("#target").getAttribute("aria-describedby"),null);
    const missingTiming=structuredClone(fresh);delete missingTiming.plan.actionSeconds;await load(missingTiming);assert.equal(await page.inputValue("#actionSeconds"),"0.3");
    const explicitTiming=structuredClone(fresh);explicitTiming.plan.actionSeconds=0;await load(explicitTiming);assert.equal(await page.inputValue("#actionSeconds"),"0");await load(fresh);
    await page.uncheck("#autoTeAllocation");assert.ok(await page.locator("#te-minimums").isVisible());assert.ok(await page.locator("#floor-0").isEnabled());
    const floors=[8,7,6,5,4];for (let i=0;i<5;i++)await page.fill("#floor-"+i,String(floors[i]));assert.equal(await refresh(),true);assert.deepEqual(S.prepare(await config()).c.floors,floors);
    await page.check("#autoTeAllocation");assert.equal(await refresh(),true);assert.deepEqual(S.prepare(await config()).c.floors,[0,0,0,0,0]);assert.deepEqual((await config()).plan.manualFloors,floors);
    const automatic=await save();assert.equal(automatic.plan.autoTeAllocation,true);assert.deepEqual(automatic.plan.floors,[0,0,0,0,0]);assert.deepEqual(automatic.plan.manualFloors,floors);assert.equal(automatic.plan.actionSeconds,0.3);
    await load(automatic);assert.ok(await page.isChecked("#autoTeAllocation"));assert.ok(await page.locator("#te-minimums").isHidden());await page.uncheck("#autoTeAllocation");for(let i=0;i<5;i++)assert.equal(await page.inputValue("#floor-"+i),String(floors[i]));
    // An invalid manual value can be disabled, saved, and later corrected.
    await page.fill("#floor-0","99");assert.equal(await refresh(),false);await page.check("#autoTeAllocation");assert.equal(await refresh(),true);const invalidInactive=await save();await load(invalidInactive);assert.ok(await page.locator("#te-minimums").isHidden());await page.uncheck("#autoTeAllocation");assert.equal(await page.inputValue("#floor-0"),"99");assert.equal(await refresh(),false);
    await page.fill("#floor-0","8");await page.fill("#target","20");assert.equal(await refresh(),false);await page.check("#autoTeAllocation");assert.equal(await refresh(),true,"hidden minimums do not constrain the total target");await page.fill("#target","40");
    await page.uncheck("#autoTeAllocation");assert.equal(await refresh(),true);const manual=await save();await load(manual);assert.equal(manual.plan.autoTeAllocation,false);assert.deepEqual(manual.plan.floors,floors);assert.ok(await page.locator("#te-minimums").isVisible());
    // Older files preserve explicit floors and defaults without a new flag.
    const legacy=blank();legacy.plan.target=40;legacy.plan.floors=floors;legacy.plan.maxDays=160;legacy.plan.maxSwitches=14;Object.assign(legacy.plan,{priority:"switches",priorityMaxDays:"",priorityMaxShifts:999});legacy.draftInputs={version:1,fields:{planPriority:{value:"switches"},priorityMaxDays:{value:""},priorityMaxShifts:{value:"999"}}};await load(legacy);assert.ok(!(await page.isChecked("#autoTeAllocation")));assert.deepEqual((await config()).plan.floors,floors);for(const key of ["priority","priorityMaxDays","priorityMaxShifts"])assert.equal(key in (await config()).plan,false);assert.equal(await refresh(),true);legacy.plan.floors=[0,0,0,0,0];await load(legacy);assert.ok(await page.isChecked("#autoTeAllocation"));
    // App-update recovery restores the same controls and manual goal semantics.
    const snapshot={version:1,savedAt:Date.now()/1000,config:manual,result:null,resultConfig:null,dirty:false,tab:"planning",loadoutTab:"current"};
    await page.evaluate(snapshot=>localStorage.setItem("virtue-optimizer.update-session.v1",JSON.stringify({version:"0.8.21",snapshot})),snapshot);await page.reload();await page.waitForFunction(()=>document.getElementById("notice").textContent.includes("session was restored after updating"));assert.ok(!(await page.isChecked("#autoTeAllocation")));assert.ok(await page.locator("#te-minimums").isVisible());assert.equal(await page.inputValue("#actionSeconds"),"0.3");assert.deepEqual((await config()).plan.floors,floors);
    const out=path.join(root,"tmp/planning-controls");fs.mkdirSync(out,{recursive:true});
    for (const width of [1440,1280,1050,1000]) {
      await page.setViewportSize({width,height:1000});await page.evaluate(()=>window.scrollTo(0,0));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"overflow at "+width);
      const boxes=await page.locator("#target,#autoTeAllocation,#te-minimums,#strategy,#start,#eventTimezone").evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().toJSON()));assert.ok(boxes[1].top>=boxes[0].bottom,"checkbox stays below the target");assert.ok(boxes[2].top>=boxes[1].bottom,"minimums stay below allocation");assert.ok(boxes[3].top>=boxes[2].bottom,"strategy follows target/allocation");assert.ok(boxes[4].top>boxes[3].bottom);assert.ok(Math.abs(boxes[4].top-boxes[5].top)<=1,"start and timezone share a row");assert.ok(boxes[5].left>=boxes[4].right,"timezone is beside the start");
      await page.screenshot({path:path.join(out,"manual-"+width+".png")});await page.check("#autoTeAllocation");await refresh();await page.screenshot({path:path.join(out,"automatic-"+width+".png")});await page.uncheck("#autoTeAllocation");await refresh();
    }
    await load(fresh);assert.ok(await page.isChecked("#autoTeAllocation"));assert.ok(await page.locator("#te-minimums").isHidden());assert.deepEqual(errors,[]);
    console.log("PASS planning order, removed priority fields, paired start/timezone, 0.3-second default and retained saved timing, automatic/manual allocation, saved files, obsolete drafts, legacy goals, update recovery, and desktop layouts 1440–1000px.");
  } finally {if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
