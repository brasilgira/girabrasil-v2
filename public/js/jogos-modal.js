/* =============================================
   GIRABRASIL — JOGOS.JS
   Jogos importados do protótipo Gira3:
   Quiz de Espécies, Guarda da Floresta,
   Fuga do Desmatamento, Defender o Rio
   ============================================= */
(function () {

  /* ── elementos base ── */
  const overlay    = document.getElementById('game-overlay');
  const menuEl     = document.getElementById('games-menu');
  const panelEl    = document.getElementById('game-panel');
  const canvas     = document.getElementById('game-canvas');
  const ctx        = canvas.getContext('2d');
  const screenEl   = document.getElementById('game-screen');
  const screenTitle= document.getElementById('game-screen-title');
  const screenDesc = document.getElementById('game-screen-desc');
  const startBtn   = document.getElementById('btn-start-game');
  const scoreEl    = document.getElementById('score-val');
  const levelEl    = document.getElementById('level-val');
  const livesEl    = document.getElementById('lives-val');
  const titleEl    = document.getElementById('game-title');
  const tipEl      = document.getElementById('game-tip');
  const hudLevel   = document.getElementById('hud-level-wrap');
  const hudLives   = document.getElementById('hud-lives-wrap');
  const canvasWrap = document.getElementById('game-canvas-wrap');

  const W = 960, H = 500;
  const LIVES_MAP = ['❤️❤️❤️','❤️❤️','❤️',''];

  let activeGame = null;
  let scoreEmMetros = false;
  const scoreLabelEl = document.getElementById('score-label');
  let raf = null;

  if (!overlay) return;
  /* ════════════════════════════════════
     PAUSA + CONFIRMAÇÃO AO FECHAR (X da moldura / Esc)
     Todos os jogos usam o requestAnimationFrame daqui: quando pausado, o
     quadro fica "guardado" e o tempo parado é descontado (agora()).
  ════════════════════════════════════ */
  let paused = false, pauseStart = 0, pauseTotal = 0, parked = [];
  const agora = () => performance.now() - pauseTotal;
  const requestAnimationFrame = cb => window.requestAnimationFrame(ts => {
    if (paused) { parked.push(cb); return; }
    cb(ts - pauseTotal);
  });
  /* setTimeout que espera a pausa acabar antes de executar */
  const setTimeoutP = (fn, ms) => setTimeout(function esperar() {
    if (paused) { setTimeout(esperar, 100); return; }
    fn();
  }, ms);

  const confirmEl = document.createElement('div');
  confirmEl.className = 'game-confirm';
  confirmEl.style.display = 'none';
  confirmEl.innerHTML =
    '<div class="game-confirm-box">' +
      '<h3>Jogo pausado</h3>' +
      '<p>Deseja realmente fechar o jogo?</p>' +
      '<div class="game-confirm-btns">' +
        '<button type="button" class="btn-start-game" id="btn-confirm-continue">Continuar jogando</button>' +
        '<button type="button" class="btn-start-game btn-fechar-jogo" id="btn-confirm-close">Fechar</button>' +
      '</div>' +
    '</div>';
  panelEl.appendChild(confirmEl);

  function pausar() { if (paused) return; paused = true; pauseStart = performance.now(); }
  function retomar() {
    if (!paused) return;
    pauseTotal += performance.now() - pauseStart;
    paused = false;
    parked.splice(0).forEach(cb => requestAnimationFrame(cb));
  }
  function resetPausa() {
    if (paused) pauseTotal += performance.now() - pauseStart;
    paused = false; parked = [];
    confirmEl.style.display = 'none';
  }
  function pedirFechar() {
    if (confirmEl.style.display !== 'none') return;
    /* tela de início / fim de jogo visível = nada rodando: fecha direto, sem pausa */
    if (screenEl.style.display !== 'none' && !confirmaNaTela) { closeOverlay(); return; }
    pausar();
    confirmEl.style.display = 'flex';
    document.getElementById('btn-confirm-continue').focus();
  }
  function cancelarFechar() {
    confirmEl.style.display = 'none';
    retomar();
  }
  document.getElementById('btn-confirm-continue').addEventListener('click', cancelarFechar);
  document.getElementById('btn-confirm-close').addEventListener('click', () => closeOverlay());
  /* ════════════════════════════════════
     NAVEGAÇÃO MENU ↔ JOGO
  ════════════════════════════════════ */
  function openOverlay() {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    showMenu();
  }
  function closeOverlay() {
    resetPausa();
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    stopCurrentGame();
  }
  function showMenu() {
    menuEl.style.display = '';
    panelEl.style.display = 'none';
    stopCurrentGame();
    const extra = document.getElementById('especies-opcoes');
    if (extra) extra.remove();
  }
  function showPanel(gameId) {
    menuEl.style.display = 'none';
    panelEl.style.display = '';
    loadGame(gameId);
  }
  function stopCurrentGame() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (activeGame && activeGame.cleanup) activeGame.cleanup();
    activeGame = null;
  }

  const btnOpenGames = document.getElementById('btn-open-games');
  if (btnOpenGames) btnOpenGames.addEventListener('click', openOverlay);
  document.getElementById('btn-close-games').addEventListener('click', closeOverlay);
  document.getElementById('btn-close-game').addEventListener('click', pedirFechar);

  // O jogo só deve ser fechado pelos controles explícitos (X, ou Esc). Clicar fora do painel não interrompe a partida.
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !overlay.classList.contains('active')) return;
    if (panelEl.style.display === 'none') { closeOverlay(); return; }   // menu antigo (sem jogo rodando)
    if (confirmEl.style.display === 'none') pedirFechar(); else cancelarFechar();
  });

  /* Botões "Jogar" dentro de cada card (.jogo-card) abrem o jogo
     correspondente ao data-jogo do card pai. Feito assim (e não no
     card inteiro) porque o clique no card já é usado pelo seletor
     de modo (jogos.js) para abrir/recolher o card. */
  document.querySelectorAll('.jogo-card .botao-jogar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest('.jogo-card');
      if (!card) return;
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      showPanel(card.dataset.jogo);
    });
  });

  /* Compatibilidade com o menu original do protótipo (.game-card, se existir) */
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      showPanel(card.dataset.game);
    });
  });

  /* ════════════════════════════════════
     UTILITÁRIOS CANVAS
  ════════════════════════════════════ */
  /* Fator de tempo (delta time) normalizado para 60 quadros por segundo.
     Cada jogo cria o seu com makeDelta() e usa o valor retornado a cada
     quadro (dt) multiplicando tudo que é movimento/contador — assim a
     velocidade do jogo fica a mesma em qualquer computador, independente
     de quantos quadros por segundo a tela consegue desenhar. */
  function makeDelta() {
    let last = null;
    const step = (ts) => {
      if (last === null) { last = ts; return 1; }
      let dt = (ts - last) / (1000 / 60);
      last = ts;
      if (dt > 3) dt = 3;   // evita saltos grandes (ex: aba fora de foco)
      if (dt < 0) dt = 0;
      return dt;
    };
    step.reset = () => { last = null; };
    return step;
  }

  function clrCanvas() { ctx.clearRect(0, 0, W, H); }
  function updateHUD(score, level, lives, showLevel=true, showLives=true) {
    scoreEl.textContent = scoreEmMetros ? score + ' m' : score;
    if (scoreLabelEl) scoreLabelEl.style.display = scoreEmMetros ? 'none' : '';
    levelEl.textContent = level;
    livesEl.textContent = LIVES_MAP[Math.max(0, 3 - lives)];
    hudLevel.style.display = showLevel ? '' : 'none';
    hudLives.style.display = showLives ? '' : 'none';
  }
  /* botão "Fechar" das telas de fim de jogo / entre rodadas */
  const fecharBtn = document.createElement('button');
  fecharBtn.type = 'button';
  fecharBtn.className = 'btn-start-game btn-fechar-jogo';
  fecharBtn.textContent = 'Fechar';
fecharBtn.onclick = () => pedirFechar();   // fecha direto, exceto entre rodadas do mico (aí pergunta)
  let confirmaNaTela = false;   // true = com esta tela aberta, X/Esc ainda pedem confirmação (ex.: entre rodadas do mico)
  function showScreen(title, desc, btnTxt='Começar!', comFechar=false) {
    confirmaNaTela = false;
    screenTitle.textContent = title;
    screenDesc.innerHTML = desc;
    startBtn.textContent = btnTxt;
    if (comFechar) screenEl.appendChild(fecharBtn); else fecharBtn.remove();
    screenEl.style.display = 'flex';
  }
  function hideScreen() { screenEl.style.display = 'none'; }
  function popup(x, y, color, text) {
    const rect = canvas.getBoundingClientRect();
    let sx = rect.width / W, sy = rect.height / H, ox = 0, oy = 0;
    const ajuste = getComputedStyle(canvas).objectFit;
    if (ajuste === 'cover' || ajuste === 'contain') {
      const s = ajuste === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy);
      ox = (rect.width - W * s) / 2;
      oy = ajuste === 'cover' ? 0 : (rect.height - H * s) / 2;
      sx = sy = s;
    }
    const wrapRect = canvasWrap.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'hit-popup';
    el.style.left  = (rect.left - wrapRect.left + ox + x * sx) + 'px';
    el.style.top   = (rect.top - wrapRect.top + oy + y * sy - 12) + 'px';
    el.style.color = color;
    el.textContent = text;
    canvasWrap.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }
  function shakePanel() {
    panelEl.classList.remove('shake');
    void panelEl.offsetWidth;
    panelEl.classList.add('shake');
    setTimeout(() => panelEl.classList.remove('shake'), 200);
  }

  /* ────────────────────────────────
     DESENHO DE FUNDO: FLORESTA
  ──────────────────────────────── */
  function drawForestBg(treePositions) {
    const sky = ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,'#04100a'); sky.addColorStop(1,'#081e10');
    ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);
    const glow = ctx.createRadialGradient(W/2,0,0,W/2,0,W*0.7);
    glow.addColorStop(0,'rgba(34,197,94,0.06)'); glow.addColorStop(1,'transparent');
    ctx.fillStyle = glow; ctx.fillRect(0,0,W,H);
    (treePositions||[{x:50,h:85,w:34,c:'#0f3d22'},{x:140,h:60,w:26,c:'#1a5c35'},{x:580,h:90,w:36,c:'#0f3d22'},{x:670,h:65,w:28,c:'#145228'}]).forEach(t=>{
      ctx.fillStyle='#2d1810'; ctx.fillRect(t.x-4,H-26,8,26);
      ctx.fillStyle=t.c; ctx.beginPath(); ctx.moveTo(t.x,H-26-t.h);
      ctx.lineTo(t.x-t.w/2,H-26); ctx.lineTo(t.x+t.w/2,H-26); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(34,197,94,0.06)'; ctx.beginPath(); ctx.moveTo(t.x,H-26-t.h);
      ctx.lineTo(t.x-t.w*0.18,H-26-t.h*0.5); ctx.lineTo(t.x,H-26); ctx.closePath(); ctx.fill();
    });
    ctx.fillStyle='#0d2e16'; ctx.fillRect(0,H-12,W,12);
    ctx.fillStyle='rgba(34,197,94,0.07)'; ctx.fillRect(0,H-12,W,3);
  }

  /* ════════════════════════════════════
     DISPATCH DE JOGOS
  ════════════════════════════════════ */
  function loadGame(id) {
    stopCurrentGame();
        scoreEmMetros = false;
            hudLives.firstChild.nodeValue = 'Vidas: ';
    hudLevel.firstChild.nodeValue = 'Nível ';
    const extra = document.getElementById('especies-opcoes');
    if (extra) extra.remove();
    switch(id) {
      case 'quiz-da-floresta':          initEspecies(); break;
      case 'jogo-do-mico':              initMico();     break;
      case 'desafio-dos-biomas':        initFuga();     break;
      case 'missao-biodiversidade':     initRio();      break;
      /* aliases (ids originais do protótipo) */
      case 'especies': initEspecies(); break;
      case 'mico':     initMico();     break;
      case 'fuga':     initFuga();     break;
      case 'rio':      initRio();      break;
    }
  }


  /* ════════════════════════════════════
     JOGO — QUIZ DE ESPÉCIES
  ════════════════════════════════════ */
