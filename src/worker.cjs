const P=require('./planner.cjs');
const Continuation=require('./plan-continuation.cjs');
let cancelled=false,seeds=[];
self.onmessage=async({data})=>{
 if(data.cancel){cancelled=true;return;}
 if(data.seed){seeds.push(data.seed);if(seeds.length>4)seeds.shift();return;}
 cancelled=false;seeds=[];
 const options={...data.options,...(data.options?.shareCandidates?{onCandidate:candidate=>self.postMessage({type:'candidate',candidate}),takeIncumbents:()=>seeds.splice(0)}:{})};
 try{
  if(data.continuation){const continuation=await Continuation.search(data.continuation,options,p=>self.postMessage({type:'progress',progress:p}),()=>cancelled);self.postMessage({type:'continuation',continuation});return;}
  const reply=await P.plan(data.config,options,p=>self.postMessage({type:'progress',progress:p}),()=>cancelled);self.postMessage({type:reply.result?'result':'error',...reply});
 }catch(e){self.postMessage({type:'error',error:e.message});}
};
