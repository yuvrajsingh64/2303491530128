/**
 * Logging Middleware — Reusable Package
 * Sends structured logs to the evaluation server Log API.
 *
 * Usage:
 *   const { Log } = require('./logging_middleware/logger');
 *   await Log("backend", "info", "handler", "Request received for /api/notifications");
 *
 * Log(stack, level, package, message)
 *   stack   : "backend" | "frontend"
 *   level   : "debug" | "info" | "warn" | "error" | "fatal"
 *   package : "handler" | "service" | "repository" | "route" | "controller" |
 *             "middleware" | "utils" | "config" | "auth" | "cache" |
 *             "domain" | "cron_job" | "api" | "component" | "hook" |
 *             "page" | "state" | "style"
 *   message : descriptive log message
 */

const https = require('https');
const http = require('http');

const LOG_API_URL = 'http://4.224.186.213/evaluation-service/logs';

// Token store — set this after authentication
let _authToken = '';

/**
 * Set the Bearer token for authenticated log API calls.
 * Call this once after obtaining the token from auth API.
 */
function setAuthToken(token) {
  _authToken = token;
}

function getAuthToken() {
  return _authToken;
}

// Valid values (enforced locally to avoid wasted API calls)
const VALID_STACKS   = new Set(['backend', 'frontend']);
const VALID_LEVELS   = new Set(['debug', 'info', 'warn', 'error', 'fatal']);
const VALID_PACKAGES = new Set([
  // backend
  'cache', 'controller', 'cron_job', 'domain', 'handler',
  'repository', 'route', 'service',
  // frontend
  'api', 'component', 'hook', 'page', 'state', 'style',
  // both
  'auth', 'config', 'middleware', 'utils',
]);

// ANSI colors for local console output
const LEVEL_COLOR = {
  debug: '\x1b[36m',  // cyan
  info:  '\x1b[32m',  // green
  warn:  '\x1b[33m',  // yellow
  error: '\x1b[31m',  // red
  fatal: '\x1b[35m',  // magenta
};
const RESET = '\x1b[0m';

/**
 * Core Log function — sends log to remote API + prints locally.
 *
 * @param {string} stack   - "backend" or "frontend"
 * @param {string} level   - "debug"|"info"|"warn"|"error"|"fatal"
 * @param {string} pkg     - package name (see valid list above)
 * @param {string} message - descriptive message
 * @returns {Promise<{logID: string}|null>}
 */
async function Log(stack, level, pkg, message) {
  // Local validation
  if (!VALID_STACKS.has(stack))   { console.error(`[logger] Invalid stack: ${stack}`);   return null; }
  if (!VALID_LEVELS.has(level))   { console.error(`[logger] Invalid level: ${level}`);   return null; }
  if (!VALID_PACKAGES.has(pkg))   { console.error(`[logger] Invalid package: ${pkg}`);   return null; }
  if (!message || typeof message !== 'string') { console.error('[logger] message must be a non-empty string'); return null; }

  // Always print locally with color
  const timestamp = new Date().toISOString();
  const color = LEVEL_COLOR[level] || '';
  console.log(`${color}[${timestamp}] [${stack.toUpperCase()}] [${level.toUpperCase().padEnd(5)}] [${pkg}] ${message}${RESET}`);

  // Send to remote Log API
  const body = JSON.stringify({ stack, level, package: pkg, message });

  return new Promise((resolve) => {
    try {
      const url = new URL(LOG_API_URL);
      const options = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...(_authToken ? { Authorization: `Bearer ${_authToken}` } : {}),
        },
      };

      const protocol = url.protocol === 'https:' ? https : http;
      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch {
            resolve(null);
          }
        });
      });

      req.on('error', (err) => {
        console.error(`[logger] Failed to send log to API: ${err.message}`);
        resolve(null);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve(null);
      });

      req.write(body);
      req.end();
    } catch (err) {
      console.error(`[logger] Unexpected error in Log(): ${err.message}`);
      resolve(null);
    }
  });
}

/**
 * Express HTTP Request Logger Middleware
 * Logs every incoming request's lifecycle using the Log function.
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  Log('backend', 'info', 'middleware',
    `Incoming ${req.method} ${req.url} from ${req.ip || 'unknown'}`
  );

  const originalEnd = res.end.bind(res);
  res.end = function (...args) {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error'
                : res.statusCode >= 400 ? 'warn'
                : 'info';

    Log('backend', level, 'middleware',
      `Completed ${req.method} ${req.url} → ${res.statusCode} in ${duration}ms`
    );

    return originalEnd(...args);
  };

  next();
}

module.exports = { Log, setAuthToken, getAuthToken, requestLogger };
