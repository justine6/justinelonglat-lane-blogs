# blogs-toolkit/ops/build.ps1
[CmdletBinding()]
param(
  [string]$SiteUrl = "https://blogs.justinelonglat-lane.com",
  [string]$PostsRoot = "",
  [switch]$SkipMetadata
)

$ErrorActionPreference = "Stop"

# Where this script lives: <repo>\blogs-toolkit\ops
$OpsDir      = $PSScriptRoot
$ToolkitRoot = (Resolve-Path (Join-Path $OpsDir "..")).Path          # <repo>\blogs-toolkit
$RepoRoot    = (Resolve-Path (Join-Path $ToolkitRoot "..")).Path     # <repo>

Write-Host "📂 Repo root:    $RepoRoot"
Write-Host "🧰 Toolkit root: $ToolkitRoot"

# 1) Metadata generation (optional)
if (-not $SkipMetadata) {
  $Gen = Join-Path $ToolkitRoot "content\Generate-Metadata.ps1"
  if (-not (Test-Path -LiteralPath $Gen)) { throw "Missing generator: $Gen" }

  if (-not $PostsRoot) { $PostsRoot = (Join-Path $RepoRoot "posts") }

  Write-Host "📝 Running metadata generator: $Gen"
  & pwsh -NoProfile -ExecutionPolicy Bypass -File $Gen `
    -SiteUrl $SiteUrl `
    -PostsRoot $PostsRoot `
    -RepoRoot $RepoRoot `
    -ToolkitRoot $ToolkitRoot

  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
else {
  Write-Host "⏭ Skipping metadata generation (-SkipMetadata)."
}

# 2) Run the JS build
Write-Host "🏗 Running site build..."

Push-Location $RepoRoot
try {
  if (Test-Path "pnpm-lock.yaml") {
    pnpm build
  }
  elseif (Test-Path "package.json") {
    npm run build
  }
  else {
    Write-Host "⚠ No package.json or pnpm-lock.yaml found; nothing to build."
  }

  $exit = $LASTEXITCODE
  if ($exit -ne $null -and $exit -ne 0) {
    Write-Host "⚠ Build exited with code $exit"
    exit $exit
  }
}
finally {
  Pop-Location
}
