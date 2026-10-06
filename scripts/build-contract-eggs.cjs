'use strict';
// Developer-only extraction from the pinned Wasmegg catalog. Normal imports
// use the small bundled lookup and need no extra game API request.
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path'),A=require('../src/api.cjs');
const input=process.argv[2];if(!input)throw Error('Supply the pinned Wasmegg periodicals/data/contracts.json path.');
const bytes=fs.readFileSync(input),type=A.root.lookupType('ei.Contract'),contracts={};
for(const entry of JSON.parse(bytes)){
 const contract=type.toObject(type.decode(A.fromBase64(entry.proto)),{longs:Number,enums:Number});
 if(!contract.identifier||contract.identifier!==entry.id)throw Error('Invalid contract catalog entry: '+entry.id);
 contracts[entry.id]=contract.customEggId||null;
}
const catalog={source:'Wasmegg periodicals/data/contracts.json',sourceCommit:'9c2c0e4e7e5ac8bbf179f423f9fdb9a960993e67',sourceSHA256:crypto.createHash('sha256').update(bytes).digest('hex'),colleggtibleCutoff:1719435600,contracts};
fs.writeFileSync(path.resolve(__dirname,'../src/contract-eggs.json'),JSON.stringify(catalog,null,2)+'\n');
console.log('Extracted '+Object.keys(contracts).length+' contract identities; '+Object.values(contracts).filter(Boolean).length+' custom eggs.');
