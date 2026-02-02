# Runs the deep integration smoke test.
# Prereqs:
#   - A device/emulator connected: `flutter devices`
#   - Env vars set (do NOT hardcode credentials in files):
#       $env:SUPFILE_EMAIL="user@example.com"
#       $env:SUPFILE_PASSWORD="..."
#     Optional (if 2FA enabled):
#       $env:SUPFILE_2FA_CODE="123456"

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $env:SUPFILE_EMAIL -or -not $env:SUPFILE_PASSWORD) {
  Write-Error "Missing SUPFILE_EMAIL or SUPFILE_PASSWORD env vars."
}

flutter test integration_test/deep_app_smoke_test.dart
