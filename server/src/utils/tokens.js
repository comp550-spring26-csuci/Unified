const jwt = require('jsonwebtoken');

function signAccessToken(user) {
  const payload = { sub: String(user._id), role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

module.exports = { signAccessToken };
