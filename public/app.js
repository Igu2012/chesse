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
  queueStatus: document.querySelector('#queue-status'),
  leaveQueueButton: document.querySelector('#leave-queue-button'),
  sectionView: document.querySelector('#section-view'),
  sectionEyebrow: document.querySelector('#section-eyebrow'),
  sectionTitle: document.querySelector('#section-title'),
  sectionCopy: document.querySelector('#section-copy'),
  sectionContent: document.querySelector('#section-content'),
  playPage: document.querySelector('.play-page'),
  playEyebrow: document.querySelector('#play-eyebrow'),
  playTitle: document.querySelector('#play-title'),
  gameActions: document.querySelector('#game-actions'),
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
let boardElement = document.querySelector('#board');
let game = null;
let currentGameId = null;
let currentGameState = null;
let movePending = false;
let matchmakingTimer = null;
let gamePollingTimer = null;
let boardOrientation = 'white';
let selectedSquare = null;
let legalTargets = [];

const pieceAssets = '/assets/chesspieces/wikipedia';

const sectionData = {
  problems: {
    eyebrow: 'TREINO DIÁRIO',
    title: 'Problemas',
    copy: 'Pratique posições selecionadas e transforme seus padrões em decisões rápidas.',
    content: '<div class="feature-card"><span class="feature-icon">♞</span><h2>Problemas em breve</h2><p>O próximo módulo vai trazer posições táticas com solução passo a passo e acompanhamento de progresso.</p><button class="button button-primary" type="button" data-section="play">Voltar para jogar <span>→</span></button></div>',
  },
  learn: {
    eyebrow: 'CENTRO DE APRENDIZADO',
    title: 'Aprender',
    copy: 'Construa uma base melhor com princípios que você pode aplicar na próxima partida.',
    content: '<div class="learning-grid"><div class="feature-card"><span class="feature-kicker">01 / ABERTURA</span><h2>Controle o centro</h2><p>Comece disputando as casas centrais e desenvolva suas peças menores antes de mover a mesma peça várias vezes.</p></div><div class="feature-card"><span class="feature-kicker">02 / SEGURANÇA</span><h2>Faça o roque</h2><p>Coloque o rei em segurança e conecte as torres antes de iniciar um ataque no centro.</p></div></div>',
  },
  watch: {
    eyebrow: 'PARTIDAS AO VIVO',
    title: 'Assistir',
    copy: 'Acompanhe o espaço onde as partidas públicas poderão aparecer quando houver espectadores.',
    content: '<div class="feature-card"><span class="feature-icon">◉</span><h2>Nenhuma partida pública agora</h2><p>Quando a comunidade estiver jogando, as partidas em andamento poderão ser acompanhadas aqui.</p><button class="button button-primary" type="button" data-section="play">Encontrar uma partida <span>→</span></button></div>',
  },
  community: {
    eyebrow: 'SUA COMUNIDADE',
    title: 'Comunidade',
    copy: 'Seu perfil, seu rating e o histórico que você constrói a cada partida.',
    content: '<div class="feature-card"><span class="feature-icon">♙</span><h2>Perfil do jogador</h2><p>Use o matchmaking para criar seu histórico real contra outros jogadores. Suas estatísticas são atualizadas pelo servidor ao final da partida.</p><button class="button button-primary" type="button" data-section="play">Jogar agora <span>→</span></button></div>',
  },
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(payload?.error || 'The request could not be completed.');
  return payload;
}

function setAuthMessage(message = '', isError = true) {
  elements.authMessage.textContent = message;
  elements.authMessage.classList.toggle('is-error', Boolean(message) && isError);
  elements.authMessage.classList.toggle('is-success', Boolean(message) && !isError);
}

function setStats(stats) {
  const rating = Number(stats.current_rating);
  elements.sidebarRating.textContent = `${rating} rating`;
  elements.boardRating.textContent = rating;
}

function setQueueStatus(message, waiting = false) {
  elements.queueStatus.textContent = message;
  elements.leaveQueueButton.classList.toggle('is-hidden', !waiting);
  elements.newGameFromPanel.disabled = waiting;
  elements.newGameButton.disabled = waiting;
  elements.newGameFromPanel.innerHTML = waiting ? 'Procurando adversário…' : 'Encontrar adversário <span>→</span>';
  elements.newGameButton.innerHTML = waiting ? 'Na fila…' : 'Encontrar adversário <span>→</span>';
}

