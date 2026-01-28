# Script PowerShell pour builder l'APK SUPFile Release
# Trouve automatiquement Flutter et exécute le build

Write-Host "`n=== BUILD APK RELEASE - SUPFILE ===" -ForegroundColor Cyan
Write-Host ""

# Fonction pour trouver Flutter
function Find-Flutter {
    # 1. Vérifier dans le PATH
    try {
        $flutterTest = Get-Command flutter -ErrorAction SilentlyContinue
        if ($flutterTest) {
            Write-Host "✅ Flutter trouvé dans le PATH" -ForegroundColor Green
            return "flutter"
        }
    } catch {
        # Continue
    }
    
    # 2. Emplacements communs sur Windows
    $commonPaths = @(
        "C:\src\flutter\bin\flutter.bat",
        "C:\flutter\bin\flutter.bat",
        "$env:USERPROFILE\flutter\bin\flutter.bat",
        "$env:LOCALAPPDATA\flutter\bin\flutter.bat",
        "$env:ProgramFiles\flutter\bin\flutter.bat"
    )
    
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            Write-Host "✅ Flutter trouvé : $path" -ForegroundColor Green
            return $path
        }
    }
    
    # 3. Chercher dans les variables d'environnement
    $flutterHome = $env:FLUTTER_HOME
    if ($flutterHome) {
        $flutterPath = Join-Path $flutterHome "bin\flutter.bat"
        if (Test-Path $flutterPath) {
            Write-Host "✅ Flutter trouvé via FLUTTER_HOME : $flutterPath" -ForegroundColor Green
            return $flutterPath
        }
    }
    
    # 4. Chercher récursivement dans Program Files (dernier recours)
    Write-Host "🔍 Recherche de Flutter dans Program Files..." -ForegroundColor Yellow
    $programFiles = @("$env:ProgramFiles", "${env:ProgramFiles(x86)}")
    foreach ($pf in $programFiles) {
        if (Test-Path $pf) {
            $flutterFound = Get-ChildItem -Path $pf -Recurse -Filter "flutter.bat" -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($flutterFound) {
                Write-Host "✅ Flutter trouvé : $($flutterFound.FullName)" -ForegroundColor Green
                return $flutterFound.FullName
            }
        }
    }
    
    return $null
}

# Trouver Flutter
$flutterCmd = Find-Flutter

if (-not $flutterCmd) {
    Write-Host "❌ Erreur: Flutter n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Solutions:" -ForegroundColor Yellow
    Write-Host "   1. Installez Flutter depuis: https://docs.flutter.dev/get-started/install/windows" -ForegroundColor Cyan
    Write-Host "   2. Ajoutez Flutter au PATH système:" -ForegroundColor Cyan
    Write-Host "      - Ouvrez 'Variables d'environnement' dans Windows" -ForegroundColor Gray
    Write-Host "      - Ajoutez le chemin vers flutter\bin au PATH" -ForegroundColor Gray
    Write-Host "      - Redémarrez le terminal" -ForegroundColor Gray
    Write-Host "   3. Ou définissez FLUTTER_HOME dans les variables d'environnement" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Tester que Flutter fonctionne
Write-Host "🧪 Test de Flutter..." -ForegroundColor Cyan
try {
    if ($flutterCmd -eq "flutter") {
        $testResult = & flutter --version 2>&1 | Select-Object -First 1
    } else {
        $testResult = & $flutterCmd --version 2>&1 | Select-Object -First 1
    }
    if ($LASTEXITCODE -ne 0 -and $testResult -notmatch "Flutter") {
        throw "Flutter ne répond pas correctement"
    }
    Write-Host "   $testResult" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur: Flutter ne fonctionne pas correctement" -ForegroundColor Red
    Write-Host "   Chemin testé: $flutterCmd" -ForegroundColor Yellow
    exit 1
}

# Vérifier que nous sommes dans le bon répertoire
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if (-not (Test-Path "pubspec.yaml")) {
    Write-Host "❌ Erreur: Le fichier 'pubspec.yaml' n'existe pas." -ForegroundColor Red
    Write-Host "   Assurez-vous d'être dans le répertoire mobile-app." -ForegroundColor Yellow
    exit 1
}

Write-Host "📁 Répertoire de travail: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""

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
        Write-Host "   Suppression des fichiers de verrouillage Gradle..." -ForegroundColor Yellow
        $lockFiles | ForEach-Object {
            Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
        }
    }
}

# Fonction pour exécuter une commande Flutter
function Invoke-Flutter {
    param([string]$Command)
    
    if ($flutterCmd -eq "flutter") {
        Invoke-Expression "flutter $Command"
    } else {
        & $flutterCmd $Command.Split(' ')
    }
}

# Nettoyer
Write-Host "🧹 Nettoyage du projet..." -ForegroundColor Cyan
Invoke-Flutter "clean"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du nettoyage" -ForegroundColor Red
    exit 1
}

# Récupérer les dépendances
Write-Host "📦 Récupération des dépendances..." -ForegroundColor Cyan
Invoke-Flutter "pub get"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la récupération des dépendances" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🏗️  Build APK Release..." -ForegroundColor Cyan
Write-Host "   (Cela peut prendre plusieurs minutes...)" -ForegroundColor Yellow
Write-Host ""

# Build APK Release
Invoke-Flutter "build apk --release"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Erreur lors de la génération de l'APK" -ForegroundColor Red
    Write-Host "Vérifiez les erreurs ci-dessus" -ForegroundColor Yellow
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
    Write-Host "📱 Pour installer sur un appareil Android:" -ForegroundColor Cyan
    Write-Host "   adb install `"$fullPath`"" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Ou transférez le fichier sur votre téléphone et installez-le manuellement" -ForegroundColor Gray
    Write-Host ""
    
    # Ouvrir le dossier
    $folderPath = (Resolve-Path "build/app/outputs/flutter-apk").Path
    Write-Host "📂 Ouverture du dossier contenant l'APK..." -ForegroundColor Cyan
    Start-Process explorer.exe -ArgumentList $folderPath
    
    Write-Host ""
    Write-Host "🎉 Build terminé avec succès !" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Erreur: L'APK n'a pas été généré" -ForegroundColor Red
    Write-Host "Vérifiez les erreurs ci-dessus" -ForegroundColor Yellow
    exit 1
}
