param(
  [Parameter(Mandatory=$false)][string]$AppName = "supfile"
)

Write-Host "Configure secrets (simple) for $AppName" -ForegroundColor Cyan

$mongoUri = Read-Host "MONGO_URI"
$jwtSecret = Read-Host "JWT_SECRET"
$sessionSecret = Read-Host "SESSION_SECRET"

if ([string]::IsNullOrWhiteSpace($mongoUri) -or [string]::IsNullOrWhiteSpace($jwtSecret) -or [string]::IsNullOrWhiteSpace($sessionSecret)) {
  throw "MONGO_URI, JWT_SECRET, SESSION_SECRET are required"
}

flyctl secrets set --app $AppName "MONGO_URI=[REDACTED]"
flyctl secrets set --app $AppName "JWT_SECRET=[REDACTED]"
flyctl secrets set --app $AppName "SESSION_SECRET=[REDACTED]"

Write-Host "Done." -ForegroundColor Green