function initEspecies() {
  titleEl.textContent = 'Identificar Espécies';
  tipEl.textContent = 'Identifique o animal antes do tempo acabar · Erre 3 = fim de jogo';
  updateHUD(0, '', 3, false, true);


  const ESPECIES_POR_NIVEL = {
  facil: [
    {img:'assets/games/species/onca.jpg', nome: 'Onça-pintada', erradas: ['Leopardo', 'Jaguar-negro'] },
    {img:'assets/games/species/arara.jpg', nome: 'Arara-azul', erradas: ['Tucano-toco', 'Papagaio-verdadeiro'] },
    {img:'assets/games/species/Tucano.jpg', nome:'Tucano-Toco', erradas:[' Arara-canindé','João-de-barro']}, 
    {img:'assets/games/species/jacare.jpg', nome:'Jacaré-açu', erradas:['Caimão-de-óculos','Crocodilo-do-Nilo']}, 
    {img:'assets/games/species/mico.webp', nome:'Mico-leão-dourado', erradas:[' Sagui-de-tufo-branco','Sauim-de-coleira']},
    {img:'assets/games/species/capivara.webp', nome:'Capivara', erradas:['Quati','Anta']},
    {img:'assets/games/species/tamandua.jpg', nome:'Tamanduá-bandeira', erradas:[' Preguiça-de-coleira','Cateto']},
    {img:'assets/games/species/boto.webp', nome:'Boto cor-de-rosa', erradas:['Peixe-boi-da-amazônia','Toninha']},
    {img:'assets/games/species/lobo.webp', nome:'Lobo-guará', erradas:['Raposa-do-campo','Jaguatirica']},
    {img:'assets/games/species/anta.jpg', nome:'Anta', erradas:['Capivara','Queixada']},
  ],
  medio: [
     {img:'assets/games/species/quati.jpg', nome:'Quati', erradas:['Jupará',' Guaxinim']},
    {img:'assets/games/species/jaguatirica.jpg', nome:'Jaguatirica', erradas:[' Gato-maracajá',' Puma']},
     {img:'assets/games/species/tui.webp', nome:'Tuiuiú', erradas:['Flamingo-chileno',' Colhereiro']},
     {img:'assets/games/species/veado.webp', nome:'Veado-catingueiro', erradas:['Veado-campeiro','Capivara']},
    {img:'assets/games/species/sucuri.jpeg', nome:'Sucuri-Verde', erradas:[' Jiboia-constritora','Jararaca']},
  ],
    dificil: [
    {img:'assets/games/species/seri.webp', nome:'Seriema', erradas:[' Ema','Garça-branca-grande']},
     {img:'assets/games/species/teiu.jpg', nome:'Teiú', erradas:['Iguana-verde','Calango-verde']},
     {img:'assets/games/species/bugio.webp', nome:'Bugio-ruivo', erradas:['Macaco-prego','Sauá']},
    {img:'assets/games/species/ari.jpg', nome:'Ariranha', erradas:['ontra-neotropical','Peixe-boi-da-amazônia']},
    {img:'assets/games/species/preg.jpg', nome:'Preguiça-de-coleira', erradas:[' Preguiça-de-três-dedos','Coala']},
    ],
  }
  /* 🔥 CARREGAR IMAGENS */
 const ESPECIES = [
  ...ESPECIES_POR_NIVEL.facil,
  ...ESPECIES_POR_NIVEL.medio,
  ...ESPECIES_POR_NIVEL.dificil
  
];

const imagens = {};
ESPECIES.forEach(e => {
    const img = new Image();
    img.src = e.img;
    imagens[e.nome] = img;
  });

  const QUIZ_FPS = 60;
  const QUIZ_FRAME_MS = 1000 / QUIZ_FPS;
  let score = 0, lives = 3, level = 1, running = false, current = null, timer = 0, maxTime = 220, answered = false, questionStartedAt = 0;
let queue = [];
let correct = 0;
let categoriaAtual = 'Fácil';
const delta = makeDelta();


  let opcoesEl = document.getElementById('especies-opcoes');
  if (!opcoesEl) {
    opcoesEl = document.createElement('div');
    opcoesEl.id = 'especies-opcoes';
    opcoesEl.className = 'especies-opcoes';
    panelEl.querySelector('.game-tip').before(opcoesEl);
  }
  opcoesEl.style.display = 'none';


function nextQuestion() {
if (queue.length === 0) {
  end();
  return;
}

  current = queue.shift();

 categoriaAtual = current.categoria;


  answered = false;
  timer = 0;
  maxTime = Math.max(100, 220 - level * 15);
  questionStartedAt = performance.now();

  updateHUD(score, categoriaAtual, lives);
  updateDifficultyColor();


  const opts = shuffle([current.nome, ...current.erradas]);
  opcoesEl.innerHTML = opts
    .map(o => `<button class="especie-btn" data-nome="${o}">${o}</button>`)
    .join('');

  opcoesEl.querySelectorAll('.especie-btn').forEach(b => {
    b.addEventListener('click', () => answer(b.dataset.nome, b));
  });
}


  function shuffle(a) {
  return [...a].sort(() => Math.random() - 0.5);
}

function updateDifficultyColor() {
  if (categoriaAtual === 'Fácil') {
    levelEl.style.color = '#22c55e';
  } else if (categoriaAtual === 'Médio') {
    levelEl.style.color = '#f59e0b';
  } else {
    levelEl.style.color = '#ef4444';
  }
}

function buildQueue() {
  return [
    ...shuffle(ESPECIES_POR_NIVEL.facil).map(item => ({ ...item, categoria: 'Fácil' })),
    ...shuffle(ESPECIES_POR_NIVEL.medio).map(item => ({ ...item, categoria: 'Médio' })),
    ...shuffle(ESPECIES_POR_NIVEL.dificil).map(item => ({ ...item, categoria: 'Difícil' }))
  ];
}



  function answer(nome, btn) {
    if (answered) return; answered = true;

    if (nome === current.nome) {
      // Cada ponto equivale a 10 ms restantes. O tempo decorrido é medido
      // pelo relógio real para não confundir frames do desenho com segundos.
      const tempoTotalMs = maxTime * QUIZ_FRAME_MS;
      const tempoDecorridoMs = Math.max(0, performance.now() - questionStartedAt);
      const tempoRestanteMs = Math.max(0, tempoTotalMs - tempoDecorridoMs);
      const pontos = Math.floor(tempoRestanteMs / 10);
      score += pontos;
      correct++;
      btn.classList.add('correct');
      popup(W / 2, H / 2, '#22c55e', `+${pontos}`);
    } else {
      lives--;
      btn.classList.add('wrong');
      opcoesEl.querySelectorAll('.especie-btn').forEach(b => {
        if (b.dataset.nome === current.nome) b.classList.add('correct');
      });
      popup(W / 2, H / 2, '#f87171', 'Errou');
      shakePanel();
    }

    updateHUD(score, categoriaAtual, lives);

    if (lives <= 0) { setTimeout(() => end(false), 900); return; }
    setTimeout(nextQuestion, 1000);
  }

  function drawTimer(t, max) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, W, 6);
    const pct = t / max;
    ctx.fillStyle = pct > 0.7 ? '#ef4444' : pct > 0.4 ? '#f59e0b' : '#22c55e';
    ctx.fillRect(0, 0, W * (1 - pct), 6);
  }

  function loop(ts) {
    if (!running) return;
    const dt = delta(ts);
    clrCanvas();

    /* 🖼️ DESENHAR IMAGEM OCUPANDO TODO O ESPAÇO (ESTILO COVER) */
    if (current) {
      const img = imagens[current.nome];
      if (img && img.complete && img.naturalWidth !== 0) {
        const scale = Math.max(W / img.width, H / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (W - w) / 2;
        const y = (H - h) / 2;

        ctx.save();
        // Opcional: arredondar cantos do desenho se o seu painel for arredondado
        ctx.drawImage(img, x, y, w, h);
        ctx.restore();
      }
    }

    // Overlay escuro suave para o texto e botões ficarem legíveis sobre a foto
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, W, H);

    if (!answered && current) {
      timer += dt;
      drawTimer(timer, maxTime);
      if (timer >= maxTime) {
        lives--; answered = true;
        shakePanel();
        opcoesEl.querySelectorAll('.especie-btn').forEach(b => {
          if (b.dataset.nome === current.nome) b.classList.add('correct');
        });
        popup(W / 2, 60, '#f87171', 'Tempo!');
       updateHUD(score, categoriaAtual, lives);
       updateDifficultyColor();
        if (lives <= 0) { setTimeout(() => end(false), 900); }
        else setTimeout(nextQuestion, 1000);
      }
    }
    raf = requestAnimationFrame(loop);
  }

  function end() {
    running = false;
    cancelAnimationFrame(raf);
    opcoesEl.style.display = 'none';
    showScreen('Fim do Quiz!', `Espécies identificadas: <strong>${correct}</strong><br>Pontuação: <strong>${score}</strong>`, 'Tentar novamente', true);
  }

      function start() {
  score = 0;
  lives = 3;
  level = 1;
  timer = 0;
  correct = 0;
  categoriaAtual = 'Fácil';
  queue = buildQueue();
  running = true;
  hideScreen();
  opcoesEl.style.display = 'grid';
  updateHUD(0, 'Fácil', 3);
  updateDifficultyColor();
  nextQuestion();
  delta.reset();
  raf = requestAnimationFrame(loop);
}


  startBtn.onclick = start;

  activeGame = {
    cleanup: () => {
      running = false;
      opcoesEl.style.display = 'none';
    }
  };

  showScreen(
    'Identificar Espécies',
    'Reconheça os <strong>animais da fauna brasileira</strong>.<br>Clique no nome correto!'
  );
}

  /* ════════════════════════════════════
     JOGO — JOGO DO MICO (VS 1 BOT)
  ════════════════════════════════════ */
  /* ════════════════════════════════════
     JOGO — JOGO DO MICO (VS 1 BOT)
  ════════════════════════════════════ */
  /* ════════════════════════════════════
     JOGO — JOGO DO MICO (VS 1 BOT)
  ════════════════════════════════════ */
