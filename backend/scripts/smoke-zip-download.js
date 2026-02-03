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
const path = require('path');

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

  console.log(`[zip-smoke] Base URL: ${baseUrl}`);

  // 1) Login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
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
  });

  if (!zipRes.ok) {
    const body = await readTextSafe(zipRes);
    throw new Error(`[zip-smoke] ZIP download failed: HTTP ${zipRes.status} ${body}`);
  }

  const contentType = zipRes.headers.get('content-type') || '';
  const contentDisposition = zipRes.headers.get('content-disposition') || '';

  const arrayBuf = await zipRes.arrayBuffer();
  const buf = Buffer.from(arrayBuf);

  const magic = buf.slice(0, 4);
  const isZip = magic.length === 4 && magic[0] === 0x50 && magic[1] === 0x4b; // PK

  console.log(`[zip-smoke] ZIP HTTP 200, bytes=${buf.length}`);
  console.log(`[zip-smoke] content-type: ${contentType}`);
  console.log(`[zip-smoke] content-disposition: ${contentDisposition}`);
  console.log(`[zip-smoke] magic: ${magic.toString('hex')} (PK => zip)`);

  if (!isZip) {
    const head = buf.slice(0, 200).toString('utf8');
    throw new Error(`[zip-smoke] Response is not a ZIP (no PK header). First bytes: ${head}`);
  }

  // Save artifact (optional but useful)
  const outPath = path.join(process.cwd(), `zip-smoke-${folderId}.zip`);
  fs.writeFileSync(outPath, buf);
  console.log(`[zip-smoke] Saved: ${outPath}`);

  console.log('[zip-smoke] ✅ ZIP download looks OK');
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exitCode = 1;
});
