#!/bin/bash

# Script pour construire et déployer l'APK avec API locale

echo "==================================="
echo "SUPFile Mobile - Build Local API"
echo "==================================="
echo ""

API_URL="${1:-http://192.168.1.100:5000}"

echo "API URL: $API_URL"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../mobile-app" || exit

echo "Nettoyage du projet..."
flutter clean

echo "Installation des dépendances..."
flutter pub get

echo ""
echo "Compilation de l'APK avec API_URL=$API_URL"
flutter build apk --debug \
  --dart-define=API_URL="$API_URL"

echo ""
echo "✓ APK compilé avec succès!"
echo "Chemin: build/app/outputs/flutter-apk/app-debug.apk"
echo ""
echo "Pour installer sur un appareil:"
echo "  flutter install"
