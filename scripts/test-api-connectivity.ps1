# Test API Connectivity Script

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

Write-Host "========================================"
Write-Host "Test API Connectivity"
Write-Host "========================================"
Write-Host ""

# Test URLs
$apiUrls = @(
    "https://supfile.fly.dev",
    "http://localhost:5000",
    "http://127.0.0.1:5000"
)

foreach ($url in $apiUrls) {
    Write-Host "Testing: $url"
    try {
        $response = Invoke-WebRequest -Uri "$url/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-Host "OK: $url is accessible (Status: $($response.StatusCode))"
        Write-Host "  Response: $($response.Content)"
    } catch {
        Write-Host "FAIL: $url is NOT accessible"
        Write-Host "  Error: $($_.Exception.Message)"
    }
    Write-Host ""
}

Write-Host "========================================"
Write-Host "Test Complete"
Write-Host "========================================"
Write-Host ""
Write-Host "INFO: If local testing needed, run:"
Write-Host "  cd backend"
Write-Host "  npm install"
Write-Host "  npm start"
Write-Host ""
