"""Pack pinned original game ship icons for offline display; requires Pillow."""
import hashlib
import json
import math
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
COMMIT = 'e821c7c9d5b39a9aee3eed0144a732c39489de1e'
REPOSITORY = 'carpetsage/EggIncAssets'
CACHE = ROOT / 'tmp' / 'ship-artwork'
CACHE.mkdir(parents=True, exist_ok=True)
FILES = dict(zip(['CHICKEN_ONE','CHICKEN_NINE','CHICKEN_HEAVY','BCR','MILLENIUM_CHICKEN','CORELLIHEN_CORVETTE','GALEGGTICA','CHICKFIANT','VOYEGGER','HENERPRISE','ATREGGIES'], ['chicken_1','chicken_9','chicken_heavy','bcr','millenium_chicken','corellihen_corvette','galeggtica','defihent','voyegger','henerprise','atreggies']))

def download(item):
    ident, suffix = item
    filename = f'afx_ship_{suffix}.png'
    path = CACHE / filename
    if not path.exists():
        with urlopen(f'https://raw.githubusercontent.com/{REPOSITORY}/{COMMIT}/64/egginc/{filename}', timeout=30) as response:
            path.write_bytes(response.read())
    with Image.open(path) as im:
        im.verify()
    return ident, path

with ThreadPoolExecutor(max_workers=5) as pool:
    sources = list(pool.map(download, FILES.items()))
sheet = Image.new('RGBA', (4*68, math.ceil(len(sources)/4)*68))
icons = {}
for i, (ident, path) in enumerate(sources):
    im = Image.open(path).convert('RGBA')
    assert max(im.size) <= 64
    x,y = i%4*68+2, i//4*68+2
    sheet.paste(im, (x+(64-im.width)//2, y+(64-im.height)//2))
    icons[ident] = dict(x=x,y=y,sourceFile=path.name,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),pixelSHA256=hashlib.sha256(im.tobytes()).hexdigest(),sourceWidth=im.width,sourceHeight=im.height)
asset = 'assets/brand/ship-icons.png'
sheet.save(ROOT / asset, optimize=True)
(ROOT / 'assets/brand/ship-icons.json').write_text(json.dumps(dict(sourceRepository=REPOSITORY,sourceCommit=COMMIT,sourceDirectory='64/egginc',asset=asset,width=sheet.width,height=sheet.height,iconSize=64,sha256=hashlib.sha256((ROOT/asset).read_bytes()).hexdigest(),icons=icons),indent=2)+'\n')
print(f'Bundled {len(icons)} original ship icons.')
