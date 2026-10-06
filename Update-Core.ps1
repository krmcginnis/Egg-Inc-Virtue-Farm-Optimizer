# Shared updater functions. Compatible with Windows PowerShell 5.1; no admin rights.
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$script:UpdateAppId = 'egg-inc-virtue-farm-optimizer'
$script:UpdateFolder = 'Egg-Inc-Virtue-Farm-Optimizer'
function Write-UpdateJson([string]$Path, $Value) {
    $temporary = $Path + '.' + [Guid]::NewGuid().ToString('N') + '.tmp'
    [IO.File]::WriteAllText($temporary, ($Value | ConvertTo-Json -Depth 30), [Text.UTF8Encoding]::new($false))
    try { Move-Item -LiteralPath $temporary -Destination $Path -Force } finally { if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Force } }
}
function Read-UpdateJson([string]$Path) { Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json }
function Get-UpdateRepository([string]$Value) {
    $value = $Value.Trim().TrimEnd('/') -replace '^https://github\.com/', '' -replace '\.git$', ''
    if ($value -notmatch '^[A-Za-z0-9][A-Za-z0-9-]{0,38}/[A-Za-z0-9_.-]{1,100}$' -or $value.Split('/')[1] -in @('.', '..')) { throw 'Enter a public GitHub repository as owner/repository or its GitHub URL.' }
    return $value
}
function Get-UpdateVersion([string]$Value) {
    if ($Value -notmatch '^v?([0-9]{1,6}\.[0-9]{1,6}\.[0-9]{1,6})$') { throw 'The release does not have a supported version number.' }
    return [Version]$Matches[1]
}
function Get-UpdateHash([string]$Path) { (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Assert-UpdateAssetUrl([string]$Url, [string]$Repository, [string]$Name) {
    $uri = [Uri]$Url
    $prefix = '/' + $Repository + '/releases/download/'
    if ($uri.Scheme -ne 'https' -or $uri.Host -ne 'github.com' -or $uri.Port -ne 443 -or $uri.UserInfo -or $uri.Query -or $uri.Fragment -or -not $uri.AbsolutePath.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase) -or -not $uri.AbsolutePath.EndsWith('/' + $Name, [StringComparison]::Ordinal)) { throw 'The release download is outside the configured GitHub repository.' }
}
function Save-UpdateDownload([string]$Url, [string]$Path, [long]$Limit) {
    Add-Type -AssemblyName System.Net.Http
    $http = [Net.Http.HttpClient]::new()
    $http.Timeout = [TimeSpan]::FromSeconds(120)
    $http.DefaultRequestHeaders.UserAgent.ParseAdd('Egg-Inc-Virtue-Farm-Optimizer-Updater/1')
    $response = $null; $source = $null; $output = $null
    try {
        $deadline = [DateTime]::UtcNow.AddSeconds(120)
        $response = $http.GetAsync($Url, [Net.Http.HttpCompletionOption]::ResponseHeadersRead).GetAwaiter().GetResult()
        $response.EnsureSuccessStatusCode() | Out-Null
        if ($response.Content.Headers.ContentLength -gt $Limit) { throw 'The release download is too large.' }
        $source = $response.Content.ReadAsStreamAsync().GetAwaiter().GetResult()
        $output = [IO.File]::Create($Path)
        $buffer = New-Object byte[] 65536; $total = 0L
        while ($true) {
            $remaining = $deadline - [DateTime]::UtcNow
            if ($remaining.TotalMilliseconds -le 0) { throw 'The release download timed out.' }
            $pendingRead = $source.ReadAsync($buffer, 0, $buffer.Length)
            if (-not $pendingRead.Wait([int][Math]::Min(2147483647, $remaining.TotalMilliseconds))) { throw 'The release download timed out.' }
            $count = $pendingRead.Result
            if ($count -eq 0) { break }
            $total += $count
            if ($total -gt $Limit) { throw 'The release download is too large.' }
            $output.Write($buffer, 0, $count)
        }
    } finally {
        if ($output) { $output.Dispose() }; if ($source) { $source.Dispose() }; if ($response) { $response.Dispose() }; $http.Dispose()
    }
}
function Assert-UpdateDigest($Asset, [string]$Path) {
    if ($Asset.digest -and ([string]$Asset.digest -notmatch '^sha256:[a-fA-F0-9]{64}$' -or (Get-UpdateHash $Path) -ne ([string]$Asset.digest).Substring(7).ToLowerInvariant())) { throw 'GitHub release checksum verification failed.' }
}
function Get-UpdateRelease([string]$Repository, [string]$CurrentVersion, [string]$TemporaryDirectory) {
    $repo = Get-UpdateRepository $Repository
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/latest" -Headers @{'User-Agent'='Egg-Inc-Virtue-Farm-Optimizer-Updater/1';'Accept'='application/vnd.github+json';'X-GitHub-Api-Version'='2026-03-10'} -TimeoutSec 20
    if ($release.draft -or $release.prerelease) { throw 'Only published stable releases are supported.' }
    $version = (Get-UpdateVersion $release.tag_name).ToString()
    if ((Get-UpdateVersion $version) -le (Get-UpdateVersion $CurrentVersion)) { return @{configured=$true;available=$false;currentVersion=$CurrentVersion;version=$version;repository=$repo} }
    $manifestAssets = @($release.assets | Where-Object { $_.name -eq 'update-manifest.json' -and $_.state -eq 'uploaded' })
    $zipAssets = @($release.assets | Where-Object { $_.name -eq 'Egg-Inc-Virtue-Farm-Optimizer.zip' -and $_.state -eq 'uploaded' })
    if ($manifestAssets.Count -ne 1 -or $zipAssets.Count -ne 1) { throw 'This release is missing its app update files. Try again after publishing finishes.' }
    $manifestAsset = $manifestAssets[0]; $zipAsset = $zipAssets[0]
    Assert-UpdateAssetUrl $manifestAsset.browser_download_url $repo 'update-manifest.json'
    Assert-UpdateAssetUrl $zipAsset.browser_download_url $repo 'Egg-Inc-Virtue-Farm-Optimizer.zip'
    $manifestPath = Join-Path $TemporaryDirectory 'release-manifest.json'
    Save-UpdateDownload $manifestAsset.browser_download_url $manifestPath 262144
    Assert-UpdateDigest $manifestAsset $manifestPath
    $manifest = Read-UpdateJson $manifestPath
    if ($manifest.schema -ne 1 -or $manifest.app -ne $script:UpdateAppId -or $manifest.version -cne $version -or $manifest.archive -cne 'Egg-Inc-Virtue-Farm-Optimizer.zip' -or $manifest.sha256 -notmatch '^[a-f0-9]{64}$' -or $manifest.size -lt 1 -or $manifest.size -gt 67108864 -or $zipAsset.size -ne $manifest.size) { throw 'The release metadata could not be verified.' }
    return @{configured=$true;available=$true;currentVersion=$CurrentVersion;version=$version;repository=$repo;notes=([string]$release.body).Substring(0,[Math]::Min(4000,([string]$release.body).Length));url=[string]$zipAsset.browser_download_url;sha256=[string]$manifest.sha256;size=[long]$manifest.size;digest=[string]$zipAsset.digest}
}
function Test-UpdateManagedPath([string]$Path) {
    if ($Path -match '[\\:]' -or $Path -match '(^|/)\.\.?(/|$)' -or $Path -match '[\x00-\x1f]' -or $Path.EndsWith('.') -or $Path.EndsWith(' ')) { return $false }
    return $Path -cin @('index.html','app.js','style.css','worker-source.js','session.js','package.json','Local-Helper.ps1','Update-App.ps1','Update-Core.ps1','Start-Virtue-Optimizer.cmd','README.txt','THIRD-PARTY-LICENSE.txt','Wasmegg-Comparison.md','RELEASE-NOTES.md') -or $Path -cmatch '^AUDIT-v[0-9]+\.[0-9]+\.[0-9]+\.md$' -or $Path -cmatch '^assets/(eggs|brand)/[a-zA-Z0-9_-]+\.(png|webp|jpg|jpeg|svg|json|txt)$'
}
function Assert-UpdateManifest($Manifest) {
    if ($Manifest.schema -ne 1 -or $Manifest.app -ne $script:UpdateAppId -or $Manifest.updater -ne 1) { throw 'Unsupported app update format.' }
    Get-UpdateVersion $Manifest.version | Out-Null
    $files = @($Manifest.files)
    if ($files.Count -lt 10 -or $files.Count -gt 500) { throw 'Invalid app update file list.' }
    $seen = @{}; $size = 0L
    foreach ($file in $files) {
        if (-not (Test-UpdateManagedPath $file.path) -or $seen.ContainsKey($file.path) -or $file.sha256 -notmatch '^[a-f0-9]{64}$' -or $file.size -lt 0 -or $file.size -gt 67108864) { throw 'Unsafe or invalid app update file.' }
        $seen[$file.path] = $true; $size += [long]$file.size
    }
    if ($size -gt 134217728) { throw 'Unpacked app update is too large.' }
    foreach ($required in @('index.html','app.js','style.css','worker-source.js','package.json','Local-Helper.ps1','Update-App.ps1','Update-Core.ps1','Start-Virtue-Optimizer.cmd','session.js')) { if (-not $seen.ContainsKey($required)) { throw "Missing required app update file: $required" } }
}
function Expand-VerifiedUpdate([string]$Archive, [string]$Stage, $Release) {
    if ((Get-Item -LiteralPath $Archive).Length -ne $Release.size -or (Get-UpdateHash $Archive) -ne $Release.sha256) { throw 'The download is incomplete or its checksum does not match. Your installed app was not changed.' }
    Assert-UpdateDigest $Release $Archive
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [IO.Compression.ZipFile]::OpenRead($Archive)
    try {
        $prefix = $script:UpdateFolder + '/'
        $manifestEntry = @($zip.Entries | Where-Object { $_.FullName -ceq ($prefix + 'Update-Files.json') })
        if ($manifestEntry.Count -ne 1 -or $manifestEntry[0].Length -gt 262144) { throw 'The app update has no valid file manifest.' }
        $reader = [IO.StreamReader]::new($manifestEntry[0].Open(), [Text.Encoding]::UTF8)
        try { $manifest = $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }
        Assert-UpdateManifest $manifest
        if ($manifest.version -cne $Release.version) { throw 'The downloaded app version does not match the release.' }
        $expected = @{}
        foreach ($file in $manifest.files) { $expected[$prefix + $file.path] = $file }
        $expected[$prefix + 'Update-Files.json'] = $null
        $expected[$prefix + 'update-config.json'] = $null # Default repository config is never installed over a user's choice.
        $seen = @{}
        foreach ($entry in $zip.Entries) {
            if (-not $expected.ContainsKey($entry.FullName) -or $seen.ContainsKey($entry.FullName) -or ((($entry.ExternalAttributes -shr 16) -band 61440) -eq 40960)) { throw 'The archive contains unexpected, duplicate or linked files.' }
            $seen[$entry.FullName] = $true
            if ($entry.FullName -ceq ($prefix + 'update-config.json')) { if ($entry.Length -gt 4096) { throw 'Invalid update configuration.' }; continue }
            $relative = $entry.FullName.Substring($prefix.Length)
            $file = $expected[$entry.FullName]
            if ($file -and $entry.Length -ne $file.size) { throw "Invalid size for $relative" }
            $destination = Join-Path $Stage $relative
            [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($destination)) | Out-Null
            $source = $entry.Open(); $output = [IO.File]::Create($destination)
            try { $source.CopyTo($output) } finally { $output.Dispose(); $source.Dispose() }
            if ($file -and (Get-UpdateHash $destination) -cne $file.sha256) { throw "Checksum verification failed for $relative" }
        }
        foreach ($name in $expected.Keys) { if ($name -cne ($prefix + 'update-config.json') -and -not $seen.ContainsKey($name)) { throw 'The archive is missing an app file.' } }
        if ((Read-UpdateJson (Join-Path $Stage 'package.json')).version -cne $Release.version) { throw 'The app package version is inconsistent.' }
        return $manifest
    } finally { $zip.Dispose() }
}
function Assert-UpdateDestination([string]$Root, [string]$Relative) {
    $current = [IO.Path]::GetFullPath($Root)
    if ((Get-Item -LiteralPath $current).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Updates cannot be installed through a linked app folder.' }
    foreach ($part in $Relative.Split('/')) {
        $current = Join-Path $current $part
        if ((Test-Path -LiteralPath $current) -and ((Get-Item -LiteralPath $current).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'An app file or folder is linked elsewhere. The update was stopped.' }
    }
}
function Install-VerifiedUpdate([string]$Root, [string]$JobRoot) {
    $stage = Join-Path $JobRoot 'stage'; $backup = Join-Path $JobRoot 'backup'
    $manifest = Read-UpdateJson (Join-Path $stage 'Update-Files.json')
    Assert-UpdateManifest $manifest
    # Recheck the staged bytes immediately before touching the installed app.
    foreach ($file in $manifest.files) {
        if ((Get-Item -LiteralPath (Join-Path $stage $file.path)).Length -ne $file.size -or (Get-UpdateHash (Join-Path $stage $file.path)) -cne $file.sha256) { throw 'The staged update changed after verification.' }
    }
    $paths = @($manifest.files | ForEach-Object { [string]$_.path }) + @('Update-Files.json')
    $oldManifestPath = Join-Path $Root 'Update-Files.json'
    if (Test-Path -LiteralPath $oldManifestPath) {
        $old = Read-UpdateJson $oldManifestPath; Assert-UpdateManifest $old
        # Only remove obsolete release audits, never user files or older unknown files.
        $paths += @($old.files | Where-Object { $_.path -cmatch '^AUDIT-v[0-9]+\.[0-9]+\.[0-9]+\.md$' -and $_.path -notin $paths } | ForEach-Object { [string]$_.path })
    }
    $records = @()
    foreach ($relative in $paths) {
        Assert-UpdateDestination $Root $relative
        $destination = Join-Path $Root $relative
        if ((Test-Path -LiteralPath $destination) -and -not (Test-Path -LiteralPath $destination -PathType Leaf)) { throw 'An app file path is occupied by a folder.' }
        $exists = Test-Path -LiteralPath $destination -PathType Leaf
        if ($exists) {
            $saved = Join-Path $backup $relative
            [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($saved)) | Out-Null
            [IO.File]::Copy($destination, $saved, $true)
        }
        $records += @{path=$relative;existed=$exists}
    }
    Write-UpdateJson (Join-Path $JobRoot 'rollback.json') @{files=$records}
    try {
        foreach ($relative in $paths) {
            $destination = Join-Path $Root $relative; $source = Join-Path $stage $relative
            if (Test-Path -LiteralPath $source -PathType Leaf) {
                [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($destination)) | Out-Null
                # Replace a complete sibling file, rather than writing app files in place.
                $temporary = $destination + '.update-' + [Guid]::NewGuid().ToString('N')
                try { [IO.File]::Copy($source, $temporary); Move-Item -LiteralPath $temporary -Destination $destination -Force }
                finally { if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Force } }
            } elseif (Test-Path -LiteralPath $destination) { Remove-Item -LiteralPath $destination -Force }
        }
    } catch { Restore-UpdateBackup $Root $JobRoot; throw }
}
function Restore-UpdateBackup([string]$Root, [string]$JobRoot) {
    $journal = Read-UpdateJson (Join-Path $JobRoot 'rollback.json')
    foreach ($record in $journal.files) {
        if (-not (Test-UpdateManagedPath $record.path) -and $record.path -cne 'Update-Files.json') { throw 'Invalid rollback path.' }
        Assert-UpdateDestination $Root $record.path
        $destination = Join-Path $Root $record.path
        if ($record.existed) { [IO.File]::Copy((Join-Path (Join-Path $JobRoot 'backup') $record.path), $destination, $true) }
        elseif (Test-Path -LiteralPath $destination -PathType Leaf) { Remove-Item -LiteralPath $destination -Force }
    }
}
