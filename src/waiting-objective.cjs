'use strict';
// Persistent paths share prefixes, so counting once per path stays inexpensive.
const counts=new WeakMap();
function offlineBreaks(s){let p=s.path,pending=[];while(p&&!counts.has(p)){pending.push(p);p=p.prev;}let count=p?counts.get(p):0;for(let i=pending.length-1;i>=0;i--){const node=pending[i];if(node.action.type==='wait'&&node.action.earningsMode==='offline')count++;if(node.action.type==='ship-run')count+=node.action.offlineBreaks||0;counts.set(node,count);}return count;}
function better(a,b){if(!a)return false;if(!b)return true;if(a.t<b.t-1e-6)return true;if(Math.abs(a.t-b.t)>1e-6)return false;return offlineBreaks(a)<offlineBreaks(b)||offlineBreaks(a)===offlineBreaks(b)&&a.stage<b.stage;}
module.exports={offlineBreaks,better};
