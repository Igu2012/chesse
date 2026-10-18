# Chesse Delivery TODO

## 1. Deliver a complete runnable web application

- [x] The repository contains a complete working boilerplate with a Node.js/Express backend and a static HTML/CSS/JavaScript frontend.
- [x] The project includes a clear architecture, production start script, health route, and Render deployment configuration.
- [x] All documentation, logs, variable names, and code comments are written in English.

## 2. Connect safely to the existing Neon PostgreSQL database

- [x] The backend reads the Neon connection string from the runtime-only `DATABASE_URL` environment variable.
- [x] The implementation uses the existing `users` and `player_stats` tables without committing a secret or an environment file to the public repository.
- [x] The README explains where to configure the exact Neon connection string for local development and Render.

## 3. Provide username/password authentication

- [x] Users can sign up and log in with only a username and password.
- [x] Passwords are hashed with bcrypt before storage and plaintext passwords are never returned.
- [x] Authenticated requests use an HTTP-only signed session cookie.
- [x] Users can log out and unauthenticated API requests receive a clear 401 response.

## 4. Provide a proven-library chess game

- [x] The dashboard renders a visible, accessible board with local piece assets and click-to-move interaction.
- [x] chess.js validates moves and owns the game state.
- [x] Checkmate, stalemate, threefold repetition, insufficient material, and the fifty-move rule are handled as draw or win/loss terminal states.
- [x] A new-game action resets the board and result state.

## 5. Persist completed-game statistics

- [x] When a game ends by checkmate or draw, the frontend calls the authenticated backend game-result route.
- [x] The backend increments `wins`, `losses`, or `draws` for the logged-in user in `player_stats` using a transaction.
- [x] Duplicate frontend terminal events are prevented for the same game.

## 6. Deliver real-player matchmaking and synchronized games

- [x] The primary Play action enters the authenticated player into a persistent Neon-backed matchmaking queue.
- [x] A waiting player remains in the queue until another eligible authenticated player joins, then both players receive the same game id.
- [x] The server creates `chess_games` and `chess_game_moves` tables idempotently without changing the existing user tables.
- [x] The backend validates turn ownership and every move with chess.js before saving the new FEN and move history.
- [x] Both browsers poll the authoritative game state and see new moves, game completion, resignation, draws, and updated results.

## 7. Make the dashboard navigation usable

- [x] The Play, Problems, Learn, Watch, and Community navigation items switch to working application sections.
- [x] Mobile navigation remains available through the bottom navigation bar.
- [x] The Play screen exposes queue status, leave-queue control, move history, match tabs, and game actions.

## 8. Deliver the post-login dashboard

- [x] The dashboard displays the player's username and current rating.
- [x] The dashboard fetches and displays wins, losses, and draws from Neon.
- [x] The current board, move status, game result, and statistics are visible in one responsive screen.

## 9. Publish the source repository

- [x] Push the accepted project to a public GitHub repository named `chesse` after the owner confirms the GitHub target.
- [x] Do not commit `.env`, `.env.*`, credentials, or other runtime secrets.
- [x] Provide an easy English deployment README for Render.
