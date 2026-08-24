// ==========================================================================
// GiraBrasil — Motor da página de biomas
// Lê qual bioma renderizar a partir de document.body.dataset.bioma e monta
// a página inteira com base no objeto BIOMAS (js/biomas-data.js).
// Isso evita duplicar HTML/CSS/JS seis vezes: cada arquivo public/biomas/*.html
// é só uma casca fina que aponta para um bioma; todo o conteúdo real vive aqui.
// ==========================================================================
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
(function () {
  const slug = document.body.dataset.bioma;
  const bioma = window.BIOMAS && window.BIOMAS[slug];
  const root = document.getElementById('bioma-root');
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  if (!bioma || !root) {
    root.innerHTML = '<div style="padding:120px 32px;text-align:center;color:var(--cor-texto-suave)">Bioma não encontrado.</div>';
    return;
  }
<<<<<<< HEAD

  document.title = `${bioma.nome} — Gira-Brasil`;
  document.documentElement.style.setProperty('--cor-bioma', bioma.corDestaque);

=======
 
  document.title = `${bioma.nome} — GiraBrasil`;
  document.documentElement.style.setProperty('--cor-bioma', bioma.corDestaque);
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- Helpers --------------------
  function el(tag, attrs = {}, html = '') {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else node.setAttribute(k, v);
    });
    if (html) node.innerHTML = html;
    return node;
  }
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- HERO --------------------
  const hero = el('section', { class: 'bioma-hero' }, `
    <div class="bioma-hero-imagem"><img src="${bioma.heroImagem}" alt="Paisagem do bioma ${bioma.nome}"></div>
    <div class="bioma-hero-conteudo">
      <div class="eyebrow claro">${bioma.categoria}</div>
      <h1>${bioma.nome}</h1>
      <p class="bioma-subtitulo">“${bioma.subtitulo}”</p>
      <div class="bioma-localizacao">📍 ${bioma.localizacao}</div>
    </div>
    <div class="bioma-scroll-indicador"><span>Explorar</span><span class="linha"></span></div>
  `);
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- DADOS RÁPIDOS --------------------
  const statsCards = bioma.stats.map(s => `
    <div class="bioma-stat-card">
      <div class="rotulo">${s.label}</div>
      <span class="valor">${s.valor}</span>
      <div class="detalhe">${s.detalhe}</div>
    </div>
  `).join('');
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  const secaoStats = el('section', { class: 'bioma-secao' }, `
    <p style="color:var(--cor-texto-suave); max-width:60ch; margin-bottom:32px;">${bioma.descricao}</p>
    <div class="bioma-stats-grid">${statsCards}</div>
  `);
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- MAPA --------------------
  const secaoMapa = el('section', { class: 'bioma-secao' }, `
    <div class="bioma-secao-cabecalho" style="margin-left:auto;margin-right:auto;text-align:center;">
      <div class="eyebrow">GEOGRAFIA</div>
      <h2>Onde esse bioma está</h2>
      <p style="margin-left:auto;margin-right:auto;">${bioma.localizacao} concentra a maior parte da área deste bioma no Brasil.</p>
    </div>
    <div class="bioma-mapa-wrap" id="bioma-mapa-wrap"></div>
    <div class="bioma-mapa-legenda"><span class="ponto"></span> Área de maior concentração do bioma</div>
  `);
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- LINHA DO TEMPO --------------------
  const timelineItens = bioma.linhaDoTempo.map(t => `
    <div class="timeline-item">
      <div class="periodo">${t.periodo}</div>
      <h3>${t.titulo}</h3>
      <p>${t.texto}</p>
    </div>
  `).join('');
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  const secaoTimeline = el('section', { class: 'bioma-secao fundo-alt' }, `
    <div class="bioma-secao-inner">
      <div class="bioma-secao-cabecalho">
        <div class="eyebrow">HISTÓRIA NATURAL</div>
        <h2>Como esse bioma surgiu?</h2>
        <p>Uma linha do tempo, em grandes escalas de tempo, sobre a formação deste ecossistema.</p>
      </div>
      <div class="timeline-wrap">
        <div class="timeline-progresso" id="timeline-progresso"></div>
        ${timelineItens}
      </div>
    </div>
  `);
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- PASSADO / PRESENTE / FUTURO --------------------
  const ppf = bioma.passadoPresenteFuturo;
  const secaoPPF = el('section', { class: 'bioma-secao' }, `
    <div class="bioma-secao-cabecalho">
      <div class="eyebrow">LINHA DO TEMPO</div>
      <h2>O bioma através do tempo</h2>
    </div>
    <div class="ppf-grid">
      <div class="ppf-card passado"><span class="rotulo">Passado</span><p>${ppf.passado}</p></div>
      <div class="ppf-card presente"><span class="rotulo">Presente</span><p>${ppf.presente}</p></div>
      <div class="ppf-card futuro"><span class="rotulo">Futuro possível</span><p>${ppf.futuro}</p></div>
    </div>
  `);
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- FAUNA --------------------
  // Estrutura de card compartilhada entre fauna e flora: ambas ganham uma
  // área de foto grande (proporção 4:3) que é preenchida dinamicamente por
  // uma foto real da espécie (ver carregarImagensEspecies mais abaixo).
  // Enquanto a foto carrega — ou se a busca falhar — o emoji de fallback
  // continua visível, sem quebrar o layout do card.
  function especieCard(item, tipo, idx) {
    const emojiFallback = tipo === 'fauna' ? '🐾' : '🌿';
    const tagImagem = tipo === 'fauna'
      ? (item.status || '')
      : 'Nativa do bioma';
<<<<<<< HEAD

    return `
      <button class="especie-card" data-tipo="${tipo}" data-idx="${idx}">
        <div class="especie-imagem-wrap" data-especie-imagem="${item.nome.replace(/"/g, '&quot;')}" data-especie-tipo="${tipo}">
=======
 
    return `
      <button class="especie-card" data-tipo="${tipo}" data-idx="${idx}">
        <div class="especie-imagem-wrap" data-especie-imagem="${item.nome.replace(/"/g, '&quot;')}" data-especie-cientifico="${item.cientifico.replace(/"/g, '&quot;')}" data-especie-tipo="${tipo}">
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
          <span class="especie-emoji">${emojiFallback}</span>
          ${tagImagem ? `<span class="especie-imagem-tag">${tagImagem}</span>` : ''}
        </div>
        <div class="especie-corpo">
          <h3>${item.nome}</h3>
          <span class="cientifico">${item.cientifico}</span>
          <p class="desc">${item.desc || item.papel}</p>
        </div>
      </button>
    `;
  }
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  const secaoFauna = el('section', { class: 'bioma-secao fundo-alt' }, `
    <div class="bioma-secao-inner">
      <div class="bioma-secao-cabecalho">
        <div class="eyebrow">BIODIVERSIDADE</div>
        <h2>Quem vive aqui?</h2>
        <p>Algumas espécies representativas da fauna deste bioma. Clique em um card para saber mais.</p>
      </div>
      <div class="bioma-cards-grid">${bioma.fauna.map((f, i) => especieCard(f, 'fauna', i)).join('')}</div>
    </div>
  `);
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- FLORA --------------------
  const secaoFlora = el('section', { class: 'bioma-secao' }, `
    <div class="bioma-secao-cabecalho">
      <div class="eyebrow">BIODIVERSIDADE</div>
      <h2>Plantas e árvores</h2>
      <p>Espécies vegetais que caracterizam a paisagem deste bioma. Clique em um card para saber mais.</p>
    </div>
    <div class="bioma-cards-grid">${bioma.flora.map((f, i) => especieCard(f, 'flora', i)).join('')}</div>
  `);
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- REDE DE VIDA --------------------
  const rede = bioma.redeDeVida;
  function redeItens(lista, camada) {
    return lista.map(nome => `<button class="rede-vida-item" data-camada="${camada}">${nome}</button>`).join('');
  }
<<<<<<< HEAD
  const secaoRede = el('section', { class: 'bioma-secao fundo-alt' }, `
=======
 const secaoRede = el('section', { class: 'bioma-secao fundo-alt' }, `
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
    <div class="bioma-secao-inner">
      <div class="bioma-secao-cabecalho">
        <div class="eyebrow">ECOSSISTEMA</div>
        <h2>Uma rede de vida</h2>
        <p>Clique em um organismo para ver como ele se conecta aos demais na cadeia alimentar.</p>
      </div>
      <div class="rede-vida-wrap" id="rede-vida-wrap">
        <div class="rede-vida-camada"><div class="rotulo-camada">Produtores</div><div class="rede-vida-itens">${redeItens(rede.produtores, 'produtores')}</div></div>
        <div class="rede-vida-seta">↓</div>
        <div class="rede-vida-camada"><div class="rotulo-camada">Herbívoros</div><div class="rede-vida-itens">${redeItens(rede.herbivoros, 'herbivoros')}</div></div>
        <div class="rede-vida-seta">↓</div>
        <div class="rede-vida-camada"><div class="rotulo-camada">Predadores</div><div class="rede-vida-itens">${redeItens(rede.predadores, 'predadores')}</div></div>
        <div class="rede-vida-seta">↓</div>
        <div class="rede-vida-camada"><div class="rotulo-camada">Decompositores</div><div class="rede-vida-itens">${redeItens(rede.decompositores, 'decompositores')}</div></div>
      </div>
    </div>
  `);
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- AMEAÇAS --------------------
  const secaoAmeacas = el('section', { class: 'bioma-secao' }, `
    <div class="bioma-secao-cabecalho">
      <div class="eyebrow">CONSERVAÇÃO</div>
      <h2>O que ameaça este bioma?</h2>
    </div>
    <div class="ameacas-grid">
      ${bioma.ameacas.map(a => `
        <div class="ameaca-card">
          <div class="icone">${a.icone}</div>
          <div><h3>${a.titulo}</h3><p>${a.texto}</p></div>
        </div>
      `).join('')}
    </div>
  `);
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- SER HUMANO --------------------
  const secaoHumano = el('section', { class: 'bioma-secao fundo-alt' }, `
    <div class="bioma-secao-inner">
      <div class="bioma-secao-cabecalho">
        <div class="eyebrow">CULTURA E TERRITÓRIO</div>
        <h2>Ser humano e bioma</h2>
      </div>
      <div class="humano-grid">
        <div class="humano-texto"><p>${bioma.serHumano.texto}</p></div>
        <ul class="humano-pontos">${bioma.serHumano.pontos.map(p => `<li>${p}</li>`).join('')}</ul>
      </div>
    </div>
  `);
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- CONSERVAÇÃO --------------------
  const secaoConservacao = el('section', { class: 'bioma-secao' }, `
    <div class="bioma-secao-cabecalho">
      <div class="eyebrow">AÇÃO POSITIVA</div>
      <h2>Como podemos proteger?</h2>
    </div>
    <div class="conservacao-grid">
      ${bioma.conservacao.map(c => `
        <div class="conservacao-card">
          <span class="icone">${c.icone}</span>
          <h3>${c.titulo}</h3>
          <p>${c.texto}</p>
        </div>
      `).join('')}
    </div>
  `);
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- VOCÊ SABIA? --------------------
  const secaoFatos = el('section', { class: 'bioma-secao fundo-alt' }, `
    <div class="bioma-secao-inner">
      <div class="bioma-secao-cabecalho">
        <div class="eyebrow">CURIOSIDADES</div>
        <h2>Você sabia?</h2>
        <p>Clique em cada card para revelar o fato.</p>
      </div>
      <div class="fatos-grid">
        ${bioma.curiosidades.map(f => `
          <button class="fato-card">
            <span class="fato-pergunta">Você sabia?</span>
            <span class="fato-resposta">${f}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `);
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- SOM --------------------
  const secaoSom = el('section', { class: 'bioma-secao' }, `
    <div class="bioma-secao-cabecalho">
      <div class="eyebrow">EXPERIÊNCIA SENSORIAL</div>
      <h2>Ouça este bioma</h2>
    </div>
    <div class="som-card" id="som-card">
      <button class="som-botao" id="som-botao" aria-pressed="false" aria-label="Ativar som ambiente">▶</button>
      <div class="som-onda"><span></span><span></span><span></span><span></span><span></span></div>
      <div class="som-texto">
        <div class="titulo">${bioma.som.label}</div>
        <div class="descricao">Ambiente com ${bioma.som.descricao}. O som nunca é ativado automaticamente.</div>
      </div>
    </div>
  `);
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- PERFIL VISUAL --------------------
  const perfil = bioma.perfilVisual;
  const perfilLinhas = [
    ['Clima', perfil.clima], ['Vegetação', perfil.vegetacao], ['Fauna', perfil.fauna],
    ['Flora', perfil.flora], ['Água', perfil.agua], ['Presença humana', perfil.presencaHumana],
    ['Pressões ambientais', perfil.pressoesAmbientais]
  ].map(([r, v]) => `<div class="perfil-linha"><span class="rotulo">${r}</span><span class="valor">${v}</span></div>`).join('');
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  const secaoPerfil = el('section', { class: 'bioma-secao fundo-alt' }, `
    <div class="bioma-secao-inner">
      <div class="bioma-secao-cabecalho">
        <div class="eyebrow">RESUMO</div>
        <h2>Perfil visual do bioma</h2>
      </div>
      <div class="perfil-grid">${perfilLinhas}</div>
    </div>
  `);
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- EXPLORAÇÃO --------------------
  const secaoExploracao = el('section', { class: 'bioma-secao' }, `
    <div class="exploracao-card">
      <h2>Você está explorando este bioma.</h2>
      <div class="exploracao-barra"><div class="exploracao-barra-fill" id="exploracao-fill"></div></div>
      <div class="exploracao-legenda" id="exploracao-legenda">0% do conteúdo visto</div>
    </div>
  `);
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- RELACIONADOS --------------------
  const secaoRelacionados = el('section', { class: 'bioma-secao' }, `
    <div class="bioma-secao-cabecalho">
      <div class="eyebrow">CONTINUE EXPLORANDO</div>
      <h2>Outros biomas brasileiros</h2>
    </div>
    <div class="relacionados-grid">
      ${bioma.relacionados.map(slugRel => {
        const rel = window.BIOMAS[slugRel];
        if (!rel) return '';
        return `
          <a href="${rel.slug}.html" class="card-bioma-completo">
            <div class="fundo-imagem"><img src="${rel.heroImagem}" alt="Paisagem do bioma ${rel.nome}"></div>
            <div class="card-bioma-completo-conteudo">
              <h3>${rel.nome}</h3>
              <div class="tagline">${rel.subtitulo}</div>
            </div>
          </a>
        `;
      }).join('')}
    </div>
  `);
<<<<<<< HEAD

  // -------------------- VOLTAR --------------------
  const voltarTopo = document.getElementById('voltar-biomas-topo');
  if (voltarTopo) voltarTopo.href = '../index.html#biomas';

=======
 
  // -------------------- VOLTAR --------------------
  const voltarTopo = document.getElementById('voltar-biomas-topo');
  if (voltarTopo) voltarTopo.href = '../index.html#biomas';
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // -------------------- Monta tudo --------------------
  root.append(
    hero, secaoStats, secaoMapa, secaoTimeline, secaoPPF,
    secaoFauna, secaoFlora, secaoRede, secaoAmeacas, secaoHumano,
    secaoConservacao, secaoFatos, secaoSom, secaoPerfil,
    secaoExploracao, secaoRelacionados
  );
<<<<<<< HEAD

  // ======================================================================
  // Interações
  // ======================================================================

=======
 
  // ======================================================================
  // Interações
  // ======================================================================
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // Barra de progresso de leitura
  const progressoFill = document.getElementById('progresso-fill') || (() => {
    const track = el('div', { class: 'progresso-track' }, '<div class="progresso-fill" id="progresso-fill"></div>');
    document.body.prepend(track);
    return document.getElementById('progresso-fill');
  })();
  function atualizarProgresso() {
    const alturaTotal = document.documentElement.scrollHeight - window.innerHeight;
    const pct = alturaTotal > 0 ? (window.scrollY / alturaTotal) * 100 : 0;
    progressoFill.style.width = pct + '%';
  }
  document.addEventListener('scroll', atualizarProgresso, { passive: true });
  atualizarProgresso();
<<<<<<< HEAD

  // Mapa: desenha o SVG simplificado das 5 regiões e destaca a(s) do bioma.
  // O SVG vem embutido em js/mapa-brasil-svg.js (window.MAPA_BRASIL_SVG) em vez
  // de ser buscado com fetch(): assim o mapa funciona tanto rodando pelo
  // servidor Express quanto ao abrir o arquivo .html diretamente no navegador
  // (fetch() de arquivo local é bloqueado por CORS em file://, o que fazia o
  // mapa cair sempre no aviso de "indisponível").
  (function desenharMapaBioma() {
    const wrap = document.getElementById('bioma-mapa-wrap');
    if (!wrap) return;
    if (!window.MAPA_BRASIL_SVG) {
      wrap.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--cor-texto-suave);font-size:0.85rem;text-align:center;padding:20px;">Mapa indisponível no momento</div>';
      return;
    }
    wrap.innerHTML = window.MAPA_BRASIL_SVG;
    const destaque = bioma.mapaDestaque || [];
    wrap.querySelectorAll('.regiao-mapa').forEach(g => {
      if (destaque.includes(g.getAttribute('data-regiao'))) g.classList.add('destaque');
    });
  })();

=======
 
  // Mapa: desenha o SVG simplificado das 5 regiões e destaca a(s) do bioma
  fetch('../assets/biomas/mapa-regioes-simplificado.svg')
    .then(r => r.ok ? r.text() : Promise.reject())
    .then(svgText => {
      const wrap = document.getElementById('bioma-mapa-wrap');
      wrap.innerHTML = svgText;
      const destaque = bioma.mapaDestaque || [];
      wrap.querySelectorAll('.regiao-mapa').forEach(g => {
        if (destaque.includes(g.getAttribute('data-regiao'))) g.classList.add('destaque');
      });
    })
    .catch(() => {
      const wrap = document.getElementById('bioma-mapa-wrap');
      if (wrap) wrap.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--cor-texto-suave);font-size:0.85rem;text-align:center;padding:20px;">Mapa indisponível no momento</div>';
    });
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // Contadores de estatística ao entrar na viewport
  const statCards = root.querySelectorAll('.bioma-stat-card');
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('em-vista'); });
  }, { threshold: 0.4 });
  statCards.forEach(c => statObserver.observe(c));
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // Linha do tempo: progresso e destaque conforme o scroll
  const timelineItems = root.querySelectorAll('.timeline-item');
  const timelineProgresso = document.getElementById('timeline-progresso');
  const timelineWrap = root.querySelector('.timeline-wrap');
  function atualizarTimeline() {
    if (!timelineWrap) return;
    const rect = timelineWrap.getBoundingClientRect();
    const alturaVisivel = window.innerHeight * 0.7;
    const progresso = Math.min(Math.max((alturaVisivel - rect.top) / rect.height, 0), 1);
    timelineProgresso.style.height = (progresso * 100) + '%';
    timelineItems.forEach((item, i) => {
      const limiar = i / timelineItems.length;
      item.classList.toggle('em-vista', progresso >= limiar);
    });
  }
  document.addEventListener('scroll', atualizarTimeline, { passive: true });
  atualizarTimeline();
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // Carrega automaticamente uma foto real da espécie (fauna ou flora) pela
  // Wikipédia/Wikimedia. Não exige alterar o banco ou adicionar uma imagem
  // manualmente para cada espécie. Se a busca falhar, o emoji original
  // continua aparecendo como fallback — o layout do card nunca quebra.
<<<<<<< HEAD
  const cacheImagensEspecie = new Map();

  async function buscarImagemEspecie(nome, tipo) {
    const chave = `${tipo}:${nome}`;
    if (cacheImagensEspecie.has(chave)) return cacheImagensEspecie.get(chave);

    const sufixoBusca = tipo === 'flora' ? 'planta' : 'animal';
    try {
      const url = `https://pt.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(nome + ' ' + sufixoBusca)}&gsrnamespace=0&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=700&format=json&origin=*`;
      const resposta = await fetch(url);
      if (!resposta.ok) throw new Error('Falha na API da Wikipédia');
      const dados = await resposta.json();
      const paginas = dados.query && dados.query.pages ? Object.values(dados.query.pages) : [];
      const imagem = paginas[0]?.thumbnail?.source || null;
      cacheImagensEspecie.set(chave, imagem);
      return imagem;
    } catch (erro) {
      cacheImagensEspecie.set(chave, null);
      return null;
    }
  }

=======
  //
  // IMPORTANTE: a busca prioriza o NOME CIENTÍFICO, não o nome popular.
  // Nomes populares colidem com outras coisas (ex.: "Ariranha" também é
  // um município de São Paulo, então buscar só por "Ariranha" às vezes
  // trazia o mapa da cidade em vez do animal). Nome científico é único
  // no mundo todo, então evita esse tipo de confusão quase por completo.
  const cacheImagensEspecie = new Map();
 
  async function buscarThumbnailPorTitulo(titulo) {
    const url = `https://pt.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titulo)}&prop=pageimages&piprop=thumbnail&pithumbsize=700&redirects=1&format=json&origin=*`;
    const resposta = await fetch(url);
    if (!resposta.ok) return null;
    const dados = await resposta.json();
    const paginas = dados.query && dados.query.pages ? Object.values(dados.query.pages) : [];
    // Página "-1" = título não existe na Wikipédia; nesse caso não há id numérico real
    const pagina = paginas.find(p => p.pageid);
    return pagina?.thumbnail?.source || null;
  }
 
  async function buscarThumbnailPorTermo(termo) {
    const url = `https://pt.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(termo)}&gsrnamespace=0&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=700&format=json&origin=*`;
    const resposta = await fetch(url);
    if (!resposta.ok) return null;
    const dados = await resposta.json();
    const paginas = dados.query && dados.query.pages ? Object.values(dados.query.pages) : [];
    return paginas[0]?.thumbnail?.source || null;
  }
 
  async function buscarImagemEspecie(nome, tipo, cientifico) {
    const chave = `${tipo}:${nome}`;
    if (cacheImagensEspecie.has(chave)) return cacheImagensEspecie.get(chave);
 
    // Remove parênteses/gênero incerto do nome científico, se houver
    const nomeCientifico = (cientifico || '').replace(/\s*\(.*?\)\s*/g, '').trim();
 
    let imagem = null;
    try {
      // 1) Artigo exato pelo nome científico (o mais confiável de todos)
      if (nomeCientifico) {
        imagem = await buscarThumbnailPorTitulo(nomeCientifico);
      }
      // 2) Se não existe artigo com esse título exato, busca pelo termo científico
      if (!imagem && nomeCientifico) {
        imagem = await buscarThumbnailPorTermo(nomeCientifico);
      }
      // 3) Último recurso: nome popular (pode colidir com cidades/homônimos,
      //    por isso só é usado se as buscas mais precisas não acharem nada)
      if (!imagem) {
        const sufixoBusca = tipo === 'flora' ? 'planta' : 'animal';
        imagem = await buscarThumbnailPorTermo(`${nome} ${sufixoBusca}`);
      }
    } catch (erro) {
      imagem = null;
    }
 
    cacheImagensEspecie.set(chave, imagem);
    return imagem;
  }
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  async function carregarImagensEspecies() {
    const elementos = root.querySelectorAll('[data-especie-imagem]');
    elementos.forEach(async (container) => {
      const nome = container.getAttribute('data-especie-imagem');
      const tipo = container.getAttribute('data-especie-tipo');
<<<<<<< HEAD
      const imagem = await buscarImagemEspecie(nome, tipo);
      if (!imagem) return;

=======
      const cientifico = container.getAttribute('data-especie-cientifico');
      const imagem = await buscarImagemEspecie(nome, tipo, cientifico);
      if (!imagem) return;
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
      const img = document.createElement('img');
      img.src = imagem;
      img.alt = `Foto de ${nome}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.onerror = () => { img.remove(); };
      img.onload = () => {
        const emoji = container.querySelector('.especie-emoji');
        if (emoji) emoji.style.display = 'none';
      };
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
      // Anexa a foto por cima do emoji de fallback (que só volta a aparecer
      // se a imagem falhar em carregar via onerror acima).
      container.appendChild(img);
    });
  }
<<<<<<< HEAD

  // Começa a carregar as fotos sem bloquear o restante da página.
  carregarImagensEspecies();

=======
 
  // Começa a carregar as fotos sem bloquear o restante da página.
  carregarImagensEspecies();
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // Modal de espécie (fauna/flora)
  const modalOverlay = el('div', { class: 'especie-modal-overlay', id: 'especie-modal-overlay' }, `
    <div class="especie-modal" role="dialog" aria-modal="true">
      <button class="especie-modal-fechar" aria-label="Fechar">×</button>
      <div id="especie-modal-conteudo"></div>
    </div>
  `);
  document.body.appendChild(modalOverlay);
<<<<<<< HEAD

=======
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  root.querySelectorAll('.especie-card').forEach(card => {
    card.addEventListener('click', async () => {
      const tipo = card.dataset.tipo;
      const idx = Number(card.dataset.idx);
      const item = bioma[tipo][idx];
      const conteudo = document.getElementById('especie-modal-conteudo');
<<<<<<< HEAD
      const imagemModal = await buscarImagemEspecie(item.nome, tipo);
=======
      const imagemModal = await buscarImagemEspecie(item.nome, tipo, item.cientifico);
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
      const imagemHtml = imagemModal
        ? `<img src="${imagemModal}" alt="Foto de ${item.nome}" style="width:100%;height:230px;object-fit:cover;border-radius:12px;margin-bottom:18px;">`
        : '';
      if (tipo === 'fauna') {
        conteudo.innerHTML = `
          ${imagemHtml}
          <h3>${item.nome}</h3>
          <span class="cientifico">${item.cientifico}</span>
          ${item.status ? `<span class="status-tag" style="margin-bottom:16px;display:inline-block;">${item.status}</span>` : ''}
          <div class="campo"><div class="rotulo">Habitat</div><p>${item.habitat}</p></div>
          <div class="campo"><div class="rotulo">Alimentação</div><p>${item.dieta}</p></div>
          <div class="campo"><div class="rotulo">Papel ecológico</div><p>${item.papel}</p></div>
          <div class="campo"><div class="rotulo">Você sabia?</div><p>${item.curiosidade}</p></div>
        `;
      } else {
        conteudo.innerHTML = `
          ${imagemHtml}
          <h3>${item.nome}</h3>
          <span class="cientifico">${item.cientifico}</span>
          <div class="campo"><div class="rotulo">Papel ecológico</div><p>${item.papel}</p></div>
          <div class="campo"><div class="rotulo">Você sabia?</div><p>${item.curiosidade}</p></div>
        `;
      }
      modalOverlay.classList.add('aberto');
    });
  });
  modalOverlay.querySelector('.especie-modal-fechar').addEventListener('click', () => modalOverlay.classList.remove('aberto'));
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove('aberto'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modalOverlay.classList.remove('aberto'); });
<<<<<<< HEAD

  // Rede de vida: clicar em um organismo destaca a camada dele e conecta
  // visualmente às camadas com as quais ele se relaciona na cadeia alimentar
  // (produtores ↔ herbívoros ↔ predadores ↔ decompositores). Como os dados
  // não mapeiam espécie a espécie (ex: "onça come exatamente esta presa"),
  // a conexão é feita por camada — o mesmo nível de precisão descrito no
  // texto da seção — em vez de inventar relações específicas não verificadas.
  const redeWrap = document.getElementById('rede-vida-wrap');
  const CAMADAS_CONECTADAS = {
    produtores: ['herbivoros'],
    herbivoros: ['produtores', 'predadores'],
    predadores: ['herbivoros', 'decompositores'],
    decompositores: ['produtores', 'herbivoros', 'predadores']
  };
  const TEXTO_CONEXAO = {
    produtores: 'Este organismo produz energia a partir da luz solar e serve de alimento direto para os herbívoros do bioma.',
    herbivoros: 'Este organismo se alimenta de plantas e, por sua vez, é presa de predadores desta cadeia.',
    predadores: 'Este organismo caça herbívoros para se alimentar; quando morre, seus restos também são reciclados por decompositores.',
    decompositores: 'Este organismo decompõe matéria orgânica de todos os outros níveis, devolvendo nutrientes ao solo.'
  };
  if (redeWrap) {
    // Área de texto explicativo, criada dinamicamente logo abaixo da rede.
    const explicacao = el('p', { class: 'rede-vida-explicacao', id: 'rede-vida-explicacao' }, '');
    redeWrap.after(explicacao);

=======
 
  // Rede de vida: clicar destaca a camada selecionada
  const redeWrap = document.getElementById('rede-vida-wrap');
  if (redeWrap) {
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
    redeWrap.querySelectorAll('.rede-vida-item').forEach(item => {
      item.addEventListener('click', () => {
        const jaAtivo = item.classList.contains('ativo');
        redeWrap.querySelectorAll('.rede-vida-item').forEach(i => i.classList.remove('ativo', 'conectado'));
        redeWrap.classList.remove('selecionado');
<<<<<<< HEAD

        if (jaAtivo) {
          explicacao.textContent = '';
          return;
        }

        item.classList.add('ativo');
        redeWrap.classList.add('selecionado');

        const camada = item.dataset.camada;
        const camadasAlvo = CAMADAS_CONECTADAS[camada] || [];
        redeWrap.querySelectorAll('.rede-vida-item').forEach(i => {
          if (i !== item && camadasAlvo.includes(i.dataset.camada)) i.classList.add('conectado');
        });

        explicacao.textContent = `${item.textContent} — ${TEXTO_CONEXAO[camada] || ''}`;
      });
    });
  }

=======
        if (!jaAtivo) {
          item.classList.add('ativo');
          redeWrap.classList.add('selecionado');
        }
      });
    });
  }
 
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
  // Você sabia?: clique expande/retrai
  root.querySelectorAll('.fato-card').forEach(card => {
    card.addEventListener('click', () => card.classList.toggle('aberto'));
  });

  // Som ambiente (nunca autoplay — só ativa com clique explícito do usuário)
<<<<<<< HEAD
  const somCard = document.getElementById('som-card');
  const somBotao = document.getElementById('som-botao');
  if (somBotao) {
    somBotao.addEventListener('click', () => {
      const tocando = somCard.classList.toggle('tocando');
      somBotao.setAttribute('aria-pressed', String(tocando));
      somBotao.textContent = tocando ? '❚❚' : '▶';
      // Fonte de áudio fica fácil de configurar aqui quando houver um asset real:
      // const audio = new Audio('../assets/biomas/sons/' + bioma.slug + '.mp3');
      // tocando ? audio.play() : audio.pause();
=======
    // Som ambiente (nunca autoplay — só ativa com clique explícito do usuário)
  const somCard = document.getElementById('som-card');
  const somBotao = document.getElementById('som-botao');
  let audioBioma = null;

  // Cria o objeto de áudio uma única vez (na primeira vez que o usuário
  // clica), reaproveitando-o nos cliques seguintes — assim "pausar" de
  // fato pausa o áudio que estava tocando, em vez de criar outro do zero.
    function obterAudioBioma() {
    if (!audioBioma) {
      audioBioma = new Audio(`Sons/${bioma.slug}.mp3`);
      audioBioma.loop = true;
      audioBioma.volume = 0.5;
    }
    return audioBioma;
  }

  if (somBotao) {
    somBotao.addEventListener('click', () => {
      const audio = obterAudioBioma();
      const tocando = somCard.classList.toggle('tocando');
      somBotao.setAttribute('aria-pressed', String(tocando));
      somBotao.textContent = tocando ? '❚❚' : '▶';

      if (tocando) {
        audio.play().catch(() => {
          // Arquivo não encontrado ou navegador bloqueou o play — volta ao estado inicial
          somCard.classList.remove('tocando');
          somBotao.setAttribute('aria-pressed', 'false');
          somBotao.textContent = '▶';
        });
      } else {
        audio.pause();
      }
>>>>>>> 3f8e1edbbd309699acdcd5295a70a731d199e8ce
    });
  }

  // Exploração: progresso baseado nas seções que entraram na tela
  const secoesRastreadas = root.querySelectorAll('.bioma-secao');
  const totalSecoes = secoesRastreadas.length;
  const vistas = new Set();
  const exploracaoFill = document.getElementById('exploracao-fill');
  const exploracaoLegenda = document.getElementById('exploracao-legenda');
  const exploracaoObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) vistas.add(e.target);
    });
    const pct = Math.round((vistas.size / totalSecoes) * 100);
    if (exploracaoFill) exploracaoFill.style.width = pct + '%';
    if (exploracaoLegenda) exploracaoLegenda.textContent = `${pct}% do conteúdo visto`;
  }, { threshold: 0.3 });
  secoesRastreadas.forEach(s => exploracaoObserver.observe(s));

})();
