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
  languageSelect: document.querySelector('#language-select'),
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
let currentProfile = null;
let watchPollingTimer = null;
let practiceGame = null;
let practiceSelectedSquare = null;
let practiceLegalTargets = [];
let practiceMode = 'puzzle';
let currentLocale = 'en';
let practiceProgress = Number(localStorage.getItem('chesse-practice-solved') || 0);
let customizerCategory = 'background';

const pieceAssets = '/assets/chesspieces/wikipedia';
const ratAssets = {
  full: '/assets/rat/chesse-rat-full.svg',
  avatar: '/assets/rat/chesse-rat-avatar.svg',
};

const ratItemAssets = {
  'cap-blue': '/manus-storage/async-images/10pFiEjEtAVWrVOR4XblXj/image-1.webp',
  'cap-green': '/manus-storage/async-images/10pFiEjEtAVWrVOR4XblXj/image-2.webp',
  beanie: '/manus-storage/async-images/10pFiEjEtAVWrVOR4XblXj/image-3.webp',
  cebolinha: '/manus-storage/async-images/10pFiEjEtAVWrVOR4XblXj/image-4.webp',
  tuft: '/manus-storage/async-images/10pFiEjEtAVWrVOR4XblXj/image-5.webp',
  palmeiras: '/manus-storage/async-images/zz4eogOmsqkiT2uevyzROG/image-1.webp',
  hoodie: '/manus-storage/async-images/zz4eogOmsqkiT2uevyzROG/image-2.webp',
  full: '/manus-storage/async-images/zz4eogOmsqkiT2uevyzROG/image-3.webp',
  glasses: '/manus-storage/async-images/zz4eogOmsqkiT2uevyzROG/image-4.webp',
  headphones: '/manus-storage/async-images/zz4eogOmsqkiT2uevyzROG/image-5.webp',
  denim: '/manus-storage/async-images/kGhBqfvcJAh7RAM2aFAcg8/image-1.webp',
  black: '/manus-storage/async-images/kGhBqfvcJAh7RAM2aFAcg8/image-2.webp',
  shorts: '/manus-storage/async-images/kGhBqfvcJAh7RAM2aFAcg8/image-3.webp',
  goatee: '/manus-storage/async-images/kGhBqfvcJAh7RAM2aFAcg8/image-4.webp',
  mustache: '/manus-storage/async-images/kGhBqfvcJAh7RAM2aFAcg8/image-5.webp',
  bob: '/manus-storage/async-images/j0sSSxoqDcMpQlQGRbBvYa/image-1.webp',
  ponytail: '/manus-storage/async-images/j0sSSxoqDcMpQlQGRbBvYa/image-2.webp',
  sweater: '/manus-storage/async-images/j0sSSxoqDcMpQlQGRbBvYa/image-3.webp',
  dress: '/manus-storage/async-images/j0sSSxoqDcMpQlQGRbBvYa/image-4.webp',
  bow: '/manus-storage/async-images/j0sSSxoqDcMpQlQGRbBvYa/image-5.webp',
};

