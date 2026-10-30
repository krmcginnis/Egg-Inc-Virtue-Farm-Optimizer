$ErrorActionPreference = 'Stop'
. (Join-Path (Get-Location) 'Update-Core.ps1')
$validation = Join-Path $env:RUNNER_TEMP 'virtue-public-feed'
[IO.Directory]::CreateDirectory($validation) | Out-Null
try {
  $version = (Get-Content package.json -Raw | ConvertFrom-Json).version
  $release = $null
  $lastFailure = $null
  for ($attempt = 1; $attempt -le 5; $attempt++) {
    try {
      $release = Get-UpdateRelease $env:RELEASE_REPOSITORY '0.0.0' $validation
      if (-not $release.available -or $release.version -cne $version) { throw 'The published release was not found by the updater at the expected version.' }
      $archive = Join-Path $validation 'published.zip'
      Save-UpdateDownload $release.url $archive $release.size
      Expand-VerifiedUpdate $archive (Join-Path $validation 'verified') $release | Out-Null
      $lastFailure = $null
      break
    } catch {
      $lastFailure = $_.Exception
      if ($attempt -ge 5) { throw }
      Write-Host "Public feed attempt $attempt failed: $($lastFailure.Message)"
      $response = $_.Exception.Response
      if ($response) {
        Write-Host "HTTP status: $([int]$response.StatusCode); rate-limit remaining: $($response.Headers['X-RateLimit-Remaining']); reset: $($response.Headers['X-RateLimit-Reset'])"
      }
      Start-Sleep -Seconds (15 * $attempt)
    }
  }
  if ($lastFailure) { throw $lastFailure }
  Write-Host "PASS: public update feed, complete release download and all app file checksums on Windows PowerShell $($PSVersionTable.PSVersion)."
} catch {
  $failure = $_.Exception.Message
  $version = (Get-Content package.json -Raw | ConvertFrom-Json).version
  gh release edit "v$version" --draft=true
  throw "Published feed validation failed after retries; release hidden again. $failure"
}
