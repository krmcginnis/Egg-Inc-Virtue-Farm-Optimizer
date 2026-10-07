'use strict';
function select(result,switches){
 const entry=result.shiftPlans?.find(x=>x.switches===switches);
 if(!entry)throw Error('That shift-count plan is not available.');
 return {...entry.plan,shiftPlans:result.shiftPlans,selectedSwitches:switches,recommendedSwitches:result.recommendedSwitches??switches,shiftComparisonVersion:1};
}
function validate(result){
 if(result.shiftPlans===undefined)return;
 const plans=result.shiftPlans,counts=new Set();
 if(result.shiftComparisonVersion!==1||!Array.isArray(plans)||plans.length<1||plans.length>3)throw Error('Invalid shift-count comparison.');
 for(const entry of plans){if(!entry||!Number.isInteger(entry.switches)||entry.switches<0||entry.switches>30||counts.has(entry.switches)||entry.plan?.switches!==entry.switches||!Array.isArray(entry.plan.actions)||entry.plan.shiftPlans||entry.plan.researchSalePlans)throw Error('Invalid shift-count plan.');counts.add(entry.switches);}
 if(!counts.has(result.selectedSwitches)||!counts.has(result.recommendedSwitches))throw Error('The selected or recommended shift-count plan is missing.');
}
function replay(config,result,replayOne){
 if(result.shiftPlans===undefined)return replayOne(config,result);
 validate(result);const entries=result.shiftPlans.map(entry=>({...entry,plan:replayOne(config,entry.plan)}));
 return select({...result,shiftPlans:entries},result.selectedSwitches);
}
module.exports={select,validate,replay};
