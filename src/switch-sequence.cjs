'use strict';
const DEFAULT_ROUTE=require('./default-route.cjs');
const codes={C:'curiosity',K:'kindness',I:'integrity',R:'resilience',H:'humility'};
const names=new Set(Object.values(codes));
// Strip copied display formatting without hiding unknown route items.
function clean(value){return String(value).normalize('NFKC').replace(/[\u00ad\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/g,'').replace(/[`*'"\u2018\u2019\u201c\u201d]/g,'');}
function parse(value,options={}){
 const items=Array.isArray(value)?value:typeof value==='string'?[value]:[];
 const tokens=items.flatMap(item=>clean(item).split(/[\s,;:>\u2192\u21d2\u27f6\u279c|/\\.\-\u2013\u2014()[\]{}]+/).filter(Boolean));
 if(!tokens.length){if(options.required)throw Error('Enter a Switch Sequence for User Selected Sequence.');return [...DEFAULT_ROUTE];}
 return tokens.flatMap(token=>{
  const upper=token.toUpperCase(),lower=token.toLowerCase();
  if(names.has(lower))return [lower];
  if(/^[CKIRH]\d*$/.test(upper))return [codes[upper[0]]];
  if(/^[CKIRH]+$/.test(upper))return [...upper].map(code=>codes[code]);
  throw Error('Unrecognized switch sequence item '+JSON.stringify(token)+'. Use C, K, I, R, H or full Virtue names, separated by spaces, commas or arrows.');
 });
}
function normalize(value,virtue,options){let route=parse(value,options);if(route[0]!==virtue)route.unshift(virtue);return route.filter((egg,i)=>i===0||egg!==route[i-1]);}
function defaultSwitches(virtue){return normalize(DEFAULT_ROUTE,virtue).length-1;}
module.exports={parse,normalize,defaultSwitches};
