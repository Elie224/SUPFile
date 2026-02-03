#!/bin/bash

# Script pour démarrer le stack SUPFile complet localement

echo "==================================="
echo "SUPFile - Stack Complet Local"
echo "==================================="
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

echo "✓ Node.js installé"

# Vérifier si MongoDB est en cours d'exécution
echo ""
echo "Vérification de MongoDB..."
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.version()" &>/dev/null; then
        echo "✓ MongoDB est en cours d'exécution"
    else
        echo "⚠️  MongoDB n'est pas en cours d'exécution"
        echo "   Démarrez MongoDB avec: mongod"
    fi
else
    echo "⚠️  MongoDB CLI n'est pas installé"
    echo "   Assurez-vous que MongoDB est en cours d'exécution sur localhost:27017"
fi

echo ""
echo "=== Démarrage du Backend ==="
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../backend" || exit
npm install
echo "Démarrage du serveur backend sur le port 5000..."
npm start
