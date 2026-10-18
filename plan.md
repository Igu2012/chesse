# Chesse Implementation Plan

## Product scope

Chesse is a public-repository web chess application with a Node.js/Express backend, a static HTML/CSS/JavaScript frontend, Neon PostgreSQL persistence, username/password authentication, chess.js move validation, chessboard.js board rendering, player statistics, and a Render deployment definition. The application intentionally uses the existing `users` and `player_stats` tables and does not create migrations that could alter the user's shared database.

## Implementation approach

- Express serves the frontend from `public/` and exposes JSON routes under `/api`.
- PostgreSQL access uses the `pg` connection pool and the runtime-only `DATABASE_URL` environment variable.
- Passwords are hashed with bcryptjs before insertion and are never returned by API responses.
- A signed HTTP-only JWT cookie named `chesse_session` provides the application session. `COOKIE_SECURE=true` and `SameSite=None` support the HTTPS embedded preview and Render deployment; local HTTP development can set `COOKIE_SECURE=false`.
- The frontend uses pinned CDN builds of chess.js and chessboard.js. chess.js owns legal move validation, checkmate detection, and draw detection; chessboard.js owns board rendering and drag-and-drop interaction.
- A completed local game submits exactly one authenticated result to `POST /api/games/result`. The backend updates the logged-in player's row in `player_stats` inside a transaction.
- Render receives `render.yaml`, a production start script, a health route, and an optional Dockerfile. Secrets are configured in Render rather than committed to Git.

## Project structure

- `server.js`: Express application bootstrap, middleware, static hosting, and route registration.
- `src/db.js`: Neon-compatible PostgreSQL pool and query helper.
- `src/middleware/auth.js`: JWT cookie authentication middleware.
- `src/routes/auth.js`: signup, login, session lookup, and logout routes.
- `src/routes/stats.js`: authenticated statistics read and game-result update routes.
- `public/index.html`: authentication shell and post-login dashboard markup.
- `public/app.js`: API client, auth state, board lifecycle, and game result handling.
- `public/styles.css`: responsive visual system for the chess dashboard.
- `public/manus-routes.json`: route manifest for the managed preview.
- `render.yaml`: Render Blueprint for a Node web service and runtime environment variables.
- `Dockerfile`: portable production container definition.
- `README.md`: English setup, database, local development, and Render deployment instructions.

## Design direction

### Candidate styles

1. **Tournament editorial desk** — 0.07 probability: a quiet, paper-like board framed by dark ink panels and precise scorecard typography.
2. **Neon arena** — 0.04 probability: electric cyan and magenta accents over a deep graphite interface with energetic motion.
3. **Library clubroom** — 0.08 probability: warm walnut, parchment, and brass details with a calm club atmosphere.

### Selected style: Tournament editorial desk

- **Design movement:** Modern sports editorial with restrained Swiss-grid discipline and tactile scorecard details.
- **Core principles:** Legibility first, decisive contrast, compact information density, and visible game state.
- **Color philosophy:** Deep ink and warm ivory make the board feel authoritative, while a single green accent signals active play and successful outcomes.
- **Layout paradigm:** A left rail introduces the product and account context; the game board anchors the visual center; the scorecard rail keeps statistics and actions adjacent to play instead of below it.
- **Signature elements:** Hairline rules, numbered stat labels, and a small live-status marker that echoes tournament broadcast graphics.
- **Interaction philosophy:** Every action reports a clear state change. Illegal moves snap back without drama, completed games create a visible result panel, and authentication errors remain close to the relevant field.
- **Animation:** Use short 160–220ms fades and translate transitions for panels and status changes. Avoid continuous decorative animation so the board remains the focus.
- **Typography system:** Use `DM Sans` for interface text and `Space Grotesk` for headings and numerical stats, both loaded from Google Fonts in the public page.
- **Brand essence:** A focused chess desk for players who want a clean board and an honest record; precise, composed, competitive.
- **Brand voice:** Headlines are direct and editorial. Example lines: “Play the position in front of you.” and “Your record, kept in view.”
- **Wordmark and logo:** The wordmark uses a compact “C” monogram paired with a cut-out knight silhouette in the application header.
- **Signature brand color:** `#87d36b`, a fresh match-point green used for live state, primary actions, and positive results.

## Required behavior

The implementation preserves the requested username/password-only sign-in, bcrypt hashing, proven chess libraries, Neon-backed statistics updates after checkmate or draw, dashboard profile and stats, English-only repository documentation/comments, and a public GitHub repository without committed environment files.
