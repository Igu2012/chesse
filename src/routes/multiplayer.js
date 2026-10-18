const express = require('express');
const { Chess } = require('chess.js');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const RESULT_COLUMNS = { wins: 'wins', losses: 'losses', draws: 'draws' };

async function prepareSchema() {
  await db.ensureMultiplayerSchema();
}

async function getGameState(queryable, gameId, userId) {
  const gameResult = await queryable.query(
    `SELECT id, white_user_id, black_user_id, status, fen, result, created_at, updated_at
     FROM chess_games
     WHERE id = $1 AND (white_user_id = $2 OR black_user_id = $2)`,
    [gameId, userId],
  );

  if (!gameResult.rows[0]) return null;
  const game = gameResult.rows[0];
  const movesResult = await queryable.query(
    `SELECT ply, san, from_square, to_square
     FROM chess_game_moves
     WHERE game_id = $1
     ORDER BY ply ASC`,
    [gameId],
  );

  return {
    id: String(game.id),
    status: game.status,
    result: game.result,
    fen: game.fen,
    playerColor: String(game.white_user_id) === String(userId) ? 'white' : 'black',
    opponentUserId: String(game.white_user_id) === String(userId)
      ? String(game.black_user_id)
      : String(game.white_user_id),
    createdAt: game.created_at,
    updatedAt: game.updated_at,
    moves: movesResult.rows.map((move) => ({
      ply: move.ply,
      san: move.san,
      from: move.from_square,
      to: move.to_square,
    })),
  };
}

async function findActiveGame(queryable, userId) {
  const result = await queryable.query(
    `SELECT id
     FROM chess_games
     WHERE status = 'active' AND (white_user_id = $1 OR black_user_id = $1)
     ORDER BY updated_at DESC
     LIMIT 1`,
    [userId],
  );
  return result.rows[0]?.id || null;
}

async function incrementStats(client, userId, column) {
  const safeColumn = RESULT_COLUMNS[column];
  if (!safeColumn) throw new Error('Invalid player result column.');

  await client.query(
    `INSERT INTO player_stats (user_id, wins, losses, draws, current_rating)
     SELECT $1, 0, 0, 0, 1200
     WHERE NOT EXISTS (SELECT 1 FROM player_stats WHERE user_id = $1)`,
    [userId],
  );
  await client.query(
    `UPDATE player_stats SET ${safeColumn} = COALESCE(${safeColumn}, 0) + 1 WHERE user_id = $1`,
    [userId],
  );
}

async function finishGame(client, gameRow, result) {
  if (gameRow.status !== 'active') return;
  await client.query(
    `UPDATE chess_games SET status = 'finished', result = $2, updated_at = NOW() WHERE id = $1`,
    [gameRow.id, result],
  );

  if (result === 'draw') {
    await incrementStats(client, gameRow.white_user_id, 'draws');
    await incrementStats(client, gameRow.black_user_id, 'draws');
    return;
  }

  const winner = result === 'white' ? gameRow.white_user_id : gameRow.black_user_id;
  const loser = result === 'white' ? gameRow.black_user_id : gameRow.white_user_id;
  await incrementStats(client, winner, 'wins');
  await incrementStats(client, loser, 'losses');
}

