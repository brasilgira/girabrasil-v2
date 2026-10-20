/* =============================================
   GIRABRASIL — JOGOS.JS
   Jogos importados do protótipo Gira:
   Quiz de Espécies, Guarda da Floresta,
   Fuga do Desmatamento, Volta ao Rio
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

  /* ── Ranking (js/ranking-jogos.js) ──
     Falhar aqui nunca pode atrapalhar o jogo: sem login, sem rede ou com o
     servidor fora do ar, a partida segue normal e só não entra no ranking. */
  function iniciarRanking(jogo) {
    return window.GiraRanking ? window.GiraRanking.iniciar(jogo) : null;
  }
  let envioRankingAtual = 0;
  function enviarAoRanking(partida, pontuacao, jogo) {
    if (!partida || !window.GiraRanking) return;
    const meuEnvio = ++envioRankingAtual;
    window.GiraRanking.enviar(partida, pontuacao).then(r => {
      /* só escreve se a tela de resultado ainda é a desta partida */
      if (!r || meuEnvio !== envioRankingAtual || screenEl.style.display === 'none') return;
      if (!Number.isInteger(r.posicao)) return;
      screenDesc.insertAdjacentHTML('beforeend',
        '<br>Posição no ranking: <strong>#' + r.posicao + '</strong>' + (r.novoRecorde ? ' (novo melhor resultado)' : '') +
        ' · <a href="ranking.html#' + jogo + '" style="color:inherit;text-decoration:underline;text-underline-offset:3px">Ver ranking</a>');
    });
  }
  function popup(x, y, color, text, grande) {
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
    el.className = 'hit-popup' + (grande ? ' popup-grande' : '');
    el.style.left  = (rect.left - wrapRect.left + ox + x * sx) + 'px';
    el.style.top   = (rect.top - wrapRect.top + oy + y * sy - (grande ? 0 : 12)) + 'px';
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
      case 'missao-biodiversidade':     initSapo();     break;
      /* aliases (ids originais do protótipo) */
      case 'especies': initEspecies(); break;
      case 'mico':     initMico();     break;
      case 'fuga':     initFuga();     break;
      case 'rio':      initSapo();     break;
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
      popup(W / 2, H / 2, '#22c55e', `+${pontos}`, true);
    } else {
      lives--;
      btn.classList.add('wrong');
      opcoesEl.querySelectorAll('.especie-btn').forEach(b => {
        if (b.dataset.nome === current.nome) b.classList.add('correct');
      });
      popup(W / 2, H / 2, '#f87171', 'Errou', true);
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
        popup(W / 2, H / 2, '#f87171', 'Tempo!', true);
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
const imgLogo = new Image(); imgLogo.src = 'assets/logo/logobranco.png';

    /* tamanho base da carta (todo o desenho é feito nessa escala) */
const CW = 100, CH = 140, MAO_W = W - 60, MARGEM_Y = 38, TOP_Y = MARGEM_Y, BOT_Y = H - MARGEM_Y - CH;
    let player = [], bot = [], descarte = [], PARES = [];
    /* PONTUAÇÃO (feita pra ranking, quase nunca empata):
       100 por par · +50 por combo (pares seguidos em turnos seguidos)
       vitória na rodada: +1000, +1 a cada 0,1 s abaixo de 5 min, +25 por turno abaixo de 40.
       A pontuação soma de rodada em rodada e começa do zero. */
    const PTS_PAR = 100, PTS_COMBO = 50, PTS_VITORIA = 1000, TEMPO_BONUS_MS = 300000, RODADAS_BONUS = 40;
    let parJog = 0, combo = 0, rodadas = 0, t0 = 0;
    let nivel = 1, proxNivel = 1, novoJogo = true;
        let paresAcum = 0;   // pares formados nas rodadas anteriores (zera quando perde ou recomeça)
    let partidaRanking = null;   // partida do ranking: vale pela jogada inteira (todas as rodadas)
    let score = 0, running = false, fase = 'fim', hl = null, hover = -1, timers = [];
    let voo = null;   // carta em animação (voando de uma mão pra outra)
let efeitosPar = [];   // pares que estão indo pro meio da mesa
let restoX = [];   // x que cada carta restante da mão tinha antes de tirar os pares
const PAR_FLY = 450, PAR_JOIN = 350, PAR_VAN = 300, PAR_STAG = 300;   // ms: ir pro meio · juntar · sumir · intervalo entre pares
const PAR_TOTAL = PAR_FLY + PAR_JOIN + PAR_VAN;
/* quando (em ms) os pontos aparecem e o turno seguinte pode continuar */
const temposPar = n => {
  const sumir = (n - 1) * PAR_STAG + PAR_FLY + PAR_JOIN;
  return { sumir, fim: sumir + PAR_VAN + 200 };
};


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
      
      livesEl.textContent = paresAcum + parJog;   // pares que VOCÊ formou desde o início do jogo, somando todas as rodadas
    }

/* tira os pares de uma mão; devolve quantos pares saíram.
   lado: 'player' ou 'bot' (de onde as cartas saem, pra animação) */
function tirarPares(mao, lado) {
  const pos = layout(mao, lado === 'player' ? BOT_Y : TOP_Y);   // posições antes de tirar
  let n = 0, achou = true;
  while (achou) {
    achou = false;
    for (let i = 0; i < mao.length && !achou; i++) {
      if (mao[i].mico) continue;
      for (let j = i + 1; j < mao.length; j++) {
        if (mao[j].id === mao[i].id) {
          efeitosPar.push({
            carta: mao[i], lado,
            ax: pos[i].x, ay: pos[i].y, bx: pos[j].x, by: pos[j].y,
            ini: agora() + n * PAR_STAG
          });
          descarte.push(mao[i]);
          mao.splice(j, 1); mao.splice(i, 1);
          pos.splice(j, 1); pos.splice(i, 1);
          n++; achou = true; break;
        }
      }
    }
  }
restoX = pos.map(p => p.x);
return n;
}

/* embaralha uma mão SEM animação, de forma totalmente aleatória:
   cada carta pode cair em qualquer lugar, inclusive no mesmo onde estava.
   (xAntes e y continuam como parâmetros só para não precisar mexer nas chamadas) */
