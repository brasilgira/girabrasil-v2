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
  const LIVES_MAP = ['❤️❤️❤️','❤️❤️','❤️','💀'];

  let activeGame = null;
  let raf = null;

  if (!overlay) return;

  /* ════════════════════════════════════
     NAVEGAÇÃO MENU ↔ JOGO
  ════════════════════════════════════ */
  function openOverlay() {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    showMenu();
  }
  function closeOverlay() {
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
  document.getElementById('btn-close-game').addEventListener('click', closeOverlay);
  /* Nesta página os jogos são abertos direto pelos cards do seletor
     (não existe um menu interno no modal), então "← Jogos" apenas
     fecha o modal e volta pro seletor de cards da página. */
  document.getElementById('btn-back').addEventListener('click', closeOverlay);
  // O jogo só deve ser fechado pelos controles explícitos (X, "← Jogos"
  // ou Esc). Clicar fora do painel não interrompe a partida.
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('active')) closeOverlay(); });

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
    scoreEl.textContent = score;
    levelEl.textContent = level;
    livesEl.textContent = LIVES_MAP[Math.max(0, 3 - lives)];
    hudLevel.style.display = showLevel ? '' : 'none';
    hudLives.style.display = showLives ? '' : 'none';
  }
  function showScreen(title, desc, btnTxt='Começar!') {
    screenTitle.textContent = title;
    screenDesc.innerHTML = desc;
    startBtn.textContent = btnTxt;
    screenEl.style.display = 'flex';
  }
  function hideScreen() { screenEl.style.display = 'none'; }
  function popup(x, y, color, text) {
    const rect = canvas.getBoundingClientRect();
    const sx = rect.width / W; const sy = rect.height / H;
    const wrapRect = canvasWrap.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'hit-popup';
    el.style.left  = (rect.left - wrapRect.left + x * sx) + 'px';
    el.style.top   = (y * sy - 12) + 'px';
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
    const extra = document.getElementById('especies-opcoes');
    if (extra) extra.remove();
    switch(id) {
      case 'quiz-da-floresta':          initEspecies(); break;
      case 'guardioes-da-amazonia':     initGuarda();   break;
      case 'desafio-dos-biomas':        initFuga();     break;
      case 'missao-biodiversidade':     initRio();      break;
      /* aliases (ids originais do protótipo) */
      case 'especies': initEspecies(); break;
      case 'guarda':   initGuarda();   break;
      case 'fuga':     initFuga();     break;
      case 'rio':      initRio();      break;
    }
  }


  /* ════════════════════════════════════
     JOGO — QUIZ DE ESPÉCIES
  ════════════════════════════════════ */
