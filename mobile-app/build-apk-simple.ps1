# Script PowerShell simplifié pour builder l'APK SUPFile
# Utilise le chemin complet de Flutter si nécessaire

Write-Host "`n=== BUILD APK RELEASE - SUPFILE ===" -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if (-not (Test-Path "pubspec.yaml")) {
    Write-Host "❌ Erreur: Le fichier 'pubspec.yaml' n'existe pas." -ForegroundColor Red
    Write-Host "   Assurez-vous d'être dans le répertoire mobile-app." -ForegroundColor Yellow
    exit 1
}

Write-Host "📁 Répertoire: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""

# Fonction pour trouver et tester Flutter
function Get-FlutterCommand {
    # 1. Essayer flutter directement (si dans PATH)
    try {
        $null = Get-Command flutter -ErrorAction Stop
        $test = flutter --version 2>&1 | Select-Object -First 1
        if ($test -match "Flutter") {
            Write-Host "✅ Flutter trouvé dans le PATH" -ForegroundColor Green
            return "flutter"
        }
    } catch {
        # Continue
    }
    
    # 2. Emplacements communs
    $paths = @(
        "C:\src\flutter\bin\flutter.bat",
        "C:\flutter\bin\flutter.bat",
        "$env:USERPROFILE\flutter\bin\flutter.bat",
        "$env:LOCALAPPDATA\flutter\bin\flutter.bat"
    )
    
    foreach ($path in $paths) {
        if (Test-Path $path) {
            Write-Host "✅ Flutter trouvé : $path" -ForegroundColor Green
            return $path
        }
    }
    
    # 3. Via FLUTTER_HOME
    if ($env:FLUTTER_HOME) {
        $flutterPath = Join-Path $env:FLUTTER_HOME "bin\flutter.bat"
        if (Test-Path $flutterPath) {
            Write-Host "✅ Flutter trouvé via FLUTTER_HOME : $flutterPath" -ForegroundColor Green
            return $flutterPath
        }
    }
    
    return $null
}

# Trouver Flutter
$flutterCmd = Get-FlutterCommand

if (-not $flutterCmd) {
    Write-Host "❌ Flutter n'est pas trouvé !" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Solutions:" -ForegroundColor Yellow
    Write-Host "   1. Installez Flutter : https://docs.flutter.dev/get-started/install/windows" -ForegroundColor Cyan
    Write-Host "   2. Ajoutez Flutter au PATH système" -ForegroundColor Cyan
    Write-Host "   3. Ou indiquez le chemin de Flutter ci-dessous" -ForegroundColor Cyan
    Write-Host ""
    $customPath = Read-Host "Chemin vers flutter.bat (ou appuyez sur Entrée pour quitter)"
    
    if ([string]::IsNullOrWhiteSpace($customPath)) {
        Write-Host "❌ Build annulé" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Test-Path $customPath)) {
        Write-Host "❌ Le chemin spécifié n'existe pas : $customPath" -ForegroundColor Red
        exit 1
    }
    
    $flutterCmd = $customPath
    Write-Host "✅ Utilisation de : $flutterCmd" -ForegroundColor Green
}

Write-Host ""

# Nettoyer
Write-Host "🧹 Nettoyage..." -ForegroundColor Cyan
if ($flutterCmd -eq "flutter") {
    flutter clean
} else {
    & $flutterCmd clean
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du nettoyage" -ForegroundColor Red
    exit 1
}

# Récupérer les dépendances
Write-Host "📦 Récupération des dépendances..." -ForegroundColor Cyan
if ($flutterCmd -eq "flutter") {
    flutter pub get
} else {
    & $flutterCmd pub get
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la récupération des dépendances" -ForegroundColor Red
    exit 1
}

# Build APK
Write-Host ""
Write-Host "🏗️  Build APK Release..." -ForegroundColor Cyan
Write-Host "   (Cela peut prendre plusieurs minutes...)" -ForegroundColor Yellow
Write-Host ""

if ($flutterCmd -eq "flutter") {
    flutter build apk --release
} else {
    & $flutterCmd build apk --release
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Erreur lors du build" -ForegroundColor Red
    exit 1
}

# Vérifier le résultat
$apkPath = "build/app/outputs/flutter-apk/app-release.apk"
if (Test-Path $apkPath) {
    $apkFile = Get-Item $apkPath
    $size = $apkFile.Length / 1MB
    $fullPath = $apkFile.FullName
    
    Write-Host ""
    Write-Host "✅ APK généré avec succès !" -ForegroundColor Green
    Write-Host "📍 Chemin: $fullPath" -ForegroundColor Yellow
    Write-Host "📊 Taille: $([math]::Round($size, 2)) MB" -ForegroundColor Yellow
    Write-Host ""
    
    # Ouvrir le dossier
    $folderPath = (Resolve-Path "build/app/outputs/flutter-apk").Path
    Start-Process explorer.exe -ArgumentList $folderPath
    
    Write-Host "🎉 Terminé !" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ L'APK n'a pas été généré" -ForegroundColor Red
    exit 1
}
