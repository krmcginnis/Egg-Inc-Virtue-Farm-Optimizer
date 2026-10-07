'use strict';
const privateKeys=new Set(['eid','eiuserid','playerid','deviceid','token']);
function sanitize(value){
 if(Array.isArray(value))return value.map(sanitize);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>!privateKeys.has(key.toLowerCase())).map(([key,v])=>[key,sanitize(v)]));
 return value;
}
function farmValid(config){
 return config?.version===1&&config.plan&&config.farm&&['claimed','delivered','habs','vehicles'].every((key,i)=>Array.isArray(config.farm[key])&&config.farm[key].length===[5,5,4,17][i])&&config.farm.research&&typeof config.farm.research==='object';
}
function valid(snapshot){return snapshot?.version===1&&Number.isFinite(snapshot.savedAt)&&farmValid(snapshot.config)&&(!snapshot.result||Array.isArray(snapshot.result.actions)&&farmValid(snapshot.resultConfig));}
module.exports={sanitize,valid};
