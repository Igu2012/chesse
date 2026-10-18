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
  topbarAvatar: document.querySelector('#topbar-avatar'),
  boardUsername: document.querySelector('#board-username'),
  boardAvatar: document.querySelector('#board-avatar'),
  sidebarRating: document.querySelector('#sidebar-rating'),
  boardRating: document.querySelector('#board-rating'),
  gameStatus: document.querySelector('#game-status'),
  panelStatusText: document.querySelector('#panel-status-text'),
  playerClock: document.querySelector('#player-clock'),
  opponentClock: document.querySelector('#opponent-clock'),
  moveList: document.querySelector('#move-list'),
  moveCount: document.querySelector('#move-count'),
  logoutButton: document.querySelector('#logout-button'),
  newGameButton: document.querySelector('#new-game-button'),
  newGameFromPanel: document.querySelector('#new-game-from-panel'),
  drawButton: document.querySelector('#draw-button'),
  resignButton: document.querySelector('#resign-button'),
  flipBoardButton: document.querySelector('#flip-board-button'),
  mobileMenuButton: document.querySelector('#mobile-menu-button'),
  sidebar: document.querySelector('.global-sidebar'),
};

let authMode = 'login';
let board = null;
let game = null;
let terminalSubmitted = false;
let playerSeconds = 600;
let opponentSeconds = 600;
let clockInterval = null;

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

