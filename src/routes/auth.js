const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const {
  clearSessionCookie,
  requireAuth,
  setSessionCookie,
} = require('../middleware/auth');

const router = express.Router();
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,24}$/;

function validateCredentials(body) {
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!USERNAME_PATTERN.test(username)) {
    return { error: 'Username must be 3-24 characters using letters, numbers, or underscores.' };
  }

  if (password.length < 8 || password.length > 128) {
    return { error: 'Password must be 8-128 characters.' };
  }

  return { username, password };
}

async function ensureStatsRow(userId) {
  await db.query(
    `INSERT INTO player_stats (user_id, wins, losses, draws, current_rating)
     SELECT $1, 0, 0, 0, 1200
     WHERE NOT EXISTS (SELECT 1 FROM player_stats WHERE user_id = $1)`,
    [userId],
  );
}

async function ensureProfileRow(userId) {
  await db.ensureMultiplayerSchema();
  await db.query(
    `INSERT INTO user_profiles (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId],
  );
}

router.post('/signup', async (request, response) => {
  const credentials = validateCredentials(request.body || {});

  if (credentials.error) {
    return response.status(400).json({ error: credentials.error });
  }

  try {
    const passwordHash = await bcrypt.hash(credentials.password, 12);
    const result = await db.query(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id, username, created_at`,
      [credentials.username, passwordHash],
    );
    const user = result.rows[0];

    await ensureStatsRow(user.id);
    await ensureProfileRow(user.id);
    setSessionCookie(response, user);
    return response.status(201).json({ user });
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({ error: 'That username is already in use.' });
    }

    console.error('Signup failed:', error.message);
    return response.status(500).json({ error: 'Unable to create the account.' });
  }
});

router.post('/login', async (request, response) => {
  const username = typeof request.body?.username === 'string'
    ? request.body.username.trim()
    : '';
  const password = typeof request.body?.password === 'string'
    ? request.body.password
    : '';

  if (!username || !password) {
    return response.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const result = await db.query(
      `SELECT id, username, password_hash, created_at
       FROM users
       WHERE username = $1`,
      [username],
    );
    const userRecord = result.rows[0];

    if (!userRecord || !(await bcrypt.compare(password, userRecord.password_hash))) {
      return response.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = {
      id: userRecord.id,
      username: userRecord.username,
      created_at: userRecord.created_at,
    };

    await ensureStatsRow(user.id);
    await ensureProfileRow(user.id);
    setSessionCookie(response, user);
    return response.json({ user });
  } catch (error) {
    console.error('Login failed:', error.message);
    return response.status(500).json({ error: 'Unable to sign in right now.' });
  }
});

router.get('/me', requireAuth, async (request, response) => {
  try {
    await ensureProfileRow(request.user.sub);
    const result = await db.query(
      `SELECT u.id, u.username, u.created_at,
              COALESCE(ps.wins, 0) AS wins,
              COALESCE(ps.losses, 0) AS losses,
              COALESCE(ps.draws, 0) AS draws,
              COALESCE(ps.current_rating, 1200) AS current_rating,
              up.display_name, up.bio, up.locale, up.rat_color,
              up.rat_accessory, up.rat_avatar_mode, up.rat_background, up.rat_hat,
              up.rat_hair, up.rat_shirt, up.rat_pants, up.rat_beard
       FROM users u
       LEFT JOIN player_stats ps ON ps.user_id = u.id
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE u.id = $1`,
      [request.user.sub],
    );

    if (!result.rows[0]) {
      clearSessionCookie(response);
      return response.status(401).json({ error: 'Account no longer exists.' });
    }

    const row = result.rows[0];
    return response.json({
      user: {
        id: row.id,
        username: row.username,
        created_at: row.created_at,
        display_name: row.display_name || row.username,
        bio: row.bio || '',
        locale: row.locale || 'auto',
        rat: {
          color: row.rat_color || 'gold',
          accessory: row.rat_accessory === 'pawn' ? 'none' : (row.rat_accessory || 'none'),
          avatarMode: row.rat_avatar_mode || 'both',
          background: row.rat_background || 'night',
          hat: row.rat_hat || 'none',
          hair: row.rat_hair || 'none',
          shirt: row.rat_shirt || 'none',
          pants: row.rat_pants || 'none',
          beard: row.rat_beard || 'none',
        },
      },
      stats: {
        wins: Number(row.wins),
        losses: Number(row.losses),
        draws: Number(row.draws),
        current_rating: Number(row.current_rating),
      },
    });
  } catch (error) {
    console.error('Session lookup failed:', error.message);
    return response.status(500).json({ error: 'Unable to load the session.' });
  }
});

router.post('/logout', (request, response) => {
  clearSessionCookie(response);
  return response.status(204).send();
});

module.exports = router;
