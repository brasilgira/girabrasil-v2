/* ==========================================================================
   GiraBrasil — Indicador animado do menu (header)
   Funciona em TODAS as páginas que têm <nav class="nav-site">.
   - A "pílula" desliza da posição em que ESTAVA (mesmo no meio de uma animação)
     até o link da nova página.
   - O texto fica branco SÓ onde a pílula passa por cima (se ela estiver no meio
     de uma palavra, metade fica branca e metade normal).
   ========================================================================== */
(function () {
  const CHAVE = 'giraNavOrigem';

  // --- AJUSTES (mexa aqui) ------------------------------------------------
  // O tempo depende de QUANTOS links do menu a pílula atravessa.
  const DURACAO_1_PASSO = 260;     // ms — quando anda 1 link (quanto maior, mais lento)
  const ADICIONAL_POR_PASSO = 60;  // ms — somado a cada link a mais
  //   1 passo = 260ms | 2 = 320ms | 3 = 380ms | 4 = 440ms | 5 = 500ms
  const SUAVIDADE = 'cubic-bezier(0.65, 0, 0.35, 1)'; // começa e termina devagar
  const JANELA_MS = 20000;  // tempo máximo entre sair de uma página e carregar a outra

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

    const links = Array.from(nav.querySelectorAll('a')).filter(a => !ind.contains(a));
    const logo = document.querySelector('.logo-site');
    const ativo = nav.querySelector('a.ativo');

    // --- Camada de texto branco (fica DENTRO da pílula e é recortada por ela) --
    // É uma cópia do menu, alinhada por cima do menu de verdade. Como a pílula
    // tem overflow:hidden, só aparece o pedaço de texto que está sob a pílula.
    const camada = document.createElement('div');
    camada.className = 'indicador-texto';
    camada.setAttribute('aria-hidden', 'true');
    links.forEach(l => {
      const c = l.cloneNode(true);
      c.removeAttribute('href');
      c.removeAttribute('id');
      c.classList.remove('ativo');
      c.tabIndex = -1;
      camada.appendChild(c);
    });
    ind.textContent = '';
    ind.appendChild(camada);

    function ajustarCamada() {
      if (!links.length) return;
      camada.style.gap = getComputedStyle(nav).gap;
      camada.style.paddingLeft = links[0].offsetLeft + 'px';
      camada.style.paddingTop = links[0].offsetTop + 'px';
    }

    // A transição vai direto nos elementos (vence qualquer CSS antigo).
    // A camada de texto anda em sentido oposto, com o MESMO tempo e curva,
    // pra ficar parada em relação ao menu.
    function transicao(ms) {
      const t = props => ms ? props.map(p => p + ' ' + ms + 'ms ' + SUAVIDADE).join(', ') : 'none';
      ind.style.transition = t(['left', 'width', 'top', 'height']);
      camada.style.transition = t(['left', 'top']);
    }
    function aplicar(g) {
      ind.style.left = g.left + 'px';
      ind.style.top = g.top + 'px';
      ind.style.width = g.width + 'px';
      ind.style.height = g.height + 'px';
      ind.style.opacity = '1';
      camada.style.left = -g.left + 'px';
      camada.style.top = -g.top + 'px';
    }
    function geometria(el) {
      return { left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight };
    }
    function posicionar(el) { ajustarCamada(); aplicar(geometria(el)); }

    // Enquanto a pílula está deslizando, nada pode reposicioná-la.
    let deslizando = false;
    let ajustePendente = false;

    // --- Ao carregar a página ---------------------------------------------
    if (ativo) {
      ajustarCamada();
      let salvo = null;
      try {
        const bruto = JSON.parse(sessionStorage.getItem(CHAVE));
        sessionStorage.removeItem(CHAVE);
        if (bruto && Date.now() - bruto.t < JANELA_MS) salvo = bruto;
      } catch (e) {}

      const alvo = geometria(ativo);
      const distancia = salvo ? Math.abs(salvo.left - alvo.left) + Math.abs(salvo.width - alvo.width) : 0;

      if (salvo && distancia > 1) {
        // Começa exatamente de onde a pílula estava na página anterior
        // (mesmo que estivesse no meio do caminho) e desliza até aqui.
        const centro = salvo.left + salvo.width / 2;
        const maisPerto = links.reduce((melhor, l) =>
          Math.abs(l.offsetLeft + l.offsetWidth / 2 - centro) < Math.abs(melhor.offsetLeft + melhor.offsetWidth / 2 - centro) ? l : melhor
        , links[0]);
        const passos = Math.max(1, Math.abs(links.indexOf(ativo) - links.indexOf(maisPerto)));
        const duracao = DURACAO_1_PASSO + (passos - 1) * ADICIONAL_POR_PASSO;

        deslizando = true;
        transicao(0);
        aplicar(salvo);
        void ind.offsetWidth; // força o navegador a "fixar" a posição inicial
        requestAnimationFrame(() => requestAnimationFrame(() => {
          transicao(duracao);
          posicionar(ativo);
          setTimeout(() => {
            deslizando = false;
            if (ajustePendente) { ajustePendente = false; posicionar(ativo); }
          }, duracao + 100);
        }));
      } else {
        transicao(0);
        posicionar(ativo);
      }
    }

    // --- Ao clicar: guarda ONDE A PÍLULA ESTÁ AGORA (mesmo no meio da animação) --
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
        const cs = getComputedStyle(ind); // valor atual, já interpolado pela animação
        const atual = {
          left: parseFloat(cs.left), top: parseFloat(cs.top),
          width: parseFloat(cs.width), height: parseFloat(cs.height)
        };
        if ([atual.left, atual.top, atual.width, atual.height].some(isNaN)) return;
        transicao(0);   // congela a pílula aqui enquanto a próxima página carrega
        aplicar(atual);
        sessionStorage.setItem(CHAVE, JSON.stringify({ ...atual, t: Date.now() }));
      } catch (err) {}
    }
    links.forEach(l => l.addEventListener('click', aoClicar));
    if (logo) logo.addEventListener('click', aoClicar);

    // --- Manter alinhado -------------------------------------------------------
    if (ativo && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (deslizando) ajustePendente = true; // espera a animação acabar
        else posicionar(ativo);
      });
    }
    function realinharAgora() {
      if (!ativo) return;
      deslizando = false;
      transicao(0);
      posicionar(ativo);
    }
    window.addEventListener('resize', realinharAgora);
    window.addEventListener('pageshow', e => { if (e.persisted) realinharAgora(); });
  }

  // O script fica no fim do <body>: o menu já existe, então roda na hora.
  if (document.querySelector('.nav-site')) iniciar();
  else document.addEventListener('DOMContentLoaded', iniciar);
})();