function formatMoves(moves) {
  elements.moveCount.textContent = Math.ceil(moves.length / 2);
  if (!moves.length) {
    elements.moveList.innerHTML = '<p class="empty-state">Faça seu primeiro lance para começar.</p>';
    return;
  }
  elements.moveList.innerHTML = '';
  for (let index = 0; index < moves.length; index += 2) {
    const row = document.createElement('div');
    row.className = 'move-row';
    row.innerHTML = `<span class="move-number">${(index / 2) + 1}.</span><span class="move-san">${moves[index]?.san || '—'}</span><span class="move-san">${moves[index + 1]?.san || '—'}</span>`;
    elements.moveList.appendChild(row);
  }
  elements.moveList.scrollTop = elements.moveList.scrollHeight;
}

function setClockDisplay(seconds, element) {
  const safeSeconds = Math.max(0, Number(seconds) || 600);
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
  const remainder = (safeSeconds % 60).toString().padStart(2, '0');
  element.textContent = `${minutes}:${remainder}`;
}

function renderBoard() {
  if (!boardElement || !game) return;
  const files = boardOrientation === 'white' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
  const ranks = boardOrientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  boardElement.innerHTML = '';
  boardElement.setAttribute('aria-label', 'Chess board');

  ranks.forEach((rank, rankIndex) => {
    files.forEach((file, fileIndex) => {
      const square = `${file}${rank}`;
      const piece = game.get(square);
      const isLight = (file.charCodeAt(0) - 97 + rank) % 2 === 0;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `board-square ${isLight ? 'square-light' : 'square-dark'}`;
      button.dataset.square = square;
      button.setAttribute('aria-label', square);
      if (square === selectedSquare) button.classList.add('square-selected');
      if (legalTargets.includes(square)) button.classList.add('square-legal');
      if (fileIndex === 0) {
        const rankLabel = document.createElement('span');
        rankLabel.className = 'board-rank-label';
        rankLabel.textContent = rank;
        button.appendChild(rankLabel);
      }
      if (rankIndex === 7) {
        const fileLabel = document.createElement('span');
        fileLabel.className = 'board-file-label';
        fileLabel.textContent = file;
        button.appendChild(fileLabel);
      }
      if (piece) {
        const image = document.createElement('img');
        image.className = 'board-piece';
        image.src = `${pieceAssets}/${piece.color}${piece.type.toUpperCase()}.png`;
        image.alt = `${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}`;
        button.appendChild(image);
      }
      button.addEventListener('click', () => handleSquareClick(square));
      boardElement.appendChild(button);
    });
  });
}

function canPlaySquare(square) {
  if (!currentGameState || currentGameState.status !== 'active' || movePending) return false;
  const turnColor = game.turn() === 'w' ? 'white' : 'black';
  if (turnColor !== currentGameState.playerColor) return false;
  const piece = game.get(square);
  return Boolean(piece && piece.color === game.turn());
}

function handleSquareClick(square) {
  if (!currentGameState || currentGameState.status !== 'active' || movePending) return;
  if (selectedSquare && legalTargets.includes(square)) {
    const from = selectedSquare;
    selectedSquare = null;
    legalTargets = [];
    renderBoard();
    submitMove(from, square);
    return;
  }
  if (canPlaySquare(square)) {
    selectedSquare = square;
    legalTargets = game.moves({ square, verbose: true }).map((move) => move.to);
  } else {
    selectedSquare = null;
    legalTargets = [];
  }
  renderBoard();
}

function updateBoardStatus() {
  if (!currentGameState || !game) {
    elements.gameStatus.textContent = 'Entre na fila para jogar';
    elements.panelStatusText.textContent = 'Aguardando você entrar no matchmaking';
    return;
  }
  if (currentGameState.status === 'finished') {
    const result = currentGameState.result === 'draw'
      ? 'Empate'
      : currentGameState.result === currentGameState.playerColor ? 'Você venceu' : 'Você perdeu';
    elements.gameStatus.textContent = result;
    elements.panelStatusText.textContent = `${result} • Partida encerrada`;
    return;
  }
  const turnColor = game.turn() === 'w' ? 'white' : 'black';
  const yourTurn = turnColor === currentGameState.playerColor;
  const label = turnColor === 'white' ? 'Brancas' : 'Pretas';
  elements.gameStatus.textContent = yourTurn ? 'Sua vez' : `Aguardando ${label.toLowerCase()}`;
  elements.panelStatusText.textContent = yourTurn ? 'Sua vez de jogar' : 'Aguardando o adversário';
}

