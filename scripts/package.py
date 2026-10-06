"""Build a closed, CRC-verified app ZIP and GitHub release assets.
Only runtime files are shipped; personal farms and account fixtures stay private.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
import zipfile
ROOT = Path(__file__).resolve().parent.parent
FOLDER = 'Egg-Inc-Virtue-Farm-Optimizer'
APP = 'egg-inc-virtue-farm-optimizer'
VERSION = json.loads((ROOT / 'package.json').read_text())['version']
AUDIT = f'AUDIT-v{VERSION}.md'
FILES = ['index.html', 'app.js', 'style.css', 'worker-source.js', 'session.js',
         'package.json', 'Local-Helper.ps1', 'Update-Core.ps1', 'Update-App.ps1',
         'Start-Virtue-Optimizer.cmd', 'README.txt', 'THIRD-PARTY-LICENSE.txt',
         'Wasmegg-Comparison.md', 'RELEASE-NOTES.md', AUDIT]
FILES += sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / 'assets').rglob('*') if p.is_file())
assert all((ROOT / name).is_file() for name in FILES), 'A required app file is missing'
assert len(FILES) == len(set(FILES))
repository = os.environ.get('RELEASE_REPOSITORY', '')
assert not repository or re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9-]{0,38}/[A-Za-z0-9_.-]{1,100}', repository)
file_manifest = {'schema': 1, 'app': APP, 'version': VERSION, 'updater': 1, 'files': [
    {'path': name, 'size': (ROOT / name).stat().st_size,
     'sha256': hashlib.sha256((ROOT / name).read_bytes()).hexdigest()} for name in FILES]}
(ROOT / 'Update-Files.json').write_text(json.dumps(file_manifest, indent=2) + '\n')
def atomic_zip(output):
    handle, temporary_name = tempfile.mkstemp(prefix=f'.{FOLDER}-', suffix='.zip.tmp', dir=output.parent)
    os.close(handle)
    temporary = Path(temporary_name)
    try:
        with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for name in FILES + ['Update-Files.json']:
                archive.write(ROOT / name, f'{FOLDER}/{name}')
            archive.writestr(f'{FOLDER}/update-config.json', json.dumps({'repository': repository}, indent=2) + '\n')
        with zipfile.ZipFile(temporary) as archive:
            assert archive.testzip() is None
            assert [Path(name).name for name in archive.namelist() if Path(name).name.startswith('AUDIT-v')] == [AUDIT]
            assert {name.split('/')[0] for name in archive.namelist()} == {FOLDER}
        os.replace(temporary, output)
    finally:
        temporary.unlink(missing_ok=True)
output = ROOT.parent / f'{FOLDER}-v{VERSION}.zip'
atomic_zip(output)
release_dir = ROOT / 'tmp' / 'release'
release_dir.mkdir(parents=True, exist_ok=True)
stable = release_dir / f'{FOLDER}.zip'
temporary = stable.with_suffix('.zip.tmp')
temporary.write_bytes(output.read_bytes())
os.replace(temporary, stable)
manifest = {'schema': 1, 'app': APP, 'version': VERSION, 'archive': stable.name,
            'size': stable.stat().st_size, 'sha256': hashlib.sha256(stable.read_bytes()).hexdigest()}
(release_dir / 'update-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Packaged {len(FILES) + 2} runtime files: {output}')
print(f'GitHub release assets: {release_dir}')