const translations = {
  en: {
    play: 'Play', problems: 'Problems', learn: 'Learn', watch: 'Watch', community: 'Profile', logout: 'Sign out',
    findOpponent: 'Find an opponent', waiting: 'Waiting for a real opponent…', newGame: 'New game',
    practice: 'Practice locally', profile: 'Player profile', history: 'Game history', save: 'Save profile',
    displayName: 'Display name', bio: 'Bio', ratColor: 'Rat color', accessory: 'Accessory', avatarMode: 'Show rat as',
    language: 'Language', noHistory: 'No completed games yet.', noPublicGames: 'No public games right now.',
    problemsSoon: 'Daily practice', practiceCopy: 'Train locally against the rat or solve a tactical position. Your moves stay on this device.',
    localBot: 'Play against the rat', solvePuzzle: 'Solve a puzzle', showHint: 'Show hint', spectator: 'Read-only spectator board',
    watchCopy: 'Watch active games without affecting the players.', loading: 'Loading…', win: 'Win', loss: 'Loss', draw: 'Draw',
    gold: 'Golden', brown: 'Brown', gray: 'Gray', pink: 'Pink', blue: 'Blue', pawn: 'Pawn', crown: 'Crown', glasses: 'Glasses', none: 'None',
    avatar: 'Avatar only', full: 'Full character only', both: 'Both', practiceTurn: 'Your turn', botTurn: 'Rat is thinking…',
  },
  'pt-BR': {
    play: 'Jogar', problems: 'Problemas', learn: 'Aprender', watch: 'Assistir', community: 'Perfil', logout: 'Sair',
    findOpponent: 'Encontrar adversário', waiting: 'Procurando um adversário real…', newGame: 'Nova partida',
    practice: 'Treinar localmente', profile: 'Perfil do jogador', history: 'Histórico de partidas', save: 'Salvar perfil',
    displayName: 'Nome de exibição', bio: 'Bio', ratColor: 'Cor do rato', accessory: 'Acessório', avatarMode: 'Mostrar rato como',
    language: 'Idioma', noHistory: 'Nenhuma partida encerrada ainda.', noPublicGames: 'Nenhuma partida pública agora.',
    problemsSoon: 'Treino diário', practiceCopy: 'Treine localmente contra o rato ou resolva uma posição tática. Seus lances ficam neste dispositivo.',
    localBot: 'Jogar contra o rato', solvePuzzle: 'Resolver problema', showHint: 'Mostrar dica', spectator: 'Tabuleiro para espectador',
    watchCopy: 'Assista a partidas ativas sem interferir nos jogadores.', loading: 'Carregando…', win: 'Vitória', loss: 'Derrota', draw: 'Empate',
    gold: 'Dourado', brown: 'Marrom', gray: 'Cinza', pink: 'Rosa', blue: 'Azul', pawn: 'Peão', crown: 'Coroa', glasses: 'Óculos', none: 'Nenhum',
    avatar: 'Somente avatar', full: 'Somente personagem', both: 'Os dois', practiceTurn: 'Sua vez', botTurn: 'O rato está pensando…',
  },
  es: { play: 'Jugar', problems: 'Problemas', learn: 'Aprender', watch: 'Ver', community: 'Perfil', logout: 'Salir', findOpponent: 'Encontrar rival', waiting: 'Buscando rival real…', newGame: 'Nueva partida', practice: 'Practicar localmente', profile: 'Perfil del jugador', history: 'Historial de partidas', save: 'Guardar perfil', displayName: 'Nombre visible', bio: 'Biografía', ratColor: 'Color de la rata', accessory: 'Accesorio', avatarMode: 'Mostrar rata como', language: 'Idioma', noHistory: 'Aún no hay partidas terminadas.', noPublicGames: 'No hay partidas públicas ahora.', problemsSoon: 'Práctica diaria', practiceCopy: 'Entrena localmente contra la rata o resuelve una posición táctica.', localBot: 'Jugar contra la rata', solvePuzzle: 'Resolver problema', showHint: 'Mostrar pista', spectator: 'Tablero de espectador', watchCopy: 'Mira partidas activas sin interferir.', loading: 'Cargando…', win: 'Victoria', loss: 'Derrota', draw: 'Tablas', gold: 'Dorado', brown: 'Marrón', gray: 'Gris', pink: 'Rosa', blue: 'Azul', pawn: 'Peón', crown: 'Corona', glasses: 'Gafas', none: 'Ninguno', avatar: 'Solo avatar', full: 'Solo personaje', both: 'Ambos', practiceTurn: 'Tu turno', botTurn: 'La rata está pensando…' },
  fr: { play: 'Jouer', problems: 'Problèmes', learn: 'Apprendre', watch: 'Regarder', community: 'Profil', logout: 'Se déconnecter', findOpponent: 'Trouver un adversaire', waiting: 'Recherche d’un adversaire réel…', newGame: 'Nouvelle partie', practice: 'Entraînement local', profile: 'Profil du joueur', history: 'Historique des parties', save: 'Enregistrer le profil', displayName: 'Nom affiché', bio: 'Bio', ratColor: 'Couleur du rat', accessory: 'Accessoire', avatarMode: 'Afficher le rat comme', language: 'Langue', noHistory: 'Aucune partie terminée.', noPublicGames: 'Aucune partie publique pour le moment.', problemsSoon: 'Entraînement quotidien', practiceCopy: 'Entraînez-vous localement contre le rat ou résolvez une position tactique.', localBot: 'Jouer contre le rat', solvePuzzle: 'Résoudre un problème', showHint: 'Afficher l’indice', spectator: 'Échiquier spectateur', watchCopy: 'Regardez les parties actives sans intervenir.', loading: 'Chargement…', win: 'Victoire', loss: 'Défaite', draw: 'Nulle', gold: 'Doré', brown: 'Brun', gray: 'Gris', pink: 'Rose', blue: 'Bleu', pawn: 'Pion', crown: 'Couronne', glasses: 'Lunettes', none: 'Aucun', avatar: 'Avatar uniquement', full: 'Personnage uniquement', both: 'Les deux', practiceTurn: 'À vous', botTurn: 'Le rat réfléchit…' },
  de: { play: 'Spielen', problems: 'Aufgaben', learn: 'Lernen', watch: 'Zuschauen', community: 'Profil', logout: 'Abmelden', findOpponent: 'Gegner finden', waiting: 'Suche einen echten Gegner…', newGame: 'Neue Partie', practice: 'Lokal trainieren', profile: 'Spielerprofil', history: 'Partieverlauf', save: 'Profil speichern', displayName: 'Anzeigename', bio: 'Bio', ratColor: 'Rattenfarbe', accessory: 'Accessoire', avatarMode: 'Ratte anzeigen als', language: 'Sprache', noHistory: 'Noch keine beendeten Partien.', noPublicGames: 'Keine öffentlichen Partien.', problemsSoon: 'Tägliches Training', practiceCopy: 'Trainiere lokal gegen die Ratte oder löse eine taktische Stellung.', localBot: 'Gegen die Ratte spielen', solvePuzzle: 'Aufgabe lösen', showHint: 'Tipp anzeigen', spectator: 'Zuschauerbrett', watchCopy: 'Aktive Partien ansehen, ohne einzugreifen.', loading: 'Laden…', win: 'Sieg', loss: 'Niederlage', draw: 'Remis', gold: 'Gold', brown: 'Braun', gray: 'Grau', pink: 'Rosa', blue: 'Blau', pawn: 'Bauer', crown: 'Krone', glasses: 'Brille', none: 'Keine', avatar: 'Nur Avatar', full: 'Nur Figur', both: 'Beides', practiceTurn: 'Du bist am Zug', botTurn: 'Die Ratte denkt…' },
};

