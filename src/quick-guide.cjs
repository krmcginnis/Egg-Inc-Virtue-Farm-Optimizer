'use strict';
const Artifacts=require('./artifact-optimizer.cjs'),S=require('./simulator.cjs'),Fuel=require('./fuel-display.cjs');
// Display-only grouping. Raw actions remain the source for replay and timing.
const interaction=a=>a.type==='wait'&&/^(Purchase interaction time|Switch overhead)/.test(a.reason||'');
const visibleWait=a=>a.type==='wait'&&!interaction(a)&&(a.earningsMode==='offline'||a.sleepSeconds>0||a.end-a.t>=10);
function build(actions,{start,end,silos=0,fuelCapacity=Infinity}){
 const groups=[];let g,research,habs,vehicles,cars,sets,siloStart;
 function begin(time){g={start:time,purchaseEnd:time,end:time,activities:[],break:null,hiddenOnlineSeconds:0,hiddenFuelSeconds:0,interactionSeconds:0};research=new Map();habs=new Map();vehicles=new Map();cars=new Map();sets=new Map();siloStart=silos;}
 function finish(time,pause=null){g.purchaseEnd=time;g.end=pause?.end??time;g.break=pause;
  for(const [i,v]of [...research].sort((a,b)=>a[0]-b[0]))g.activities.push({kind:'research',i,label:S.D.research[i].name,value:v.from+' → '+v.to});
  for(const [items,data,label]of [[habs,S.D.habs,'Habitats'],[vehicles,S.D.vehicles,'Vehicles']]){const counts=new Map();for(const id of items.values())counts.set(id,(counts.get(id)||0)+1);for(const [id,count]of (label==='Vehicles'?[...counts].sort((a,b)=>data[a[0]].baseCapacity-data[b[0]].baseCapacity || a[0]-b[0]):counts))g.activities.push({kind:'physical',label,value:count+' × '+data[id].name});}
  for(const [slot,v]of cars)g.activities.push({kind:'physical',label:'Train '+(slot+1)+' cars',value:v.from+' → '+v.to});
  if(silos!==siloStart)g.activities.push({kind:'physical',label:'Silos',value:siloStart+' → '+silos});
  for(const action of sets.values())g.activities.push(...Artifacts.activities(action));
  if(g.activities.length||pause||time-g.start>g.hiddenFuelSeconds+1e-6)groups.push(g);
 }
 begin(start);
 for(const a of actions){switch(a.type){
  case 'research':{const prev=research.get(a.i);research.set(a.i,{from:prev?.from??a.from,to:a.to});break;}
  case 'hab':habs.set(a.slot,a.id);break;
  case 'vehicle':vehicles.set(a.slot,a.id);break;
  case 'car':{const prev=cars.get(a.slot);cars.set(a.slot,{from:prev?.from??a.fromCars,to:a.toCars});break;}
  case 'silo':silos++;break;
  case 'set':sets.set(a.set,a);break;
  case 'fuel-dump':{const item=Fuel.activity(a,fuelCapacity);if(item)g.activities.push(item);break;}
   case 'fuel':{const item=Fuel.activity(a,fuelCapacity);if(!item){g.hiddenFuelSeconds+=a.end-a.t;break;}g.activities.push(item);finish(a.t,{start:a.t,end:a.end,seconds:a.end-a.t,mode:'fuel',reason:'Divert 100% of eggs into the tank; no gems or TE delivery during filling.'});begin(a.end);break;}
  case 'ship-visit':g.activities.push({kind:'ship',label:'No Ships Planned for H'+a.visit});break;
   case 'ship-run':if(g.activities.length||research.size||habs.size||vehicles.size||cars.size||sets.size||silos!==siloStart){finish(a.t);begin(a.t);}g.shipRun=a;for(const m of a.batches)g.activities.push({kind:'ship',label:'Launch '+m.label,value:'× '+m.count});g.end=a.end;finish(a.end);begin(a.end);break;
  case 'wait':{const seconds=a.end-a.t;if(/^(Purchase interaction time|Switch overhead)/.test(a.reason||''))g.interactionSeconds+=seconds;
   else if(a.earningsMode==='offline'||a.sleepSeconds>0||seconds>=10){finish(a.t,{start:a.t,end:a.end,seconds,mode:a.earningsMode==='offline'?'offline':'online',reason:a.reason,...(a.sleepSeconds>0?{sleepSeconds:a.sleepSeconds,forcedOfflineSeconds:a.forcedOfflineSeconds||0,siloEmptySeconds:a.siloEmptySeconds||0}:{})});begin(a.end);}
   else g.hiddenOnlineSeconds+=seconds;
   break;}
 }}
 finish(end);
 // A funding wait belongs to the purchases it precedes. Fuel collection stays
 // after its setup action; trailing delivery waits remain standalone steps.
 const ordered=[];let before=null;
 for(const group of groups){
  const after=group.break?.mode==='fuel'?group.break:null;
  const step={...group,start:before?.start??group.start,purchaseStart:group.start,end:after?.end??group.purchaseEnd,break:before,afterBreak:after};
  if(step.activities.length||step.break||step.afterBreak||step.purchaseEnd>step.purchaseStart)ordered.push(step);
  before=group.break&&group.break.mode!=='fuel'?group.break:null;
 }
 if(before)ordered.push({start:before.start,purchaseStart:before.end,purchaseEnd:before.end,end:before.end,activities:[],break:before,afterBreak:null,hiddenOnlineSeconds:0,interactionSeconds:0});
 return ordered;
}
module.exports={build,visibleWait,interaction};
