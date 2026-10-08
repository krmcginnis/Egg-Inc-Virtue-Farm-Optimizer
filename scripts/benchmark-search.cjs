'use strict';
// Reproducible developer comparison. Private farm files stay outside source;
// only timing, counts, and replay status are printed, never account contents.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const S=require('../src/simulator.cjs'),O=require('../src/optimizer.cjs'),ShiftPlans=require('../src/shift-plans.cjs');
const Q=require('../tests/search-quality.cjs');
const Sleep=require('../src/sleep-schedule.cjs');
const args=process.argv.slice(2),allowed=new Set(['--farm','--baseline','--budgets','--sleep','--incumbent']);
const opts={};for(let i=0;i<args.length;i+=2){if(!allowed.has(args[i])||!args[i+1])throw Error('Use --farm PATH, optional --baseline CHECKOUT, --budgets 90000, --sleep 23:00,07:00, and --incumbent SAVED_PLAN.');opts[args[i]]=args[i+1];}
async function run(){
 console.log(JSON.stringify({benchmark:'exhaustive small research decisions',...Q.quality()}));
 console.log(JSON.stringify({benchmark:'identical paid continuation',...Q.reuse()}));
 if(!opts['--farm'])return;
 const document=JSON.parse(fs.readFileSync(opts['--farm'],'utf8')),raw=document.config||document;
 if(opts['--sleep']){const times=opts['--sleep'].split(',');if(times.length!==2)throw Error('Use --sleep START,WAKE in HH:MM.');Sleep.minutes(times[0],'Sleep start');Sleep.minutes(times[1],'Wake time');if(times[0]===times[1])throw Error('Sleep start and wake time must differ.');raw.plan.sleep={enabled:true,start:times[0],end:times[1]};}
 const saved=opts['--incumbent']?JSON.parse(fs.readFileSync(opts['--incumbent'],'utf8')):null;
 const incumbent=saved?{config:saved.config||saved.raw,result:saved.result}:undefined;
 const baseline=opts['--baseline']?require(path.resolve(opts['--baseline'],'src/optimizer.cjs')):O;
 const budgets=(opts['--budgets']||'90000').split(',').map(n=>S.number(n,'Budget',100,600000,true));
 for(const maxMs of budgets)for(const mode of ['baseline','checkpoints-and-lookahead']){
  const solver=mode==='baseline'?baseline:O,options={maxMs,...(incumbent?{incumbent}:{}),...(mode==='baseline'&&!opts['--baseline']?{disableCheckpoints:true,disableLookahead:true}:{})};
  const start=performance.now();let result;
  try{result=await solver.solve(structuredClone(raw),options);}catch(error){
   console.log(JSON.stringify({benchmark:'full search',mode,budgetMs:maxMs,elapsedMs:performance.now()-start,status:'no-complete-plan-found',reason:error.message}));continue;
  }
  ShiftPlans.validate(result);
  const plans=result.shiftPlans.map(entry=>{
   const checked=solver.replay(raw,entry.plan.actions);assert.equal(checked.s.t,entry.plan.end);assert.ok(S.reached(checked.s,checked.c));
   return {shifts:entry.switches,seconds:entry.plan.seconds,days:entry.plan.seconds/86400,replayed:true};
  });
  console.log(JSON.stringify({benchmark:'full search',mode,budgetMs:maxMs,elapsedMs:performance.now()-start,plans,search:result.search}));
 }
}
run().catch(error=>{console.error(error.message);process.exitCode=1;});
