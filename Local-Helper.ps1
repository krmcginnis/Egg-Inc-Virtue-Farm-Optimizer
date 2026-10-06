param([switch]$NoBrowser, [int]$Port = 0)
# Local app host, read-only Egg Inc proxy and user-requested app updater.
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$rootPath = $PSScriptRoot
. (Join-Path $rootPath 'Update-Core.ps1')
$appVersion = (Get-Content -LiteralPath (Join-Path $rootPath 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json).version
$rootId = Get-UpdateHash (Join-Path $rootPath 'app.js')
$availableRelease = $null; $updateProcess = $null; $activeJob = $null
$updatesRoot = Join-Path $rootPath '.updates'
$activePath = Join-Path $rootPath '.update-active.json'
if (Test-Path -LiteralPath $activePath) {
    try { $jobName = (Read-UpdateJson $activePath).job; if ($jobName -match '^job-[a-f0-9]{32}$') { $activeJob = Join-Path $updatesRoot $jobName } } catch { }
}
$appTitle = "Egg Inc. Virtue Farm Optimizer $appVersion"
$staticFiles = @{'/'='index.html';'/index.html'='index.html';'/app.js'='app.js';'/style.css'='style.css';'/worker-source.js'='worker-source.js';'/THIRD-PARTY-LICENSE.txt'='THIRD-PARTY-LICENSE.txt';'/Wasmegg-Comparison.md'='Wasmegg-Comparison.md'}
$staticFiles["/AUDIT-v$appVersion.md"] = "AUDIT-v$appVersion.md"
$mimeTypes = @{'.html'='text/html; charset=utf-8';'.css'='text/css; charset=utf-8';'.js'='text/javascript; charset=utf-8';'.json'='application/json; charset=utf-8';'.txt'='text/plain; charset=utf-8';'.md'='text/plain; charset=utf-8';'.png'='image/png';'.webp'='image/webp';'.jpg'='image/jpeg';'.jpeg'='image/jpeg';'.svg'='image/svg+xml'}
# Register only bundled assets; arbitrary app and farm files remain private.
$assetRoot = Join-Path $rootPath 'assets'
if (Test-Path -LiteralPath $assetRoot -PathType Container) {
    foreach ($asset in (Get-ChildItem -LiteralPath $assetRoot -Recurse -File)) {
        if (-not $mimeTypes.ContainsKey($asset.Extension.ToLowerInvariant())) { continue }
        $relativePath = $asset.FullName.Substring($rootPath.Length + 1).Replace('\','/')
        $staticFiles['/' + $relativePath] = $relativePath
    }
}
try { $Host.UI.RawUI.WindowTitle = $appTitle } catch { }
$listener = $null
$portMutex = $null
$requestedPort = $Port
if ($requestedPort -ne 0 -and ($requestedPort -lt 8765 -or $requestedPort -gt 8790)) { throw 'Invalid app port.' }
$firstPort = 8765; $lastPort = 8790
if ($requestedPort) { $firstPort = $requestedPort; $lastPort = $requestedPort }
for ($candidate = $firstPort; $candidate -le $lastPort; $candidate++) {
    try {
        # Reuse closed TCP connections on Windows without letting two app
        # helpers share a live port. Keep the mutex until the listener stops.
        $candidateMutex = [Threading.Mutex]::new($false, "Local\EggIncVirtueOptimizer-Port-$candidate")
        $ownsPort = $false
        try { $ownsPort = $candidateMutex.WaitOne(0) }
        catch [Threading.AbandonedMutexException] { $ownsPort = $true }
        if (-not $ownsPort) { $candidateMutex.Dispose(); continue }
        $portMutex = $candidateMutex
        $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $candidate)
        $listener.ExclusiveAddressUse = $false
        $listener.Server.SetSocketOption([Net.Sockets.SocketOptionLevel]::Socket, [Net.Sockets.SocketOptionName]::ReuseAddress, $true)
        $listener.Start()
        $port = $candidate
        break
    } catch {
        if ($listener) { $listener.Stop() }; $listener = $null
        if ($portMutex) { $portMutex.ReleaseMutex(); $portMutex.Dispose(); $portMutex = $null }
    }
}
if ($null -eq $listener) { throw 'Cannot open a local app port. Close another instance and retry.' }
$baseUrl = "http://127.0.0.1:$port"
$token = [Guid]::NewGuid().ToString('N')
function Send-Reply($stream, [int]$status, [string]$type, [byte[]]$bytes) {
    $reason = @{200='OK';400='Bad Request';403='Forbidden';404='Not Found';405='Method Not Allowed';409='Conflict';502='Bad Gateway'}[$status]
    $headers = "HTTP/1.1 $status $reason`r`nContent-Type: $type`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`nCache-Control: no-store`r`nX-Content-Type-Options: nosniff`r`n`r`n"
    $head = [Text.Encoding]::ASCII.GetBytes($headers)
    $stream.Write($head,0,$head.Length)
    $stream.Write($bytes,0,$bytes.Length)
    $stream.Flush()
}
function Text-Reply($stream, [int]$status, [string]$text) {
    Send-Reply $stream $status 'text/plain; charset=utf-8' ([Text.Encoding]::UTF8.GetBytes($text))
}
function Json-Reply($stream, [int]$status, $value) {
    Send-Reply $stream $status 'application/json; charset=utf-8' ([Text.Encoding]::UTF8.GetBytes(($value | ConvertTo-Json -Depth 20 -Compress)))
}
function Get-UpdateState {
    $repository = ''; $state = $null; $result = $null
    try { $repository = [string](Read-UpdateJson (Join-Path $rootPath 'update-config.json')).repository } catch { }
    if ($activeJob -and (Test-Path -LiteralPath (Join-Path $activeJob 'status.json'))) {
        try { $state = Read-UpdateJson (Join-Path $activeJob 'status.json') } catch { }
        if ($updateProcess -and $updateProcess.HasExited -and $state.state -in @('downloading','verifying')) { $state = @{state='failed';message='The update download stopped. Try again.'} }
    }
    if (Test-Path -LiteralPath (Join-Path $rootPath '.update-result.json')) { try { $result = Read-UpdateJson (Join-Path $rootPath '.update-result.json') } catch { } }
    return @{version=$appVersion;rootId=$rootId;repository=$repository;configured=[bool]$repository;job=$state;result=$result;pending=($state -and $state.state -eq 'installing')}
}
function Start-UpdateWorker([string]$Mode) {
    $executable = (Get-Process -Id $PID).Path
    $scriptPath = Join-Path $activeJob 'Update-App.ps1'
    $arguments = @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + $scriptPath + '"'),'-Mode',$Mode,'-JobRoot',('"' + $activeJob + '"'))
    if ($Mode -eq 'Install') { $arguments += @('-AppRoot',('"' + $rootPath + '"'),'-ParentProcessId',"$PID",'-Port',"$port") }
    $options = @{FilePath=$executable;ArgumentList=$arguments;PassThru=$true;RedirectStandardOutput=(Join-Path $activeJob ($Mode + '.log'));RedirectStandardError=(Join-Path $activeJob ($Mode + '-error.log'))}
    if ($env:OS -eq 'Windows_NT') { $options.WindowStyle = 'Hidden' }
    return Start-Process @options
}
Write-Host $appTitle -ForegroundColor Cyan
Write-Host "Running on $baseUrl. Keep this window open for EID import and app updates."
Write-Host 'Close this window or press Ctrl+C to stop. Farm files can also be opened offline.'
if (-not $NoBrowser) { Start-Process $baseUrl }
try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        # Browsers may pre-open an idle connection. Do not let it block the
        # single local request loop or the updater's restart health checks.
        if (-not $client.Client.Poll(200000, [Net.Sockets.SelectMode]::SelectRead)) { $client.Close(); continue }
        $stream = $client.GetStream()
        $stream.ReadTimeout = 5000
        $stream.WriteTimeout = 35000
        try {
            # Parse HTTP headers as bytes so Content-Length remains exact for UTF-8 bodies.
            $headerBytes = New-Object 'System.Collections.Generic.List[byte]'
            while ($headerBytes.Count -lt 16384) {
                $b = $stream.ReadByte()
                if ($b -lt 0) { throw 'Connection closed before headers.' }
                $headerBytes.Add([byte]$b)
                $n = $headerBytes.Count
                if ($n -ge 4 -and $headerBytes[$n-4] -eq 13 -and $headerBytes[$n-3] -eq 10 -and $headerBytes[$n-2] -eq 13 -and $headerBytes[$n-1] -eq 10) { break }
            }
            if ($headerBytes.Count -ge 16384) { throw 'Headers too large.' }
            $lines = [Text.Encoding]::ASCII.GetString($headerBytes.ToArray()).Split(@("`r`n"), [StringSplitOptions]::None)
            $first = $lines[0].Split(' ')
            if ($first.Length -lt 3) { throw 'Invalid HTTP request.' }
            $method = $first[0]
            $path = $first[1].Split('?')[0]
            $headers = @{}
            foreach ($line in $lines[1..($lines.Length-1)]) {
                $split = $line.IndexOf(':')
                if ($split -gt 0) { $headers[$line.Substring(0,$split).Trim().ToLowerInvariant()] = $line.Substring($split+1).Trim() }
            }
            if ($headers['host'] -ne "127.0.0.1:$port") { Text-Reply $stream 403 'Invalid host.'; continue }
            if ($method -eq 'GET' -and $path -in @('/api/update/status','/api/update/health')) { Json-Reply $stream 200 (Get-UpdateState); continue }
            if ($method -eq 'POST' -and ($path -eq '/api/backup' -or $path.StartsWith('/api/update/'))) {
                if ($headers['x-virtue-token'] -ne $token -or ($headers.ContainsKey('origin') -and $headers['origin'] -ne $baseUrl)) { Text-Reply $stream 403 'Invalid local session.'; continue }
                if ($headers['content-type'] -ne 'application/json') { Text-Reply $stream 400 'Expected JSON.'; continue }
                $length = 0
                if (-not [int]::TryParse($headers['content-length'],[ref]$length) -or $length -lt 1 -or $length -gt 65536) { Text-Reply $stream 400 'Invalid request size.'; continue }
                $body = New-Object byte[] $length
                $read = 0
                while ($read -lt $length) { $count = $stream.Read($body,$read,$length-$read); if ($count -le 0) { throw 'Incomplete body.' }; $read += $count }
                $request = [Text.Encoding]::UTF8.GetString($body) | ConvertFrom-Json
                if ($path.StartsWith('/api/update/')) {
                    try {
                        switch ($path) {
                            '/api/update/configure' {
                                if ((Get-UpdateState).job.state -in @('downloading','verifying','installing')) { throw 'An update is already in progress.' }
                                $repository = Get-UpdateRepository ([string]$request.repository)
                                Write-UpdateJson (Join-Path $rootPath 'update-config.json') @{repository=$repository}
                                $availableRelease = $null
                                Json-Reply $stream 200 (Get-UpdateState)
                            }
                            '/api/update/check' {
                                $settings = Get-UpdateState
                                if (-not $settings.configured) { Json-Reply $stream 200 @{configured=$false;available=$false;currentVersion=$appVersion}; break }
                                $availableRelease = $null
                                $checkRoot = Join-Path $updatesRoot ('check-' + [Guid]::NewGuid().ToString('N'))
                                [IO.Directory]::CreateDirectory($checkRoot) | Out-Null
                                try { $checked = Get-UpdateRelease $settings.repository $appVersion $checkRoot }
                                finally { Remove-Item -LiteralPath $checkRoot -Recurse -Force -ErrorAction SilentlyContinue }
                                if ($checked.available) { $availableRelease = $checked }
                                Json-Reply $stream 200 @{configured=$true;available=[bool]$checked.available;currentVersion=$appVersion;version=$checked.version;repository=$checked.repository;notes=$checked.notes}
                            }
                            '/api/update/start' {
                                if ((Get-UpdateState).job.state -in @('downloading','verifying','installing')) { throw 'An update is already in progress.' }
                                if (-not $availableRelease -or $request.version -cne $availableRelease.version) { throw 'Check for updates again before installing.' }
                                $activeJob = Join-Path $updatesRoot ('job-' + [Guid]::NewGuid().ToString('N'))
                                [IO.Directory]::CreateDirectory($activeJob) | Out-Null
                                Copy-Item -LiteralPath (Join-Path $rootPath 'Update-Core.ps1') -Destination $activeJob
                                Copy-Item -LiteralPath (Join-Path $rootPath 'Update-App.ps1') -Destination $activeJob
                                Write-UpdateJson (Join-Path $activeJob 'job.json') @{release=$availableRelease}
                                Write-UpdateJson (Join-Path $activeJob 'status.json') @{state='downloading';message='Downloading the update...'}
                                Write-UpdateJson $activePath @{job=[IO.Path]::GetFileName($activeJob)}
                                $updateProcess = Start-UpdateWorker 'Download'
                                Json-Reply $stream 200 @{started=$true}
                            }
                            '/api/update/install' {
                                if (-not $activeJob -or (Get-UpdateState).job.state -ne 'ready') { throw 'The update has not finished verification.' }
                                Write-UpdateJson (Join-Path $activeJob 'status.json') @{state='installing';message='Restarting the app...'}
                                try { $updateProcess = Start-UpdateWorker 'Install' }
                                catch { Write-UpdateJson (Join-Path $activeJob 'status.json') @{state='ready';message='The installer could not start. Try again.'}; throw }
                                Json-Reply $stream 200 @{restarting=$true}
                                $listener.Stop()
                            }
                            '/api/update/acknowledge' {
                                Remove-Item -LiteralPath (Join-Path $rootPath '.update-result.json') -Force -ErrorAction SilentlyContinue
                                Json-Reply $stream 200 @{ok=$true}
                            }
                            default { Json-Reply $stream 404 @{error='Unknown update request.'} }
                        }
                    } catch { Json-Reply $stream 409 @{error=('Could not update the app. ' + $_.Exception.Message)} }
                    if ($path -eq '/api/update/install' -and $updateProcess -and (Get-UpdateState).job.state -eq 'installing') { break }
                    continue
                }
                if ($request.eid -notmatch '^EI[0-9]{16}$' -or $request.data -notmatch '^[A-Za-z0-9+/=]+$') { Text-Reply $stream 400 'Invalid Egg Inc request.'; continue }
                # Only a fixed, read-only backup endpoint is supported. No game mutations.
                try {
                    $payload = 'data=' + [Uri]::EscapeDataString([string]$request.data)
                    $response = Invoke-WebRequest -UseBasicParsing -Uri 'https://www.auxbrain.com/ei/bot_first_contact' -Method POST -ContentType 'application/x-www-form-urlencoded' -Body $payload -TimeoutSec 30
                    Send-Reply $stream 200 'text/plain; charset=utf-8' ([Text.Encoding]::UTF8.GetBytes([string]$response.Content))
                } catch { Text-Reply $stream 502 'Egg Inc API could not be reached. Check your connection, sync the game, and retry. The private API may have changed.' }
                continue
            }
            if ($method -ne 'GET') { Text-Reply $stream 405 'Only GET and supported local POST requests are allowed.'; continue }
            if ($path -eq '/session.js') {
                Send-Reply $stream 200 'text/javascript; charset=utf-8' ([Text.Encoding]::UTF8.GetBytes("window.VIRTUE_PROXY_TOKEN = '$token';"))
                continue
            }
            if (-not $staticFiles.ContainsKey($path)) { Text-Reply $stream 404 'Not found.'; continue }
            $file = Join-Path $rootPath $staticFiles[$path]
            $mime = $mimeTypes[[IO.Path]::GetExtension($file).ToLowerInvariant()]
            Send-Reply $stream 200 $mime ([IO.File]::ReadAllBytes($file))
        } catch {
            try { Text-Reply $stream 400 'Could not read the local request.' } catch {}
        } finally { $stream.Dispose(); $client.Close() }
    }
} finally {
    $listener.Stop()
    if ($portMutex) { $portMutex.ReleaseMutex(); $portMutex.Dispose() }
}
