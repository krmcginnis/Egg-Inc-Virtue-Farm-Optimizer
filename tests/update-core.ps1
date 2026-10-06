param([string]$Root, [string]$Fixture)
$ErrorActionPreference = 'Stop'
. (Join-Path $Root 'Update-Core.ps1')
function Assert($Value, [string]$Message) { if (-not $Value) { throw $Message } }
function Must-Fail([scriptblock]$Action, [string]$Message) {
    $failed = $false
    try { & $Action | Out-Null } catch { $failed = $true }
    Assert $failed $Message
}
foreach ($name in @('Update-Core.ps1','Update-App.ps1','Local-Helper.ps1')) {
    $tokens = $null; $errors = $null
    [Management.Automation.Language.Parser]::ParseFile((Join-Path $Root $name),[ref]$tokens,[ref]$errors) | Out-Null
    Assert (-not $errors) "Syntax errors in $name"
}
Assert ((Get-UpdateRepository 'https://github.com/example/Egg-Inc-Virtue-Farm-Optimizer.git/') -eq 'example/Egg-Inc-Virtue-Farm-Optimizer') 'Repository normalization failed'
foreach ($bad in @('https://other.example/app','user/../repo','a/b/c','user/.','user/..','user/repo?token=secret')) { Must-Fail { Get-UpdateRepository $bad } "Unsafe repository accepted: $bad" }
Assert ((Get-UpdateVersion 'v1.10.0') -gt (Get-UpdateVersion '1.9.9')) 'Versions must compare numerically'
foreach ($path in @('../farm.json','assets/eggs/../../farm.json','C:/farm.json','assets\eggs\farm.png','saved-farm.json','update-config.json','assets/eggs/CON:stream.png')) { Assert (-not (Test-UpdateManagedPath $path)) "Unsafe managed path accepted: $path" }
Must-Fail { Assert-UpdateAssetUrl 'https://github.com/other/repo/releases/download/v1.7.1/Egg-Inc-Virtue-Farm-Optimizer.zip' 'example/app' 'Egg-Inc-Virtue-Farm-Optimizer.zip' } 'Wrong repository asset accepted'
Must-Fail { Assert-UpdateAssetUrl 'http://github.com/example/app/releases/download/v1.7.1/Egg-Inc-Virtue-Farm-Optimizer.zip' 'example/app' 'Egg-Inc-Virtue-Farm-Optimizer.zip' } 'HTTP asset accepted'
$release = Read-UpdateJson (Join-Path $Fixture 'release.json')
$app = Join-Path $Fixture 'installed app'
$currentVersion = (Read-UpdateJson (Join-Path $app 'package.json')).version
$stage = Join-Path $Fixture 'job/stage'
$manifest = Expand-VerifiedUpdate (Join-Path $Fixture 'valid.zip') $stage $release
Assert ($manifest.version -eq $release.version) 'Valid app could not be verified'
foreach ($variant in @('truncated','traversal','duplicate','symlink','file-hash','wrong-version','private-file')) {
    $badRelease = Read-UpdateJson (Join-Path $Fixture ($variant + '.json'))
    Must-Fail { Expand-VerifiedUpdate (Join-Path $Fixture ($variant + '.zip')) (Join-Path $Fixture ($variant + '-stage')) $badRelease } "Bad archive accepted: $variant"
}
$badDigest = Read-UpdateJson (Join-Path $Fixture 'release.json'); $badDigest | Add-Member -NotePropertyName digest -NotePropertyValue ('sha256:' + ('0' * 64))
Must-Fail { Expand-VerifiedUpdate (Join-Path $Fixture 'valid.zip') (Join-Path $Fixture 'digest-stage') $badDigest } 'Bad GitHub digest accepted'
$before = Get-UpdateHash (Join-Path $app 'app.js')
# Inject a real mid-install file replacement error, after earlier files changed.
$script:failReplacement = $true
function Move-Item {
    param([string]$LiteralPath, [string]$Destination, [switch]$Force)
    if ($script:failReplacement -and $Destination -eq (Join-Path $app 'worker-source.js')) { $script:failReplacement = $false; throw 'Injected file replacement failure' }
    Microsoft.PowerShell.Management\Move-Item -LiteralPath $LiteralPath -Destination $Destination -Force:$Force
}
Must-Fail { Install-VerifiedUpdate $app (Join-Path $Fixture 'job') } 'Injected replacement failure was ignored'
Assert ((Get-UpdateHash (Join-Path $app 'app.js')) -eq $before) 'App was not rolled back after a mid-install error'
Assert ((Read-UpdateJson (Join-Path $app 'package.json')).version -eq $currentVersion) 'Package was not rolled back'
Assert ((Get-Content -LiteralPath (Join-Path $app 'my-farm.json') -Raw) -eq 'private farm') 'Personal JSON was changed'
Install-VerifiedUpdate $app (Join-Path $Fixture 'job')
Assert ((Read-UpdateJson (Join-Path $app 'package.json')).version -eq $release.version) 'App version was not installed'
Assert ((Read-UpdateJson (Join-Path $app 'update-config.json')).repository -eq 'my/private-choice') 'User update source was overwritten'
Assert ((Get-Content -LiteralPath (Join-Path $app 'my-farm.json') -Raw) -eq 'private farm') 'Farm was modified during successful install'
Assert (-not (Test-Path -LiteralPath (Join-Path $app "AUDIT-v$currentVersion.md"))) 'Old managed audit was retained'
Restore-UpdateBackup $app (Join-Path $Fixture 'job')
Assert ((Get-UpdateHash (Join-Path $app 'app.js')) -eq $before) 'Explicit rollback did not restore exact bytes'
Assert (Test-Path -LiteralPath (Join-Path $app "AUDIT-v$currentVersion.md")) 'Rollback did not restore old audit'
# Mutating a stage after download must never change installed files.
[IO.File]::AppendAllText((Join-Path $stage 'app.js'), 'corruption')
Must-Fail { Install-VerifiedUpdate $app (Join-Path $Fixture 'job') } 'Changed staged file accepted'
Assert ((Get-UpdateHash (Join-Path $app 'app.js')) -eq $before) 'Rejected stage changed installed app'
# Exercise the real release parsing logic against controlled GitHub API records.
$script:apiReply = @{
    draft=$false; prerelease=$false; tag_name=('v' + $release.version); body='Release notes'; assets=@(
        @{name='update-manifest.json';state='uploaded';browser_download_url=('https://github.com/example/app/releases/download/v' + $release.version + '/update-manifest.json')},
        @{name='Egg-Inc-Virtue-Farm-Optimizer.zip';state='uploaded';size=$release.size;browser_download_url=('https://github.com/example/app/releases/download/v' + $release.version + '/Egg-Inc-Virtue-Farm-Optimizer.zip')})
}
$script:releaseMetadata = @{schema=1;app='egg-inc-virtue-farm-optimizer';version=$release.version;archive='Egg-Inc-Virtue-Farm-Optimizer.zip';size=$release.size;sha256=$release.sha256}
function Invoke-RestMethod { param($Uri,$Headers,$TimeoutSec); Assert ($Uri -eq 'https://api.github.com/repos/example/app/releases/latest') 'Unexpected GitHub API request'; return $script:apiReply }
function Save-UpdateDownload { param($Url,$Path,$Limit); Write-UpdateJson $Path $script:releaseMetadata }
$checked = Get-UpdateRelease 'example/app' $currentVersion $Fixture
Assert ($checked.available -and $checked.version -eq $release.version) 'Valid latest release was not recognized'
$current = Get-UpdateRelease 'example/app' $release.version $Fixture
Assert (-not $current.available) 'Current app proposed a redundant update'
$script:apiReply.prerelease=$true
Must-Fail { Get-UpdateRelease 'example/app' $currentVersion $Fixture } 'Prerelease accepted'
$script:apiReply.prerelease=$false; $script:releaseMetadata.version='0.0.1'
Must-Fail { Get-UpdateRelease 'example/app' $currentVersion $Fixture } 'Mismatched release manifest version accepted'
$script:releaseMetadata.version=$release.version; $script:apiReply.assets[1].browser_download_url='https://github.com/other/app/releases/download/v1.0.0/Egg-Inc-Virtue-Farm-Optimizer.zip'
Must-Fail { Get-UpdateRelease 'example/app' $currentVersion $Fixture } 'Unrelated release repository accepted'
Write-Host 'PASS: version/source guards, GitHub release metadata, valid package, seven bad archive cases, digest mismatch, mid-install rollback, successful installation, exact backup restore, user JSON/config preservation and stage tamper rejection.'
