'use strict';
const OBJECTIVE='Compare the fastest completion found at the specified shift count, one more, and one fewer; ties favor silo coverage up to eight silos, fewer earning breaks, and fewer purchases';
const planOf=entry=>entry.plan;
function fastest(entries,read=planOf){
 return entries.reduce((best,entry)=>{const a=read(entry),b=best&&read(best);return !b||a.seconds<b.seconds||a.seconds===b.seconds&&a.switches<b.switches?entry:best;},null);
}
function choices(entries,specified,read=planOf){
 const at=count=>fastest(entries.filter(e=>read(e).switches===count),read);
 return [{role:'extra',switches:specified+1,entry:at(specified+1)},{role:'specified',switches:specified,entry:at(specified)},{role:'fewer',switches:specified>0?specified-1:null,entry:specified>0?at(specified-1):null}];
}
function shortlist(entries,read=planOf,specified){
 const first=fastest(entries,read);if(!first)return [];
 if(specified!==undefined){const selected=choices(entries,specified,read).map(x=>x.entry).filter(Boolean);return selected.length?selected:[first];}
 const fewer=fastest(entries.filter(entry=>read(entry).switches===read(first).switches-1),read);
 // Search and worker pooling retain winners for every shift count. Only the
 // final choices are limited, anchored to the fastest elapsed duration found.
 return [first,fewer].filter(Boolean);
}
const rank=shortlist;
function create(entries,specifiedSwitches){
 const shiftPlans=shortlist(entries,planOf,specifiedSwitches);
 if(!shiftPlans.length)throw Error('No complete shift-count plan is available.');
 return select({shiftPlans,...(specifiedSwitches!==undefined?{specifiedSwitches}:{})},shiftPlans.find(e=>e.switches===specifiedSwitches)?.switches??fastest(shiftPlans).switches);
}
function select(result,switches){
 const entry=result.shiftPlans?.find(x=>x.switches===switches);
 if(!entry)throw Error('That shift-count plan is not available.');
 const selected={...entry.plan,objective:OBJECTIVE,shiftPlans:result.shiftPlans,selectedSwitches:switches,shiftComparisonVersion:result.specifiedSwitches===undefined?1:2,...(result.specifiedSwitches!==undefined?{specifiedSwitches:result.specifiedSwitches}:{})};
 delete selected.recommendedSwitches;
 return selected;
}
function validate(result){
 if(result.shiftPlans===undefined)return;
 const plans=result.shiftPlans,counts=new Set();
 // Validate every saved option, including old selected timelines.
 if(![1,2].includes(result.shiftComparisonVersion)||result.shiftComparisonVersion===2&&(!Number.isInteger(result.specifiedSwitches)||result.specifiedSwitches<0||result.specifiedSwitches>30)||!Array.isArray(plans)||plans.length<1||plans.length>3)throw Error('Invalid shift-count comparison.');
 for(const entry of plans){if(!entry||!Number.isInteger(entry.switches)||entry.switches<0||entry.switches>30||counts.has(entry.switches)||entry.plan?.switches!==entry.switches||!Array.isArray(entry.plan.actions)||entry.plan.shiftPlans||entry.plan.researchSalePlans)throw Error('Invalid shift-count plan.');counts.add(entry.switches);}
 if(!counts.has(result.selectedSwitches)||result.recommendedSwitches!==undefined&&!counts.has(result.recommendedSwitches))throw Error('The selected or saved legacy shift-count plan is missing.');
}
function replay(config,result,replayOne){
 if(result.shiftPlans===undefined)return replayOne(config,result);
 validate(result);const entries=result.shiftPlans.map(entry=>({...entry,plan:replayOne(config,entry.plan)}));
 return select({...result,shiftPlans:entries},result.selectedSwitches);
}
module.exports={OBJECTIVE,fastest,rank,choices,shortlist,create,select,validate,replay};
