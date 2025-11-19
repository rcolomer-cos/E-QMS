[CmdletBinding()]
param(
  [switch]$SkipUpdate,
  # When set, runs backend and frontend in separate PowerShell windows
  [switch]$SeparateWindows
)

$ErrorActionPreference = 'Stop'

function Invoke-Step($Title, [scriptblock]$Action) {
  Write-Host "==> $Title" -ForegroundColor Cyan
  & $Action
  if ($LASTEXITCODE -ne 0) { throw "Step failed: $Title" }
  Write-Host "    ✓ $Title" -ForegroundColor Green
}

# Resolve repo root (this script lives in E-QMS/scripts)
$ScriptDir = Split-Path -Parent $PSCommandPath
$RepoRoot  = Split-Path -Parent $ScriptDir
$Backend   = Join-Path $RepoRoot 'backend'
$Frontend  = Join-Path $RepoRoot 'frontend'

Write-Host "Repo root: $RepoRoot" -ForegroundColor DarkGray

Invoke-Step "Checking Node/npm versions" {
  $nodev = node -v
  $npmv  = npm -v
  Write-Host "Node: $nodev  npm: $npmv" -ForegroundColor DarkGray
}

if (-not $SkipUpdate) {
  Invoke-Step "Updating all workspace dependencies" {
    Push-Location $RepoRoot
    # Update dependencies in root and all workspaces to latest within semver ranges
    npm update --workspaces | Out-Default
    # Ensure lockfile is consistent
    npm install | Out-Default
    Pop-Location
  }

  Invoke-Step "Installing workspace deps (backend)" {
    Push-Location $RepoRoot
    npm install --workspace=backend | Out-Default
    Pop-Location
  }

  Invoke-Step "Installing workspace deps (frontend)" {
    Push-Location $RepoRoot
    npm install --workspace=frontend | Out-Default
    Pop-Location
  }
}

# Start servers
if ($SeparateWindows) {
  Write-Host "Starting backend then frontend in separate windows..." -ForegroundColor Cyan
  Start-Process pwsh -ArgumentList @('-NoExit','-Command',"Set-Location '$Backend'; npm run dev")
  Start-Sleep -Seconds 2
  Start-Process pwsh -ArgumentList @('-NoExit','-Command',"Set-Location '$Frontend'; npm run dev")
}
else {
  Write-Host "Starting backend and frontend (concurrently) from repo root..." -ForegroundColor Cyan
  Push-Location $RepoRoot
  # Uses the monorepo script to start both dev servers together
  npm run dev
  Pop-Location
}
