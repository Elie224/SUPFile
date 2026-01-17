# Script PowerShell pour configurer l'admin sur MongoDB Atlas
# Usage: .\setAdmin-Atlas.ps1

Write-Host "🔧 Configuration Admin - MongoDB Atlas" -ForegroundColor Cyan
Write-Host ""

# Demander l'URI MongoDB Atlas
Write-Host "📋 Étape 1 : Récupérez votre MONGO_URI depuis Render" -ForegroundColor Yellow
Write-Host "   1. Allez sur https://dashboard.render.com/" -ForegroundColor Gray
Write-Host "   2. Ouvrez votre service 'supfile-backend'" -ForegroundColor Gray
Write-Host "   3. Allez dans l'onglet 'Environment'" -ForegroundColor Gray
Write-Host "   4. Copiez la valeur de MONGO_URI" -ForegroundColor Gray
Write-Host ""

$mongoUri = Read-Host "Collez votre MONGO_URI MongoDB Atlas (mongodb+srv://...)"

if ([string]::IsNullOrWhiteSpace($mongoUri)) {
    Write-Host "❌ MONGO_URI est requis" -ForegroundColor Red
    exit 1
}

# Vérifier le format
if (-not $mongoUri.StartsWith("mongodb://") -and -not $mongoUri.StartsWith("mongodb+srv://")) {
    Write-Host "⚠️  Avertissement: L'URI ne semble pas être un URI MongoDB valide" -ForegroundColor Yellow
    $confirm = Read-Host "Continuer quand même ? (O/N)"
    if ($confirm -ne "O" -and $confirm -ne "o") {
        exit 1
    }
}

Write-Host ""
Write-Host "🔄 Exécution du script setAdmin.js avec MONGO_URI Atlas..." -ForegroundColor Cyan
Write-Host ""

# Définir MONGO_URI comme variable d'environnement pour cette session
$env:MONGO_URI = $mongoUri

# Aller dans le dossier backend
Set-Location -Path $PSScriptRoot

# Exécuter le script Node.js
try {
    node scripts/setAdmin.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Admin configuré avec succès sur MongoDB Atlas !" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Prochaines étapes :" -ForegroundColor Yellow
        Write-Host "   1. Déconnectez-vous de l'application web" -ForegroundColor Gray
        Write-Host "   2. Reconnectez-vous avec kouroumaelisee@gmail.com" -ForegroundColor Gray
        Write-Host "   3. Le menu '⚙️ Administration' devrait apparaître" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Erreur lors de l'exécution du script" -ForegroundColor Red
        Write-Host "   Vérifiez votre MONGO_URI et que l'utilisateur existe" -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erreur : $_" -ForegroundColor Red
    exit 1
} finally {
    # Nettoyer la variable d'environnement
    Remove-Item Env:\MONGO_URI -ErrorAction SilentlyContinue
}
