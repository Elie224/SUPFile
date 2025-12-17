# Script PowerShell pour démarrer l'application mobile SUPFile
Write-Host "`n=== DÉMARRAGE DE L'APPLICATION MOBILE SUPFILE ===" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Flutter est installé
try {
    $flutterVersion = flutter --version 2>&1 | Select-Object -First 1
    Write-Host "✅ Flutter détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: Flutter n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "   Installez Flutter depuis: https://docs.flutter.dev/get-started/install/windows" -ForegroundColor Yellow
    exit 1
}

# Vérifier qu'on est dans le bon répertoire
if (-not (Test-Path "pubspec.yaml")) {
    Write-Host "❌ Erreur: Le fichier 'pubspec.yaml' n'existe pas." -ForegroundColor Red
    Write-Host "   Assurez-vous d'être dans le répertoire mobile-app." -ForegroundColor Yellow
    exit 1
}

# Vérifier que les dépendances sont installées
if (-not (Test-Path "pubspec.lock")) {
    Write-Host "⚠️  Installation des dépendances Flutter..." -ForegroundColor Yellow
    flutter pub get
    Write-Host ""
}

# Vérifier que le backend est accessible
Write-Host "Vérification du backend..." -ForegroundColor Cyan
try {
    $backendCheck = Test-NetConnection -ComputerName localhost -Port 5000 -WarningAction SilentlyContinue
    if ($backendCheck.TcpTestSucceeded) {
        Write-Host "✅ Backend accessible sur http://localhost:5000" -ForegroundColor Green
    } else {
        Write-Host "⚠️  ATTENTION: Le backend n'est pas accessible sur http://localhost:5000" -ForegroundColor Yellow
        Write-Host "   Démarrez le backend dans un autre terminal avec:" -ForegroundColor Yellow
        Write-Host "   cd ..\backend" -ForegroundColor Cyan
        Write-Host "   npm run dev" -ForegroundColor Cyan
        Write-Host ""
        $continue = Read-Host "Voulez-vous continuer quand même ? (O/N)"
        if ($continue -ne "O" -and $continue -ne "o") {
            exit 1
        }
    }
} catch {
    Write-Host "⚠️  Impossible de vérifier le backend" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== LANCEMENT DE L'APPLICATION MOBILE ===" -ForegroundColor Cyan
Write-Host "L'application va démarrer dans Chrome" -ForegroundColor Yellow
Write-Host "URL de l'API: http://localhost:5000" -ForegroundColor Yellow
Write-Host "Appuyez sur Ctrl+C pour arrêter`n" -ForegroundColor Yellow

# Lancer l'application Flutter
flutter run -d chrome --dart-define=API_URL=http://localhost:5000