function embaralharMao(mao, xAntes, y) {
  const r = [...mao];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/* depois que o jogador escolhe: embaralha a mão do oponente e passa a vez */
function aposEscolha() {
  if (checarFim()) return;
  bot = embaralharMao(bot, layout(bot, TOP_Y).map(p => p.x), TOP_Y);
  turnoBot();
}

    /* distribui as cartas da rodada: cada mão recebe UMA de cada animal,
       então ninguém começa com par; o mico vai pra um dos lados */
    function distribuir(totalCartas) {
      const nPares = (totalCartas - 1) / 2;
      PARES = shuffle(TODAS).slice(0, nPares);
      player = [...PARES]; bot = [...PARES]; descarte = [];
      (Math.random() < 0.55 ? player : bot).push(MICO);
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

    /* ── ANIMAÇÃO: a carta voa até a mão de quem pegou e depois gira, se revelando ── */
    const VOO_MS = 520, VIRA_MS = 410;
    function voar(cfg, fim) {   // cfg: { carta, lado, x0, y0, x1, y1, faceIni, faceFim }
      voo = { ...cfg, ini: agora(), fim };
    }
    function desenharVoo() {
      if (!voo) return;
      const t = agora() - voo.ini;
      let x, y, k = 1, flip = 1, face = voo.faceIni;
      if (t < VOO_MS) {
        const p = t / VOO_MS;
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;   // começa e termina suave
        x = voo.x0 + (voo.x1 - voo.x0) * e;
        y = voo.y0 + (voo.y1 - voo.y0) * e;
        k = 1 + 0.15 * Math.sin(Math.PI * p);   // cresce um pouco no meio do voo
      } else {
        x = voo.x1; y = voo.y1;
        const p = Math.min(1, (t - VOO_MS) / VIRA_MS);
        flip = Math.max(0.03, Math.abs(Math.cos(Math.PI * p)));   // 1 -> 0 -> 1
        face = p < 0.5 ? voo.faceIni : voo.faceFim;               // troca de lado no meio do giro
      }
      drawCard(x - (k - 1) * CW / 2, y - (k - 1) * CH / 2, k, voo.carta, face, null, flip);
      if (t >= VOO_MS + VIRA_MS) { const f = voo.fim; voo = null; f(); }
    }

/* pares: as duas cartas vão pro meio, se juntam uma sobre a outra e somem */
function desenharEfeitosPar() {
  if (!efeitosPar.length) return;
  const now = agora();
  efeitosPar = efeitosPar.filter(f => now - f.ini < PAR_TOTAL);
  const cx = W / 2 - CW / 2, cy = H / 2 - CH / 2, SEP = CW * 0.62, EMP = 5;   // EMP: quanto uma fica deslocada sobre a outra
  const ease = p => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  efeitosPar.forEach(f => {
    const t = now - f.ini;
    let ax = f.ax, ay = f.ay, bx = f.bx, by = f.by, k = 1, alfa = 1;
    let face = f.lado === 'player';              // cartas do oponente se revelam no caminho
    if (t >= PAR_FLY + PAR_JOIN) {               // some
      const p = (t - PAR_FLY - PAR_JOIN) / PAR_VAN;
      ax = cx; ay = cy; bx = cx + EMP; by = cy + EMP;
      k = 1 + 0.35 * p; alfa = 1 - p; face = true;
    } else if (t >= PAR_FLY) {                   // junta
      const p = (t - PAR_FLY) / PAR_JOIN, e = ease(p);
      ax = cx - SEP * (1 - e); ay = cy;
      bx = cx + SEP * (1 - e) + EMP * e; by = cy + EMP * e;
      k = 1 + 0.12 * Math.sin(Math.PI * p); face = true;
    } else if (t >= 0) {                         // vai pro meio
      const p = t / PAR_FLY, e = ease(p);
      ax = f.ax + (cx - SEP - f.ax) * e; ay = f.ay + (cy - f.ay) * e;
      bx = f.bx + (cx + SEP - f.bx) * e; by = f.by + (cy - f.by) * e;
      k = 1 + 0.1 * Math.sin(Math.PI * p);
      if (p > 0.3) face = true;
    }
    ctx.globalAlpha = alfa;
    drawCard(ax - (k - 1) * CW / 2, ay - (k - 1) * CH / 2, k, f.carta, face, null);
    drawCard(bx - (k - 1) * CW / 2, by - (k - 1) * CH / 2, k, f.carta, face, null);   // a segunda fica por cima
    ctx.globalAlpha = 1;
  });
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
    function drawCard(x, y, k, card, faceUp, destaque, flip = 1) {
      ctx.save();
      ctx.translate(x, y); ctx.scale(k, k);
      if (flip !== 1) { ctx.translate(CW / 2, 0); ctx.scale(flip, 1); ctx.translate(-CW / 2, 0); }   // giro da carta
      const mico = faceUp && card.mico;
      const ouro = mico ? '#dc2626' : '#c9a24a';
      const M = 9;                              // margem interna
      const IW = CW - 2 * M;                    // largura da área da imagem
      const IH = Math.round(CH * 0.66);         // altura da área da imagem
      const NY = M + IH + 6;                    // topo da faixa do nome
      const NH = CH - M - NY;                   // altura da faixa do nome

      /* corpo da carta (com sombra) */
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
      rr(0, 0, CW, CH, 12);
      ctx.fillStyle = faceUp ? (mico ? '#fde8e8' : '#fbf5e4') : '#0f3d22';
      ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

      if (faceUp) {
        /* área da imagem */
        ctx.save();
        rr(M, M, IW, IH, 6); ctx.clip();
        const img = imagens[card.id];
        if (img && img.complete && img.naturalWidth) {
          const s = Math.max(IW / img.naturalWidth, IH / img.naturalHeight);
          const w = img.naturalWidth * s, h = img.naturalHeight * s;
          ctx.drawImage(img, M + (IW - w) / 2, M + (IH - h) / 2, w, h);
        } else { ctx.fillStyle = '#1a5c35'; ctx.fillRect(M, M, IW, IH); }
        ctx.restore();
        rr(M, M, IW, IH, 6); ctx.lineWidth = 2; ctx.strokeStyle = mico ? '#991b1b' : '#145228'; ctx.stroke();

        /* faixa do nome */
        rr(M, NY, IW, NH, 5);
        ctx.fillStyle = mico ? '#dc2626' : '#1a3d26'; ctx.fill();
        ctx.fillStyle = mico ? '#fff' : '#f6edd4';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const txt = (mico ? 'MICO' : card.nome).toUpperCase();
        let fs = 13;
        do { ctx.font = '700 ' + fs + 'px Inter, sans-serif'; fs -= 0.5; } while (ctx.measureText(txt).width > IW - 8 && fs > 6);
        ctx.fillText(txt, CW / 2, NY + NH / 2 + 0.5);
      } else {
        /* verso: losangos + folha */
        const BH = CH - 2 * M;
        ctx.save();
        rr(M, M, IW, BH, 6); ctx.clip();
        ctx.fillStyle = '#145228'; ctx.fillRect(M, M, IW, BH);
        ctx.strokeStyle = 'rgba(143,201,166,0.28)'; ctx.lineWidth = 1;
        for (let d = -CH; d < CW + CH; d += 14) {
          ctx.beginPath(); ctx.moveTo(d, M); ctx.lineTo(d + CH, M + BH); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(d + CH, M); ctx.lineTo(d, M + BH); ctx.stroke();
        }
        ctx.restore();
        rr(M, M, IW, BH, 6); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(246,237,212,0.6)'; ctx.stroke();
if (imgLogo.complete && imgLogo.naturalWidth) {   // logo no meio do verso (recorte 506x717 da imagem 1920x1080)
  const lh = CH * 0.46, lw = lh * 506 / 717;
  ctx.drawImage(imgLogo, 699, 181, 506, 717, (CW - lw) / 2, (CH - lh) / 2, lw, lh);
}
      }

      /* moldura externa + filete interno */
      rr(0, 0, CW, CH, 12); ctx.lineWidth = 3; ctx.strokeStyle = ouro; ctx.stroke();
      rr(4.5, 4.5, CW - 9, CH - 9, 8); ctx.lineWidth = 1; ctx.strokeStyle = mico ? 'rgba(220,38,38,0.5)' : 'rgba(201,162,74,0.55)';
      ctx.stroke();

      if (destaque) { rr(-3, -3, CW + 6, CH + 6, 14); ctx.lineWidth = 4; ctx.strokeStyle = destaque; ctx.stroke(); }
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
        if (voo && voo.lado === 'bot' && i === bot.length - 1) return;   // carta ainda voando: não aparece na mão
        const dest = hl && hl.lado === 'bot' && hl.card === p.c ? '#f59e0b'
                   : (fase === 'player' && hover === i ? '#8FC9A6' : null);
        drawCard(p.x, p.y + (dest ? 8 : 0), 1, p.c, false, dest);
      });
      layout(player, BOT_Y).forEach((p, i) => {
        if (voo && voo.lado === 'player' && i === player.length - 1) return;   // carta ainda voando: não aparece na mão
        const dest = hl && hl.card === p.c ? (hl.lado === 'player' ? '#f59e0b' : '#22c55e') : null;
        drawCard(p.x, p.y - (dest ? 8 : 0), 1, p.c, true, dest);
      });

      desenharEfeitosPar();
      desenharVoo();   // a carta em voo fica por cima de tudo
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
        const idx = Math.floor(Math.random() * player.length);
        const alvo = player[idx];
        hl = { lado: 'player', card: alvo };
        later(() => {
          const o = layout(player, BOT_Y)[idx];          // de onde a carta sai (mão do jogador)
          player.splice(idx, 1);
          bot.push(alvo);                                // já conta na mão do bot, mas só aparece quando pousar
          hl = null; setMsg('');
          const d = layout(bot, TOP_Y)[bot.length - 1];  // onde ela vai pousar (mão do bot)
          voar({ carta: alvo, lado: 'bot', x0: o.x, y0: o.y - 8, x1: d.x, y1: d.y, faceIni: true, faceFim: false }, () => {
const n = tirarPares(bot, 'bot');
hud();
bot = embaralharMao(bot, restoX, TOP_Y);   // troca todas as cartas de lugar
if (n) {
  const tp = temposPar(n);
  setMsg('');
  later(() => setMsg('Oponente formou um par!'), tp.sumir);
  later(() => { if (!checarFim()) turnoPlayer(); }, tp.fim);
} else {
  setMsg('Oponente pegou uma carta sua');
  later(() => { if (!checarFim()) turnoPlayer(); }, 600);
}
          });
        }, 550);
      }, 500);
    }
    function pegar(i) {
      fase = 'busy'; hover = -1; setMsg('');
      const carta = bot[i];
      const o = layout(bot, TOP_Y)[i];                 // de onde a carta sai (mão do bot)
      bot.splice(i, 1);
      player.push(carta);                              // já conta na mão do jogador, mas só aparece quando pousar
      const d = layout(player, BOT_Y)[player.length - 1];   // onde ela vai pousar (sua mão)
      voar({ carta, lado: 'player', x0: o.x, y0: o.y + 8, x1: d.x, y1: d.y, faceIni: false, faceFim: true }, () => {
        hl = { lado: 'verde', card: carta };
        setMsg(carta.mico ? 'Ops... você pegou o MICO!' : 'Você pegou ' + carta.nome);
        later(() => {
const n = tirarPares(player, 'player');
hl = null; rodadas++;
if (n) {
  combo++; parJog += n;
  const pts = PTS_PAR * n + PTS_COMBO * (combo - 1);
  const tp = temposPar(n), cb = combo;
  setMsg('');
  later(() => {   // os pontos aparecem junto com o sumiço das cartas
    score += pts; hud();
    popup(W / 2, H / 2 - 50, '#22c55e', '+' + pts + (cb > 1 ? ' combo x' + cb : ''), true);
    setMsg(cb > 1 ? 'Combo x' + cb + '!' : 'Par formado!');
  }, tp.sumir);
later(aposEscolha, tp.fim);
} else {
  combo = 0;
  if (!carta.mico) setMsg('Sem par...');
later(aposEscolha, 650);
}
        }, 550);
      });
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
      /* ranking: só conta ao vencer uma rodada (checkpoint da pontuação acumulada) — perder zera a jogada */
      if (ganhou) enviarAoRanking(partidaRanking, score, 'mico');
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
      if (novoJogo) { score = 0; paresAcum = 0; novoJogo = false; partidaRanking = iniciarRanking('mico'); }
      else paresAcum += parJog;   // continuou: soma os pares que você formou na rodada que acabou
      distribuir(CARTAS_POR_RODADA[nivel - 1]);
      parJog = 0; combo = 0; rodadas = 0; t0 = agora();
hl = null; hover = -1; voo = null; efeitosPar = []; running = true;
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
    tipEl.textContent   = 'Aperte espaço ou clique na tela para pular · Segure para pular mais alto';
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
    let obstacles=[],bgX=0,speed=3.2,tick=0,obsTick=0,obsInterval=110;
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

/* 🌿 CHÃO: versão pronta, escurecida com o mesmo verde da floresta — feita uma vez só */
const CHAO_ESCURECER = 0.35;            // força da camada verde escura (0 = original · 0.4 = igual à floresta)
const CHAO_COR_ESCURA = '6,40,24';      // cor da camada (R,G,B)
let groundPronto = null;

function prepararChao() {
  const c = document.createElement('canvas');
  c.width = groundImg.naturalWidth; c.height = groundImg.naturalHeight;
  const cc = c.getContext('2d');
  cc.drawImage(groundImg, 0, 0);
  cc.globalCompositeOperation = 'source-atop';   // só pinta onde já tem imagem
  cc.fillStyle = `rgba(${CHAO_COR_ESCURA},${CHAO_ESCURECER})`;
  cc.fillRect(0, 0, c.width, c.height);
  return c;
}

/* 🌑 SOMBRA DE CONTATO: escurece a base da floresta onde ela encontra o chão */
const SOMBRA_CHAO_ALTURA = 70;          // altura da sombra acima do chão (px)
const SOMBRA_CHAO_FORCA = 0.5;          // força da sombra (0 = nenhuma · 1 = preta)
const SOMBRA_CHAO_COR = '3,20,12';      // cor da sombra (R,G,B)

/* ===== 🌿 DECORAÇÃO (desenhada por código, em pixel art) ===== */
const DEC_PX = 3;                        // tamanho de cada "pixel" dos desenhos (3 = igual ao da floresta)

/* 6) tufos de capim e pedrinhas em cima do chão (rolam junto com o chão) */
const TUFOS_ATIVO = true;                // false = desliga
const TUFOS_DIST_MIN = 45;               // distância mínima entre um tufo e o próximo (px)
const TUFOS_DIST_MAX = 120;              // distância máxima (px)
const TUFOS_PEDRA_CHANCE = 0.2;          // chance de ser pedrinha em vez de capim (0 a 1)
const TUFOS_ALTURA = 8;                  // altura máxima do capim (em "pixels" do desenho · 8 = ~24 px)

/* 7) capim na frente da onça (passa mais rápido que o chão) */
const FRENTE_ATIVO = true;               // false = desliga
const FRENTE_VEL = 1.5;                  // velocidade em relação ao chão (1 = igual · 2 = o dobro)
const FRENTE_DIST_MIN = 120;             // distância mínima entre um e o próximo (px)
const FRENTE_DIST_MAX = 320;             // distância máxima (px)
const FRENTE_ALTURA = 10;                // altura das folhas (em "pixels" do desenho · 10 = ~30 px)
const FRENTE_ALTA_CHANCE = 0.15;         // chance de um capim bem alto, que passa na frente das patas
const FRENTE_PERIODO = 1500;             // de quantos em quantos px o desenho se repete

/* 8) moitas e palmeiras entre a floresta e o chão */
const MEIO_ATIVO = true;                 // false = desliga
const MEIO_VEL = 0.25;                   // velocidade em relação ao chão (0.03 = igual à floresta · 1 = igual ao chão)
const MEIO_DIST_MIN = 80;                // distância mínima entre uma moita e a próxima (px)
const MEIO_DIST_MAX = 240;               // distância máxima (px)
const MEIO_PERIODO = 1600;               // de quantos em quantos px o desenho se repete

let decoracao = null, meioX = 0, frenteX = 0;

function decRng(seed) {                  // números "aleatórios" sempre iguais (o desenho não muda a cada partida)
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function decSprite(wu, hu, desenhar) {   // cria um desenho de wu × hu "pixels"
  const c = document.createElement('canvas');
  c.width = wu * DEC_PX; c.height = hu * DEC_PX;
  const cc = c.getContext('2d');
  const p = (x, y, cor) => {
    if (x < 0 || y < 0 || x >= wu || y >= hu) return;
    cc.fillStyle = cor;
    cc.fillRect(x * DEC_PX, y * DEC_PX, DEC_PX, DEC_PX);
  };
  desenhar(p);
  return c;
}

function decTufo(rnd, wu, hu, c) {       // folhinhas de capim
  return decSprite(wu, hu, p => {
    const n = 3 + Math.floor(rnd() * 3) + (wu > 9 ? 2 : 0);
    for (let i = 0; i < n; i++) {
      const bx = 1 + Math.floor(rnd() * (wu - 2));
      const alt = Math.max(2, Math.round(hu * (0.45 + rnd() * 0.55)));
      const lado = rnd() < 0.5 ? -1 : 1;
      for (let y = 0; y < alt; y++) {
        const x = bx + lado * Math.round(2 * (y / alt) * (y / alt));   // a ponta encurva
        const cor = y >= alt - 1 ? (c.brilho && rnd() < 0.25 ? c.brilho : c.claro)
                  : (y > alt * 0.5 ? c.medio : c.escuro);
        p(x, hu - 1 - y, cor);
      }
    }
  });
}

function decPedra(rnd, c) {              // pedrinha
  const wu = 3 + Math.floor(rnd() * 3);
  return decSprite(wu, 3, p => {
    for (let x = 0; x < wu; x++) p(x, 2, c.escuro);
    for (let x = 0; x < wu; x++) p(x, 1, c.medio);
    for (let x = 1; x < wu - 1; x++) p(x, 0, c.medio);
    p(1, 0, c.claro);
  });
}

function decMoita(rnd, wu, hu, c) {      // moita feita de 2 a 3 bolotas juntas (borda irregular, com textura)
  const lobos = [];
  const n = 2 + Math.floor(rnd() * 2);
  for (let i = 0; i < n; i++) {
    const rx = wu * (0.28 + rnd() * 0.12);
    lobos.push({ cx: rx + (wu - 2 * rx) * (n === 1 ? 0.5 : i / (n - 1)), rx, h: hu * (0.6 + rnd() * 0.4) });
  }
  return decSprite(wu, hu, p => {
    for (let y = 0; y < hu; y++) for (let x = 0; x < wu; x++) {
      let melhor = -1;                                                // o quanto o ponto está "dentro" da bolota mais alta
      for (const l of lobos) {
        const dx = (x + 0.5 - l.cx) / l.rx, dy = (y + 0.5 - hu) / l.h;
        const d = dx * dx + dy * dy + (rnd() - 0.5) * 0.15;
        if (d <= 1) melhor = Math.max(melhor, 1 - d);
      }
      if (melhor < 0) continue;
      const t = y / hu;                                               // 0 = topo · 1 = base
      let cor = c.medio;
      if (melhor < 0.18) cor = c.escuro;                              // borda mais escura
      else if (t < 0.5 && (x + y) % 2 === 0) cor = c.claro;           // textura clara em cima
      else if (t > 0.7) cor = c.escuro;
      else if ((x * 3 + y * 5) % 7 === 0) cor = c.escuro;
      p(x, y, cor);
    }
  });
}

function decPalma(rnd, hu, c) {          // folhas abertas em leque (palmeira / samambaia)
  const wu = hu * 2 + 1;
  return decSprite(wu, hu, p => {
    const cx = hu, by = hu - 1;
    const n = 6 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const ang = -1.35 + (2.7 * i) / (n - 1) + (rnd() - 0.5) * 0.2;  // abre de -77° a +77°
      const len = hu * (0.55 + rnd() * 0.45);
      const caida = 0.5 + rnd() * 0.5;                                // quanto a folha cai na ponta
      for (let s = 0; s <= len; s++) {
        const t = s / len;
        const x = Math.round(cx + Math.sin(ang) * s);
        const y = Math.round(by - Math.cos(ang) * s + caida * t * t * len * 0.5 * Math.abs(Math.sin(ang)));
        const cor = t > 0.7 ? c.claro : (t > 0.3 ? c.medio : c.escuro);
        p(x, y, cor);
        p(x, y + 1, c.escuro);                                        // dá volume à folha
      }
    }
  });
}

function decLista(rnd, periodo, distMin, distMax, criar) {   // espalha desenhos ao longo de um trecho que se repete
  const lista = [];
  let x = rnd() * distMin;
  while (x < periodo) {
    const spr = criar(rnd);
    lista.push({ x, spr });
    x += distMin + rnd() * (distMax - distMin) + spr.width * 0.5;
  }
  return lista;
}

function decDesenhar(lista, offset, periodo, baseY) {        // desenha a lista (offset = quanto já rolou, entre -periodo e 0)
  for (const it of lista) {
    for (let k = 0; k < 3; k++) {
      const x = offset + it.x + k * periodo;
      if (x > VIEW_W) break;
      if (x + it.spr.width < 0) continue;
      ctx.drawImage(it.spr, x, baseY - it.spr.height);
    }
  }
}

function prepararDecoracao() {
  const rnd = decRng(20261020);
  const GRAMA = { escuro: '#2e6a3c', medio: '#519145', claro: '#7dbb4e', brilho: '#c3d84a' };   // tons do capim do chão
  const PEDRA = { escuro: '#2a2126', medio: '#4a3c3c', claro: '#6b5a55' };
  const MOITA = { escuro: '#072a18', medio: '#0e4426', claro: '#16603a' };                      // tons parecidos com os da floresta
  const FOLHA = { escuro: '#08280f', medio: '#0f4a22', claro: '#1a6a30' };                      // frente: bem escuro
  const escurecerChao = c => {            // mesma paleta e mesmo escurecimento verde do chão
    ajustarPaleta(c);
    const cc = c.getContext('2d');
    cc.globalCompositeOperation = 'source-atop';
    cc.fillStyle = `rgba(${CHAO_COR_ESCURA},${CHAO_ESCURECER})`;
    cc.fillRect(0, 0, c.width, c.height);
    return c;
  };

  const tufos = decLista(rnd, CHAO_PERIODO, TUFOS_DIST_MIN, TUFOS_DIST_MAX, r =>
    escurecerChao(r() < TUFOS_PEDRA_CHANCE
      ? decPedra(r, PEDRA)
      : decTufo(r, 11, 3 + Math.floor(r() * (TUFOS_ALTURA - 2)), GRAMA)));

  const meio = decLista(rnd, MEIO_PERIODO, MEIO_DIST_MIN, MEIO_DIST_MAX, r =>
    r() < 0.55
      ? decMoita(r, 12 + Math.floor(r() * 11), 7 + Math.floor(r() * 7), MOITA)
      : decPalma(r, 9 + Math.floor(r() * 5), MOITA));

  const frente = decLista(rnd, FRENTE_PERIODO, FRENTE_DIST_MIN, FRENTE_DIST_MAX, r =>
    r() < 0.4
      ? decPalma(r, FRENTE_ALTURA - 2 + Math.floor(r() * 3), FOLHA)
      : decTufo(r, 11, FRENTE_ALTURA + (r() < FRENTE_ALTA_CHANCE ? 6 : 0), FOLHA));

  return { tufos, meio, frente };
}

/* ===== 🟫 CHÃO NOVO (desenhado por código, pixel quadrado igual ao da floresta) ===== */
const CHAO_PERIODO = 1920;               // largura do desenho antes de repetir (px) · maior = repete menos
const CHAO_LINHAS = 16;                  // altura do chão em "pixels" do desenho (16 = 48 px)
const CHAO_LINHA_GRAMA = 2;              // quantos "pixels" a grama sobe acima da linha do chão (folhinhas irregulares)
const CHAO_CORES = {
  grama: { brilho: '#7fb445', claro: '#4f9640', medio: '#37803a', escuro: '#215f2d', sombra: '#154425' },
  terra: ['#5e3d28', '#4b2e20', '#38231d', '#271c21', '#1a151b'],     // da mais clara (em cima) à mais escura (embaixo)
  pedra: '#7a5c48',
};
let chaoNovo = null;

/* 🎨 PALETA: puxa o verde do chão para o verde da floresta (matiz, saturação e brilho) */
const CHAO_MATIZ = 12;                   // gira o verde (graus) · + = mais azulado, como a floresta · - = mais amarelo · 0 = igual
const CHAO_SATURACAO = 0.85;             // cor do chão (1 = igual · 0.7 = mais apagado)
const CHAO_BRILHO = 0.95;                // claridade do chão (1 = igual · 0.85 = mais escuro)

function ajustarPaleta(canvas) {         // aplica matiz/saturação/brilho (só o verde muda de matiz, a terra fica marrom)
  const cc = canvas.getContext('2d');
  const img = cc.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    let h = 0, sa = 0;
    if (mx !== mn) {
      const df = mx - mn;
      sa = l > 0.5 ? df / (2 - mx - mn) : df / (mx + mn);
      if (mx === r) h = ((g - b) / df + (g < b ? 6 : 0)) * 60;
      else if (mx === g) h = ((b - r) / df + 2) * 60;
      else h = ((r - g) / df + 4) * 60;
    }
    if (h > 60 && h < 180) h += CHAO_MATIZ;                      // só o verde gira
    sa = Math.min(1, sa * CHAO_SATURACAO);
    const ll = Math.min(1, l * CHAO_BRILHO);
    const q = ll < 0.5 ? ll * (1 + sa) : ll + sa - ll * sa, pp = 2 * ll - q;
    const f = t => { t = (t + 360) % 360 / 360; return t < 1/6 ? pp + (q - pp) * 6 * t : t < 1/2 ? q : t < 2/3 ? pp + (q - pp) * (2/3 - t) * 6 : pp; };
    if (sa === 0) { d[i] = d[i + 1] = d[i + 2] = ll * 255; }
    else { d[i] = f(h + 120) * 255; d[i + 1] = f(h) * 255; d[i + 2] = f(h - 120) * 255; }
  }
  cc.putImageData(img, 0, 0);
  return canvas;
}

