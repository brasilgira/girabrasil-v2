// ============================================================================
// js/noticias-regiao.js
//
// Monta a tela de NOTÍCIAS de UMA região (public/regioes/norte.html, etc.),
// a partir de window.REGIOES (js/regioes-data.js) pros textos/visual da
// região, e da API (/api/noticias?regiao=ID) pras notícias de verdade.
//
// FASE 2: antes lia window.REGIAO_NOTICIAS (js/regiao-noticias-data.js);
// agora busca da API. Esse arquivo JS antigo continua no projeto, só não
// é mais lido aqui.
//
// IMPORTANTE: o `id` dentro de window.REGIOES (ex: norte.id = 1) é só um
// rótulo visual antigo, não é necessariamente o id real da tabela `regiao`
// no banco — por isso resolvemos o id de verdade buscando por NOME em
// /api/regioes antes de buscar as notícias. NUNCA usamos `bioma` pra
// descobrir a região — são conceitos diferentes no banco.
// ============================================================================

function normalizarTexto(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatarDataSimples(isoString) {
  const data = new Date(isoString);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleDateString('pt-BR');
}
function normalizarUrlImagem(imagem) {
  if (!imagem) return '';

  const valor = String(imagem).trim();

  // URL externa: somente HTTP/HTTPS
  if (/^https?:\/\//i.test(valor)) {
    return valor;
  }

  // Caminho local relativo ao /public
  return `../${valor.replace(/^\/+/, '')}`;
}

function urlExternaSegura(url) {
  if (!url) return '';

  try {
    const valor = new URL(String(url), window.location.origin);

    if (valor.protocol === 'http:' || valor.protocol === 'https:') {
      return valor.href;
    }
  } catch (_) {
    // URL inválida: não cria link
  }

  return '';
}

// Ícones simples em SVG (sem emoji) — usados no lugar de 🌿/📅/👁 etc.
const ICONES = {
  folha: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17 3C10 3 4 9 4 17v3h3c8 0 14-6 14-13V3h-4z"/></svg>',
  calendario: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M3 10h18M8 3v4M16 3v4"></path></svg>',
  seta: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>',
  arvore: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2 5 12h4l-5 8h16l-5-8h4L12 2z"/><rect x="11" y="20" width="2" height="2"/></svg>',
  pessoas: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3"></circle><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"></path><circle cx="17" cy="9" r="2.3"></circle><path d="M16 14c2.8.3 5 2.5 5 6"></path></svg>'
};

// Busca o id REAL da região no banco, casando pelo nome (ex: "Norte")
// contra a lista de /api/regioes — nunca por número fixo.
async function buscarIdRealDaRegiao(nomeRegiao) {
  const resposta = await fetch('/api/regioes');
  if (!resposta.ok) throw new Error(`API respondeu ${resposta.status} ao buscar regiões`);
  const regioes = await resposta.json();

  const encontrada = regioes.find(
    (r) => normalizarTexto(r.nome) === normalizarTexto(nomeRegiao)
  );

  if (!encontrada) {
    throw new Error(`Região "${nomeRegiao}" não encontrada na tabela regiao do banco.`);
  }

  return encontrada.id;
}

async function montarNoticiasRegiao() {
  const chave = document.body.dataset.regiao;
  const regiao = (window.REGIOES || {})[chave];
  const raiz = document.getElementById('noticias-regiao-root');
  if (!raiz) return;

  if (!regiao) {
    raiz.innerHTML = '<p class="regiao-erro">Região não encontrada.</p>';
    return;
  }

  document.title = `Região ${regiao.nome} — Gira-Brasil`;

  let temaAtivo = 'Todas';
  let noticiasDaRegiao = [];
  let categoriasDisponiveis = [];

  function criarCardNoticia(n) {
  const card = document.createElement(n.id ? 'a' : 'div');

  card.className = 'card-noticia card-noticia-placeholder';

  if (n.id) {
    card.href = `noticia-regiao.html?regiao=${chave}&id=${n.id}`;
  }

  const caminhoImagem = normalizarUrlImagem(n.imagem);

  if (caminhoImagem) {
    const imagem = document.createElement('img');

    imagem.className = 'card-noticia-imagem';
    imagem.src = caminhoImagem;
    imagem.alt = n.titulo || 'Imagem da notícia';

    card.appendChild(imagem);
  } else {
    const imagemVazia = document.createElement('div');
    imagemVazia.className = 'card-noticia-imagem';

    card.appendChild(imagemVazia);
  }

  const tags = document.createElement('div');
  tags.className = 'card-noticia-tags';

  const categoria = document.createElement('span');
  categoria.className = 'tag tag-regiao-cor';
  categoria.textContent = n.categoria || '';

  tags.appendChild(categoria);
  card.appendChild(tags);

  const titulo = document.createElement('h3');
  titulo.textContent = n.titulo || '';

  card.appendChild(titulo);

  const resumo = document.createElement('p');
  resumo.textContent = n.resumo || '';

  card.appendChild(resumo);

  const meta = document.createElement('div');
  meta.className = 'card-noticia-meta';
  meta.textContent = n.data || 'Em breve';

  card.appendChild(meta);

  return card;
}

  function renderizarGrid() {
  const lista = temaAtivo === 'Todas'
    ? noticiasDaRegiao
    : noticiasDaRegiao.filter((n) => n.categoria === temaAtivo);

  const grid = raiz.querySelector('#regiao-noticias-grid');
  const contador = raiz.querySelector('#regiao-noticias-contador');

  if (!grid || !contador) return;

  contador.textContent =
    `${lista.length} notícia${lista.length === 1 ? '' : 's'}`;

  grid.replaceChildren();

  if (lista.length === 0) {
    const semResultados = document.createElement('div');
    semResultados.className = 'sem-resultados';

    const mensagem = document.createElement('p');
    mensagem.textContent = 'Nenhuma notícia encontrada com esse filtro.';

    semResultados.appendChild(mensagem);
    grid.appendChild(semResultados);

    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'grid-noticias';

  lista.forEach((noticia) => {
    wrapper.appendChild(criarCardNoticia(noticia));
  });

  grid.appendChild(wrapper);
}

  function renderizarPills() {
  const pillsEl = raiz.querySelector('#regiao-pills');

  if (!pillsEl) return;

  pillsEl.replaceChildren();

  ['Todas', ...categoriasDisponiveis].forEach((tema) => {
    const botao = document.createElement('button');

    botao.type = 'button';
    botao.className = 'pill-tema-regiao';

    if (tema === temaAtivo) {
      botao.classList.add('ativo');
    }

    botao.dataset.tema = tema;
    botao.textContent = tema;

    botao.addEventListener('click', () => {
      temaAtivo = tema;

      pillsEl
        .querySelectorAll('.pill-tema-regiao')
        .forEach((b) => b.classList.remove('ativo'));

      botao.classList.add('ativo');

      renderizarGrid();
    });

    pillsEl.appendChild(botao);
  });
}
  // Lista editorial numerada (não cartões com ícone+seta) — mesmo espírito
  // do .s-lista da tela Sobre, adaptado aqui com identidade própria.
  const destaquesHtml = regiao.destaques
    .map((texto, indice) => `
      <li class="regiao-indice-item">
        <span class="regiao-indice-num">${String(indice + 1).padStart(2, '0')}</span>
        <a href="../noticias.html">${texto}</a>
      </li>
    `)
    .join('');

  // `temas` nunca tinha sido usado nas páginas dedicadas — é dado real já
  // existente em regioes-data.js. Vira uma régua de temas em pauta logo
  // abaixo do hero, o "assunto" daquela região numa linha só.
  const temasHtml = (regiao.temas || [])
    .map((tema) => `<span>${tema}</span>`)
    .join('');

  // Desenha a "casca" da página (hero, régua de temas, mapa, estatísticas)
  // na hora — isso não depende da API, só de window.REGIOES. O grid de
  // notícias começa como "carregando" e é preenchido assim que a API
  // responder.
  raiz.innerHTML = `
    <section class="regiao-hero" style="background-image: linear-gradient(100deg, rgba(10,18,13,0.95) 0%, rgba(10,18,13,0.62) 48%, rgba(10,18,13,0.18) 100%), linear-gradient(0deg, rgba(10,18,13,0.5) 0%, rgba(10,18,13,0) 60%), url('${normalizarUrlImagem(regiao.imagem)}');">
      <div class="regiao-hero-conteudo">
        <div class="regiao-hero-tag">${ICONES.folha} Região ${regiao.nome} — ${regiao.apelido}</div>
        <h1 class="regiao-hero-titulo">
          ${regiao.heroLinha1}<br>
          <span class="regiao-hero-destaque">${regiao.heroLinha2}</span>
        </h1>
      </div>

      <blockquote class="regiao-hero-citacao">
        <p>“${regiao.frase}”</p>
      </blockquote>
    </section>

    <div class="regiao-temas-regua" aria-label="Temas em pauta nesta região">
      <span class="regiao-temas-rotulo">Em pauta</span>
      <div class="regiao-temas-lista">${temasHtml}</div>
    </div>

    <div class="regiao-layout">
      <main class="regiao-noticias-centro">
        <div class="regiao-noticias-cabecalho-lista">
          <h2>Notícias da Região ${regiao.nome}</h2>
          <p>${regiao.descricao}</p>
        </div>

        <div class="pills-tema-regiao" id="regiao-pills">
          <button class="pill-tema-regiao ativo" data-tema="Todas">Todas</button>
        </div>

        <p class="contador-resultados" id="regiao-noticias-contador">Carregando notícias...</p>
        <div id="regiao-noticias-grid"></div>
      </main>

      <aside class="regiao-lateral">
        <div class="regiao-painel-territorio">
          <div class="regiao-mini-mapa" id="regiao-mini-mapa"></div>
          <dl class="regiao-fatos">
            <div><dt>Estados</dt><dd>${regiao.estados}</dd></div>
            <div><dt>Área aproximada</dt><dd>${regiao.area}</dd></div>
            <div><dt>População</dt><dd>${regiao.populacao}</dd></div>
          </dl>
        </div>

        <div class="regiao-painel-destaques">
          <h4>Para explorar</h4>
          <ol class="regiao-indice">${destaquesHtml}</ol>
        </div>
      </aside>
    </div>
  `;

  // Mini-mapa: reaproveita o mesmo SVG do Brasil usado em regioes.html,
  // só que pequeno e com apenas a região atual destacada.
  const miniMapaEl = raiz.querySelector('#regiao-mini-mapa');
  if (miniMapaEl && window.MAPA_BRASIL_SVG) {
    miniMapaEl.innerHTML = window.MAPA_BRASIL_SVG;
    miniMapaEl.querySelectorAll('.regiao-mapa').forEach((g) => {
      g.classList.toggle('ativo', g.dataset.regiao === chave);
    });
  }

  // Agora sim, busca as notícias de verdade na API.
  try {
    const idRealDaRegiao = await buscarIdRealDaRegiao(regiao.nome);

    const resposta = await fetch(`/api/noticias?regiao=${idRealDaRegiao}`);
    if (!resposta.ok) throw new Error(`API respondeu ${resposta.status} ao buscar notícias da região`);
    const linhas = await resposta.json();

    // Adapta o formato da API (imagem_url, criado_em, link_fonte...) pro
    // mesmo formato que cardHtml já sabe desenhar (imagem, data, link...).
    noticiasDaRegiao = linhas.map((n) => ({
      titulo: n.titulo,
      resumo: n.resumo,
      imagem: n.imagem_url,
      categoria: n.categoria,
      data: formatarDataSimples(n.criado_em),
      id: n.id,
      linkFonte: n.link_fonte,
    }));

    // Filtros gerados a partir das categorias REAIS presentes nas
    // notícias desta região (vindas da API) — não de uma lista fixa.
    categoriasDisponiveis = [...new Set(noticiasDaRegiao.map((n) => n.categoria))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    renderizarPills();
    renderizarGrid();
  } catch (erro) {
    // Erro visível no console de propósito — nada de esconder falha da
    // API atrás de um fallback silencioso.
    console.error('Erro ao carregar notícias da região:', erro);
    const contador = raiz.querySelector('#regiao-noticias-contador');
    const grid = raiz.querySelector('#regiao-noticias-grid');
    if (contador) contador.textContent = 'Não foi possível carregar as notícias desta região.';
   if (grid) {
  grid.replaceChildren();

  const semResultados = document.createElement('div');
  semResultados.className = 'sem-resultados';

  const mensagem = document.createElement('p');
  mensagem.textContent = 'Tente recarregar a página.';

  semResultados.appendChild(mensagem);
  grid.appendChild(semResultados);
}
  }
}

montarNoticiasRegiao();
