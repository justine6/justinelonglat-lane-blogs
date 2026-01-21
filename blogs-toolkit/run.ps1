# blogs-toolkit/run.ps1
[CmdletBinding()]
param(
  [Parameter(Position=0)]
  [ValidateSet("new","publish","build","serve","validate","rebase-safe","suture","help")]
  [string]$Cmd = "help",

  [string]$Title,
  [string[]]$Tags,
  [string]$Summary,
  [string]$SiteUrl
)

$ErrorActionPreference = "Stop"

# Folder where this script lives
$here = Split-Path -Parent $PSCommandPath

# Repo root = one level up from blogs-toolkit/
$repo = Resolve-Path (Join-Path $here "..") | Select-Object -ExpandProperty Path

function Run {
  param(
    [Parameter(Mandatory=$true)][string]$RelPath,
    [string[]]$Args = @()
  )

  $full = Join-Path $repo $RelPath
  if (-not (Test-Path $full)) { throw "Missing: $RelPath" }

  & pwsh -NoProfile -ExecutionPolicy Bypass -File $full @Args
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

switch ($Cmd) {
  "new" {
    $a = @()
    if ($Title)   { $a += @("-Title", $Title) }
    if ($Tags)    { $a += @("-Tags", ($Tags -join ",")) }
    if ($Summary) { $a += @("-Summary", $Summary) }
    Run "blogs-toolkit/content/new-post.ps1" $a
  }

  "publish" { Run "blogs-toolkit/content/publish-draft.ps1" }

  "build" {
    $a = @()
    if ($SiteUrl) { $a += @("-SiteUrl", $SiteUrl) }
    Run "blogs-toolkit/ops/build.ps1" $a
  }

  "serve" { Run "blogs-toolkit/dev/serve.ps1" }

  "validate" { Run "blogs-toolkit/verify/validate.ps1" }

  "rebase-safe" { Run "blogs-toolkit/dev/Safe-Rebase.ps1" }

  "suture" { Run "blogs-toolkit/dev/git-suture.ps1" }

  default {
    Write-Host ""
    Write-Host "blogs-toolkit commands:"
    Write-Host "  pwsh ./blogs-toolkit/run.ps1 new -Title '...' -Tags tag1,tag2 -Summary '...'"
    Write-Host "  pwsh ./blogs-toolkit/run.ps1 publish"
    Write-Host "  pwsh ./blogs-toolkit/run.ps1 build -SiteUrl 'https://blogs.justinelonglat-lane.com'"
    Write-Host "  pwsh ./blogs-toolkit/run.ps1 serve"
    Write-Host "  pwsh ./blogs-toolkit/run.ps1 validate"
    Write-Host ""
  }
}
