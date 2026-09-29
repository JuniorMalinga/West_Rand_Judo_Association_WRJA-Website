// Security building blocks: headers, CORS, CSRF guard, rate limiting, errors.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ---- Security headers -------------------------------------------------------
export function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self), payment=()");
  if (req.secure) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  // API responses are JSON only – nothing on them should ever be rendered.
  if (req.path.startsWith("/api/")) {
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
    res.setHeader("Cache-Control", "no-store");
  }
  next();
}

// ---- Allowed origins / CORS -------------------------------------------------
export function allowedOrigins() {
  const configured = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    ...configured,
  ]);
}

export function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins().has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
}

// ---- CSRF guard -------------------------------------------------------------
// Session cookies are SameSite=Lax, and every state-changing request must also
// carry a custom header (which a foreign site can't add without a CORS
// pre-flight that we refuse) and come from an allowed origin.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrfGuard(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  if (req.headers["x-requested-with"] !== "wrja-web") {
    return next(new HttpError(403, "Request blocked (missing security header)."));
  }

  const origin = req.headers.origin;
  if (origin) {
    let sameHost = false;
    try {
      sameHost = new URL(origin).host === req.headers.host;
    } catch {
      sameHost = false;
    }
    if (!sameHost && !allowedOrigins().has(origin)) {
      return next(new HttpError(403, "Request blocked (untrusted origin)."));
    }
  }
  return next();
}

// ---- Rate limiting (in memory – fine for a single local server) -------------
export function createLimiter({ windowMs, max }) {
  const hits = new Map(); // key -> { count, resetAt }

  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, Math.min(windowMs, 60_000));
  timer.unref();

  const current = (key) => {
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= Date.now()) return null;
    return entry;
  };

  return {
    // Is this key currently blocked?
    blocked(key) {
      const entry = current(key);
      if (entry && entry.count >= max) return Math.ceil((entry.resetAt - Date.now()) / 1000);
      return 0;
    },
    // Record one hit.
    hit(key) {
      const entry = current(key) || { count: 0, resetAt: Date.now() + windowMs };
      entry.count += 1;
      hits.set(key, entry);
      return entry.count;
    },
    reset(key) {
      hits.delete(key);
    },
  };
}

// Express middleware that counts every request.
export function rateLimit({ windowMs, max, key = (req) => req.ip, message = "Too many requests. Please try again later." }) {
  const limiter = createLimiter({ windowMs, max });
  return (req, res, next) => {
    const id = key(req);
    const wait = limiter.blocked(id);
    if (wait) {
      res.setHeader("Retry-After", String(wait));
      return next(new HttpError(429, message));
    }
    limiter.hit(id);
    return next();
  };
}

// ---- Error handling ---------------------------------------------------------
export function notFoundApi(req, res, next) {
  next(new HttpError(404, "Not found."));
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = error.status || error.statusCode || 500;
  let message = error.message;

  if (error.type === "entity.too.large") {
    status = 413;
    message = "That upload is too large.";
  } else if (error.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid request.";
  } else if (status >= 500) {
    console.error("Unhandled server error:", error);
    message = "Something went wrong on the server.";
  }

  res.status(status).json({ success: false, error: message });
}
