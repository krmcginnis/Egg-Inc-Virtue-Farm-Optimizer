'use strict';
const D=require('./game-data.json'),C=require('./colleggtibles.cjs'),catalog=require('./contract-eggs.json');
const eggs=new Set(D.customEggs.map(e=>e.identifier)),thresholds=[1e7,1e8,1e9,1e10];
function importColleggtibles(backup,previous={}){
 const records=[...(backup.contracts?.archive||[]),...(backup.contracts?.contracts||[])],maxima={},unresolved=new Set();let matched=0,mapped=0;
 for(const [index,record]of records.entries()){
  const population=Number(record.maxFarmSizeReached);if(!Number.isFinite(population)||population<thresholds[0])continue;
  const accepted=Number(record.timeAccepted);
  // A later custom-egg rerun must not grant a bonus for its pre-Colleggtible run.
  if(Number.isFinite(accepted)&&accepted<=catalog.colleggtibleCutoff)continue;
  let egg=record.contract?.customEggId;
  if(!egg){
   const type=record.contract?.egg;
   if(type!==undefined&&type!==200&&type!=='CUSTOM_EGG')continue;
   const id=record.contractIdentifier||record.contract?.identifier;
   if(!id){unresolved.add('record-'+index);continue;}
   if(!Object.hasOwn(catalog.contracts,id)){unresolved.add(id);continue;}
   egg=catalog.contracts[id];if(!egg)continue; // Known ordinary contracts need no bonus.
   if(!Number.isFinite(accepted)){unresolved.add(id);continue;}
   mapped++;
  }
  if(!eggs.has(egg)){unresolved.add(record.contractIdentifier||record.contract?.identifier||'record-'+index);continue;}
  maxima[egg]=Math.max(maxima[egg]||0,population);matched++;
 }
 const source=!backup.contracts?'unavailable':unresolved.size?'partial':'backup',tiers={};
 const retained=source==='backup'?{tiers:{},overrides:{}}:C.selections(previous);
 for(const egg of eggs)tiers[egg]=Math.max(thresholds.findLastIndex(n=>(maxima[egg]||0)>=n),retained.tiers[egg]??-1);
 const overrides=Object.keys(retained.overrides).length?retained.overrides:undefined;
 const warnings=[];
 if(source==='unavailable')warnings.push('The backup omitted contract progress. Previous Colleggtible selections were retained; verify them or sync the game and reload account data.');
 else if(source==='partial')warnings.push(unresolved.size+' contract record(s) could not be resolved for Colleggtibles. Recognized bonuses were imported and previous selections retained; verify the tiers.');
 return {tiers,overrides,bonuses:C.combine(tiers,overrides),source,matched,mapped,unresolved:unresolved.size,warnings};
}
module.exports=importColleggtibles;
