'use strict';
const Strategy=require('./planning-strategy.cjs'),Route=require('./switch-sequence.cjs');
const SEARCH_LIMIT=30;
// In new searches the entered count is a comparison target. Unflagged saves
// retain their original hard ceiling when replayed.
function expanded(plan={}){return plan.shiftComparisonVersion===2&&Strategy.automatic(plan);}
function search(plan={}){if(expanded(plan)){if(!Number.isInteger(plan.maxShifts)||plan.maxShifts<0||plan.maxShifts>30)throw Error('Specified new shifts must be a whole number from 0 to 30.');return Math.min(SEARCH_LIMIT,plan.maxShifts+1);}return plan.maxShifts??12;}
function specified(raw){return Strategy.automatic(raw.plan||{})?raw.plan?.maxShifts??12:Route.normalize(raw.plan?.sequence,raw.farm.virtue,{required:true}).length-1;}
module.exports={SEARCH_LIMIT,expanded,search,specified};
