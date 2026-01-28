# Script pour tester directement la route de téléchargement
param(
    [string]$appName = "supfile",
    [string]$folderId = "694318b012a0626255de2f81"
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TEST ROUTE DOWNLOAD FOLDER" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

Write-Host "`n[*] Test de la route: GET /api/folders/$folderId/download" -ForegroundColor Yellow
Write-Host "[*] URL: https://supfile.fly.dev/api/folders/$folderId/download" -ForegroundColor Yellow

# Test avec curl
Write-Host "`n[1] Test avec curl (HEAD request pour voir les headers)..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://supfile.fly.dev/api/folders/$folderId/download" -Method HEAD -UseBasicParsing -ErrorAction Stop
    Write-Host "[OK] Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Headers:" -ForegroundColor White
    $response.Headers | Format-List
} catch {
    Write-Host "[ERREUR] Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    
    # Essayer de récupérer le body de l'erreur
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    } catch {
        Write-Host "Impossible de lire le body de l'erreur" -ForegroundColor Yellow
    }
}

Write-Host "`n[2] Test avec GET (sans token, devrait retourner 403 ou 404)..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://supfile.fly.dev/api/folders/$folderId/download" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "[OK] Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "[ERREUR] Status: $statusCode" -ForegroundColor Red
    
    if ($statusCode -eq 404) {
        Write-Host "[INFO] 404 = Route non trouvee OU dossier non trouve dans la DB" -ForegroundColor Yellow
    } elseif ($statusCode -eq 403) {
        Write-Host "[INFO] 403 = Route trouvee mais acces refuse (normal sans token)" -ForegroundColor Yellow
    } elseif ($statusCode -eq 400) {
        Write-Host "[INFO] 400 = Route trouvee mais ID invalide" -ForegroundColor Yellow
    }
    
    # Essayer de récupérer le body de l'erreur
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    } catch {
        Write-Host "Impossible de lire le body de l'erreur" -ForegroundColor Yellow
    }
}

Write-Host "`n[3] Test de la route health pour verifier que le backend repond..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-WebRequest -Uri "https://supfile.fly.dev/health" -UseBasicParsing
    Write-Host "[OK] Backend repond: $($healthResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Content: $($healthResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "[ERREUR] Backend ne repond pas!" -ForegroundColor Red
}

Write-Host "`n============================================================" -ForegroundColor Gray
Write-Host "[*] Maintenant, testez le telechargement depuis le frontend" -ForegroundColor Cyan
Write-Host "[*] Puis executez: .\voir-logs-download-detaille.ps1" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray
