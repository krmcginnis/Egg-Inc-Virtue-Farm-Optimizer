'use strict';
// The menu owns routing in new saves. Legacy farms used a separate checkbox;
// keep their automatic/custom choice when presenting them in the new menu.
function selected(plan={}){
 if(plan.strategy==='wasmegg'||plan.strategy==='user')return plan.strategy;
 if(plan.strategy&&!['auto','free'].includes(plan.strategy))return plan.strategy;
 if(plan.strategy==='auto'&&plan.strategyVersion>=2)return 'auto';
 return plan.autoSequence===false||(plan.autoSequence!==true&&plan.sequence!=null)?'user':'auto';
}
function upgrade(plan){plan.strategy=selected(plan);plan.autoSequence=plan.strategy!=='user';plan.strategyVersion=2;return plan;}
function automatic(plan){return plan.strategy==='user'?false:plan.strategyVersion>=2?true:plan.autoSequence===true;}
module.exports={selected,upgrade,automatic};
