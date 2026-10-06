"""Bundle original hab/vehicle icons from a pinned game-asset mirror.

Developer-only regeneration: python scripts/bundle-farm-icons.py (requires Pillow).
The application and release build use the checked-in sheet and catalog offline.
"""
import hashlib
import json
import math
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
REPOSITORY = 'carpetsage/EggIncAssets'
COMMIT = 'e821c7c9d5b39a9aee3eed0144a732c39489de1e'
SOURCE = '64/egginc'
CACHE = ROOT / 'tmp' / 'farm-artwork'
CACHE.mkdir(parents=True, exist_ok=True)
DATA = json.loads((ROOT / 'src' / 'game-data.json').read_text())
items = [(f'{kind}:{item["id"]}', item['name'], item['iconPath'].split('/')[-1])
         for kind, group in [('hab', 'habs'), ('vehicle', 'vehicles')] for item in DATA[group]]
items.append(('car:hyperloop', 'Hyperloop Car', 'ei_vehicle_icon_hyperloop_car.png'))


def download(filename):
    path = CACHE / filename
    if not path.exists():
        url = f'https://raw.githubusercontent.com/{REPOSITORY}/{COMMIT}/{SOURCE}/{filename}'
        with urlopen(url, timeout=30) as response:
            data = response.read()
        path.write_bytes(data)
    with Image.open(path) as image:
        image.verify()
    return path


files = sorted({item[2] for item in items})
with ThreadPoolExecutor(max_workers=6) as pool:
    sources = dict(zip(files, pool.map(download, files)))
icon_size, padding, columns = 64, 2, 8
stride = icon_size + 2 * padding
sheet = Image.new('RGBA', (columns * stride, math.ceil(len(files) / columns) * stride))
positions = {}
for index, filename in enumerate(files):
    image = Image.open(sources[filename]).convert('RGBA')
    assert max(image.size) <= icon_size, f'Oversized source: {filename}'
    x, y = index % columns * stride + padding, index // columns * stride + padding
    # Paste without a mask to preserve every original RGBA pixel.
    sheet.paste(image, (x + (icon_size - image.width) // 2, y + (icon_size - image.height) // 2))
    raw = sources[filename].read_bytes()
    positions[filename] = dict(x=x, y=y, sourceFile=filename,
                              sha256=hashlib.sha256(raw).hexdigest(), bytes=len(raw),
                              sourceWidth=image.width, sourceHeight=image.height,
                              pixelSHA256=hashlib.sha256(image.tobytes()).hexdigest())
asset = 'assets/brand/farm-icons.png'
sheet.save(ROOT / asset, optimize=True)
catalog = dict(sourceRepository=REPOSITORY, sourceCommit=COMMIT, sourceDirectory=SOURCE,
               mapping='src/game-data.json iconPath; separate Hyperloop car artwork',
               asset=asset, width=sheet.width, height=sheet.height, iconSize=icon_size,
               sha256=hashlib.sha256((ROOT / asset).read_bytes()).hexdigest(),
               icons={key: dict(name=name, **positions[filename]) for key, name, filename in items})
(ROOT / 'assets' / 'brand' / 'farm-icons.json').write_text(json.dumps(catalog, indent=2) + '\n')
print(f'Bundled {len(items)} hab, vehicle and car icons in {asset} ({(ROOT / asset).stat().st_size:,} bytes).')
