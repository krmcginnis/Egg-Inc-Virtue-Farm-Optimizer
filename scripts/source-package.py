"""Prepare a curated repository tree; never include personal farm/backup files."""
import json,os,tempfile,zipfile
from pathlib import Path
root=Path(__file__).resolve().parent.parent
version=json.loads((root/'package.json').read_text())['version']
out=root.parent/f'Egg-Inc-Virtue-Farm-Optimizer-GitHub-Setup-v{version}.zip'
files=[Path(n) for n in ['package.json','package-lock.json','index.html','style.css','app.js','worker-source.js','session.js','Start-Virtue-Optimizer.cmd','Local-Helper.ps1','Update-Core.ps1','Update-App.ps1','README.txt','RELEASE-NOTES.md','GitHub-Setup.md','THIRD-PARTY-LICENSE.txt','Wasmegg-Comparison.md',f'AUDIT-v{version}.md','VALIDATION.json','.gitignore','.github/workflows/release.yml','tests/update-core.cjs','tests/update-core.ps1']]
for directory in ['src','assets','scripts']:
 files.extend(p.relative_to(root) for p in (root/directory).rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.name != 'workbook-farm.json')
assert len(files)==len(set(files))
# Test tools for other development tasks are intentionally not included in this
# publishing tree; their fixtures may describe a user's personal farm.
package=json.loads((root/'package.json').read_text())
package['scripts']={key:value for key,value in package['scripts'].items() if key in ['build','package']}
package['scripts']['test']='node tests/update-core.cjs'
package['scripts']['test:updates']='node tests/update-core.cjs'
handle,temp=tempfile.mkstemp(prefix='.source-release-',suffix='.zip.tmp',dir=out.parent);os.close(handle)
try:
 with zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for relative in sorted(files):
   contents=json.dumps(package,indent=2)+'\n' if relative.as_posix()=='package.json' else (root/relative).read_bytes()
   z.writestr('Egg-Inc-Virtue-Farm-Optimizer-GitHub-Setup/'+relative.as_posix(),contents)
  z.writestr('Egg-Inc-Virtue-Farm-Optimizer-GitHub-Setup/update-config.json','{"repository":""}\n')
 with zipfile.ZipFile(temp) as z:assert z.testzip() is None
 os.replace(temp,out)
finally:Path(temp).unlink(missing_ok=True)
print(f'Prepared {len(files)+1} repository files: {out}')
