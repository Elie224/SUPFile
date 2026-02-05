function isAllowedFrontendOrigin(origin) {
  if (!origin || typeof origin !== 'string') return false;
  const o = origin.trim();
  if (!o) return false;

  // Allow known deployment domains and local development.
  // This is intentionally strict to avoid open redirects.
  return (
    o === 'https://supfile.com' ||
    o.endsWith('.onrender.com') ||
    o.endsWith('.netlify.app') ||
    o.endsWith('.fly.dev') ||
    o.startsWith('http://localhost:') ||
    o.startsWith('http://127.0.0.1:') ||
    o.startsWith('https://localhost:') ||
    o.startsWith('https://127.0.0.1:')
  );
}

function tryGetOriginFromReferer(referer) {
  if (!referer || typeof referer !== 'string') return null;
  const r = referer.trim();
  if (!r) return null;

  try {
    const u = new URL(r);
    return u.origin;
  } catch {
    return null;
  }
}

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl || typeof baseUrl !== 'string') return null;
  const b = baseUrl.trim();
  if (!b) return null;
  return b.replace(/\/+$/, '');
}

function getFrontendBaseUrl(req) {
  const envUrl = process.env.FRONTEND_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return normalizeBaseUrl(envUrl);
  }

  // If we stored the frontend during the OAuth initiation step, prefer it.
  // This is the most reliable source during provider callbacks (Origin often missing).
  const sessionUrl = req?.session?.oauthFrontendBaseUrl;
  if (sessionUrl && isAllowedFrontendOrigin(sessionUrl)) {
    return normalizeBaseUrl(sessionUrl);
  }

  // Prefer Origin header so share links and OAuth redirects match the active frontend.
  const origin = req?.get ? req.get('Origin') : null;
  if (isAllowedFrontendOrigin(origin)) {
    return normalizeBaseUrl(origin);
  }

  // For top-level navigations (OAuth flows), browsers typically send Referer, not Origin.
  const referer = req?.get ? req.get('Referer') : null;
  const refererOrigin = tryGetOriginFromReferer(referer);
  if (isAllowedFrontendOrigin(refererOrigin)) {
    return normalizeBaseUrl(refererOrigin);
  }

  // Safe fallback.
  // In production, redirect to the canonical frontend domain by default.
  if (process.env.NODE_ENV === 'production') {
    return 'https://supfile.com';
  }

  // Vite default dev port.
  return 'http://localhost:5173';
}

module.exports = {
  getFrontendBaseUrl,
  isAllowedFrontendOrigin,
};
