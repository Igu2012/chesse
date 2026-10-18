const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const LOCALES = new Set(['auto', 'en', 'pt-BR', 'es', 'fr', 'de']);
const RAT_COLORS = new Set(['gold', 'brown', 'gray', 'pink', 'blue']);
const RAT_ACCESSORIES = new Set(['pawn', 'crown', 'glasses', 'none']);
const RAT_MODES = new Set(['avatar', 'full', 'both']);

async function prepareSchema() {
  await db.ensureMultiplayerSchema();
}

function stringValue(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toProfile(row) {
  return {
    displayName: row.display_name || row.username,
    bio: row.bio || '',
    locale: row.locale || 'auto',
    rat: {
      color: row.rat_color || 'gold',
      accessory: row.rat_accessory || 'pawn',
      avatarMode: row.rat_avatar_mode || 'both',
    },
  };
}

router.get('/', requireAuth, async (request, response) => {
  try {
    await prepareSchema();
    const result = await db.query(
      `SELECT u.username, up.display_name, up.bio, up.locale, up.rat_color,
              up.rat_accessory, up.rat_avatar_mode,
              COALESCE(ps.wins, 0) AS wins, COALESCE(ps.losses, 0) AS losses,
              COALESCE(ps.draws, 0) AS draws, COALESCE(ps.current_rating, 1200) AS current_rating
       FROM users u
       LEFT JOIN user_profiles up ON up.user_id = u.id
       LEFT JOIN player_stats ps ON ps.user_id = u.id
       WHERE u.id = $1`,
      [request.user.sub],
    );
    if (!result.rows[0]) return response.status(404).json({ error: 'Profile not found.' });
    const row = result.rows[0];
    return response.json({ username: row.username, profile: toProfile(row), stats: {
      wins: Number(row.wins), losses: Number(row.losses), draws: Number(row.draws), rating: Number(row.current_rating),
    } });
  } catch (error) {
    console.error('Profile lookup failed:', error.message);
    return response.status(500).json({ error: 'Unable to load the profile.' });
  }
});

router.patch('/', requireAuth, async (request, response) => {
  const body = request.body || {};
  const displayName = stringValue(body.displayName);
  const bio = stringValue(body.bio);
  const locale = stringValue(body.locale, 'auto');
  const rat = body.rat || {};
  const color = stringValue(rat.color, 'gold');
  const accessory = stringValue(rat.accessory, 'pawn');
  const avatarMode = stringValue(rat.avatarMode, 'both');

  if (displayName.length > 40 || bio.length > 280) {
    return response.status(400).json({ error: 'Display name must be at most 40 characters and bio at most 280 characters.' });
  }
  if (!LOCALES.has(locale) || !RAT_COLORS.has(color) || !RAT_ACCESSORIES.has(accessory) || !RAT_MODES.has(avatarMode)) {
    return response.status(400).json({ error: 'One of the profile customization values is not supported.' });
  }

  try {
    await prepareSchema();
    const result = await db.query(
      `INSERT INTO user_profiles (user_id, display_name, bio, locale, rat_color, rat_accessory, rat_avatar_mode)
       VALUES ($1, NULLIF($2, ''), $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         display_name = NULLIF(EXCLUDED.display_name, ''), bio = EXCLUDED.bio,
         locale = EXCLUDED.locale, rat_color = EXCLUDED.rat_color,
         rat_accessory = EXCLUDED.rat_accessory, rat_avatar_mode = EXCLUDED.rat_avatar_mode,
         updated_at = NOW()
       RETURNING display_name, bio, locale, rat_color, rat_accessory, rat_avatar_mode`,
      [request.user.sub, displayName, bio, locale, color, accessory, avatarMode],
    );
    return response.json({ profile: toProfile({ ...result.rows[0], username: request.user.username }) });
  } catch (error) {
    console.error('Profile update failed:', error.message);
    return response.status(500).json({ error: 'Unable to save the profile.' });
  }
});

router.get('/history', requireAuth, async (request, response) => {
  try {
    await prepareSchema();
    const result = await db.query(
      `SELECT g.id, g.white_user_id, g.black_user_id, g.status, g.result,
              g.fen, g.created_at, g.updated_at,
              opponent.username AS opponent_username,
              COALESCE(op_profile.display_name, opponent.username) AS opponent_display_name,
              COUNT(m.id)::INTEGER AS move_count
       FROM chess_games g
       JOIN users opponent ON opponent.id = CASE WHEN g.white_user_id = $1 THEN g.black_user_id ELSE g.white_user_id END
       LEFT JOIN user_profiles op_profile ON op_profile.user_id = opponent.id
       LEFT JOIN chess_game_moves m ON m.game_id = g.id
       WHERE g.status = 'finished' AND (g.white_user_id = $1 OR g.black_user_id = $1)
       GROUP BY g.id, opponent.username, op_profile.display_name
       ORDER BY g.updated_at DESC
       LIMIT 50`,
      [request.user.sub],
    );
    return response.json({ games: result.rows.map((row) => ({
      id: String(row.id),
      result: row.result,
      playerColor: String(row.white_user_id) === String(request.user.sub) ? 'white' : 'black',
      outcome: row.result === 'draw' ? 'draw' : row.result === (String(row.white_user_id) === String(request.user.sub) ? 'white' : 'black') ? 'win' : 'loss',
      opponentUsername: row.opponent_username,
      opponentDisplayName: row.opponent_display_name,
      moveCount: Number(row.move_count),
      fen: row.fen,
      completedAt: row.updated_at,
    })) });
  } catch (error) {
    console.error('History lookup failed:', error.message);
    return response.status(500).json({ error: 'Unable to load game history.' });
  }
});

router.get('/history/:gameId', requireAuth, async (request, response) => {
  try {
    await prepareSchema();
    const gameResult = await db.query(
      `SELECT id, white_user_id, black_user_id, status, fen, result, created_at, updated_at
       FROM chess_games WHERE id = $1 AND status = 'finished'
       AND (white_user_id = $2 OR black_user_id = $2)`,
      [request.params.gameId, request.user.sub],
    );
    const row = gameResult.rows[0];
    if (!row) return response.status(404).json({ error: 'Completed game not found.' });
    const moves = await db.query(
      `SELECT ply, san, from_square, to_square FROM chess_game_moves WHERE game_id = $1 ORDER BY ply`,
      [row.id],
    );
    return response.json({ game: {
      id: String(row.id), status: row.status, result: row.result, fen: row.fen,
      playerColor: String(row.white_user_id) === String(request.user.sub) ? 'white' : 'black',
      createdAt: row.created_at, completedAt: row.updated_at,
      moves: moves.rows.map((move) => ({ ply: move.ply, san: move.san, from: move.from_square, to: move.to_square })),
    } });
  } catch (error) {
    console.error('History game lookup failed:', error.message);
    return response.status(500).json({ error: 'Unable to load the completed game.' });
  }
});

module.exports = router;
