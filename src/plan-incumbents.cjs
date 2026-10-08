'use strict';
function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
 return value;
}
function key(raw){const plan={...raw?.plan};if(!plan.sleep||plan.sleep.enabled===false)delete plan.sleep;return JSON.stringify(canonical({farm:raw?.farm,plan}));}
function restore(raw,incumbent,replay){
 try{if(!incumbent?.config||!incumbent.result||key(raw)!==key(incumbent.config))return [];}catch{return [];}
 if(incumbent.result.shiftPlans!==undefined&&!Array.isArray(incumbent.result.shiftPlans))return [];
 const items=[];
 for(const entry of incumbent.result.shiftPlans||[{plan:incumbent.result}])try{
  const plan=entry.plan,marker=plan.actions?.[0]?.routeSearch;
  if(plan.solverVersion!==2||marker?.version!==2)continue;
  const {s,c}=replay(raw,plan.actions,true);
  if(s.t!==plan.end||s.stage!==plan.switches||plan.seconds!==s.t-c.start)continue;
  items.push({state:s,context:c,route:marker.sequence,count:marker.researchSales});
 }catch{}
 return items;
}
module.exports={key,restore};
