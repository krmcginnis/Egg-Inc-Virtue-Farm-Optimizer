'use strict';
// Owned Virtue gear only. Sets may reuse the same inventory at different visits.
// Socketed stones join loose stones: resocketing costs are outside the farm model.
const D=require('./game-data.json');
const artifacts=new Map(D.artifacts.map(a=>[a.id,a])),stones=new Map(D.stones.map(s=>[s.id,s]));
const cache=new Map();
const deliveryCache=new WeakMap();
const earningCache=new WeakMap();
function normalize(raw){
 if(!Array.isArray(raw))throw Error('Artifact inventory must be an array.');
 return raw.filter(x=>x&&((x.kind==='stone'?stones:artifacts).has(x.id))).map(x=>{
  const quantity=Number(x.quantity??1);if(!Number.isFinite(quantity)||quantity<0)throw Error('Artifact inventory quantities must be nonnegative finite numbers.');
  const a=artifacts.get(x.id),socketed=(x.stones||[]).filter(Boolean);
  if(x.kind!=='stone'&&(socketed.length>a.slots||socketed.some(id=>!stones.has(id))))throw Error('Imported artifact sockets do not match the catalog.');
  return {id:x.id,kind:x.kind==='stone'?'stone':'artifact',quantity:Math.floor(quantity),stones:x.kind==='stone'?[]:socketed,itemId:x.itemId};
 }).filter(x=>x.quantity>0);
}
function prefixes(pool,target,limit){
 const ids=[...pool].filter(([id])=>stones.get(id).target===target).sort((a,b)=>stones.get(b[0]).delta-stones.get(a[0]).delta||a[0].localeCompare(b[0])).flatMap(([id,n])=>Array(Math.min(limit,n)).fill(id)).slice(0,limit);
 const out=[{ids:[],factor:1}];for(const id of ids){const prev=out.at(-1);out.push({ids:[...prev.ids,id],factor:prev.factor*(1+stones.get(id).delta)});}return out;
}
function factor(a,mode){return a.target==='egg value'||a.target==='away earnings'&&mode==='offline'?1+a.delta:1;}
function structures(owned,limit,goal,mode){
 const groups=new Map();for(const id of new Set(owned.filter(x=>x.kind==='artifact').map(x=>x.id))){const a=artifacts.get(id);if(!groups.has(a.family))groups.set(a.family,[]);groups.get(a.family).push(a);}
 const relevant=goal==='delivery'?new Set(['hab capacity','egg laying rate','shipping rate']):new Set(['egg value','research cost','hab capacity','egg laying rate','shipping rate',...(mode==='offline'?['away earnings']:[])]),targets=[],carriers=[];
 for(const list of groups.values()){
  const effect=a=>relevant.has(a.target)?(a.target==='research cost'?1/(1+a.delta):1+a.delta):1;
  // Keep tier/socket tradeoffs; higher tiers alone need not be better.
  const pareto=list.filter(a=>!list.some(b=>b!==a&&b.slots>=a.slots&&effect(b)>=effect(a)&&(b.slots>a.slots||effect(b)>effect(a))));
  if(relevant.has(list[0].target))targets.push(...pareto);
  else{pareto.sort((a,b)=>b.slots-a.slots||factor(b,mode)-factor(a,mode)||(a.target==='research cost'?a.delta:0)-(b.target==='research cost'?b.delta:0)||a.id.localeCompare(b.id));carriers.push(pareto[0]);}
 }
 // More carrier families than equipment slots cannot improve the socket count.
 carriers.sort((a,b)=>b.slots-a.slots||factor(b,mode)-factor(a,mode)||(a.target==='research cost'?a.delta:0)-(b.target==='research cost'?b.delta:0)||a.id.localeCompare(b.id));
 const candidates=[...targets,...carriers.slice(0,limit)].sort((a,b)=>a.id.localeCompare(b.id)),out=[];
 function visit(index,picked,families){out.push(picked.slice());if(picked.length===limit)return;for(let i=index;i<candidates.length;i++){const a=candidates[i];if(families.has(a.family))continue;families.add(a.family);picked.push(a);visit(i+1,picked,families);picked.pop();families.delete(a.family);}}
 visit(0,[],new Set());return out;
}
function loadout(structure,ids){let i=0;return structure.map(a=>({artifactId:a.id,stones:Array.from({length:a.slots},()=>ids[i++]||null)}));}
function baseModifiers(structure){const m={hab:1,laying:1,shipping:1,eggValue:1,away:1,research:1};const names={'hab capacity':'hab','egg laying rate':'laying','shipping rate':'shipping','egg value':'eggValue','away earnings':'away','research cost':'research'};for(const a of structure)if(names[a.target])m[names[a.target]]*=1+a.delta;return m;}
function compile(raw,pro=true,mode='offline'){
 const inventory=normalize(raw),key=JSON.stringify([inventory,pro,mode]);if(cache.has(key))return cache.get(key);
 const limit=pro?4:2,maxSockets=limit*Math.max(0,...inventory.filter(x=>x.kind==='artifact').map(x=>artifacts.get(x.id).slots)),pool=new Map();function add(id,n){pool.set(id,Math.min(maxSockets,(pool.get(id)||0)+n));}
 for(const x of inventory){if(x.kind==='stone')add(x.id,x.quantity);else for(const id of x.stones)add(id,x.quantity);}
 const earningStones=[...pool].filter(([id])=>stones.get(id).target==='egg value'||mode==='offline'&&stones.get(id).target==='away earnings').sort((a,b)=>stones.get(b[0]).delta-stones.get(a[0]).delta||a[0].localeCompare(b[0])).flatMap(([id,n])=>Array(n).fill(id)).slice(0,maxSockets);
 const tachyon=prefixes(pool,'egg laying rate',maxSockets),quantum=prefixes(pool,'shipping rate',maxSockets),physicalDelta=Math.max(0,...[...pool.keys()].filter(id=>['egg laying rate','shipping rate'].includes(stones.get(id).target)).map(id=>stones.get(id).delta)),dominant=earningStones.filter(id=>stones.get(id).delta>=physicalDelta).length;
 const earningPrefixes=[{ids:[],eggValue:1,away:1}];for(const id of earningStones){const item=stones.get(id),prev=earningPrefixes.at(-1),name=item.target==='egg value'?'eggValue':'away';earningPrefixes.push({...prev,ids:[...prev.ids,id],[name]:prev[name]*(1+item.delta)});}
 let earnings=[],income=[],best=-1,bestIncome=-1,bestProduction=-1,incomeProduction=-1;const economy=[];
 for(const structure of structures(inventory,limit,'earnings',mode)){
  const slots=structure.reduce((n,a)=>n+a.slots,0),ids=earningStones.slice(0,slots),m=baseModifiers(structure);
  for(const id of ids){const item=stones.get(id);m[item.target==='egg value'?'eggValue':'away']*=1+item.delta;}
  const value=m.eggValue*(mode==='offline'?m.away:1),research=value/m.research,production=m.hab*m.laying*m.shipping;
  // A value/away stone at least as strong as a production stone always wins
  // for income. Enumerate the remaining splits when production stones can win
  // or when owned earning stones do not fill every socket.
  for(let e=Math.min(slots,dominant);e<=Math.min(slots,earningStones.length);e++)for(let q=0;q<=Math.min(slots-e,quantum.length-1);q++){
   const t=Math.min(slots-e-q,tachyon.length-1),ep=earningPrefixes[e],qu=quantum[q],ta=tachyon[t],base=baseModifiers(structure);
   economy.push({structure,ids:[...ep.ids,...qu.ids,...ta.ids],mods:{...base,eggValue:base.eggValue*ep.eggValue,away:base.away*ep.away,shipping:base.shipping*qu.factor,laying:base.laying*ta.factor}});
  }
  if(research>best||research===best&&production>bestProduction){best=research;bestProduction=production;earnings=loadout(structure,ids);}
  if(value>bestIncome||value===bestIncome&&production>incomeProduction){bestIncome=value;incomeProduction=production;income=loadout(structure,ids);}
 }
 const delivery=[];
 for(const structure of structures(inventory,limit,'delivery',mode)){
  const sockets=structure.reduce((n,a)=>n+a.slots,0),base=baseModifiers(structure);
  // Enumerate every Tachyon/Quantum split, choosing the strongest owned stones
  // of each kind. Greedy bottleneck filling can overshoot and miss the optimum.
  for(let t=0;t<tachyon.length&&t<=sockets;t++){const q=Math.min(sockets-t,quantum.length-1),ta=tachyon[t],qu=quantum[q];delivery.push({structure,ids:[...qu.ids,...ta.ids],mods:{...base,laying:base.laying*ta.factor,shipping:base.shipping*qu.factor}});}
 }
 const model={inventory,earnings,income,economy,delivery,limit,mode};if(cache.size>=4)cache.delete(cache.keys().next().value);cache.set(key,model);return model;
}
function production(candidate,r){const m=candidate.mods,hab=r.baseHabs.reduce((n,cap)=>n+Math.ceil(cap*m.hab),0);return Math.min(hab*r.layPerChicken*m.laying,r.baseShipping*m.shipping);}
function frozenLoadout(candidate){const slots=loadout(candidate.structure,candidate.ids);for(const slot of slots){Object.freeze(slot.stones);Object.freeze(slot);}return Object.freeze(slots);}
function bestEarnings(model,r,researchNeeded=true){
 const key=JSON.stringify([r.baseHabs,r.layPerChicken,r.baseShipping,researchNeeded]);let memo=earningCache.get(model);if(!memo){memo=new Map();earningCache.set(model,memo);}if(memo.has(key))return memo.get(key);
 let research=null,income=null,researchScore=-1,incomeScore=-1,researchRate=-1,incomeResearch=-1;
 for(const candidate of model.economy){const m=candidate.mods,rate=production(candidate,r)*m.eggValue*(model.mode==='offline'?m.away:1),score=rate/(researchNeeded?m.research:1);
  if(score>researchScore||score===researchScore&&rate>researchRate){research=candidate;researchScore=score;researchRate=rate;}
  if(rate>incomeScore||rate===incomeScore&&m.research<incomeResearch){income=candidate;incomeScore=rate;incomeResearch=m.research;}
 }
 const result=Object.freeze({research:Object.freeze({loadout:frozenLoadout(research),score:researchScore,income:researchRate}),income:Object.freeze({loadout:frozenLoadout(income),income:incomeScore})});
 if(memo.size>=4096)memo.delete(memo.keys().next().value);memo.set(key,result);return result;
}
function bestDelivery(model,r){
 const key=JSON.stringify([r.baseHabs,r.layPerChicken,r.baseShipping]);let memo=deliveryCache.get(model);if(!memo){memo=new Map();deliveryCache.set(model,memo);}if(memo.has(key))return memo.get(key);
 let best=null,score=-1,income=-1;
 for(const candidate of model.delivery){const m=candidate.mods,hab=r.baseHabs.reduce((n,cap)=>n+Math.ceil(cap*m.hab),0),laying=hab*r.layPerChicken*m.laying,shipping=r.baseShipping*m.shipping,value=Math.min(laying,shipping),earning=value*m.eggValue*(model.mode==='offline'?m.away:1);
  if(value>score||value===score&&earning>income){best=candidate;score=value;income=earning;}
 }
 const slots=loadout(best.structure,best.ids);for(const slot of slots){Object.freeze(slot.stones);Object.freeze(slot);}const result=Object.freeze({loadout:Object.freeze(slots),delivery:score});if(memo.size>=4096)memo.delete(memo.keys().next().value);memo.set(key,result);return result;
}
function signature(slots){return JSON.stringify(slots);}
// Feasibility grants each stat its best owned effects independently. These
// deliberately incompatible maxima are an upper bound, never an equipable set.
function optimisticModifiers(model){
 const m={eggValue:1,hab:1,shipping:1,away:1,laying:1,research:1,ihr:1},names={'egg value':'eggValue','hab capacity':'hab','shipping rate':'shipping','away earnings':'away','egg laying rate':'laying','research cost':'research','internal hatchery rate':'ihr'},families=new Map(),pool=new Map();
 for(const x of model.inventory){
  if(x.kind==='artifact'){const a=artifacts.get(x.id),old=families.get(a.family);if(!old||(a.target==='research cost'?a.delta<old.delta:a.delta>old.delta))families.set(a.family,a);}
  for(const id of x.kind==='stone'?[x.id]:x.stones)pool.set(id,(pool.get(id)||0)+x.quantity);
 }
 for(const a of families.values())if(names[a.target])m[names[a.target]]*=1+a.delta;
 for(const [target,name]of Object.entries(names))m[name]*=prefixes(pool,target,model.limit*3).at(-1).factor;
 return m;
}
function key(slots){let a=2166136261,b=5381;for(const ch of signature(slots)){a=Math.imul(a^ch.charCodeAt(0),16777619);b=Math.imul(b,33)^ch.charCodeAt(0);}return 'auto-delivery-'+(a>>>0).toString(36)+'-'+(b>>>0).toString(36);}
function label(set){return set.startsWith('auto-delivery-')?'Delivery':set.startsWith('auto-earnings-')?'Research & Earnings':set.startsWith('auto-income-')?'Income':set[0].toUpperCase()+set.slice(1);}
function activities(action){const result=[{kind:'artifact',label:'Equip '+(action.setLabel||label(action.set))+' Artifacts'}];for(const slot of action.loadout||[]){const a=artifacts.get(slot.artifactId);if(!a)continue;const counts=new Map();for(const id of slot.stones||[])if(id)counts.set(id,(counts.get(id)||0)+1);result.push({kind:'artifact',label:a.label,value:[...counts].map(([id,n])=>n+' × '+stones.get(id).label).join(', ')});}return result;}
module.exports={normalize,compile,bestDelivery,bestEarnings,optimisticModifiers,key,signature,label,activities};