function setIdleBoard() {
  currentGameId = null;
  currentGameState = null;
  movePending = false;
  boardOrientation = 'white';
  selectedSquare = null;
  legalTargets = [];
  game = new Chess();
  renderBoard();
  formatMoves([]);
  setClockDisplay(600, elements.playerClock);
  setClockDisplay(600, elements.opponentClock);
  elements.playerClock.classList.add('active');
  elements.opponentClock.classList.remove('active');
  elements.gameActions.classList.add('is-hidden');
  elements.playEyebrow.textContent = 'JOGAR / ENCONTRE UM ADVERSÁRIO';
  elements.playTitle.textContent = 'Jogar contra alguém';
  updateBoardStatus();
  setQueueStatus('Você ainda não está na fila.');
  setPanel('new-game');
}

function showDashboard(payload) {
  elements.authView.classList.add('is-hidden');
  elements.dashboardView.classList.remove('is-hidden');
  const username = payload.user.username;
  const initial = username.charAt(0).toUpperCase();
  elements.profileUsername.textContent = username;
  elements.topbarUsername.textContent = username.toUpperCase();
  document.querySelector('#topbar-avatar').textContent = initial;
  elements.profileAvatar.textContent = initial;
  elements.boardUsername.textContent = username;
  elements.boardAvatar.textContent = initial;
  setStats(payload.stats);
  setIdleBoard();
  showSection('play');
  pollMatchmakingStatus();
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
  try {
    await api(`/api/auth/${authMode === 'signup' ? 'signup' : 'login'}`, {
      method: 'POST',
      body: JSON.stringify({ username: formData.get('username'), password: formData.get('password') }),
    });
    showDashboard(await api('/api/auth/me'));
  } catch (error) {
    setAuthMessage(error.message);
  } finally {
    elements.authSubmit.disabled = false;
  }
}

async function submitMove(from, to) {
  movePending = true;
  try {
    const payload = await api(`/api/multiplayer/games/${currentGameId}/moves`, {
      method: 'POST',
      body: JSON.stringify({ from, to, promotion: 'q' }),
    });
    applyGameState(payload.game);
  } catch (error) {
    elements.panelStatusText.textContent = error.message;
  } finally {
    movePending = false;
  }
}

function applyGameState(gameState) {
  currentGameState = gameState;
  currentGameId = gameState.id;
  game = new Chess(gameState.fen);
  boardOrientation = gameState.playerColor;
  selectedSquare = null;
  legalTargets = [];
  renderBoard();
  formatMoves(gameState.moves || []);
  updateBoardStatus();
  setQueueStatus('Partida encontrada.', false);
  elements.gameActions.classList.remove('is-hidden');
  elements.playEyebrow.textContent = 'PARTIDA AO VIVO';
  elements.playTitle.textContent = 'Partida em andamento';
  if (gameState.status === 'finished') stopGamePolling();
}

async function syncGame() {
  if (!currentGameId || movePending) return;
  try {
    const payload = await api(`/api/multiplayer/games/${currentGameId}`);
    applyGameState(payload.game);
  } catch (error) {
    elements.panelStatusText.textContent = error.message;
  }
}

function startGamePolling() {
  stopGamePolling();
  gamePollingTimer = window.setInterval(syncGame, 1400);
}

function stopGamePolling() {
  window.clearInterval(gamePollingTimer);
  gamePollingTimer = null;
}

function stopMatchmakingPolling() {
  window.clearInterval(matchmakingTimer);
  matchmakingTimer = null;
}

async function handleMatchmakingStatus(payload) {
  if (payload.state === 'matched') {
    stopMatchmakingPolling();
    applyGameState(payload.game);
    setPanel('match');
    startGamePolling();
    return;
  }
  if (payload.state === 'waiting') {
    setQueueStatus('Na fila. Procurando um adversário real…', true);
    return;
  }
  setQueueStatus('Você ainda não está na fila.');
}

