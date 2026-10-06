'use strict';
const {PDFFont,PDFHexString,PDFString,StandardFontEmbedder}=require('./vendor/pdf-lib.min.cjs');
// The bundled Latin font subsets include precomputed metrics and glyph maps.
// Embed them directly, keeping the app independent of font services/installations.
function bytes(base64){return Uint8Array.from(atob(base64),c=>c.charCodeAt(0));}
function embed(pdf,data,name){
 const ctx=pdf.context,program=ctx.register(ctx.flateStream(bytes(data.data),{Length1:bytes(data.data).length})),mapping=ctx.register(ctx.flateStream(bytes(data.mapping)));
 const descriptor=ctx.register(ctx.obj({Type:'FontDescriptor',FontName:name,Flags:32,FontBBox:data.bbox,ItalicAngle:0,Ascent:data.ascent,Descent:data.descent,CapHeight:730,StemV:80,FontFile2:program}));
 const descendant=ctx.register(ctx.obj({Type:'Font',Subtype:'CIDFontType2',BaseFont:name,CIDSystemInfo:{Registry:PDFString.of('Adobe'),Ordering:PDFString.of('Identity'),Supplement:0},FontDescriptor:descriptor,DW:1000,W:[32,data.widths.slice(32),0x2122,[data.trademarkWidth]],CIDToGIDMap:mapping}));
 const cmap='/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /VirtueSansUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n2 beginbfrange\n<0020> <00FF> <0020>\n<2122> <2122> <2122>\nendbfrange\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend';
 const unicode=ctx.register(ctx.flateStream(cmap)),ref=ctx.register(ctx.obj({Type:'Font',Subtype:'Type0',BaseFont:name,Encoding:'Identity-H',DescendantFonts:[descendant],ToUnicode:unicode}));
 const embedder=StandardFontEmbedder.for('Helvetica');Object.assign(embedder,{fontName:name,encodeText:value=>PDFHexString.of([...value].map(c=>c.charCodeAt(0).toString(16).padStart(4,'0')).join('')),widthOfTextAtSize:(value,size)=>[...value].reduce((n,c)=>n+(c.charCodeAt(0)===0x2122?data.trademarkWidth:data.widths[c.charCodeAt(0)]||0),0)*size/1000,heightOfFontAtSize:size=>(data.ascent-data.descent)*size/1000,sizeOfFontAtHeight:h=>h*1000/(data.ascent-data.descent),embedIntoContext:async()=>ref});
 return PDFFont.of(ref,pdf,embedder);
}
module.exports={embed};
