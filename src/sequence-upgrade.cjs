'use strict';
const DEFAULT_ROUTE=require('./default-route.cjs');
const Route=require('./switch-sequence.cjs');
const codes={C:'curiosity',I:'integrity',K:'kindness',R:'resilience',H:'humility'};
const oldStandard=['C','I','K','C','I','K','R','H','C'].map(x=>codes[x]);
// Upgrade the old shipped default, rather than overriding every saved route.
// Versioned saves can deliberately use that same route as a custom sequence.
module.exports=function upgradeStandardSequence(plan,virtue){
 if(plan.sequenceVersion>=2)return false;
 let route;try{route=Route.parse(plan.sequence);}catch{return false;}
 if(route.length!==oldStandard.length||route.some((x,i)=>x!==oldStandard[i]))return false;
 plan.sequence=[...DEFAULT_ROUTE];
 // Migrate the old route without overriding the user's switch budget.
 plan.sequenceVersion=2;
 return true;
};
