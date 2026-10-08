'use strict';
const Route=require('./switch-sequence.cjs'),Ships=require('./ships.cjs'),Artifacts=require('./artifact-optimizer.cjs');
const Strategy=require('./planning-strategy.cjs');
const Sleep=require('./sleep-schedule.cjs');
const D=require('./game-data.json'),C=require('./colleggtibles.cjs');
const EGGS=['curiosity','integrity','humility','resilience','kindness'];
const NAME=['Curiosity','Integrity','Humility','Resilience','Kindness'];
const RMAP=Object.fromEntries(D.research.map((r,i)=>[r.id,i]));
const researchCategories=D.research.map(r=>({source:r.categories,values:r.categories.split(',')}));
const AMAP=Object.fromEntries(D.artifacts.map(a=>[a.id,a]));
const SMAP=Object.fromEntries(D.stones.map(a=>[a.id,a]));
const NUMBERS={K:1e3,M:1e6,B:1e9,T:1e12,q:1e15,Q:1e18,s:1e21,S:1e24,o:1e27,N:1e30,d:1e33,U:1e36,D:1e39,Td:1e42,qd:1e45,Qd:1e48,Sd:1e51};
function number(value,name='Value',min=0,max=Infinity,integer=false){
 let n;if(typeof value==='number')n=value;else{const text=String(value).trim().replace(/,/g,'');const m=text.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*([A-Za-z]*)$/i);if(!m||m[2]&&!(m[2] in NUMBERS))throw Error(name+': use a number, scientific notation, or a case-sensitive game suffix (q/Q).');/* Convert the decimal and suffix together to avoid rounding twice. */if(m[2]){const [mantissa,exponent='0']=m[1].toLowerCase().split('e');n=Number(mantissa+'e'+(Number(exponent)+Math.round(Math.log10(NUMBERS[m[2]]))));}else n=Number(m[1]);}
 if(!Number.isFinite(n)||n<min||n>max||integer&&!Number.isInteger(n))throw Error(name+` must be ${integer?'a whole number ':''}between ${min} and ${max===Infinity?'a finite value':max}.`);return n;
}
function clone(s){return {...s,r:s.r.slice(),h:s.h.slice(),v:s.v.map(v=>({...v})),eggs:s.eggs.slice(),...(s.fuel?{fuel:s.fuel.slice()}:{}),...(s.shipFlights?{shipFlights:s.shipFlights.map(x=>({...x}))}: {})};}
function mul(r,l){return r.levels_compound==='multiplicative'?r.per_level**l:1+r.per_level*l;}
function countTE(eggs){let lo=0,hi=D.te.length;while(lo<hi){let m=(lo+hi)>>1;if(eggs>=D.te[m])lo=m+1;else hi=m;}return lo;}
function teByEgg(s,c){return s.eggs.map((n,i)=>Math.max(c.claimed[i],countTE(n)));}
function totalTE(s,c){return teByEgg(s,c).reduce((a,b)=>a+b,0);}
function reached(s,c){if(c.ships?.enabled&&!s.shipsDone)return false;const te=teByEgg(s,c);return te.reduce((a,b)=>a+b,0)>=c.target&&te.every((n,i)=>n>=c.floors[i]);}
function modifiers(loadout){
 const result={eggValue:1,hab:1,shipping:1,away:1,laying:1,research:1,ihr:1};const map={'egg value':'eggValue','hab capacity':'hab','shipping rate':'shipping','away earnings':'away','egg laying rate':'laying','research cost':'research','internal hatchery rate':'ihr'};
 for(const slot of loadout){const a=AMAP[slot.artifactId];if(!a)continue;for(const item of [a,...(slot.stones||[]).map(id=>SMAP[id]).filter(Boolean)]){const k=map[item.target];if(k)result[k]*=1+item.delta;}}return result;
}
function validateLoadout(raw,limit=4){if(!Array.isArray(raw)||raw.length>limit)throw Error('Too many equipped artifacts for the permit.');const seen=new Set();return raw.map((slot,i)=>{
 if(!slot.artifactId){if((slot.stones||[]).some(Boolean))throw Error('Stones require an equipped artifact.');return {artifactId:null,stones:[]};}
 const a=AMAP[slot.artifactId];if(!a)throw Error('Unknown artifact in slot '+(i+1));if(seen.has(a.family))throw Error('Equip only one artifact per family.');seen.add(a.family);
 const stones=slot.stones||[];if(stones.filter(Boolean).length>a.slots||stones.length>a.slots)throw Error(a.label+' has only '+a.slots+' stone sockets.');for(const id of stones)if(id&&!SMAP[id])throw Error('Unknown stone: '+id);
 return {artifactId:a.id,stones:stones.map(id=>id||null)};});}
