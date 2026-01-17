# Script pour configurer MongoDB de manière optimale pour le développement
Write-Host "`n=== CONFIGURATION MONGODB POUR SUPFILE ===" -ForegroundColor Cyan
Write-Host ""

# Vérifier si on est dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: Vous devez être dans le dossier backend" -ForegroundColor Red
    exit 1
}

# Vérifier MongoDB
Write-Host "Vérification de MongoDB..." -ForegroundColor Yellow
$mongoCheck = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue

if (-not $mongoCheck.TcpTestSucceeded) {
    Write-Host "❌ MongoDB n'est pas accessible sur localhost:27017" -ForegroundColor Red
    Write-Host ""
    Write-Host "Options pour démarrer MongoDB :" -ForegroundColor Yellow
    Write-Host "1. Service Windows : net start MongoDB" -ForegroundColor Cyan
    Write-Host "2. Docker : docker compose up -d db" -ForegroundColor Cyan
    Write-Host "3. Installer MongoDB localement" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "✅ MongoDB est accessible" -ForegroundColor Green
Write-Host ""

# Vérifier si .env existe
if (Test-Path ".env") {
    Write-Host "📄 Fichier .env trouvé" -ForegroundColor Green
    
    # Lire le contenu actuel
    $envContent = Get-Content .env -Raw
    
    # Vérifier MONGO_URI
    if ($envContent -match "MONGO_URI=[REDACTED]") {
        $currentUri = $matches[1].Trim()
        Write-Host "MONGO_URI actuel : $currentUri" -ForegroundColor Yellow
        
        # Recommander la meilleure configuration
        Write-Host ""
        Write-Host "💡 Configuration recommandée pour développement local :" -ForegroundColor Cyan
        Write-Host "   MONGO_URI=[REDACTED]" -ForegroundColor Green
        Write-Host ""
        
        $response = Read-Host "Voulez-vous utiliser cette configuration ? (O/N)"
        if ($response -eq "O" -or $response -eq "o" -or $response -eq "Y" -or $response -eq "y") {
            # Mettre à jour MONGO_URI
            $newContent = $envContent -replace "MONGO_URI=[REDACTED]", "MONGO_URI=[REDACTED]"
            Set-Content -Path .env -Value $newContent -NoNewline
            Write-Host "✅ Configuration mise à jour" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  MONGO_URI non trouvé dans .env" -ForegroundColor Yellow
        Write-Host "Ajout de la configuration recommandée..." -ForegroundColor Yellow
        
        $recommendedUri = "`nMONGO_URI=mongodb://[REDACTED]"
        Add-Content -Path .env -Value $recommendedUri
        Write-Host "✅ Configuration ajoutée" -ForegroundColor Green
    }
} else {
    Write-Host "📄 Création du fichier .env avec configuration optimale..." -ForegroundColor Yellow
    
    # Créer un .env avec les meilleures pratiques pour développement
    $envTemplate = @"
# Configuration MongoDB - Développement Local
MONGO_URI=[REDACTED]

# Configuration Serveur
SERVER_PORT=5000
SERVER_HOST=0.0.0.0
NODE_ENV=development

# JWT Secrets (Générer des secrets sécurisés en production)
JWT_SECRET=[REDACTED]
JWT_REFRESH_SECRET=[REDACTED]

# Upload
MAX_FILE_SIZE=32212254720
UPLOAD_DIR=./uploads

# CORS (Origines autorisées)
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://localhost:19000,exp://localhost:19000

# OAuth (Optionnel - Configurer si nécessaire)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=[REDACTED]
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=[REDACTED]
"@
    
    Set-Content -Path .env -Value $envTemplate
    Write-Host "✅ Fichier .env créé avec configuration optimale" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== TEST DE CONNEXION MONGODB ===" -ForegroundColor Cyan

# Tester la connexion avec Node.js
$testScript = @"
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://[REDACTED]';

console.log('🔄 Test de connexion à MongoDB...');
console.log('📍 URI:', uri.replace(/:[^:]*@/, ':****@'));

mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
})
.then(() => {
    console.log('✅ Connexion MongoDB réussie !');
    process.exit(0);
})
.catch((err) => {
    console.error('❌ Erreur de connexion:', err.message);
    console.error('');
    console.error('Vérifications :');
    console.error('1. MongoDB est-il démarré ?');
    console.error('2. Le port 27017 est-il accessible ?');
    console.error('3. L''URI de connexion est-elle correcte ?');
    process.exit(1);
});
"@

$testScript | Out-File -FilePath "test-mongo-connection.js" -Encoding UTF8

Write-Host "Exécution du test de connexion..." -ForegroundColor Yellow
node test-mongo-connection.js

$testResult = $LASTEXITCODE

# Nettoyer le fichier de test
Remove-Item "test-mongo-connection.js" -ErrorAction SilentlyContinue

if ($testResult -eq 0) {
    Write-Host ""
    Write-Host "✅ Configuration MongoDB optimale !" -ForegroundColor Green
    Write-Host "Vous pouvez maintenant démarrer le backend avec : npm run dev" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ La connexion MongoDB a échoué" -ForegroundColor Red
    Write-Host "Vérifiez que MongoDB est démarré et accessible" -ForegroundColor Yellow
}

Write-Host ""