function initMico() {
    titleEl.textContent = 'Jogo do Mico';
    tipEl.textContent   = 'Clique numa carta do oponente · Forme pares · Quem ficar com o Mico perde';
    hudLives.firstChild.nodeValue = 'Pares: ';   // no Mico, o lugar das vidas mostra os pares formados
    hudLevel.firstChild.nodeValue = 'Rodada ';   // e o nível vira rodada
    showScreen('Jogo do Mico',
      'Pegue uma carta do oponente e forme <strong>pares</strong>.<br>Quem ficar com o <strong>Mico</strong> no final perde!<br>São <strong>5 rodadas</strong>, cada uma com mais cartas que a anterior.');

    /* ── CONFIG ── */
    /* total de cartas de cada rodada (sempre ímpar: pares + 1 mico). Troque os números à vontade. */
    const CARTAS_POR_RODADA = [7, 9, 11, 13, 17];
    const TOTAL_RODADAS = CARTAS_POR_RODADA.length;
    const FUNDO_SRC = 'assets/games/fundomico.png';
    const S = 'assets/games/species/';
    /* Troque só img/nome aqui depois (por imagens de animais) */
    const TODAS = [
      { id: 'onca',       nome: 'Onça-pintada', img: S + 'onca.jpg' },
      { id: 'arara',      nome: 'Arara-azul',   img: S + 'arara.jpg' },
      { id: 'tucano',     nome: 'Tucano-toco',  img: S + 'Tucano.jpg' },
      { id: 'capivara',   nome: 'Capivara',     img: S + 'capivara.webp' },
      { id: 'tamandua',   nome: 'Tamanduá',     img: S + 'tamandua.jpg' },
      { id: 'lobo',       nome: 'Lobo-guará',   img: S + 'lobo.webp' },
      { id: 'anta',       nome: 'Anta',         img: S + 'anta.jpg' },
      { id: 'boto',       nome: 'Boto',         img: S + 'boto.webp' },
      { id: 'jacare',     nome: 'Jacaré-açu',   img: S + 'jacare.jpg' },
      { id: 'jaguatirica',nome: 'Jaguatirica',  img: S + 'jaguatirica.jpg' },
      { id: 'quati',      nome: 'Quati',        img: S + 'quati.jpg' },
      { id: 'sucuri',     nome: 'Sucuri',       img: S + 'sucuri.jpeg' },
      { id: 'veado',      nome: 'Veado',        img: S + 'veado.webp' },
      { id: 'ariranha',   nome: 'Ariranha',     img: S + 'ari.jpg' },
      { id: 'bugio',      nome: 'Bugio-ruivo',  img: S + 'bugio.webp' },
      { id: 'preguica',   nome: 'Preguiça',     img: S + 'preg.jpg' },
      { id: 'seriema',    nome: 'Seriema',      img: S + 'seri.webp' },
      { id: 'teiu',       nome: 'Teiú',         img: S + 'teiu.jpg' },
      { id: 'tuiuiu',     nome: 'Tuiuiú',       img: S + 'tui.webp' }
    ];
    const MICO = { id: 'mico', nome: 'MICO', img: 'assets/games/species/mico.webp', mico: true };

    const imagens = {};
    [...TODAS, MICO].forEach(c => { const i = new Image(); i.src = c.img; imagens[c.id] = i; });
    const fundoImg = new Image(); fundoImg.src = FUNDO_SRC;

    /* tamanho base da carta (todo o desenho é feito nessa escala) */
    const CW = 80, CH = 104, MAO_W = W - 60, TOP_Y = 14, BOT_Y = H - 14 - CH;
    let player = [], bot = [], descarte = [], PARES = [];
    /* PONTUAÇÃO (feita pra ranking, quase nunca empata):
       100 por par · +50 por combo (pares seguidos em turnos seguidos)
       vitória na rodada: +1000, +1 a cada 0,1 s abaixo de 5 min, +25 por turno abaixo de 40.
       A pontuação soma de rodada em rodada e começa do zero. */
    const PTS_PAR = 100, PTS_COMBO = 50, PTS_VITORIA = 1000, TEMPO_BONUS_MS = 300000, RODADAS_BONUS = 40;
    let parJog = 0, combo = 0, rodadas = 0, t0 = 0;
    let nivel = 1, proxNivel = 1, novoJogo = true;
    let score = 0, running = false, fase = 'fim', hl = null, hover = -1, timers = [];

    const shuffle = a => [...a].sort(() => Math.random() - 0.5);
    /* timers do jogo: respeitam a pausa (X / Esc) */
    const later = (fn, ms) => {
      const t = setTimeout(function esperar() {
        if (!running) return;
        if (paused) { timers.push(setTimeout(esperar, 100)); return; }
        fn();
      }, ms);
      timers.push(t);
    };

    /* texto de status no centro (HTML, por isso fica nítido) */
    const statusEl = document.createElement('div');
    statusEl.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2;display:none;'
      + 'padding:0.7cqw 2.2cqw;border-radius:999px;background:rgba(0,0,0,0.6);color:#f6edd4;'
      + 'font-family:Inter,sans-serif;font-weight:700;font-size:max(13px,1.9cqw);letter-spacing:0.04em;'
      + 'text-transform:uppercase;text-align:center;white-space:nowrap;pointer-events:none;';
    canvasWrap.appendChild(statusEl);
    function setMsg(t) { statusEl.textContent = t; statusEl.style.display = t ? '' : 'none'; }

    /* HUD: pontos | nível (= rodada) | pares formados (no lugar das vidas) */
    function hud() {
      updateHUD(score, nivel, 3, true, true);
      livesEl.textContent = (descarte.length / 2) + (PARES.length ? '/' + PARES.length : '');
    }

    /* tira os pares de uma mão; devolve quantos pares saíram */
    function tirarPares(mao) {
      let n = 0, achou = true;
      while (achou) {
        achou = false;
        for (let i = 0; i < mao.length && !achou; i++) {
          if (mao[i].mico) continue;
          for (let j = i + 1; j < mao.length; j++) {
            if (mao[j].id === mao[i].id) {
              descarte.push(mao[i]);
              mao.splice(j, 1); mao.splice(i, 1);
              n++; achou = true; break;
            }
          }
        }
      }
      return n;
    }

    /* distribui as cartas da rodada: cada mão recebe UMA de cada animal,
       então ninguém começa com par; o mico vai pra um dos lados */
    function distribuir(totalCartas) {
      const nPares = (totalCartas - 1) / 2;
      PARES = shuffle(TODAS).slice(0, nPares);
      player = [...PARES]; bot = [...PARES]; descarte = [];
      (Math.random() < 0.5 ? player : bot).push(MICO);
      player = shuffle(player); bot = shuffle(bot);
    }

    /* mão em leque: se não couber, as cartas se sobrepõem */
    function layout(mao, y) {
      const n = mao.length;
      let step = CW + 8;
      if (n > 1 && n * CW + (n - 1) * 8 > MAO_W) step = (MAO_W - CW) / (n - 1);
      const total = n > 0 ? CW + (n - 1) * step : 0;
      const x0 = (W - total) / 2;
      return mao.map((c, i) => ({ c, x: x0 + i * step, y, w: CW, h: CH }));
    }

    function rr(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    /* folha desenhada (sem emoji) */
    function folha(cx, cy, r) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.7);
      ctx.fillStyle = '#8FC9A6'; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0f3d22'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
      ctx.restore();
    }

    /* desenha uma carta com moldura. k = escala (1 = tamanho normal) */
    function drawCard(x, y, k, card, faceUp, destaque) {
      ctx.save();
      ctx.translate(x, y); ctx.scale(k, k);
      const mico = faceUp && card.mico;
      const ouro = mico ? '#dc2626' : '#c9a24a';

      /* corpo da carta (com sombra) */
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
      rr(0, 0, CW, CH, 9);
      ctx.fillStyle = faceUp ? (mico ? '#fde8e8' : '#f6edd4') : '#0f3d22';
      ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

      if (faceUp) {
        /* área da imagem (quadrada) */
        ctx.save();
        rr(7, 7, 66, 66, 5); ctx.clip();
        const img = imagens[card.id];
        if (img && img.complete && img.naturalWidth) {
          const s = Math.max(66 / img.naturalWidth, 66 / img.naturalHeight);
          const w = img.naturalWidth * s, h = img.naturalHeight * s;
          ctx.drawImage(img, 7 + (66 - w) / 2, 7 + (66 - h) / 2, w, h);
        } else { ctx.fillStyle = '#1a5c35'; ctx.fillRect(7, 7, 66, 66); }
        ctx.restore();
        rr(7, 7, 66, 66, 5); ctx.lineWidth = 1.5; ctx.strokeStyle = mico ? '#991b1b' : '#145228'; ctx.stroke();

        /* faixa do nome */
        if (mico) {
          rr(7, 78, 66, 19, 4); ctx.fillStyle = '#dc2626'; ctx.fill();
          ctx.fillStyle = '#fff';
        } else {
          ctx.fillStyle = '#1a3d26';
        }
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const txt = (mico ? 'MICO' : card.nome).toUpperCase();
        let fs = 10;
        do { ctx.font = '700 ' + fs + 'px Inter, sans-serif'; fs -= 0.5; } while (ctx.measureText(txt).width > 60 && fs > 5);
        ctx.fillText(txt, CW / 2, 88);
      } else {
        /* verso: losangos + folha */
        ctx.save();
        rr(7, 7, 66, 90, 5); ctx.clip();
        ctx.fillStyle = '#145228'; ctx.fillRect(7, 7, 66, 90);
        ctx.strokeStyle = 'rgba(143,201,166,0.28)'; ctx.lineWidth = 1;
        for (let d = -100; d < 160; d += 12) {
          ctx.beginPath(); ctx.moveTo(d, 7); ctx.lineTo(d + 90, 97); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(d + 90, 7); ctx.lineTo(d, 97); ctx.stroke();
        }
        ctx.restore();
        rr(7, 7, 66, 90, 5); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(246,237,212,0.6)'; ctx.stroke();
        ctx.beginPath(); ctx.arc(CW / 2, CH / 2, 17, 0, Math.PI * 2);
        ctx.fillStyle = '#0f3d22'; ctx.fill(); ctx.strokeStyle = ouro; ctx.lineWidth = 1.5; ctx.stroke();
        folha(CW / 2, CH / 2, 10);
      }

      /* moldura externa + filete interno */
      rr(0, 0, CW, CH, 9); ctx.lineWidth = 3; ctx.strokeStyle = ouro; ctx.stroke();
      rr(3.5, 3.5, CW - 7, CH - 7, 6); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(201,162,74,0.55)';
      if (mico) ctx.strokeStyle = 'rgba(220,38,38,0.5)';
      ctx.stroke();

      if (destaque) { rr(-3, -3, CW + 6, CH + 6, 11); ctx.lineWidth = 4; ctx.strokeStyle = destaque; ctx.stroke(); }
      ctx.restore();
    }

    function drawFundo() {
      if (fundoImg.complete && fundoImg.naturalWidth) {
        const s = Math.max(W / fundoImg.naturalWidth, H / fundoImg.naturalHeight);
        const w = fundoImg.naturalWidth * s, h = fundoImg.naturalHeight * s;
        ctx.drawImage(fundoImg, (W - w) / 2, (H - h) / 2, w, h);
      } else {
        /* fundo vazio, só cor lisa, até a imagem carregar */
        ctx.fillStyle = '#0d2e16';
        ctx.fillRect(0, 0, W, H);
      }
    }

    function loop() {
      if (!running) return;
      clrCanvas(); drawFundo();

      layout(bot, TOP_Y).forEach((p, i) => {
        const dest = hl && hl.lado === 'bot' && hl.card === p.c ? '#f59e0b'
                   : (fase === 'player' && hover === i ? '#8FC9A6' : null);
        drawCard(p.x, p.y + (dest ? 8 : 0), 1, p.c, false, dest);
      });
      layout(player, BOT_Y).forEach(p => {
        const dest = hl && hl.card === p.c ? (hl.lado === 'player' ? '#f59e0b' : '#22c55e') : null;
        drawCard(p.x, p.y - (dest ? 8 : 0), 1, p.c, true, dest);
      });

      raf = requestAnimationFrame(loop);
    }

    function checarFim() {
      if (player.length === 0) { end(true); return true; }
      if (bot.length === 0)    { end(false); return true; }
      return false;
    }

    function turnoPlayer() {
      fase = 'player'; hl = null;
      setMsg('Sua vez: escolha uma carta do oponente');
    }

    function turnoBot() {
      fase = 'bot'; hl = null;
      setMsg('Oponente está escolhendo...');
      later(() => {
        const alvo = player[Math.floor(Math.random() * player.length)];
        hl = { lado: 'player', card: alvo };
        later(() => {
          player.splice(player.indexOf(alvo), 1);
          bot.push(alvo);
          hl = null;
          const n = tirarPares(bot);
          setMsg(n ? 'Oponente formou um par!' : 'Oponente pegou uma carta sua');
          hud();
          bot = shuffle(bot);
          later(() => { if (!checarFim()) turnoPlayer(); }, 600);
        }, 550);
      }, 500);
    }

    function pegar(i) {
      fase = 'busy';
      const carta = bot.splice(i, 1)[0];
      player.push(carta);
      hl = { lado: 'verde', card: carta };
      setMsg(carta.mico ? 'Ops... você pegou o MICO!' : 'Você pegou ' + carta.nome);
      later(() => {
        const n = tirarPares(player);
        hl = null; rodadas++;
        if (n) {
          combo++; parJog += n;
          const pts = PTS_PAR * n + PTS_COMBO * (combo - 1);
          score += pts; hud();
          popup(W / 2, H / 2 - 50, '#22c55e', '+' + pts + (combo > 1 ? ' combo x' + combo : ''));
          setMsg(combo > 1 ? 'Combo x' + combo + '!' : 'Par formado!');
        } else {
          combo = 0;
          if (!carta.mico) setMsg('Sem par...');
        }
        later(() => { if (!checarFim()) turnoBot(); }, 650);
      }, 550);
    }

    function posCanvas(e) {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
    }
    /* percorre de trás pra frente: a carta de cima (última desenhada) tem prioridade */
    function indiceBot(m) {
      const L = layout(bot, TOP_Y);
      for (let i = L.length - 1; i >= 0; i--) {
        const p = L[i];
        if (m.x >= p.x && m.x <= p.x + p.w && m.y >= p.y && m.y <= p.y + p.h + 8) return i;
      }
      return -1;
    }
    canvas.onmousemove = e => { hover = running && fase === 'player' ? indiceBot(posCanvas(e)) : -1; canvas.style.cursor = hover >= 0 ? 'pointer' : ''; };
    canvas.onclick = e => {
      if (!running || paused || fase !== 'player') return;
      const i = indiceBot(posCanvas(e));
      if (i >= 0) pegar(i);
    };

    function end(ganhou) {
      running = false; fase = 'fim';
      cancelAnimationFrame(raf);
      canvas.style.cursor = '';
      setMsg('');
      const ms = agora() - t0;
      let bonus = 0;
      if (ganhou) {
        bonus = PTS_VITORIA
              + Math.floor(Math.max(0, TEMPO_BONUS_MS - ms) / 100)
              + Math.max(0, RODADAS_BONUS - rodadas) * 25;
      }
      score += bonus;
      hud();
      const tempo = (ms / 1000).toFixed(1).replace('.', ',') + ' s';
      const resumo = `Pontuação: <strong>${score}</strong><br>Pares: <strong>${parJog}</strong> · Tempo: <strong>${tempo}</strong> · Turnos: <strong>${rodadas}</strong>`;
      if (ganhou && nivel < TOTAL_RODADAS) {
        proxNivel = nivel + 1;
        showScreen('Rodada ' + nivel + ' vencida!',
          resumo + '<br>Próxima rodada: <strong>' + CARTAS_POR_RODADA[nivel] + ' cartas</strong>',
          'Continuar jogando', true);
          confirmaNaTela = true;   // entre rodadas: X/Esc abrem a pergunta de confirmação
      } else if (ganhou) {
        proxNivel = 1; novoJogo = true;
        showScreen('Você venceu todas as rodadas!', resumo, 'Jogar de novo', true);
      } else {
        proxNivel = 1; novoJogo = true;   // perdeu: recomeça da rodada 1 com pontuação zerada
        showScreen('Você ficou com o Mico!', resumo + '<br>Você volta para a rodada 1, com a pontuação zerada.', 'Tentar de novo', true);
      }
    }

    function start() {
      timers.forEach(clearTimeout); timers = [];
      nivel = proxNivel;
      if (novoJogo) { score = 0; novoJogo = false; }
      distribuir(CARTAS_POR_RODADA[nivel - 1]);
      parJog = 0; combo = 0; rodadas = 0; t0 = agora();
      hl = null; hover = -1; running = true;
      hideScreen();
      hud();
      turnoPlayer();
      raf = requestAnimationFrame(loop);
    }

    startBtn.onclick = start;
    hud();
    activeGame = { cleanup: () => { running = false; timers.forEach(clearTimeout); timers = []; canvas.onclick = null; canvas.onmousemove = null; canvas.style.cursor = ''; statusEl.remove(); } };
  }
  /* ════════════════════════════════════
     JOGO — FUGA DO DESMATAMENTO
  ════════════════════════════════════ */
  function initFuga() {
    titleEl.textContent = 'Fuga pela Floresta';
    scoreEmMetros = true;
    tipEl.textContent   = 'Espaço (ou clique/toque na tela) para pular · Segure para pular mais alto · Colete folhas para acelerar';
    updateHUD(0,'1,0x',3,true,true);
    hudLevel.firstChild.nodeValue = 'Velocidade ';
    showScreen('Fuga pela Floresta',
      'Você é uma <strong>onça-pintada</strong> fugindo do desmatamento!<br>Pule obstáculos com <strong>Espaço, clique ou toque na tela</strong>.');

    const GH=H; const GROUND=GH-50;
    const OBSTACLE_SINK = 12;
        const ZOOM = 1.5;          // 1 = sem zoom · 1.3 = leve · 1.5 = médio · 2 = bem perto
    const VIEW_W = W / ZOOM;   // largura do mundo que aparece na tela
    const ONCA_RENDER_WIDTH = 104;
    const ONCA_RENDER_HEIGHT = 65;
    const ONCA_FOOT_DROP = 14;   // desce a onça até as patas tocarem o chão (maior = onça mais baixa)
const FIRE_VISIBLE_HEIGHT = 80;   // altura que o fogo aparece na tela (aumente para ficar maior)
const FIRE_SRC_W = 250;           // largura de cada frame do fogo (PNG)
const FIRE_SRC_H = 380;           // altura de cada frame do fogo (PNG)
const FIRE_SRC_BOTTOM = 380;      // linha do PNG onde a chama termina (base)
const FIRE_FRAMES = 10;           // quantidade de frames (1F.png ... 10F.png)
const FIRE_FRAME_TICKS = 6;       // ticks por frame (maior = fogo mais lento)
const FIRE_SCALE = FIRE_VISIBLE_HEIGHT / FIRE_SRC_H;
const FIRE_RENDER_WIDTH = FIRE_SRC_W * FIRE_SCALE;
const FIRE_RENDER_HEIGHT = FIRE_SRC_H * FIRE_SCALE;
    let score=0,lives=3,level=1,running=false,dist=0;
    let onca={x:90,y:GROUND,vy:0,onGround:true,w:48,h:32};
    let obstacles=[],powerups=[],bgX=0,speed=3.2,tick=0,obsTick=0,obsInterval=110;
    const velTxt = () => (speed/5.2).toFixed(1).replace('.', ',') + 'x';   // 1,0x no começo, sobe a cada 0,4 de velocidade
    let groundX = 0; 
    const JUMP_V=-11.5, GRAVITY=0.55;
    let jumpTime = 0;
    let jumpDuration = 2 * Math.abs(JUMP_V) / GRAVITY;
    const delta = makeDelta();

    /* ── PIXEL ART SPRITES ── */
    const P = 4; // tamanho de cada "pixel" (escala)

    /* Paleta da onça */
    const Y  = '#f59e0b'; // amarelo-dourado
    const YL = '#fde68a'; // amarelo claro (barriga)
    const BK = '#1c0a00'; // preto/manchas
    const _  = null;      // transparente


//ONÇA CORRENDO
const imgRun1 = new Image();
imgRun1.src = 'assets/games/onca1.png';

const imgRun2 = new Image();
imgRun2.src = 'assets/games/onca2.png';

const imgRun3 = new Image();
imgRun3.src = 'assets/games/onca3.png';

const imgRun4 = new Image();
imgRun4.src = 'assets/games/onca4.png';

const imgRun5 = new Image();
imgRun5.src = 'assets/games/onca5.png';

const imgRun6 = new Image();
imgRun6.src = 'assets/games/onca6.png';

const imgRun7 = new Image();
imgRun7.src = 'assets/games/onca7.png';

const imgRun8 = new Image();
imgRun8.src = 'assets/games/onca8.png';

// ONÇA PULANDO
const imgJump1 = new Image();
imgJump1.src = 'assets/games/onca2.png';

const imgJump2 = new Image();
imgJump2.src = 'assets/games/onca3.png';

const imgJump3 = new Image();
imgJump3.src = 'assets/games/onca4.png';

const imgJump4 = new Image();
imgJump4.src = 'assets/games/onca5.png';

const imgJump5 = new Image();
imgJump5.src = 'assets/games/onca6.png';

//FOGO
const fireImgs = [];      // frames do fogo (o que aparece na tela)
const fireHitImgs = [];   // mesmos frames só com o corpo do fogo (sem faíscas), usado na colisão

function makeFireBodyCanvas(img) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;

  const cx = c.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0);

  const data = cx.getImageData(0, 0, w, h);
  const px = data.data;

  const label = new Int32Array(w * h);   // 0 = pixel ainda não visitado
  const stack = new Int32Array(w * h);
  let nextLabel = 0, bestLabel = 0, bestSize = 0;

  // agrupa os pixels visíveis que estão encostados uns nos outros
  for (let start = 0; start < w * h; start++) {
    if (label[start] !== 0 || px[start * 4 + 3] === 0) continue;

    nextLabel++;
    let size = 0, sp = 0;
    stack[sp++] = start;
    label[start] = nextLabel;

    while (sp > 0) {
      const p = stack[--sp];
      size++;
      const x = p % w;
      const y = (p - x) / w;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const n = ny * w + nx;
          if (label[n] !== 0 || px[n * 4 + 3] === 0) continue;
          label[n] = nextLabel;
          stack[sp++] = n;
        }
      }
    }

    if (size > bestSize) { bestSize = size; bestLabel = nextLabel; }
  }

  // apaga tudo que não for o maior pedaço (as faíscas soltas)
  for (let i = 0; i < w * h; i++) {
    if (label[i] !== bestLabel) px[i * 4 + 3] = 0;
  }
  cx.putImageData(data, 0, 0);
  return c;
}

