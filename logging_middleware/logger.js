const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const logFile = path.join(logsDir, 'app.log');

/**
 * Logging Middleware
 * Logs: timestamp, method, URL, status code, response time, IP
 */
const logger = (req, res, next) => {
  const start = Date.now();

  // Override res.end to capture status after response is sent
  const originalEnd = res.end.bind(res);
  res.end = function (...args) {
    const duration = Date.now() - start;
    const logEntry = `[${new Date().toISOString()}] ${req.method.padEnd(6)} ${req.url.padEnd(40)} → ${res.statusCode} (${duration}ms) IP:${req.ip || req.connection.remoteAddress}`;

    // Log to console with color
    const color = res.statusCode >= 500 ? '\x1b[31m'   // red
                : res.statusCode >= 400 ? '\x1b[33m'   // yellow
                : res.statusCode >= 200 ? '\x1b[32m'   // green
                : '\x1b[36m';                           // cyan
    console.log(`${color}${logEntry}\x1b[0m`);

    // Log to file
    fs.appendFile(logFile, logEntry + '\n', (err) => {
      if (err) console.error('Failed to write log:', err);
    });

    return originalEnd(...args);
  };

  next();
};

module.exports = logger;
