/**
 * Global request timeout middleware (best-effort).
 *
 * Goal: avoid slowloris / stuck requests consuming sockets forever under load.
 *
 * Important: do NOT apply to streaming endpoints (download/stream/zip).
 */

function requestTimeout({ defaultTimeoutMs = 120000 } = {}) {
  const timeoutMs = parseInt(process.env.REQUEST_TIMEOUT_MS, 10) || defaultTimeoutMs;

  return function requestTimeoutMiddleware(req, res, next) {
    // Exempt common streaming routes.
    const path = req.path || '';
    const isStreamingRoute =
      path.endsWith('/download') ||
      path.endsWith('/stream') ||
      path.includes('/preview');

    if (!isStreamingRoute) {
      try {
        if (typeof req.setTimeout === 'function') req.setTimeout(timeoutMs);
        if (typeof res.setTimeout === 'function') {
          res.setTimeout(timeoutMs, () => {
            // If nothing was sent yet, return a JSON timeout.
            if (!res.headersSent) {
              return res.status(408).json({
                error: {
                  message: 'Request timeout',
                  status: 408,
                },
              });
            }

            // Otherwise, terminate the connection.
            try {
              res.destroy();
            } catch {
              // ignore
            }
          });
        }
      } catch {
        // ignore
      }
    }

    next();
  };
}

module.exports = { requestTimeout };