for (let i = 1; i <= FIRE_FRAMES; i++) {
  const img = new Image();
  img.onload = () => { fireHitImgs[i - 1] = makeFireBodyCanvas(img); };
  img.src = `assets/games/${i}F.png`;
  fireImgs.push(img);
}
// ÁRVORE
const treeImg = new Image();
treeImg.src = 'assets/games/arvore.png';

//CHÃO
const groundImg = new Image();
groundImg.src = 'assets/games/chao.png';

//FUNDO
const fundoImg = new Image();
fundoImg.src = 'assets/games/fundoonca.png';
let fundoX = 0;

//CÉU (imagem parada, fica atrás do fundo)
const ceuImg = new Image();
ceuImg.src = 'assets/games/ceuonca.png';

/*
 * Guarda as máscaras de transparência já calculadas.
 *
 * WeakMap:
 * - cada imagem terá seu próprio cache;
 * - quando a imagem não for mais usada, o navegador poderá
 *   liberar a memória automaticamente.
 */
const pixelMaskCache = new WeakMap();

/*
 * Cria uma máscara com o alpha do sprite.
 *
 * A máscara não trabalha com a imagem original inteira.
 * Ela trabalha com o tamanho em que o sprite realmente aparece
 * no jogo.
 */
function getAlphaMask(sprite) {
  if (!sprite || !sprite.img) {
    return null;
  }

  /*
   * Se a imagem ainda estiver carregando, naturalWidth será 0.
   *
   * Nesse caso, esperamos o próximo frame para criar a máscara.
   */
  if (
    !sprite.img.complete ||
    !sprite.img.naturalWidth
  ) {
    return null;
  }

  /*
   * O sprite pode ter tamanho decimal.
   * A máscara precisa usar números inteiros.
   */
  const width = Math.max(1, Math.ceil(sprite.w));
  const height = Math.max(1, Math.ceil(sprite.h));

  /*
   * Cada imagem terá um Map com máscaras para os seus tamanhos.
   *
   * Exemplo:
   *
   * onca1.png
   *   ├── 80x50
   *   └── 100x60
   */
  let imageMasks = pixelMaskCache.get(sprite.img);

  if (!imageMasks) {
    imageMasks = new Map();
    pixelMaskCache.set(sprite.img, imageMasks);
  }

  const cacheKey = `${width}x${height}`;

  /*
   * Se já criamos essa máscara anteriormente,
   * reutilizamos sem ler os pixels novamente.
   */
  if (imageMasks.has(cacheKey)) {
    return imageMasks.get(cacheKey);
  }

  /*
   * Canvas invisível usado apenas para ler os pixels do sprite.
   */
  const maskCanvas = document.createElement('canvas');

  maskCanvas.width = width;
  maskCanvas.height = height;

  const maskContext = maskCanvas.getContext('2d', {
    willReadFrequently: true
  });

  /*
   * Mantém a mesma configuração de suavização do canvas principal.
   */
  maskContext.imageSmoothingEnabled =
    ctx.imageSmoothingEnabled;

  maskContext.clearRect(
    0,
    0,
    width,
    height
  );

  /*
   * Desenha o sprite no tamanho em que ele aparece no jogo.
   */
  maskContext.drawImage(
    sprite.hitImg || sprite.img,
    0,
    0,
    width,
    height
  );

  /*
   * Lê os pixels RGBA:
   *
   * posição 0 = vermelho
   * posição 1 = verde
   * posição 2 = azul
   * posição 3 = alpha/transparência
   */
  const imageData = maskContext.getImageData(
    0,
    0,
    width,
    height
  );

  /*
   * Guardamos somente o canal alpha.
   *
   * alpha 0   = totalmente transparente
   * alpha > 0 = existe pixel visível
   */
  const alpha = new Uint8Array(
    width * height
  );

  for (
    let i = 0, pixel = 0;
    i < imageData.data.length;
    i += 4, pixel++
  ) {
    alpha[pixel] = imageData.data[i + 3];
  }

  const mask = {
    width,
    height,
    alpha
  };

  /*
   * Guarda a máscara para reutilizar nos próximos frames.
   */
  imageMasks.set(cacheKey, mask);

  return mask;
}

