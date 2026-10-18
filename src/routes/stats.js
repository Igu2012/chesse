const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const RESULT_COLUMNS = {
  win: 'wins',
  loss: 'losses',
  draw: 'draws',
};

async function fetchStats(userId) {
  const result = await db.query(
    `SELECT u.id, u.username,
            COALESCE(ps.wins, 0) AS wins,
            COALESCE(ps.losses, 0) AS losses,
            COALESCE(ps.draws, 0) AS draws,
            COALESCE(ps.current_rating, 1200) AS current_rating
     FROM users u
     LEFT JOIN player_stats ps ON ps.user_id = u.id
     WHERE u.id = $1`,
    [userId],
  );

  if (!result.rows[0]) {
    return null;
  }

  const row = result.rows[0];
  return {
    username: row.username,
    wins: Number(row.wins),
    losses: Number(row.losses),
    draws: Number(row.draws),
    current_rating: Number(row.current_rating),
  };
}

router.get('/', requireAuth, async (request, response) => {
  try {
    const stats = await fetchStats(request.user.sub);

    if (!stats) {
      return response.status(404).json({ error: 'Player profile not found.' });
    }

    return response.json({ stats });
  } catch (error) {
    console.error('Stats lookup failed:', error.message);
    return response.status(500).json({ error: 'Unable to load statistics.' });
  }
});

router.post('/result', requireAuth, async (request, response) => {
  const resultType = request.body?.result;
  const column = RESULT_COLUMNS[resultType];

  if (!column) {
    return response.status(400).json({ error: 'Result must be win, loss, or draw.' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    const existing = await client.query(
      'SELECT user_id FROM player_stats WHERE user_id = $1 FOR UPDATE',
      [request.user.sub],
    );

    if (!existing.rows[0]) {
      const wins = resultType === 'win' ? 1 : 0;
      const losses = resultType === 'loss' ? 1 : 0;
      const draws = resultType === 'draw' ? 1 : 0;
      await client.query(
        `INSERT INTO player_stats (user_id, wins, losses, draws, current_rating)
         VALUES ($1, $2, $3, $4, 1200)`,
        [request.user.sub, wins, losses, draws],
      );
    } else {
      await client.query(
        `UPDATE player_stats
         SET ${column} = COALESCE(${column}, 0) + 1
         WHERE user_id = $1`,
        [request.user.sub],
      );
    }

    await client.query('COMMIT');
    const stats = await fetchStats(request.user.sub);
    return response.status(201).json({ stats });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Game result update failed:', error.message);
    return response.status(500).json({ error: 'Unable to save the game result.' });
  } finally {
    client.release();
  }
});

module.exports = router;
