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

try {
  if (Test-Path ".\scripts\check-partials.mjs") {
    Run "check-partials" "node scripts/check-partials.mjs"
  }

  if (Test-Path ".\scripts\check-header-guardrails.mjs") {
    Run "check-header-guardrails" "node scripts/check-header-guardrails.mjs"
  }

  if (Test-Path ".\scripts\check-heroes.mjs") {
    Run "check-heroes" "node scripts/check-heroes.mjs"
  }

  if (Test-Path ".\package.json") {
    $pkg = Get-Content ".\package.json" -Raw | ConvertFrom-Json

    if ($pkg.scripts -and $pkg.scripts."validate:html-contracts") {
      Run "validate:html-contracts" "npm run -s validate:html-contracts"
    }

    if ($pkg.scripts -and $pkg.scripts."verify:output") {
      Run "verify:output" "npm run -s verify:output"
    }

    if ($pkg.scripts -and $pkg.scripts.htmlvalidate) {
      Run "htmlvalidate" "npm run -s htmlvalidate"
    }

    if ($pkg.scripts -and $pkg.scripts.linkcheck) {
      Run "linkcheck" "npm run -s linkcheck"
    }
  }

  Write-Host "`n✅ Validation OK" -ForegroundColor Green
}
finally {
  Pop-Location
}tion
