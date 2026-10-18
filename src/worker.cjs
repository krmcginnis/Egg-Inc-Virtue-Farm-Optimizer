const P=require('./planner.cjs');
const Continuation=require('./plan-continuation.cjs');
const Verification=require('./plan-verification.cjs');
let cancelled=false,seeds=[],nextClaim=0;const claims=new Map();
self.onmessage=async({data})=>{
 if(data.taskReply){const done=claims.get(data.taskReply.id);if(done){claims.delete(data.taskReply.id);done(data.taskReply);}return;}
 if(data.cancel){cancelled=true;return;}
 if(data.seed){seeds.push(data.seed);if(seeds.length>4)seeds.shift();return;}
 cancelled=false;seeds=[];
 const options={...data.options,...(data.options?.shareCandidates?{onCandidate:candidate=>self.postMessage({type:'candidate',candidate}),takeIncumbents:()=>seeds.splice(0)}:{}),...(data.options?.coordinateTasks?{claimTask:key=>new Promise(resolve=>{const id=++nextClaim;claims.set(id,resolve);self.postMessage({type:'task-claim',id,key});}),releaseTask:key=>self.postMessage({type:'task-release',key})}:{})};
 const requestDeadline=options.absoluteDeadline??Date.now()+Number(options.maxMs??90000);
 const verify=async(config,result)=>{
  if(options.disableExactRefinement||options.portfolioVariant||result?.solverVersion!==2||cancelled||Number(options.maxMs??90000)<5000)return result;
  const maxMs=Math.min(5000,requestDeadline-Date.now());if(maxMs<100)return result;
  try{return await Verification.search(config,result,{maxMs,absoluteDeadline:requestDeadline},p=>self.postMessage({type:'progress',progress:p}),()=>cancelled);}catch{return result;}
 };
 try{
  if(data.verification){const result=await Verification.search(data.verification.config,data.verification.result,options,p=>self.postMessage({type:'progress',progress:p}),()=>cancelled);self.postMessage({type:'verification',result});return;}
  if(data.continuation){const continuation=await Continuation.search(data.continuation,options,p=>self.postMessage({type:'progress',progress:p}),()=>cancelled);continuation.result=await verify(continuation.config,continuation.result);self.postMessage({type:'continuation',continuation});return;}
  const reply=await P.plan(data.config,options,p=>self.postMessage({type:'progress',progress:p}),()=>cancelled);if(reply.result)reply.result=await verify(data.config,reply.result);self.postMessage({type:reply.result?'result':'error',...reply});
 }catch(e){self.postMessage({type:'error',error:e.message});}
};
