/**
 * Run this after you have clientID and clientSecret from registration.
 * Usage: node get-token.js <clientID> <clientSecret>
 * Example: node get-token.js "abc-123" "mySecret"
 */

const { getToken } = require('./logging_middleware/auth');
const { setAuthToken } = require('./logging_middleware/logger');
const fs = require('fs');
const path = require('path');

const clientID     = process.argv[2];
const clientSecret = process.argv[3];

if (!clientID || !clientSecret) {
  console.error('Usage: node get-token.js <clientID> <clientSecret>');
  process.exit(1);
}

// Save credentials first
const creds = {
  email:        'mr.yuvrajsinghh@gmail.com',
  name:         'Yuvraj Singh',
  rollNo:       '2303491530128',
  accessCode:   'BAVDSh',
  clientID,
  clientSecret,
};
fs.writeFileSync('./logging_middleware/.credentials.json', JSON.stringify(creds, null, 2));
console.log('Credentials saved.');

(async () => {
  try {
    const token = await getToken();
    console.log('\n✅ Token obtained successfully!');
    console.log('Token (first 50 chars):', token.substring(0, 50) + '...');

    // Save token to .env-style file for frontend
    fs.writeFileSync('.token', token);
    console.log('\nToken saved to .token file');
    console.log('\nNow restart your backend: node notification_app_be/server.js');
  } catch (err) {
    console.error('Failed:', err.message);
  }
})();
