# Script pour corriger les problèmes de verrouillage Gradle sous Windows

Write-Host "🔧 Correction du problème de verrouillage Gradle..." -ForegroundColor Cyan
Write-Host ""

# 1. Arrêter tous les processus Gradle/Java en cours
Write-Host "1️⃣ Arrêt des processus Gradle/Java..." -ForegroundColor Yellow
$gradleProcesses = Get-Process -Name "java","gradle","gradlew" -ErrorAction SilentlyContinue
if ($gradleProcesses) {
    $gradleProcesses | ForEach-Object {
        Write-Host "   Arrêt du processus: $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Processus arrêtés" -ForegroundColor Green
} else {
    Write-Host "   ✅ Aucun processus Gradle trouvé" -ForegroundColor Green
}

# 2. Supprimer le fichier de verrouillage Gradle
Write-Host ""
Write-Host "2️⃣ Suppression des fichiers de verrouillage..." -ForegroundColor Yellow
$gradleDir = "$env:USERPROFILE\.gradle"
$wrapperDir = "$gradleDir\wrapper\dists"

if (Test-Path $wrapperDir) {
    # Chercher les fichiers .zip.lock ou .lock
    $lockFiles = Get-ChildItem -Path $wrapperDir -Recurse -Filter "*.lock" -ErrorAction SilentlyContinue
    if ($lockFiles) {
        $lockFiles | ForEach-Object {
            Write-Host "   Suppression: $($_.FullName)" -ForegroundColor Gray
            Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
        }
        Write-Host "   ✅ Fichiers de verrouillage supprimés" -ForegroundColor Green
    } else {
        Write-Host "   ✅ Aucun fichier de verrouillage trouvé" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠️ Dossier Gradle wrapper non trouvé: $wrapperDir" -ForegroundColor Yellow
}

# 3. Nettoyer le cache Gradle si nécessaire (optionnel)
Write-Host ""
$cleanCache = Read-Host "Voulez-vous nettoyer le cache Gradle ? (o/N)"
if ($cleanCache -eq "o" -or $cleanCache -eq "O") {
    Write-Host "3️⃣ Nettoyage du cache Gradle..." -ForegroundColor Yellow
    $cacheDir = "$gradleDir\caches"
    if (Test-Path $cacheDir) {
        # Supprimer seulement les caches temporaires, pas tout
        $tempDirs = @("$cacheDir\tmp", "$cacheDir\.tmp")
        foreach ($dir in $tempDirs) {
            if (Test-Path $dir) {
                Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "   Suppression: $dir" -ForegroundColor Gray
            }
        }
        Write-Host "   ✅ Cache temporaire nettoyé" -ForegroundColor Green
    }
}

# 4. Nettoyer le projet Flutter
Write-Host ""
Write-Host "4️⃣ Nettoyage du projet Flutter..." -ForegroundColor Yellow
flutter clean
Write-Host "   ✅ Projet nettoyé" -ForegroundColor Green

# 5. Récupérer les dépendances
Write-Host ""
Write-Host "5️⃣ Récupération des dépendances..." -ForegroundColor Yellow
flutter pub get
Write-Host "   ✅ Dépendances récupérées" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Correction terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "Vous pouvez maintenant relancer le build :" -ForegroundColor Cyan
Write-Host "   flutter build apk --release" -ForegroundColor White
Write-Host ""
