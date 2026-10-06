'use strict';
const S=require('./simulator.cjs');
// Shared presentation order for the app and PDF; leave replay actions intact.
function groups(activities){const out=[];for(const item of activities.filter(a=>a.kind==='research').slice().sort((a,b)=>a.i-b.i)){const tier=S.D.research[item.i].tier;let group=out.at(-1);if(group?.tier!==tier){group={label:'Tier '+tier,tier,items:[]};out.push(group);}group.items.push(item);}const other=activities.filter(a=>a.kind!=='research');if(other.length)out.push({label:'Other Purchases',tier:null,items:other});return out;}
module.exports={groups};
