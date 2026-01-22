# blogs-toolkit/run.ps1
[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet("new","publish","build","serve","validate","rebase-safe","suture","help")]
  [string]$Cmd = "help",

  [string]$Title,
  [string[]]$Tags,
  [string]$Summary,

  [string]$SiteUrl,
  [string]$PostsRoot,

  [switch]$SkipMetadata
)

$ErrorActionPreference = "Stop"

# Folder where this script lives: <repo>\blogs-toolkit
$here = Split-Path -Parent $PSCommandPath

# Repo root = one level up from blogs-toolkit/
$repo = (Resolve-Path (Join-Path $here "..")).Path

function Run {
  param(
    [Parameter(Mandatory=$true)][string]$RelPath,
    [string[]]$Args = @()
  )

  $full = Join-Path $repo $RelPath
  if (-not (Test-Path -LiteralPath $full)) { throw "Missing: $RelPath" }

  & pwsh -NoProfile -ExecutionPolicy Bypass -File $full @Args
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

function Show-Help {
  Write-Host ""
  Write-Host "blogs-toolkit commands:"
  Write-Host "  pwsh ./blogs-toolkit/run.ps1 new -Title '...' -Tags tag1,tag2 -Summary '...'"
  Write-Host "  pwsh ./blogs-toolkit/run.ps1 publish"
  Write-Host "  pwsh ./blogs-toolkit/run.ps1 build"
  Write-Host "  pwsh ./blogs-toolkit/run.ps1 build -SiteUrl 'https://blogs.justinelonglat-lane.com'"
  Write-Host "  pwsh ./blogs-toolkit/run.ps1 build -PostsRoot '.\posts'"
  Write-Host "  pwsh ./blogs-toolkit/run.ps1 build -SkipMetadata"
  Write-Host "  pwsh ./blogs-toolkit/run.ps1 serve"
  Write-Host "  pwsh ./blogs-toolkit/run.ps1 validate"
  Write-Host "  pwsh ./blogs-toolkit/run.ps1 rebase-safe"
  Write-Host "  pwsh ./blogs-toolkit/run.ps1 suture"
  Write-Host ""
}

switch ($Cmd) {
  "new" {
    $a = @()
    if ($Title)   { $a += @("-Title", $Title) }
    if ($Tags)    { $a += @("-Tags", ($Tags -join ",")) }
    if ($Summary) { $a += @("-Summary", $Summary) }
    Run "blogs-toolkit/content/new-post.ps1" $a
  }

  "publish" {
    Run "blogs-toolkit/content/publish-draft.ps1"
  }

  "build" {
    # sensible defaults for your production setup
    if (-not $SiteUrl)   { $SiteUrl = "https://blogs.justinelonglat-lane.com" }
    if (-not $PostsRoot) { $PostsRoot = (Join-Path $repo "posts") }

    Write-Host ""
    Write-Host "🚀 blogs-toolkit build" -ForegroundColor Cyan
    Write-Host "   Repo:      $repo"
    Write-Host "   SiteUrl:    $SiteUrl"
    Write-Host "   PostsRoot:  $PostsRoot"
    Write-Host "   Metadata:   " -NoNewline
    if ($SkipMetadata) { Write-Host "SKIP" -ForegroundColor Yellow } else { Write-Host "RUN" -ForegroundColor Green }
    Write-Host ""

    $a = @("-SiteUrl", $SiteUrl, "-PostsRoot", $PostsRoot)
    if ($SkipMetadata) { $a += "-SkipMetadata" }

    Run "blogs-toolkit/ops/build.ps1" $a
  }

  "serve" {
    Run "blogs-toolkit/dev/serve.ps1"
  }

  "validate" {
    Run "blogs-toolkit/verify/validate.ps1"
  }

  "rebase-safe" {
    Run "blogs-toolkit/dev/Safe-Rebase.ps1"
  }

  "suture" {
    Run "blogs-toolkit/dev/git-suture.ps1"
  }

  default {
    Show-Help
  }
}
