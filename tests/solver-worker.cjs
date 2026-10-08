'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const O=require('../src/optimizer.cjs'),S=require('../src/simulator.cjs'),{fixture}=require('./research-sale-plans.cjs');
async function run(){
 const raw=fixture();let result,error;
 // A worker's self IS its global object. Supply browser APIs, without require
 // or Node modules, and execute the actual generated release bundle.
 const context={setTimeout,clearTimeout,console,structuredClone,performance,TextEncoder,TextDecoder,URL,URLSearchParams,atob,btoa,
  crypto:require('node:crypto').webcrypto,postMessage(message){if(message.type==='result')result=message.result;if(message.type==='error')error=message.error;}};
 context.self=context;vm.createContext(context);
 vm.runInContext(fs.readFileSync(require.resolve('../worker-source.js'),'utf8'),context);
 vm.runInContext(context.VIRTUE_WORKER_SOURCE,context);
 await context.onmessage({data:{config:raw,options:{maxMs:1500}}});
 assert.equal(error,undefined);assert.ok(result?.validatedReplay);assert.ok(result.search.checkpoints);
 for(const entry of result.shiftPlans){const verified=O.replay(raw,entry.plan.actions);assert.ok(S.reached(verified.s,verified.c));assert.equal(verified.s.t,entry.plan.end);}
 console.log('PASS built browser worker: standalone search bundle, checkpoint metadata, distinct plans, and independent replay.');
}
run().catch(error=>{console.error(error.message);process.exitCode=1;});
