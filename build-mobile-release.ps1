# Script pour construire l'APK mobile RELEASE avec une URL API (prod par défaut)
# À exécuter depuis la racine du projet : .\build-mobile-release.ps1

param(
    [string]$ApiUrl = "https://supfile.fly.dev"
)

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "SUPFile Mobile - Build RELEASE" -ForegroundColor Cyan
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
Write-Host "Compilation de l'APK (release)..." -ForegroundColor Cyan
flutter build apk --release --dart-define="API_URL=$ApiUrl"

Write-Host ""
Write-Host "✓ APK RELEASE compilé avec succès!" -ForegroundColor Green
Write-Host "Chemin: build\app\outputs\flutter-apk\app-release.apk" -ForegroundColor Green
