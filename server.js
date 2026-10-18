require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. Configure it before starting Chesse.');
  process.exit(1);
}

if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET is required. Configure it before starting Chesse.');
  process.exit(1);
}

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const db = require('./src/db');
const authRoutes = require('./src/routes/auth');
const statsRoutes = require('./src/routes/stats');
const multiplayerRoutes = require('./src/routes/multiplayer');

const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDirectory = path.join(__dirname, 'public');

app.disable('x-powered-by');
app.use(helmet({
  frameguard: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      formAction: ["'self'"],
      frameAncestors: ['*'],
      imgSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", 'https://code.jquery.com', 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
    },
  },
}));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

app.get('/api/health', (request, response) => {
  response.json({ status: 'ok', service: 'chesse' });
});

app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/matchmaking', multiplayerRoutes);
app.use('/api/multiplayer', multiplayerRoutes);

app.use(express.static(publicDirectory, { extensions: ['html'] }));

app.use((request, response, next) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return next();
  }

  if (request.path.startsWith('/api/')) {
    return next();
  }

  return response.sendFile(path.join(publicDirectory, 'index.html'));
});

app.use((request, response) => {
  response.status(404).json({ error: 'Route not found.' });
});

app.use((error, request, response, next) => {
  console.error('Unhandled application error:', error.message);
  response.status(500).json({ error: 'Unexpected server error.' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Chesse server listening on port ${port}.`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down Chesse.`);
  server.close(async () => {
    await db.pool.end();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
