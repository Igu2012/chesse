const elements = {
  authForm: document.querySelector('#auth-form'),
  authMessage: document.querySelector('#auth-message'),
  authSubmit: document.querySelector('#auth-submit'),
  authTitle: document.querySelector('#auth-title'),
  authSubtitle: document.querySelector('#auth-subtitle'),
  authEyebrow: document.querySelector('#auth-eyebrow'),
  password: document.querySelector('#password'),
  passwordHint: document.querySelector('#password-hint'),
  authView: document.querySelector('#auth-view'),
  dashboardView: document.querySelector('#dashboard-view'),
  profileUsername: document.querySelector('#profile-username'),
  profileAvatar: document.querySelector('#profile-avatar'),
  topbarUsername: document.querySelector('#topbar-username'),
  ratingNumber: document.querySelector('#rating-number'),
  winsStat: document.querySelector('#wins-stat'),
  lossesStat: document.querySelector('#losses-stat'),
  drawsStat: document.querySelector('#draws-stat'),
  gameStatus: document.querySelector('#game-status'),
  turnReport: document.querySelector('#turn-report'),
  stateReport: document.querySelector('#state-report'),
  gameMessage: document.querySelector('#game-message'),
  logoutButton: document.querySelector('#logout-button'),
  newGameButton: document.querySelector('#new-game-button'),
};

let authMode = 'login';
let board = null;
let game = null;
let terminalSubmitted = false;

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || 'The request could not be completed.');
  }

  return payload;
}

function setAuthMessage(message = '', isError = true) {
  elements.authMessage.textContent = message;
  elements.authMessage.classList.toggle('is-error', Boolean(message) && isError);
  elements.authMessage.classList.toggle('is-success', Boolean(message) && !isError);
}

function setGameMessage(message, isError = false) {
  elements.gameMessage.textContent = message;
  elements.gameMessage.classList.toggle('is-error', isError);
}

function setStats(stats) {
  elements.winsStat.textContent = stats.wins;
  elements.lossesStat.textContent = stats.losses;
  elements.drawsStat.textContent = stats.draws;
  elements.ratingNumber.textContent = stats.current_rating;
}

function showDashboard(payload) {
  elements.authView.classList.add('is-hidden');
  elements.dashboardView.classList.remove('is-hidden');
  const username = payload.user.username;
  elements.profileUsername.textContent = username;
  elements.topbarUsername.textContent = username.toUpperCase();
  elements.profileAvatar.textContent = username.charAt(0).toUpperCase();
  setStats(payload.stats);
  startGame();
}

function showAuth() {
  elements.dashboardView.classList.add('is-hidden');
  elements.authView.classList.remove('is-hidden');
}

function switchAuthMode(mode) {
  authMode = mode;
  const isSignup = mode === 'signup';
  document.querySelectorAll('.tab-button').forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  elements.authEyebrow.textContent = isSignup ? 'JOIN THE DESK' : 'WELCOME BACK';
  elements.authTitle.textContent = isSignup ? 'Create your player desk' : 'Sign in to your desk';
  elements.authSubtitle.textContent = isSignup
    ? 'Start a record that stays in view.'
    : 'Keep your board and record in one place.';
  elements.authSubmit.innerHTML = `${isSignup ? 'Create account' : 'Sign in'} <span aria-hidden="true">↗</span>`;
  elements.password.autocomplete = isSignup ? 'new-password' : 'current-password';
  elements.passwordHint.textContent = isSignup ? 'Use at least 8 characters.' : 'Your password is never stored in plain text.';
  setAuthMessage('');
}