async function pollMatchmakingStatus() {
  try {
    const payload = await api('/api/matchmaking/status');
    await handleMatchmakingStatus(payload);
    if (payload.state === 'waiting' && !matchmakingTimer) {
      matchmakingTimer = window.setInterval(async () => {
        try {
          await handleMatchmakingStatus(await api('/api/matchmaking/status'));
        } catch (error) {
          elements.queueStatus.textContent = error.message;
        }
      }, 1800);
    }
  } catch (error) {
    elements.queueStatus.textContent = 'Entre na fila para encontrar um adversário.';
  }
}

async function joinMatchmaking() {
  if (currentGameState?.status === 'active') return;
  setQueueStatus('Entrando na fila…', true);
  try {
    const payload = await api('/api/matchmaking/join', { method: 'POST' });
    await handleMatchmakingStatus(payload);
    if (payload.state === 'waiting' && !matchmakingTimer) {
      matchmakingTimer = window.setInterval(async () => {
        try {
          await handleMatchmakingStatus(await api('/api/matchmaking/status'));
        } catch (error) {
          elements.queueStatus.textContent = error.message;
        }
      }, 1800);
    }
  } catch (error) {
    setQueueStatus(error.message);
  }
}

async function leaveMatchmaking() {
  stopMatchmakingPolling();
  try {
    await api('/api/matchmaking/leave', { method: 'POST' });
    setQueueStatus('Você saiu da fila.');
  } catch (error) {
    elements.queueStatus.textContent = error.message;
  }
}

async function finishGame(result) {
  if (!currentGameId || currentGameState?.status !== 'active') return;
  try {
    const payload = await api(`/api/multiplayer/games/${currentGameId}/finish`, {
      method: 'POST',
      body: JSON.stringify({ result }),
    });
    applyGameState(payload.game);
  } catch (error) {
    elements.panelStatusText.textContent = error.message;
  }
}

function setPanel(panelName) {
  document.querySelectorAll('.panel-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.panel === panelName));
  document.querySelectorAll('.panel-view').forEach((panel) => panel.classList.toggle('active', panel.id === `${panelName}-panel`));
}

function showSection(section) {
  const isPlay = section === 'play';
  elements.playPage.classList.toggle('is-hidden', !isPlay);
  elements.sectionView.classList.toggle('is-hidden', isPlay);
  document.querySelectorAll('[data-section]').forEach((item) => item.classList.toggle('active', item.dataset.section === section));
  if (!isPlay) {
    const data = sectionData[section] || sectionData.community;
    elements.sectionEyebrow.textContent = data.eyebrow;
    elements.sectionTitle.textContent = data.title;
    elements.sectionCopy.textContent = data.copy;
    elements.sectionContent.innerHTML = data.content;
    elements.sectionContent.querySelectorAll('[data-section]').forEach((button) => button.addEventListener('click', () => showSection(button.dataset.section)));
  }
  elements.sidebar.classList.remove('open');
}

async function logout() {
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } finally {
    stopMatchmakingPolling();
    stopGamePolling();
    boardElement.innerHTML = '';
    boardElement = document.querySelector('#board');
    game = null;
    currentGameId = null;
    currentGameState = null;
    showAuth();
    elements.authForm.reset();
    switchAuthMode('login');
  }
}

async function bootstrap() {
  try {
    showDashboard(await api('/api/auth/me'));
  } catch (error) {
    showAuth();
  }
}

document.querySelectorAll('.tab-button').forEach((button) => button.addEventListener('click', () => switchAuthMode(button.dataset.mode)));
document.querySelectorAll('.panel-tab').forEach((button) => button.addEventListener('click', () => setPanel(button.dataset.panel)));
document.querySelectorAll('[data-section]').forEach((button) => button.addEventListener('click', () => showSection(button.dataset.section)));
elements.authForm.addEventListener('submit', submitAuth);
elements.logoutButton.addEventListener('click', logout);
elements.newGameButton.addEventListener('click', joinMatchmaking);
elements.newGameFromPanel.addEventListener('click', joinMatchmaking);
elements.leaveQueueButton.addEventListener('click', leaveMatchmaking);
elements.drawButton.addEventListener('click', () => finishGame('draw'));
elements.resignButton.addEventListener('click', () => finishGame('resign'));
elements.flipBoardButton.addEventListener('click', () => {
  boardOrientation = boardOrientation === 'white' ? 'black' : 'white';
  renderBoard();
});
elements.mobileMenuButton.addEventListener('click', () => elements.sidebar.classList.toggle('open'));
bootstrap();