function prepararChaoNovo() {
  const wu = CHAO_PERIODO / DEC_PX, hu = CHAO_LINHAS;
  const rnd = decRng(777);
  /* ondas que se repetem certinho no fim do desenho (para a emenda não aparecer) */
  const onda = () => {
    const ws = [];
    for (let i = 0; i < 3; i++) ws.push({ k: 3 + Math.floor(rnd() * 40), f: rnd() * 6.2832 });
    return x => ws.reduce((a, w) => a + Math.sin(6.2832 * w.k * x / wu + w.f), 0) / ws.length;   // de -1 a 1
  };
  const fBorda = onda(), fGrama = onda(), fTerra = onda();
  const G = CHAO_CORES.grama, T = CHAO_CORES.terra;
  const linha = CHAO_LINHA_GRAMA;

  const c = decSprite(wu, hu, p => {
    for (let x = 0; x < wu; x++) {
      let topo = linha - (fBorda(x) > 0.3 ? 1 : 0) - (fBorda(x) > 0.7 ? 1 : 0);   // folhinhas altas e baixas
      if (rnd() < 0.05) topo = Math.max(0, topo - 1);                             // uma folhinha solta
      const fimGrama = linha + 3 + Math.round(fGrama(x) + 1);                     // a grama "pinga" na terra (3 a 5)

      for (let y = topo; y < fimGrama; y++) {
        let cor;
        if (y === topo) cor = rnd() < 0.15 ? G.brilho : G.claro;
        else if (y === topo + 1) cor = G.medio;
        else if (y === fimGrama - 1) cor = G.sombra;
        else cor = G.escuro;
        if ((cor === G.medio || cor === G.escuro) && rnd() < 0.15) cor = G.claro;  // pintinhas
        p(x, y, cor);
      }
      for (let y = fimGrama; y < hu; y++) {
        const deslocamento = Math.round(fTerra(x) * 1.5);                         // faixas de terra onduladas
        let i = Math.floor((y - fimGrama + 1 + deslocamento) / 3);
        if (rnd() < 0.12) i += rnd() < 0.5 ? -1 : 1;                              // ruído
        i = Math.max(0, Math.min(T.length - 1, i));
        p(x, y, T[i]);
      }
      if (rnd() < 0.012) { const y = fimGrama + 1 + Math.floor(rnd() * 4); p(x, y, CHAO_CORES.pedra); p(x + 1, y, CHAO_CORES.pedra); }   // pedrinha na terra
    }
  });
  ajustarPaleta(c);                       // puxa a paleta para a da floresta
  const cc = c.getContext('2d');          // mesmo escurecimento verde do resto
  cc.globalCompositeOperation = 'source-atop';
  cc.fillStyle = `rgba(${CHAO_COR_ESCURA},${CHAO_ESCURECER * 0.5})`;
  cc.fillRect(0, 0, c.width, c.height);
  return c;
}

