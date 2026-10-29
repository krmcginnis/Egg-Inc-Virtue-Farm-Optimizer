'use strict';
const formats=new Map();
function timestamp(t,zone,{year=true,compact=false}={}){
 const key=zone+':'+year+':'+compact;
 if(!formats.has(key))formats.set(key,new Intl.DateTimeFormat('en-US',{timeZone:zone,year:year?'numeric':undefined,month:'short',day:'numeric',weekday:compact?undefined:'short',hour:'2-digit',minute:'2-digit',second:compact?undefined:'2-digit',hourCycle:'h23',timeZoneName:'short'}));
 return formats.get(key).format(new Date(t*1000));
}
function localInput(t){const d=new Date(t*1000);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16).replace('T',' ');}
function parseLocal(value){
 const normalized=String(value).trim().replace(' ','T');
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(normalized))return NaN;
 const t=new Date(normalized).getTime()/1000;
 return Number.isFinite(t)&&localInput(t).replace(' ','T')===normalized?t:NaN;
}
module.exports={timestamp,localInput,parseLocal};
