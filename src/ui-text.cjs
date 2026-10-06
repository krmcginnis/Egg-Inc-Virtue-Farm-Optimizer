'use strict';
// Title Case for interface labels; preserve acronyms, game suffixes and values.
const small=new Set('a an and as at but by for from in of on or per the to up vs with'.split(' '));
module.exports=function titleCase(value){let first=true;return String(value).replace(/\b[A-Za-z]+\b/g,word=>{const out=word===word.toUpperCase()||(!first&&small.has(word.toLowerCase()))?word:word[0].toUpperCase()+word.slice(1);first=false;return out;});};
