# Chesse Implementation Plan

## Product scope

Chesse is a public-repository web chess application with a Node.js/Express backend, a static HTML/CSS/JavaScript frontend, Neon PostgreSQL persistence, username/password authentication, chess.js move validation, chessboard.js board rendering, player statistics, and a Render deployment definition. The application intentionally uses the existing `users` and `player_stats` tables and does not create migrations that could alter the user's shared database.

## Implementation approach

- Express serves the frontend from `public/` and exposes JSON routes under `/api`.
- PostgreSQL access uses the `pg` connection pool and the runtime-only `DATABASE_URL` environment variable.
- Passwords are hashed with bcryptjs before insertion and are never returned by API responses.
- A signed HTTP-only JWT cookie named `chesse_session` provides the application session. `COOKIE_SECURE=true` and `SameSite=None` support the HTTPS embedded preview and Render deployment; local HTTP development can set `COOKIE_SECURE=false`.
- The frontend uses a pinned CDN build of chess.js for rules and a local accessible board renderer with copied piece assets. Players select a source square and a target square, which avoids a fragile external drag-and-drop dependency.
- A completed local game submits exactly one authenticated result to `POST /api/games/result`. The backend updates the logged-in player's row in `player_stats` inside a transaction.
- Render receives `render.yaml`, a production start script, a health route, and an optional Dockerfile. Secrets are configured in Render rather than committed to Git.

## Project structure

- `server.js`: Express application bootstrap, middleware, static hosting, and route registration.
- `src/db.js`: Neon-compatible PostgreSQL pool and query helper.
- `src/middleware/auth.js`: JWT cookie authentication middleware.
- `src/routes/auth.js`: signup, login, session lookup, and logout routes.
- `src/routes/stats.js`: authenticated statistics read and game-result update routes.
- `src/routes/multiplayer.js`: persistent queue, match creation, game polling, server-side move validation, resign, draw, and result settlement.
- `public/index.html`: authentication shell and post-login dashboard markup.
- `public/app.js`: API client, auth state, matchmaking polling, synchronized board lifecycle, navigation sections, and game actions.
- `public/styles.css`: responsive visual system for the chess dashboard.
- `public/assets/chesspieces/wikipedia/`: local board piece images sourced from the supplied reference board.
- `public/assets/rat/`: local transparent SVG assets for the chubby rat full character and avatar.
- `public/manus-routes.json`: route manifest for the managed preview.
- `render.yaml`: Render Blueprint for a Node web service and runtime environment variables.
- `Dockerfile`: portable production container definition.
- `README.md`: English setup, database, local development, and Render deployment instructions.

## Design direction

### Candidate styles

1. **Dark competitive arena** — 0.07 probability: a Chess.com-inspired dark board room with compact navigation, active clocks, and bold yellow actions.
2. **Tournament editorial desk** — 0.04 probability: a quiet scorecard interface framed by dark panels and precise match typography.
3. **Library clubroom** — 0.08 probability: warm walnut, parchment, and brass details with a calm club atmosphere.

### Selected style: Dark competitive arena

- **Design movement:** Competitive product UI with Chess.com-inspired dark surfaces, compact controls, and clear game-state hierarchy.
- **Core principles:** Legibility first, decisive contrast, compact information density, and visible game state.
- **Color philosophy:** `#302e2c` anchors the play area, `#262522` contains global navigation, `#21201d` frames the move panel, and a warm pawn yellow carries primary actions and the brand.
- **Layout paradigm:** A fixed left navigation rail, central square board with player clocks, and right control panel create the requested three-column play room. On mobile, the rail becomes a bottom navigation and the right panel moves below the board.
- **Signature elements:** Yellow active states, round player avatars, digital clocks, move-number rows, and tabs for match, new game, and chat.
- **Interaction philosophy:** Every action reports a clear state change. Illegal moves snap back, clocks follow the side to move, completed games update the record, and tabs expose focused controls without leaving the board.
- **Animation:** Use short 160–220ms transitions for menu drawers, buttons, and active states. Avoid decorative motion so the board and clocks remain the focus.
- **Typography system:** Use Inter with strong weights for interface text, clocks, headings, and navigation.
- **Brand essence:** A focused chess desk for players who want a clean board and an honest record; direct, competitive, unmistakable.
- **Brand voice:** Navigation is concise and action-led. Example labels: “Jogar” and “Nova partida”.
- **Wordmark and logo:** The header uses the supplied golden pawn image as the brand mark beside the CHESSE wordmark and as the favicon.
- **Signature brand color:** Warm pawn yellow `#f0b90b`, with `#ffd45b` for hover and focus feedback.

## Required behavior

The implementation preserves the requested username/password-only sign-in, bcrypt hashing, proven chess libraries, Neon-backed statistics updates after checkmate or draw, dashboard profile and stats, persistent real-player matchmaking, server-authoritative move validation, English-only repository documentation/comments, and a public GitHub repository without committed environment files.

## Expansion architecture

- Local practice uses chess.js in the browser plus a small deterministic material-aware minimax opponent. No practice position or AI move is sent to the server; the device performs the practice computation locally.
- Problems use browser-local puzzle positions with legal-move validation, solution hints, and a progress counter stored in localStorage.
- Public watching uses a read-only API for active games and a polling spectator board. Spectators never receive move permissions and cannot change game state.
- User profiles are stored in a new `user_profiles` table keyed by the existing user id. It contains display name, bio, locale, and rat customization fields without changing the existing tables.
- Match history is read from completed `chess_games` and exposes opponent, result, color, move count, and completion time through an authenticated API route.
- Internationalization is client-side and automatic from `navigator.language`, with English as the fallback and Portuguese, Spanish, French, and German dictionaries for all visible interface strings.
- The rat mascot is an original transparent asset with a full-body profile presentation and a circular avatar variant. Customization changes the rat palette, accessory, and display mode while preserving the recognizable silhouette.
