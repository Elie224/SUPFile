# Build du frontend SUPFile (Vite)
# À exécuter depuis la racine du projet : .\scripts\build-frontend.ps1
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location -Path (Join-Path $repoRoot 'frontend-web')
npm run build
