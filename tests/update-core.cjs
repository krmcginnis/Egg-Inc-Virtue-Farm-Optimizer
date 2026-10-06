'use strict';
const fs = require('node:fs'), path = require('node:path'), {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root, 'tmp'), {recursive:true});
const fixture = fs.mkdtempSync(path.join(root, 'tmp', 'update-core-'));
const python = process.env.PYTHON_EXECUTABLE || (process.platform === 'win32' ? 'python' : 'python3');
const generate = spawnSync(python, ['-c', String.raw`
import sys,json,zipfile,hashlib,shutil
from pathlib import Path
root,fixture=map(Path,sys.argv[1:])
source=root/'tmp/release/Egg-Inc-Virtue-Farm-Optimizer.zip'
folder='Egg-Inc-Virtue-Farm-Optimizer/'
with zipfile.ZipFile(source) as z:
 data={name:z.read(name) for name in z.namelist()}
 z.extractall(fixture/'old')
current=json.loads(data[folder+'package.json'])['version']
parts=list(map(int,current.split('.')));parts[2]+=1;next_version='.'.join(map(str,parts))
app=fixture/'installed app'
shutil.copytree(fixture/'old'/folder,app)
(app/'my-farm.json').write_text('private farm')
(app/'update-config.json').write_text(json.dumps({'repository':'my/private-choice'}))
data[folder+'package.json']=json.dumps({'version':next_version}).encode()
data[folder+'app.js']+=b'\n// next version\n'
old_audit=next(k for k in data if '/AUDIT-v' in k)
data[folder+'AUDIT-v'+next_version+'.md']=data.pop(old_audit)
manifest=json.loads(data[folder+'Update-Files.json']);manifest['version']=next_version
for f in manifest['files']:
 if f['path'].startswith('AUDIT-v'):f['path']='AUDIT-v'+next_version+'.md'
 content=data[folder+f['path']];f['size']=len(content);f['sha256']=hashlib.sha256(content).hexdigest()
data[folder+'Update-Files.json']=json.dumps(manifest).encode()
def write(name,contents,extra=None,truncated=False):
 out=fixture/(name+'.zip')
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
  for k,v in contents.items():z.writestr(k,v)
  if extra:
   for k,v in extra:z.writestr(k,v)
 if truncated:out.write_bytes(out.read_bytes()[:-100])
 release={'version':next_version,'size':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
 (fixture/(('release' if name=='valid' else name)+'.json')).write_text(json.dumps(release))
write('valid',data)
write('truncated',data,truncated=True)
write('traversal',data,[(folder+'../escaped.txt',b'escape')])
write('duplicate',data,[(folder+'app.js',data[folder+'app.js'])])
link=zipfile.ZipInfo(folder+'app.js');link.create_system=3;link.external_attr=(0o120777<<16)
linked=data.copy();linked.pop(folder+'app.js');write('symlink',linked,[(link,b'../../private.json')])
bad=data.copy();bad[folder+'app.js']=b'wrong';write('file-hash',bad)
bad=data.copy();m=json.loads(bad[folder+'Update-Files.json']);m['version']=next_version+'.0';bad[folder+'Update-Files.json']=json.dumps(m).encode();write('wrong-version',bad)
write('private-file',data,[(folder+'saved-farm.json',b'private')])
`, root, fixture], {encoding:'utf8'});
if (generate.status !== 0) throw Error(generate.stderr || generate.error);
const executable = process.env.POWERSHELL_EXECUTABLE || (process.platform === 'win32' ? 'powershell.exe' : 'pwsh');
const childEnv = {...process.env};
// A Node child of PowerShell 7 inherits its module paths. Let Windows
// PowerShell rebuild its own paths rather than try loading incompatible modules.
if (process.platform === 'win32' && /(?:^|[\\/])powershell(?:\.exe)?$/i.test(executable)) {
  for (const key of Object.keys(childEnv)) if (key.toUpperCase() === 'PSMODULEPATH') delete childEnv[key];
}
const run = spawnSync(executable, ['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'update-core.ps1'),'-Root',root,'-Fixture',fixture], {encoding:'utf8',timeout:120000,env:childEnv});
if (run.status !== 0) { console.error(run.stdout, run.stderr, run.error || ''); process.exitCode = 1; }
else console.log(run.stdout.trim());
