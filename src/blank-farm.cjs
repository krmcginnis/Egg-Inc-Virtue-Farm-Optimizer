'use strict';
const DEFAULT_ROUTE=require('./default-route.cjs');
// A fresh form contains no imported progress, upgrades, inventory or bonuses.
module.exports=function blankFarm(start=Date.now()/1000){return {
 version:1,label:'Blank farm — enter your current farm values before planning.',
 farm:{virtue:'curiosity',cash:0,soulEggs:0,shiftCount:0,claimed:Array(5).fill(0),delivered:Array(5).fill(0),research:{},epic:{},manualAccountData:false,manualFarmData:false,habs:[0,null,null,null],vehicles:Array.from({length:17},(_,i)=>({id:i===0?0:null,cars:1})),silos:1,proPermit:false,videoDoubler:false,earningsMode:'offline',colleggtibles:{},colleggtibleTiers:{},loadouts:{current:[],earnings:[],delivery:[]},activeSet:'current',earningsScale:1,researchCostScale:1,fuelTank:{capacity:2e9,outputPerMinute:300e6,amounts:Object.fromEntries(DEFAULT_ROUTE.filter((x,i,a)=>a.indexOf(x)===i).map(x=>[x,0]))}},
 plan:{target:1,start,eventTimezone:'America/Los_Angeles',maxSwitches:12,sequence:[...DEFAULT_ROUTE],sequenceVersion:2,maxDays:366,autoSequence:true,c1MaxMinutes:60,k1MaxMinutes:60,searchEffort:'balanced',minOfflineMinutes:1,initialPhysicalPurchases:false,shiftSeconds:5,actionSeconds:0,floors:Array(5).fill(0),ships:{mode:'custom-two-visits',slots:3,visits:[{missions:[]},{missions:[]}]}}
};};
