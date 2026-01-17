// Script pour tester la configuration OAuth
require('dotenv').config();
const config = require('../config');

console.log('=== Configuration OAuth ===\n');

console.log('Google OAuth:');
console.log('  Client ID:', config.oauth.google.clientId ? '✅ Configuré' : '❌ Non configuré');
console.log('  Client Secret:', config.oauth.google.clientSecret ? '✅ Configuré' : '❌ Non configuré');
console.log('  Redirect URI:', config.oauth.google.redirectUri || 'Non défini');
console.log('');

console.log('GitHub OAuth:');
console.log('  Client ID:', config.oauth.github.clientId ? '✅ Configuré' : '❌ Non configuré');
console.log('  Client Secret:', config.oauth.github.clientSecret ? '✅ Configuré' : '❌ Non configuré');
console.log('  Redirect URI:', config.oauth.github.redirectUri || 'Non défini');
console.log('');

console.log('Microsoft OAuth:');
console.log('  Client ID:', config.oauth.microsoft?.clientId ? '✅ Configuré' : '❌ Non configuré');
console.log('  Client Secret:', config.oauth.microsoft?.clientSecret ? '✅ Configuré' : '❌ Non configuré');
console.log('  Redirect URI:', config.oauth.microsoft?.redirectUri || 'Non défini');
console.log('');

// Vérifier les variables d'environnement directement
console.log('=== Variables d\'environnement ===\n');
console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? '✅ Présent' : '❌ Absent');
console.log('GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET ? '✅ Présent' : '❌ Absent');
console.log('GITHUB_REDIRECT_URI:', process.env.GITHUB_REDIRECT_URI || 'Non défini');






