'use strict';
const DEFAULT_ROUTE=require('./default-route.cjs'),Ships=require('./ships.cjs'),importMissions=require('./import-missions.cjs'),blankFarm=require('./blank-farm.cjs');
const S=require('./simulator.cjs'),importColleggtibles=require('./import-colleggtibles.cjs');const D=S.D;
const ACCOUNT_KEYS=['soulEggs','shiftCount','proPermit','claimed','delivered','epic','fuelTank','shipFlights','colleggtibles','colleggtibleTiers','colleggtibleOverrides'];
function camel(value){if(Array.isArray(value))return value.map(camel);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k.replace(/_([a-z])/g,(_,l)=>l.toUpperCase()),camel(v)]));return value;}
function specItem(spec,stone=false){if(!spec)return null;const name=typeof spec.name==='string'?enumName(spec.name):spec.name;const level=typeof spec.level==='string'?['INFERIOR','LESSER','NORMAL','GREATER','SUPERIOR'].indexOf(spec.level):spec.level||0;const rarity=typeof spec.rarity==='string'?['COMMON','RARE','EPIC','LEGENDARY'].indexOf(spec.rarity):spec.rarity||0;return (stone?D.stones:D.artifacts).find(x=>x.afxId===name&&x.afxLevel===level&&(stone||x.rarity===rarity))?.id||null;}
function enumName(name){const schema=require('./proto-schema.json');return schema.nested.ei.nested.ArtifactSpec.nested.Name.values[name];}
function importBackup(input,existing,now=Date.now()/1000,{scope='farm'}={}){
 const raw=camel(input),b=raw.backup||raw.response?.backup||raw;if(!b.virtue)throw Error('Backup has no Virtue progress.');
 const activeFarm=(b.farms||[]).find(f=>{const e=typeof f.eggType==='string'?({CURIOSITY:50,INTEGRITY:51,HUMILITY:52,RESILIENCE:53,KINDNESS:54}[f.eggType]):f.eggType;return e>=50&&e<=54;});
 const accountOnly=scope==='account'||scope==='auto'&&!activeFarm;
 if(!accountOnly&&!activeFarm)throw Error('No active Virtue farm in this backup. Open your Virtue farm in the game, sync, and retry. Automatic import can still load account information.');
 const farm=accountOnly?{}:activeFarm;
 const eggId=typeof farm.eggType==='string'?({CURIOSITY:50,INTEGRITY:51,HUMILITY:52,RESILIENCE:53,KINDNESS:54}[farm.eggType]):farm.eggType;
 const claimed=Array.from({length:5},(_,i)=>Number(b.virtue.eovEarned?.[i]||0)),delivered=Array.from({length:5},(_,i)=>Number(b.virtue.eggsDelivered?.[i]||0));
 const research=Object.fromEntries((farm.commonResearch||[]).map(r=>[r.id,Number(r.level||0)]));const epic=Object.fromEntries((b.game?.epicResearch||[]).filter(r=>D.epic.some(x=>x.id===r.id)).map(r=>[r.id,Number(r.level||0)]));
 const colleggtibles=importColleggtibles(b,existing?.farm);
 const db=b.artifactsDb?.virtueAfxDb;const items=db?.inventoryItems||[];const byId=new Map(items.map(x=>[String(x.itemId),x]));
 const slots=db?.activeArtifacts?.slots||b.virtue.activeAfx||[];const warnings=[...colleggtibles.warnings];
 let unknownItems=0,unknownStones=0;
 const inventory=items.filter(x=>x.artifact?.spec).map(x=>{const artifactId=specItem(x.artifact.spec),id=artifactId||specItem(x.artifact.spec,true);if(!id){if(![2,3,'INGREDIENT','STONE_INGREDIENT'].includes(x.artifact.spec.type))unknownItems++;return null;}return {id,kind:artifactId?'artifact':'stone',quantity:Number(x.quantity??1),stones:artifactId?(x.artifact.stones||[]).map(s=>{const id=specItem(s,true);if(!id)unknownStones++;return id;}):[],itemId:String(x.itemId)};}).filter(Boolean);
 if(unknownItems||unknownStones)warnings.push(unknownItems+' unknown inventory items and '+unknownStones+' unknown socketed stones were excluded from automatic sets.');
 const loadout=slots.map(slot=>{if(!slot.occupied)return {artifactId:null,stones:[]};const artifact=byId.get(String(slot.itemId))?.artifact||slot.artifact;if(!artifact?.spec){warnings.push('An equipped artifact could not be resolved.');return {artifactId:null,stones:[]};}
 const artifactId=specItem(artifact.spec);if(!artifactId)warnings.push('An equipped artifact is not in the pinned game data.');const stones=(artifact.stones||[]).map(s=>{const id=specItem(s,true);if(!id)warnings.push('An equipped stone could not be resolved.');return id;});return {artifactId,stones};});
 const pro=b.game?.permitLevel===1;while(loadout.length<(pro?4:2))loadout.push({artifactId:null,stones:[]});
 const habs=Array.from({length:4},(_,i)=>farm.habs?.[i]===19||farm.habs?.[i]===undefined?null:Number(farm.habs[i]));
 const vehicles=Array.from({length:17},(_,i)=>({id:farm.vehicles?.[i]===undefined||farm.vehicles?.[i]===12?null:Number(farm.vehicles[i]),cars:Number(farm.trainLength?.[i]||1)}));
 const cash=Math.max(0,Number(farm.unclaimedCash||0)||Number(farm.cashEarned||0)-Number(farm.cashSpent||0));
 // Tank upgrades are shared with the home farm. Virtue's AFX section holds
 // the separate fuel stock; its tankLevel may be absent or still zero.
 // Keep the old location only as a fallback for older JSON backups.
 const afx=b.virtue.afx||{},tankLevel=Math.min(7,Math.max(0,Number(b.artifacts?.tankLevel??afx.tankLevel??0))),fuelTank={capacity:Ships.TANKS[tankLevel],outputPerMinute:Ships.rateFor(Ships.TANKS[tankLevel]),amounts:Object.fromEntries(S.EGGS.map((egg,i)=>[egg,Number(afx.tankFuels?.[20+i]||0)]))};
 const fresh=!existing||existing.label?.startsWith('Blank farm')&&existing.plan?.target===1&&(existing.farm?.claimed||[]).every(n=>n===0);
 const loadouts={current:loadout.slice(0,pro?4:2)};
 for(const key of ['earnings','delivery'])if(Array.isArray(existing?.farm?.loadouts?.[key])&&(!fresh||existing.farm.loadouts[key].some(s=>s.artifactId))){
  const old=existing.farm.loadouts[key];
  try{
   loadouts[key]=S.validateLoadout(structuredClone(old).slice(0,pro?4:2),pro?4:2);
   if(old.length>loadouts[key].length)warnings.push(key+' artifact set reduced to fit the imported permit.');
  }catch{warnings.push('The previous '+key+' artifact set is incompatible and was replaced with the imported equipped set.');}
 }
 const backupTime=Number(b.settings?.lastBackupTime||b.approxTime||farm.lastStepTime||0),shipFlights=importMissions(b,Number(b.approxTime||backupTime),now,warnings);
 const retained=fresh?{}:Object.fromEntries(['videoDoubler','earningsMode','earningsScale','researchCostScale'].filter(k=>existing.farm?.[k]!==undefined).map(k=>[k,existing.farm[k]]));
 const cfg={
  version:1,label:'Imported Egg Inc Virtue farm',
  farm:{fuelTank,shipFlights,virtue:S.EGGS[eggId-50],claimed,delivered,research,epic,habs,vehicles,silos:Math.max(1,Number(farm.silosOwned||1)),cash,soulEggs:Number(b.game?.soulEggsD||b.game?.soulEggs||0),shiftCount:Number(b.virtue.shiftCount||0),proPermit:pro,videoDoubler:true,earningsMode:'offline',...retained,colleggtibles:colleggtibles.bonuses,colleggtibleTiers:colleggtibles.tiers,colleggtibleOverrides:colleggtibles.overrides,loadouts,activeSet:'current'},
  plan:{...structuredClone(existing?.plan||{}),start:now,target:!fresh&&existing?.plan?.target!==undefined?existing.plan.target:Math.min(490,claimed.reduce((a,b)=>a+b,0)+10),eventTimezone:existing?.plan?.eventTimezone||'America/Los_Angeles',maxDays:existing?.plan?.maxDays??90,maxSwitches:existing?.plan?.maxSwitches??12,sequence:structuredClone(existing?.plan?.sequence??DEFAULT_ROUTE),initialPhysicalPurchases:false,ships:{mode:'custom-two-visits',slots:existing?.plan?.ships?.slots??3,visits:Ships.plannedVisits(existing?.plan?.ships)}},
  importInfo:{timestamp:backupTime,warnings,inventory,flightSource:b.artifactsDb?'backup':'unavailable',colleggtibleSource:colleggtibles.source,colleggtibleMatches:colleggtibles.matched,colleggtibleMappedContracts:colleggtibles.mapped,colleggtibleUnresolved:colleggtibles.unresolved,scope:accountOnly?'account':'farm',currentVirtueFarmFound:!!activeFarm,source:'Egg Inc player backup'}
 };
 if(accountOnly){
  const base=structuredClone(existing||blankFarm(now));
  cfg.farm={...base.farm,...Object.fromEntries(ACCOUNT_KEYS.map(key=>[key,cfg.farm[key]]))};
  cfg.plan={...base.plan,target:fresh?cfg.plan.target:base.plan.target};
  cfg.label='Imported Egg Inc account data';
 }
 cfg.farm.manualAccountData=false;
 cfg.farm.manualFarmData=accountOnly?existing?.farm?.manualFarmData===true:false;
 if(Array.isArray(db?.inventoryItems)){
  cfg.farm.artifactInventory=inventory;
  const ArtifactSets=require('./artifact-optimizer.cjs'),model=ArtifactSets.compile(inventory,pro,cfg.farm.earningsMode);
  if(accountOnly&&cfg.farm.activeSet!=='current'&&cfg.farm.loadouts[cfg.farm.activeSet]){cfg.farm.loadouts.current=structuredClone(cfg.farm.loadouts[cfg.farm.activeSet]);cfg.farm.activeSet='current';}
  cfg.farm.loadouts={...cfg.farm.loadouts,earnings:structuredClone(model.earnings)};
  try{const preview=S.prepare({...cfg,plan:{start:now,target:claimed.reduce((a,b)=>a+b,0),strategy:'auto',ships:{mode:'none'}}},{artifactReplay:true});const rates=S.stats(preview.s,preview.c);cfg.farm.loadouts.earnings=ArtifactSets.bestEarnings(model,rates,S.researchNeeded(preview.s)).research.loadout;cfg.farm.loadouts.delivery=ArtifactSets.bestDelivery(model,rates).loadout;}catch{warnings.push('Delivery set selection will update once the starting farm values are valid.');}
  warnings.push('Research-aware earning and delivery sets were selected from owned Virtue gear and stones. The planner recalculates delivery gear after research; enable manual farm editing to override both sets.');
 }else{
  // A missing inventory is not an empty inventory, and must not authorize old
  // ownership data as a newly refreshed automatic snapshot.
  delete cfg.farm.artifactInventory;
  warnings.push('Virtue artifact inventory was not included. Retained sets are used; enable manual farm editing to configure them.');
 }
 delete cfg.farm.manualColleggtibles;
 delete cfg.farm.manualEpicResearch;
 delete cfg.farm.colleggtibleTiersInferred;
 if(!cfg.farm.colleggtibleOverrides)delete cfg.farm.colleggtibleOverrides;
 if(!pro)warnings.push('Standard permit: 2 artifacts, 2 silos and half offline earnings.');warnings.push('Imported values reflect the last saved backup. Population is treated as full. Video doubler is '+(cfg.farm.videoDoubler?'assumed active.':'configured inactive.'));
 if(farm.activeBoosts?.length)warnings.push('Active boosts are not simulated.');
 if(b.virtue.afx?.fuelingEnabled||b.virtue.afx?.tankFillingEnabled)warnings.push('Fuel diversion is modeled only during listed ship-fueling steps; pause other fueling for the predicted delivery rate.');
 warnings.push(accountOnly?'Account data was refreshed. Farm upgrades, equipped gear, gems, current Virtue, start time and planning goals are retained.':'Farm data and equipped artifacts were refreshed; the plan starts now. Planning goals are retained.');
 if(scope==='auto'&&!activeFarm)warnings.push('Account information has been loaded, but no current Virtue farm was found.');
 warnings.push('Tank output uses the standard rate for the imported capacity; adjust it for auxiliary upgrades.');
 if(!b.artifactsDb)warnings.push('The backup did not include mission records. Sync the game and use the green import arrow to refresh existing Virtue flights.');
 // Validate imported farm data independently of an unfinished planning draft.
 // Account-only loading must also work while the preserved farm is unfinished.
 const validationFarm=accountOnly?{...blankFarm(now).farm,...Object.fromEntries(ACCOUNT_KEYS.map(key=>[key,cfg.farm[key]]))}:cfg.farm;
 const snapshot=S.prepare({...cfg,farm:validationFarm,plan:{start:now,target:claimed.reduce((a,b)=>a+b,0),strategy:'auto',ships:{mode:'none'}}});
 if(snapshot.c.claimedTotal<100)warnings.push('Below 100 claimed TE, instant population recovery may be inaccurate.');return cfg;
}
function importAccount(input,existing,now=Date.now()/1000){return importBackup(input,existing,now,{scope:'account'});}
function importAll(input,existing,now=Date.now()/1000){return importBackup(input,existing,now,{scope:'auto'});}
module.exports={importBackup,importAccount,importAll,camel,specItem};