/*
 * Verifica se dois sprites possuem pelo menos um pixel visível
 * ocupando a mesma posição no canvas.
 */
function pixelPerfectCollision(spriteA, spriteB) {
  if (!spriteA || !spriteB) {
    return false;
  }

  if (
    spriteA.w <= 0 ||
    spriteA.h <= 0 ||
    spriteB.w <= 0 ||
    spriteB.h <= 0
  ) {
    return false;
  }

  const maskA = getAlphaMask(spriteA);
  const maskB = getAlphaMask(spriteB);

  /*
   * Se alguma imagem ainda não terminou de carregar,
   * não há máscara disponível.
   */
  if (!maskA || !maskB) {
    return false;
  }

  /*
   * Primeiro calcula a interseção dos retângulos.
   *
   * Isso é apenas uma otimização:
   * se os retângulos nem se encostam,
   * não precisamos verificar pixels.
   */
  const left = Math.max(
    Math.floor(spriteA.hitX1 ?? spriteA.x),
    Math.floor(spriteB.x)
  );

  const right = Math.min(
    Math.ceil(spriteA.hitX2 ?? (spriteA.x + spriteA.w)),
    Math.ceil(spriteB.x + spriteB.w)
  );

  const top = Math.max(
    Math.floor(spriteA.hitY1 ?? spriteA.y),
    Math.floor(spriteB.y)
  );

  const bottom = Math.min(
    Math.ceil(spriteA.hitY2 ?? (spriteA.y + spriteA.h)),
    Math.ceil(spriteB.y + spriteB.h)
  );
  /*
   * Não existe área em comum.
   */
  if (
    left >= right ||
    top >= bottom
  ) {
    return false;
  }

  /*
   * Verifica somente a região em que os sprites
   * podem estar se encostando.
   */
  for (
    let canvasY = top;
    canvasY < bottom;
    canvasY++
  ) {
    /*
     * Converte a coordenada do canvas para a coordenada
     * correspondente dentro da máscara de cada sprite.
     */
    const localAY = Math.floor(
      ((canvasY - spriteA.y) / spriteA.h) *
      maskA.height
    );

    const localBY = Math.floor(
      ((canvasY - spriteB.y) / spriteB.h) *
      maskB.height
    );

    /*
     * Impede que a coordenada saia dos limites da máscara.
     */
    const safeAY = Math.max(
      0,
      Math.min(maskA.height - 1, localAY)
    );

    const safeBY = Math.max(
      0,
      Math.min(maskB.height - 1, localBY)
    );

    for (
      let canvasX = left;
      canvasX < right;
      canvasX++
    ) {
      const localAX = Math.floor(
        ((canvasX - spriteA.x) / spriteA.w) *
        maskA.width
      );

      const localBX = Math.floor(
        ((canvasX - spriteB.x) / spriteB.w) *
        maskB.width
      );

      const safeAX = Math.max(
        0,
        Math.min(maskA.width - 1, localAX)
      );

      const safeBX = Math.max(
        0,
        Math.min(maskB.width - 1, localBX)
      );

      /*
       * Converte X e Y para um índice unidimensional.
       */
      const indexA =
        safeAY * maskA.width + safeAX;

      const indexB =
        safeBY * maskB.width + safeBX;

      /*
       * Só há colisão se os dois pixels forem visíveis.
       */
      if (
        maskA.alpha[indexA] > 0 &&
        maskB.alpha[indexB] > 0
      ) {
        return true;
      }
    }
  }

  return false;
}

    function drawPixelSprite(sprite, px, py, scale) {
      const s = scale || P;
      sprite.forEach((row, ry) => {
        row.forEach((col, rx) => {
          if (!col) return;
          ctx.fillStyle = col;
          ctx.fillRect(px + rx * s, py + ry * s, s, s);
        });
      });
    }

    /*
 * Escolhe qual imagem da onça deve ser usada neste frame.
 */
