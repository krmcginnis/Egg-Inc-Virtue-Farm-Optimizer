'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {cases,farm,run,research}=require('./purchase-decisions.cjs'),S=require('../src/simulator.cjs');
const root=path.resolve(__dirname,'..');
function document(test){return {version:1,config:test.raw,result:{version:1,start:test.c.start,end:test.end.t,seconds:test.end.t-test.c.start,target:test.c.target,actions:test.actions,frontier:[],explored:0,method:'Synthetic purchase explanations',termination:'complete'}};}
(async()=>{
  const server=http.createServer((req,res)=>{
    const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html',file=path.join(root,name);
    if(name.includes('..')||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(name)]||'text/html');res.end(fs.readFileSync(file));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR||'',FONTCONFIG_PATH:process.env.CHROMIUM_FONT_DIR||''}});
    const page=await browser.newPage({viewport:{width:1440,height:1000},timezoneId:'America/Los_Angeles'}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!globalThis.VirtueApp);
    const load=async doc=>{await page.evaluate(doc=>VirtueApp.loadFile(new File([JSON.stringify(doc)],'Synthetic-Plan.json'),{planOnly:true}),doc);assert.match(await page.locator('#notice').innerText(),/Saved plan loaded and replayed/);};
    const first=cases();await load(document(first));
    const original=await page.evaluate(()=>VirtueApp.getResult().actions),group=page.locator('.shift-summary').first();
    await group.locator(':scope>summary').click();const why=group.locator('.purchase-decisions');assert.ok(!await why.evaluate(n=>n.open));
    await why.locator(':scope>summary').click();
    assert.match(await why.innerText(),/No immediate earnings gain.*Adds 1 vehicle slot for later Kindness purchases/s);
    assert.match(await why.locator('.research-icon').getAttribute('title'),/Vehicle Reliability\nIncrease fleet size by 1.*later Kindness/s);
    const guide=group.locator('.guide-item.research');assert.match(await guide.locator('.purchase-explanation').innerText(),/later Kindness purchases/);
    assert.equal(await guide.locator('.purchase-explanation').getAttribute('data-reasons'),'current capacity');
    assert.match(await guide.locator('.research-icon').getAttribute('title'),/No immediate earnings gain/);
    await group.locator('.full-breakdown>summary').click();assert.match(await group.locator('.action.research .purchase-explanation').innerText(),/later Kindness/);
    assert.deepEqual(await page.evaluate(()=>VirtueApp.getResult().actions),original,'opening explanation panels never edits a replay action');
    const download=page.waitForEvent('download');await page.getByRole('button',{name:'Save Plan',exact:true}).click();const saved=JSON.parse(fs.readFileSync(await(await download).path(),'utf8'));
    // Do not trust explanations cached in a saved file.
    saved.result.summary.shifts[0].researchDecisions[0].explanation.text='UNTRUSTED SAVED EXPLANATION';
    await load(saved);assert.ok(!(await page.locator('#result-content').innerText()).includes('UNTRUSTED'));assert.deepEqual(await page.evaluate(()=>VirtueApp.getResult().actions),original);
    const both=farm();both.farm.research.comfy_nests=29;
    await load(document(run(both,[research('nutritional_sup')])));const earned=page.locator('.shift-summary').first();await earned.locator(':scope>summary').click();
    assert.match(await earned.locator('.guide-item .purchase-explanation').innerText(),/Raises earnings now by 25%.*Unlocks Tier 2/);
    assert.equal(await earned.locator('.guide-item .purchase-explanation').getAttribute('data-reasons'),'earnings tier');
    assert.match(await earned.locator(':scope>summary .research-icon').getAttribute('title'),/25%.*Unlocks Tier 2/s);
    // Grouped Max Tiers summaries keep all individual decisions discoverable.
    const max=farm();max.farm.research=Object.fromEntries(S.D.research.map(r=>[r.id,r.tier===1?r.levels-1:0]));
    const maxRecipe=S.D.research.map((r,i)=>({r,i})).filter(x=>x.r.tier===1).map(x=>({type:'research',i:x.i}));
    await load(document(run(max,maxRecipe)));
    const maxed=page.locator('.shift-summary').first();assert.match(await maxed.locator(':scope>summary').innerText(),/Max Tiers 1/);await maxed.locator(':scope>summary').click();await maxed.locator('.purchase-decisions>summary').click();assert.equal(await maxed.locator('.purchase-decisions li').count(),4);
    await page.getByRole('button',{name:'Expand All',exact:true}).click();assert.equal(await page.locator('.full-breakdown .action.research .purchase-explanation').count(),4);
    if(process.env.CURRENT_PLAN){
      const actual=JSON.parse(fs.readFileSync(process.env.CURRENT_PLAN,'utf8'));await load(actual);
      assert.equal(await page.evaluate(()=>VirtueApp.getResult().end),actual.result.end,'explanations preserve the verified current-farm finish');
      assert.equal(await page.evaluate(()=>VirtueApp.getResult().switches),12);
      const c1=page.locator('.shift-summary').first();await c1.locator(':scope>summary').click();await c1.locator('.purchase-decisions>summary').click();
      assert.match(await c1.locator('.purchase-decisions [data-research-index="11"] .purchase-explanation').innerText(),/No immediate earnings gain.*Adds 2 vehicle slots for later Kindness/);
    }
    const out=path.join(root,'tmp/purchase-decisions');fs.mkdirSync(out,{recursive:true});
    for(const width of [1920,1440,1000]){
      await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no overflow at '+width);
      const shift=page.locator('.shift-summary').first();await shift.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'explanations-'+width+'.png')});
      await shift.locator('.quick-guide').screenshot({path:path.join(out,'guide-'+width+'.png')});
      const heights=await shift.locator('.guide-item.research').evaluateAll(rows=>rows.map(row=>{
        const caption=row.querySelector('.research-caption').getBoundingClientRect(),reason=row.querySelector('.purchase-explanation').getBoundingClientRect();return {captionBottom:caption.bottom,reasonTop:reason.top};
      }));assert.ok(heights.every(h=>h.reasonTop>=h.captionBottom-1),'explanation stays below the purchase heading');
    }
    await page.click('[data-tab="help"]');assert.match(await page.locator('#help-timeline+ p').innerText(),/timeline/i);assert.match(await page.locator('[data-page="help"]').innerText(),/Why These Purchases/);
    assert.deepEqual(errors,[]);console.log('PASS research explanations in Summary, Quick Guide, Full Breakdown and hover tooltips; multiple roles, max-tier groups, trusted replay, save/load and desktop layouts.');
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
