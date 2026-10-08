'use strict';
const S=require('./simulator.cjs'),Artifacts=require('./artifact-optimizer.cjs');
const G=require('./quick-guide.cjs'),Ships=require('./ships.cjs');
const E=require('./opening-search.cjs');
const Rates=require('./shift-rates.cjs');
const codes=['C','I','H','R','K'];
function ranges(values){
 const result=[];for(let i=0;i<values.length;i++){const begin=values[i];let end=begin;while(values[i+1]===end+1)end=values[++i];result.push(begin===end?String(begin):begin+'–'+end);}return result.join(', ');}
function summarize(raw,result){
 const effective=result.solverVersion>=2?{...raw,plan:{...raw.plan,solverVersion:2}}:raw;
 const {s,c}=S.prepare(effective,{artifactReplay:true,artifactSets:S.recordedArtifactSets(result.actions),oneStartingSilo:result.initialSiloRule==='one'||result.actions.some(a=>a.initialSiloRule==='one')}),actions=result.actions,counters=Array(5).fill(0),groups=[];
 let g,remainingSoul=s.soul,previousSwitchCount=s.shiftCount;function begin(egg,index,time,phase){if(!new RegExp('^'+codes[egg]+'[1-9][0-9]*$').test(phase||''))phase=null;g={egg,name:S.NAME[egg],phase:phase||codes[egg]+(++counters[egg]),start:time,end:time,firstIndex:index,lastIndex:index-1,soulCost:0,hasSwitch:false,onlineSeconds:0,offlineSeconds:0,interactionSeconds:0,offlineBreaks:0,fuelSeconds:0,...(c.sleep?{sleepSeconds:0,siloEmptySeconds:0}:{}),activities:[]};if(phase)counters[egg]=Math.max(counters[egg]+1,Number(phase.slice(1)));groups.push(g);}
 const firstShift=actions.findIndex(a=>a.type==='shift'),openingActions=actions.slice(0,firstShift<0?actions.length:firstShift);
 if(actions[0]?.type!=='shift'||actions[0].t>result.start)begin(s.egg,0,result.start,openingActions.find(a=>a.phase)?.phase);
 else counters[s.egg]=1; // A zero-duration starting visit still counts as visit 1.
 for(let i=0;i<actions.length;i++){const a=actions[i];if(a.type==='shift'){if(g)g.end=a.t;begin(a.egg,i,a.t,a.phase);g.hasSwitch=true;g.soulCost=Number.isFinite(a.soulCost)?a.soulCost:remainingSoul-(remainingSoul-S.shiftCost({soul:remainingSoul,shiftCount:previousSwitchCount}));remainingSoul-=g.soulCost;previousSwitchCount++;}g.lastIndex=i;if(a.type==='wait'){const dt=a.end-a.t;g.end=a.end;const interaction=/^(Purchase interaction time|Switch overhead)/.test(a.reason||'');if(interaction)g.interactionSeconds+=dt;else if(a.earningsMode==='offline'){g.offlineSeconds+=dt;g.offlineBreaks++;}else {g.onlineSeconds+=dt-(a.forcedOfflineSeconds||0);g.offlineSeconds+=a.forcedOfflineSeconds||0;}if(c.sleep){g.sleepSeconds+=a.sleepSeconds||0;g.siloEmptySeconds+=a.siloEmptySeconds||0;}}else if(a.type==='fuel'){g.fuelSeconds+=a.end-a.t;if(c.sleep){g.sleepSeconds+=require('./sleep-schedule.cjs').seconds(c.sleep,a.t,a.end);g.siloEmptySeconds+=a.siloEmptySeconds||0;}g.end=Math.max(g.end,a.end);}else if(a.type==='ship-run'){for(const key of ['onlineSeconds','offlineSeconds','interactionSeconds','offlineBreaks','fuelSeconds'])g[key]+=a[key]||0;if(c.sleep){g.sleepSeconds+=a.sleepSeconds||0;g.siloEmptySeconds+=a.siloEmptySeconds||0;}g.end=Math.max(g.end,a.end);}else g.end=Math.max(g.end,a.t);}
 if(groups.length)groups.at(-1).end=result.end;
 let levels=s.r.slice(),eggs=s.eggs.slice(),silos=s.silos;
 for(const shift of groups){const beforeLevels=levels.slice(),beforeTE=Math.max(c.claimed[shift.egg],S.countTE(eggs[shift.egg])),research=new Map(),habs=new Map(),vehicles=new Map(),cars=new Map(),sets=[],siloStart=silos;
  for(let i=shift.firstIndex;i<=shift.lastIndex;i++){const a=actions[i];switch(a.type){
   case 'research':{const prev=research.get(a.i);research.set(a.i,{from:prev?.from??a.from,to:a.to});levels[a.i]=a.to;break;}
   case 'hab':habs.set(a.slot,a.id);break;
   case 'vehicle':vehicles.set(a.slot,a.id);break;
   case 'car':{const prev=cars.get(a.slot);cars.set(a.slot,{from:prev?.from??a.fromCars,to:a.toCars});break;}
   case 'silo':silos++;break;
   case 'set':sets.push(a);break;
   case 'wait':eggs[a.egg]+=a.eggsGained||0;break;
   case 'fuel-dump':shift.activities.push({kind:'fuel',label:'Set Tank Limits; Discard Excess',value:a.removed.map((n,i)=>n?Ships.format(n)+' '+S.NAME[i]:'').filter(Boolean).join(' · ')});break;
   case 'fuel':shift.activities.push({kind:'fuel',label:(a.visit>1?'Refill ':'Store ')+S.NAME[a.egg]+' Fuel',value:Ships.format(a.amount)});break;
   case 'ship-visit':shift.activities.push({kind:'ship',label:'No Ships Planned for H'+a.visit});break;
   case 'ship-run':eggs[a.egg]+=a.eggsGained||0;for(const m of a.batches)shift.activities.push({kind:'ship',label:'Launch '+m.label,value:'× '+m.count});break;
  }}
  const tiers=[...new Set(S.D.research.map(r=>r.tier))].filter(t=>{const indices=S.D.research.map((r,i)=>r.tier===t?i:-1).filter(i=>i>=0);return indices.some(i=>beforeLevels[i]<S.D.research[i].levels)&&indices.every(i=>levels[i]===S.D.research[i].levels);});
  if(tiers.length)shift.activities.push({kind:'tier',label:'Max Tiers '+ranges(tiers)});
  for(const [i,level]of [...research].sort((a,b)=>a[0]-b[0]))if(!tiers.includes(S.D.research[i].tier))shift.activities.push({kind:'research',label:S.D.research[i].name,value:level.from+' → '+level.to});
  for(const [items,data,label]of [[habs,S.D.habs,'Habitats'],[vehicles,S.D.vehicles,'Vehicles']]){const counts=new Map();for(const id of items.values())counts.set(id,(counts.get(id)||0)+1);for(const [id,count]of (label==='Vehicles'?[...counts].sort((a,b)=>data[a[0]].baseCapacity-data[b[0]].baseCapacity || a[0]-b[0]):counts))shift.activities.push({kind:'physical',label,value:count+' × '+data[id].name});}
  if(cars.size){const lengths=[...new Set([...cars.values()].map(v=>v.to))];shift.activities.push({kind:'physical',label:'Hyperloop Cars',value:lengths.length===1?'→ '+lengths[0]+' per train ('+cars.size+' trains)':'+'+[...cars.values()].reduce((n,v)=>n+v.to-v.from,0)+' across '+cars.size+' trains'});}
  if(silos!==siloStart)shift.activities.push({kind:'physical',label:'Silos',value:siloStart+' → '+silos});
  for(const action of sets)shift.activities.push(...Artifacts.activities(action));
  shift.quickGuide=G.build(actions.slice(shift.firstIndex,shift.lastIndex+1),{start:shift.start,end:shift.end,silos:siloStart});
  shift.teGained=Math.max(c.claimed[shift.egg],S.countTE(eggs[shift.egg]))-beforeTE;shift.seconds=shift.end-shift.start;
  if(!shift.activities.length)shift.activities.push({kind:'collection',label:shift.teGained?'Collect Truth Eggs':'Wait / switch'});
 }
 Rates.attach(groups,actions,s,c);
 const shifts=groups.filter(g=>g.lastIndex>=g.firstIndex||g.seconds>0),totals={onlineSeconds:0,offlineSeconds:0,interactionSeconds:0,offlineBreaks:0,fuelSeconds:0,soulCost:0,...(c.sleep?{sleepSeconds:0,siloEmptySeconds:0}:{})};for(const shift of shifts)for(const key of Object.keys(totals))totals[key]+=shift[key];
 return {shifts,totals};
}
function openingViolations(raw,result){return summarize(raw,result).shifts.filter(s=>s.phase==='C1'||s.phase==='K1').filter(s=>s.seconds>E.maximum(raw.plan?.[s.phase==='C1'?'c1MaxMinutes':'k1MaxMinutes']??60)*60+1e-5);}
module.exports={summarize,openingViolations};