function getCurrentOncaImage() {
  let img;

  /*
   * Durante o pulo, escolhe o frame de acordo
   * com o progresso do pulo.
   */
  if (!onca.onGround) {
    const t = jumpTime / jumpDuration;

    if (t < 0.2) {
      img = imgJump1;
    } else if (t < 0.4) {
      img = imgJump2;
    } else if (t < 0.6) {
      img = imgJump3;
    } else if (t < 0.8) {
      img = imgJump4;
    } else {
      img = imgJump5;
    }
  }

  /*
   * No chão, escolhe um frame da animação de corrida.
   */
  else {
    const frame = Math.floor(tick / 2.4) % 8;

    if (frame === 0) img = imgRun1;
    else if (frame === 1) img = imgRun2;
    else if (frame === 2) img = imgRun3;
    else if (frame === 3) img = imgRun4;
    else if (frame === 4) img = imgRun5;
    else if (frame === 5) img = imgRun6;
    else if (frame === 6) img = imgRun7;
    else img = imgRun8;
  }

  return img;
}

/*
 * Atualiza a posição e o tamanho do sprite atual da onça.
 *
 * A colisão usará exatamente estes mesmos dados.
 */
function updateOncaSprite() {
  const img = getCurrentOncaImage();

  const w = ONCA_RENDER_WIDTH;
  const h = ONCA_RENDER_HEIGHT;

  /*
   * onca.x representa o centro horizontal da onça.
   * Por isso subtraímos metade da largura.
   */
  const px = onca.x - w / 2;

  /*
   * onca.y representa a posição dos pés.
   * Por isso desenhamos a imagem acima de onca.y.
   */
  const py = onca.y - h + ONCA_FOOT_DROP;

  /*
   * Esta é a representação usada pela colisão por pixels.
   */
  onca.sprite = {
    img,
    x: px,
    y: py,
    w,
    h,
    /* área da onça que realmente conta para o dano (o resto é só desenho) */
    hitX1: px + w * 0.1,
    hitX2: px + w * 0.9,
    hitY1: py + h * 0.1,
    hitY2: py + h * 0.9
  };

  /*
   * Mantemos os valores antigos para os outros obstáculos,
   * que ainda usam colisão retangular.
   *
   * Isso preserva o comportamento anterior:
   * a hitbox antiga tinha 70% da largura visual.
   */
  onca.w = w * 0.7;
  onca.h = h;

  return onca.sprite;
}

/*
 * Desenha a onça usando o sprite preparado.
 */
function drawOnca() {
  const sprite = updateOncaSprite();

  /*
   * Evita tentar desenhar uma imagem que ainda não terminou
   * de carregar.
   */
  if (
    sprite.img &&
    sprite.img.complete &&
    sprite.img.naturalWidth > 0
  ) {
    ctx.drawImage(
      sprite.img,
      sprite.x,
      sprite.y,
      sprite.w,
      sprite.h
    );
  }
}




    /* Árvores de fundo (menores, mais escuras) */
    const TREE_CANOPY_BG = [
      [_,_,BK,'#0a3320','#0d4428','#0a3320',BK,_,_],
      [_,BK,'#0d4428','#155e38','#1a7a48','#155e38','#0d4428',BK,_],
      [BK,'#0a3320','#155e38','#1a7a48','#155e38','#1a7a48','#155e38','#0a3320',BK],
      [BK,'#0d4428','#1a7a48','#155e38','#0d4428','#155e38','#1a7a48','#0d4428',BK],
      [_,BK,'#0a3320','#0d4428','#155e38','#0d4428','#0a3320',BK,_],
      [_,_,BK,'#0a3320','#0d4428','#0a3320',BK,_,_],
      [_,_,_,BK,BK,BK,_,_,_],
    ];
    const TRUNK_BG = [
      [_,'#3d1f0d','#3d1f0d',_],
      ['#2d1508','#3d1f0d','#3d1f0d','#2d1508'],
      ['#2d1508','#3d1f0d','#2d1508','#2d1508'],
    ];


    const treeBgImg = new Image();
treeBgImg.src = 'assets/games/arvore1fundo.png';

const BG_TREE_HEIGHT = 120;
const BG_TREE_WIDTH = BG_TREE_HEIGHT * (1224 / 1285);

    /* Posições fixas das árvores de fundo */
    const BG_TREES = [
      {x:55, scale:0.9},{x:185, scale:0.7},{x:330, scale:1.0},
      {x:475, scale:0.75},{x:615, scale:0.85},
    ];

const OBS_TYPES=[
  {type:'tree'},
  {type:'tree'},
  {type:'fire'},
  {w:52,h:28,c:'#607d8b',label:'🚜',type:'machine'},
];

    function jump(){
  if(running && onca.onGround){
    onca.vy = JUMP_V;
    onca.onGround = false;
    jumpTime = 0; // 👈 importante
  }
}

    const JUMP_CUT = -8;   // mais perto de 0 = toque mais curto · mais negativo = toque mais alto
    function releaseJump(){
      if(!onca.onGround && onca.vy < JUMP_CUT) onca.vy = JUMP_CUT;
    }

    let holdingJump = false;

    const keyH=e=>{
      if(paused)return;
      if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();holdingJump=true;jump();}
    };
    const keyU=e=>{
      if(e.code==='Space'||e.code==='ArrowUp'){holdingJump=false;releaseJump();}
    };
    document.addEventListener('keydown',keyH);
    document.addEventListener('keyup',keyU);

    /* clique do mouse e toque na tela também pulam (segurar = pulo mais alto) */
    canvas.style.touchAction='none';
    canvas.onpointerdown=e=>{ if(paused)return; try{canvas.setPointerCapture(e.pointerId);}catch(_){} holdingJump=true; jump(); };
    canvas.onpointerup=e=>{ holdingJump=false; releaseJump(); };
    canvas.onpointercancel=()=>{ holdingJump=false; releaseJump(); };

function drawFire(ob) {
  /*
   * Escolhe o frame atual da animação do fogo.
   */
  const frame = Math.floor(tick / FIRE_FRAME_TICKS) % FIRE_FRAMES;
  const img = fireImgs[frame];
   /*
   * Desenha a imagem inteira (1920x1080) reduzida pela escala do fogo.
   * A base da chama (linha 1012 do PNG) fica exatamente no chão.
   */
  const w = FIRE_RENDER_WIDTH;
  const h = FIRE_RENDER_HEIGHT;

  const y =
    GROUND + OBSTACLE_SINK - FIRE_SRC_BOTTOM * FIRE_SCALE;
  /*
   * Atualiza as dimensões do obstáculo.
   */
  ob.w = w;
  ob.h = h;

  /*
   * Guarda o frame atual do fogo para a colisão.
   */
  ob.sprite = {
    img,
    hitImg: fireHitImgs[frame],
    x: ob.x,
    y,
    w,
    h
  };

  /*
   * Desenha exatamente o mesmo sprite que será usado
   * na análise de colisão.
   */
  if (
    img.complete &&
    img.naturalWidth > 0
  ) {
    ctx.drawImage(
      img,
      ob.x,
      y,
      w,
      h
    );
  }
}

