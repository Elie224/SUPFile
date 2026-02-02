# Script pour construire l'APK mobile avec une URL API personnalisée

param(
    [string]$ApiUrl = "http://192.168.1.100:5000"
)

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "SUPFile Mobile - Build avec API personnalisée" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API URL: $ApiUrl" -ForegroundColor Green
Write-Host ""

$mobileAppPath = Join-Path $PSScriptRoot "mobile-app"
Set-Location $mobileAppPath

Write-Host "Nettoyage du projet..." -ForegroundColor Yellow
flutter clean

Write-Host "Installation des dépendances..." -ForegroundColor Yellow
flutter pub get

Write-Host ""
Write-Host "Compilation de l'APK..." -ForegroundColor Cyan
flutter build apk --debug --dart-define="API_URL=$ApiUrl"

Write-Host ""
Write-Host "✓ APK compilé avec succès!" -ForegroundColor Green
Write-Host "Chemin: build\app\outputs\flutter-apk\app-debug.apk" -ForegroundColor Green
Write-Host ""
Write-Host "Pour installer sur un appareil:" -ForegroundColor Yellow
Write-Host "  flutter install" -ForegroundColor White