// Only immutable calendar boundaries are shared. Farms, search states and
// previous plans are never cached across searches. Bound memory to four windows.
const calendarWindows=new Map();
// Game events always use 09:00 Pacific, following PST/PDT. The selected plan
// timezone belongs to sleep and date display, never to this event calendar.
function calendar(start,end){const key=start+':'+end;if(calendarWindows.has(key))return calendarWindows.get(key);const fmt=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',weekday:'short',hour:'2-digit',hourCycle:'h23'});
 function event(t){const p=Object.fromEntries(fmt.formatToParts(new Date(t*1000)).map(x=>[x.type,x.value]));const h=+p.hour;return {earnings:(p.weekday==='Mon'&&h>=9)||(p.weekday==='Tue'&&h<9)?2:1,sale:(p.weekday==='Fri'&&h>=9)||(p.weekday==='Sat'&&h<9)?0.3:1};}
 const out=[{t:start,...event(start)}];let prev=out[0];for(let t=(Math.floor(start/900)+1)*900;t<=end+7*86400;t+=900){const e=event(t);if(e.earnings!==prev.earnings||e.sale!==prev.sale){out.push({t,...e});prev=e;}}out.push({t:Infinity,earnings:1,sale:1});out.forEach(Object.freeze);Object.freeze(out);if(calendarWindows.size>=4)calendarWindows.delete(calendarWindows.keys().next().value);calendarWindows.set(key,out);return out;}
