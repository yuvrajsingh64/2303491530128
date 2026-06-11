/**
 * Registration script — already registered, kept for reference.
 * Usage: node register.js
 * Credentials saved to logging_middleware/.credentials.json
 */

const { register } = require('./logging_middleware/auth');

const REGISTRATION_DETAILS = {
  email:          'mr.yuvrajsinghh@gmail.com',
  name:           'Yuvraj Singh',
  mobileNo:       '8112316929',
  githubUsername: 'yuvrajsingh64',
  rollNo:         '2303491530128',
  accessCode:     'BAVDSh',
};

(async () => {
  try {
    const result = await register(REGISTRATION_DETAILS);
    console.log('\n=== REGISTRATION RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n✅ Save your clientID and clientSecret from above!');
  } catch (err) {
    console.error('Registration failed:', err.message);
  }
})();
