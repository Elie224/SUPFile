param(
  [Parameter(Mandatory=$false)][string]$AppName = "supfile"
)

Write-Host "Configure secrets (interactive) for $AppName" -ForegroundColor Cyan

$secrets = @{
  "MONGO_URI"      = (Read-Host "MONGO_URI")
  "JWT_SECRET"     = (Read-Host "JWT_SECRET")
  "SESSION_SECRET" = (Read-Host "SESSION_SECRET")
}

foreach ($k in $secrets.Keys) {
  if ([string]::IsNullOrWhiteSpace($secrets[$k])) { throw "$k is required" }
}

foreach ($k in $secrets.Keys) {
  flyctl secrets set --app $AppName "$k=$($secrets[$k])"
}

Write-Host "Done." -ForegroundColor Green
