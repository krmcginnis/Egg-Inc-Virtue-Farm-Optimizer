"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),http=require("node:http"),crypto=require("node:crypto");
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||"playwright"),blank=require("../src/blank-farm.cjs"),S=require("../src/simulator.cjs"),Ships=require("../src/ships.cjs"),Num=require("../src/number-format.cjs"),Artifacts=require("../src/artifact-optimizer.cjs"),gearIcons=require("../assets/brand/artifact-icons.json");
const root=path.resolve(__dirname,"..");
(async()=>{
 const icons=require("../assets/brand/ship-icons.json");
 assert.equal(crypto.createHash("sha256").update(fs.readFileSync(path.join(root,icons.asset))).digest("hex"),icons.sha256);
 for(const ship of Ships.DATA.ships)assert.ok(icons.icons[ship.id]);
 const server=http.createServer((req,res)=>{const name=new URL(req.url,"http://localhost").pathname.slice(1)||"index.html",file=path.join(root,name);if(name.includes("..")||!fs.existsSync(file)){res.writeHead(404);res.end();return;}res.setHeader("Content-Type",({".js":"text/javascript",".css":"text/css",".png":"image/png"})[path.extname(name)]||"text/html");res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,"127.0.0.1",r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR||"",FONTCONFIG_PATH:process.env.CHROMIUM_FONT_DIR||""}});
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("http://127.0.0.1:"+server.address().port);await page.waitForFunction(()=>!!globalThis.VirtueApp);
  const farm=blank(1791388800);Object.assign(farm.farm,{cash:1e10,soulEggs:1e20,claimed:Array(5).fill(5),proPermit:true,manualFarmData:true,manualAccountData:true});Object.assign(farm.plan,{target:25,strategy:"user",autoSequence:false,maxSwitches:0,sequence:["curiosity"],shiftSeconds:0,actionSeconds:0});
  const slot=(id,...stones)=>({artifactId:id,stones:Array.from({length:S.AMAP[id].slots},(_,i)=>stones[i]||null)});
  const gear=[slot("puzzle-cube-4-3","quantum-stone-4",null,"tachyon-stone-4"),slot("interstellar-compass-4-3","quantum-stone-4"),slot("ornate-gusset-4-3","tachyon-stone-4"),slot("quantum-metronome-4-3","quantum-stone-4")];
  farm.farm.loadouts=Object.fromEntries(["current","earnings","delivery"].map(key=>[key,structuredClone(gear)]));
  const load=raw=>page.evaluate(raw=>VirtueApp.loadFile(new File([JSON.stringify(raw)],"Synthetic-Equipment.json")),raw);
  await load(farm);await page.click('[data-tab="farm"]');
  assert.equal(await page.locator("#loadout-tab-delivery,#copy-delivery").count(),0);assert.ok(await page.locator("#loadout-panel-delivery").isHidden());assert.equal(await page.locator('#activeSet option[value="delivery"]').getAttribute("hidden"),"");
  assert.deepEqual(await page.locator("#current-loadout-fields .artifact-slot").evaluateAll(ns=>ns.map(n=>Math.round(n.getBoundingClientRect().top))),Array(4).fill(Math.round((await page.locator("#current-loadout-fields .artifact-slot").first().boundingBox()).y)));
  for(const node of await page.locator("#current-loadout-fields .loadout-stone-socket").all()){const box=await node.boundingBox();assert.equal(box.width,box.height);assert.equal(await node.evaluate(n=>getComputedStyle(n).borderRadius),"50%");}
  assert.equal(await page.locator("#pick-stone-current-0-1").innerText(),"+");await page.click("#pick-stone-current-0-1");await page.locator('#gear-picker [data-item-id="tachyon-stone-4"]').click();assert.equal(await page.inputValue("#stone-current-0-1"),"tachyon-stone-4");
  const saved=await page.evaluate(()=>VirtueApp.getConfig());assert.deepEqual(saved.farm.loadouts.delivery,gear);await load(saved);await page.click('[data-tab="farm"]');assert.deepEqual((await page.evaluate(()=>VirtueApp.getConfig())).farm.loadouts,saved.farm.loadouts);
  const out=path.join(root,"tmp/equipment-flow");fs.mkdirSync(out,{recursive:true});await page.locator("#artifacts-card").screenshot({path:path.join(out,"artifacts-desktop.png")});
  await page.click('[data-tab="planning"]');assert.equal(await page.locator(".date-picker-launch").count(),0);assert.equal(await page.locator('[data-page="planning"] #assumptions').count(),0);
  await page.click("#start");assert.ok(await page.locator("#date-picker").isVisible());await page.getByRole("button",{name:"Ok",exact:true}).click();
  await page.click("#add-ship-1");await page.selectOption("#mission-1-0","EPIC");
  const before=await page.evaluate(()=>VirtueApp.getConfig());await page.click("#pick-ship-1-0");
  assert.equal(await page.locator("#gear-picker .gear-choice").count(),Ships.DATA.ships.length);assert.equal(await page.locator('#gear-picker [data-item-id=""]').count(),0);
  for(const ship of Ships.DATA.ships){const m=Ships.mission(ship.id,"EPIC"),choice=page.locator(`#gear-picker [data-item-id="${ship.id}"]`),text=await choice.innerText();assert.ok(await choice.locator(`[data-ship-icon="${ship.id}"]`).isVisible());assert.equal(await choice.locator('[data-unit-icon="gem"]>span').first().textContent(),String(Number(Num.format(m.cost).match(/^[\d.]+/)[0]))+Num.format(m.cost).replace(/^[\d.]+/,""));for(const [i,amount] of m.fuel.entries())if(amount)assert.ok((await choice.locator('[data-unit-icon="'+S.EGGS[i]+'"]').getAttribute("aria-label")).includes(Num.format(amount)));assert.ok(await choice.locator('[data-unit-icon="gem"] img').isVisible());assert.doesNotMatch(text,/gems|to afford|Affordable now/);assert.match(text,/~|>1 year|No current income/);assert.equal((await choice.locator(".ship-icon").boundingBox()).width,48);assert.equal(await choice.locator(".picker-detail-line").count(),3);assert.ok(await choice.locator(".picker-fuels .icon-amount").evaluateAll(ns=>ns.every(n=>Math.abs(n.getBoundingClientRect().top-ns[0].getBoundingClientRect().top)<1)));for(const i of m.fuel.map((n,i)=>n?i:-1).filter(i=>i>=0))assert.ok(await choice.locator('[data-unit-icon="'+S.EGGS[i]+'"] img').isVisible());}
  for(const width of [1440,1280,1050,1000]) {
    await page.setViewportSize({width,height:1000});
    assert.ok(await page.locator('#gear-picker .picker-fuels').evaluateAll(ns=>ns.every(n=>n.scrollWidth<=n.clientWidth+1 && n.getBoundingClientRect().width<=n.closest('.gear-choice').clientWidth-16)));
    assert.ok(await page.locator('#gear-picker .icon-amount').evaluateAll(ns=>ns.every(n=>{const number=n.firstElementChild.getBoundingClientRect(),symbol=n.querySelector('.unit-symbol').getBoundingClientRect();return Math.abs((number.top+number.bottom-symbol.top-symbol.bottom)/2)<1 && symbol.width===symbol.height;})));
    assert.ok(await page.locator('#gear-picker .picker-detail-lines').evaluateAll(ns=>ns.every(n=>parseFloat(getComputedStyle(n).fontSize)>=13)));
  }
  await page.screenshot({path:path.join(out,"ships-small-desktop.png")});
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:path.join(out,"ships-desktop.png")});
  await page.getByRole("searchbox",{name:"Filter items"}).fill("henliner");assert.equal(await page.locator("#gear-picker .gear-choice").count(),1);await page.keyboard.press("Escape");assert.equal(await page.evaluate(()=>document.activeElement.id),"pick-ship-1-0");assert.deepEqual(await page.evaluate(()=>VirtueApp.getConfig()),before);
  const previewRaw=structuredClone(before);previewRaw.plan.ships={mode:"none",slots:3};const preview=S.prepare(previewRaw),income=S.stats(preview.s,preview.c).eventEarning;
  await page.click('[data-tab="farm"]');await page.fill("#cash",String(Ships.DATA.ships[0].gemCost-income*125.25));await page.click('[data-tab="planning"]');await page.click("#pick-ship-1-0");assert.match(await page.locator('#gear-picker [data-item-id="CHICKEN_ONE"]').innerText(),/~2m/);await page.keyboard.press("Escape");
  const noIncome=structuredClone(before);noIncome.farm.cash=0;noIncome.farm.habs=Array(4).fill(null);await load(noIncome);await page.click('[data-tab="planning"]');await page.click("#pick-ship-1-0");assert.match(await page.locator('#gear-picker [data-item-id="CHICKEN_ONE"]').innerText(),/No current income/);await page.keyboard.press("Escape");await load(before);await page.click('[data-tab="planning"]');
  await page.click("#pick-ship-1-0");await page.locator('#gear-picker [data-item-id="CHICKEN_NINE"]').click();assert.equal(await page.inputValue("#ship-1-0"),"CHICKEN_NINE");assert.equal(await page.inputValue("#mission-1-0"),"EPIC");assert.equal(await page.evaluate(()=>document.activeElement.id),"pick-ship-1-0");
  await page.click("#add-ship-1");await page.getByRole("button",{name:"Move H1 Ship Mission 2 Up",exact:true}).click();assert.equal(await page.evaluate(()=>document.activeElement.id),"pick-ship-1-0");assert.equal(await page.inputValue("#ship-1-1"),"CHICKEN_NINE");
  await page.click('[data-tab="help"]');assert.ok(await page.locator("#assumptions").isVisible());
  // A real replayed H2 equip uses its exact saved slots, not a starting preview.
  const raw=structuredClone(farm);raw.farm.virtue="humility";raw.farm.cash=1e20;Object.assign(raw.plan,{maxSwitches:2,sequence:["humility","kindness","humility"]});
  const autoGear=structuredClone(gear);autoGear[0].stones[0]="tachyon-stone-4";const autoKey=Artifacts.key(autoGear);
  const {s,c}=S.prepare(raw,{artifactSets:{[autoKey]:autoGear}});let state=S.buy(s,c,{type:"set",set:"earnings"});state=S.advance(state,c,state.t+1,"H1",true,"online");state=S.buy(state,c,{type:"shift",egg:4});state=S.advance(state,c,state.t+1,"K1",true,"online");state=S.buy(state,c,{type:"shift",egg:2});const inheritedState=state;state=S.buy(state,c,{type:"set",set:autoKey,loadout:autoGear,setLabel:"Delivery"});state=S.advance(state,c,state.t+1,"H2",true,"online");
  const result={version:1,start:c.start,end:state.t,seconds:state.t-c.start,target:25,actions:S.history(state),frontier:[],explored:0,method:"Synthetic equipment replay",termination:"complete",artifactRecommendations:{delivery:[]}};
  await load({version:1,config:raw,result});assert.match(await page.locator("#notice").innerText(),/replayed/);
  const h2=page.locator(".shift-summary").filter({has:page.locator(".shift-title",{hasText:"H2"})});assert.equal(await h2.count(),1);
  let expected=[autoGear[2],autoGear[3],autoGear[1],autoGear[0]];
  const inspect=async host=>{assert.deepEqual(await host.locator(".loadout-card").evaluateAll(ns=>ns.map(n=>n.dataset.artifactId)),expected.map(s=>s.artifactId));for(const [i,slot]of expected.entries()){const card=host.locator(".loadout-card").nth(i);assert.equal(await card.locator(".loadout-stone-socket").count(),S.AMAP[slot.artifactId].slots);assert.deepEqual(await card.locator(".loadout-stone-image").evaluateAll(ns=>ns.map(n=>n.getAttribute("src"))),slot.stones.filter(Boolean).map(id=>{const stone=S.SMAP[id];return "assets/brand/"+gearIcons.icons[stone.afxId+":"+stone.afxLevel];}));}assert.equal(await host.locator("button,select").count(),0);};
  await inspect(h2.locator(":scope>summary .artifact-strip"));await h2.locator(":scope>summary").click();await inspect(h2.locator(".quick-guide .artifact-strip"));assert.deepEqual((await page.evaluate(()=>VirtueApp.getResult())).actions,result.actions);
  await h2.screenshot({path:path.join(out,"h2-desktop.png")});
  for(const width of [1440,1280,1050,1000]){await page.setViewportSize({width,height:1000});for(const section of ["farm","planning","help","results"]){await page.click(`[data-tab="${section}"]`);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),section+" overflow "+width);}const cards=await h2.locator(":scope>summary .artifact-strip .loadout-card").first().boundingBox();assert.ok(cards);assert.ok(await h2.locator(":scope>summary .artifact-strip").evaluate(n=>n.scrollWidth<=n.clientWidth+1));}
  await h2.screenshot({path:path.join(out,"h2-small-desktop.png")});
  state=S.advance(inheritedState,c,inheritedState.t+1,"H2 inherited gear",true,"online");const inheritedResult={...result,actions:S.history(state)};await load({version:1,config:raw,result:inheritedResult});assert.match(await page.locator("#notice").innerText(),/replayed/);expected=[gear[2],gear[3],gear[1],gear[0]];await inspect(h2.locator(":scope>summary .artifact-strip"));await h2.locator(":scope>summary").click();await inspect(h2.locator(".quick-guide .artifact-strip"));assert.match(await h2.locator(":scope>summary").innerText(),/carried into H2/);
  assert.deepEqual(errors,[]);
  console.log("PASS compact artifact rows, circular plus sockets/editing/save, removed delivery controls and retained data, input-only date dialog, illustrated ships with mission-specific costs/fuel/estimates/cancel/order/focus, assumptions on Help, actual replayed H2 gear in both views with stable family order and unchanged actions, 1440–1000px.");
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