function drawTree(ob) {
  if (
    !treeImg.complete ||
    treeImg.naturalWidth <= 0
  ) {
    return;
  }

  /*
   * Procura o último pixel não transparente
   * na parte inferior da árvore.
   */
  if (
    !ob.treeBottomOffsetCalculated
  ) {

    const tempCanvas =
      document.createElement('canvas');

    tempCanvas.width =
      treeImg.naturalWidth;

    tempCanvas.height =
      treeImg.naturalHeight;

    const tempCtx =
      tempCanvas.getContext('2d');

    tempCtx.drawImage(
      treeImg,
      0,
      0
    );

    const imageData =
      tempCtx.getImageData(
        0,
        0,
        treeImg.naturalWidth,
        treeImg.naturalHeight
      );

    let bottomPixel =
      treeImg.naturalHeight - 1;

    /*
     * Procura de baixo para cima
     * o primeiro pixel visível.
     */
    for (
      let y = treeImg.naturalHeight - 1;
      y >= 0;
      y--
    ) {

      let found = false;

      for (
        let x = 0;
        x < treeImg.naturalWidth;
        x++
      ) {

        const alpha =
          imageData.data[
            (y * treeImg.naturalWidth + x) * 4 + 3
          ];

        if (alpha > 0) {
          bottomPixel = y;
          found = true;
          break;
        }
      }

      if (found) break;
    }

    /*
     * Guarda a distância entre o final da imagem
     * e o último pixel realmente visível.
     */
    ob.treeBottomOffset =
      treeImg.naturalHeight - 1 - bottomPixel;

    ob.treeBottomOffsetCalculated = true;
  }

  /*
   * Ajusta a posição vertical.
   *
   * Assim o último pixel visível da árvore
   * fica exatamente sobre o GROUND.
   */
const transparentBottom =
  ob.treeBottomOffset *
  (ob.h / treeImg.naturalHeight);

const drawY =
  ob.oy + transparentBottom + OBSTACLE_SINK;
  /*
   * Sprite usado pela colisão.
   *
   * IMPORTANTE:
   * usamos a mesma posição em que a imagem
   * realmente está sendo desenhada.
   */
  ob.sprite = {
    img: treeImg,
    x: ob.x,
    y: ob.oy,
    w: ob.w,
    h: ob.h
  };

  /*
   * Desenha a árvore.
   */
  ctx.drawImage(
    treeImg,
    ob.x,
    drawY,
    ob.w,
    ob.h
  );

  /*
   * Corrige a posição do sprite de colisão
   * para acompanhar exatamente o desenho.
   */
  ob.sprite.y = drawY;
}