//FUNDO
const fundoImg = new Image();
fundoImg.src = 'assets/games/fundoonca.png';
let fundoX = 0;

/* 🌲 FUNDO COM ÁRVORES: versão pronta, mais escura (camada verde escura por cima) — feita uma vez só */
const FUNDO_ESCURECER = 0.4;            // força da camada verde escura (0 = original · 0.4 = escuro · 0.6 = bem escuro)
const FUNDO_COR_ESCURA = '6,40,24';     // cor da camada (R,G,B): verde bem escuro
const FUNDO_BLUR = 4;                   // borrão do fundo no topo (px da imagem original · 0 = sem borrão)
const FUNDO_BLUR_ATE = 0.8;             // até que altura o borrão vai (0 = só o topo · 1 = a imagem toda)
let fundoPronto = null;

/* ☀️ LUZ DO SOL NA FLORESTA: tom quente nas copas perto do sol (sem contorno) */
const FUNDO_SOL_FORCA = 0.35;           // força do tom quente nas copas (0 = nenhum · 1 = forte)
const FUNDO_SOL_ALCANCE = 340;          // até que distância do sol a luz chega
const FUNDO_SOL_COR = '255,170,80';     // cor da luz (R,G,B)
let fundoSolTmp = null;

/* ☀️ LUZ POR TRÁS DA FLORESTA (contraluz): brilho laranja entre o céu e as árvores */
const SOL_ATRAS_FORCA = 0.28;           // força do brilho atrás das árvores (0 = nenhum · 1 = forte)
const SOL_ATRAS_RAIO = 300;             // tamanho do brilho atrás das árvores

/* ☀️ PONTINHOS DE SOL: só algumas pontas de copa "pegam" sol, como folhas isoladas (sem contorno contínuo) */
const PONTOS_SOL_ATIVO = true;           // false = desliga
const PONTOS_SOL_FORCA = 0.85;           // brilho dos pontinhos (0 a 1)
const PONTOS_SOL_ALCANCE = 300;          // até que distância do sol aparecem pontinhos (px)
const PONTOS_SOL_DENSIDADE = 0.5;        // fração das pontas de copa que pegam sol (0.1 = poucas · 0.6 = muitas)
const PONTOS_SOL_TAM = 3;                // tamanho de cada pontinho (px · 3 = um "pixel" da floresta)
const PONTOS_SOL_COR = '255,214,130';    // cor da luz (R,G,B)
const PONTOS_SOL_PISCA = 0.3;            // o quanto eles piscam devagar (0 = fixos)
let pontosSol = null;

function prepararPontosSol() {           // acha as pontas de copa (pixel cheio com vazio logo acima), uma vez só
  const lista = [];
  try {
    const w = fundoImg.naturalWidth, h = fundoImg.naturalHeight - 2;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const cc = c.getContext('2d');
    cc.drawImage(fundoImg, 0, 0, w, h, 0, 0, w, h);
    const a = cc.getImageData(0, 0, w, h).data;
    const alfa = (x, y) => a[(y * w + x) * 4 + 3];
    const B = 8;                                                      // tamanho de um "pixel" da imagem original
    for (let by = B; by < h - B; by += B) {
      for (let bx = 0; bx < w - B; bx += B) {
        const x = bx + B / 2;
        if (alfa(x, by + B / 2) < 200 || alfa(x, by - B / 2) > 60) continue;   // precisa ser folha com ar em cima
        const sorteio = (((bx * 73856093) ^ (by * 19349663)) >>> 0) % 1000 / 1000;
        if (sorteio < PONTOS_SOL_DENSIDADE) lista.push({ x, y: by, fase: sorteio * 40 });
      }
    }
  } catch (e) { /* imagem bloqueada pelo navegador: fica sem pontinhos */ }
  return lista;
}

function prepararFundo() {
  const w = fundoImg.naturalWidth;
  const h = fundoImg.naturalHeight - 2;   // corta a linha clara do último pixel da imagem
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const cc = c.getContext('2d');
  cc.drawImage(fundoImg, 0, 0, w, h, 0, 0, w, h);

  if (FUNDO_BLUR > 0) {
    /* tira com 3 cópias (espelhada · normal · espelhada), igual ao que acontece no jogo:
       assim o borrão das laterais usa a imagem vizinha e não aparece costura */
    const tira = document.createElement('canvas');
    tira.width = w * 3; tira.height = h;
    const tc = tira.getContext('2d');
    for (let i = 0; i < 3; i++) {
      tc.save();
      if (i % 2 === 0) { tc.translate((i + 1) * w, 0); tc.scale(-1, 1); }
      else { tc.translate(i * w, 0); }
      tc.drawImage(fundoImg, 0, 0, w, h, 0, 0, w, h);
      tc.restore();
    }
    const borrada = borrarCanvas(tira, FUNDO_BLUR);

    /* parte borrada: só a cópia do meio, forte em cima e some conforme desce */
    const bl = document.createElement('canvas');
    bl.width = w; bl.height = h;
    const bc = bl.getContext('2d');
    bc.drawImage(borrada, -w, 0);
    bc.globalCompositeOperation = 'destination-in';
    const gb = bc.createLinearGradient(0, 0, 0, h * FUNDO_BLUR_ATE);
    gb.addColorStop(0, 'rgba(0,0,0,1)');
    gb.addColorStop(1, 'rgba(0,0,0,0)');
    bc.fillStyle = gb;
    bc.fillRect(0, 0, w, h);

    /* parte nítida: o contrário (some em cima, aparece embaixo) */
    cc.globalCompositeOperation = 'destination-in';
    const gn = cc.createLinearGradient(0, 0, 0, h * FUNDO_BLUR_ATE);
    gn.addColorStop(0, 'rgba(0,0,0,0)');
    gn.addColorStop(1, 'rgba(0,0,0,1)');
    cc.fillStyle = gn;
    cc.fillRect(0, 0, w, h);

    cc.globalCompositeOperation = 'lighter';   // soma as duas (cruzamento suave)
    cc.drawImage(bl, 0, 0);
  }

  cc.globalCompositeOperation = 'source-atop';   // só pinta onde já tem imagem
  cc.fillStyle = `rgba(${FUNDO_COR_ESCURA},${FUNDO_ESCURECER})`;
  cc.fillRect(0, 0, w, h);
  return c;
}

//CÉU (imagem parada, fica atrás do fundo)
const ceuImg = new Image();
ceuImg.src = 'assets/games/ceuonca2.png';

