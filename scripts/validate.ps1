# scripts/validate.ps1
[CmdletBinding()]
param(
  [string] $RepoRoot = (Resolve-Path ".").Path
)

$ErrorActionPreference = "Stop"

function Run($label, $cmd) {
  Write-Host "`n==> $label" -ForegroundColor Cyan
  Write-Host "    $cmd" -ForegroundColor DarkGray
  cmd /c $cmd
  if ($LASTEXITCODE -ne 0) { throw "Failed: $label" }
}

Push-Location $RepoRoot

# If you have Node-based guardrails, keep them here:
if (Test-Path ".\scripts\check-partials.mjs") {
  Run "check-partials" "node scripts/check-partials.mjs"
}

if (Test-Path ".\scripts\check-heroes.mjs") {
  Run "check-heroes" "node scripts/check-heroes.mjs"
}

# Optional: html validation if you have it wired
if (Test-Path ".\package.json") {
  # Only run if script exists
  $pkg = Get-Content ".\package.json" -Raw | ConvertFrom-Json
  if ($pkg.scripts -and $pkg.scripts.htmlvalidate) {
    Run "htmlvalidate" "npm run -s htmlvalidate"
  }
  if ($pkg.scripts -and $pkg.scripts.linkcheck) {
    Run "linkcheck" "npm run -s linkcheck"
  }
}

Write-Host "`n✅ Validation OK" -ForegroundColor Green
Pop-Location