async function submitAuth(event) {
  event.preventDefault();
  setAuthMessage('');
  elements.authSubmit.disabled = true;
  const formData = new FormData(elements.authForm);
  const credentials = {
    username: formData.get('username'),
    password: formData.get('password'),
  };

  try {
    const payload = await api(`/api/auth/${authMode === 'signup' ? 'signup' : 'login'}`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const session = await api('/api/auth/me');
    showDashboard(session || payload);
  } catch (error) {
    setAuthMessage(error.message);
  } finally {
    elements.authSubmit.disabled = false;
  }
}

function isPlayersTurn(piece) {
  return (game.turn() === 'w' && piece.search(/^b/) !== -1)
    || (game.turn() === 'b' && piece.search(/^w/) !== -1);
}

function onDragStart(source, piece) {
  return !game.game_over() && !isPlayersTurn(piece);
}

function onDrop(source, target) {
  const move = game.move({
    from: source,
    to: target,
    promotion: 'q',
  });

  if (move === null) {
    return 'snapback';
  }

  board.position(game.fen());
  updateGameStatus();
  return undefined;
}

function onSnapEnd() {
  board.position(game.fen());
}

function getTerminalState() {
  if (game.in_checkmate()) {
    const winner = game.turn() === 'w' ? 'Black' : 'White';
    return {
      result: winner === 'White' ? 'win' : 'loss',
      status: `${winner} wins by checkmate`,
      state: 'Checkmate',
    };
  }

  if (game.in_draw()) {
    let reason = 'Draw';
    if (game.in_stalemate()) reason = 'Stalemate';
    if (game.in_threefold_repetition()) reason = 'Threefold repetition';
    if (game.insufficient_material()) reason = 'Insufficient material';
    if (game.isDrawByFiftyMoves && game.isDrawByFiftyMoves()) reason = 'Fifty-move rule';
    return { result: 'draw', status: `${reason} declared`, state: 'Draw' };
  }

  return null;
}

async function submitGameResult(terminal) {
  if (terminalSubmitted) return;
  terminalSubmitted = true;
  try {
    const payload = await api('/api/games/result', {
      method: 'POST',
      body: JSON.stringify({ result: terminal.result }),
    });
    setStats(payload.stats);
    setGameMessage(`${terminal.status}. Your record is updated.`);
  } catch (error) {
    terminalSubmitted = false;
    setGameMessage(error.message, true);
  }
}

function updateGameStatus() {
  const terminal = getTerminalState();

  if (terminal) {
    elements.gameStatus.textContent = terminal.status;
    elements.turnReport.textContent = game.turn() === 'w' ? 'White' : 'Black';
    elements.stateReport.textContent = terminal.state;
    setGameMessage(`${terminal.status}. Saving the result...`);
    submitGameResult(terminal);
    return;
  }

  const turn = game.turn() === 'w' ? 'White' : 'Black';
  elements.gameStatus.textContent = `${turn} to move`;
  elements.turnReport.textContent = turn;
  elements.stateReport.textContent = game.in_check() ? 'Check' : 'In play';
  setGameMessage(game.in_check() ? `${turn} is in check.` : 'Drag a piece to make your move.');
}

function startGame() {
  game = new Chess();
  terminalSubmitted = false;
  if (board) board.destroy();
  board = Chessboard('board', {
    draggable: true,
    position: game.fen(),
    pieceTheme: 'https://cdnjs.cloudflare.com/ajax/libs/chessboard.js/1.0.0/img/chesspieces/wikipedia/{piece}.png',
    onDragStart,
    onDrop,
    onSnapEnd,
  });
  updateGameStatus();
}

async function logout() {
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } finally {
    if (board) board.destroy();
    board = null;
    game = null;
    showAuth();
    elements.authForm.reset();
    switchAuthMode('login');
  }
}

async function bootstrap() {
  try {
    const session = await api('/api/auth/me');
    showDashboard(session);
  } catch (error) {
    showAuth();
  }
}

document.querySelectorAll('.tab-button').forEach((button) => {
  button.addEventListener('click', () => switchAuthMode(button.dataset.mode));
});
elements.authForm.addEventListener('submit', submitAuth);
elements.logoutButton.addEventListener('click', logout);
elements.newGameButton.addEventListener('click', startGame);
bootstrap();
