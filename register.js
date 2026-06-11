/**
 * Run this ONCE to register with the evaluation server.
 * Usage: node register.js
 *
 * IMPORTANT: You can only register once. 
 * Credentials are saved to logging_middleware/.credentials.json
 */

const { register } = require('./logging_middleware/auth');

const REGISTRATION_DETAILS = {
  email:          'REPLACE_WITH_COLLEGE_EMAIL',   // e.g. 2303491530128@mpgi.edu.in
  name:           'Yuvraj',                        // do NOT use last name if not needed
  mobileNo:       'REPLACE_WITH_MOBILE',           // e.g. 9876543210
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
