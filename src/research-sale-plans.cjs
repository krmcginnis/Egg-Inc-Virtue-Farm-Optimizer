'use strict';
const COUNTS=Object.freeze([1,2,3]);
function select(result,count){
 const entry=result.researchSalePlans?.find(x=>x.researchSales===count&&x.status==='complete');
 if(!entry)throw Error('That research-sale plan is not available.');
 // Existing timeline/export/ascension consumers always see the selected plan
 // at the root; the alternatives remain available without another search.
 return {...entry.plan,researchSalePlans:result.researchSalePlans,selectedResearchSales:count,recommendedResearchSales:result.recommendedResearchSales||count,saleComparisonVersion:1};
}
function validate(result){
 if(result.researchSalePlans===undefined)return;
 const entries=result.researchSalePlans;
 if(result.saleComparisonVersion!==1||!Array.isArray(entries)||entries.length!==3)throw Error('Invalid research-sale comparison.');
 for(const [i,entry] of entries.entries()){
  if(!entry||entry.researchSales!==COUNTS[i]||!['complete','unavailable','not-completed'].includes(entry.status))throw Error('Invalid research-sale option.');
  if(entry.status==='complete'&&(!entry.plan||entry.plan.researchSales!==entry.researchSales||!Array.isArray(entry.plan.actions)||entry.plan.researchSalePlans))throw Error('Invalid research-sale plan.');
  if(entry.status==='complete'&&entry.plan.solverVersion===2){const p=entry.plan,m=p.actions[0]?.routeSearch;if(m?.version!==2||m.researchSales!==entry.researchSales||JSON.stringify(m.sequence)!==JSON.stringify(p.route)||p.openingTimeLimits!==false||!Number.isFinite(p.researchDeadline)||!Number.isInteger(p.actualResearchSales)||p.actualResearchSales<0||p.actualResearchSales>entry.researchSales)throw Error('Invalid route-search sale option.');}
 }
 if(!entries.some(e=>e.status==='complete'&&e.researchSales===result.selectedResearchSales))throw Error('The selected research-sale plan is missing.');
 if(!entries.some(e=>e.status==='complete'&&e.researchSales===result.recommendedResearchSales))throw Error('The recommended research-sale plan is missing.');
}
function replay(config,result,replayOne){
 if(result.researchSalePlans===undefined)return replayOne(config,result);
 validate(result);
 const entries=result.researchSalePlans.map(entry=>entry.status==='complete'?{...entry,plan:replayOne(config,entry.plan)}:{...entry});
 return select({...result,researchSalePlans:entries},result.selectedResearchSales);
}
module.exports={COUNTS,select,validate,replay};
