const P=require('./planner.cjs');
let cancelled=false;self.onmessage=async({data})=>{if(data.cancel){cancelled=true;return;}cancelled=false;try{const reply=await P.plan(data.config,data.options,p=>self.postMessage({type:'progress',progress:p}),()=>cancelled);self.postMessage({type:reply.result?'result':'error',...reply});}catch(e){self.postMessage({type:'error',error:e.message});}};
