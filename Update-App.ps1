param([Parameter(Mandatory=$true)][ValidateSet('Download','Install')][string]$Mode,
      [Parameter(Mandatory=$true)][string]$JobRoot,
      [string]$AppRoot, [int]$ParentProcessId, [int]$Port)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Update-Core.ps1')
$statePath = Join-Path $JobRoot 'status.json'
function Set-State([string]$State, [string]$Message) { Write-UpdateJson $statePath @{state=$State;message=$Message;updatedAt=[DateTime]::UtcNow.ToString('o')} }
function Start-UpdatedHelper([string]$Label) {
    $executable = (Get-Process -Id $PID).Path
    $scriptPath = Join-Path $AppRoot 'Local-Helper.ps1'
    $options = @{FilePath=$executable;ArgumentList=@('-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + $scriptPath + '"'),'-NoBrowser','-Port',"$Port");PassThru=$true;RedirectStandardError=(Join-Path $JobRoot ($Label + '-error.log'))}
    if ($env:OS -ne 'Windows_NT') { $options.RedirectStandardOutput = Join-Path $JobRoot ($Label + '.log') }
    return Start-Process @options
}
function Wait-UpdatedHelper([string]$Version) {
    $deadline = [DateTime]::UtcNow.AddSeconds(20)
    while ([DateTime]::UtcNow -lt $deadline) {
        try {
            $reply = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/update/health" -TimeoutSec 2
            if ($reply.version -ceq $Version -and $reply.rootId -ceq (Get-UpdateHash (Join-Path $AppRoot 'app.js'))) { return $true }
        } catch { }
        Start-Sleep -Milliseconds 300
    }
    return $false
}
try {
    $job = Read-UpdateJson (Join-Path $JobRoot 'job.json')
    if ($Mode -eq 'Download') {
        Set-State 'downloading' 'Downloading the update...'
        $archive = Join-Path $JobRoot 'release.zip'
        Assert-UpdateAssetUrl $job.release.url $job.release.repository 'Egg-Inc-Virtue-Farm-Optimizer.zip'
        Save-UpdateDownload $job.release.url $archive ([long]$job.release.size)
        Set-State 'verifying' 'Verifying the download...'
        Expand-VerifiedUpdate $archive (Join-Path $JobRoot 'stage') $job.release | Out-Null
        Set-State 'ready' 'The update is verified and ready to install.'
        exit 0
    }
    if (-not $AppRoot -or $Port -lt 8765 -or $Port -gt 8790 -or $ParentProcessId -le 0) { throw 'Invalid app restart request.' }
    Set-State 'installing' 'Installing the update and restarting the app...'
    $parent = Get-Process -Id $ParentProcessId -ErrorAction SilentlyContinue
    if ($parent -and -not $parent.WaitForExit(20000)) { throw 'The local app did not stop. Close its launcher window and try again.' }
    $oldVersion = (Read-UpdateJson (Join-Path $AppRoot 'package.json')).version
    $installed = $false; $newHelper = $null
    try {
        Install-VerifiedUpdate $AppRoot $JobRoot
        $installed = $true
        $newHelper = Start-UpdatedHelper 'new-helper'
        if (-not (Wait-UpdatedHelper $job.release.version)) {
            $details = ''; $log = Join-Path $JobRoot 'new-helper-error.log'
            if (Test-Path -LiteralPath $log) { $details = [string](Get-Content -LiteralPath $log -Raw -ErrorAction SilentlyContinue); if ($details.Length -gt 3000) { $details = $details.Substring(0,3000) } }
            throw ('The updated app could not restart. ' + $details.Trim())
        }
        Write-UpdateJson (Join-Path $AppRoot '.update-result.json') @{ok=$true;version=$job.release.version;message="Updated to v$($job.release.version). Your farm and settings were kept."}
        Set-State 'complete' "Updated to v$($job.release.version)."
        # Keep the most recent backup only. Do not touch unrelated folders.
        foreach ($directory in (Get-ChildItem -LiteralPath (Join-Path $AppRoot '.updates') -Directory)) {
            if ($directory.Name -match '^job-[a-f0-9]{32}$' -and $directory.FullName -ne $JobRoot) { Remove-Item -LiteralPath $directory.FullName -Recurse -Force -ErrorAction SilentlyContinue }
        }
    } catch {
        $failure = $_.Exception.Message
        if ($newHelper -and -not $newHelper.HasExited) { Stop-Process -Id $newHelper.Id -Force -ErrorAction SilentlyContinue; $newHelper.WaitForExit(5000) | Out-Null }
        if ($installed) { Restore-UpdateBackup $AppRoot $JobRoot }
        Write-UpdateJson (Join-Path $AppRoot '.update-result.json') @{ok=$false;version=$oldVersion;message="The update failed; the previous app was restored. $failure"}
        $restored = Start-UpdatedHelper 'restored-helper'
        Set-State 'failed' "The update failed; the previous app was restored. $failure"
        if (-not (Wait-UpdatedHelper $oldVersion)) { throw 'Close this window and launch Start-Virtue-Optimizer.cmd again. Your previous app files and farm data are retained.' }
    }
} catch {
    Set-State 'failed' $_.Exception.Message
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