/* ☀️ SOL: desfoque de luz + brilho em volta dele (a posição é relativa à imagem do céu) */
const SOL_X = 0.658;           // posição do sol na imagem do céu (0 = esquerda · 1 = direita)
const SOL_Y = 0.564;           // (0 = topo · 1 = base)
const SOL_DESFOQUE = 3;        // quanto o sol é borrado (0 = sem desfoque)
const SOL_RAIO_DESFOQUE = 85;  // até onde, ao redor do sol, vai o desfoque
const SOL_BRILHO = 0.3;        // força do brilho de luz (0 = nenhum · 1 = bem forte)
const SOL_RAIO_BRILHO = 210;   // tamanho do brilho em volta do sol
let ceuPronto = null;
let solMundoX = null, solMundoY = null;   // onde o sol está na tela (atualizado a cada quadro)

function prepararCeu(cw, ch) {
  const k = ZOOM;                              // desenha na resolução da tela, pra não perder nitidez
  const w = Math.round(cw * k), h = Math.round(ch * k);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const cc = c.getContext('2d');
  cc.drawImage(ceuImg, 0, 0, w, h);
  const sx = SOL_X * w, sy = SOL_Y * h;

  if (SOL_DESFOQUE > 0) {                      // cópia borrada, visível só perto do sol
    const borrada = borrarCanvas(c, SOL_DESFOQUE * k);
    const bb = borrada.getContext('2d');
    bb.globalCompositeOperation = 'destination-in';
    const m = bb.createRadialGradient(sx, sy, 0, sx, sy, SOL_RAIO_DESFOQUE * k);
    m.addColorStop(0, 'rgba(0,0,0,1)');
    m.addColorStop(0.6, 'rgba(0,0,0,0.8)');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    bb.fillStyle = m;
    bb.fillRect(0, 0, w, h);
    cc.drawImage(borrada, 0, 0);
  }

  if (SOL_BRILHO > 0) {                        // brilho de luz em volta do sol
    cc.globalCompositeOperation = 'lighter';
    const g = cc.createRadialGradient(sx, sy, 0, sx, sy, SOL_RAIO_BRILHO * k);
    g.addColorStop(0, `rgba(255,236,170,${SOL_BRILHO})`);
    g.addColorStop(0.3, `rgba(255,205,110,${SOL_BRILHO * 0.45})`);
    g.addColorStop(1, 'rgba(255,170,60,0)');
    cc.fillStyle = g;
    cc.fillRect(0, 0, w, h);
    cc.globalCompositeOperation = 'source-over';
  }
  return c;
}

// NUVENS — ficam na frente do céu e atrás da floresta
const nuvemImg = new Image();
nuvemImg.src = 'assets/games/nuvemonca.png';

let nuvemX = 0;

/* ☁️ NUVENS: versão pronta (borrão variável + esmaecida embaixo), feita uma vez só */
const NUVEM_BLUR = 2;            // borrão na parte de baixo (px)
const NUVEM_BLUR_TOPO = 0.8;     // borrão no topo (px): menor = topo mais nítido
const NUVEM_BLUR_ATE = 0.6;      // até que altura o topo ainda é mais nítido (0 = topo, 1 = base)
const NUVEM_FADE_INICIO = 0.55;  // a partir de que altura começa a ficar transparente
const NUVEM_ALFA_BASE = 0.4;     // opacidade na base (1 = opaca, 0 = invisível)
let nuvemPronta = null;

function borrarCanvas(origem, px) {
  const b = document.createElement('canvas');
  b.width = origem.width; b.height = origem.height;
  const bc = b.getContext('2d');
  if (px <= 0) {
    bc.drawImage(origem, 0, 0);
  } else if ('filter' in bc) {
    bc.filter = `blur(${px}px)`;
    bc.drawImage(origem, 0, 0);
  } else {
    // navegador sem ctx.filter: encolhe e estica a imagem, o que também suaviza
    const f = 1 + px / 2;
    const p = document.createElement('canvas');
    p.width = Math.max(1, Math.round(origem.width / f));
    p.height = Math.max(1, Math.round(origem.height / f));
    p.getContext('2d').drawImage(origem, 0, 0, p.width, p.height);
    bc.imageSmoothingEnabled = true;
    bc.imageSmoothingQuality = 'high';
    bc.drawImage(p, 0, 0, origem.width, origem.height);
  }
  return b;
}

function prepararNuvens(w, h) {
  w = Math.round(w); h = Math.round(h);

  // 3 cópias lado a lado: o borrão da emenda usa a imagem vizinha, então o loop não mostra costura
  const tira = document.createElement('canvas');
  tira.width = w * 3; tira.height = h;
  const tiraCtx = tira.getContext('2d');
  for (let i = 0; i < 3; i++) tiraCtx.drawImage(nuvemImg, i * w, 0, w, h);

  const forte = borrarCanvas(tira, NUVEM_BLUR);        // borrão da parte de baixo
  const leve  = borrarCanvas(tira, NUVEM_BLUR_TOPO);   // borrão do topo

  // base: a versão mais borrada (só a cópia do meio)
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const cc = c.getContext('2d');
  cc.drawImage(forte, -w, 0);

  // por cima: a versão menos borrada, que some conforme desce
  const topo = document.createElement('canvas');
  topo.width = w; topo.height = h;
  const topoCtx = topo.getContext('2d');
  topoCtx.drawImage(leve, -w, 0);
  topoCtx.globalCompositeOperation = 'destination-in';
  const gTopo = topoCtx.createLinearGradient(0, 0, 0, h * NUVEM_BLUR_ATE);
  gTopo.addColorStop(0, 'rgba(0,0,0,1)');
  gTopo.addColorStop(1, 'rgba(0,0,0,0)');
  topoCtx.fillStyle = gTopo;
  topoCtx.fillRect(0, 0, w, h);
  cc.drawImage(topo, 0, 0);

  // gradiente de transparência: opaca em cima, mais transparente embaixo
  cc.globalCompositeOperation = 'destination-in';
  const g = cc.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(NUVEM_FADE_INICIO, 'rgba(0,0,0,1)');
  g.addColorStop(1, `rgba(0,0,0,${NUVEM_ALFA_BASE})`);
  cc.fillStyle = g;
  cc.fillRect(0, 0, w, h);
  return c;
}
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

        if (alpha >= 128) {
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
    y: drawY,
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
        if (!ceuPronto) ceuPronto = prepararCeu(cw, ch);
        const cx0 = (VIEW_W - cw) / 2, cy0 = ceuTopo + (ceuAlt - ch) / 2;
        ctx.drawImage(ceuPronto, cx0, cy0, cw, ch);
        solMundoX = cx0 + SOL_X * cw; solMundoY = cy0 + SOL_Y * ch;   // posição do sol no mundo
      }

/* ☁️ NUVENS DISTANTES
   Ficam na frente do céu, mas atrás da floresta.
   Movem-se bem mais devagar para dar sensação de distância.
*/
if (nuvemImg.complete && nuvemImg.naturalWidth > 0) {

  const NUVEM_W = VIEW_W * 1.7;
  const NUVEM_H = NUVEM_W * (nuvemImg.naturalHeight / nuvemImg.naturalWidth);
  if (!nuvemPronta) nuvemPronta = prepararNuvens(NUVEM_W, NUVEM_H);

  // Movimento muito lento = nuvens parecem distantes
  nuvemX -= speed * 0.04 * dt;   // velocidade das nuvens (menor = mais lento)

  // Quando a primeira imagem sai, reposiciona para criar loop
  if (nuvemX <= -NUVEM_W) {
    nuvemX += NUVEM_W;
  }

  // Duas cópias para não aparecer buraco
  ctx.drawImage(nuvemPronta, nuvemX, -20, NUVEM_W, NUVEM_H);
  ctx.drawImage(nuvemPronta, nuvemX + NUVEM_W, -20, NUVEM_W, NUVEM_H);
}

      /* ☀️ brilho laranja por trás da floresta (contraluz) */
      if (solMundoX !== null && SOL_ATRAS_FORCA > 0) {
        const R = SOL_ATRAS_RAIO;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const ga = ctx.createRadialGradient(solMundoX, solMundoY, 0, solMundoX, solMundoY, R);
        ga.addColorStop(0, `rgba(255,190,90,${SOL_ATRAS_FORCA})`);
        ga.addColorStop(0.5, `rgba(255,150,60,${SOL_ATRAS_FORCA * 0.4})`);
        ga.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = ga;
        ctx.fillRect(solMundoX - R, solMundoY - R, 2 * R, 2 * R);
        ctx.restore();
      }

      if (fundoImg.complete && fundoImg.naturalWidth > 0) {
        if (!fundoPronto) fundoPronto = prepararFundo();
        const fh = 420;                      // ALTURA do fundo no jogo (maior = floresta maior; a largura acompanha sozinha)
        const fy = (GROUND + 20) - fh;       // base da floresta fica escondida atrás do chão
        const fw = Math.round(fh * fundoImg.naturalWidth / fundoImg.naturalHeight);
        const srcW = fundoPronto.width, srcH = fundoPronto.height;
        fundoX -= speed * 0.03 * dt;         // paralaxe do fundo com árvores
        if (fundoX <= -2 * fw) fundoX += 2 * fw;

        /* desenha as repetições do fundo (normal / espelhada) em qualquer canvas */
        const desenharTiles = (c, img) => {
          for (let k = 0; fundoX + k * fw < VIEW_W + fw; k++) {
            const x = fundoX + k * fw;       // sem arredondar: movimento suave
            if (k % 2) {
              c.save(); c.translate(x + fw + 1, 0); c.scale(-1, 1);
              c.drawImage(img, 0, 0, srcW, srcH, 0, fy, fw + 1, fh);
              c.restore();
            } else {
              c.drawImage(img, 0, 0, srcW, srcH, x, fy, fw + 1, fh);
            }
          }
        };
        desenharTiles(ctx, fundoPronto);

        /* ☀️ tom quente do sol nas copas (só nas árvores perto dele, sem contorno) */
        if (solMundoX !== null && FUNDO_SOL_FORCA > 0) {
          const R = FUNDO_SOL_ALCANCE, S = Math.round(2 * R * ZOOM);
          if (!fundoSolTmp) { fundoSolTmp = document.createElement('canvas'); fundoSolTmp.width = S; fundoSolTmp.height = S; }
          const bc = fundoSolTmp.getContext('2d');
          bc.setTransform(1, 0, 0, 1, 0, 0);
          bc.globalCompositeOperation = 'source-over';
          bc.clearRect(0, 0, S, S);
          bc.setTransform(ZOOM, 0, 0, ZOOM, -(solMundoX - R) * ZOOM, -(solMundoY - R) * ZOOM);
          desenharTiles(bc, fundoPronto);
          bc.setTransform(1, 0, 0, 1, 0, 0);
          bc.globalCompositeOperation = 'source-atop';   // pinta só onde tem árvore
          const gr = bc.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
          gr.addColorStop(0, `rgba(${FUNDO_SOL_COR},1)`);
          gr.addColorStop(0.4, `rgba(${FUNDO_SOL_COR},0.55)`);
          gr.addColorStop(1, `rgba(${FUNDO_SOL_COR},0)`);
          bc.fillStyle = gr;
          bc.fillRect(0, 0, S, S);
          ctx.save();
          ctx.globalAlpha = FUNDO_SOL_FORCA;
          ctx.drawImage(fundoSolTmp, solMundoX - R, solMundoY - R, 2 * R, 2 * R);
          ctx.restore();
        }

        /* ☀️ pontinhos de sol nas pontas de copa perto do sol */
        if (PONTOS_SOL_ATIVO && solMundoX !== null) {
          if (!pontosSol) pontosSol = prepararPontosSol();
          const ex = fw / srcW, ey = fh / srcH;                       // escala da imagem no jogo
          const T = PONTOS_SOL_TAM, R2 = PONTOS_SOL_ALCANCE;
          ctx.save();
          for (let k = 0; fundoX + k * fw < VIEW_W + fw; k++) {
            const x0 = fundoX + k * fw;
            for (const pt of pontosSol) {
              const xw = (k % 2) ? x0 + fw - pt.x * ex : x0 + pt.x * ex;   // cópias espelhadas
              const yw = fy + pt.y * ey;
              const dx = xw - solMundoX, dy = yw - solMundoY;
              const d = Math.sqrt(dx * dx + dy * dy);
              if (d > R2 || xw < -T || xw > VIEW_W) continue;
              const f = 1 - d / R2;                                    // 1 perto do sol · 0 longe
              const pisca = 1 - PONTOS_SOL_PISCA * (0.5 + 0.5 * Math.sin(tick * 0.04 + pt.fase));
              ctx.fillStyle = `rgba(${PONTOS_SOL_COR},${PONTOS_SOL_FORCA * f * f * pisca})`;
              ctx.fillRect(xw - T / 2, yw - T / 2, T, T);
            }
          }
          ctx.restore();
        }
      }

