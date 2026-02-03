/**
 * Concurrency limiter middleware.
 *
 * Protects expensive endpoints (ZIP generation, heavy exports, etc.) from stampedes.
 *
 * Notes:
 * - This is per-process (per Fly VM). If you scale horizontally, each VM has its own limit.
 * - It decrements on either `finish` or `close` (client abort), whichever happens first.
 */

function createConcurrencyLimiter({
  max = 2,
  name = 'resource',
  status = 503,
  retryAfterSeconds = 10,
} = {}) {
  if (!Number.isFinite(max) || max <= 0) {
    throw new Error('createConcurrencyLimiter: `max` must be a positive number');
  }

  let active = 0;

  return function concurrencyLimiter(req, res, next) {
    if (active >= max) {
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(status).json({
        error: {
          message: `Server busy: too many concurrent ${name} operations. Please retry shortly.`,
          status,
          code: 'CONCURRENCY_LIMIT',
        },
      });
    }

    active += 1;

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      active = Math.max(0, active - 1);
    };

    res.on('finish', release);
    res.on('close', release);

    next();
  };
}

module.exports = { createConcurrencyLimiter };
