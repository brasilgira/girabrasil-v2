/* ==========================================================================
   GiraBrasil — Indicador animado do menu (header)
   Funciona em TODAS as páginas que têm <nav class="nav-site">.
   Ao clicar em qualquer link do menu (ou no logo), a página muda na hora e
   a "pílula" do menu desliza da posição antiga até a nova, de forma suave.
   ========================================================================== */
(function () {
  const CHAVE = 'giraNavOrigem';

  // --- AJUSTES DE VELOCIDADE (mexa aqui) ---------------------------------
  // A pílula anda sempre na MESMA velocidade: quanto mais longe o destino,
  // mais tempo ela leva (em vez de correr mais pra chegar no mesmo tempo).
  const VELOCIDADE = 500;   // pixels por segundo — menor = mais lento/suave
  const DURACAO_MIN = 350;  // ms — tempo mínimo (pra links vizinhos não ficarem bruscos)

  function iniciar() {
    const nav = document.querySelector('.nav-site');
    if (!nav) return;

    // Reaproveita a div do indicador se já existir no HTML; senão cria.
    let ind = nav.querySelector('.indicador-verde');
    if (!ind) {
      ind = document.createElement('div');
      ind.className = 'indicador-verde';
      ind.id = 'indicador';
      nav.prepend(ind);
    }

    const links = Array.from(nav.querySelectorAll('a'));
    const logo = document.querySelector('.logo-site');
    const ativo = nav.querySelector('a.ativo');

    function posicionar(el) {
      ind.style.width = el.offsetWidth + 'px';
      ind.style.height = el.offsetHeight + 'px';
      ind.style.left = el.offsetLeft + 'px';
      ind.style.top = el.offsetTop + 'px';
      ind.style.opacity = '1';
    }

    // --- Ao carregar a página ---------------------------------------------
    if (ativo) {
      let origem = null;
      try {
        const salvo = JSON.parse(sessionStorage.getItem(CHAVE));
        sessionStorage.removeItem(CHAVE);
        if (salvo && Date.now() - salvo.t < 4000) {
          origem = links.find(l => l.getAttribute('href') === salvo.href) || null;
        }
      } catch (e) {}

      if (origem && origem !== ativo) {
        // Começa onde a pílula estava na página anterior e desliza até aqui.
        const distancia = Math.abs(ativo.offsetLeft - origem.offsetLeft);
        const duracao = Math.max(DURACAO_MIN, (distancia / VELOCIDADE) * 1000);
        nav.style.setProperty('--duracao-indicador', duracao + 'ms');
        nav.classList.add('entrando');
        origem.classList.add('origem');
        posicionar(origem);
        void ind.offsetWidth; // força o navegador a "fixar" a posição inicial
        requestAnimationFrame(() => requestAnimationFrame(() => {
          ind.classList.add('animando');
          nav.classList.remove('entrando');
          origem.classList.remove('origem');
          posicionar(ativo);
        }));
      } else {
        posicionar(ativo);
        setTimeout(() => ind.classList.add('animando'), 50);
      }
    }

    // --- Ao clicar: guarda de onde saiu e deixa a página trocar normalmente --
    function aoClicar(e) {
      if (!ativo || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.currentTarget;
      if (a.target && a.target !== '_self') return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      try {
        sessionStorage.setItem(CHAVE, JSON.stringify({ href: ativo.getAttribute('href'), t: Date.now() }));
      } catch (err) {}
    }
    links.forEach(l => l.addEventListener('click', aoClicar));
    if (logo) logo.addEventListener('click', aoClicar);

    // --- Manter alinhado se a janela/fonte mudar ------------------------------
    function realinhar() {
      if (!ativo) return;
      ind.classList.remove('animando');
      posicionar(ativo);
      void ind.offsetWidth;
      ind.classList.add('animando');
    }
    window.addEventListener('resize', realinhar);
    window.addEventListener('pageshow', e => { if (e.persisted) realinhar(); }); // botão "voltar"
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(realinhar);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
