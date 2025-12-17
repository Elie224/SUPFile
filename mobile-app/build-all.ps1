# Script de build automatique pour SUPFile Mobile
# Usage: .\build-all.ps1

param(
    [string]$ApiUrl = "http://localhost:5000",
    [switch]$Android = $true,
    [switch]$Web = $true,
    [switch]$Clean = $true
)

Write-Host "SUPFile Mobile - Build de Production" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Afficher la configuration
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "   API URL: $ApiUrl" -ForegroundColor White
Write-Host "   Build Android: $Android" -ForegroundColor White
Write-Host "   Build Web: $Web" -ForegroundColor White
Write-Host "   Clean: $Clean" -ForegroundColor White
Write-Host ""

# Nettoyer si demandé
if ($Clean) {
    Write-Host "Nettoyage des builds precedents..." -ForegroundColor Yellow
    flutter clean
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur lors du nettoyage" -ForegroundColor Red
        exit 1
    }
    Write-Host "Nettoyage termine" -ForegroundColor Green
    Write-Host ""
}

# Récupérer les dépendances
Write-Host "Installation des dependances..." -ForegroundColor Yellow
flutter pub get
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de l'installation des dependances" -ForegroundColor Red
    exit 1
}
Write-Host "Dependances installees" -ForegroundColor Green
Write-Host ""

# Build Android
if ($Android) {
    Write-Host "Build Android APK (Release)..." -ForegroundColor Yellow
    flutter build apk --release --dart-define=API_URL=$ApiUrl
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur lors du build Android" -ForegroundColor Red
        exit 1
    }
    
    $apkPath = "build/app/outputs/flutter-apk/app-release.apk"
    if (Test-Path $apkPath) {
        $apkSize = (Get-Item $apkPath).Length / 1MB
        Write-Host "Build Android termine" -ForegroundColor Green
        Write-Host "   Fichier: $apkPath" -ForegroundColor Cyan
        Write-Host "   Taille: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
    }
    Write-Host ""
}

# Build Web
if ($Web) {
    Write-Host "Build Web (Release)..." -ForegroundColor Yellow
    flutter build web --release --dart-define=API_URL=$ApiUrl
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur lors du build Web" -ForegroundColor Red
        exit 1
    }
    
    $webPath = "build/web"
    if (Test-Path $webPath) {
        Write-Host "Build Web termine" -ForegroundColor Green
        Write-Host "   Dossier: $webPath" -ForegroundColor Cyan
        Write-Host "   Pour servir: cd build/web; python -m http.server 8080" -ForegroundColor Cyan
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "Tous les builds sont termines !" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
if ($Android) {
    Write-Host "   1. Transferez l'APK sur votre appareil Android" -ForegroundColor White
    Write-Host "   2. Installez l'APK (activez Sources inconnues)" -ForegroundColor White
}
if ($Web) {
    Write-Host "   3. Servez le dossier build/web avec un serveur HTTP" -ForegroundColor White
    Write-Host "   4. Ouvrez http://localhost:8080 dans votre navigateur" -ForegroundColor White
}
Write-Host ""
