# Developer helper; the PC app uses the bundled font data without Python.
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
import io, json, base64, shutil
root=Path(__file__).resolve().parent.parent
output={}
for kind,filename in [('regular','DejaVuSans.ttf'),('bold','DejaVuSans-Bold.ttf')]:
 font=TTFont('/usr/share/fonts/truetype/dejavu/'+filename)
 options=subset.Options();options.layout_features=[]
 cutter=subset.Subsetter(options=options);cutter.populate(unicodes=list(range(32,256))+[0x2122]);cutter.subset(font)
 data=io.BytesIO();font.save(data)
 cmap=font.getBestCmap();order=font.getGlyphOrder();scale=1000/font['head'].unitsPerEm
 widths=[];mapping=bytearray((0x2122+1)*2)
 for code in range(256):
  glyph=cmap.get(code,'.notdef');gid=order.index(glyph);mapping[2*code:2*code+2]=gid.to_bytes(2,'big');widths.append(round(font['hmtx'][glyph][0]*scale,3))
 gid=order.index(cmap[0x2122]);mapping[0x2122*2:0x2122*2+2]=gid.to_bytes(2,'big');extra_width=round(font['hmtx'][cmap[0x2122]][0]*scale,3)
 head=font['head'];output[kind]={'data':base64.b64encode(data.getvalue()).decode(),'mapping':base64.b64encode(mapping).decode(),'widths':widths,'trademarkWidth':extra_width,'bbox':[round(v*scale,3) for v in [head.xMin,head.yMin,head.xMax,head.yMax]],'ascent':round(font['hhea'].ascent*scale,3),'descent':round(font['hhea'].descent*scale,3)}
(root/'src/vendor/pdf-fonts.cjs').write_text("'use strict';\n// Subset of DejaVu Sans; see pdf-fonts-LICENSE.txt.\nmodule.exports="+json.dumps(output,separators=(',',':'))+';\n')
shutil.copy2('/usr/share/doc/fonts-dejavu-core/copyright',root/'src/vendor/pdf-fonts-LICENSE.txt')
print('Bundled PDF fonts',len(output['regular']['data']),len(output['bold']['data']))
