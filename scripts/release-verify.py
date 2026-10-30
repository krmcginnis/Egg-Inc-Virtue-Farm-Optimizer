"""Verify a candidate or anonymous public release and its closed runtime manifest."""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import subprocess
import time
import urllib.error
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parent.parent
FOLDER = 'Egg-Inc-Virtue-Farm-Optimizer'
REPOSITORY = 'krmcginnis/Egg-Inc-Virtue-Farm-Optimizer'
APP = 'egg-inc-virtue-farm-optimizer'
def sha(data):
    return hashlib.sha256(data).hexdigest()
def valid_path(name):
    return isinstance(name, str) and bool(name) and '\\' not in name and ':' not in name and not name.startswith('/') and all(p not in ('', '.', '..') for p in name.split('/'))
def verify_archive(archive, manifest, repository, extract=None):
    data = Path(archive).read_bytes()
    assert manifest['schema'] == 1 and manifest['app'] == APP
    assert re.fullmatch(r'\d+\.\d+\.\d+', manifest['version'])
    assert manifest['archive'] == FOLDER + '.zip' and manifest['size'] == len(data) and manifest['sha256'] == sha(data), 'Archive digest/size mismatch'
    with zipfile.ZipFile(archive) as z:
        names = z.namelist()
        assert len(names) == len(set(n.casefold() for n in names)), 'Duplicate archive path'
        assert all(valid_path(n) and n.startswith(FOLDER + '/') and not stat.S_ISLNK(i.external_attr >> 16) and not i.is_dir() for n, i in zip(names, z.infolist())), 'Unsafe archive path/type'
        assert sum(i.file_size for i in z.infolist()) < 250_000_000, 'Archive too large'
        assert z.testzip() is None, 'Archive CRC mismatch'
        prefix = FOLDER + '/'
        files = json.loads(z.read(prefix + 'Update-Files.json'))
        assert files['schema'] == 1 and files['app'] == APP and files['version'] == manifest['version'] and files['updater'] == 1
        paths = [f['path'] for f in files['files']]
        assert paths and all(valid_path(p) for p in paths) and len(paths) == len(set(p.casefold() for p in paths))
        assert set(names) == {prefix + p for p in paths} | {prefix + 'Update-Files.json', prefix + 'update-config.json'}, 'Manifest is not closed'
        for f in files['files']:
            content = z.read(prefix + f['path'])
            assert len(content) == f['size'] and sha(content) == f['sha256'], 'Runtime file digest mismatch: ' + f['path']
        assert json.loads(z.read(prefix + 'package.json'))['version'] == manifest['version']
        assert json.loads(z.read(prefix + 'update-config.json'))['repository'] == repository
        assert [p for p in paths if p.startswith('AUDIT-v')] == ['AUDIT-v' + manifest['version'] + '.md']
        assert '<title>Egg Inc. Virtue Farm Optimizer ' + manifest['version'] + '</title>' in z.read(prefix + 'index.html').decode()
        result = {'version': manifest['version'], 'archiveSha256': sha(data), 'archiveEntries': len(names), 'runtimeFileHashes': len(paths), 'closedManifest': True, 'crcPassed': True, 'appSha256': sha(z.read(prefix + 'app.js')), 'workerSha256': sha(z.read(prefix + 'worker-source.js'))}
        if extract:
            extract = Path(extract)
            if extract.exists():
                shutil.rmtree(extract)
            extract.mkdir(parents=True)
            z.extractall(extract)
            result['appRoot'] = str((extract / FOLDER).resolve())
        return result
def get(url, limit=25_000_000):
    # Deliberately anonymous: exercise the same public assets available to users.
    request = urllib.request.Request(url, headers={'User-Agent': 'virtue-release-verification', 'Accept': 'application/vnd.github+json'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                data = response.read(limit + 1)
                assert len(data) <= limit, 'Download too large'
                return data
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)
def verify_public(repository, expected_version=None, expected_commit=None, output=None, extract=None):
    assert re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repository)
    base = 'https://api.github.com/repos/' + repository
    release = json.loads(get(base + '/releases/latest?verify=' + str(time.time_ns())))
    assert not release['draft'] and not release['prerelease']
    version = release['tag_name'].removeprefix('v')
    assert expected_version is None or version == expected_version, 'Wrong public version'
    ref = json.loads(get(base + '/git/ref/tags/v' + version))['object']
    if ref['type'] == 'tag':
        ref = json.loads(get(base + '/git/tags/' + ref['sha']))['object']
    assert ref['type'] == 'commit' and (expected_commit is None or ref['sha'] == expected_commit), 'Wrong public source commit'
    assets = {a['name']: a for a in release['assets']}
    assert len(release['assets']) == 2 and set(assets) == {FOLDER + '.zip', 'update-manifest.json'}
    output = Path(output or ROOT / 'tmp/public-release')
    output.mkdir(parents=True, exist_ok=True)
    records = []
    for name, asset in assets.items():
        data = get(asset['browser_download_url'] + '?verify=' + str(time.time_ns()))
        assert len(data) == asset['size'] and asset['digest'] == 'sha256:' + sha(data), 'GitHub asset digest mismatch'
        (output / name).write_bytes(data)
        records.append({'name': name, 'id': asset['id'], 'size': len(data), 'sha256': sha(data)})
    manifest = json.loads((output / 'update-manifest.json').read_text())
    assert manifest['version'] == version
    result = verify_archive(output / (FOLDER + '.zip'), manifest, repository, extract)
    return {**result, 'sourceCommit': ref['sha'], 'url': release['html_url'], 'releaseId': release['id'], 'anonymous': True, 'assets': records}
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--candidate', action='store_true')
    parser.add_argument('--public', action='store_true')
    parser.add_argument('--current-public', action='store_true')
    parser.add_argument('--expected-version')
    parser.add_argument('--expected-commit')
    parser.add_argument('--extract')
    parser.add_argument('--output')
    args = parser.parse_args()
    assert sum([args.candidate, args.public, args.current_public]) == 1
    repository = os.environ.get('RELEASE_REPOSITORY', REPOSITORY)
    if args.candidate:
        manifest = json.loads((ROOT / 'tmp/release/update-manifest.json').read_text())
        result = verify_archive(ROOT / 'tmp/release' / manifest['archive'], manifest, repository, args.extract)
        result['sourceCommit'] = os.environ.get('GITHUB_SHA') or subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
        output = args.output or ROOT / 'tmp/release-candidate.json'
    else:
        if args.public:
            assert args.expected_version and args.expected_commit, 'Publishing verification requires the expected version and source commit'
        result = verify_public(repository, args.expected_version, args.expected_commit, ROOT / 'tmp/public-release', args.extract)
        output = args.output or ROOT / 'tmp/public-verification.json'
    Path(output).parent.mkdir(parents=True, exist_ok=True)
    Path(output).write_text(json.dumps(result, indent=2) + '\n')
    print('PASS release archive verification: ' + json.dumps(result))
if __name__ == '__main__':
    main()