Object.assign(translations.en, { username: 'Username', password: 'Password', signIn: 'Sign in', createAccount: 'Create account', welcome: 'Welcome back', joinDesk: 'Join the desk', center: 'Control the center', castle: 'Castle early', centerCopy: 'Fight for the central squares and develop your minor pieces before moving the same piece twice.', castleCopy: 'Keep your king safe and connect your rooks before starting a central attack.', learning: 'Learning center' });
Object.assign(translations['pt-BR'], { username: 'Usuário', password: 'Senha', signIn: 'Entrar', createAccount: 'Criar conta', welcome: 'Bem-vindo de volta', joinDesk: 'Entre para jogar', center: 'Controle o centro', castle: 'Faça o roque', centerCopy: 'Dispute as casas centrais e desenvolva suas peças menores antes de mover a mesma peça duas vezes.', castleCopy: 'Coloque o rei em segurança e conecte as torres antes de iniciar um ataque no centro.', learning: 'Centro de aprendizado' });
Object.keys(translations).filter((locale) => !['en', 'pt-BR'].includes(locale)).forEach((locale) => Object.assign(translations[locale], translations.en));

function t(key) {
  return translations[currentLocale]?.[key] || translations.en[key] || key;
}

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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function ratFilter(color) {
  return { gold: 'none', brown: 'sepia(0.65) saturate(0.8)', gray: 'grayscale(0.9)', pink: 'hue-rotate(300deg) saturate(1.15)', blue: 'hue-rotate(170deg) saturate(1.1)' }[color] || 'none';
}

function ratAccessoryMark(accessory) {
  return { glasses: '◉', 'star-earring': '✦', headphones: '◒', none: '' }[accessory] || '';
}

function ratCharacterMarkup(rat = {}, mode = 'full') {
  const safe = {
    color: rat.color || 'gold', background: rat.background || 'night', hat: rat.hat || 'none',
    hair: rat.hair || 'none', shirt: rat.shirt || 'none', pants: rat.pants || 'none',
    beard: rat.beard || 'none', accessory: rat.accessory || 'none',
  };
  const item = (name, value, extraClass = '') => ratItemAssets[value] ? `<img class="rat-layer rat-image-layer rat-image-${name} rat-image-item-${value} ${extraClass}" src="${ratItemAssets[value]}" alt="" aria-hidden="true">` : '';
  return `<span class="rat-stage rat-stage-${mode} rat-bg-${safe.background} rat-fur-${safe.color}">
    <img src="${mode === 'avatar' ? ratAssets.avatar : ratAssets.full}" alt="Chesse rat character" class="rat-base">
    ${item('shirt', safe.shirt)}${item('pants', safe.pants)}${item('hair', safe.hair)}${item('hat', safe.hat)}${item('beard', safe.beard)}${item('accessory', safe.accessory)}
    <span class="rat-layer rat-shirt-layer shirt-${safe.shirt}"></span><span class="rat-layer rat-pants-layer pants-${safe.pants}"></span><span class="rat-layer rat-hair-layer hair-${safe.hair}"></span><span class="rat-layer rat-hat-layer hat-${safe.hat}"></span><span class="rat-layer rat-beard-layer beard-${safe.beard}"></span><span class="rat-layer rat-accessory-layer accessory-${safe.accessory}">${ratAccessoryMark(safe.accessory)}</span>
  </span>`;
}

function applyProfile(user) {
  currentProfile = user;
  const name = user.display_name || user.username;
  const initial = name.charAt(0).toUpperCase();
  elements.profileUsername.textContent = name;
  elements.topbarUsername.textContent = name.toUpperCase();
  elements.boardUsername.textContent = name;
  elements.profileAvatar.textContent = initial;
  elements.topbarAvatar.textContent = initial;
  elements.boardAvatar.textContent = initial;
  const showRatAvatar = ['avatar', 'both'].includes(user.rat?.avatarMode);
  [elements.profileAvatar, elements.topbarAvatar, elements.boardAvatar].forEach((avatar) => {
    if (!avatar) return;
    avatar.innerHTML = showRatAvatar ? ratCharacterMarkup(user.rat, 'avatar') : initial;
    avatar.classList.toggle('has-rat-avatar', showRatAvatar);
  });
  const requestedLocale = localStorage.getItem('chesse-locale') || user.locale || 'auto';
  currentLocale = requestedLocale === 'auto' ? detectLocale() : (translations[requestedLocale] ? requestedLocale : 'en');
  if (elements.languageSelect) elements.languageSelect.value = requestedLocale;
  applyTranslations();
}

function detectLocale() {
  const language = (navigator.language || 'en').toLowerCase();
  if (language.startsWith('pt')) return 'pt-BR';
  if (language.startsWith('es')) return 'es';
  if (language.startsWith('fr')) return 'fr';
  if (language.startsWith('de')) return 'de';
  return 'en';
}

