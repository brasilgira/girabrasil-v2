// ============================================================================
// Gira-Brasil — Páginas de bioma (redesign)
// Monta a página a partir de window.BIOMAS (js/biomas-data.js).
// Usado só por biomas/*.html. O js/biomas.js antigo (que montava estas
// mesmas páginas) deixa de ser carregado, mas pode ficar no projeto.
// ============================================================================
(function () {
  'use strict';

  const slug = document.body.dataset.bioma;
  const bioma = window.BIOMAS && window.BIOMAS[slug];
  const root = document.getElementById('bioma-root');
  if (!root) return;

  if (!bioma) {
    root.innerHTML = '<p class="bz-vazio">Bioma não encontrado. <a href="../index.html#biomas">Ver todos os biomas</a></p>';
    return;
  }

  // --------------------------------------------------------------------------
  // Paleta de cada bioma — tirada da própria foto de capa
  // --------------------------------------------------------------------------
  const TEMAS = {
    amazonia: {
      paper: '#F0F3EA', soft: '#DFE8D8', line: '#CBD6C4', ink: '#0F1F15', inkSoft: '#4B5A4F',
      deep: '#0C2016', deepInk: '#E8F0E4', deepSoft: '#9DB5A2',
      acc: '#2F7A4B', accText: '#23603A', accOnDeep: '#8FD0A3'
    },
    caatinga: {
      paper: '#FCF3E3', soft: '#F4E2C6', line: '#E6D2B2', ink: '#2E1708', inkSoft: '#6A4A33',
      deep: '#3A1A0C', deepInk: '#FBEBD3', deepSoft: '#D1A98A',
      acc: '#BF4E1B', accText: '#A33F10', accOnDeep: '#F2A56B'
    },
    cerrado: {
      paper: '#F7F0E1', soft: '#EBDFC6', line: '#DCCFB2', ink: '#23211D', inkSoft: '#5E574B',
      deep: '#25272F', deepInk: '#EEEAE0', deepSoft: '#A9ABB5',
      acc: '#B23A20', accText: '#9A2F18', accOnDeep: '#E8A441'
    },
    'mata-atlantica': {
      paper: '#EDF3F1', soft: '#D8E7E3', line: '#C3D8D3', ink: '#0B2428', inkSoft: '#47605F',
      deep: '#0A2E33', deepInk: '#E4F1EE', deepSoft: '#93B9B5',
      acc: '#17766F', accText: '#0F6761', accOnDeep: '#7FD6CB'
    },
    pampa: {
      paper: '#F4F7EC', soft: '#E3EBD3', line: '#D0DBBA', ink: '#1B2A17', inkSoft: '#51644A',
      deep: '#223B26', deepInk: '#EAF3E1', deepSoft: '#A7C2A0',
      acc: '#4E7F1D', accText: '#46701A', accOnDeep: '#B9E07A'
    },
    pantanal: {
      paper: '#FBF0EA', soft: '#F6DDD3', line: '#EACBBE', ink: '#2B1420', inkSoft: '#6A4A55',
      deep: '#321A2C', deepInk: '#FBE9E2', deepSoft: '#CFA4AE',
      acc: '#C2432B', accText: '#B03C25', accOnDeep: '#FF9C7D'
    }
  };
  const t = TEMAS[slug] || TEMAS.amazonia;
  const estilo = document.documentElement.style;
  estilo.setProperty('--paper', t.paper);
  estilo.setProperty('--soft', t.soft);
  estilo.setProperty('--line', t.line);
  estilo.setProperty('--ink', t.ink);
  estilo.setProperty('--ink-soft', t.inkSoft);
  estilo.setProperty('--deep', t.deep);
  estilo.setProperty('--deep-ink', t.deepInk);
  estilo.setProperty('--deep-soft', t.deepSoft);
  estilo.setProperty('--acc', t.acc);
  estilo.setProperty('--acc-text', t.accText);
  estilo.setProperty('--acc-on-deep', t.accOnDeep);
  document.body.classList.add('bz');
  document.title = `${bioma.nome} — Gira-Brasil`;

  // O header do site é fixo: mede a altura real pro índice grudar logo abaixo.
  const headerSite = document.querySelector('.header-site');
  function medirHeader() {
    if (headerSite) estilo.setProperty('--hdr', headerSite.offsetHeight + 'px');
  }
  medirHeader();
  window.addEventListener('resize', medirHeader);

  // --------------------------------------------------------------------------
  // Utilitários
  // --------------------------------------------------------------------------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const limitar = (n, min, max) => Math.min(Math.max(n, min), max);

  const ICONES = {
    voltar: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>',
    pino: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    tocar: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z"/></svg>',
    pausar: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4.5" height="16" rx="1.2"/><rect x="13.5" y="4" width="4.5" height="16" rx="1.2"/></svg>',
    esquerda: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    direita: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    fechar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>'
  };

  const NOMES_REGIAO = { norte: 'Norte', nordeste: 'Nordeste', 'centro-oeste': 'Centro-Oeste', sudeste: 'Sudeste', sul: 'Sul' };

  // Cor do ponto de status (a cor nunca vai sozinha: o texto sempre aparece junto)
  const COR_STATUS = {
    'pouco preocupante': '#3E8E5A',
    'quase ameaçada': '#B8962E',
    'vulnerável': '#D9822B',
    'em perigo': '#C8452D',
    'criticamente em perigo': '#8E1F2D',
    'extinta na natureza': '#5B2A86'
  };
  const corDoStatus = (s) => COR_STATUS[String(s || '').toLowerCase()] || '#7A7F7A';
  const statusHtml = (s) => s
    ? `<span class="bz-status"><i style="--c:${corDoStatus(s)}"></i>${esc(s)}</span>`
    : '';

  // --------------------------------------------------------------------------
  // Seções do índice
  // --------------------------------------------------------------------------
  const SECOES = [
    ['panorama', 'Panorama'], ['tempo', 'Tempo'], ['especies', 'Espécies'], ['cadeia', 'Cadeia'],
    ['ameacas', 'Ameaças'], ['pessoas', 'Pessoas'], ['curiosidades', 'Curiosidades'], ['biomas', 'Biomas']
  ];

  // --------------------------------------------------------------------------
  // HERO + FICHA
  // --------------------------------------------------------------------------
  const htmlHero = `
    <section class="bz-hero" aria-labelledby="bz-titulo">
      <div class="bz-hero-texto">
        <a href="../index.html#biomas" class="link-voltar">${ICONES.voltar} Voltar para Biomas</a>
        <div>
          <p class="bz-loc">${ICONES.pino}<span>${esc(bioma.localizacao)}</span></p>
          <h1 class="bz-nome" id="bz-titulo">${esc(bioma.nome)}</h1>
          <p class="bz-sub">${esc(bioma.subtitulo)}</p>
          <button type="button" class="bz-som" id="bz-som" aria-pressed="false" title="${esc(bioma.som.label)}: ${esc(bioma.som.descricao)}">
            <span class="bz-som-icone" id="bz-som-icone">${ICONES.tocar}</span>
            <span id="bz-som-txt">Ouvir o bioma</span>
            <span class="bz-som-onda" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          </button>
        </div>
      </div>
      <figure class="bz-hero-foto">
        <img src="${esc(bioma.heroImagem)}" width="1024" height="1280" alt="Paisagem do bioma ${esc(bioma.nome)}" fetchpriority="high">
      </figure>
    </section>

    <section class="bz-ficha" aria-label="O bioma em números">
      <ul>
        ${bioma.stats.map((s) => `
          <li>
            <span class="rotulo">${esc(s.label)}</span>
            <span class="valor">${esc(s.valor)}</span>
            <span class="detalhe">${esc(s.detalhe)}</span>
          </li>`).join('')}
      </ul>
    </section>`;

  // --------------------------------------------------------------------------
  // PANORAMA: descrição + mapa + ficha
  // --------------------------------------------------------------------------
  const regioesDestaque = (bioma.mapaDestaque || []).map((r) => NOMES_REGIAO[r] || r);
  const perfil = bioma.perfilVisual || {};
  const linhasPerfil = [
    ['Clima', perfil.clima], ['Vegetação', perfil.vegetacao], ['Fauna', perfil.fauna],
    ['Flora', perfil.flora], ['Água', perfil.agua], ['Presença humana', perfil.presencaHumana],
    ['Pressões ambientais', perfil.pressoesAmbientais]
  ].filter(([, v]) => v);

  const htmlPanorama = `
    <section class="bz-sec" id="panorama" aria-labelledby="t-panorama">
      <div class="bz-wrap">
        <h2 class="bz-sr" id="t-panorama">Panorama</h2>
        <p class="bz-lead">${esc(bioma.descricao)}</p>
        <div class="bz-pan-grid">
          <figure class="bz-mapa">
            <div class="bz-mapa-svg" id="bz-mapa" role="img" aria-label="Mapa do Brasil com ${esc(regioesDestaque.join(', '))} em destaque"></div>
            <figcaption>Em destaque: <strong>${esc(regioesDestaque.join(', '))}</strong></figcaption>
          </figure>
          <dl class="bz-dl">
            ${linhasPerfil.map(([r, v]) => `<div><dt>${esc(r)}</dt><dd>${esc(v)}</dd></div>`).join('')}
          </dl>
        </div>
      </div>
    </section>`;

  // --------------------------------------------------------------------------
  // TEMPO: linha do tempo + passado/presente/futuro
  // --------------------------------------------------------------------------
  const ppf = bioma.passadoPresenteFuturo || {};
  const ABAS_PPF = [['passado', 'Passado'], ['presente', 'Presente'], ['futuro', 'Futuro possível']];

  const htmlTempo = `
    <section class="bz-sec bz-sec--soft" id="tempo" aria-labelledby="t-tempo">
      <div class="bz-wrap">
        <div class="bz-tempo-grid">
          <div class="bz-tempo-cab">
            <h2 id="t-tempo">Como esse bioma surgiu</h2>
            <p class="bz-intro">Uma linha do tempo em grandes escalas, da formação do terreno até os desafios de hoje.</p>
          </div>
          <ol class="bz-tl" id="bz-tl">
            <span class="bz-tl-prog" id="bz-tl-prog" aria-hidden="true"></span>
            ${bioma.linhaDoTempo.map((i) => `
              <li>
                <span class="periodo">${esc(i.periodo)}</span>
                <h3>${esc(i.titulo)}</h3>
                <p>${esc(i.texto)}</p>
              </li>`).join('')}
          </ol>
        </div>

        <div class="bz-ppf">
          <div class="bz-ppf-topo">
            <h2>O bioma através do tempo</h2>
            <div class="bz-abas" role="tablist" aria-label="Período" id="bz-abas-ppf">
              ${ABAS_PPF.map(([k, nome]) => `<button type="button" role="tab" id="ppf-tab-${k}" aria-controls="bz-ppf-painel" aria-selected="${k === 'presente'}" tabindex="${k === 'presente' ? 0 : -1}" data-k="${k}">${nome}</button>`).join('')}
            </div>
          </div>
          <div class="bz-ppf-painel" id="bz-ppf-painel" role="tabpanel" aria-labelledby="ppf-tab-presente" tabindex="0">
            <p>${esc(ppf.presente)}</p>
          </div>
        </div>
      </div>
    </section>`;

  // --------------------------------------------------------------------------
  // ESPÉCIES: fauna e flora em abas
  // --------------------------------------------------------------------------
  function cartaoEspecie(item, tipo, idx) {
    const inicial = esc((item.nome || '?').trim().charAt(0).toUpperCase());
    return `
      <li>
        <button type="button" class="bz-esp" data-tipo="${tipo}" data-idx="${idx}" aria-haspopup="dialog">
          <span class="bz-esp-img" data-img-tipo="${tipo}" data-img-idx="${idx}">
            <span class="bz-esp-inicial" aria-hidden="true">${inicial}</span>
          </span>
          <span class="bz-esp-corpo">
            <h3>${esc(item.nome)}</h3>
            <span class="cientifico">${esc(item.cientifico)}</span>
            <span class="desc">${esc(item.desc || item.papel)}</span>
            ${tipo === 'fauna' && item.status ? statusHtml(item.status) : '<span class="saiba">Ver detalhes</span>'}
          </span>
        </button>
      </li>`;
  }

  const htmlEspecies = `
    <section class="bz-sec" id="especies" aria-labelledby="t-especies">
      <div class="bz-wrap">
        <div class="bz-esp-topo">
          <div>
            <h2 id="t-especies">Quem vive aqui</h2>
            <p class="bz-intro">Espécies que representam este bioma. Toque em uma para ver mais.</p>
          </div>
          <div class="bz-abas" role="tablist" aria-label="Tipo de espécie" id="bz-abas-esp">
            <button type="button" role="tab" id="esp-tab-fauna" aria-controls="esp-painel-fauna" aria-selected="true" data-k="fauna">Fauna (${bioma.fauna.length})</button>
            <button type="button" role="tab" id="esp-tab-flora" aria-controls="esp-painel-flora" aria-selected="false" tabindex="-1" data-k="flora">Flora (${bioma.flora.length})</button>
          </div>
        </div>
        <ul class="bz-esp-grid" id="esp-painel-fauna" role="tabpanel" aria-labelledby="esp-tab-fauna">
          ${bioma.fauna.map((f, i) => cartaoEspecie(f, 'fauna', i)).join('')}
        </ul>
        <ul class="bz-esp-grid" id="esp-painel-flora" role="tabpanel" aria-labelledby="esp-tab-flora" hidden>
          ${bioma.flora.map((f, i) => cartaoEspecie(f, 'flora', i)).join('')}
        </ul>
      </div>
    </section>`;

  // --------------------------------------------------------------------------
  // CADEIA ALIMENTAR
  // --------------------------------------------------------------------------
  const rede = bioma.redeDeVida;
  const CAMADAS = [
    ['produtores', 'Produtores'], ['herbivoros', 'Herbívoros'],
    ['predadores', 'Predadores'], ['decompositores', 'Decompositores']
  ];

  const htmlCadeia = `
    <section class="bz-sec bz-sec--soft" id="cadeia" aria-labelledby="t-cadeia">
      <div class="bz-wrap">
        <h2 id="t-cadeia">Uma rede de vida</h2>
        <p class="bz-intro">Toque em um organismo para ver quem se conecta a ele na cadeia alimentar.</p>
        <div class="bz-rede" id="bz-rede">
          ${CAMADAS.map(([k, nome]) => `
            <div class="bz-camada" data-camada="${k}">
              <h3>${nome}</h3>
              <div class="bz-camada-itens">
                ${(rede[k] || []).map((n) => `<button type="button" class="bz-rede-item" data-camada="${k}" aria-pressed="false">${esc(n)}</button>`).join('')}
              </div>
            </div>`).join('')}
        </div>
        <p class="bz-rede-texto" id="bz-rede-texto" aria-live="polite"></p>
      </div>
    </section>`;

  // --------------------------------------------------------------------------
  // AMEAÇAS (faixa escura)
  // --------------------------------------------------------------------------
  let frasePressao = '';
  if (perfil.pressoesAmbientais) {
    const partes = String(perfil.pressoesAmbientais).split(/\s+[—–-]\s+/);
    frasePressao = partes.length > 1
      ? `Pressão ambiental <strong>${esc(partes[0].toLowerCase())}</strong>: ${esc(partes.slice(1).join(' — '))}.`
      : esc(perfil.pressoesAmbientais);
  }

  const htmlAmeacas = `
    <section class="bz-sec bz-sec--deep" id="ameacas" aria-labelledby="t-ameacas">
      <div class="bz-wrap">
        <h2 id="t-ameacas">O que ameaça este bioma</h2>
        ${frasePressao ? `<p class="bz-pressao">${frasePressao}</p>` : ''}
        <ul class="bz-ameacas">
          ${bioma.ameacas.map((a) => `
            <li>
              <h3>${esc(a.titulo)}</h3>
              <p>${esc(a.texto)}</p>
            </li>`).join('')}
        </ul>
      </div>
    </section>`;

  // --------------------------------------------------------------------------
  // PESSOAS + PROTEÇÃO
  // --------------------------------------------------------------------------
  const humano = bioma.serHumano || { texto: '', pontos: [] };
  const htmlPessoas = `
    <section class="bz-sec" id="pessoas" aria-labelledby="t-pessoas">
      <div class="bz-wrap">
        <div class="bz-pessoas-grid">
          <div>
            <h2 id="t-pessoas">Quem vive e cuida</h2>
            <p class="bz-humano-texto">${esc(humano.texto)}</p>
            <ul class="bz-pontos">
              ${(humano.pontos || []).map((p) => `<li>${esc(p)}</li>`).join('')}
            </ul>
          </div>
          <div>
            <h2>Como proteger</h2>
            <ul class="bz-protecao">
              ${bioma.conservacao.map((c) => `
                <li>
                  ${ICONES.ok}
                  <div><h3>${esc(c.titulo)}</h3><p>${esc(c.texto)}</p></div>
                </li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    </section>`;

  // --------------------------------------------------------------------------
  // VOCÊ SABIA?
  // --------------------------------------------------------------------------
  const fatos = bioma.curiosidades || [];
  const htmlFatos = fatos.length ? `
    <section class="bz-sec bz-sec--soft" id="curiosidades" aria-labelledby="t-fatos">
      <div class="bz-wrap">
        <h2 id="t-fatos">Você sabia?</h2>
        <div class="bz-fato">
          <p class="bz-fato-texto" id="bz-fato-texto" aria-live="polite">${esc(fatos[0])}</p>
          <div class="bz-fato-rodape">
            <span class="bz-fato-contador" id="bz-fato-contador">1 de ${fatos.length}</span>
            <div class="bz-fato-botoes">
              <button type="button" id="bz-fato-ant" aria-label="Curiosidade anterior">${ICONES.esquerda}</button>
              <button type="button" id="bz-fato-prox" aria-label="Próxima curiosidade">${ICONES.direita}</button>
            </div>
          </div>
        </div>
      </div>
    </section>` : '';

  // --------------------------------------------------------------------------
  // OUTROS BIOMAS (os seis, com o atual marcado)
  // --------------------------------------------------------------------------
  const htmlBiomas = `
    <section class="bz-sec" id="biomas" aria-labelledby="t-biomas">
      <div class="bz-wrap">
        <h2 id="t-biomas">Os seis biomas brasileiros</h2>
        <div class="bz-bio-grid">
          ${Object.values(window.BIOMAS).map((b) => {
            const atual = b.slug === slug;
            const miolo = `
              <img src="${esc(b.heroImagem)}" alt="" loading="lazy" width="1024" height="1280">
              ${atual ? '<span class="bz-bio-aqui">Você está aqui</span>' : ''}
              <span class="bz-bio-nome">${esc(b.nome)}</span>`;
            return atual
              ? `<div class="bz-bio" aria-current="page">${miolo}</div>`
              : `<a class="bz-bio" href="${esc(b.slug)}.html" aria-label="Ver o bioma ${esc(b.nome)}">${miolo}</a>`;
          }).join('')}
        </div>
      </div>
    </section>`;

  // --------------------------------------------------------------------------
  // Monta tudo
  // --------------------------------------------------------------------------
  const secoesCorpo = [htmlPanorama, htmlTempo, htmlEspecies, htmlCadeia, htmlAmeacas, htmlPessoas, htmlFatos, htmlBiomas].join('');
  const idsPresentes = new Set((secoesCorpo.match(/id="([a-z]+)" aria-labelledby/g) || []).map((s) => s.slice(4, s.indexOf('"', 4))));

  root.innerHTML = `
    ${htmlHero}
    <div class="bz-corpo">
      <nav class="bz-indice" aria-label="Seções desta página">
        <ul>
          ${SECOES.filter(([id]) => idsPresentes.has(id)).map(([id, nome]) => `<li><a href="#${id}">${nome}</a></li>`).join('')}
        </ul>
      </nav>
      ${secoesCorpo}
    </div>`;

  // ==========================================================================
  // INTERAÇÕES
  // ==========================================================================

  // ---- Mapa (SVG já embutido em js/mapa-brasil-svg.js) ----------------------
  (function desenharMapa() {
    const alvo = document.getElementById('bz-mapa');
    if (!alvo) return;
    if (!window.MAPA_BRASIL_SVG) { alvo.textContent = 'Mapa indisponível no momento.'; return; }
    alvo.innerHTML = window.MAPA_BRASIL_SVG;
    const destaque = bioma.mapaDestaque || [];
    alvo.querySelectorAll('.regiao-mapa').forEach((g) => {
      if (destaque.includes(g.getAttribute('data-regiao'))) g.classList.add('destaque');
    });
  })();

  // ---- Abas genéricas (setas, Home e End funcionam) -------------------------
  function ativarAbas(lista, aoMudar) {
    if (!lista) return;
    const abas = Array.from(lista.querySelectorAll('[role="tab"]'));
    function selecionar(aba, focar) {
      abas.forEach((a) => {
        const ativa = a === aba;
        a.setAttribute('aria-selected', String(ativa));
        a.tabIndex = ativa ? 0 : -1;
      });
      if (focar) aba.focus();
      aoMudar(aba.dataset.k, aba);
    }
    abas.forEach((aba, i) => {
      aba.addEventListener('click', () => selecionar(aba, false));
      aba.addEventListener('keydown', (e) => {
        let alvo = null;
        if (e.key === 'ArrowRight') alvo = abas[(i + 1) % abas.length];
        else if (e.key === 'ArrowLeft') alvo = abas[(i - 1 + abas.length) % abas.length];
        else if (e.key === 'Home') alvo = abas[0];
        else if (e.key === 'End') alvo = abas[abas.length - 1];
        if (alvo) { e.preventDefault(); selecionar(alvo, true); }
      });
    });
  }

  // ---- Passado / Presente / Futuro ------------------------------------------
  const painelPpf = document.getElementById('bz-ppf-painel');
  ativarAbas(document.getElementById('bz-abas-ppf'), (k) => {
    painelPpf.setAttribute('aria-labelledby', `ppf-tab-${k}`);
    painelPpf.querySelector('p').textContent = ppf[k] || '';
    painelPpf.classList.remove('troca');
    void painelPpf.offsetWidth; // reinicia a animação
    painelPpf.classList.add('troca');
  });

  // ---- Linha do tempo: a linha acompanha o scroll ---------------------------
  const tl = document.getElementById('bz-tl');
  const tlProg = document.getElementById('bz-tl-prog');
  const tlItens = tl ? Array.from(tl.querySelectorAll('li')) : [];
  let tlAgendado = false;
  function atualizarTimeline() {
    tlAgendado = false;
    if (!tl) return;
    const r = tl.getBoundingClientRect();
    const p = limitar((window.innerHeight * 0.62 - r.top) / r.height, 0, 1);
    tlProg.style.height = `calc(${(p * 100).toFixed(1)}% - 20px)`;
    tlItens.forEach((li, i) => li.classList.toggle('em-vista', p >= i / tlItens.length));
  }
  window.addEventListener('scroll', () => {
    if (!tlAgendado) { tlAgendado = true; requestAnimationFrame(atualizarTimeline); }
  }, { passive: true });
  atualizarTimeline();

  // ---- Fotos das espécies (Wikipédia) ---------------------------------------
  // Busca pelo NOME CIENTÍFICO (único no mundo) e descarta mapas/bandeiras,
  // que a Wikipédia às vezes escolhe como imagem da página.
  const cacheImg = new Map();

  function naoEFoto(nomeArquivo, urlMiniatura) {
    if (/\.svg(\?|$)/i.test(urlMiniatura || '')) return true;
    return /(mapa|map|distribui|distribution|localiza|range|bandeira|flag|brasao|coat_of_arms)/i
      .test(`${nomeArquivo || ''} ${urlMiniatura || ''}`);
  }
  async function miniaturaDaConsulta(url) {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const dados = await resp.json();
    const paginas = dados.query && dados.query.pages ? Object.values(dados.query.pages) : [];
    const pagina = paginas.find((p) => p.thumbnail);
    if (!pagina || naoEFoto(pagina.pageimage, pagina.thumbnail.source)) return null;
    return pagina.thumbnail.source;
  }
  const porTitulo = (titulo) => miniaturaDaConsulta(
    `https://pt.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titulo)}&prop=pageimages&piprop=thumbnail%7Cname&pithumbsize=700&redirects=1&format=json&origin=*`);
  const porTermo = (termo) => miniaturaDaConsulta(
    `https://pt.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(termo)}&gsrnamespace=0&gsrlimit=1&prop=pageimages&piprop=thumbnail%7Cname&pithumbsize=700&format=json&origin=*`);

  function buscarImagem(item, tipo) {
    const chave = `${tipo}:${item.nome}`;
    if (cacheImg.has(chave)) return cacheImg.get(chave);
    const promessa = (async () => {
      if (item.imagemUrl) return item.imagemUrl; // foto verificada à mão, no próprio dado
      const cientifico = (item.cientifico || '').replace(/\s*\(.*?\)\s*/g, '').trim();
      try {
        let img = null;
        if (cientifico) img = await porTitulo(cientifico);
        if (!img && cientifico) img = await porTermo(cientifico);
        if (!img) img = await porTermo(`${item.nome} ${tipo === 'flora' ? 'planta' : 'animal'}`);
        return img;
      } catch (e) { return null; }
    })();
    cacheImg.set(chave, promessa);
    return promessa;
  }

  const imagensCarregadas = new Set();
  function carregarFotos(tipo) {
    if (imagensCarregadas.has(tipo)) return;
    imagensCarregadas.add(tipo);
    root.querySelectorAll(`[data-img-tipo="${tipo}"]`).forEach(async (caixa) => {
      const item = bioma[tipo][Number(caixa.dataset.imgIdx)];
      const url = await buscarImagem(item, tipo);
      if (!url) return;
      const img = new Image();
      img.alt = `Foto de ${item.nome}`;
      img.decoding = 'async';
      img.onload = () => { caixa.appendChild(img); const ini = caixa.querySelector('.bz-esp-inicial'); if (ini) ini.remove(); };
      img.src = url;
    });
  }
  carregarFotos('fauna');

  // ---- Abas Fauna / Flora ---------------------------------------------------
  ativarAbas(document.getElementById('bz-abas-esp'), (k) => {
    document.getElementById('esp-painel-fauna').hidden = k !== 'fauna';
    document.getElementById('esp-painel-flora').hidden = k !== 'flora';
    carregarFotos(k);
  });
  // Prepara a flora em segundo plano, sem atrapalhar a abertura da página
  window.addEventListener('load', () => setTimeout(() => carregarFotos('flora'), 1200));

  // ---- Janela de detalhe (<dialog>) -----------------------------------------
  const modal = document.createElement('dialog');
  modal.className = 'bz-modal';
  modal.setAttribute('aria-labelledby', 'bz-modal-titulo');
  modal.innerHTML = `
    <button type="button" class="bz-modal-fechar" aria-label="Fechar">${ICONES.fechar}</button>
    <div class="bz-modal-grid">
      <div class="bz-modal-img" id="bz-modal-img"></div>
      <div class="bz-modal-corpo" id="bz-modal-corpo"></div>
    </div>`;
  document.body.appendChild(modal);

  let gatilhoModal = null;
  function fecharModal() { if (modal.open) modal.close(); }
  modal.addEventListener('close', () => {
    document.documentElement.classList.remove('bz-travado');
    if (gatilhoModal) gatilhoModal.focus();
  });
  modal.querySelector('.bz-modal-fechar').addEventListener('click', fecharModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(); });

  async function abrirModal(tipo, idx, gatilho) {
    const item = bioma[tipo][idx];
    gatilhoModal = gatilho;
    const campos = tipo === 'fauna'
      ? [['Onde vive', item.habitat], ['Alimentação', item.dieta], ['Papel ecológico', item.papel], ['Você sabia?', item.curiosidade]]
      : [['Papel ecológico', item.papel], ['Você sabia?', item.curiosidade]];

    document.getElementById('bz-modal-corpo').innerHTML = `
      <h3 id="bz-modal-titulo">${esc(item.nome)}</h3>
      <span class="cientifico">${esc(item.cientifico)}</span>
      ${tipo === 'fauna' ? statusHtml(item.status) : ''}
      <dl class="bz-modal-campos">
        ${campos.filter(([, v]) => v).map(([r, v]) => `<div><dt>${esc(r)}</dt><dd>${esc(v)}</dd></div>`).join('')}
      </dl>`;

    const caixaImg = document.getElementById('bz-modal-img');
    caixaImg.innerHTML = '';
    caixaImg.hidden = false;

    document.documentElement.classList.add('bz-travado');
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');

    const url = await buscarImagem(item, tipo);
    if (url && modal.open) {
      const img = new Image();
      img.alt = `Foto de ${item.nome}`;
      img.onload = () => caixaImg.appendChild(img);
      img.src = url;
    }
  }

  root.querySelectorAll('.bz-esp').forEach((btn) => {
    btn.addEventListener('click', () => abrirModal(btn.dataset.tipo, Number(btn.dataset.idx), btn));
  });

  // ---- Cadeia alimentar -----------------------------------------------------
  // Os dados não dizem "quem come quem" espécie por espécie, então a conexão
  // é por camada (produtores → herbívoros → predadores → decompositores),
  // que é o nível de precisão que o conteúdo realmente sustenta.
  const CONEXOES = {
    produtores: ['herbivoros'],
    herbivoros: ['produtores', 'predadores'],
    predadores: ['herbivoros', 'decompositores'],
    decompositores: ['produtores', 'herbivoros', 'predadores']
  };
  const EXPLICACAO = {
    produtores: 'produz a própria energia a partir da luz do sol e alimenta os herbívoros do bioma.',
    herbivoros: 'se alimenta de plantas e, por sua vez, serve de alimento para os predadores.',
    predadores: 'caça herbívoros para se alimentar; quando morre, é reciclado pelos decompositores.',
    decompositores: 'decompõe a matéria orgânica de todos os outros níveis e devolve nutrientes ao solo.'
  };
  const redeEl = document.getElementById('bz-rede');
  const redeTexto = document.getElementById('bz-rede-texto');
  if (redeEl) {
    redeEl.querySelectorAll('.bz-rede-item').forEach((item) => {
      item.addEventListener('click', () => {
        const jaAtivo = item.getAttribute('aria-pressed') === 'true';
        redeEl.querySelectorAll('.bz-rede-item').forEach((i) => { i.setAttribute('aria-pressed', 'false'); i.classList.remove('conectado'); });
        redeEl.querySelectorAll('.bz-camada').forEach((c) => c.classList.remove('em-foco'));
        redeEl.classList.remove('selecionado');
        if (jaAtivo) { redeTexto.textContent = ''; return; }

        const camada = item.dataset.camada;
        const alvos = CONEXOES[camada] || [];
        item.setAttribute('aria-pressed', 'true');
        redeEl.classList.add('selecionado');
        redeEl.querySelector(`.bz-camada[data-camada="${camada}"]`).classList.add('em-foco');
        alvos.forEach((c) => {
          const bloco = redeEl.querySelector(`.bz-camada[data-camada="${c}"]`);
          if (bloco) { bloco.classList.add('em-foco'); bloco.querySelectorAll('.bz-rede-item').forEach((i) => i.classList.add('conectado')); }
        });
        redeTexto.innerHTML = `<strong>${esc(item.textContent)}</strong> ${esc(EXPLICACAO[camada] || '')}`;
      });
    });
  }

  // ---- Você sabia? ----------------------------------------------------------
  if (fatos.length) {
    let atual = 0;
    const textoEl = document.getElementById('bz-fato-texto');
    const contEl = document.getElementById('bz-fato-contador');
    function mostrarFato(i) {
      atual = (i + fatos.length) % fatos.length;
      textoEl.textContent = fatos[atual];
      contEl.textContent = `${atual + 1} de ${fatos.length}`;
      textoEl.classList.remove('troca');
      void textoEl.offsetWidth;
      textoEl.classList.add('troca');
    }
    document.getElementById('bz-fato-ant').addEventListener('click', () => mostrarFato(atual - 1));
    document.getElementById('bz-fato-prox').addEventListener('click', () => mostrarFato(atual + 1));
  }

  // ---- Som ambiente (nunca toca sozinho) ------------------------------------
  const somBtn = document.getElementById('bz-som');
  const somIcone = document.getElementById('bz-som-icone');
  const somTxt = document.getElementById('bz-som-txt');
  if (somBtn) {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.loop = true;
    audio.volume = 0.5;
    // Se o arquivo de áudio deste bioma não existir, o botão some (em vez de
    // ficar um controle que não faz nada).
    audio.addEventListener('error', () => { somBtn.hidden = true; });
    audio.src = `${bioma.slug}.mp3`;

    function marcarSom(tocando) {
      somBtn.setAttribute('aria-pressed', String(tocando));
      somIcone.innerHTML = tocando ? ICONES.pausar : ICONES.tocar;
      somTxt.textContent = tocando ? 'Pausar o som' : 'Ouvir o bioma';
    }
    somBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().then(() => marcarSom(true)).catch(() => marcarSom(false));
      } else {
        audio.pause();
        marcarSom(false);
      }
    });
  }

  // ---- Índice: marca a seção que está na tela -------------------------------
  const nav = root.querySelector('.bz-indice');
  const linksIndice = Array.from(nav.querySelectorAll('a'));
  function marcarIndice(id) {
    linksIndice.forEach((a) => {
      const ativo = a.getAttribute('href') === `#${id}`;
      if (ativo) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      if (ativo) {
        const lista = a.closest('ul');
        if (lista.scrollWidth > lista.clientWidth) {
          lista.scrollTo({ left: a.offsetLeft - lista.clientWidth / 2 + a.offsetWidth / 2 });
        }
      }
    });
  }
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => { if (e.isIntersecting) marcarIndice(e.target.id); });
  }, { rootMargin: '-30% 0px -62% 0px' });
  linksIndice.forEach((a) => {
    const sec = document.getElementById(a.getAttribute('href').slice(1));
    if (sec) observador.observe(sec);
  });
})();
