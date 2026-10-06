'use strict';
const KEY='virtue-optimizer.session.v1',PREFERENCE=KEY+'.enabled';
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
function create(getStorage){
 function attempt(action){try{return {ok:true,value:action(getStorage())};}catch{return {ok:false};}}
 return {
  enabled:()=>attempt(s=>s.getItem(PREFERENCE)!=='false'),
  setEnabled:enabled=>attempt(s=>{s.setItem(PREFERENCE,String(enabled));if(!enabled)s.removeItem(KEY);}),
  read:()=>attempt(s=>{const raw=s.getItem(KEY);if(!raw)return null;const parsed=JSON.parse(raw);if(!valid(parsed))throw Error('Invalid recovery copy');return parsed;}),
  write:snapshot=>attempt(s=>{
   if(!valid(snapshot))throw Error('Invalid recovery copy');
   const data=sanitize(snapshot);
   if(data.result)delete data.result.summary; // Rebuild derived timeline groups.
   s.setItem(KEY,JSON.stringify(data));
  }),
  clear:()=>attempt(s=>s.removeItem(KEY))
 };
}
module.exports={KEY,PREFERENCE,create,sanitize,valid};