function applyTranslations() {
  const navKeys = { play: 'play', problems: 'problems', learn: 'learn', watch: 'watch', community: 'community' };
  document.querySelectorAll('.nav-item[data-section]').forEach((button) => {
    const label = button.querySelector('span:last-child');
    if (label && navKeys[button.dataset.section]) label.textContent = t(navKeys[button.dataset.section]);
  });
  document.querySelectorAll('.bottom-nav [data-section]').forEach((button) => {
    const label = button.querySelector('span');
    if (label && navKeys[button.dataset.section]) label.textContent = t(navKeys[button.dataset.section]);
  });
  elements.logoutButton.textContent = t('logout');
  elements.languageSelect?.setAttribute('aria-label', t('language'));
  const usernameLabel = document.querySelector('label[for="username"]');
  const passwordLabel = document.querySelector('label[for="password"]');
  if (usernameLabel) usernameLabel.textContent = t('username');
  if (passwordLabel) passwordLabel.textContent = t('password');
  document.querySelectorAll('.tab-button').forEach((button) => { button.textContent = button.dataset.mode === 'login' ? t('signIn') : t('createAccount'); });
  const introEyebrow = document.querySelector('.auth-intro .eyebrow');
  const authEyebrow = document.querySelector('#auth-eyebrow');
  if (introEyebrow) introEyebrow.textContent = currentLocale === 'pt-BR' ? 'A MESA DIÁRIA DE XADREZ' : 'THE DAILY CHESS DESK';
  if (authEyebrow) authEyebrow.textContent = authMode === 'signup' ? t('joinDesk') : t('welcome');
}

function boardMarkup(chess, orientation = 'white', interactive = false) {
  const files = orientation === 'white' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
  const ranks = orientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  return ranks.flatMap((rank, rankIndex) => files.map((file, fileIndex) => {
    const square = `${file}${rank}`;
    const piece = chess.get(square);
    const isLight = (file.charCodeAt(0) - 97 + rank) % 2 === 0;
    const pieceMarkup = piece ? `<img class="board-piece" src="${pieceAssets}/${piece.color}${piece.type.toUpperCase()}.png" alt="${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}">` : '';
    const labels = `${fileIndex === 0 ? `<span class="board-rank-label">${rank}</span>` : ''}${rankIndex === 7 ? `<span class="board-file-label">${file}</span>` : ''}`;
    return `<div class="board-square ${isLight ? 'square-light' : 'square-dark'}" ${interactive ? `data-practice-square="${square}"` : ''}>${labels}${pieceMarkup}</div>`;
  })).join('');
}

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
  applyProfile(payload.user);
  setStats(payload.stats);
  setIdleBoard();
  showSection('play');
  pollMatchmakingStatus();
}

