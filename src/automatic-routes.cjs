'use strict';
const Route=require('./switch-sequence.cjs'),S=require('./simulator.cjs');
function limit(raw){return S.number(raw.plan?.maxShifts??12,'Maximum new shifts',0,30,true);}
function permutations(items){if(!items.length)return [[]];return items.flatMap((item,i)=>permutations(items.filter((_,j)=>j!==i)).map(rest=>[item,...rest]));}
function generate(raw){
 const ceiling=limit(raw),pool=new Map(),start=raw.farm.virtue;
 function add(codes,priority=20){const route=Route.normalize(codes,start),shifts=route.length-1;if(shifts>ceiling)return;const key=route.join(' '),old=pool.get(key);if(!old||priority<old.priority)pool.set(key,{route,shifts,priority});}
 const preset=Route.normalize(undefined,start),hEnding=[...preset.slice(0,-3),'integrity','resilience','humility'];
 add(preset,0);add(hEnding,1);
 for(const [index,route] of [preset,hEnding].entries()){const alternate=route.slice(),firstC=alternate.indexOf('curiosity');if(alternate[firstC+1]==='kindness'&&alternate[firstC+2]==='integrity'){[alternate[firstC+1],alternate[firstC+2]]=[alternate[firstC+2],alternate[firstC+1]];add(alternate,1.1+index*.1);}}
 // Removing unnecessary upgrade trips can beat a longer build. Every route
 // still executes its own purchases and preserves its final C for delivery.
 for(const route of [preset,hEnding])for(const removed of [[3],[4],[3,4]])add(route.filter((_,i)=>!removed.includes(i)),2+removed.length);
 for(const physical of permutations(['K','I','R'])){
  for(let researchVisits=1;researchVisits<=Math.min(10,Math.max(1,Math.ceil(ceiling/2)));researchVisits++){
   const build=['C',...physical];
   for(let i=1;i<researchVisits;i++)build.push('C',...(i<researchVisits-1?['K']:[]));
   build.push('H','K');
   for(const tail of permutations(['C','I','R','H'])){
    add([...build,...tail],10+Math.abs(researchVisits-3));
    // Delivery can allocate TE to fewer Virtues. These shorter candidates
    // may omit repeat delivery visits, never create free upgrades or gear.
    for(let i=0;i<tail.length;i++)add([...build,...tail.filter((_,j)=>i!==j)],15+Math.abs(researchVisits-2));
   }
  }
 }
 // Existing farms can need only delivery and missions, or no new shifts.
 for(const tail of permutations(['C','K','I','R','H'])){
  for(let length=1;length<=tail.length;length++)add(tail.slice(0,length),30);
  for(let i=0;i<tail.length;i++)add(tail.filter((_,j)=>i!==j),35);
 }
 add([start],40);
 const candidates=[...pool.values()].sort((a,b)=>a.priority-b.priority||b.shifts-a.shifts),chosen=[],seen=new Set();
 function take(item){const key=item.route.join(' ');if(!seen.has(key)){seen.add(key);chosen.push(item.route);}}
 for(const item of candidates.filter(x=>x.priority<2))take(item);
 // Reserve comparisons for different lengths before filling with alternative
 // orders. This is a bounded proposal search, not exhaustive enumeration.
 const counts=[...new Set(candidates.map(x=>x.shifts))].sort((a,b)=>Math.abs(a-Math.min(12,ceiling))-Math.abs(b-Math.min(12,ceiling))||b-a);
 for(const count of counts){if(chosen.length>=10)break;take(candidates.find(x=>x.shifts===count));}
 for(const item of candidates){if(chosen.length>=14)break;take(item);}
 return chosen;
}
module.exports={generate,limit};
