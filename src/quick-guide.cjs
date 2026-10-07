'use strict';
const Artifacts=require('./artifact-optimizer.cjs'),S=require('./simulator.cjs'),Ships=require('./ships.cjs');
// Display-only grouping. Raw actions remain the source for replay and timing.
function build(actions,{start,end,silos=0}){
 const groups=[];let g,research,habs,vehicles,cars,sets,siloStart;
 function begin(time){g={start:time,purchaseEnd:time,end:time,activities:[],break:null,hiddenOnlineSeconds:0,interactionSeconds:0};research=new Map();habs=new Map();vehicles=new Map();cars=new Map();sets=new Map();siloStart=silos;}
 function finish(time,pause=null){g.purchaseEnd=time;g.end=pause?.end??time;g.break=pause;
  for(const [i,v]of [...research].sort((a,b)=>a[0]-b[0]))g.activities.push({kind:'research',i,label:S.D.research[i].name,value:v.from+' → '+v.to});
  for(const [items,data,label]of [[habs,S.D.habs,'Habitats'],[vehicles,S.D.vehicles,'Vehicles']]){const counts=new Map();for(const id of items.values())counts.set(id,(counts.get(id)||0)+1);for(const [id,count]of (label==='Vehicles'?[...counts].sort((a,b)=>data[a[0]].baseCapacity-data[b[0]].baseCapacity || a[0]-b[0]):counts))g.activities.push({kind:'physical',label,value:count+' × '+data[id].name});}
  for(const [slot,v]of cars)g.activities.push({kind:'physical',label:'Train '+(slot+1)+' cars',value:v.from+' → '+v.to});
  if(silos!==siloStart)g.activities.push({kind:'physical',label:'Silos',value:siloStart+' → '+silos});
  for(const action of sets.values())g.activities.push(...Artifacts.activities(action));
  if(g.activities.length||pause||time>g.start)groups.push(g);
 }
 begin(start);
 for(const a of actions){switch(a.type){
  case 'research':{const prev=research.get(a.i);research.set(a.i,{from:prev?.from??a.from,to:a.to});break;}
  case 'hab':habs.set(a.slot,a.id);break;
  case 'vehicle':vehicles.set(a.slot,a.id);break;
  case 'car':{const prev=cars.get(a.slot);cars.set(a.slot,{from:prev?.from??a.fromCars,to:a.toCars});break;}
  case 'silo':silos++;break;
  case 'set':sets.set(a.set,a);break;
  case 'fuel-dump':g.activities.push({kind:'fuel',label:'Set Tank Limits; Discard Excess',value:a.removed.map((n,i)=>n?Ships.format(n)+' '+S.NAME[i]:'').filter(Boolean).join(' · ')});break;
   case 'fuel':g.activities.push({kind:'fuel',label:(a.visit>1?'Refill ':'Store ')+S.NAME[a.egg]+' Fuel',value:Ships.format(a.amount)});finish(a.t,{start:a.t,end:a.end,seconds:a.end-a.t,mode:'fuel',reason:'Divert 100% of eggs into the tank; no gems or TE delivery during filling.'});begin(a.end);break;
  case 'ship-visit':g.activities.push({kind:'ship',label:'No Ships Planned for H'+a.visit});break;
   case 'ship-run':if(g.activities.length||research.size||habs.size||vehicles.size||cars.size||sets.size||silos!==siloStart){finish(a.t);begin(a.t);}g.shipRun=a;for(const m of a.batches)g.activities.push({kind:'ship',label:'Launch '+m.label,value:'× '+m.count});g.end=a.end;finish(a.end);begin(a.end);break;
  case 'wait':{const seconds=a.end-a.t;if(/^(Purchase interaction time|Switch overhead)/.test(a.reason||''))g.interactionSeconds+=seconds;
   else if(a.earningsMode==='offline'||seconds>=10){finish(a.t,{start:a.t,end:a.end,seconds,mode:a.earningsMode==='offline'?'offline':'online',reason:a.reason});begin(a.end);}
   else g.hiddenOnlineSeconds+=seconds;
   break;}
 }}
 finish(end);return groups;
}
module.exports={build};
