'use strict';
// Older timelines retain their replay fields and reasons. Update their wording
// only when presenting them, including notices and exported walkthroughs.
module.exports=value=>String(value).replace(/\bEgg Inc\b(?!\.)/g,'Egg Inc.').replace(/\bcash\b/gi,word=>word==='CASH'?'GEMS':word==='Cash'?'Gems':'gems');
