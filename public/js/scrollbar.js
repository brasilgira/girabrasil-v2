/* Barra de rolagem própria do Gira-Brasil.
   - Esconde a barra nativa do navegador.
   - Desenha uma barra verde fixa à direita, que começa ABAIXO do header.
   - Na página do Gira-Bot (onde a página não rola) a MESMA barra é
     colocada na área de mensagens do chat (.chat-mensagens). */
(function () {
  if (window.__gbScroll) return;
  window.__gbScroll = true;

  var css = `
    html { scrollbar-width: none; -ms-overflow-style: none; }
    html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; width: 0; height: 0; }

    /* esconde a barra nativa de um elemento que usa a barra do site */
    .gb-scroll-nativa-oculta { scrollbar-width: none; -ms-overflow-style: none; }
    .gb-scroll-nativa-oculta::-webkit-scrollbar { display: none; width: 0; height: 0; }

    .gb-scroll {
      --gb-scroll-thumb: #246b5a;        /* verde da barra */
      --gb-scroll-thumb-hover: #16281f;  /* verde ao passar o mouse / arrastar */
      position: fixed;
      right: 0;
      width: 14px;
      z-index: 90;                       /* abaixo do header (z-index 100) */
      background: rgba(22, 40, 31, 0.08);
      display: none;
      opacity: 0;                        /* apagada por padrão */
      transition: opacity .5s ease;
    }
    .gb-scroll.visivel { display: block; }
    .gb-scroll.ativo { opacity: 1; }     /* acesa ao rolar, passar o mouse ou arrastar */
    .gb-scroll-thumb {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      min-height: 40px;
      border-radius: 0;
      background: var(--gb-scroll-thumb);
      cursor: pointer;
    }
  `;
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var root = document.scrollingElement || document.documentElement;
  var html = document.documentElement;
  var header = document.querySelector('.header-site');
  var TEMPO_APAGAR = 2000;   // ms parada antes de apagar

  /* Cria uma barra. `el` = elemento que rola; se for null, rola a página. */
  function criarBarra(el) {
    var track = document.createElement('div');
    track.className = 'gb-scroll';
    track.setAttribute('aria-hidden', 'true');
    var thumb = document.createElement('div');
    thumb.className = 'gb-scroll-thumb';
    track.appendChild(thumb);
    document.body.appendChild(track);

    var alvo = el || root;
    if (el) el.classList.add('gb-scroll-nativa-oculta');

    function medidas() {
      return el
        ? { vh: el.clientHeight, total: el.scrollHeight }
        : { vh: window.innerHeight, total: root.scrollHeight };
    }

    function atualizar() {
      var m = medidas();

      if (el) {
        // a barra acompanha exatamente a área do elemento (chat)
        var r = el.getBoundingClientRect();
        track.style.top = r.top + 'px';
        track.style.height = r.height + 'px';
        track.style.right = Math.max(0, window.innerWidth - r.right) + 'px';
      } else {
        // a barra começa logo abaixo do header (se ele estiver visível na tela)
        var topo = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
        track.style.top = topo + 'px';
        track.style.height = (m.vh - topo) + 'px';
      }

      if (m.total <= m.vh + 1) { track.classList.remove('visivel'); return; }
      track.classList.add('visivel');

      var trackH = track.clientHeight;
      var thumbH = Math.max(40, trackH * (m.vh / m.total));
      var maxScroll = m.total - m.vh;
      var y = (alvo.scrollTop / maxScroll) * (trackH - thumbH);

      thumb.style.height = thumbH + 'px';
      thumb.style.transform = 'translateY(' + y + 'px)';
    }

    var pendente = false;
    function agendar() {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(function () { pendente = false; atualizar(); });
    }

    // ---- some depois de alguns segundos parada; volta ao rolar, passar o mouse ou arrastar ----
    var timerApagar = null;
    var mouseEmCima = false;
    var arrastando = false, inicioY = 0, inicioScroll = 0;
    function mostrar() {
      track.classList.add('ativo');
      clearTimeout(timerApagar);
      timerApagar = setTimeout(function () {
        if (!arrastando && !mouseEmCima) track.classList.remove('ativo');
      }, TEMPO_APAGAR);
    }
    track.addEventListener('pointerenter', function () { mouseEmCima = true; mostrar(); });
    track.addEventListener('pointerleave', function () { mouseEmCima = false; mostrar(); });

    // ---- arrastar a barra: a página vai EXATAMENTE para onde você puxa ----
    thumb.addEventListener('pointerdown', function (e) {
      arrastando = true;
      inicioY = e.clientY;
      inicioScroll = alvo.scrollTop;
      html.style.scrollBehavior = 'auto';   // desliga o "smooth" durante o arrasto
      track.classList.add('arrastando');
      mostrar();
      thumb.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    thumb.addEventListener('pointermove', function (e) {
      if (!arrastando) return;
      var m = medidas();
      var trackH = track.clientHeight;
      var thumbH = thumb.offsetHeight;
      alvo.scrollTop = inicioScroll + ((e.clientY - inicioY) / (trackH - thumbH)) * (m.total - m.vh);
    });
    function soltar() {
      arrastando = false;
      html.style.scrollBehavior = '';       // volta ao padrão do site
      track.classList.remove('arrastando');
      mostrar();
    }
    thumb.addEventListener('pointerup', soltar);
    thumb.addEventListener('pointercancel', soltar);

    // ---- clicar na trilha: rola suave até aquele ponto ----
    track.addEventListener('pointerdown', function (e) {
      if (e.target !== track) return;
      var r = track.getBoundingClientRect();
      var m = medidas();
      var proporcao = (e.clientY - r.top) / r.height;
      alvo.scrollTo({ top: proporcao * (m.total - m.vh), behavior: 'smooth' });
    });

    // ---- eventos ----
    (el || window).addEventListener('scroll', agendar, { passive: true });
    (el || window).addEventListener('scroll', mostrar, { passive: true });
    window.addEventListener('resize', agendar);
    window.addEventListener('load', agendar);
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(agendar);
      ro.observe(el || document.body);
      if (el) {
        // mensagens novas no chat aumentam o scrollHeight sem mudar o tamanho do elemento
        new MutationObserver(agendar).observe(el, { childList: true, subtree: true, characterData: true });
      }
    }
    atualizar();
    mostrar();
  }

  function iniciar() {
    var chat = document.querySelector('.chat-mensagens');
    if (chat) {
      // página do Gira-Bot: a página não rola, quem rola é o chat
      criarBarra(chat);
    } else {
      criarBarra(null);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();