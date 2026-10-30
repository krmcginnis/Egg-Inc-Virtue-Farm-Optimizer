"""Gate publication on every required suite and record automated acceptance."""
import argparse
import datetime
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
def load_json(path):
    return json.loads(Path(path).read_text())
def gate(root, source):
    candidate = load_json(root / 'tmp/release-candidate.json')
    assert candidate['sourceCommit'] == source
    manifest = load_json(root / 'scripts/release-suites.json')['groups']
    required = [suite for group in manifest.values() for suite in group]
    assert len(required) == len(set(required)) and len(required) >= 40
    groups = []
    for name, expected in manifest.items():
        report = load_json(root / ('tmp/release-checks-' + name + '.json'))
        assert report['group'] == name and report['sourceCommit'] == source and report['platform'] == 'win32' and report['passed'] and not report['reused'], 'Missing full Windows check group'
        assert [s['suite'] for s in report['suites']] == expected and all(s['passed'] for s in report['suites']), 'Missing or failed required suite'
        assert report['candidate']['archiveSha256'] == candidate['archiveSha256'] and report['candidate']['sourceCommit'] == source, 'Checks used another build'
        groups.append({'group': name, 'suitesPassed': len(expected), 'seconds': report['seconds'], 'fingerprint': report['fingerprint']})
    return {'schema': 1, 'sourceCommit': source, 'candidate': candidate, 'requiredSuitesPassed': len(required), 'groups': groups}
def accept(root, evidence, public, browser):
    c = evidence['candidate']
    assert public['sourceCommit'] == evidence['sourceCommit'] and public['version'] == c['version'] and public['anonymous']
    for key in ['archiveSha256', 'appSha256', 'workerSha256']:
        assert public[key] == c[key], 'Public assets differ from the tested build'
    assert browser['passed'] and browser['sourceCommit'] == evidence['sourceCommit'] and browser['appSha256'] == c['appSha256'] and browser['workerSha256'] == c['workerSha256'], 'Public browser verification missing'
    return {**evidence, 'status': 'accepted-public-release', 'published': True, 'publicVerification': public, 'browserVerification': browser}
def record(root, evidence, run_id, repository):
    version = evidence['candidate']['version']
    validation = load_json(root / 'VALIDATION.json')
    assert validation['version'] == version
    url = 'https://github.com/' + repository + '/actions/runs/' + str(run_id)
    validation.update({'date': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'status': 'accepted-public-release', 'published': True, 'nativeWindowsTested': True, 'buildPassed': True, 'generatedDomTested': True, 'visualBrowserTested': True, 'compiledWorkerSha256': evidence['candidate']['workerSha256'], 'windowsRelease': {'runId': int(run_id), 'url': url, 'sourceCommit': evidence['sourceCommit'], 'requiredSuitesPassed': evidence['requiredSuitesPassed'], 'groups': evidence['groups'], 'nativeUpdaterAndLauncherPassed': True, 'publicFeedAndRuntimeHashesPassed': True}, 'independentPublicVerification': evidence['publicVerification'], 'automatedBrowserVerification': evidence['browserVerification']})
    validation['limitations'] = [s for s in validation.get('limitations', []) if not s.startswith('Native Windows')]
    (root / 'VALIDATION.json').write_text(json.dumps(validation, indent=2) + '\n')
    audit = root / ('AUDIT-v' + version + '.md')
    old = audit.read_text()
    heading, body = old.split('\n', 1)
    section = '\n## Automated publication acceptance\n\nAll ' + str(evidence['requiredSuitesPassed']) + ' required checks passed across three parallel Windows groups\nfor source `' + evidence['sourceCommit'] + '`. [Workflow evidence](' + url + ').\nThe exact tested package passed native updater/feed verification, anonymous public\nasset/CRC/runtime-digest checks, and real-browser checks against the downloaded ZIP.\nThe run artifact `release-validation` contains suite timings and complete acceptance\nevidence. The immutable release assets retain the prepublication audit.\n'
    audit.write_text(heading + '\n' + section + body)
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--gate', action='store_true')
    parser.add_argument('--verify-only', action='store_true')
    parser.add_argument('--accept', action='store_true')
    args = parser.parse_args()
    assert sum([args.gate, args.verify_only, args.accept]) == 1
    source = os.environ['GITHUB_SHA']
    evidence = gate(ROOT, source)
    evidence['runId'] = int(os.environ['GITHUB_RUN_ID'])
    evidence['url'] = 'https://github.com/' + os.environ['GITHUB_REPOSITORY'] + '/actions/runs/' + str(evidence['runId'])
    if args.accept:
        evidence = accept(ROOT, evidence, load_json(ROOT / 'tmp/public-verification.json'), load_json(ROOT / 'tmp/public-browser.json'))
        record(ROOT, evidence, os.environ['GITHUB_RUN_ID'], os.environ['GITHUB_REPOSITORY'])
    else:
        evidence.update({'status': 'verified-candidate' if args.verify_only else 'publication-gate-passed', 'published': False})
        public = ROOT / 'tmp/public-verification.json'
        if args.verify_only and public.exists():
            evidence['currentPublicVerification'] = load_json(public)
    (ROOT / 'tmp/release-validation.json').write_text(json.dumps(evidence, indent=2) + '\n')
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as f:
            f.write('\n### Release validation\n\n' + evidence['status'] + ' · ' + str(evidence['requiredSuitesPassed']) + ' required checks.\n\n| Group | Test time |\n| --- | ---: |\n')
            for group in evidence['groups']:
                f.write('| ' + group['group'] + ' | ' + str(round(group['seconds'], 1)) + 's |\n')
    print('PASS automated acceptance: ' + evidence['status'] + ', ' + str(evidence['requiredSuitesPassed']) + ' required checks.')
if __name__ == '__main__':
    main()
