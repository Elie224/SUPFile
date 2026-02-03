/* eslint-disable no-console */

// Smoke test for folder ZIP download in production.
//
// Usage (PowerShell):
//   $env:SUPFILE_BASE_URL = "https://supfile.fly.dev"
//   $env:SUPFILE_EMAIL = "you@example.com"
//   $env:SUPFILE_PASSWORD = "yourPassword"
//   node scripts/smoke-zip-download.js
//
// Notes:
// - Requires a VERIFIED account (login refuses unverified emails).
// - Does NOT print tokens/passwords.

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { pipeline } = require('stream/promises');
const { Readable } = require('stream');
const { Agent } = require('undici');

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing env var ${name}`);
  }
  return value.trim();
}

async function readTextSafe(res, maxChars = 2000) {
  try {
    const text = await res.text();
    if (text.length <= maxChars) return text;
    return `${text.slice(0, maxChars)}…(truncated)`;
  } catch {
    return '<unreadable body>';
  }
}

async function main() {
  const baseUrl = (process.env.SUPFILE_BASE_URL || 'https://supfile.fly.dev').replace(/\/+$/, '');
  const email = requireEnv('SUPFILE_EMAIL');
  const password = requireEnv('SUPFILE_PASSWORD');

  // Undici (Node fetch) a des timeouts par défaut ~5min; pour des gros ZIP ça peut terminer.
  // On garde des limites raisonnables mais plus hautes.
  const dispatcher = new Agent({
    connectTimeout: 30_000,
    headersTimeout: 60_000,
    bodyTimeout: 20 * 60_000, // 20 minutes
  });

  console.log(`[zip-smoke] Base URL: ${baseUrl}`);

  // 1) Login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    dispatcher,
    body: JSON.stringify({ email, password }),
  });

  if (!loginRes.ok) {
    const body = await readTextSafe(loginRes);
    throw new Error(`[zip-smoke] Login failed: HTTP ${loginRes.status} ${body}`);
  }

  const loginJson = await loginRes.json();
  const accessToken = loginJson?.data?.access_token;
  if (!accessToken) {
    throw new Error('[zip-smoke] Login response missing data.access_token');
  }

  console.log('[zip-smoke] Login: OK');

  // 2) Create a test folder (root level)
  const folderName = `zip-smoke-${Date.now()}`;
  const createFolderRes = await fetch(`${baseUrl}/api/folders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    dispatcher,
    body: JSON.stringify({ name: folderName, parent_id: null }),
  });

  if (!createFolderRes.ok) {
    const body = await readTextSafe(createFolderRes);
    throw new Error(`[zip-smoke] Create folder failed: HTTP ${createFolderRes.status} ${body}`);
  }

  const folderJson = await createFolderRes.json();
  const folderId = folderJson?.data?.id;
  if (!folderId) {
    throw new Error('[zip-smoke] Create folder response missing data.id');
  }

  console.log(`[zip-smoke] Folder created: ${folderId}`);

  // 3) Download ZIP using query token (mimics direct download)
  const downloadUrl = `${baseUrl}/api/folders/${encodeURIComponent(folderId)}/download?access_token=${encodeURIComponent(accessToken)}`;

  const zipRes = await fetch(downloadUrl, {
    method: 'GET',
    headers: {
      // Avoid automatic content-type negotiation edge cases
      Accept: 'application/zip, application/octet-stream;q=0.9, */*;q=0.8',
    },
    dispatcher,
  });

  if (!zipRes.ok) {
    const body = await readTextSafe(zipRes);
    throw new Error(`[zip-smoke] ZIP download failed: HTTP ${zipRes.status} ${body}`);
  }

  const contentType = zipRes.headers.get('content-type') || '';
  const contentDisposition = zipRes.headers.get('content-disposition') || '';

  // Save artifact (streaming, évite d'allouer tout le ZIP en mémoire)
  const outPath = path.join(process.cwd(), `zip-smoke-${folderId}.zip`);
  if (!zipRes.body) {
    throw new Error('[zip-smoke] ZIP response has no body');
  }
  await pipeline(Readable.fromWeb(zipRes.body), fs.createWriteStream(outPath));

  const st = await fsp.stat(outPath);
  const fh = await fsp.open(outPath, 'r');
  try {
    const magic = Buffer.alloc(4);
    await fh.read(magic, 0, 4, 0);
    const isZip = magic[0] === 0x50 && magic[1] === 0x4b; // PK
    console.log(`[zip-smoke] ZIP HTTP 200, bytes=${st.size}`);
    console.log(`[zip-smoke] content-type: ${contentType}`);
    console.log(`[zip-smoke] content-disposition: ${contentDisposition}`);
    console.log(`[zip-smoke] magic: ${magic.toString('hex')} (PK => zip)`);
    if (!isZip) {
      const head = Buffer.alloc(200);
      await fh.read(head, 0, 200, 0);
      throw new Error(`[zip-smoke] Response is not a ZIP (no PK header). First bytes: ${head.toString('utf8')}`);
    }
  } finally {
    await fh.close();
  }

  console.log(`[zip-smoke] Saved: ${outPath}`);

  console.log('[zip-smoke] ✅ ZIP download looks OK');
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exitCode = 1;
});
