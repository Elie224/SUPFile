# Script pour configurer SESSION_SECRET manuellement

$flyctlPath = Join-Path $env:USERPROFILE ".fly\bin\flyctl.exe"
$targetApp = "backend-sparkling-sun-1539"
$envFile = Join-Path $PSScriptRoot ".env"

Write-Host ""
Write-Host "Configuration de SESSION_SECRET..." -ForegroundColor Yellow

# Lire JWT_SECRET depuis .env
$jwtSecret = $null
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*JWT_SECRET\s*=\s*(.+)$' -and -not $_.Trim().StartsWith('#')) {
        $jwtSecret = $matches[1].Trim()
    }
}

if (-not $jwtSecret) {
    Write-Host "ERREUR: JWT_SECRET non trouve dans .env" -ForegroundColor Red
    exit 1
}

$sessionSecret = $jwtSecret + "_session"
Write-Host "   Valeur: $($sessionSecret.Substring(0, [Math]::Min(30, $sessionSecret.Length)))..." -ForegroundColor Gray

# Configurer le secret
$result = & $flyctlPath secrets set --app $targetApp "SESSION_SECRET=[REDACTED]" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   OK: SESSION_SECRET configure" -ForegroundColor Green
} else {
    Write-Host "   ERREUR: Impossible de configurer SESSION_SECRET" -ForegroundColor Red
    Write-Host "   Message: $result" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Termine !" -ForegroundColor Green
Write-Host ""
