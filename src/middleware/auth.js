const jwt = require('jsonwebtoken');

const SESSION_COOKIE = 'chesse_session';

function getCookieOptions() {
  const secure = process.env.COOKIE_SECURE !== 'false';

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function signSession(user) {
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is required before creating a session.');
  }

  return jwt.sign(
    { sub: String(user.id), username: user.username },
    process.env.SESSION_SECRET,
    { expiresIn: '7d' },
  );
}

function setSessionCookie(response, user) {
  response.cookie(SESSION_COOKIE, signSession(user), getCookieOptions());
}

function clearSessionCookie(response) {
  response.clearCookie(SESSION_COOKIE, getCookieOptions());
}

function requireAuth(request, response, next) {
  const token = request.cookies[SESSION_COOKIE];

  if (!token || !process.env.SESSION_SECRET) {
    return response.status(401).json({ error: 'Authentication required.' });
  }

  try {
    request.user = jwt.verify(token, process.env.SESSION_SECRET);
    return next();
  } catch (error) {
    return response.status(401).json({ error: 'Session expired or invalid.' });
  }
}

module.exports = {
  SESSION_COOKIE,
  clearSessionCookie,
  requireAuth,
  setSessionCookie,
};
