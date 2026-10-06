'use strict';
function farm(raw){return 'virtue-farm-'+raw.farm.claimed.reduce((sum,n)=>sum+Number(n),0)+'TE';}
function plan(raw,seconds){const total=Math.max(0,Math.ceil(seconds)),d=Math.floor(total/86400),h=Math.floor(total%86400/3600),m=Math.floor(total%3600/60);return farm(raw)+'-'+d+'d-'+h+'h-'+m+'m.json';}
module.exports={farm:raw=>farm(raw)+'.json',plan,pdf:(raw,seconds)=>plan(raw,seconds).replace(/\.json$/,'.pdf')};
