'use strict';
const S=require('./simulator.cjs');
const B=require('./offline-batch.cjs');

// Reorder only research already selected by a paid proposal. Reevaluate income
// after every level: unused slots and excess capacity wait until departure,
// while a shipping/laying upgrade that removes today's bottleneck goes first.
function targets(start,c,actions){
 const levels=start.r.slice(),sales=new Map(),order=new Map();
 for(const [index,a]of actions.entries())if(a.type==='research'){
  const from=a.from??levels[a.i];
  if(!Number.isInteger(a.i)||!S.D.research[a.i]||!Number.isFinite(a.t)||!Number.isInteger(from)||from!==levels[a.i]||!Number.isInteger(a.to)||a.to<=from||a.to>S.D.research[a.i].levels)throw Error('Invalid proposed research level.');
  levels[a.i]=a.to;
  for(let level=from;level<a.to;level++){
   sales.set(a.i+':'+level,S.at(c,a.t).sale===.3);
   order.set(a.i+':'+level,index);
  }
 }
 return {levels,sales,order};
}
function choices(s,c,goal){
 const before=S.stats(s,c),remaining=[];
 for(let i=0;i<goal.levels.length;i++)if(s.r[i]<goal.levels[i]){
  const a={type:'research',i},after=S.stats(S.mutate(s,c,a),c);
  const gain=Math.max(0,Math.log(Math.max(1e-300,after.earning))-Math.log(Math.max(1e-300,before.earning)));
  remaining.push({a,gain,allowed:S.allowed(s,c,a),tier:S.D.research[i].tier,cost:S.price(s,c,a)});
 }
 const earning=remaining.filter(x=>x.allowed&&x.gain>1e-12);
 const position=x=>goal.order.get(x.a.i+':'+s.r[x.a.i]);
 const locked=remaining.filter(x=>!S.isUnlocked(s,x.a.i)&&x.gain>1e-12);
 const nextIncome=Math.min(...earning.map(position));
 const needed=locked.filter(x=>position(x)<nextIncome);
 if(needed.length){
  const tier=Math.min(...needed.map(x=>x.tier));
  const prerequisites=remaining.filter(x=>x.allowed&&x.tier<tier&&x.gain<=1e-12);
  if(prerequisites.length)return prerequisites.map(x=>({...x,reason:'tier unlock'}));
 }
 if(earning.length)return earning.map(x=>({...x,reason:'earnings'}));
 // Keep capacity that enables selected income upgrades later in THIS C.
 // Laying and shipping can each have zero immediate gain while their chain
 // raises income. Use only this visit's selected research and today's actual
 // habs, vehicles and gear for that ordering test; never grant paid capacity.
 const enabling=remaining.filter(x=>{
  if(!x.allowed||x.gain>1e-12||!/egg_laying_rate|hab_capacity|shipping_capacity|fleet_size/.test(S.D.research[x.a.i].categories))return false;
  const later=S.clone(s);later.r=goal.levels.slice();later.r[x.a.i]=s.r[x.a.i];
  const income=S.stats(later,c).earning;
  return S.stats(S.mutate(later,c,x.a),c).earning>income*(1+1e-12);
 });
 if(enabling.length)return enabling.map(x=>({...x,reason:'enables earnings'}));
 // A zero-income level may be needed to unlock a selected earnings upgrade.
 // Buy only lower-tier prerequisites at this point, preferring cheaper ones.
 if(locked.length){
  const tier=Math.min(...locked.map(x=>x.tier));
  return remaining.filter(x=>x.allowed&&x.tier<tier).map(x=>({...x,reason:'tier unlock'}));
 }
 return remaining.filter(x=>x.allowed).map(x=>({...x,reason:'departure'}));
}
function run(start,c,actions,{checkpoint=()=>{},preserveSales=true}={}){
 if(start.egg!==0)throw Error('Earnings-first research requires Curiosity.');
 const goal=targets(start,c,actions);let n=start,purchases=0;
 while(n.r.some((level,i)=>level<goal.levels[i])){
  checkpoint();const available=choices(n,c,goal).sort((a,b)=>goal.order.get(a.a.i+':'+n.r[a.a.i])-goal.order.get(b.a.i+':'+n.r[b.a.i])),before=S.stats(n,c);let selected=null;
  for(const item of available){
   checkpoint();let state=n;
   if(preserveSales&&goal.sales.get(item.a.i+':'+n.r[item.a.i])&&S.at(c,n.t).sale!==.3){
    const sale=c.calendar.find(e=>e.t>n.t&&e.sale===.3);
    if(!sale||sale.t+c.actionsSeconds>c.end)continue;
    state=S.advance(n,c,sale.t,'Wait for the Friday research sale');
   }
   const ready=S.afford(state,c,item.a);if(!ready||ready.t+c.actionsSeconds>c.end)continue;
   const cost=S.price(ready,c,item.a),wait=ready.t-n.t;
   // Keep the proposal's earning-purchase order, moving inert purchases out
   // of its way. Replacing its entire ROI policy with another greedy policy
   // can hide the benefit of deferral. Prerequisite fillers prefer real cost.
   const value=item.reason==='tier unlock'?1/(cost+before.earning*(wait+c.actionsSeconds)+1e-300):1/(1+goal.order.get(item.a.i+':'+n.r[item.a.i]));
   if(!selected||value>selected.value||value===selected.value&&item.a.i<selected.a.i)selected={...item,start:state,ready,value};
   if(item.reason!=='tier unlock')break;
  }
  if(!selected)throw Error('Cannot fund the proposed research order within this visit.');
  // Preserve the existing offline-break comparison. Paying every cheap level
  // through a separate minimum-length break can erase the ordering's benefit.
  if(c.earningsMode==='offline'&&selected.ready.t>selected.start.t){
   const ahead=[];let preview=selected.start,next=selected;
   for(let i=0;i<64&&next;i++){
    checkpoint();
    if(preserveSales&&goal.sales.get(next.a.i+':'+preview.r[next.a.i])&&S.at(c,preview.t).sale!==.3)break;
    ahead.push({...next.a,earningsFirstReason:next.reason});preview=S.mutate(preview,c,next.a);
    const income=S.stats(preview,c).earning;
    next=choices(preview,c,goal).map(x=>({...x,value:x.reason==='tier unlock'?1/(x.cost+income*c.actionsSeconds+1e-300):1/(1+goal.order.get(x.a.i+':'+preview.r[x.a.i]))})).sort((a,b)=>b.value-a.value||a.a.i-b.a.i)[0];
   }
   const batch=B.compare(selected.start,c,ahead,c.end);
   if(batch){n=batch.s;purchases+=batch.count;continue;}
  }
  n=S.buy(selected.ready,c,{...selected.a,earningsFirstReason:selected.reason});purchases++;
 }
 return {state:n,purchases};
}
module.exports={targets,choices,run};
