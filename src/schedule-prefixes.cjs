'use strict';
const S=require('./simulator.cjs');

// Bound to one paid starting farm, prepared context and execution mode. It is
// discarded after this comparison; no previous farm or interrupted solve is
// reused. States keep their paid history and are cloned on both store and hit.
class Prefixes {
 constructor(initial,context,{maxEntries=768}={}){
  this.initial=initial;this.context=context;this.maxEntries=maxEntries;
  this.root={children:new Map()};this.keys=new WeakMap();this.mode=null;
  this.hits=0;this.misses=0;this.entries=0;
 }
 bind(initial,context,mode){
  if(initial!==this.initial||context!==this.context)throw Error('Schedule prefixes belong to a different starting farm or context.');
  const key=JSON.stringify(mode);
  if(this.mode!==null&&this.mode!==key)throw Error('Schedule prefixes use a different execution mode.');
  this.mode=key;return this.root;
 }
 key(action){
  if(!this.keys.has(action))this.keys.set(action,JSON.stringify(action));
  return this.keys.get(action);
 }
 get(node,action){
  const child=node.children.get(this.key(action));
  if(child){this.hits++;return child;}this.misses++;return null;
 }
 put(node,action,state){
  if(this.entries>=this.maxEntries)return null;
  const child={children:new Map(),state:S.clone(state)};
  node.children.set(this.key(action),child);this.entries++;return child;
 }
 summary(){return {hits:this.hits,misses:this.misses,entries:this.entries};}
}
module.exports={Prefixes};
