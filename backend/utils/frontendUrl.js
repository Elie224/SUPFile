function isAllowedFrontendOrigin(origin) {
  if (!origin || typeof origin !== 'string') return false;
  const o = origin.trim();
  if (!o) return false;

  // Allow known deployment domains and local development.
  // This is intentionally strict to avoid open redirects.
  return (
    o === 'https://supfile.com' ||
    o.endsWith('.netlify.app') ||
    o.endsWith('.fly.dev') ||
    o.endsWith('.onrender.com') ||
    o.startsWith('http://localhost:') ||
    o.startsWith('http://127.0.0.1:') ||
    o.startsWith('https://localhost:') ||
    o.startsWith('https://127.0.0.1:')
  );
}

function getFrontendBaseUrl(req) {
  const envUrl = process.env.FRONTEND_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Prefer Origin header so share links and OAuth redirects match the active frontend.
  const origin = req?.get ? req.get('Origin') : null;
  if (isAllowedFrontendOrigin(origin)) {
    return origin.trim().replace(/\/+$/, '');
  }

  // Safe fallback.
  return 'http://localhost:3000';
}

module.exports = {
  getFrontendBaseUrl,
  isAllowedFrontendOrigin,
};
