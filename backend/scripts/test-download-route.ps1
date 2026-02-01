# Test de la route GET /api/folders/:id/download
# Usage:
#   .\test-download-route.ps1
# Variables d'environnement (optionnelles):
#   $env:API_URL           = "https://supfile.fly.dev"
#   $env:TEST_FOLDER_ID    = "ID_24_CARACTERES"
#   $env:TEST_ACCESS_TOKEN = "JWT_TOKEN"

$baseUrl = if ($env:API_URL) { $env:API_URL.TrimEnd('/') } else { "https://supfile.fly.dev" }
$folderId = if ($env:TEST_FOLDER_ID) { $env:TEST_FOLDER_ID } else { "000000000000000000000001" }
$token = $env:TEST_ACCESS_TOKEN

$url = "$baseUrl/api/folders/$([System.Uri]::EscapeDataString($folderId))/download"
$headers = @{}
if ($token) { $headers["Authorization"] = "Bearer $token" }

Write-Host "--- Test route GET /api/folders/:id/download ---" -ForegroundColor Cyan
Write-Host "URL: $url"
Write-Host "Folder ID: $folderId"
Write-Host "Token fourni: $($token -ne '')"
Write-Host ""

try {
  $response = Invoke-WebRequest -Uri $url -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
  Write-Host "Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
  Write-Host "Content-Type: $($response.Headers['Content-Type'])"
  Write-Host "Access-Control-Allow-Origin: $($response.Headers['Access-Control-Allow-Origin'])"
  Write-Host "Body length: $($response.Content.Length) bytes"
} catch {
  $statusCode = $_.Exception.Response.StatusCode.value__
  Write-Host "Status: $statusCode" -ForegroundColor Yellow
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $reader.BaseStream.Position = 0
    $body = $reader.ReadToEnd()
    Write-Host "Body: $body"
  }
  Write-Host "Erreur: $($_.Exception.Message)"
}
