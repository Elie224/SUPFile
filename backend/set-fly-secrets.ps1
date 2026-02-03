param(
  [Parameter(Mandatory=$false)][string]$AppName = "supfile"
)

Write-Host "Set Fly.io secrets for $AppName (no secrets are stored in this script)." -ForegroundColor Cyan

$mongoUri = Read-Host "MONGO_URI (mongodb://[REDACTED] ou mongodb+srv://[REDACTED]"
if ([string]::IsNullOrWhiteSpace($mongoUri)) { throw "MONGO_URI is required" }

$jwtSecret = Read-Host "JWT_SECRET (>= 32 chars)"
if ([string]::IsNullOrWhiteSpace($jwtSecret)) { throw "JWT_SECRET is required" }

$sessionSecret = Read-Host "SESSION_SECRET (>= 32 chars)"
if ([string]::IsNullOrWhiteSpace($sessionSecret)) { throw "SESSION_SECRET is required" }

flyctl secrets set --app $AppName "MONGO_URI=[REDACTED]"
flyctl secrets set --app $AppName "JWT_SECRET=[REDACTED]"
flyctl secrets set --app $AppName "SESSION_SECRET=[REDACTED]"

Write-Host "Done." -ForegroundColor Green
