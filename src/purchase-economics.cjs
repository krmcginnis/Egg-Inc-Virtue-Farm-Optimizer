'use strict';
const S=require('./simulator.cjs');
const types=new Set(['research','hab','vehicle','car','silo']);
const capacity=/egg_laying_rate|hab_capacity|shipping_capacity|fleet_size/;
function purchase(a){return types.has(a.type);}
function family(a){return a.type==='research'?'research:'+S.D.research[a.i].categories:a.type;}
function sameItem(a,b){return a.type===b.type&&(a.type==='research'?a.i===b.i:['hab','vehicle','car'].includes(a.type)?a.slot===b.slot:true);}
function matches(s,c,a){
 if(a.type==='research'&&s.r[a.i]!==a.from)return false;
 if(a.type==='car'&&(s.v[a.slot]?.cars!==a.fromCars||a.slot>=S.stats(s,c).slots))return false;
 return S.allowed(s,c,a);
}
// Structural checks propose dependency closures only. Mutating here neither
// pays for nor accepts anything: every proposal must be funded and replayed.
// Missing research levels, tier counts, fleet slots, engines and train-length
// research remove their dependent purchases rather than granting free levels.
function closure(initial,c,actions,removed,{stop=actions.length,checkpoint=()=>{}}={}){
 let s=S.clone(initial);const drop=new Set(removed);
 for(let index=0;index<stop;index++){
  if(index%32===0)checkpoint();const a=actions[index];
  if(drop.has(index)||!purchase(a)&&a.type!=='shift'&&a.type!=='set')continue;
  s={...s,t:a.t};
  if(!matches(s,c,a)){
   if(!purchase(a))return null;
   drop.add(index);continue;
  }
  s=S.mutate(s,c,a);
 }
 return drop;
}
function coherent(initial,c,actions,checkpoint){const removed=closure(initial,c,actions,[],{checkpoint});return removed!==null&&removed.size===0;}
function proposals(initial,c,actions,{limit=16,offset=0,maxProposals=72,checkpoint=()=>{}}={}){
 const stages=[];let stage=initial.stage;
 for(const a of actions){if(a.type==='shift')stage++;stages.push(stage);}
 const items=actions.map((a,index)=>({a,index,stage:stages[index]})).filter(({a})=>purchase(a)&&Number.isFinite(a.cost)&&a.cost>=0);
 const gain=a=>a.after?.earning>a.before?.earning*(1+1e-12)?a.after.earning-a.before.earning:0;
 const payback=a=>Math.log(Math.max(1e-300,a.cost))-Math.log(Math.max(1e-300,gain(a)));
 // Round-robin across upgrade families, with inactive purchases and long
 // paybacks first. A large research batch cannot crowd out physical upgrades.
 const groups=new Map();
 for(const item of items){const key=family(item.a),group=groups.get(key)||[];group.push(item);groups.set(key,group);}
 for(const group of groups.values())group.sort((x,y)=>Number(gain(x.a)>0)-Number(gain(y.a)>0)||
  Number(S.at(c,x.a.t).sale===.3)-Number(S.at(c,y.a.t).sale===.3)||
  payback(y.a)-payback(x.a)||x.index-y.index);
 const anchors=[];
 for(let rank=0;anchors.length<limit;rank++){
  let added=false;for(const group of groups.values())if(group[rank]&&anchors.length<limit){anchors.push(group[rank]);added=true;}
  if(!added)break;
 }
 const output=[],seen=new Set();
 function add(kind,root,edited){
  checkpoint();if(output.length>=maxProposals||!edited||!coherent(initial,c,edited,checkpoint))return;
  const key=JSON.stringify(edited.filter(a=>a.type!=='wait').map(a=>[a.type,a.i,a.from,a.slot,a.id,a.fromCars,a.egg,a.t]));
  if(seen.has(key))return;seen.add(key);output.push({kind,type:root.a.type,i:root.a.i,from:root.a.from,actions:edited});
 }
 function omit(root,indices){
  if(root.a.type==='silo')indices=items.filter(x=>x.index>=root.index&&x.a.type==='silo').map(x=>x.index);
  const drop=closure(initial,c,actions,indices,{checkpoint});if(drop)add('omit',root,actions.filter((_,i)=>!drop.has(i)));
 }
 function move(root,target,kind,time){
  // Carry any intervening dependent levels with the root. A productive
  // purchase that needs this prerequisite cannot be moved ahead of it.
  const drop=closure(initial,c,actions,[root.index],{stop:target,checkpoint});
  if(!drop||kind==='after-earnings'&&drop.has(target-1))return;
  const block=actions.filter((_,i)=>i<target&&drop.has(i));
  if(block.some(a=>a.type!==root.a.type&&kind==='later-visit'))return;
  const prefix=actions.slice(0,target).filter((_,i)=>!drop.has(i)),suffix=actions.slice(target);
  add(kind,root,[...prefix,...block.map(a=>time!==undefined?{...a,t:time}:a),...suffix]);
 }
 for(const root of anchors.slice(offset)){
  checkpoint();if(output.length>=maxProposals)break;
  const {a,index,stage}=root;
  omit(root,[index]);
  let end=index+1;while(end<actions.length&&stages[end]===stage)end++;
  const earning=items.filter(x=>x.index>index&&x.index<end&&gain(x.a)>0&&!sameItem(a,x.a));
  for(const next of [...new Set([earning[0],earning.at(-1)].filter(Boolean))])move(root,next.index+1,'after-earnings');
  if(a.type==='research'&&S.at(c,a.t).sale!==.3){
   const sale=c.calendar.find(e=>Number.isFinite(e.t)&&e.t>a.t&&e.sale===.3);
   if(sale&&sale.t+c.actionsSeconds<=c.researchDeadline){let insert=index+1;while(insert<end&&actions[insert].t<sale.t)insert++;move(root,insert,'next-sale',sale.t);}
  }
  // Delay only to the next visit that can legally sell this purchase. The
  // dependency check rejects delaying fleet research beyond its K purchases.
  const egg=a.type==='research'?0:a.type==='hab'?1:a.type==='silo'?3:4;
  const next=actions.findIndex((x,i)=>i>=end&&x.type==='shift'&&x.egg===egg);
  if(next>=0){let insert=next+1;while(insert<actions.length&&actions[insert].type==='wait'&&/Switch overhead/.test(actions[insert].reason||''))insert++;move(root,insert,'later-visit');}
 }
 // Complementary laying/shipping/hab research can be worth buying together
 // even when either level has zero immediate benefit. Also compare omitting
 // the whole selected capacity investment, including its paid dependents.
 const visits=new Map();for(const item of items)if(item.a.type==='research'&&capacity.test(S.D.research[item.a.i].categories)){const group=visits.get(item.stage)||[];group.push(item);visits.set(item.stage,group);}
 for(const group of visits.values())if(group.length>1)omit(group[0],group.map(x=>x.index));
 return output;
}
module.exports={purchase,matches,closure,proposals};
