/**
 * Auth Module — Registration & Token Management
 * Handles registration with the evaluation server and token caching.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const REGISTER_URL = 'http://4.224.186.213/evaluation-service/register';
const AUTH_URL     = 'http://4.224.186.213/evaluation-service/auth';
const CREDS_FILE   = path.join(__dirname, '.credentials.json');

function post(url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = JSON.stringify(body);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', c => (raw += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('Timeout')));
    req.write(data);
    req.end();
  });
}

/**
 * Register with the evaluation server.
 * Can only be done ONCE — saves credentials to .credentials.json
 */
async function register({ email, name, mobileNo, githubUsername, rollNo, accessCode }) {
  console.log('[auth] Registering with evaluation server...');
  const res = await post(REGISTER_URL, { email, name, mobileNo, githubUsername, rollNo, accessCode });
  console.log('[auth] Registration response:', JSON.stringify(res.body, null, 2));

  if (res.status === 200 || res.status === 201) {
    fs.writeFileSync(CREDS_FILE, JSON.stringify(res.body, null, 2));
    console.log('[auth] Credentials saved to .credentials.json — DO NOT COMMIT THIS FILE');
  }
  return res.body;
}

/**
 * Obtain Bearer token from evaluation server using saved credentials.
 */
async function getToken() {
  if (!fs.existsSync(CREDS_FILE)) {
    throw new Error('No credentials found. Run register() first.');
  }
  const creds = JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));

  console.log('[auth] Fetching authorization token...');
  const res = await post(AUTH_URL, {
    email:        creds.email,
    name:         creds.name,
    rollNo:       creds.rollNo,
    accessCode:   creds.accessCode,
    clientID:     creds.clientID,
    clientSecret: creds.clientSecret,
  });

  if (res.status === 200 && res.body.access_token) {
    console.log('[auth] Token obtained successfully');
    return res.body.access_token;
  }
  throw new Error(`Failed to get token: ${JSON.stringify(res.body)}`);
}

/**
 * Load credentials from file (after registration)
 */
function loadCredentials() {
  if (!fs.existsSync(CREDS_FILE)) return null;
  return JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));
}

module.exports = { register, getToken, loadCredentials };
