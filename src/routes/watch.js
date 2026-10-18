const express = require('express');
const db = require('../db');

const router = express.Router();

async function prepareSchema() {
  await db.ensureMultiplayerSchema();
}

async function getPublicGame(gameId) {
  const result = await db.query(
    `SELECT g.id, g.white_user_id, g.black_user_id, g.status, g.fen, g.result,
            g.created_at, g.updated_at,
            white_user.username AS white_username,
            COALESCE(white_profile.display_name, white_user.username) AS white_display_name,
            black_user.username AS black_username,
            COALESCE(black_profile.display_name, black_user.username) AS black_display_name,
            COUNT(m.id)::INTEGER AS move_count
     FROM chess_games g
     JOIN users white_user ON white_user.id = g.white_user_id
     JOIN users black_user ON black_user.id = g.black_user_id
     LEFT JOIN user_profiles white_profile ON white_profile.user_id = g.white_user_id
     LEFT JOIN user_profiles black_profile ON black_profile.user_id = g.black_user_id
     LEFT JOIN chess_game_moves m ON m.game_id = g.id
     WHERE g.id = $1 AND g.status = 'active'
     GROUP BY g.id, white_user.username, white_profile.display_name,
              black_user.username, black_profile.display_name`,
    [gameId],
  );
  const row = result.rows[0];
  if (!row) return null;
  const moves = await db.query(
    `SELECT ply, san, from_square, to_square FROM chess_game_moves WHERE game_id = $1 ORDER BY ply`,
    [gameId],
  );
  return {
    id: String(row.id), status: row.status, fen: row.fen, result: row.result,
    white: { username: row.white_username, displayName: row.white_display_name },
    black: { username: row.black_username, displayName: row.black_display_name },
    moveCount: Number(row.move_count), createdAt: row.created_at, updatedAt: row.updated_at,
    moves: moves.rows.map((move) => ({ ply: move.ply, san: move.san, from: move.from_square, to: move.to_square })),
  };
}

router.get('/games', async (request, response) => {
  try {
    await prepareSchema();
    const result = await db.query(
      `SELECT g.id, g.white_user_id, g.black_user_id, g.fen, g.updated_at,
              white_user.username AS white_username,
              COALESCE(white_profile.display_name, white_user.username) AS white_display_name,
              black_user.username AS black_username,
              COALESCE(black_profile.display_name, black_user.username) AS black_display_name,
              COUNT(m.id)::INTEGER AS move_count
       FROM chess_games g
       JOIN users white_user ON white_user.id = g.white_user_id
       JOIN users black_user ON black_user.id = g.black_user_id
       LEFT JOIN user_profiles white_profile ON white_profile.user_id = g.white_user_id
       LEFT JOIN user_profiles black_profile ON black_profile.user_id = g.black_user_id
       LEFT JOIN chess_game_moves m ON m.game_id = g.id
       WHERE g.status = 'active'
       GROUP BY g.id, white_user.username, white_profile.display_name,
                black_user.username, black_profile.display_name
       ORDER BY g.updated_at DESC
       LIMIT 30`,
    );
    return response.json({ games: result.rows.map((row) => ({
      id: String(row.id),
      white: { username: row.white_username, displayName: row.white_display_name },
      black: { username: row.black_username, displayName: row.black_display_name },
      moveCount: Number(row.move_count), updatedAt: row.updated_at,
    })) });
  } catch (error) {
    console.error('Public games lookup failed:', error.message);
    return response.status(500).json({ error: 'Unable to load public games.' });
  }
});

router.get('/games/:gameId', async (request, response) => {
  try {
    await prepareSchema();
    const game = await getPublicGame(request.params.gameId);
    if (!game) return response.status(404).json({ error: 'Public game not found.' });
    return response.json({ game });
  } catch (error) {
    console.error('Public game lookup failed:', error.message);
    return response.status(500).json({ error: 'Unable to load the public game.' });
  }
});

module.exports = router;