function initEspecies() {
  titleEl.textContent = '🦜 Identificar Espécies';
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
      popup(W / 2, H / 2, '#22c55e', `+${pontos} ✓`);
    } else {
      lives--;
      btn.classList.add('wrong');
      opcoesEl.querySelectorAll('.especie-btn').forEach(b => {
        if (b.dataset.nome === current.nome) b.classList.add('correct');
      });
      popup(W / 2, H / 2, '#f87171', '✗ Errou');
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
        popup(W / 2, 60, '#f87171', '⏱ Tempo!');
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
    showScreen('🦜 Fim do Quiz!', `Espécies identificadas: <strong>${correct}</strong><br>Pontuação: <strong>${score}</strong>`, 'Jogar de novo');
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
     JOGO — GUARDA DA FLORESTA
  ════════════════════════════════════ */
  function initGuarda() {
    titleEl.textContent = '🌿 Guarda da Floresta';
    tipEl.textContent   = 'Clique nas motosserras · Poupe os animais · Cada inimigo destruído = +10 pts';
    updateHUD(0,1,3);
    showScreen('Guarda da Floresta',
      'Clique nas <strong>motosserras 🪚</strong> para destruí-las.<br>Não clique nos <strong>animais aliados</strong> 🦋🦜🐸 — eles precisam de você!');

    const ENEMIES=['🪚','🪚','🪚','⛏️'];
    const ALLIES=['🦋','🦜','🐸','🦎','🐦','🌺'];
    let score=0,lives=3,level=1,entities=[],tick=0,interval=85,running=false;
    const delta=makeDelta();

    function spawn(){
      const isE=Math.random()<0.48;
      entities.push({x:50+Math.random()*(W-100),y:-35,emoji:isE?ENEMIES[~~(Math.random()*ENEMIES.length)]:ALLIES[~~(Math.random()*ALLIES.length)],isEnemy:isE,size:26+Math.random()*10,speed:1+level*0.35+Math.random(),dead:false,flash:0});
    }
    function loop(ts){
      if(!running)return;
      const dt=delta(ts);
      clrCanvas(); drawForestBg();
      tick+=dt; if(tick>=interval){tick=0;interval=Math.max(28,85-level*7);spawn();if(Math.random()<0.3)spawn();}
      entities.forEach(e=>{
        if(e.dead)return; e.y+=e.speed*dt;
        if(e.y>H+30){e.dead=true;if(e.isEnemy){lives--;updateHUD(score,level,lives);shakePanel();if(lives<=0){end(false);return;}}return;}
        ctx.globalAlpha=0.14; ctx.fillStyle='#000'; ctx.beginPath();
        ctx.ellipse(e.x,e.y+e.size*.42,e.size*.38,e.size*.1,0,0,Math.PI*2); ctx.fill();
        if(e.flash>0){ctx.globalAlpha=0.5+e.flash*.05;e.flash--;}else{ctx.globalAlpha=1;}
        ctx.font=`${e.size}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(e.emoji,e.x,e.y); ctx.globalAlpha=1;
      });
      entities=entities.filter(e=>!e.dead);
      if(score>=level*130){level++;updateHUD(score,level,lives);}
      raf=requestAnimationFrame(loop);
    }
    function end(won){
      running=false; cancelAnimationFrame(raf);
      showScreen(won?'🌳 Floresta Salva!':'🔥 A floresta queimou...',
        `Pontuação: <strong>${score}</strong><br>${won?'Você protegeu a biodiversidade!':'Tente de novo — a floresta precisa de você!'}`,
        'Jogar de novo');
    }
    function start(){score=0;lives=3;level=1;entities=[];tick=0;interval=85;running=true;hideScreen();updateHUD(score,level,lives);delta.reset();raf=requestAnimationFrame(loop);}
    canvas.onclick=e=>{
      if(!running)return;
      const r=canvas.getBoundingClientRect(),sx=W/r.width,sy=H/r.height;
      const mx=(e.clientX-r.left)*sx,my=(e.clientY-r.top)*sy;
      entities.forEach(en=>{
        if(en.dead)return;
        if(Math.hypot(mx-en.x,my-en.y)<en.size*.7){
          if(en.isEnemy){en.dead=true;score+=10;updateHUD(score,level,lives);popup(en.x,en.y,'#22c55e','+10');}
          else{lives--;en.flash=8;updateHUD(score,level,lives);popup(en.x,en.y,'#f87171','−vida');shakePanel();if(lives<=0)end(false);}
        }
      });
    };
    startBtn.onclick=start;
    activeGame={cleanup:()=>{running=false;canvas.onclick=null;}};
  }

  /* ════════════════════════════════════
     JOGO 2 — FUGA DO DESMATAMENTO
  ════════════════════════════════════ */
  
  /* ════════════════════════════════════
     JOGO — FUGA DO DESMATAMENTO
  ════════════════════════════════════ */
  function initFuga() {
    titleEl.textContent = '🐆 Fuga do Desmatamento';
    tipEl.textContent   = 'Espaço (ou toque na tela) para pular · Segure para pular mais alto · Colete folhas para acelerar';
    updateHUD(0,1,3,true,true);
    showScreen('Fuga do Desmatamento',
      'Você é uma <strong>onça-pintada</strong> fugindo do desmatamento!<br>Pule obstáculos com <strong>Espaço/Clique</strong>.');

    const GH=H; const GROUND=GH-50;
    const OBSTACLE_SINK = 12;
        const ZOOM = 1.5;          // 1 = sem zoom · 1.3 = leve · 1.5 = médio · 2 = bem perto
    const VIEW_W = W / ZOOM;   // largura do mundo que aparece na tela
    const ONCA_RENDER_WIDTH = 104;
    const ONCA_RENDER_HEIGHT = 65;
const FIRE_VISIBLE_HEIGHT = 80;   // altura que o fogo aparece na tela (aumente para ficar maior)
const FIRE_SRC_VISIBLE_H = 980;   // altura útil do fogo dentro do PNG
const FIRE_SRC_BOTTOM = 1012;     // linha do PNG onde a chama termina
const FIRE_SCALE = FIRE_VISIBLE_HEIGHT / FIRE_SRC_VISIBLE_H;
const FIRE_RENDER_WIDTH = 1920 * FIRE_SCALE;
const FIRE_RENDER_HEIGHT = 1080 * FIRE_SCALE;
    let score=0,lives=3,level=1,running=false,dist=0;
    let onca={x:90,y:GROUND,vy:0,onGround:true,w:48,h:32};
    let obstacles=[],powerups=[],bgX=0,speed=3.2,tick=0,obsTick=0,obsInterval=110;
    let groundX = 0; 
    const JUMP_V=-11.5, GRAVITY=0.45;
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
const fireImg1 = new Image();


fireImg1.src = 'assets/games/1F.png';

const fireImg2 = new Image();
fireImg2.src = 'assets/games/2F.png';

const fireImg3 = new Image();
fireImg3.src = 'assets/games/3F.png';

const fireImg4 = new Image();
fireImg4.src = 'assets/games/4F.png';

const fireImg5 = new Image();
fireImg5.src = 'assets/games/5F.png';

const fireImg6 = new Image();
fireImg6.src = 'assets/games/6F.png';

// ÁRVORE
const treeImg = new Image();
treeImg.src = 'assets/games/arvore.png';

//CHÃO
const groundImg = new Image();
groundImg.src = 'assets/games/chao.png';

//FUNDO
const fundoImg = new Image();
fundoImg.src = 'assets/games/fundofloresta.jpg';

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
    sprite.img,
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
  const py = onca.y - h;

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
    hitX1: px + w * 0.2,
    hitX2: px + w * 0.8,
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

    const JUMP_CUT = -4;   // mais perto de 0 = toque mais curto · mais negativo = toque mais alto
    function releaseJump(){
      if(!onca.onGround && onca.vy < JUMP_CUT) onca.vy = JUMP_CUT;
    }

    let holdingJump = false;

    const keyH=e=>{
      if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();holdingJump=true;jump();}
    };
    const keyU=e=>{
      if(e.code==='Space'||e.code==='ArrowUp'){holdingJump=false;releaseJump();}
    };
    document.addEventListener('keydown',keyH);
    document.addEventListener('keyup',keyU);

    /* só o toque (celular) pula; clique de mouse não faz nada */
    canvas.style.touchAction='none';
    canvas.onpointerdown=e=>{ if(e.pointerType!=='touch')return; holdingJump=true; jump(); };
    canvas.onpointerup=e=>{ if(e.pointerType!=='touch')return; holdingJump=false; releaseJump(); };
    canvas.onpointercancel=()=>{ holdingJump=false; releaseJump(); };

function drawFire(ob) {
  let img;

  /*
   * Escolhe o frame atual da animação do fogo.
   */
  const frame = Math.floor(tick / 6) % 6;

  if (frame === 0) img = fireImg1;
  else if (frame === 1) img = fireImg2;
  else if (frame === 2) img = fireImg3;
  else if (frame === 3) img = fireImg4;
  else if (frame === 4) img = fireImg5;
  else img = fireImg6;

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
      speed=3.2+level*0.4; if(dist>level*1200)level++;
      updateHUD(score,level,lives);
      clrCanvas();
            ctx.save();
      ctx.translate(0, H * (1 - ZOOM));
      ctx.scale(ZOOM, ZOOM);

      /* fundo */
      if (fundoImg.complete && fundoImg.naturalWidth > 0) {
        const fsc = Math.max(W / fundoImg.naturalWidth, GH / fundoImg.naturalHeight);
        const fw = fundoImg.naturalWidth * fsc;
        const fh = fundoImg.naturalHeight * fsc;
        ctx.drawImage(fundoImg, (W - fw) / 2, (GH - fh) / 2, fw, fh);
      } else {
        const sky=ctx.createLinearGradient(0,0,0,GH);
        sky.addColorStop(0,'#04100a'); sky.addColorStop(1,'#0d2e16');
        ctx.fillStyle=sky; ctx.fillRect(0,0,W,GH);
      }

      /* árvores pixel art de fundo (paralaxe) */
      bgX -= speed * 0.3 * dt;
      if(bgX < -W) bgX = 0;
 if (treeBgImg.complete && treeBgImg.naturalWidth > 0) {
  [0, W].forEach(ox => {
    BG_TREES.forEach(t => {
      const tx = t.x + ox + bgX;
      const sc = t.scale;
      const dw = BG_TREE_WIDTH * sc;
      const dh = BG_TREE_HEIGHT * sc;

      ctx.drawImage(
        treeBgImg,
        tx - dw / 2,
        GROUND - dh,
        dw,
        dh
      );
    });
  });
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
        if(Math.abs(p.x-onca.x)<30&&Math.abs(p.y-(GROUND-30))<30){p.alive=false;score+=25;popup(p.x,p.y,'#fbbf24','+25🍃');}
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
    onca.y - oh;

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
      level,
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

      /* score display */
      ctx.fillStyle='rgba(34,197,94,0.35)'; ctx.font='bold 12px monospace';
      ctx.textAlign='right'; ctx.fillText(`${~~(dist/6)} m`,W-14,22);

      raf=requestAnimationFrame(loop);
    }

    function end(won){
      running=false;cancelAnimationFrame(raf);
      showScreen(won?'🐆 Onça Salva!':'💀 A onça foi capturada...',
        `Distância percorrida: <strong>${~~(dist/6)} m</strong><br>${won?'A onça escapou para a reserva!':'Tente de novo!'}`,
        'Correr de novo');
    }
    function start(){holdingJump=false;score=0;lives=3;level=1;dist=0;speed=3.2;tick=0;obsTick=0;obsInterval=110;
      obstacles=[];powerups=[];onca={x:90,y:GROUND,vy:0,onGround:true,w:48,h:32};
      running=true;hideScreen();updateHUD(0,1,3);delta.reset();raf=requestAnimationFrame(loop);}
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
        'Jogar de novo');
    }
    function start(){score=0;lives=3;level=1;tick=0;spawnAccum=0;waterQuality=100;particles=[];filters=[];running=true;hideScreen();updateHUD(0,1,3);delta.reset();raf=requestAnimationFrame(loop);}
    startBtn.onclick=start;
    activeGame={cleanup:()=>{running=false;canvas.removeEventListener('click',clickH);canvas.onclick=null;}};
  }
})();
