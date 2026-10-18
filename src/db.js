const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required before starting the server.');
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: databaseUrl.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined,
});

let schemaPromise = null;

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

function ensureMultiplayerSchema() {
  if (!schemaPromise) {
    schemaPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS matchmaking_queue (
        user_id BIGINT PRIMARY KEY,
        requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chess_games (
        id BIGSERIAL PRIMARY KEY,
        white_user_id BIGINT NOT NULL,
        black_user_id BIGINT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        fen TEXT NOT NULL,
        result VARCHAR(20),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chess_game_moves (
        id BIGSERIAL PRIMARY KEY,
        game_id BIGINT NOT NULL,
        ply INTEGER NOT NULL,
        san VARCHAR(32) NOT NULL,
        from_square VARCHAR(2) NOT NULL,
        to_square VARCHAR(2) NOT NULL,
        fen TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS chess_games_white_user_idx ON chess_games (white_user_id, status);
      CREATE INDEX IF NOT EXISTS chess_games_black_user_idx ON chess_games (black_user_id, status);
      CREATE INDEX IF NOT EXISTS chess_game_moves_game_idx ON chess_game_moves (game_id, ply);
    `).catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  return schemaPromise;
}

module.exports = {
  pool,
  ensureMultiplayerSchema,
  query(text, values) {
    return pool.query(text, values);
  },
};
