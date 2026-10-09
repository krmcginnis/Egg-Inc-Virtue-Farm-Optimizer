'use strict';
const S=require('./simulator.cjs');
function startingGear(s,c){return s.egg!==2&&c.earningLoadout?.some(slot=>slot.artifactId)&&!(c.loadouts[s.set]||[]).some(slot=>slot.artifactId)?'Your starting artifact set is empty. Artifact changes during the run require Humility. For a new ascension, equip your Research & Earnings set on Humility before ascending, then load or enter that starting gear in the app.':'';}
// Shared context guidance for the form, the saved result and its PDF.
function notices(s,c){
 const out=[],r=S.stats(s,c);
 if(c.claimedTotal<100)out.push('Below 100 claimed TE: the full-hab estimate can be optimistic because chicken fill time is not modeled.');
 if(!s.silos)out.push('This historical plan uses the old zero-silo start. New searches use the game\'s free starting silo.');
 else if(c.earningsMode==='offline'&&S.offlineMinimum(c)>r.siloHours*3600)out.push('The minimum offline break exceeds current silo coverage. The model assumes refills; that break cannot be uninterrupted with your current silos.');
 const gear=startingGear(s,c);if(gear)out.push(gear);
 return out;
}
function maintenance(s,c,finalStats){const first=S.stats(s,c).siloHours,last=finalStats?.siloHours??first;return (first?'Refill silos within '+formatHours(first)+' initially':'No silo coverage at the start')+(last!==first?'; final coverage '+formatHours(last):'')+(c.sleep?'. Refill silos before bed; sleeping production pauses when coverage runs out. Awake long waits include routine silo refills;':'. Long waits include routine silo refills;')+' these check-ins are not counted as earning breaks. Maintain the selected video doubler and follow listed fueling steps.';}
function formatHours(hours){const minutes=Math.round(hours*60);return [Math.floor(minutes/60)?Math.floor(minutes/60)+'h':'',minutes%60?minutes%60+'m':''].filter(Boolean).join(' ')||'0m';}
module.exports={notices,maintenance,startingGear};
