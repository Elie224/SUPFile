param(
  [switch]$Background,
  [switch]$SkipWeb,
  [switch]$SkipBackend,
  [switch]$SkipMobile,
  [switch]$SkipApiConnectivity,
  [switch]$SkipAuthFlow,
  [switch]$BuildApk
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

function Write-Section([string]$title) {
  Write-Host "" 
  Write-Host "========================================" -ForegroundColor Cyan
  Write-Host $title -ForegroundColor Cyan
  Write-Host "========================================" -ForegroundColor Cyan
}

function Exec([string]$label, [string]$command, [string]$workingDir) {
  Write-Host "" 
  Write-Host "--> $label" -ForegroundColor Yellow
  Write-Host "    $command" -ForegroundColor DarkGray

  Push-Location $workingDir
  try {
    # Use cmd.exe to preserve conventional exit codes for npm/flutter.
    cmd.exe /c $command
    if ($LASTEXITCODE -ne 0) {
      throw "$label failed with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
}

function New-Directory([string]$path) {
  New-Item -ItemType Directory -Force -Path $path | Out-Null
}

function Test-ApiHealth([string]$baseUrl, [switch]$IsOptional) {
  $healthUrl = "$baseUrl/health"
  Write-Host "Testing: $healthUrl" -ForegroundColor Yellow

  try {
    $resp = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 8 -SkipHttpErrorCheck
    $status = [int]$resp.StatusCode

    if ($status -ge 200 -and $status -lt 300) {
      Write-Host "OK: reachable (Status: $status)" -ForegroundColor Green
      return
    }

    if ($status -ge 400 -and $status -lt 500) {
      # 401/403/429 etc: le serveur répond -> reachable, mais pas forcément OK côté auth.
      Write-Host "WARN: reachable but returned $status" -ForegroundColor Yellow
      return
    }

    throw "Unhealthy HTTP status: $status"
  } catch {
    if ($IsOptional) {
      Write-Host "WARN: not reachable (optional)" -ForegroundColor Yellow
      Write-Host "  $($_.Exception.Message)" -ForegroundColor DarkGray
      return
    }

    throw "API not reachable: $healthUrl :: $($_.Exception.Message)"
  }
}

# Background mode: spawn a detached run and exit immediately
if ($Background) {
  $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $logDir = Join-Path $repoRoot ".logs\\verify"
  New-Directory $logDir
  $logOutFile = Join-Path $logDir "verify_$timestamp.out.log"
  $logErrFile = Join-Path $logDir "verify_$timestamp.err.log"

  $procArgs = @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", (Join-Path $PSScriptRoot "verify-all.ps1")
  )

  # Forward selected switches (except -Background)
  if ($SkipWeb) { $procArgs += "-SkipWeb" }
  if ($SkipBackend) { $procArgs += "-SkipBackend" }
  if ($SkipMobile) { $procArgs += "-SkipMobile" }
  if ($SkipApiConnectivity) { $procArgs += "-SkipApiConnectivity" }
  if ($SkipAuthFlow) { $procArgs += "-SkipAuthFlow" }
  if ($BuildApk) { $procArgs += "-BuildApk" }

  $proc = Start-Process -FilePath "pwsh" -ArgumentList $procArgs -NoNewWindow -PassThru -RedirectStandardOutput $logOutFile -RedirectStandardError $logErrFile

  Write-Host "Started background verification." -ForegroundColor Green
  Write-Host "PID: $($proc.Id)"
  Write-Host "Stdout: $logOutFile"
  Write-Host "Stderr: $logErrFile"
  exit 0
}

# Foreground run
$start = Get-Date

Write-Section "SUPFile - Verification Script"
Write-Host "Started: $start" -ForegroundColor Gray
Write-Host "Repo:    $repoRoot" -ForegroundColor Gray

$failedSteps = New-Object System.Collections.Generic.List[string]

# 1) API connectivity quick check
if (-not $SkipApiConnectivity) {
  try {
    Write-Section "API Connectivity"
    # Fly.io est le backend attendu en prod
    Test-ApiHealth "https://supfile.fly.dev"

    # Local est optionnel (utile si backend lancé en local)
    Test-ApiHealth "http://localhost:5000" -IsOptional
    Test-ApiHealth "http://127.0.0.1:5000" -IsOptional
  } catch {
    $failedSteps.Add("API Connectivity")
    Write-Host "FAILED: API Connectivity" -ForegroundColor Red
    Write-Host $_ -ForegroundColor Red
  }
}

# 2) Auth flow test (creates a user on prod by default)
if (-not $SkipAuthFlow) {
  try {
    Write-Section "Auth Flow (fly.io)"
    Exec "Auth flow script" "pwsh -NoProfile -ExecutionPolicy Bypass -File .\\test-auth-flow.ps1" $repoRoot
  } catch {
    $failedSteps.Add("Auth Flow")
    Write-Host "FAILED: Auth Flow" -ForegroundColor Red
    Write-Host $_ -ForegroundColor Red
  }
} else {
  Write-Host "Skipping auth flow test (-SkipAuthFlow)." -ForegroundColor Gray
}

# 3) Backend tests
if (-not $SkipBackend) {
  try {
    Write-Section "Backend"
    Exec "Backend unit tests" "npm test" (Join-Path $repoRoot "backend")
  } catch {
    $failedSteps.Add("Backend")
    Write-Host "FAILED: Backend" -ForegroundColor Red
    Write-Host $_ -ForegroundColor Red
  }
}

# 4) Web build
if (-not $SkipWeb) {
  try {
    Write-Section "Frontend Web"
    Exec "Web production build" "npm run build" (Join-Path $repoRoot "frontend-web")
  } catch {
    $failedSteps.Add("Frontend Web")
    Write-Host "FAILED: Frontend Web" -ForegroundColor Red
    Write-Host $_ -ForegroundColor Red
  }
}

# 5) Mobile checks
if (-not $SkipMobile) {
  try {
    Write-Section "Mobile (Flutter)"
    Exec "Flutter analyze" "flutter analyze" (Join-Path $repoRoot "mobile-app")
    Exec "Flutter tests" "flutter test" (Join-Path $repoRoot "mobile-app")

    if ($BuildApk) {
      Exec "Flutter build APK (release)" "flutter build apk --release" (Join-Path $repoRoot "mobile-app")
    } else {
      Write-Host "Skipping APK build (use -BuildApk)." -ForegroundColor Gray
    }
  } catch {
    $failedSteps.Add("Mobile")
    Write-Host "FAILED: Mobile" -ForegroundColor Red
    Write-Host $_ -ForegroundColor Red
  }
}

$end = Get-Date
$duration = New-TimeSpan -Start $start -End $end

Write-Section "Summary"
Write-Host "Ended:    $end" -ForegroundColor Gray
Write-Host "Duration: $($duration.ToString())" -ForegroundColor Gray

if ($failedSteps.Count -eq 0) {
  Write-Host "SUCCESS: All verification steps passed." -ForegroundColor Green
  exit 0
}

Write-Host "FAILED: Some steps failed:" -ForegroundColor Red
$failedSteps | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
exit 1