function drawObstacle(ob) {
  if (ob.type === 'tree') {

    drawTree(ob);

  } else if (ob.type === 'fire') {

    drawFire(ob);

  } else {

    ctx.font = `${ob.w}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    ctx.fillText(
      ob.label,
      ob.x + ob.w / 2,
      ob.oy + ob.h
    );
  }
}

function getTreeBottomOffset() {
  if (
    !treeImg.complete ||
    !treeImg.naturalWidth
  ) {
    return 0;
  }

  const canvas =
    document.createElement('canvas');

  canvas.width =
    treeImg.naturalWidth;

  canvas.height =
    treeImg.naturalHeight;

  const c =
    canvas.getContext('2d');

  c.drawImage(
    treeImg,
    0,
    0
  );

  const data =
    c.getImageData(
      0,
      0,
      treeImg.naturalWidth,
      treeImg.naturalHeight
    ).data;

  for (
    let y = treeImg.naturalHeight - 1;
    y >= 0;
    y--
  ) {

    for (
      let x = 0;
      x < treeImg.naturalWidth;
      x++
    ) {

      const alpha =
        data[
          (y * treeImg.naturalWidth + x) * 4 + 3
        ];

      if (alpha >= 128) {

        return (
          treeImg.naturalHeight - 1 - y
        );
      }
    }
  }

  return 0;
}

    function spawnObs(){
      const t = OBS_TYPES[~~(Math.random() * OBS_TYPES.length)];
if (t.type === 'tree') {

  const sc = 0.06;

  const dw =
    treeImg.naturalWidth * sc;

  const dh =
    treeImg.naturalHeight * sc;

  obstacles.push({
    x: VIEW_W + 20,
    oy: GROUND - dh,
    w: dw,
    h: dh,
    type: 'tree'
  });

}
      else if (t.type === 'fire') {
        obstacles.push({
          x: VIEW_W + 20,
          oy: GROUND,
          w: FIRE_RENDER_WIDTH,
          h: FIRE_RENDER_HEIGHT,
          type: 'fire'
        });

} else {
  const isLow = t.type==='low'||t.type==='machine';
  obstacles.push({
    x:VIEW_W+20,
    y:isLow?GROUND-t.h/2:GROUND-t.h,
    ...t,
    oy:isLow?GROUND-t.h/2:GROUND-t.h
  });
}



      if(Math.random()<0.25)powerups.push({x:VIEW_W+60+Math.random()*80,y:GROUND-70,emoji:'🍃',alive:true});
    }

    function loop(ts){
      if(!running)return;
      const dt=delta(ts);
      tick+=dt;
      dist+=speed*dt; score=~~(dist/6);
      speed=4.8+level*0.4; if(dist>level*1700)level++;
      updateHUD(score,velTxt(),lives);
      clrCanvas();
            ctx.save();
      ctx.translate(0, H * (1 - ZOOM));
      ctx.scale(ZOOM, ZOOM);

            /* fundo contínuo: a imagem alterna normal/espelhada, então a emenda nunca aparece */
      ctx.fillStyle = '#5CE1E6'; ctx.fillRect(0, 0, VIEW_W, GH);

            /* céu parado: preenche a parte visível da tela (com o zoom, o topo do mundo fica cortado) */
      if (ceuImg.complete && ceuImg.naturalWidth > 0) {
        const ceuTopo = GH * (ZOOM - 1) / ZOOM;      // y do mundo que fica no topo da tela
        const ceuAlt = GH - ceuTopo;                 // altura visível
        const cs = Math.max(VIEW_W / ceuImg.naturalWidth, ceuAlt / ceuImg.naturalHeight);
        const cw = ceuImg.naturalWidth * cs, ch = ceuImg.naturalHeight * cs;
        ctx.drawImage(ceuImg, (VIEW_W - cw) / 2, ceuTopo + (ceuAlt - ch) / 2, cw, ch);
      }
      if (fundoImg.complete && fundoImg.naturalWidth > 0) {
        const fh = 400;                      // altura da imagem no jogo (maior = floresta maior)
        const fy = (GROUND + 20) - fh;       // base da floresta fica escondida atrás do chão
        const fw = Math.round(fh * fundoImg.naturalWidth / fundoImg.naturalHeight);
        const srcH = fundoImg.naturalHeight - 2;   // corta a linha clara do último pixel da imagem
        fundoX -= speed * 0.25 * dt;         // paralaxe: mais lento que o chão
        if (fundoX <= -2 * fw) fundoX += 2 * fw;
        for (let k = 0; fundoX + k * fw < VIEW_W + fw; k++) {
          const x = Math.round(fundoX + k * fw);
          if (k % 2) {
            ctx.save(); ctx.translate(x + fw + 1, 0); ctx.scale(-1, 1);
            ctx.drawImage(fundoImg, 0, 0, fundoImg.naturalWidth, srcH, 0, fy, fw + 1, fh);
            ctx.restore();
          } else {
            ctx.drawImage(fundoImg, 0, 0, fundoImg.naturalWidth, srcH, x, fy, fw + 1, fh);
          }
        }
      }

/* 🆕 CHÃO COM IMAGEM AJUSTADO */
const groundHeight = 320;

// ajuste fino (esse é o segredo)
const groundOffset = 258;

groundX -= speed * dt;

if (groundX <= -groundImg.width) {
  groundX += groundImg.width;
}

ctx.drawImage(
  groundImg,
  groundX,
  GROUND - groundOffset,
  groundImg.width,
  groundHeight
);

ctx.drawImage(
  groundImg,
  groundX + groundImg.width,
  GROUND - groundOffset,
  groundImg.width,
  groundHeight
);

      /* powerups */
      powerups.forEach(p=>{
        if(!p.alive)return;
        ctx.font='22px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(p.emoji,p.x,p.y); p.x-=speed*dt;
        if(Math.abs(p.x-onca.x)<30&&Math.abs(p.y-(GROUND-30))<30){p.alive=false;score+=25;popup(p.x,p.y,'#fbbf24','+25');}
        if(p.x<-20)p.alive=false;
      });

if (holdingJump) jump();

/*
 * Atualiza primeiro a física da onça.
 *
 * Assim a colisão será calculada usando a posição atual
 * da onça durante o pulo.
 */
if (!onca.onGround) {
  onca.vy += GRAVITY * dt;
  onca.y += onca.vy * dt;

  jumpTime += dt;
}

/*
 * Verifica se a onça chegou ao chão.
 */
if (onca.y >= GROUND) {
  onca.y = GROUND;
  onca.vy = 0;
  onca.onGround = true;
  jumpTime = 0;
}

/*
 * Prepara o frame atual da onça antes da colisão.
 *
 * Essa função cria:
 *
 * onca.sprite.img
 * onca.sprite.x
 * onca.sprite.y
 * onca.sprite.w
 * onca.sprite.h
 */
updateOncaSprite();

/*
 * Obstáculos.
 */
let hit = false;

obstacles.forEach(ob => {
  /*
   * Move o obstáculo antes de desenhar.
   *
   * Dessa forma, a posição visual e a posição usada
   * na colisão são iguais.
   */
  ob.x -= speed * dt;

  /*
   * Para o fogo, drawObstacle() chama drawFire().
   * drawFire() cria ob.sprite com o frame atual.
   */
  drawObstacle(ob);

  let collided = false;

  /*
   * O fogo usa colisão por pixels visíveis.
   */
 /*
 * Fogo e árvore usam colisão por pixels.
 *
 * Somente pixels com alpha > 0
 * são considerados na colisão.
 */
if (
  ob.type === 'fire' ||
  ob.type === 'tree'
) {

  collided = pixelPerfectCollision(
    onca.sprite,
    ob.sprite
  );

}

/*
 * Máquina continua usando
 * a colisão retangular.
 */
else {

  const oh = onca.h;

  const ox1 =
    onca.x - onca.w * 0.3;

  const ox2 =
    onca.x + onca.w * 0.3;

  const oy2 =
    onca.y - oh + ONCA_FOOT_DROP;

  const obRight =
    ob.x + ob.w;

  collided =
    obRight > ox1 &&
    ob.x < ox2 &&
    ob.oy < oy2 + oh &&
    ob.oy + ob.h > oy2;
}
  /*
   * Se a colisão aconteceu, perde uma vida.
   */
  if (!hit && collided) {
    ob.x = -200;
    hit = true;

    lives--;

    shakePanel();

    updateHUD(
      score,
      velTxt(),
      lives
    );

    if (lives <= 0) {
      end(false);
      return;
    }
  }
});

/*
 * Remove obstáculos que saíram da tela.
 */
obstacles = obstacles.filter(
  o => o.x > -200
);

/*
 * Remove folhas coletadas ou que saíram da tela.
 */
powerups = powerups.filter(
  p => p.alive && p.x > -30
);

/*
 * Desenha a onça depois da colisão.
 *
 * A função desenhará o mesmo frame que foi
 * preparado em updateOncaSprite().
 */
drawOnca();
ctx.restore();
      /* spawn obs */
      obsTick+=dt; if(obsTick>=obsInterval){obsTick=0;obsInterval=Math.max(55,110-level*8);spawnObs();}


      raf=requestAnimationFrame(loop);
    }

    function end(won){
      running=false;cancelAnimationFrame(raf);
      showScreen(won?'🐆 Onça Salva!':'💀 A onça foi capturada...',
        `Distância percorrida: <strong>${~~(dist/6)} m</strong><br>${won?'A onça escapou para a reserva!':'Tente de novo!'}`,
        'Correr de novo', true);
    }
    function start(){holdingJump=false;score=0;lives=3;level=1;dist=0;speed=3.2;tick=0;obsTick=0;obsInterval=110;
      obstacles=[];powerups=[];onca={x:90,y:GROUND,vy:0,onGround:true,w:48,h:32};
      running=true;hideScreen();updateHUD(0,'1,0x',3);delta.reset();raf=requestAnimationFrame(loop);}
    startBtn.onclick=start;
    activeGame={cleanup:()=>{running=false;document.removeEventListener('keydown',keyH);document.removeEventListener('keyup',keyU);canvas.onpointerdown=null;canvas.onpointerup=null;canvas.onpointercancel=null;canvas.style.touchAction='';}};
  }

  /* ════════════════════════════════════
     JOGO 3 — CHUVA ÁCIDA
  ════════════════════════════════════ */
  
  /* ════════════════════════════════════
     JOGO — DEFENDER O RIO
  ════════════════════════════════════ */
  function initRio() {
    titleEl.textContent = '🌊 Defender o Rio';
    tipEl.textContent   = 'Clique para colocar filtros no rio · Bloqueie o lixo antes do mar!';
    updateHUD(0,1,3,true,true);
    showScreen('Defender o Rio',
      'O rio está sendo poluído! <strong>Clique na tela</strong> para colocar filtros e bloquear o lixo.<br>Se chegar ao <strong>oceano</strong>, você perde uma vida.');

    const RIVER_Y1=H*.35, RIVER_Y2=H*.65, RIVER_CX=(RIVER_Y1+RIVER_Y2)/2;
    const OCEAN_X=W-60;
    const LIXO_TYPES=['🏭','⛏️','🗑️','🧪','🚢','☢️'];
    const FILTER_TIME=220;

    let score=0,lives=3,level=1,running=false,tick=0,spawnI=90,spawnAccum=0;
    let particles=[],filters=[],waterQuality=100;
    const delta=makeDelta();

    function spawnLixo(){
      particles.push({x:-20,y:RIVER_Y1+10+Math.random()*(RIVER_Y2-RIVER_Y1-20),emoji:LIXO_TYPES[~~(Math.random()*LIXO_TYPES.length)],speed:1.2+level*0.25+Math.random()*.8,dead:false,size:24+~~(Math.random()*10)});
    }

    const clickH=e=>{
      if(!running)return;
      const r=canvas.getBoundingClientRect();
      const fx=(e.clientX-r.left)*(W/r.width);
      const fy=(e.clientY-r.top)*(H/r.height);
      if(fy<RIVER_Y1-10||fy>RIVER_Y2+10)return;
      filters.push({x:fx,y:RIVER_CX,life:FILTER_TIME,max:FILTER_TIME,r:22});
    };
    canvas.addEventListener('click',clickH);

    function drawRiver(){
      /* fundo */
      const sky=ctx.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,'#041208'); sky.addColorStop(0.6,'#061a0c'); sky.addColorStop(1,'#0a1e0e');
      ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
      /* margens */
      ctx.fillStyle='#0d2e16'; ctx.fillRect(0,0,W,RIVER_Y1);
      ctx.fillStyle='#0a2810'; ctx.fillRect(0,RIVER_Y2,W,H-RIVER_Y2);
      /* vegetação margem */
      for(let i=0;i<8;i++){
        const gx=i*(W/7)+20;
        ctx.font='20px serif'; ctx.textAlign='center';
        ctx.fillText('🌿',gx,RIVER_Y1-4);
        ctx.fillText('🌿',gx,RIVER_Y2+18);
      }
      /* rio */
      const rg=ctx.createLinearGradient(0,RIVER_Y1,0,RIVER_Y2);
      const quality=waterQuality/100;
      rg.addColorStop(0,`rgba(${~~(8+180*(1-quality))},${~~(120*quality)},${~~(200*quality)},0.9)`);
      rg.addColorStop(1,`rgba(${~~(6+160*(1-quality))},${~~(100*quality)},${~~(180*quality)},0.95)`);
      ctx.fillStyle=rg; ctx.fillRect(0,RIVER_Y1,W,RIVER_Y2-RIVER_Y1);
      /* ondas */
      ctx.strokeStyle=`rgba(255,255,255,${0.04+quality*0.06})`; ctx.lineWidth=1;
      for(let i=0;i<5;i++){
        const wy=RIVER_Y1+10+(i*(RIVER_Y2-RIVER_Y1)/5);
        ctx.beginPath();
        for(let x=0;x<W;x+=4){ctx.lineTo(x,wy+Math.sin((x+tick*2+i*30)*0.04)*3);}
        ctx.stroke();
      }
      /* oceano */
      const og=ctx.createLinearGradient(OCEAN_X,0,W,0);
      og.addColorStop(0,'transparent');
      og.addColorStop(1,`rgba(${~~(10+160*(1-quality))},${~~(80*quality)},${~~(160*quality)},0.7)`);
      ctx.fillStyle=og; ctx.fillRect(OCEAN_X,RIVER_Y1,W-OCEAN_X,RIVER_Y2-RIVER_Y1);
      ctx.fillStyle='rgba(34,197,94,0.5)'; ctx.font='bold 10px monospace';
      ctx.textAlign='center'; ctx.fillText('OCEANO',W-28,RIVER_CX+4);
      /* indicador qualidade */
      const qw=120,qx=14,qy=14;
      ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(qx,qy,qw,8);
      ctx.fillStyle=waterQuality>60?'#22c55e':waterQuality>30?'#f59e0b':'#ef4444';
      ctx.fillRect(qx,qy,qw*(waterQuality/100),8);
      ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='9px monospace';
      ctx.textAlign='left'; ctx.fillText(`Qualidade: ${~~waterQuality}%`,qx,qy-2);
    }

    function loop(ts){
      if(!running)return;
      const dt=delta(ts);
      tick+=dt; spawnI=Math.max(32,90-level*7);
      spawnAccum+=dt;
      if(spawnAccum>=spawnI){spawnAccum=0;spawnLixo();}
      if(score>=level*110)level++;
      clrCanvas(); drawRiver();

      /* filtros */
      filters=filters.filter(f=>f.life>0);
      filters.forEach(f=>{
        f.life-=dt;
        const alpha=f.life/f.max;
        ctx.beginPath(); ctx.arc(f.x,f.y,f.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(34,197,94,${alpha*0.25})`; ctx.fill();
        ctx.strokeStyle=`rgba(34,197,94,${alpha*0.7})`; ctx.lineWidth=2; ctx.stroke();
        ctx.font='16px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.globalAlpha=alpha; ctx.fillText('🔵',f.x,f.y); ctx.globalAlpha=1;
      });

      /* lixo */
      particles.forEach(p=>{
        if(p.dead)return; p.x+=p.speed*dt;
        ctx.font=`${p.size}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(p.emoji,p.x,p.y);
        /* colisão filtro */
        filters.forEach(f=>{
          if(!p.dead&&Math.hypot(p.x-f.x,p.y-f.y)<f.r+p.size/2){
            p.dead=true; score+=12; waterQuality=Math.min(100,waterQuality+3);
            updateHUD(score,level,lives); popup(p.x,p.y,'#22c55e','+12');
          }
        });
        /* chegou ao oceano */
        if(p.x>OCEAN_X&&!p.dead){
          p.dead=true; lives--; waterQuality=Math.max(0,waterQuality-12);
          shakePanel(); updateHUD(score,level,lives); popup(OCEAN_X,RIVER_CX,'#ef4444','💀 Poluído!');
          if(lives<=0){end(false);return;}
        }
      });
      particles=particles.filter(p=>!p.dead&&p.x<W+30);
      updateHUD(score,level,lives);
      raf=requestAnimationFrame(loop);
    }

    function end(won){
      running=false;cancelAnimationFrame(raf);
      showScreen(won?'🌊 Rio Limpo!':'☠️ Rio destruído...',
        `Poluentes bloqueados: <strong>${score}</strong><br>Qualidade final da água: <strong>${~~waterQuality}%</strong><br>${won?'O ecossistema aquático foi salvo!':'Tente de novo!'}`,
        won?'Jogar de novo':'Tentar novamente', true);
    }
    function start(){score=0;lives=3;level=1;tick=0;spawnAccum=0;waterQuality=100;particles=[];filters=[];running=true;hideScreen();updateHUD(0,1,3);delta.reset();raf=requestAnimationFrame(loop);}
    startBtn.onclick=start;
    activeGame={cleanup:()=>{running=false;canvas.removeEventListener('click',clickH);canvas.onclick=null;}};
  }
})();