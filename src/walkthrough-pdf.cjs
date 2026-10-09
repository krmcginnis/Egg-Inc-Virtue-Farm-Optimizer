'use strict';
const {PDFDocument,rgb}=require('./vendor/pdf-lib.min.cjs'),U=require('./shift-summary.cjs'),F=require('./pdf-font.cjs'),fonts=require('./vendor/pdf-fonts.cjs');
const Numbers=require('./number-format.cjs');
const G=require('./guide-layout.cjs'),version=require('./version.cjs'),Model=require('./assumption-notices.cjs'),S=require('./simulator.cjs');
const gemsText=require('./gems-text.cjs'),Sleep=require('./sleep-schedule.cjs');
function text(value){return gemsText(value).replace(/[–—−]/g,'-').replace(/→/g,'->').replace(/\s+/g,' ').replace(/[^\x20-\x7e\xa0-\xff\u2122]/g,'?');}
function duration(seconds){const total=Math.max(0,Math.ceil(seconds)),d=Math.floor(total/86400),h=Math.floor(total%86400/3600),m=Math.floor(total%3600/60),s=total%60;return [d?d+'d':'',h?h+'h':'',m?m+'m':'',s?s+'s':''].filter(Boolean).join(' ')||'0s';}
function timestamp(t,zone){return new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(new Date(t*1000));}
function waits(t){return 'Online waiting '+duration(t.onlineSeconds)+' | Offline '+duration(t.offlineSeconds)+' ('+t.offlineBreaks+' breaks)'+(t.interactionSeconds?' | Interactions '+duration(t.interactionSeconds):'')+(t.fuelSeconds?' | Fueling '+duration(t.fuelSeconds):'')+(t.sleepSeconds?' | Sleep included '+duration(t.sleepSeconds):'')+(t.siloEmptySeconds?' | Silos empty during sleep '+duration(t.siloEmptySeconds):'');}
function switchCost(shift){return shift.hasSwitch?'Switch Cost: '+Numbers.format(shift.soulCost)+' Soul Eggs':'Starting Farm - No Switch Cost';}
function rateLines(shift){return ['Maximum Earning Rate: '+Numbers.format(shift.maxRates.earning*3600)+' gems/hour','Maximum Shipping Capacity: '+Numbers.format(shift.maxRates.shipping*3600)+' eggs/hour','Maximum Egg Laying Rate: '+Numbers.format(shift.maxRates.laying*3600)+' eggs/hour','Maximum Delivered Egg Rate: '+Numbers.format(shift.maxRates.delivery*3600)+' eggs/hour'];}
async function create(raw,result){
 const summary=U.summarize(raw,result),zone=raw.plan.eventTimezone||'America/Los_Angeles',sleep=Sleep.forPlan(raw.plan,result.start,result.end),pdf=await PDFDocument.create(),normal=F.embed(pdf,fonts.regular,'VirtueSans-Regular'),bold=F.embed(pdf,fonts.bold,'VirtueSans-Bold');
 pdf.setTitle('Egg Inc. Virtue Farm Optimizer - '+result.target+' TE purchase walkthrough');pdf.setAuthor('Egg Inc. Virtue Farm Optimizer');pdf.setSubject('Shift Summaries and purchase targets between online/offline breaks');pdf.setCreator('Egg Inc. Virtue Farm Optimizer '+version);
 const width=612,height=792,margin=36,body=width-margin*2,bottom=height-40;
 const ink=rgb(.12,.18,.24),muted=rgb(.38,.45,.51),green=rgb(.12,.43,.33),line=rgb(.83,.88,.89),paper=rgb(.97,.98,.98),chipFill=rgb(.93,.96,.97),gold=rgb(.52,.36,.1);
 let page,y,section='Shift Summaries';const pages=[];
 function draw(value,x,top,size=9,font=normal,color=ink){page.drawText(text(value),{x,y:height-top-size,size,font,color});}
 function rectangle(x,top,w,h,fill,border=line){page.drawRectangle({x,y:height-top-h,width:w,height:h,color:fill,borderColor:border,borderWidth:.5});}
 function wrap(value,max,size=9,font=normal){const words=text(value).split(' '),lines=[];let current='';for(const word of words){const next=current?current+' '+word:word;if(current&&font.widthOfTextAtSize(next,size)>max){lines.push(current);current=word;}else current=next;}if(current)lines.push(current);return lines;}
 function paragraph(value,top,size=9,color=muted){const lines=wrap(value,body,size);for(let i=0;i<lines.length;i++)draw(lines[i],margin,top+i*(size+4),size,normal,color);return top+lines.length*(size+4);}
 function newPage(first=false){page=pdf.addPage([width,height]);pages.push(page);draw('EGG INC. VIRTUE FARM OPTIMIZER '+version,margin,30,10,bold,green);draw('Purchase Walkthrough',margin,49,first?21:15,bold);y=first?85:77;
  if(first){y=paragraph('Target: '+result.target+' TE | Duration: '+duration(result.seconds)+' | New switches: '+result.switches,y,10,ink)+4;if(result.solverVersion>=2)y=paragraph('Research sales used: '+result.actualResearchSales,y);else if(result.selectedResearchSales)y=paragraph('Research sales: '+result.selectedResearchSales,y);y=paragraph('Start: '+timestamp(result.start,zone),y);y=paragraph('Finish: '+timestamp(result.end,zone),y);y=paragraph(result.solverVersion>=2?'Automatic visit timing | Timezone: '+zone:'C1 limit: '+(raw.plan.c1MaxMinutes??60)+' min | K1 limit: '+(raw.plan.k1MaxMinutes??60)+' min | Timezone: '+zone,y);if(raw.plan.sleep?.enabled)y=paragraph('Sleep: '+raw.plan.sleep.start+'-'+raw.plan.sleep.end+' | '+zone+' | Refill silos before bed.',y);y=paragraph(waits(summary.totals),y)+12;}
  else{draw(result.target+' TE | '+duration(result.seconds)+' | '+zone,margin,y,9,normal,muted);y+=24;}
  draw(section,margin,y,12,bold,green);y+=26;
 }
 function chipRows(activities){const rows=[];let row=[],used=0;for(const activity of activities){const label=text(activity.label),value=activity.value?text(activity.value):'',max=body-28;let size=9;while(size>6.5&&normal.widthOfTextAtSize(label,size)+(value?bold.widthOfTextAtSize(' '+value,size):0)+14>max)size-=.25;
  const w=Math.min(max,normal.widthOfTextAtSize(label,size)+(value?bold.widthOfTextAtSize(' '+value,size):0)+14);if(row.length&&used+w>max){rows.push(row);row=[];used=0;}row.push({label,value,size,w,kind:activity.kind});used+=w+6;}if(row.length)rows.push(row);return rows;}
 function card(shift,rows,continued,last){const waitLines=last?[...wrap(waits(shift),body-28,8),...rateLines(shift)]:[],h=62+rows.length*24+(last?waitLines.length*12+8:8);rectangle(margin,y,body,h,paper);rectangle(margin,y,3,h,green,green);
  const title=shift.phase+' - '+shift.name+(continued?' (continued)':''),timing=duration(shift.seconds)+' | +'+shift.teGained+' TE';draw(title,margin+14,y+12,11,bold);draw(timing,width-margin-14-normal.widthOfTextAtSize(text(timing),9),y+14,9,normal,muted);draw('Starts: '+timestamp(shift.start,zone),margin+14,y+31,8.5,normal,muted);draw('Ends: '+timestamp(shift.end,zone),margin+14,y+44,8.5,normal,muted);const cost=switchCost(shift);draw(cost,width-margin-14-normal.widthOfTextAtSize(text(cost),8.5),y+31,8.5,normal,green);
  for(let ri=0;ri<rows.length;ri++){let x=margin+14;const top=y+62+ri*24;for(const chip of rows[ri]){const tier=chip.kind==='tier';rectangle(x,top,chip.w,20,tier?rgb(.99,.96,.87):chipFill);draw(chip.label,x+7,top+5,chip.size,normal,tier?gold:ink);if(chip.value)draw(' '+chip.value,x+7+normal.widthOfTextAtSize(chip.label,chip.size),top+5,chip.size,bold,green);x+=chip.w+6;}}
  for(let i=0;i<waitLines.length;i++)draw(waitLines[i],margin+14,y+62+rows.length*24+i*12,8,normal,muted);y+=h+10;
 }
 newPage(true);
 for(const shift of summary.shifts){const rows=chipRows(shift.activities),waitHeight=(wrap(waits(shift),body-28,8).length+rateLines(shift).length)*12+8;let offset=0;
  while(offset<rows.length){const available=bottom-y,remaining=rows.length-offset,fullHeight=62+remaining*24+waitHeight;
   if(fullHeight<=available){card(shift,rows.slice(offset),offset>0,true);break;}
   // Keep a normal card together. Split only cards taller than a fresh page.
   const freshSpace=bottom-127;if(fullHeight<=freshSpace||available<80){newPage();continue;}
   const count=Math.min(remaining-1,Math.floor((available-70)/24));if(count<1){newPage();continue;}card(shift,rows.slice(offset,offset+count),offset>0,false);offset+=count;newPage();
  }
 }
 if(!summary.shifts.length)y=paragraph('The target is already available to claim.',y,11,ink)+12;
 if(summary.shifts.length){section='Quick Guide';newPage();
  function guideHeader(shift,continued=false){draw(shift.phase+' - '+shift.name+(continued?' (continued)':''),margin,y,13,bold);const timing=duration(shift.seconds)+' | +'+shift.teGained+' TE';draw(timing,width-margin-normal.widthOfTextAtSize(text(timing),9),y+2,9,normal,muted);y+=21;draw('Shift starts: '+timestamp(shift.start,zone),margin,y,8.5,normal,muted);const cost=switchCost(shift);draw(cost,width-margin-normal.widthOfTextAtSize(text(cost),8.5),y,8.5,normal,green);y+=13;draw('Shift ends: '+timestamp(shift.end,zone),margin,y,8.5,normal,muted);y+=23;}
  function footerLines(step,shift){const values=[];if(!step.activities.length)values.push([step.break?'No purchases before this break.':'No further purchases in this shift.',false]);
   if(step.shipRun){const r=step.shipRun;values.push(['Stay on Humility: '+duration(r.end-r.t)+' to fund, fuel, and launch.',true]);for(const m of r.batches){values.push([m.count+' x '+m.label,false],['First launch: '+timestamp(m.firstLaunch,zone),false],['Final launch: '+timestamp(m.lastLaunch,zone),false]);}values.push(['Final launches complete: '+timestamp(r.end,zone),true],['Final ships return later; do not wait for them.',false]);}
   if(step.hiddenOnlineSeconds)values.push(['Brief online waits included: '+duration(step.hiddenOnlineSeconds),false]);if(step.interactionSeconds)values.push(['Interactions: '+duration(step.interactionSeconds),false]);
   if(step.break){const b=step.break;values.push([(b.mode==='fuel'?'Collect fuel for ':b.sleepSeconds>=b.seconds-.01?'Sleep for ':b.sleepSeconds>0?'Wait including sleep for ':b.mode==='offline'?'Go offline for ':'Wait online for ')+duration(b.seconds),true],['Break starts: '+timestamp(b.start,zone),false],[(Sleep.sleeping(sleep,b.end)?'Wait ends: ':'Resume: ')+timestamp(b.end,zone),false]);if(b.reason)values.push([b.reason,false]);if(b.siloEmptySeconds)values.push(['Production paused with empty silos: '+duration(b.siloEmptySeconds),false]);}
   else values.push(['Shift ends: '+timestamp(shift.end,zone),true]);
   return values.flatMap(([value,strong])=>wrap(value,body-40,8.5,strong?bold:normal).map(line=>({value:line,strong})));
  }
  function guideRows(activities){return G.groups(activities).flatMap(group=>[{type:'tier',label:group.label,tier:group.tier,height:20},...group.items.map(item=>({type:'item',...item,tier:group.tier,height:22}))]);}
  function rowsHeight(rows){return rows.reduce((sum,row)=>sum+row.height,0);}
  function continuedRows(rows,offset){const first=rows[offset],head=offset>0&&first?.type==='item'?[{type:'tier',label:(first.tier===null?'Other Purchases':'Tier '+first.tier)+' (continued)',tier:first.tier,height:20}]:[];return head;}
  function guideCard(step,index,rows,footer,continued,last){const h=42+rowsHeight(rows)+(last?footer.length*13+16:12);rectangle(margin,y,body,h,paper);rectangle(margin,y,3,h,green,green);draw((step.activities.length?'Purchase Group ':'Break ')+(index+1)+(continued?' (continued)':''),margin+14,y+10,10,bold);draw((step.activities.length?'Purchases start: ':'Starts: ')+timestamp(step.start,zone),margin+14,y+27,8,normal,muted);
   let top=y+42;for(const row of rows){if(row.type==='tier'){rectangle(margin+14,top,body-28,row.height,row.tier===null?chipFill:rgb(.99,.96,.87));draw(row.label,margin+20,top+4,9,bold,row.tier===null?muted:gold);}else{draw(row.label,margin+20,top+5,9,normal,ink);if(row.value)draw(row.value,margin+20+normal.widthOfTextAtSize(text(row.label),9)+6,top+5,9,bold,green);page.drawLine({start:{x:margin+14,y:height-top-row.height},end:{x:width-margin-14,y:height-top-row.height},thickness:.35,color:line});}top+=row.height;}
   if(last){rectangle(margin+14,top,body-28,footer.length*13+10,step.break?.mode==='offline'?rgb(.89,.95,.92):chipFill);for(let i=0;i<footer.length;i++)draw(footer[i].value,margin+20,top+5+i*13,8.5,footer[i].strong?bold:normal,footer[i].strong?green:muted);}
   y+=h+10;
  }
  for(const shift of summary.shifts){const first=shift.quickGuide[0],firstHeight=first?42+rowsHeight(guideRows(first.activities))+footerLines(first,shift).length*13+16:40;if(bottom-y<57+Math.min(firstHeight,bottom-184))newPage();guideHeader(shift);
   if(!shift.quickGuide.length)y=paragraph('No purchases or breaks in this shift.',y)+12;
   for(const [index,step]of shift.quickGuide.entries()){const rows=guideRows(step.activities),footer=footerLines(step,shift);let offset=0;
    while(true){const head=continuedRows(rows,offset),remaining=rows.length-offset,available=bottom-y,fullHeight=42+rowsHeight(head)+rowsHeight(rows.slice(offset))+footer.length*13+16;
     if(fullHeight<=available){guideCard(step,index,head.concat(rows.slice(offset)),footer,offset>0,true);break;}
     const freshSpace=bottom-184;if(fullHeight<=freshSpace||available<90){newPage();guideHeader(shift,true);continue;}
     let count=0,used=rowsHeight(head);while(count<remaining-1&&used+rows[offset+count].height<=available-54){used+=rows[offset+count].height;count++;}if(count&&rows[offset+count-1].type==='tier')count--;if(count<1){newPage();guideHeader(shift,true);continue;}guideCard(step,index,head.concat(rows.slice(offset,offset+count)),footer,offset>0,false);offset+=count;newPage();guideHeader(shift,true);
    }
   }
   const completeHeight=40+rateLines(shift).length*12;
   if(bottom-y<completeHeight+6){newPage();guideHeader(shift,true);}
   rectangle(margin,y,body,completeHeight,rgb(.89,.95,.92));draw('Shift Complete: '+timestamp(shift.end,zone),margin+14,y+10,9,bold,green);
   rateLines(shift).forEach((value,i)=>draw(value,margin+14,y+29+i*12,8.5,normal,green));y+=completeHeight+10;
  }
 }
 const shipRuns=result.actions.filter(a=>a.type==='ship-run'&&a.launches?.length);
 if(shipRuns.length){section='Ship Launch Schedule';newPage();
  for(const run of shipRuns){y=paragraph((run.phase||'H1')+' Humility visit: '+run.count+' launches. Final launches complete at '+timestamp(run.end,zone)+'. Continue the listed plan; do not wait for final ships to return.',y,9,ink)+10;
   function headings(){draw('Launch date and time',margin,y,9,bold);draw('Mission',margin+248,y,9,bold);draw('Slot',width-margin-26,y,9,bold);y+=24;}
   headings();for(const [i,launch]of run.launches.entries()){const dates=wrap(timestamp(launch.t,zone),236,8.5),names=wrap((i+1)+'. '+launch.label,body-286,8.5),h=Math.max(dates.length,names.length)*12+12;
    if(y+h>bottom){newPage();headings();}if(i%2===0)rectangle(margin,y,body,h,paper);
    dates.forEach((v,j)=>draw(v,margin+6,y+5+j*12,8.5));names.forEach((v,j)=>draw(v,margin+248,y+5+j*12,8.5));draw(launch.slot,width-margin-22,y+5,8.5,bold,green);y+=h;
   }y+=12;
   if(run.waits?.length){if(bottom-y<50)newPage();draw('Return and funding waits',margin,y,10,bold);y+=22;
    for(const pause of run.waits){if(pause.mode!=='offline'&&pause.seconds<10)continue;const value=(pause.sleepSeconds>0||/^Sleep hours/.test(pause.reason)?'Wait including sleep ':pause.mode==='offline'?'Offline ':'Online ')+duration(pause.seconds)+' - '+pause.reason+(Sleep.sleeping(sleep,pause.end)?'. Wait ends: ':'. Resume: ')+timestamp(pause.end,zone),h=wrap(value,body,8.5).length*12.5;if(y+h>bottom)newPage();y=paragraph(value,y,8.5)+6;}
   }
  }
 }
 const prepared=S.prepare(raw,{oneStartingSilo:result.initialSiloRule==='one'||result.actions.some(a=>a.initialSiloRule==='one')}),note=[(sleep?'Assumes full habitats and planned artifact sets. Sleep uses offline earnings, and production pauses after silo coverage expires. Refill before bed. Awake routine silo refills':'Assumes full habitats, planned artifact sets, and no sleep or downtime. Routine silo refills')+' are extra check-ins, excluded from earning-break counts. Follow listed fueling steps. Final ship returns do not delay departure. Use the plan as a starting point; actual results may vary.',...Model.notices(prepared.s,prepared.c)].join(' ');
 const noteHeight=wrap(note,body,8).length*12;if(y+noteHeight>bottom)newPage();paragraph(note,y,8);
 for(let i=0;i<pages.length;i++){page=pages[i];page.drawLine({start:{x:margin,y:30},end:{x:width-margin,y:30},thickness:.5,color:line});draw('Generated locally - research items in game order',margin,height-22,7,normal,muted);const footer='Page '+(i+1)+' of '+pages.length;draw(footer,width-margin-normal.widthOfTextAtSize(footer,7),height-22,7,normal,muted);}
 return pdf.save();
}
module.exports={create};