function at(c,t){let lo=0,hi=c.calendar.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(c.calendar[m].t<=t+1e-6)lo=m;else hi=m;}return {...c.calendar[lo],next:c.calendar[lo+1].t};}
function prepare(raw,opts={}){
 if(!raw||raw.version!==1||!raw.farm)throw Error('Unsupported farm file. Use a version 1 farm configuration.');const f=raw.farm,p=raw.plan||{};
 const start=number(p.start||Date.now()/1000,'Start timestamp',1);const maxDays=number(p.maxDays??90,'Planning limit (days)',1,366,true);
 const claimed=(f.claimed||[]).map((n,i)=>number(n,NAME[i]+' claimed TE',0,98,true));if(claimed.length!==5)throw Error('Enter claimed Truth Eggs for all five Virtues.');
 // Claimed TE prove these lifetime milestones were already delivered. Fresh
 // ascensions reset the farm, not lifetime delivery totals. Missing/zero totals
 // therefore use the minimum established by claimed TE, never guessed progress.
 const eggs=(f.delivered||[]).map((n,i)=>Math.max(number(n,NAME[i]+' delivered eggs'),claimed[i]?D.te[claimed[i]-1]:0));if(eggs.length!==5)throw Error('Enter delivered eggs for all five Virtues.');
 let egg=EGGS.indexOf(f.virtue);if(egg<0)throw Error('Select an active Virtue.');
 const automatic=Strategy.automatic(p);
 let sequence=Route.normalize(automatic&&p.strategyVersion>=2?undefined:p.sequence,f.virtue,{required:p.strategy==='user'});const fullSequence=sequence.slice();
 // New searches derive their full route allowance. Unflagged saved plans must
 // still replay with the exact switch and sale limits under which they ran.
 const maxSwitches=number(p.solverVersion>=2&&automatic?(p.maxShifts??12):p.saleComparisonVersion===1?(automatic?Route.defaultSwitches(f.virtue):fullSequence.length-1):(p.maxSwitches??12),'Maximum additional switches',0,30,true);sequence=sequence.slice(0,maxSwitches+1);
 const research=f.research||{};for(const k of Object.keys(research))if(!(k in RMAP))throw Error('Unknown research: '+k);
 const r=D.research.map(r=>number(research[r.id]??0,r.name+' level',0,r.levels,true));
 // A persisted game farm must satisfy tier prerequisites for purchased levels.
 for(const data of D.research){if(r[RMAP[data.id]]>0&&data.tier>1&&D.research.reduce((n,x,i)=>n+(x.tier<data.tier?r[i]:0),0)<D.tierUnlock[data.tier-1])throw Error(data.name+' is purchased while its tier is locked.');}
 const boundedEpic=new Set(['epic_egg_laying','transportation_lobbyist','cheaper_research','cheaper_contractors','bust_unions','silo_capacity','afx_mission_time']);const epic={};for(const x of D.epic)epic[x.id]=number((f.epic||{})[x.id]??0,x.name+' epic level',0,boundedEpic.has(x.id)?x.levels:10000,true);
 const base={earnings:1,awayEarnings:1,ihr:1,elr:1,shippingCap:1,habCap:1,vehicleCost:1,habCost:1,researchCost:1};const col={...base},combined=f.colleggtibleTiers?C.combine(f.colleggtibleTiers,f.colleggtibleOverrides):f.colleggtibles||{};for(const k of Object.keys(base))col[k]=number(combined[k]??1,k+' colleggtible multiplier',.000001,1000);
 const pro=f.proPermit!==false,loadouts={},mods={};for(const [key,l] of Object.entries({...f.loadouts,...opts.artifactSets})){loadouts[key]=validateLoadout(l,pro?4:2);mods[key]=modifiers(loadouts[key]);}if(!Object.keys(loadouts).length){loadouts.current=[];mods.current=modifiers([]);}const set=f.activeSet||Object.keys(loadouts)[0];if(!loadouts[set])throw Error('Active artifact set does not exist.');
 const h=(f.habs||[]).map(n=>n===null?null:number(n,'Hab type',0,18,true));if(h.length!==4)throw Error('Use exactly four habitat slots.');
 const v=(f.vehicles||[]).map(x=>({id:x.id===null?null:number(x.id,'Vehicle type',0,11,true),cars:number(x.cars??1,'Train length',1,10,true)}));if(v.length!==17)throw Error('Use 17 fleet slots, with null for unused slots.');
 const floors=(p.floors||[0,0,0,0,0]).map((n,i)=>number(n,NAME[i]+' minimum TE',0,98,true));if(floors.length!==5)throw Error('Use five per-Virtue minimum TE values.');
 const target=number(p.target??claimed.reduce((a,b)=>a+b,0)+10,'Target total TE',0,490,true);if(floors.reduce((a,b)=>a+b,0)>target)throw Error('Per-Virtue minimums exceed the overall target.');
 const c={start,end:start+maxDays*86400,claimed,claimedTotal:claimed.reduce((a,b)=>a+b,0),target,floors,epic,col,loadouts,mods,pro,sequence:sequence.map(e=>EGGS.indexOf(e)),zone:p.eventTimezone||'America/Los_Angeles',maxSwitches,enforceOpeningCaps:opts.enforceOpeningCaps===true,
 autoSequence:automatic,strategy:p.strategy||'auto',stagedSales:number(p.saleComparisonVersion===1?3:(p.stagedSales??3),'Maximum research sales',1,6,true),openingStepMinutes:30,c1MaxMinutes:p.solverVersion>=2?Infinity:number(p.c1MaxMinutes??60,'C1 maximum minutes',1,1440,true),k1MaxMinutes:p.solverVersion>=2?Infinity:number(p.k1MaxMinutes??60,'K1 maximum minutes',1,1440,true),offlineMinSeconds:60*number(p.minOfflineMinutes??1,'Minimum offline break minutes',1,1440,true),initialPhysicalPurchases:false,video:f.videoDoubler!==false?2:1,earningsMode:f.earningsMode||'offline',shiftSeconds:number(p.shiftSeconds??5,'Seconds per switch',0,3600),actionsSeconds:number(p.actionSeconds??0,'Seconds per purchase',0,3600),
 researchCostScale:number(f.researchCostScale??1,'Research cost calibration',.000001,1000000),earningsScale:number(f.earningsScale??1,'Earnings calibration',.000001,1000000)};
 if(!opts.artifactReplay&&f.manualFarmData!==true&&Array.isArray(f.artifactInventory))c.artifactModel=Artifacts.compile(f.artifactInventory,pro,c.earningsMode);
 c.ships=Ships.prepare(f,p,number);
 if(!['auto','wasmegg','user','free'].includes(c.strategy))throw Error('Select a valid planning strategy.');if(c.strategy==='wasmegg'&&!c.autoSequence)throw Error('Enable automatic visits for Optimized Sequence.');
 if(!['quick','balanced','thorough'].includes(p.searchEffort??'balanced'))throw Error('Select a valid search effort.');
 if(!['offline','online'].includes(c.earningsMode))throw Error('Earnings mode must be offline or online.');
 // Validate the selected sleep/display zone even when sleep is disabled.
 new Intl.DateTimeFormat('en-US',{timeZone:c.zone});c.calendar=calendar(start,c.end);
 c.sleep=Sleep.forPlan(p,start,c.end);
 const enteredSilos=number(f.silos??1,'Silos',0,pro?10:2,true);
 // Old saved timelines used zero silos and must replay with their original
 // purchase counts. Fresh searches use the game's free starting silo.
 const s={t:start,cash:number(f.cash??0,'Current gems'),soul:number(f.soulEggs??1e18,'Soul Eggs'),shiftCount:number(f.shiftCount??0,'Lifetime switch count',0,10000,true),lost:0,stage:0,egg,r,h,v,eggs,set,silos:opts.oneStartingSilo?Math.max(1,enteredSilos):enteredSilos,path:null,depth:0,openingMask:egg===0?1:egg===4?2:0,openingFirst:egg===0||egg===4,visitStart:start,fuel:c.ships.stored.slice(),shipsDone:!c.ships.enabled,shipRuns:0,shipRunStage:-1,shipFlights:(f.shipFlights||[]).map(x=>({...x,slot:number(x.slot,'Mission slot',1,3,true),returnAt:number(x.returnAt,'Ship return time',0)}))};
 if(c.ships.mode==='custom-two-visits'&&c.autoSequence&&c.ships.visits===2){const minimum=egg===2?(Ships.ready(s,c)?2:4):3;if(c.maxSwitches<minimum)throw Error('Two Humility ship visits need at least '+minimum+' additional switches from this starting farm.');}
 if(c.ships.enabled){
  const neededEggs=c.ships.targets.map((n,i)=>n>s.fuel[i]+Math.max(1,n)*1e-12?i:-1).filter(i=>i>=0);
  if(egg===2&&neededEggs.length&&!['efficient-two-visits','custom-two-visits'].includes(c.ships.mode))throw Error('Starting on Humility requires the non-Humility ship fuel to be stored already.');
  if(!c.autoSequence){
   if(c.ships.visits===2&&c.sequence.filter(e=>e===2).length<2){const secondH=fullSequence.indexOf('humility',fullSequence.indexOf('humility')+1);
    if(secondH>=0)throw Error('Maximum New Switches is '+maxSwitches+', so this sequence stops before H2 (switch '+secondH+'). Set it to '+(fullSequence.length-1)+' for the full sequence from '+NAME[egg]+'.');
    throw Error('The ship plan requires two Humility visits. Include a second H in the fixed sequence.');}
   const firstH=c.sequence.indexOf(2);if(firstH<0)throw Error('Include Humility in the switch sequence to launch planned ships.');
   Ships.configureRoute(c);
   const missing=Ships.collectionTargets(s,c).map((n,i)=>n>s.fuel[i]+Math.max(1,n)*1e-12?i:-1).filter(i=>i>=0&&!c.sequence.slice(0,firstH).includes(i));
   if(missing.length)throw Error('Visit '+missing.map(i=>NAME[i]).join(', ')+' before H1, or enter enough stored fuel for all launches before its next refill.');
  }
 }

 const snap=stats(s,c);if(v.some((v,i)=>v.id!==null&&i>=snap.slots))throw Error('An occupied fleet slot is not unlocked by research.');if(v.some(v=>v.id===11&&v.cars>snap.trainLength))throw Error('Train exceeds the researched maximum length.');
 const te=teByEgg(s,c);let reachable=te.slice();for(const e of c.autoSequence&&c.maxSwitches>0?[0,1,2,3,4]:c.sequence)reachable[e]=98;
 if(reachable.reduce((a,b)=>a+b,0)<c.target||c.floors.some((n,i)=>n>reachable[i]))throw Error('Target is unreachable with this switch sequence and budget. Include the other needed Virtues.');
 if(c.artifactModel){c.earningLoadout=Artifacts.bestEarnings(c.artifactModel,snap,researchNeeded(s)).research.loadout;c.earningArtifactKey=registerAutomatic(c,c.earningLoadout,'earnings');}
 return {s,c};
}
// Purchase discounts depend on fixed inputs and the active set, not production
// research or fleet layout. Pricing should not recalculate the entire farm.
function costModifiers(s,c){return {researchMult:(1-.05*c.epic.cheaper_research)*c.col.researchCost*c.mods[s.set].research*c.researchCostScale,habCostMult:(1-.05*c.epic.cheaper_contractors)*c.col.habCost,vehicleCostMult:(1-.05*c.epic.bust_unions)*c.col.vehicleCost};}
function stats(s,c){
 const m=c.mods[s.set];let eggValue=1,layMult=1,habMult=1,portalMult=1,shipMult=1,hoverMult=1,loopMult=1,slots=4;
 for(let i=0;i<D.research.length;i++){const r=D.research[i],l=s.r[i];if(!l)continue;let categories=researchCategories[i];if(!categories||categories.source!==r.categories)categories=researchCategories[i]={source:r.categories,values:r.categories.split(',')};const k=categories.values,v=mul(r,l);
 if(k.includes('egg_value'))eggValue*=v;if(k.includes('egg_laying_rate'))layMult*=v;
 if(k.includes('hab_capacity')){if(r.id==='wormhole_dampening')portalMult*=v;else habMult*=v;}
 if(k.includes('shipping_capacity')){if(r.id==='hover_upgrades')hoverMult*=v;else if(r.id==='hyper_portalling')loopMult*=v;else shipMult*=v;}
 if(k.includes('fleet_size')&&r.id!=='micro_coupling')slots+=l*r.per_level;}
 const baseHabs=s.h.map(id=>id===null?0:D.habs[id].baseHabSpace*habMult*(id>=17?portalMult:1)*c.col.habCap);
 const hab=baseHabs.reduce((n,cap)=>n+Math.ceil(cap*m.hab),0);
 const laying=hab*(2/60)*layMult*(1+.05*c.epic.epic_egg_laying)*c.col.elr*m.laying;
 const baseShipping=s.v.reduce((n,v,i)=>n+(v.id===null||i>=slots?0:D.vehicles[v.id].baseCapacity*(v.id===11?v.cars:1)*shipMult*(v.id>=9?hoverMult:1)*(v.id===11?loopMult:1)),0)*(1+.05*c.epic.transportation_lobbyist)*c.col.shippingCap;
 const shipping=baseShipping*m.shipping;
 const delivery=Math.min(laying,shipping);eggValue*=m.eggValue;
 const online=eggValue*delivery*1.1**c.claimedTotal*c.col.earnings*c.video*c.earningsScale;
 const offline=online*c.col.awayEarnings*m.away*(c.pro?1:.5);
 const earning=c.earningsMode==='offline'?offline:online;
 const ev=at(c,s.t);return {hab,laying,shipping,delivery,eggValue,online,offline,earning,eventEarning:earning*ev.earnings,...costModifiers(s,c),slots,trainLength:5+s.r[RMAP.micro_coupling],siloHours:s.silos*(60+6*c.epic.silo_capacity)/60,bottleneck:laying<shipping?'Laying':laying>shipping?'Shipping':'Balanced',headroom:Math.abs(laying-shipping),baseHabs,baseShipping,layPerChicken:(2/60)*layMult*(1+.05*c.epic.epic_egg_laying)*c.col.elr};
}
// Register only winning sets, under immutable content keys. Different branches
// can equip different gear without changing each other's past production rates.
function researchNeeded(s){return s.r.some((level,i)=>level<D.research[i].levels);}
function earningScore(s,c,set=s.set){const r=stats({...s,set},c);return r.earning/(researchNeeded(s)?r.researchMult:1);}
function registerAutomatic(c,slots,kind){const key=Artifacts.key(slots).replace('auto-delivery-','auto-'+kind+'-');
 if(c.loadouts[key]&&Artifacts.signature(c.loadouts[key])!==Artifacts.signature(slots))throw Error('Artifact set identifier collision.');
 if(!c.loadouts[key]){c.loadouts[key]=slots;c.mods[key]=modifiers(slots);}return key;
}
function artifactChoices(s,c){
 if(!c.artifactModel)return Object.keys(c.loadouts);
 const r=stats(s,c),economy=Artifacts.bestEarnings(c.artifactModel,r,researchNeeded(s));
 const seen=new Set();return [s.set,registerAutomatic(c,economy.research.loadout,'earnings'),registerAutomatic(c,economy.income.loadout,'income'),registerAutomatic(c,Artifacts.bestDelivery(c.artifactModel,r).loadout,'delivery')].filter(key=>{const signature=Artifacts.signature(c.loadouts[key]);if(seen.has(signature))return false;seen.add(signature);return true;});
}
function artifactAction(set,c){return {type:'set',set,...(c.artifactModel?{loadout:c.loadouts[set],setLabel:Artifacts.label(set)}:{})};}
function recordedArtifactSets(actions){const sets={};for(const a of actions.filter(a=>a.type==='set'&&Array.isArray(a.loadout))){if(/^auto-(delivery|earnings|income)-/.test(a.set)&&Artifacts.key(a.loadout)!==a.set.replace(/^auto-(earnings|income)-/,'auto-delivery-'))throw Error('Saved automatic artifact set does not match its recorded gear.');if(sets[a.set]&&Artifacts.signature(sets[a.set])!==Artifacts.signature(a.loadout))throw Error('Saved artifact set has conflicting gear snapshots.');sets[a.set]=a.loadout;}return sets;}
function record(s,action){return {...s,path:{prev:s.path,action},depth:s.depth+1};}
const OFFLINE_MIN_SECONDS=60;
function offlineMinimum(c){return Math.max(OFFLINE_MIN_SECONDS,c.offlineMinSeconds??OFFLINE_MIN_SECONDS);}
function visitDeadline(s,c){return c.enforceOpeningCaps&&s.openingFirst?Math.min(c.end,Sleep.activeDeadline(c.sleep,s.visitStart,(s.egg===0?c.c1MaxMinutes:c.k1MaxMinutes)*60)):c.end;}
function interactionReady(s,c,duration=0,log=true,strict=c.shipReplay&&c.sleepReplay!==false){
 const t=Sleep.nextActive(c.sleep,s.t,duration);
 if(t===s.t)return s;
 if(strict)throw Error('Interaction overlaps scheduled sleep hours.');
 return advance(s,c,t,'Sleep hours; resume interactions at wake time',log,'auto');
}
function productionEnd(s,c,seconds){return c.sleep?Sleep.productionEnd(c.sleep,s.t,seconds,stats(s,c).siloHours*3600):s.t+seconds;}
function checkVisitTime(s,c,to){if(to>visitDeadline(s,c)+1e-5)throw Error((s.egg===0?'C1':'K1')+' exceeds its maximum time of '+(s.egg===0?c.c1MaxMinutes:c.k1MaxMinutes)+' minutes.');}
function advance(s,c,to,reason='Accumulate cash and deliver eggs',log=true,mode='auto'){
 if(to<s.t-1e-5||!Number.isFinite(to)||to>c.end+1e-5)throw Error('Wait exceeds the planning limit.');
 checkVisitTime(s,c,to);
 const dt=Math.max(0,to-s.t),r=stats(s,c);
 if(mode==='auto')mode=c.earningsMode==='offline'&&dt>=offlineMinimum(c)&&r.offline>r.online?'offline':'online';
 if(!['online','offline'].includes(mode)||mode==='offline'&&(c.earningsMode!=='offline'||dt<offlineMinimum(c)))throw Error('Offline earnings require an uninterrupted wait of at least '+offlineMinimum(c)+' seconds.');
 let n=clone(s),t=s.t,forcedOfflineSeconds=0,productionSeconds=0;const rate=mode==='offline'?r.offline:r.online,coverage=r.siloHours*3600;
 while(t<to-1e-7){const ev=at(c,t),next=Math.min(to,ev.next,Sleep.productionBoundary(c.sleep,t,coverage)),asleep=Sleep.sleeping(c.sleep,t),productive=Sleep.producing(c.sleep,t,coverage);
  if(productive){n.cash+=(next-t)*(asleep?r.offline:rate)*ev.earnings;productionSeconds+=next-t;}if(asleep&&mode==='online')forcedOfflineSeconds+=next-t;t=next;}
 n.eggs[s.egg]+=(c.sleep?productionSeconds:dt)*r.delivery;n.t=to;
 if(!Number.isFinite(n.cash)||n.eggs.some(x=>!Number.isFinite(x)))throw Error('Simulation exceeds the number range.');
 if(log&&dt>0)n=record(n,{type:'wait',t:s.t,end:to,egg:s.egg,reason,earningsMode:mode,eggsGained:n.eggs[s.egg]-s.eggs[s.egg],cashGained:n.cash-s.cash,...(c.sleep?{sleepSeconds:Sleep.seconds(c.sleep,s.t,to),forcedOfflineSeconds,siloEmptySeconds:Math.max(0,dt-productionSeconds)}: {})});return n;
}
function isUnlocked(s,i){const r=D.research[i];return r.tier===1||D.research.reduce((sum,x,j)=>sum+(x.tier<r.tier?s.r[j]:0),0)>=D.tierUnlock[r.tier-1];}
function allowed(s,c,a){
 if(a.type==='research'&&c.routeResearchRule&&(s.stage>=c.finalCStage||s.t>=c.researchDeadline))return false;
 switch(a.type){case 'ship-cost':return s.egg===2&&c.ships?.enabled&&!s.shipsDone;case 'research':return s.egg===0&&isUnlocked(s,a.i)&&s.r[a.i]<D.research[a.i].levels;case 'hab':return s.egg===1&&a.slot>=0&&a.slot<4&&a.id>=(s.h[a.slot]===null?0:s.h[a.slot]+1)&&a.id<19;case 'vehicle':return s.egg===4&&a.slot>=0&&a.slot<stats(s,c).slots&&a.id>=(s.v[a.slot].id===null?0:s.v[a.slot].id+1)&&a.id<12;case 'car':return s.egg===4&&s.v[a.slot]?.id===11&&s.v[a.slot].cars<stats(s,c).trainLength;case 'silo':return s.egg===3&&s.silos<(c.pro?10:2);case 'set':return s.egg===2&&a.set!==s.set&&!!c.loadouts[a.set];case 'shift':return c.autoSequence?s.stage<c.maxSwitches&&a.egg!==s.egg&&Number.isInteger(a.egg)&&a.egg>=0&&a.egg<5:s.stage+1<c.sequence.length&&c.sequence[s.stage+1]===a.egg;default:return false;}}
