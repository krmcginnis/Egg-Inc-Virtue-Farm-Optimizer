'use strict';
const protobuf=require('protobufjs/light');const schema=require('./proto-schema.json');
const root=protobuf.Root.fromJSON(schema),Req=root.lookupType('ei.EggIncFirstContactRequest'),Resp=root.lookupType('ei.EggIncFirstContactResponse');
function eid(input){const s=String(input).trim().toUpperCase();if(!/^EI\d{16}$/.test(s))throw Error('Enter an Egg Inc. ID beginning EI followed by 16 digits.');return s;}
function encodeRequest(input){const obj={eiUserId:eid(input),deviceId:'virtue-research-optimizer',clientVersion:72,platform:1,rinfo:{eiUserId:'',clientVersion:72,version:'1.35.7',build:'111343',platform:'IOS',country:'US',language:'en'}};return Req.encode(Req.create(obj)).finish();}
function decodeResponse(bytes){const b=Resp.toObject(Resp.decode(bytes),{longs:Number,enums:Number});if(b.errorCode||b.errorMessage)throw Error(b.errorMessage||'Egg Inc. API error '+b.errorCode);if(!b.backup)throw Error('Egg Inc. API returned no player backup.');return b;}
function base64(bytes){if(typeof Buffer!=='undefined')return Buffer.from(bytes).toString('base64');let s='';for(const x of bytes)s+=String.fromCharCode(x);return btoa(s);}
function fromBase64(text){if(typeof Buffer!=='undefined')return new Uint8Array(Buffer.from(text.trim(),'base64'));const s=atob(text.trim());return Uint8Array.from(s,x=>x.charCodeAt(0));}
async function loadBackup(input){
 const data=base64(encodeRequest(input));if(location.protocol==='file:')throw Error('For EID import, start the app with Start-Virtue-Optimizer.cmd. Offline farm-file import works when opening index.html directly.');
 const token=globalThis.VIRTUE_PROXY_TOKEN;if(!token)throw Error('The local API helper is not running. Use the Windows launcher.');
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),35000);try{const res=await fetch('/api/backup',{method:'POST',headers:{'Content-Type':'application/json','X-Virtue-Token':token},body:JSON.stringify({eid:eid(input),data}),signal:controller.signal});const text=await res.text();if(!res.ok)throw Error(text||'Local helper returned HTTP '+res.status);return decodeResponse(fromBase64(text));}catch(e){if(e.name==='AbortError')throw Error('Egg Inc. API timed out. Try again after syncing the game.');throw e;}finally{clearTimeout(timeout);}}
module.exports={root,Req,Resp,eid,encodeRequest,decodeResponse,base64,fromBase64,loadBackup};
