# Script PowerShell pour builder l'APK SUPFile

Write-Host "🚀 Build APK SUPFile" -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "pubspec.yaml")) {
    Write-Host "❌ Erreur: Ce script doit être exécuté depuis le dossier mobile-app/" -ForegroundColor Red
    exit 1
}

# Arrêter les processus Gradle qui pourraient bloquer
Write-Host "🔧 Vérification des processus Gradle..." -ForegroundColor Cyan
$gradleProcesses = Get-Process -Name "java","gradle","gradlew" -ErrorAction SilentlyContinue
if ($gradleProcesses) {
    Write-Host "   Arrêt des processus Gradle bloquants..." -ForegroundColor Yellow
    $gradleProcesses | ForEach-Object {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

# Supprimer les fichiers de verrouillage Gradle
$gradleWrapperDir = "$env:USERPROFILE\.gradle\wrapper\dists"
if (Test-Path $gradleWrapperDir) {
    $lockFiles = Get-ChildItem -Path $gradleWrapperDir -Recurse -Filter "*.lock" -ErrorAction SilentlyContinue
    if ($lockFiles) {
        $lockFiles | ForEach-Object {
            Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
        }
    }
}

# Nettoyer
Write-Host "🧹 Nettoyage..." -ForegroundColor Cyan
flutter clean

# Récupérer les dépendances
Write-Host "📦 Récupération des dépendances..." -ForegroundColor Cyan
flutter pub get

# Vérifier Flutter
Write-Host "🔍 Vérification Flutter..." -ForegroundColor Cyan
flutter doctor

Write-Host ""
Write-Host "🏗️ Build APK Release..." -ForegroundColor Cyan
flutter build apk --release

# Vérifier le résultat
$apkPath = "build/app/outputs/flutter-apk/app-release.apk"
if (Test-Path $apkPath) {
    $size = (Get-Item $apkPath).Length / 1MB
    Write-Host ""
    Write-Host "✅ APK généré avec succès !" -ForegroundColor Green
    Write-Host "📍 Chemin: $apkPath" -ForegroundColor Yellow
    Write-Host "📊 Taille: $([math]::Round($size, 2)) MB" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📱 Pour installer sur un appareil:" -ForegroundColor Cyan
    Write-Host "   adb install $apkPath" -ForegroundColor Gray
    Write-Host ""
    
    # Ouvrir le dossier
    $folderPath = (Resolve-Path "build/app/outputs/flutter-apk").Path
    Start-Process explorer.exe -ArgumentList $folderPath
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de la génération de l'APK" -ForegroundColor Red
    Write-Host "Vérifiez les erreurs ci-dessus" -ForegroundColor Yellow
    exit 1
}