function price(s,c,a){const r=costModifiers(s,c);switch(a.type){case 'ship-cost':return Ships.mission(a.ship,a.duration,c.ships.ftl).cost;case 'research':return Math.ceil(D.research[a.i].virtue_prices[s.r[a.i]]*r.researchMult*at(c,s.t).sale);case 'hab':return Math.floor(D.habs[a.id].virtueCost[s.h.filter((id,i)=>i!==a.slot&&id===a.id).length]*r.habCostMult);case 'vehicle':return Math.floor(D.vehicles[a.id].virtueCost[s.v.filter((v,i)=>i!==a.slot&&v.id===a.id).length]*r.vehicleCostMult);case 'car':return Math.floor(D.cars[s.v[a.slot].cars]*r.vehicleCostMult);case 'silo':return s.silos===0?0:1e8*s.silos**(3*s.silos+15);default:return 0;}}
function shiftCost(s){const basis=s.soul*(.02*(s.shiftCount/120)**3+.0001);return 1e11+.6*basis+(.4*basis)**.9;}
function mutate(s,c,a){const n=clone(s);switch(a.type){case 'research':n.r[a.i]++;break;case 'hab':n.h[a.slot]=a.id;break;case 'vehicle':n.v[a.slot]={id:a.id,cars:1};break;case 'car':n.v[a.slot].cars++;break;case 'silo':n.silos++;break;case 'set':n.set=a.set;break;case 'shift':{const cost=shiftCost(s);if(s.soul+Math.max(1,s.soul)*1e-12<cost)throw Error('Not enough Soul Eggs for the next switch.');n.soul-=cost;n.lost+=cost;n.shiftCount++;n.cash=0;n.stage++;n.egg=a.egg;const bit=a.egg===0?1:a.egg===4?2:0;n.openingFirst=!!bit&&!(s.openingMask&bit);n.openingMask=(s.openingMask||0)|bit;n.visitStart=s.t;break;}}return n;}
function buy(s,c,a,log=true){if(a.type==='fuel-dump')return Ships.trim(s,c,log);if(a.type==='fuel')return Ships.store(s,c,number(a.amount,'Stored fuel amount'),log);if(a.type==='ship-run'||a.type==='ship-visit')return Ships.launch(s,c.shipReplay?{...c,shipLaunchOrder:a.launchOrder??'optimized'}:c,log);if(!c.shipReplay){if(a.type==='shift')s=Ships.beforeShift(s,c,log);if(!c.deferShips&&s.egg===2&&Ships.pending(s,c)&&Ships.ready(s,c))s=Ships.launch(s,c,log);}s=interactionReady(s,c,a.type==='shift'?c.shiftSeconds:c.actionsSeconds,log);if(!allowed(s,c,a))throw Error('Action is unavailable on this Virtue or its prerequisites are unmet.');if(a.type==='research'&&c.routeResearchRule&&s.t+c.actionsSeconds>c.researchDeadline+1e-6)throw Error('Research purchase exceeds its sale window.');const cost=price(s,c,a);if(!Number.isFinite(cost)||cost<0)throw Error('Purchase has no valid price.');if(cost>s.cash+Math.max(1,cost)*1e-12)throw Error('Purchase is not affordable.');const before=stats(s,c);let n=mutate(s,c,a);n.cash=Math.max(0,n.cash-cost);const after=stats(n,c);
 if(log)n=record(n,{...a,type:a.type,t:s.t,egg:a.type==='shift'?a.egg:s.egg,fromEgg:s.egg,cost,from:a.type==='research'?s.r[a.i]:undefined,to:a.type==='research'?n.r[a.i]:undefined,fromCars:a.type==='car'?s.v[a.slot].cars:undefined,toCars:a.type==='car'?n.v[a.slot].cars:undefined,bank:n.cash,soulCost:a.type==='shift'?s.soul-n.soul:0,before:{delivery:before.delivery,laying:before.laying,shipping:before.shipping,earning:before.earning},after:{delivery:after.delivery,laying:after.laying,shipping:after.shipping,earning:after.earning}});
 const dt=a.type==='shift'?c.shiftSeconds:c.actionsSeconds;if(dt&&n.t+dt>c.end)throw Error('Action interaction time exceeds the planning limit.');if(dt)n=advance(n,c,n.t+dt,a.type==='shift'?'Switch overhead; habitats fill immediately':'Purchase interaction time',log,'online');if(!c.shipReplay&&a.type==='shift'&&!c.deferShips&&n.egg===2&&Ships.pending(n,c)&&Ships.ready(n,c))n=Ships.launch(n,c,log);return n;}