async function changeLocale(event) {
  const selected = event.target.value;
  localStorage.setItem('chesse-locale', selected);
  currentLocale = selected === 'auto' ? detectLocale() : selected;
  applyTranslations();
  if (!currentProfile) return;
  try {
    await api('/api/profile', { method: 'PATCH', body: JSON.stringify({
      displayName: currentProfile.display_name || currentProfile.displayName || '',
      bio: currentProfile.bio || '', locale: selected,
      rat: currentProfile.rat || { color: 'gold', accessory: 'none', avatarMode: 'both', background: 'night', hat: 'none', hair: 'none', shirt: 'none', pants: 'none', beard: 'none' },
    }) });
  } catch (error) {
    console.warn('Language preference could not be saved:', error.message);
  }
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
  elements.authEyebrow.textContent = isSignup ? t('joinDesk') : t('welcome');
  elements.authTitle.textContent = isSignup ? (currentLocale === 'pt-BR' ? 'Crie seu espaço de jogador' : 'Create your player desk') : (currentLocale === 'pt-BR' ? 'Entre no seu espaço' : 'Sign in to your desk');
  elements.authSubtitle.textContent = isSignup ? (currentLocale === 'pt-BR' ? 'Comece um histórico que fica sempre à vista.' : 'Start a record that stays in view.') : (currentLocale === 'pt-BR' ? 'Seu tabuleiro e histórico em um só lugar.' : 'Keep your board and record in one place.');
  elements.authSubmit.innerHTML = `${isSignup ? t('createAccount') : t('signIn')} <span aria-hidden="true">↗</span>`;
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
  elements.sidebar.classList.remove('open');
  if (!isPlay) {
    const data = sectionData[section] || sectionData.community;
    elements.sectionEyebrow.textContent = section === 'problems' ? t('practice') : section === 'community' ? t('profile') : section === 'watch' ? t('watch') : data.eyebrow;
    elements.sectionTitle.textContent = section === 'problems' ? t('problems') : section === 'community' ? t('profile') : section === 'watch' ? t('watch') : data.title;
    elements.sectionCopy.textContent = section === 'problems' || section === 'watch' ? t(section === 'problems' ? 'practiceCopy' : 'watchCopy') : data.copy;
    if (section === 'learn') {
      elements.sectionEyebrow.textContent = t('learning');
      elements.sectionTitle.textContent = t('learn');
      elements.sectionCopy.textContent = t('centerCopy');
      elements.sectionContent.innerHTML = `<div class="learning-grid"><div class="feature-card"><span class="feature-kicker">01 / OPENING</span><h2>${t('center')}</h2><p>${t('centerCopy')}</p></div><div class="feature-card"><span class="feature-kicker">02 / SAFETY</span><h2>${t('castle')}</h2><p>${t('castleCopy')}</p></div></div>`;
      return;
    }
    if (section === 'problems') return renderProblemsSection();
    if (section === 'community') return renderCommunitySection();
    if (section === 'watch') return renderWatchSection();
    elements.sectionContent.innerHTML = data.content;
    elements.sectionContent.querySelectorAll('[data-section]').forEach((button) => button.addEventListener('click', () => showSection(button.dataset.section)));
  }
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
elements.languageSelect?.addEventListener('change', changeLocale);
elements.flipBoardButton.addEventListener('click', () => {
  boardOrientation = boardOrientation === 'white' ? 'black' : 'white';
  renderBoard();
});
elements.mobileMenuButton.addEventListener('click', () => elements.sidebar.classList.toggle('open'));
bootstrap();


function profileSectionMarkup(profile, history) {
  const rat = { color: 'gold', accessory: 'none', avatarMode: 'both', background: 'night', hat: 'none', hair: 'none', shirt: 'none', pants: 'none', beard: 'none', ...(profile.rat || {}) };
  if (rat.accessory === 'pawn') rat.accessory = 'none';
  const historyMarkup = history.length ? history.map((game) => `<button class="history-row" type="button" data-history-game="${game.id}"><span><strong>${escapeHtml(game.opponentDisplayName)}</strong><small>${escapeHtml(game.opponentUsername)} · ${game.moveCount} moves</small></span><b class="history-${game.outcome}">${t(game.outcome)}</b><time>${new Date(game.completedAt).toLocaleDateString()}</time></button>`).join('') : `<p class="empty-state">${t('noHistory')}</p>`;
  const groups = [
    ['background', 'Background', '▦', 'Profile background', [['night','Night',''],['arena','Arena',''],['forest','Forest',''],['ocean','Ocean',''],['sunset','Sunset',''],['paper','Paper','']]],
    ['hat', 'Hats', '⌂', 'Hats and headwear', [['none','Natural',''],['cap-blue','Blue cap',''],['cap-green','Green cap',''],['beanie','Beanie',''],['crown','Crown','']]],
    ['hair', 'Hair', '⌁', 'Hair', [['none','Clean',''],['cebolinha','Cebolinha',''],['tuft','Tiny tuft',''],['mohawk','Mohawk',''],['curly','Curly',''],['bob','Bob',''],['ponytail','Ponytail','']]],
    ['shirt', 'Shirts', '◇', 'Shirts', [['none','No shirt',''],['gold','Gold tee',''],['palmeiras','Palmeiras','P'],['hoodie','Hoodie',''],['checker','Checker',''],['tuxedo','Tuxedo',''],['sweater','Sweater',''],['dress','Dress','']]],
    ['pants', 'Pants', '▥', 'Pants', [['none','Natural',''],['denim','Denim',''],['black','Black',''],['shorts','Shorts',''],['track','Track pants','']]],
    ['beard', 'Beards', '⌣', 'Beards', [['none','Clean',''],['goatee','Goatee',''],['mustache','Mustache',''],['full','Full beard',''],['royal','Royal beard','']]],
    ['accessory', 'Extras', '✦', 'Extras', [['none','None',''],['glasses','Glasses','◉'],['star-earring','Star earring','✦'],['headphones','Headphones','◒'],['bow','Bow','']]],
  ];
  const options = (name, title, values) => `<fieldset class="customizer-group"><legend>${title}</legend><div class="customizer-options">${values.map(([value, label, icon]) => `<button type="button" class="customizer-option ${rat[name] === value ? 'selected' : ''}" data-rat-choice="${name}" data-rat-value="${value}" aria-label="${label}" title="${label}"><span class="option-art option-${value}">${ratItemAssets[value] ? `<img src="${ratItemAssets[value]}" alt="" aria-hidden="true">` : icon || ''}</span></button>`).join('')}</div></fieldset>`;
  const customizer = `<div class="customizer-tabs" role="tablist">${groups.map(([name, label, icon]) => `<button type="button" class="customizer-tab ${customizerCategory === name ? 'active' : ''}" data-customizer-tab="${name}" role="tab"><span>${icon}</span><small>${label}</small></button>`).join('')}</div><div class="customizer-panels">${groups.map(([name, , , title, values]) => `<div class="customizer-panel ${customizerCategory === name ? 'active' : ''}" data-customizer-panel="${name}">${options(name, title, values)}</div>`).join('')}</div>${groups.map(([name]) => `<input type="hidden" name="${name}" value="${rat[name] || 'none'}">`).join('')}`;
  return `<div class="profile-layout">
    <div class="feature-card profile-card"><div class="profile-character" id="profile-rat-preview">${rat.avatarMode !== 'avatar' ? `<div class="rat-full-wrap">${ratCharacterMarkup(rat, 'full')}</div>` : ''}<div><span class="feature-kicker">${t('profile')}</span><h2>${escapeHtml(profile.displayName)}</h2><p>${escapeHtml(profile.bio || 'Your chess story starts here.')}</p></div></div>
      <form id="profile-form" class="profile-form"><label>${t('displayName')}<input name="displayName" maxlength="40" value="${escapeHtml(profile.displayName)}"></label><label>${t('bio')}<textarea name="bio" maxlength="280" rows="3">${escapeHtml(profile.bio)}</textarea></label><div class="form-grid"><label>${t('ratColor')}<select name="ratColor"><option value="gold">${t('gold')}</option><option value="brown">${t('brown')}</option><option value="gray">${t('gray')}</option><option value="pink">${t('pink')}</option><option value="blue">${t('blue')}</option></select></label><label>${t('avatarMode')}<select name="ratAvatarMode"><option value="avatar">${t('avatar')}</option><option value="full">${t('full')}</option><option value="both">${t('both')}</option></select></label></div><button type="button" class="customize-launch" id="open-customizer"><span class="customize-launch-icon">✦</span><span><strong>Customize your rat</strong><small>Open the character studio</small></span><b>→</b></button><div class="customizer-modal" id="customizer-modal" aria-hidden="true"><div class="customizer-modal-backdrop" data-close-customizer></div><div class="customizer-dialog" role="dialog" aria-modal="true" aria-labelledby="customizer-title"><div class="customizer-dialog-header"><div><span class="feature-kicker">CHARACTER STUDIO</span><h2 id="customizer-title">Build your rat</h2><p>See every change instantly.</p></div><button type="button" class="customizer-close" data-close-customizer aria-label="Close">×</button></div><div class="customizer-live-preview" id="customizer-live-preview">${ratCharacterMarkup(rat, 'full')}</div><div class="customizer">${customizer}</div><button type="button" class="button button-primary customizer-done" data-close-customizer>Done</button></div></div><button class="button button-primary" type="submit">${t('save')} <span>↗</span></button><p class="form-message" id="profile-message" role="status"></p></form>
    </div>
    <div class="feature-card history-card"><div class="panel-heading"><div><span class="feature-kicker">${t('history')}</span><h2>${t('history')}</h2></div></div><div class="history-list">${historyMarkup}</div><div id="history-detail"></div></div>
  </div>`;
}

function readRatForm(form) {
  return {
    color: form.elements.ratColor.value, avatarMode: form.elements.ratAvatarMode.value,
    accessory: form.elements.accessory.value, background: form.elements.background.value,
    hat: form.elements.hat.value, hair: form.elements.hair.value, shirt: form.elements.shirt.value,
    pants: form.elements.pants.value, beard: form.elements.beard.value,
  };
}

function updateRatPreview(form) {
  const rat = readRatForm(form);
  const livePreview = form.querySelector('#customizer-live-preview');
  if (livePreview) livePreview.innerHTML = ratCharacterMarkup(rat, 'full');
  const profilePreview = form.closest('.profile-card')?.querySelector('#profile-rat-preview .rat-full-wrap');
  if (profilePreview && rat.avatarMode !== 'avatar') profilePreview.innerHTML = ratCharacterMarkup(rat, 'full');
}

async function renderCommunitySection() {
  elements.sectionContent.innerHTML = `<p class="loading-state">${t('loading')}</p>`;
  try {
    const [profilePayload, historyPayload] = await Promise.all([api('/api/profile'), api('/api/profile/history')]);
    const profile = { ...profilePayload.profile, username: profilePayload.username };
    currentProfile = profile;
    elements.sectionContent.innerHTML = profileSectionMarkup(profile, historyPayload.games);
    const form = document.querySelector('#profile-form');
    const colorSelect = form.elements.ratColor;
    colorSelect.value = profile.rat.color;
    form.elements.ratAvatarMode.value = profile.rat.avatarMode;
    colorSelect.addEventListener('change', () => updateRatPreview(form));
    form.elements.ratAvatarMode.addEventListener('change', () => updateRatPreview(form));
    form.querySelector('#open-customizer')?.addEventListener('click', () => {
      const modal = form.querySelector('#customizer-modal');
      modal?.classList.add('open');
      modal?.setAttribute('aria-hidden', 'false');
    });
    form.querySelectorAll('[data-close-customizer]').forEach((button) => button.addEventListener('click', () => {
      const modal = form.querySelector('#customizer-modal');
      modal?.classList.remove('open');
      modal?.setAttribute('aria-hidden', 'true');
    }));
    form.querySelectorAll('[data-customizer-tab]').forEach((tab) => tab.addEventListener('click', () => {
      customizerCategory = tab.dataset.customizerTab;
      form.querySelectorAll('[data-customizer-tab]').forEach((item) => item.classList.toggle('active', item === tab));
      form.querySelectorAll('[data-customizer-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.customizerPanel === customizerCategory));
    }));
    form.querySelectorAll('[data-rat-choice]').forEach((button) => button.addEventListener('click', () => {
      const group = button.dataset.ratChoice;
      form.elements[group].value = button.dataset.ratValue;
      form.querySelectorAll(`[data-rat-choice="${group}"]`).forEach((item) => item.classList.toggle('selected', item === button));
      updateRatPreview(form);
    }));
    form.addEventListener('submit', saveProfile);
    elements.sectionContent.querySelectorAll('[data-history-game]').forEach((button) => button.addEventListener('click', () => loadHistoryDetail(button.dataset.historyGame)));
  } catch (error) {
    elements.sectionContent.innerHTML = `<div class="feature-card"><p class="form-message is-error">${escapeHtml(error.message)}</p></div>`;
  }
}

async function saveProfile(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = await api('/api/profile', { method: 'PATCH', body: JSON.stringify({
    displayName: form.elements.displayName.value,
    bio: form.elements.bio.value,
    locale: elements.languageSelect?.value || currentLocale,
    rat: {
      color: form.elements.ratColor.value, avatarMode: form.elements.ratAvatarMode.value,
      accessory: form.elements.accessory.value, background: form.elements.background.value,
      hat: form.elements.hat.value, hair: form.elements.hair.value, shirt: form.elements.shirt.value,
      pants: form.elements.pants.value, beard: form.elements.beard.value,
    },
  }) });
  currentProfile = { ...(currentProfile || {}), ...payload.profile };
  const session = await api('/api/auth/me');
  applyProfile(session.user);
  setStats(session.stats);
  form.querySelector('#profile-message').textContent = 'Profile saved.';
  form.querySelector('#profile-message').classList.add('is-success');
  renderCommunitySection();
}

async function loadHistoryDetail(gameId) {
  const target = document.querySelector('#history-detail');
  if (!target) return;
  target.innerHTML = `<p class="loading-state">${t('loading')}</p>`;
  try {
    const payload = await api(`/api/profile/history/${gameId}`);
    const chess = new Chess(payload.game.fen);
    target.innerHTML = `<div class="history-detail"><span class="feature-kicker">${t('history')}</span><div class="mini-board history-board">${boardMarkup(chess, payload.game.playerColor)}</div><div class="move-list compact-moves">${payload.game.moves.map((move) => `<span>${move.ply}. ${escapeHtml(move.san)}</span>`).join(' ')}</div></div>`;
  } catch (error) {
    target.innerHTML = `<p class="form-message is-error">${escapeHtml(error.message)}</p>`;
  }
}

function renderWatchList(games) {
  if (!games.length) return `<div class="feature-card"><span class="feature-icon">◉</span><h2>${t('noPublicGames')}</h2><p>${t('watchCopy')}</p><button class="button button-primary" type="button" data-section="play">${t('findOpponent')} <span>→</span></button></div>`;
  return `<div class="watch-list">${games.map((game) => `<button class="watch-row" type="button" data-watch-game="${game.id}"><span><strong>${escapeHtml(game.white.displayName)}</strong><em>vs</em><strong>${escapeHtml(game.black.displayName)}</strong></span><small>${game.moveCount} moves · LIVE</small></button>`).join('')}</div>`;
}

async function renderWatchSection() {
  window.clearInterval(watchPollingTimer);
  elements.sectionContent.innerHTML = `<p class="loading-state">${t('loading')}</p>`;
  try {
    const payload = await api('/api/watch/games');
    elements.sectionContent.innerHTML = `<div class="section-tool-heading"><span class="feature-kicker">${t('watch')}</span><h2>${t('watchCopy')}</h2></div>${renderWatchList(payload.games)}<div id="watch-detail"></div>`;
    bindWatchActions();
    watchPollingTimer = window.setInterval(() => refreshWatchList(), 2500);
  } catch (error) {
    elements.sectionContent.innerHTML = `<div class="feature-card"><p class="form-message is-error">${escapeHtml(error.message)}</p></div>`;
  }
}

function bindWatchActions() {
  elements.sectionContent.querySelectorAll('[data-watch-game]').forEach((button) => button.addEventListener('click', () => loadWatchGame(button.dataset.watchGame)));
  elements.sectionContent.querySelectorAll('[data-section]').forEach((button) => button.addEventListener('click', () => showSection(button.dataset.section)));
}

async function refreshWatchList() {
  if (!document.querySelector('.watch-list')) return;
  try {
    const payload = await api('/api/watch/games');
    const list = document.querySelector('.watch-list');
    if (list) { list.outerHTML = renderWatchList(payload.games); bindWatchActions(); }
  } catch (error) {
    console.warn('Watch list refresh failed:', error.message);
  }
}

async function loadWatchGame(gameId) {
  const target = document.querySelector('#watch-detail');
  if (!target) return;
  try {
    const payload = await api(`/api/watch/games/${gameId}`);
    const chess = new Chess(payload.game.fen);
    target.innerHTML = `<div class="feature-card spectator-card"><div class="spectator-heading"><strong>${escapeHtml(payload.game.white.displayName)}</strong><span>vs</span><strong>${escapeHtml(payload.game.black.displayName)}</strong></div><div class="mini-board spectator-board">${boardMarkup(chess)}</div><div class="move-list compact-moves">${payload.game.moves.map((move) => `<span>${Math.ceil(move.ply / 2)}. ${escapeHtml(move.san)}</span>`).join(' ') || t('loading')}</div><p class="panel-status"><span class="live-dot"></span>${t('spectator')}</p></div>`;
  } catch (error) {
    target.innerHTML = `<p class="form-message is-error">${escapeHtml(error.message)}</p>`;
  }
}

const practicePuzzle = { fen: '4k3/8/8/8/8/8/4R3/6K1 w - - 0 1', from: 'e2', to: 'e8', hint: 'Move the rook up the open e-file to give check.' };

function practiceMarkup() {
  const board = practiceGame ? boardMarkup(practiceGame, 'white', true) : '';
  return `<div class="practice-layout"><div class="feature-card practice-card"><div class="practice-tabs"><button class="button ${practiceMode === 'puzzle' ? 'button-primary' : 'button-secondary'}" data-practice-mode="puzzle">${t('solvePuzzle')}</button><button class="button ${practiceMode === 'bot' ? 'button-primary' : 'button-secondary'}" data-practice-mode="bot">${t('localBot')}</button></div><p class="panel-copy">${t('practiceCopy')}</p><div class="practice-board mini-board">${board}</div><p id="practice-status" class="panel-status">${practiceMode === 'bot' ? t('practiceTurn') : 'Find the winning move.'}</p><div class="practice-actions"><button class="button button-secondary" id="practice-hint">${t('showHint')}</button><button class="button button-primary" id="practice-reset">Reset</button></div></div><div class="feature-card practice-info"><img class="rat-full" src="${ratAssets.full}" alt="Chesse rat character"><h2>${t('problemsSoon')}</h2><p>${t('practiceCopy')}</p><p class="practice-score">Solved locally: ${practiceProgress}</p></div></div>`;
}

function renderProblemsSection() {
  practiceMode = 'puzzle';
  practiceGame = new Chess(practicePuzzle.fen);
  practiceSelectedSquare = null;
  practiceLegalTargets = [];
  elements.sectionContent.innerHTML = practiceMarkup();
  bindPracticeActions();
}

function bindPracticeActions() {
  elements.sectionContent.querySelectorAll('[data-practice-mode]').forEach((button) => button.addEventListener('click', () => {
    practiceMode = button.dataset.practiceMode;
    practiceGame = practiceMode === 'puzzle' ? new Chess(practicePuzzle.fen) : new Chess();
    practiceSelectedSquare = null;
    practiceLegalTargets = [];
    elements.sectionContent.innerHTML = practiceMarkup();
    bindPracticeActions();
  }));
  elements.sectionContent.querySelectorAll('[data-practice-square]').forEach((square) => square.addEventListener('click', () => handlePracticeSquare(square.dataset.practiceSquare)));
  document.querySelector('#practice-hint')?.addEventListener('click', () => { const status = document.querySelector('#practice-status'); if (status) status.textContent = practiceMode === 'puzzle' ? practicePuzzle.hint : 'The rat evaluates material, checks, and captures locally.'; });
  document.querySelector('#practice-reset')?.addEventListener('click', () => { practiceGame = practiceMode === 'puzzle' ? new Chess(practicePuzzle.fen) : new Chess(); practiceSelectedSquare = null; practiceLegalTargets = []; elements.sectionContent.innerHTML = practiceMarkup(); bindPracticeActions(); });
}

function handlePracticeSquare(square) {
  if (!practiceGame) return;
  if (practiceSelectedSquare && practiceLegalTargets.includes(square)) {
    const from = practiceSelectedSquare;
    const move = practiceGame.move({ from, to: square, promotion: 'q' });
    practiceSelectedSquare = null;
    practiceLegalTargets = [];
    if (move && practiceMode === 'puzzle') {
      const status = document.querySelector('#practice-status');
      if (from === practicePuzzle.from && square === practicePuzzle.to) { practiceProgress += 1; localStorage.setItem('chesse-practice-solved', String(practiceProgress)); if (status) status.textContent = 'Excellent. Puzzle solved.'; } else if (status) status.textContent = 'Legal move, but try to find the forcing check.';
    }
    if (move && practiceMode === 'bot') window.setTimeout(makeLocalRatMove, 280);
    elements.sectionContent.querySelector('.practice-board').innerHTML = boardMarkup(practiceGame, 'white', true);
    bindPracticeActions();
    return;
  }
  const piece = practiceGame.get(square);
  if (piece && piece.color === practiceGame.turn()) {
    practiceSelectedSquare = square;
    practiceLegalTargets = practiceGame.moves({ square, verbose: true }).map((move) => move.to);
  }
}

function evaluatePosition(chess) {
  const values = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
  return chess.board().flat().reduce((score, piece) => score + (piece ? (piece.color === 'b' ? values[piece.type] : -values[piece.type]) : 0), 0);
}

function chooseLocalRatMove(chess, depth = 2) {
  const moves = chess.moves({ verbose: true });
  let bestMove = moves[0];
  let bestScore = -Infinity;
  moves.forEach((candidate) => {
    const next = new Chess(chess.fen());
    next.move(candidate);
    const score = depth <= 1 ? evaluatePosition(next) : chooseLocalRatScore(next, depth - 1, false);
    if (score > bestScore) { bestScore = score; bestMove = candidate; }
  });
  return bestMove;
}

function chooseLocalRatScore(chess, depth, maximizing) {
  if (depth === 0 || chess.game_over()) return evaluatePosition(chess);
  const moves = chess.moves({ verbose: true });
  const scores = moves.map((candidate) => { const next = new Chess(chess.fen()); next.move(candidate); return chooseLocalRatScore(next, depth - 1, !maximizing); });
  return maximizing ? Math.max(...scores) : Math.min(...scores);
}

function makeLocalRatMove() {
  if (practiceMode !== 'bot' || !practiceGame || practiceGame.game_over() || practiceGame.turn() !== 'b') return;
  const status = document.querySelector('#practice-status');
  if (status) status.textContent = t('botTurn');
  const move = chooseLocalRatMove(practiceGame);
  if (move) practiceGame.move(move);
  elements.sectionContent.innerHTML = practiceMarkup();
  bindPracticeActions();
}
