#!/usr/bin/env node
/**
 * Script de test pour la route GET /api/folders/:id/download
 * Usage:
 *   node scripts/test-download-route.js
 * Variables d'environnement (optionnelles):
 *   API_URL           Base URL du backend (défaut: https://supfile.fly.dev)
 *   TEST_FOLDER_ID    ID d'un dossier existant (24 caractères hex)
 *   TEST_ACCESS_TOKEN JWT d'un utilisateur connecté (qui a accès au dossier)
 * Si TEST_FOLDER_ID ou TEST_ACCESS_TOKEN manquent, le script utilise un ID factice
 * et affiche le résultat (401/404 attendu) pour vérifier que la route répond.
 */

const https = require('https');
const http = require('http');

const API_URL = process.env.API_URL || 'https://supfile.fly.dev';
const TEST_FOLDER_ID = process.env.TEST_FOLDER_ID || '000000000000000000000001';
const TEST_ACCESS_TOKEN = process.env.TEST_ACCESS_TOKEN || '';

const url = new URL(`${API_URL.replace(/\/$/, '')}/api/folders/${encodeURIComponent(TEST_FOLDER_ID)}/download`);
const isHttps = url.protocol === 'https:';
const lib = isHttps ? https : http;

const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname + url.search,
  method: 'GET',
  headers: {},
};
if (TEST_ACCESS_TOKEN) {
  options.headers.Authorization = `Bearer ${TEST_ACCESS_TOKEN}`;
}

function run() {
  console.log('--- Test route GET /api/folders/:id/download ---');
  console.log('URL:', url.toString());
  console.log('Folder ID:', TEST_FOLDER_ID);
  console.log('Token fourni:', !!TEST_ACCESS_TOKEN);
  console.log('');

  const req = lib.request(options, (res) => {
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => {
      const body = Buffer.concat(chunks);
      const contentType = res.headers['content-type'] || '';
      console.log('Status:', res.statusCode, res.statusMessage);
      console.log('Content-Type:', contentType);
      console.log('Access-Control-Allow-Origin:', res.headers['access-control-allow-origin'] || '(absent)');
      console.log('Content-Disposition:', res.headers['content-disposition'] || '(absent)');
      console.log('Body length:', body.length, 'bytes');
      if (res.statusCode >= 400) {
        const text = body.toString('utf8');
        try {
          const json = JSON.parse(text);
          console.log('Body (JSON):', JSON.stringify(json, null, 2));
        } catch (_) {
          console.log('Body (début):', text.substring(0, 500));
        }
      } else if (contentType.includes('application/zip')) {
        console.log('Body: flux ZIP (OK)');
      } else {
        console.log('Body (début):', body.toString('utf8').substring(0, 200));
      }
    });
  });

  req.on('error', (err) => {
    console.error('Erreur requête:', err.message);
    process.exitCode = 1;
  });

  req.end();
}

run();