/* 🌳 MOITAS E PALMEIRAS DO MEIO: ficam entre a floresta e o chão */
if (!decoracao) decoracao = prepararDecoracao();
if (MEIO_ATIVO && decoracao) {
  meioX -= speed * MEIO_VEL * dt;
  if (meioX <= -MEIO_PERIODO) meioX += MEIO_PERIODO;
  decDesenhar(decoracao.meio, meioX, MEIO_PERIODO, GROUND + 14);   // a base fica escondida atrás do chão
}

/* 🌑 SOMBRA DE CONTATO: base da floresta escurece onde encontra o chão */
if (SOMBRA_CHAO_FORCA > 0) {
  const topoChao = GROUND + 10;                 // y onde começa a grama
  const gs = ctx.createLinearGradient(0, topoChao - SOMBRA_CHAO_ALTURA, 0, topoChao);
  gs.addColorStop(0, `rgba(${SOMBRA_CHAO_COR},0)`);
  gs.addColorStop(1, `rgba(${SOMBRA_CHAO_COR},${SOMBRA_CHAO_FORCA})`);
  ctx.fillStyle = gs;
  ctx.fillRect(0, topoChao - SOMBRA_CHAO_ALTURA, VIEW_W, SOMBRA_CHAO_ALTURA);
}

/* 🟫 CHÃO NOVO (desenhado por código, pixel quadrado) */
groundX -= speed * dt;
if (groundX <= -CHAO_PERIODO) groundX += CHAO_PERIODO;

if (!chaoNovo) chaoNovo = prepararChaoNovo();
const chaoTopo = GROUND + 10 - CHAO_LINHA_GRAMA * DEC_PX;   // a linha da grama continua em GROUND + 10
ctx.drawImage(chaoNovo, groundX, chaoTopo);
ctx.drawImage(chaoNovo, groundX + CHAO_PERIODO, chaoTopo);

/* 🌱 TUFOS E PEDRINHAS: rolam junto com o chão, na linha da grama */
if (TUFOS_ATIVO && decoracao) decDesenhar(decoracao.tufos, groundX, CHAO_PERIODO, GROUND + 14);



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
 * Desenha a onça depois da colisão.
 *
 * A função desenhará o mesmo frame que foi
 * preparado em updateOncaSprite().
 */
drawOnca();

/* 🌿 CAPIM DA FRENTE: passa na frente da onça, mais rápido que o chão */
if (FRENTE_ATIVO && decoracao) {
  frenteX -= speed * FRENTE_VEL * dt;
  if (frenteX <= -FRENTE_PERIODO) frenteX += FRENTE_PERIODO;
  decDesenhar(decoracao.frente, frenteX, FRENTE_PERIODO, GH + DEC_PX);   // a base fica cortada embaixo da tela
}