router.post('/join', requireAuth, async (request, response) => {
  await prepareSchema();
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    const activeGameId = await findActiveGame(client, request.user.sub);
    if (activeGameId) {
      await client.query('COMMIT');
      return response.json({ state: 'matched', game: await getGameState(db, activeGameId, request.user.sub) });
    }

    await client.query('DELETE FROM matchmaking_queue WHERE user_id = $1', [request.user.sub]);
    const opponent = await client.query(
      `SELECT q.user_id
       FROM matchmaking_queue q
       WHERE q.user_id <> $1
         AND NOT EXISTS (
           SELECT 1 FROM chess_games g
           WHERE g.status = 'active'
             AND (g.white_user_id = q.user_id OR g.black_user_id = q.user_id)
         )
       ORDER BY q.requested_at ASC
       FOR UPDATE SKIP LOCKED
       LIMIT 1`,
      [request.user.sub],
    );

    if (!opponent.rows[0]) {
      await client.query(
        `INSERT INTO matchmaking_queue (user_id, requested_at)
         VALUES ($1, NOW())
         ON CONFLICT (user_id) DO UPDATE SET requested_at = NOW()`,
        [request.user.sub],
      );
      await client.query('COMMIT');
      return response.json({ state: 'waiting' });
    }

    const opponentId = opponent.rows[0].user_id;
    await client.query('DELETE FROM matchmaking_queue WHERE user_id = $1', [opponentId]);
    const initialFen = new Chess().fen();
    const gameResult = await client.query(
      `INSERT INTO chess_games (white_user_id, black_user_id, fen)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [opponentId, request.user.sub, initialFen],
    );
    await client.query('COMMIT');
    return response.status(201).json({
      state: 'matched',
      game: await getGameState(db, gameResult.rows[0].id, request.user.sub),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Matchmaking join failed:', error.message);
    return response.status(500).json({ error: 'Unable to join matchmaking.' });
  } finally {
    client.release();
  }
});

router.post('/leave', requireAuth, async (request, response) => {
  await prepareSchema();
  try {
    await db.query('DELETE FROM matchmaking_queue WHERE user_id = $1', [request.user.sub]);
    return response.status(204).send();
  } catch (error) {
    console.error('Matchmaking leave failed:', error.message);
    return response.status(500).json({ error: 'Unable to leave matchmaking.' });
  }
});

router.get('/status', requireAuth, async (request, response) => {
  await prepareSchema();
  try {
    const activeGameId = await findActiveGame(db, request.user.sub);
    if (activeGameId) {
      return response.json({ state: 'matched', game: await getGameState(db, activeGameId, request.user.sub) });
    }
    const queueResult = await db.query(
      'SELECT requested_at FROM matchmaking_queue WHERE user_id = $1',
      [request.user.sub],
    );
    if (queueResult.rows[0]) {
      return response.json({ state: 'waiting', requestedAt: queueResult.rows[0].requested_at });
    }
    return response.json({ state: 'idle' });
  } catch (error) {
    console.error('Matchmaking status failed:', error.message);
    return response.status(500).json({ error: 'Unable to read matchmaking status.' });
  }
});

router.get('/games/:gameId', requireAuth, async (request, response) => {
  await prepareSchema();
  try {
    const game = await getGameState(db, request.params.gameId, request.user.sub);
    if (!game) return response.status(404).json({ error: 'Game not found.' });
    return response.json({ game });
  } catch (error) {
    console.error('Game lookup failed:', error.message);
    return response.status(500).json({ error: 'Unable to load the game.' });
  }
});

router.post('/games/:gameId/moves', requireAuth, async (request, response) => {
  await prepareSchema();
  const { from, to, promotion = 'q' } = request.body || {};
  if (!/^[a-h][1-8]$/.test(from || '') || !/^[a-h][1-8]$/.test(to || '')) {
    return response.status(400).json({ error: 'A valid source and target square are required.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT id, white_user_id, black_user_id, status, fen, result
       FROM chess_games
       WHERE id = $1 AND (white_user_id = $2 OR black_user_id = $2)
       FOR UPDATE`,
      [request.params.gameId, request.user.sub],
    );
    const gameRow = result.rows[0];
    if (!gameRow) {
      await client.query('ROLLBACK');
      return response.status(404).json({ error: 'Game not found.' });
    }
    if (gameRow.status !== 'active') {
      await client.query('ROLLBACK');
      return response.status(409).json({ error: 'This game has already ended.' });
    }

    const chess = new Chess(gameRow.fen);
    const expectedColor = chess.turn() === 'w' ? gameRow.white_user_id : gameRow.black_user_id;
    if (String(expectedColor) !== String(request.user.sub)) {
      await client.query('ROLLBACK');
      return response.status(403).json({ error: 'It is not your turn.' });
    }

    const move = chess.move({ from, to, promotion: String(promotion).toLowerCase() });
    if (!move) {
      await client.query('ROLLBACK');
      return response.status(400).json({ error: 'Illegal chess move.' });
    }

    const newFen = chess.fen();
    const ply = chess.history().length;
    let gameResult = null;
    if (chess.in_checkmate()) gameResult = chess.turn() === 'w' ? 'black' : 'white';
    if (!gameResult && chess.in_draw()) gameResult = 'draw';

    await client.query(
      `INSERT INTO chess_game_moves (game_id, ply, san, from_square, to_square, fen)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [gameRow.id, ply, move.san, move.from, move.to, newFen],
    );
    await client.query(
      `UPDATE chess_games SET fen = $2, updated_at = NOW() WHERE id = $1`,
      [gameRow.id, newFen],
    );
    if (gameResult) await finishGame(client, gameRow, gameResult);
    await client.query('COMMIT');
    return response.json({ game: await getGameState(db, gameRow.id, request.user.sub) });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Move submission failed:', error.message);
    return response.status(500).json({ error: 'Unable to submit the move.' });
  } finally {
    client.release();
  }
});

router.post('/games/:gameId/finish', requireAuth, async (request, response) => {
  await prepareSchema();
  const requestedResult = request.body?.result;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT id, white_user_id, black_user_id, status, result
       FROM chess_games
       WHERE id = $1 AND (white_user_id = $2 OR black_user_id = $2)
       FOR UPDATE`,
      [request.params.gameId, request.user.sub],
    );
    const gameRow = result.rows[0];
    if (!gameRow) {
      await client.query('ROLLBACK');
      return response.status(404).json({ error: 'Game not found.' });
    }
    if (gameRow.status !== 'active') {
      await client.query('ROLLBACK');
      return response.json({ game: await getGameState(db, gameRow.id, request.user.sub) });
    }

    let finalResult = requestedResult;
    if (requestedResult === 'resign') {
      finalResult = String(gameRow.white_user_id) === String(request.user.sub) ? 'black' : 'white';
    }
    if (!['draw', 'white', 'black'].includes(finalResult)) {
      await client.query('ROLLBACK');
      return response.status(400).json({ error: 'Unsupported game result.' });
    }
    await finishGame(client, gameRow, finalResult);
    await client.query('COMMIT');
    return response.json({ game: await getGameState(db, gameRow.id, request.user.sub) });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Game finish failed:', error.message);
    return response.status(500).json({ error: 'Unable to finish the game.' });
  } finally {
    client.release();
  }
});

module.exports = router;
