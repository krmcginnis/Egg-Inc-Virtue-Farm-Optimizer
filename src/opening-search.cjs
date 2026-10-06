'use strict';
const STEP_MINUTES=30,MAX_MINUTES=300;
// Anchored interval multiples preserve every smaller ceiling's choices.
function budgets(max){
 const choices=[];
 for(let minutes=STEP_MINUTES;minutes<=Math.min(max,MAX_MINUTES);minutes+=STEP_MINUTES)choices.push(minutes);
 return choices;
}
function maximum(minutes){return Math.max(STEP_MINUTES,Math.min(MAX_MINUTES,minutes));}
module.exports={budgets,maximum,STEP_MINUTES,MAX_MINUTES};