function afford(s,c,a){
 if(c.sleep)return affordWithSleep(s,c,a);
 if(!allowed(s,c,a))return null;const firstCost=price(s,c,a);if(firstCost<=s.cash+Math.max(1,firstCost)*1e-12)return s;
 const r=stats(s,c),latest=Math.min(c.end,visitDeadline(s,c)-c.actionsSeconds);let best=null;
 // Compare staying online with leaving for a full minute (or longer). Scan
 // event boundaries without splitting one offline break into shorter sessions.
 for(const mode of ['online','offline']){
  if(mode==='offline'&&(c.earningsMode!=='offline'||r.offline<=r.online))continue;
  const rate=mode==='offline'?r.offline:r.online,minimum=s.t+(mode==='offline'?offlineMinimum(c):0);if(rate<=0)continue;
  let t=s.t,cash=s.cash;
  for(let guard=0;guard<c.calendar.length+2&&t<latest;guard++){
   if(best&&t>=best.t)break;
   const ev=at(c,t),cost=price({...s,t},c,a),end=Math.min(ev.next,latest),income=rate*ev.earnings;
   const ready=Math.max(minimum,t+Math.max(0,cost-cash)/income+.001);
   if(ready<=end&&(!best||ready<best.t)){const candidate=advance(s,c,ready,mode==='offline'?'Go offline, then return to collect earnings':'Accumulate cash online',true,mode),actual=price(candidate,c,a);if(actual<=candidate.cash+Math.max(1,actual)*1e-12){best=candidate;break;}}
   if(end<=t)break;cash+=(end-t)*income;t=end;
  }
 }
 return best;
}
function affordWithSleep(start,c,a){
 if(!allowed(start,c,a))return null;
 const duration=a.type==='shift'?c.shiftSeconds:c.actionsSeconds;
 const latest=Math.min(c.end,visitDeadline(start,c),a.type==='research'&&c.routeResearchRule?c.researchDeadline:Infinity)-duration;
 let s;try{s=interactionReady(start,c,duration);}catch{return null;}
 if(s.t>latest||!allowed(s,c,a))return null;
 const first=price(s,c,a);if(first<=s.cash+Math.max(1,first)*1e-12)return s;
 const r=stats(s,c);let best=null;
 for(const mode of ['online','offline']){
  if(mode==='offline'&&(c.earningsMode!=='offline'||r.offline<=r.online))continue;
  const minimum=s.t+(mode==='offline'?offlineMinimum(c):0);let t=s.t,cash=s.cash;
  for(let guard=0;guard<c.calendar.length+c.sleep.intervals.length*3+4&&t<latest;guard++){
   if(best&&t>=best.t)break;
   const coverage=r.siloHours*3600,ev=at(c,t),end=Math.min(ev.next,Sleep.productionBoundary(c.sleep,t,coverage),latest),rate=Sleep.producing(c.sleep,t,coverage)?(Sleep.sleeping(c.sleep,t)||mode==='offline'?r.offline:r.online):0;
   const income=rate*ev.earnings,cost=price({...s,t},c,a);
   if(income>0){const ready=Sleep.nextActive(c.sleep,Math.max(minimum,t+Math.max(0,cost-cash)/income+.001),duration);
    if(ready<=end&&(!best||ready<best.t)){
     const n=advance(s,c,ready,mode==='offline'?'Go offline, then return to collect earnings':'Accumulate cash online',true,mode),actual=price(n,c,a);
     if(allowed(n,c,a)&&actual<=n.cash+Math.max(1,actual)*1e-12){best=n;break;}
    }
   }
   if(end<=t)break;cash+=(end-t)*income;t=end;
  }
 }
 return best;
}
function history(s){const a=[];for(let p=s.path;p;p=p.prev)a.push(p.action);return a.reverse();}
module.exports={researchNeeded,earningScore,artifactChoices,artifactAction,recordedArtifactSets,D,EGGS,NAME,RMAP,AMAP,SMAP,number,clone,mul,countTE,teByEgg,totalTE,reached,modifiers,validateLoadout,calendar,at,prepare,stats,OFFLINE_MIN_SECONDS,offlineMinimum,visitDeadline,checkVisitTime,interactionReady,productionEnd,advance,isUnlocked,allowed,price,shiftCost,mutate,buy,afford,history,record};
