/* Barra de rolagem própria do Gira-Brasil.
   - Esconde a barra nativa do navegador.
   - Desenha uma barra verde fixa à direita, que começa ABAIXO do header. */
(function () {
  if (window.__gbScroll) return;
  window.__gbScroll = true;

  var css = `
    html { scrollbar-width: none; -ms-overflow-style: none; }
    html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; width: 0; height: 0; }

    .gb-scroll {
      --gb-scroll-thumb: #246b5a;        /* verde da barra */
      --gb-scroll-thumb-hover: #16281f;  /* verde ao passar o mouse / arrastar */
      position: fixed;
      right: 0;
      width: 14px;                       /* era 10px (2,5x) */
      z-index: 90;                       /* abaixo do header (z-index 100) */
      background: rgba(22, 40, 31, 0.08);
      display: none;
    }
    .gb-scroll.visivel { display: block; }
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

  var track = document.createElement('div');
  track.className = 'gb-scroll';
  track.setAttribute('aria-hidden', 'true');
  var thumb = document.createElement('div');
  thumb.className = 'gb-scroll-thumb';
  track.appendChild(thumb);
  document.body.appendChild(track);

  var root = document.scrollingElement || document.documentElement;
  var html = document.documentElement;
  var header = document.querySelector('.header-site');

  function atualizar() {
    var vh = window.innerHeight;
    var total = root.scrollHeight;

    // a barra começa logo abaixo do header (se ele estiver visível na tela)
    var topo = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    track.style.top = topo + 'px';
    track.style.height = (vh - topo) + 'px';

    if (total <= vh + 1) { track.classList.remove('visivel'); return; }
    track.classList.add('visivel');

    var trackH = track.clientHeight;
    var thumbH = Math.max(40, trackH * (vh / total));
    var maxScroll = total - vh;
    var y = (root.scrollTop / maxScroll) * (trackH - thumbH);

    thumb.style.height = thumbH + 'px';
    thumb.style.transform = 'translateY(' + y + 'px)';
  }

  var pendente = false;
  function agendar() {
    if (pendente) return;
    pendente = true;
    requestAnimationFrame(function () { pendente = false; atualizar(); });
  }

  // ---- arrastar a barra: a página vai EXATAMENTE para onde você puxa ----
  var arrastando = false, inicioY = 0, inicioScroll = 0;

  thumb.addEventListener('pointerdown', function (e) {
    arrastando = true;
    inicioY = e.clientY;
    inicioScroll = root.scrollTop;
    html.style.scrollBehavior = 'auto';   // desliga o "smooth" durante o arrasto
    track.classList.add('arrastando');
    thumb.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  thumb.addEventListener('pointermove', function (e) {
    if (!arrastando) return;
    var trackH = track.clientHeight;
    var thumbH = thumb.offsetHeight;
    var maxScroll = root.scrollHeight - window.innerHeight;
    root.scrollTop = inicioScroll + ((e.clientY - inicioY) / (trackH - thumbH)) * maxScroll;
  });
  function soltar() {
    arrastando = false;
    html.style.scrollBehavior = '';       // volta ao padrão do site
    track.classList.remove('arrastando');
  }
  thumb.addEventListener('pointerup', soltar);
  thumb.addEventListener('pointercancel', soltar);

  // ---- clicar na trilha: rola suave até aquele ponto ----
  track.addEventListener('pointerdown', function (e) {
    if (e.target !== track) return;
    var r = track.getBoundingClientRect();
    var proporcao = (e.clientY - r.top) / r.height;
    root.scrollTo({ top: proporcao * (root.scrollHeight - window.innerHeight), behavior: 'smooth' });
  });

  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', agendar);
  window.addEventListener('load', agendar);
  if ('ResizeObserver' in window) new ResizeObserver(agendar).observe(document.body);
  atualizar();
})();