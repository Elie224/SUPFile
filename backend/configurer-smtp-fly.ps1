# Configuration SMTP sur Fly.io pour l'envoi des emails de réinitialisation de mot de passe
# Modifiez les valeurs ci-dessous puis exécutez : .\configurer-smtp-fly.ps1

$ErrorActionPreference = "Stop"

# ========== À MODIFIER ==========
$SMTP_HOST = "smtp.gmail.com"
$SMTP_PORT = "587"
$SMTP_USER = "votre_email@gmail.com"      # Votre adresse Gmail
$SMTP_PASS="[REDACTED]"        # Mot de passe d'application Gmail (pas le mot de passe normal)
$SMTP_FROM = "SUPFile <votre_email@gmail.com>"
$FRONTEND_URL = "https://flourishing-banoffee-c0b1ad.netlify.app"
# =================================

Write-Host "Configuration SMTP sur Fly.io pour l'app 'supfile'..." -ForegroundColor Cyan
Write-Host ""

if ($SMTP_USER -eq "votre_email@gmail.com" -or $SMTP_PASS -eq "xxxx xxxx xxxx xxxx") {
    Write-Host "ERREUR : Modifiez SMTP_USER et SMTP_PASS dans ce script avant de l'exécuter." -ForegroundColor Red
    Write-Host "Pour Gmail : créez un mot de passe d'application sur https://myaccount.google.com/security" -ForegroundColor Yellow
    exit 1
}

Write-Host "Définition des secrets..." -ForegroundColor Green
flyctl secrets set SMTP_HOST=$SMTP_HOST -a supfile
flyctl secrets set SMTP_PORT=$SMTP_PORT -a supfile
flyctl secrets set SMTP_USER=$SMTP_USER -a supfile
flyctl secrets set "SMTP_PASS=[REDACTED]" -a supfile
flyctl secrets set "SMTP_FROM=$SMTP_FROM" -a supfile
flyctl secrets set FRONTEND_URL=$FRONTEND_URL -a supfile

Write-Host ""
Write-Host "Secrets définis. Redémarrage de l'app..." -ForegroundColor Green
flyctl apps restart supfile -a supfile

Write-Host ""
Write-Host "Configuration SMTP terminée." -ForegroundColor Green
Write-Host "Testez : allez sur la page 'Mot de passe oublié' et entrez votre email." -ForegroundColor Cyan
Write-Host "L'email sera envoyé à l'adresse que vous avez fournie." -ForegroundColor Cyan