ctx.restore();
      /* spawn obs */
      obsTick+=dt; if(obsTick>=obsInterval){obsTick=0;obsInterval=Math.max(55,110-level*8);spawnObs();}


      raf=requestAnimationFrame(loop);
    }

    let partidaRanking = null;
    function end(won){
      running=false;cancelAnimationFrame(raf);
      enviarAoRanking(partidaRanking, ~~(dist/6), 'onca');
      showScreen(won?'🐆 Onça Salva!':'💀 A onça foi capturada...',
        `Distância percorrida: <strong>${~~(dist/6)} m</strong><br>${won?'A onça escapou para a reserva!':'Tente de novo!'}`,
        'Correr de novo', true);
    }
    function start(){partidaRanking=iniciarRanking('onca');holdingJump=false;score=0;lives=3;level=1;dist=0;speed=3.2;tick=0;obsTick=0;obsInterval=110;
      obstacles=[];onca={x:90,y:GROUND,vy:0,onGround:true,w:48,h:32};
      running=true;hideScreen();updateHUD(0,'1,0x',3);delta.reset();raf=requestAnimationFrame(loop);}
    startBtn.onclick=start;
    activeGame={cleanup:()=>{running=false;document.removeEventListener('keydown',keyH);document.removeEventListener('keyup',keyU);canvas.onpointerdown=null;canvas.onpointerup=null;canvas.onpointercancel=null;canvas.style.touchAction='';}};
  }

  /* ════════════════════════════════════
     JOGO — VOLTA AO RIO (endless frogger)    
  ════════════════════════════════════ */
  function initSapo() {
    titleEl.textContent = 'De Volta ao Rio';
    scoreEmMetros = true;
    tipEl.textContent   = 'Setas, WASD ou deslize na tela para pular · Toque na tela para ir pra frente · Não pare: a tela não espera';
    updateHUD(0, 1, 3, true, false);
    showScreen('De Volta ao Rio',
      'A floresta foi derrubada e o <strong>rio ficou longe</strong>. Ajude o sapo a voltar para casa!<br>Fuja dos caminhões dos madeireiros, pule nos <strong>troncos</strong> sobre a água contaminada e <strong>não pare</strong>: a tela não espera.');

    /* ── CONFIG ── */
    const T = 48;                      // tamanho de cada quadrado (960 / 48 = 20 colunas)
    const COLS = W / T;
    const MARGEM = 6 * T;              // faixa fora da tela onde veículos e troncos "dão a volta"
    const LARG_FAIXA = W + 2 * MARGEM;
    const HOP_FRAMES = 7;              // duração do pulo (menor = mais rápido)
    const SAPO_MEIA_LARG = 13;         // meia largura da hitbox do sapo
    const RECORDE_KEY = 'girabrasil_sapo_recorde';
    let partidaRanking = null;
    const delta = makeDelta();

    let running = false, estado = 'parado', tick = 0;
    let lanes = [], gen = {};
    let frog, camY, rowMax, nivel, comecou, fila, morte;

    /* ── FAIXAS (cada fileira do mundo) ── */
    const norm = p => ((p + MARGEM) % LARG_FAIXA + LARG_FAIXA) % LARG_FAIXA - MARGEM;

    /* espalha veículos/troncos pela faixa inteira, com espaços variados */
    function preencher(gerar, gapMin, jitter) {
      const itens = [], gaps = []; let total = 0;
      for (let i = 0; i < 30; i++) {
        const it = gerar(), g = (gapMin + Math.random() * jitter) * T;
        if (total + it.w + g > LARG_FAIXA) break;
        itens.push(it); gaps.push(g); total += it.w + g;
      }
      if (!itens.length) { const it = gerar(); it.pos = 0; return [it]; }
      const extra = (LARG_FAIXA - total) / itens.length;
      let x = -MARGEM + Math.random() * LARG_FAIXA;
      itens.forEach((it, i) => { it.pos = norm(x); x += it.w + gaps[i] + extra; });
      return itens;
    }

    function criarLane(r) {
      const f = Math.min(1, r / 120);   // dificuldade: sobe até a fileira 120
      const prev = lanes[r - 1];
      let tipo;
      if (r <= 2) tipo = 'grama';
      else if (prev.tipo === 'grama') {
        tipo = Math.random() < 0.6 ? 'estrada' : 'riacho';
        gen.limite = 2 + Math.floor(Math.random() * 3);   // 2 a 4 faixas de perigo seguidas
        gen.seguidos = 0;
      } else if (gen.seguidos >= gen.limite) tipo = 'grama';
      else if (Math.random() < 0.7) tipo = prev.tipo;
      else tipo = prev.tipo === 'estrada' ? 'riacho' : 'estrada';
      if (r > 2) {
        if (tipo === prev.tipo && tipo === 'riacho' && gen.mesmo >= 3) tipo = 'estrada';
        if (tipo === prev.tipo && tipo === 'estrada' && gen.mesmo >= 4) tipo = 'riacho';
        gen.mesmo = tipo === prev.tipo ? gen.mesmo + 1 : 1;
        if (tipo !== 'grama') gen.seguidos++;
      }

      if (tipo === 'grama') {
        const blocos = [];
        if (r > 2 && prev.tipo !== 'riacho') {   // depois do riacho a margem é livre
          const n = Math.floor(Math.random() * 6);
          while (blocos.length < n) { const c = Math.floor(Math.random() * COLS); if (!blocos.includes(c)) blocos.push(c); }
        }
        const deco = [];
        for (let i = 0; i < 8; i++) deco.push({ x: Math.random() * W, y: 10 + Math.random() * (T - 16) });
        return { tipo, seca: Math.random() < 0.5, blocos, deco };
      }
      const dir = Math.random() < 0.5 ? -1 : 1;
      if (tipo === 'estrada') {
        const v = (1.1 + Math.random() * 1.0) * (1 + 0.9 * f);
        const itens = preencher(() => {
          const q = Math.random(), k = q < 0.4 ? 'caminhao' : q < 0.7 ? 'trator' : 'caminhonete';
          return { k, w: (k === 'caminhao' ? 3 : 2) * T };
        }, 3.4 - 1.4 * f, 3);
        const deco = [];
        for (let i = 0; i < 10; i++) deco.push({ x: Math.random() * W, y: 6 + Math.random() * (T - 12) });
        return { tipo, dir, v, itens, deco };
      }
      const v = (0.7 + Math.random() * 0.8) * (1 + 0.5 * f);
      const itens = preencher(() => ({ w: (2 + Math.floor(Math.random() * 3) + (f < 0.5 ? 1 : 0)) * T }), 1.0 + f * 0.8, 1.5);
      return { tipo, dir, v, itens };
    }
    function getLane(r) { while (lanes.length <= r) lanes.push(criarLane(lanes.length)); return lanes[r]; }
    function moverLane(l, dt) { if (l.itens) l.itens.forEach(it => { it.pos = norm(it.pos + l.dir * l.v * dt); }); }

    const veiculoAtinge = l => l.itens.some(it => frog.x + SAPO_MEIA_LARG > it.pos + 6 && frog.x - SAPO_MEIA_LARG < it.pos + it.w - 6);
    const sobreTronco = (l, x) => l.itens.some(it => x > it.pos + 4 && x < it.pos + it.w - 4);

    /* ── ESTADO ── */
    function atualizarHud() { updateHUD(rowMax - 1, nivel, 3, true, false); }
    function resetar() {
      lanes = []; gen = { limite: 0, seguidos: 0, mesmo: 1 };
      frog = { x: (COLS / 2) * T + T / 2, r: 1, hop: null, ang: 0 };
      camY = 0; rowMax = 1; nivel = 1; comecou = false; fila = null; morte = null; tick = 0;
      estado = 'parado';
    }
    function morrer(tipo) {
      if (estado !== 'jogando') return;
      estado = 'morrendo'; morte = { tipo, t: 0 }; fila = null;
      shakePanel();
    }

    /* ── MOVIMENTO ── */
    function pular(d) {
      if (!running || estado !== 'jogando') return;
      if (frog.hop) { fila = d; return; }   // guarda 1 comando enquanto pula
      let nx = frog.x, nr = frog.r;
      if (d === 'up') nr++; else if (d === 'down') nr--; else if (d === 'left') nx -= T; else nx += T;
      frog.ang = d === 'up' ? 0 : d === 'right' ? Math.PI / 2 : d === 'down' ? Math.PI : -Math.PI / 2;
      if (nr < 0 || nx < 12 || nx > W - 12) return;
      const l = getLane(nr);
      if ((d === 'up' || d === 'down') && l.tipo !== 'riacho') nx = Math.round((nx - T / 2) / T) * T + T / 2;   // encaixa na grade
      if (l.tipo === 'grama' && l.blocos.includes(Math.floor(nx / T))) return;   // árvore / toco no caminho
      frog.hop = { x0: frog.x, r0: frog.r, x1: nx, r1: nr, t: 0 };
      comecou = true;
    }
    function aoPousar() {
      if (frog.r > rowMax) { rowMax = frog.r; nivel = 1 + Math.floor((rowMax - 1) / 20); atualizarHud(); }
      const l = getLane(frog.r);
      if (l.tipo === 'estrada' && veiculoAtinge(l)) { morrer('atropelou'); return; }
      if (l.tipo === 'riacho' && !sobreTronco(l, frog.x)) { morrer('afogou'); return; }
      if (fila) { const d = fila; fila = null; pular(d); }
    }

    const MAPA = { ArrowUp: 'up', KeyW: 'up', Space: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
    const keyH = e => {
      if (paused || !running) return;
      const d = MAPA[e.code];
      if (d) { e.preventDefault(); pular(d); }
    };
    document.addEventListener('keydown', keyH);
    /* toque/clique: toque curto = frente · deslizar = direção do deslize */
    let pIni = null;
    canvas.style.touchAction = 'none';
    canvas.onpointerdown = e => { if (paused) return; pIni = { x: e.clientX, y: e.clientY }; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} };
    canvas.onpointerup = e => {
      if (!pIni || paused) { pIni = null; return; }
      const dx = e.clientX - pIni.x, dy = e.clientY - pIni.y; pIni = null;
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (Math.max(ax, ay) < 24) pular('up');
      else if (ax > ay) pular(dx > 0 ? 'right' : 'left');
      else pular(dy < 0 ? 'up' : 'down');
    };
    canvas.onpointercancel = () => { pIni = null; };

    /* ── ATUALIZAÇÃO ── */
    function atualizar(dt) {
      const base = Math.floor(camY);
      getLane(base + 16);
      for (let r = Math.max(0, base - 1); r <= base + 13; r++) moverLane(getLane(r), dt);
      if (estado === 'morrendo') { morte.t += dt; if (morte.t >= 45) end(); return; }

      if (frog.hop) {
        const h = frog.hop; h.t += dt / HOP_FRAMES;
        if (h.t >= 1) { frog.x = h.x1; frog.r = h.r1; frog.hop = null; aoPousar(); }
      } else {
        const l = getLane(frog.r);
        if (l.tipo === 'riacho') {
          frog.x += l.dir * l.v * dt;   // o tronco leva o sapo junto
          if (!sobreTronco(l, frog.x)) morrer('afogou');
          else if (frog.x < 8 || frog.x > W - 8) morrer('levado');
        } else if (l.tipo === 'estrada' && veiculoAtinge(l)) morrer('atropelou');
      }
      if (estado !== 'jogando') return;

      /* câmera: acompanha o sapo e também sobe sozinha (cada vez mais rápido) */
      const alvo = rowMax - 3.4;
      if (alvo > camY) camY += (alvo - camY) * Math.min(1, 0.12 * dt);
      if (comecou || tick > 240) camY += (0.0045 + Math.min(0.014, rowMax * 0.00007)) * dt;
      const rv = frog.hop ? frog.hop.r0 + (frog.hop.r1 - frog.hop.r0) * Math.min(1, frog.hop.t) : frog.r;
      if (rv < camY - 0.12) morrer('deixado');
    }

    /* ── DESENHO ── */
    const yLane = r => H - (r - camY + 1) * T;

    function desenharArvore(cx, cy) {
      ctx.fillStyle = '#5b3a1e'; ctx.fillRect(cx - 4, cy + 4, 8, 17);
      ctx.fillStyle = '#1f6b2e'; ctx.beginPath(); ctx.arc(cx, cy - 6, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#256f33';
      ctx.beginPath(); ctx.arc(cx - 10, cy + 1, 11, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 10, cy + 1, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2f8a3e'; ctx.beginPath(); ctx.arc(cx - 3, cy - 10, 6, 0, Math.PI * 2); ctx.fill();
    }
    function desenharToco(cx, cy) {
      ctx.fillStyle = '#4a2f18'; ctx.beginPath(); ctx.ellipse(cx, cy + 12, 17, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7a4e24'; ctx.fillRect(cx - 14, cy - 2, 28, 14);
      ctx.fillStyle = '#d2a56b'; ctx.beginPath(); ctx.ellipse(cx, cy - 2, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a97c45'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(cx, cy - 2, 9, 4.5, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy - 2, 4, 2, 0, 0, Math.PI * 2); ctx.stroke();
    }
    function roda(x, y, r) {
      ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a8a8a'; ctx.beginPath(); ctx.arc(x, y, r * 0.38, 0, Math.PI * 2); ctx.fill();
    }
    /* veículos: desenhados virados pra direita; se for pra esquerda, espelha */
    function comEspelho(x, y, w, dir, fn) {
      ctx.save(); ctx.translate(x, y);
      if (dir < 0) { ctx.translate(w, 0); ctx.scale(-1, 1); }
      fn(); ctx.restore();
    }
    function desenharCaminhao() {
      ctx.fillStyle = '#2b2b2b'; ctx.fillRect(0, 30, 140, 6);
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(2, 9, 98, 21);
      ctx.strokeStyle = '#4a2f18'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(2, 16); ctx.lineTo(100, 16); ctx.moveTo(2, 23); ctx.lineTo(100, 23); ctx.stroke();
      ctx.fillStyle = '#3b2a1a'; [6, 50, 94].forEach(x => ctx.fillRect(x, 6, 4, 24));
      ctx.fillStyle = '#c0392b'; ctx.fillRect(104, 14, 36, 22);
      ctx.fillStyle = '#bde3f2'; ctx.fillRect(122, 17, 14, 9);
      ctx.fillStyle = '#ffe9a8'; ctx.fillRect(138, 28, 3, 4);
      roda(16, 38, 6); roda(34, 38, 6); roda(116, 38, 6);
    }
    function desenharTrator() {
      ctx.fillStyle = '#555'; ctx.fillRect(88, 18, 6, 20);
      ctx.fillStyle = '#f1c40f'; ctx.fillRect(28, 18, 52, 14);
      ctx.fillStyle = '#e0b30c'; ctx.fillRect(34, 6, 28, 14);
      ctx.fillStyle = '#bde3f2'; ctx.fillRect(38, 9, 20, 8);
      ctx.fillStyle = '#333'; ctx.fillRect(70, 4, 3, 14);
      roda(26, 32, 13); roda(80, 37, 8);
    }
    function desenharCaminhonete() {
      ctx.fillStyle = '#d35400'; ctx.fillRect(4, 20, 88, 14);
      ctx.fillStyle = '#b84600'; ctx.fillRect(4, 16, 44, 5);
      ctx.fillStyle = '#d35400'; ctx.fillRect(52, 9, 30, 13);
      ctx.fillStyle = '#bde3f2'; ctx.fillRect(60, 11, 18, 8);
      ctx.fillStyle = '#ffe9a8'; ctx.fillRect(90, 24, 3, 4);
      roda(22, 36, 7); roda(72, 36, 7);
    }
    function retArred(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }


const imgTronco = new Image();
imgTronco.src = 'assets/games/troncosapo.png';

function desenharTronco(x, y, w, dir) {
  if (!imgTronco.complete || !imgTronco.naturalWidth) return;

  // região do tronco dentro da imagem 1920x1080
  const SX = 713, SY = 484, SW = 486, SH = 136;
  const CAP = 90;   // ponta com os anéis (lado esquerdo da imagem)
  const FIM = 29;   // ponta lisa (lado direito da imagem)

  const ty = y + 9, th = 30;                 // posição e altura do tronco na tela
  const k = th / SH;
  const capW = CAP * k, fimW = FIM * k;
  const meioW = w - capW - fimW;             // o miolo estica conforme o tamanho do tronco

  ctx.save();
  ctx.imageSmoothingEnabled = false;         // mantém o pixel art nítido
  let x0 = x;
  if (dir > 0) {                             // esquerda -> direita: imagem invertida
    ctx.translate(x + w, 0);
    ctx.scale(-1, 1);
    x0 = 0;
  }                                          // direita -> esquerda: imagem normal
  ctx.drawImage(imgTronco, SX, SY, CAP, SH, x0, ty, capW, th);
  ctx.drawImage(imgTronco, SX + CAP, SY, SW - CAP - FIM, SH, x0 + capW, ty, meioW, th);
  ctx.drawImage(imgTronco, SX + SW - FIM, SY, FIM, SH, x0 + capW + meioW, ty, fimW, th);
  ctx.restore();
}

const imgSapo = new Image();
imgSapo.src = 'assets/games/sapofrente.png';

const imgSapoVolta = new Image();
imgSapoVolta.src = 'assets/games/sapofrente2.png';   // sapo de frente (sem fundo), usado ao voltar

/* 🐸 SAPO: os PNGs novos (967×720) têm área transparente em volta, então só a parte com o sapo é recortada */
const SAPO_W = 40;                                      // largura do sapo andando na tela (mude pra ajustar)
const SAPO_VOLTA_W = 42;                                // largura do sapo de frente (ao voltar) na tela
const SAPO_CORTE = { x: 199, y: 175, w: 547, h: 376 };  // onde está o sapo dentro do sapofrente.png
const SAPO_VOLTA_CORTE = { x: 199, y: 175, w: 552, h: 406 };   // onde está o sapo dentro do sapofrente2.png
const SAPO_QUALIDADE = 3;                               // o sapo é reduzido uma vez só, nessa resolução (3 = nítido mesmo girando)
let sapoAnda = null, sapoVolta = null;

function recortarSapo(img, corte, largura) {            // recorta e reduz com suavização boa (1 vez só)
  const c = document.createElement('canvas');
  c.width = Math.round(largura * SAPO_QUALIDADE);
  c.height = Math.round(largura * SAPO_QUALIDADE * corte.h / corte.w);
  const cc = c.getContext('2d');
  cc.imageSmoothingEnabled = true;
  cc.imageSmoothingQuality = 'high';
  cc.drawImage(img, corte.x, corte.y, corte.w, corte.h, 0, 0, c.width, c.height);
  return c;
}

function desenharSapo(cx, cy, ang, esticar, sx, sy) {
  if (!imgSapo.complete || !imgSapo.naturalWidth) return;
  const voltando = Math.abs(ang - Math.PI) < 0.01 && imgSapoVolta.complete && imgSapoVolta.naturalWidth;
  if (!sapoAnda) sapoAnda = recortarSapo(imgSapo, SAPO_CORTE, SAPO_W);
  if (voltando && !sapoVolta) sapoVolta = recortarSapo(imgSapoVolta, SAPO_VOLTA_CORTE, SAPO_VOLTA_W);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(sx, sy * (1 + esticar * 0.15));
  ctx.imageSmoothingEnabled = true;          // o sapo já foi reduzido com qualidade, então aqui suaviza
  if (voltando) {
    // ao voltar (seta pra baixo) usa o sapo de frente, sem girar
    const w = SAPO_VOLTA_W, h = sapoVolta.height / SAPO_QUALIDADE;
    ctx.drawImage(sapoVolta, -w / 2, -h / 2, w, h);
  } else {
    const w = SAPO_W, h = sapoAnda.height / SAPO_QUALIDADE;
    ctx.rotate(ang);                   // <- vira o sapo conforme a direção
    ctx.drawImage(sapoAnda, -w / 2, -h / 2, w, h);
  }
  ctx.restore();
}

const imgAgua = new Image();
imgAgua.src = 'assets/games/aguasapo2.png';
const VEL_AGUA = 0.6;   // velocidade da água (aumente ou diminua à vontade)
    function desenharBase(l, r, y) {
      if (l.tipo === 'grama') {
        ctx.fillStyle = l.seca ? (r % 2 ? '#7c8a3d' : '#85933f') : (r % 2 ? '#3b8636' : '#41903a');
        ctx.fillRect(0, y, W, T);
        ctx.strokeStyle = l.seca ? '#5f6b2c' : '#2c6a29'; ctx.lineWidth = 2;
        l.deco.forEach(d => {
          ctx.beginPath(); ctx.moveTo(d.x, y + d.y); ctx.lineTo(d.x - 2, y + d.y - 5);
          ctx.moveTo(d.x, y + d.y); ctx.lineTo(d.x + 2, y + d.y - 5); ctx.stroke();
        });
      } else if (l.tipo === 'estrada') {
        ctx.fillStyle = '#8a6d4b'; ctx.fillRect(0, y, W, T);
        ctx.fillStyle = '#7a5e3f'; ctx.fillRect(0, y + 13, W, 6); ctx.fillRect(0, y + 30, W, 5);
        ctx.fillStyle = '#6e553a';
        l.deco.forEach(d => ctx.fillRect(d.x, y + d.y, 3, 2));
} else {
  ctx.fillStyle = '#3a78a8'; ctx.fillRect(0, y, W, T);   // cor de fundo enquanto a imagem carrega
  if (imgAgua.complete && imgAgua.naturalWidth) {
    const tw = T * imgAgua.naturalWidth / imgAgua.naturalHeight;   // largura de cada repetição, na proporção certa
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.beginPath(); ctx.rect(0, y, W, T); ctx.clip();
    const fase = r * 37;                                           // cada faixa começa em um ponto diferente
const off = (((tick * l.v * l.dir + fase) % tw) + tw) % tw;
    for (let xx = -tw + off; xx < W; xx += tw) {
      ctx.drawImage(imgAgua, xx, y, tw, T);
    }
    ctx.restore();
  }
}
    }
    function desenharObjetos(l, y) {
      if (l.tipo === 'grama') {
        l.blocos.forEach(c => { if (l.seca) desenharToco(c * T + T / 2, y + T / 2); else desenharArvore(c * T + T / 2, y + T / 2); });
      } else if (l.tipo === 'estrada') {
        l.itens.forEach(it => {
          const fn = it.k === 'caminhao' ? desenharCaminhao : it.k === 'trator' ? desenharTrator : desenharCaminhonete;
          comEspelho(it.pos, y, it.w, l.dir, fn);
        });
      } else {
l.itens.forEach(it => desenharTronco(it.pos, y, it.w, l.dir));
      }
    }

    function desenhar() {
      clrCanvas();
      const r0 = Math.max(0, Math.floor(camY) - 1), r1 = Math.ceil(camY + H / T) + 1;
      for (let r = r0; r <= r1; r++) desenharBase(getLane(r), r, yLane(r));
      for (let r = r1; r >= r0; r--) desenharObjetos(getLane(r), yLane(r));   // de cima pra baixo: o de baixo fica na frente

      /* sapo */
      let rv = frog.r, x = frog.x, arco = 0, esticar = 0;
      if (frog.hop) {
        const h = frog.hop, p = Math.min(1, h.t);
        rv = h.r0 + (h.r1 - h.r0) * p; x = h.x0 + (h.x1 - h.x0) * p;
        arco = Math.sin(Math.PI * p); esticar = arco;
      }
      let cy = yLane(rv) + T / 2 - arco * 14;
      if (!frog.hop && estado === 'jogando' && getLane(frog.r).tipo === 'riacho') cy += Math.sin(tick * 0.12) * 1.5;   // balança no tronco
      let sx = 1 + 0.12 * arco, sy = sx, alfa = 1;
      if (estado === 'morrendo') {
        const t = morte.t;
        if (morte.tipo === 'atropelou') { sx = 1.4; sy = 0.25; alfa = Math.max(0, 1 - Math.max(0, t - 25) / 20); }
        else if (morte.tipo === 'afogou' || morte.tipo === 'levado') {
          sx = sy = Math.max(0, 1 - t / 30);
          ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
          for (let k = 0; k < 3; k++) {
            const rad = (t * 0.8 + k * 9) % 28 + 4;
            ctx.globalAlpha = Math.max(0, 1 - rad / 32);
            ctx.beginPath(); ctx.arc(x, cy, rad, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
      }
      if (sx > 0.02 && alfa > 0) { ctx.globalAlpha = alfa; desenharSapo(x, cy, frog.ang, esticar, sx, sy); ctx.globalAlpha = 1; }
      if (estado === 'morrendo') {
        ctx.fillStyle = 'rgba(200,30,30,' + (0.28 * Math.max(0, 1 - morte.t / 45)) + ')';
        ctx.fillRect(0, 0, W, H);
      }
    }

    /* ── LOOP / FIM / INÍCIO ── */
    function loop(ts) {
      if (!running) return;
      const dt = delta(ts); tick += dt;
      atualizar(dt); desenhar();
      if (running) raf = requestAnimationFrame(loop);
    }
    function end() {
      running = false; estado = 'fim'; cancelAnimationFrame(raf);
      const dist = rowMax - 1;
      enviarAoRanking(partidaRanking, dist, 'sapo');
      let rec = 0;
      try { rec = parseInt(localStorage.getItem(RECORDE_KEY) || '0', 10) || 0; } catch (_) {}
      const novo = dist > rec;
      if (novo) { rec = dist; try { localStorage.setItem(RECORDE_KEY, String(rec)); } catch (_) {} }
      const causa = { atropelou: 'Atropelado por um caminhão dos madeireiros.', afogou: 'Caiu na água contaminada.', levado: 'Foi levado pela correnteza.', deixado: 'A tela deixou o sapo para trás.' }[morte.tipo];
      showScreen('O sapo não chegou ao rio',
        causa + '<br>Distância: <strong>' + dist + ' m</strong> · Recorde: <strong>' + rec + ' m</strong>' + (novo && dist > 0 ? '<br>Novo recorde!' : ''),
        'Tentar de novo', true);
    }
    function start() {
      partidaRanking = iniciarRanking('sapo');
      resetar(); estado = 'jogando'; running = true;
      hideScreen(); atualizarHud(); delta.reset();
      raf = requestAnimationFrame(loop);
    }
    startBtn.onclick = start;
    resetar(); desenhar();   // mostra a primeira cena atrás da tela de início
    activeGame = { cleanup: () => {
      running = false;
      document.removeEventListener('keydown', keyH);
      canvas.onpointerdown = null; canvas.onpointerup = null; canvas.onpointercancel = null;
      canvas.style.touchAction = '';
    } };
  }
  
})();