function formatClock(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function updateClocks() {
  elements.playerClock.textContent = formatClock(playerSeconds);
  elements.opponentClock.textContent = formatClock(opponentSeconds);
  const whiteToMove = game && game.turn() === 'w';
  elements.playerClock.classList.toggle('active', Boolean(whiteToMove));
  elements.opponentClock.classList.toggle('active', Boolean(game && !whiteToMove));
}

function stopClock() {
  window.clearInterval(clockInterval);
  clockInterval = null;
}

function startClock() {
  stopClock();
  clockInterval = window.setInterval(() => {
    if (!game || game.game_over() || terminalSubmitted) return;
    if (game.turn() === 'w') {
      playerSeconds = Math.max(0, playerSeconds - 1);
    } else {
      opponentSeconds = Math.max(0, opponentSeconds - 1);
    }
    updateClocks();
    if (playerSeconds === 0 || opponentSeconds === 0) {
      const result = playerSeconds === 0 ? 'loss' : 'win';
      submitManualResult(result, result === 'win' ? 'Oponente ficou sem tempo.' : 'Seu tempo acabou.');
    }
  }, 1000);
}

function setStats(stats) {
  const rating = Number(stats.current_rating);
  elements.sidebarRating.textContent = `${rating} rating`;
  elements.boardRating.textContent = rating;
}

function showDashboard(payload) {
  elements.authView.classList.add('is-hidden');
  elements.dashboardView.classList.remove('is-hidden');
  const username = payload.user.username;
  const initial = username.charAt(0).toUpperCase();
  elements.profileUsername.textContent = username;
  elements.topbarUsername.textContent = username.toUpperCase();
  elements.topbarAvatar.textContent = initial;
  elements.profileAvatar.textContent = initial;
  elements.boardUsername.textContent = username;
  elements.boardAvatar.textContent = initial;
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
  elements.authSubtitle.textContent = isSignup ? 'Start a record that stays in view.' : 'Keep your board and record in one place.';
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
  const credentials = { username: formData.get('username'), password: formData.get('password') };

  try {
    const payload = await api(`/api/auth/${authMode === 'signup' ? 'signup' : 'login'}`, { method: 'POST', body: JSON.stringify(credentials) });
    const session = await api('/api/auth/me');
    showDashboard(session || payload);
  } catch (error) {
    setAuthMessage(error.message);
  } finally {
    elements.authSubmit.disabled = false;
  }
}

function isPlayersTurn(piece) {
  return (game.turn() === 'w' && piece.search(/^b/) !== -1) || (game.turn() === 'b' && piece.search(/^w/) !== -1);
}

function onDragStart(source, piece) {
  return !game.game_over() && !isPlayersTurn(piece);
}

function onDrop(source, target) {
  const move = game.move({ from: source, to: target, promotion: 'q' });
  if (move === null) return 'snapback';
  board.position(game.fen());
  renderMoves();
  updateGameStatus();
  return undefined;
}

function onSnapEnd() {
  board.position(game.fen());
}

function renderMoves() {
  const history = game.history();
  elements.moveCount.textContent = Math.ceil(history.length / 2);
  if (!history.length) {
    elements.moveList.innerHTML = '<p class="empty-state">Faça seu primeiro lance para começar.</p>';
    return;
  }
  elements.moveList.innerHTML = '';
  for (let index = 0; index < history.length; index += 2) {
    const row = document.createElement('div');
    row.className = 'move-row';
    row.innerHTML = `<span class="move-number">${(index / 2) + 1}.</span><span class="move-san">${history[index] || '—'}</span><span class="move-san">${history[index + 1] || '—'}</span>`;
    elements.moveList.appendChild(row);
  }
  elements.moveList.scrollTop = elements.moveList.scrollHeight;
}

function getTerminalState() {
  if (game.in_checkmate()) {
    const winner = game.turn() === 'w' ? 'Black' : 'White';
    return { result: winner === 'White' ? 'win' : 'loss', status: `${winner} vence por xeque-mate`, state: 'Xeque-mate' };
  }
  if (game.in_draw()) {
    let reason = 'Empate';
    if (game.in_stalemate()) reason = 'Afogamento';
    if (game.in_threefold_repetition()) reason = 'Repetição tripla';
    if (game.insufficient_material()) reason = 'Material insuficiente';
    if (game.isDrawByFiftyMoves && game.isDrawByFiftyMoves()) reason = 'Regra dos 50 lances';
    return { result: 'draw', status: `${reason} declarado`, state: 'Empate' };
  }
  return null;
}

async function submitManualResult(result, message) {
  if (terminalSubmitted) return;
  terminalSubmitted = true;
  stopClock();
  elements.gameStatus.textContent = message;
  elements.panelStatusText.textContent = 'Salvando resultado...';
  try {
    const payload = await api('/api/games/result', { method: 'POST', body: JSON.stringify({ result }) });
    setStats(payload.stats);
    elements.panelStatusText.textContent = 'Resultado salvo no seu perfil';
  } catch (error) {
    terminalSubmitted = false;
    elements.panelStatusText.textContent = error.message;
  }
}

function updateGameStatus() {
  const terminal = getTerminalState();
  if (terminal) {
    stopClock();
    elements.gameStatus.textContent = terminal.status;
    elements.panelStatusText.textContent = `${terminal.state} • Salvando resultado...`;
    submitManualResult(terminal.result, terminal.status);
    updateClocks();
    return;
  }
  const turn = game.turn() === 'w' ? 'Brancas' : 'Pretas';
  const inCheck = game.in_check();
  elements.gameStatus.textContent = inCheck ? `${turn} em xeque` : `${turn} jogam`;
  elements.panelStatusText.textContent = inCheck ? `${turn} precisam responder ao xeque` : `Aguardando as ${turn.toLowerCase()}`;
  updateClocks();
}

function startGame() {
  stopClock();
  game = new Chess();
  terminalSubmitted = false;
  playerSeconds = 600;
  opponentSeconds = 600;
  if (board) board.destroy();
  board = Chessboard('board', {
    draggable: true,
    position: game.fen(),
    pieceTheme: 'https://cdnjs.cloudflare.com/ajax/libs/chessboard.js/1.0.0/img/chesspieces/wikipedia/{piece}.png',
    onDragStart,
    onDrop,
    onSnapEnd,
  });
  renderMoves();
  updateGameStatus();
  startClock();
}

function setPanel(panelName) {
  document.querySelectorAll('.panel-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.panel === panelName));
  document.querySelectorAll('.panel-view').forEach((panel) => panel.classList.toggle('active', panel.id === `${panelName}-panel`));
}

async function logout() {
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } finally {
    stopClock();
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

document.querySelectorAll('.tab-button').forEach((button) => button.addEventListener('click', () => switchAuthMode(button.dataset.mode)));
document.querySelectorAll('.panel-tab').forEach((button) => button.addEventListener('click', () => setPanel(button.dataset.panel)));
document.querySelectorAll('.nav-item, .bottom-nav button').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.nav-item, .bottom-nav button').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  elements.sidebar.classList.remove('open');
}));
elements.authForm.addEventListener('submit', submitAuth);
elements.logoutButton.addEventListener('click', logout);
elements.newGameButton.addEventListener('click', startGame);
elements.newGameFromPanel.addEventListener('click', () => { startGame(); setPanel('match'); });
elements.drawButton.addEventListener('click', () => submitManualResult('draw', 'Empate oferecido'));
elements.resignButton.addEventListener('click', () => submitManualResult('loss', 'Você desistiu da partida'));
elements.flipBoardButton.addEventListener('click', () => board && board.flip());
elements.mobileMenuButton.addEventListener('click', () => elements.sidebar.classList.toggle('open'));
bootstrap();
