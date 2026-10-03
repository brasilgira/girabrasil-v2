// ============================================================================
// public/js/regioes.js — página de exploração das regiões (regioes.html)
//
// Redesign: o mapa (js/mapa-brasil-svg.js) deixou de ser o mecanismo
// principal de navegação — agora é um elemento gráfico do hero, com hover
// sutil, mas o clique nele continua levando direto pra página da região.
// A navegação principal passou a ser o "atlas editorial" abaixo do hero.
//
// Fontes de dados:
//   - window.REGIOES  (js/regioes-data.js)  — estático, autoral do projeto
//   - window.BIOMAS   (js/biomas-data.js)   — estático, autoral do projeto
//   - /api/regioes e /api/noticias          — dados reais do banco
//
// SEGURANÇA: nada vindo da API vai por innerHTML/template string — só
// createElement/textContent (mesmo padrão de noticias-regiao.js). Os dados
// estáticos (REGIOES/BIOMAS) são escritos pelo time do projeto, não por
// usuário/admin, mas mesmo assim a montagem abaixo evita template strings
// com HTML por consistência e facilidade de manutenção.
// ============================================================================

const REGIOES_ORDEM = ['norte', 'nordeste', 'centro-oeste', 'sudeste', 'sul'];
const dadosRegioes = window.REGIOES || {};
const dadosBiomas = window.BIOMAS || {};

// ---------------------------------------------------------------------------
// Mapa do Brasil no hero — decorativo/complementar, nunca obrigatório pra
// navegar (por isso fica aria-hidden no HTML: a navegação de verdade, com
// texto e foco de teclado, é o atlas editorial logo abaixo). Ainda assim,
// cada área do mapa é clicável no mouse e leva direto à página da região.
// ---------------------------------------------------------------------------
function inicializarMapaHero() {
  const wrap = document.getElementById('mapa-regioes-wrap');
  if (!wrap) return;

  if (!window.MAPA_BRASIL_SVG) {
    wrap.innerHTML = '<div class="mapa-indisponivel">Mapa indisponível no momento</div>';
    return;
  }

  wrap.innerHTML = window.MAPA_BRASIL_SVG;

  wrap.querySelectorAll('.regiao-mapa').forEach((grupo) => {
    const chave = grupo.getAttribute('data-regiao');
    grupo.addEventListener('click', () => { window.location.href = `regioes/${chave}.html`; });
    grupo.addEventListener('mouseenter', () => destacarRegiaoNoMapa(chave));
    grupo.addEventListener('mouseleave', () => destacarRegiaoNoMapa(null));
  });
}

function destacarRegiaoNoMapa(chave) {
  const wrap = document.getElementById('mapa-regioes-wrap');
  if (!wrap) return;

  wrap.querySelectorAll('.regiao-mapa').forEach((grupo) => {
    grupo.classList.toggle('em-destaque', grupo.getAttribute('data-regiao') === chave);
  });

  const legenda = document.getElementById('mapa-hero-legenda');
  if (!legenda) return;
  legenda.textContent = chave
    ? (dadosRegioes[chave] && dadosRegioes[chave].nome) || ''
    : 'Passe o mouse ou navegue pelo teclado para destacar uma região do mapa.';
}

// ---------------------------------------------------------------------------
// Atlas editorial das cinco regiões — composição assimétrica (o tamanho de
// cada bloco vem do CSS, via a classe atlas-regiao--<chave>). Cada bloco é
// um link inteiro para a página real daquela região.
// ---------------------------------------------------------------------------
function criarBlocoRegiao(chave, contagemNoticias) {
  const regiao = dadosRegioes[chave];
  if (!regiao) return null;

  const bloco = document.createElement('a');
  bloco.href = `regioes/${chave}.html`;
  bloco.className = `atlas-regiao atlas-regiao--${chave}`;
  bloco.style.setProperty('--imagem-regiao', `url('${regiao.imagem}')`);
  bloco.setAttribute('aria-label', `Explorar a região ${regiao.nome}`);

  const numero = document.createElement('span');
  numero.className = 'atlas-regiao-numero';
  numero.textContent = String(REGIOES_ORDEM.indexOf(chave) + 1).padStart(2, '0');
  bloco.appendChild(numero);

  const conteudo = document.createElement('div');
  conteudo.className = 'atlas-regiao-conteudo';

  if (regiao.apelido || regiao.bioma) {
    const apelido = document.createElement('span');
    apelido.className = 'atlas-regiao-apelido';
    apelido.textContent = regiao.apelido || regiao.bioma;
    conteudo.appendChild(apelido);
  }

  const titulo = document.createElement('h3');
  titulo.textContent = regiao.nome;
  conteudo.appendChild(titulo);

  if (regiao.estados) {
    const estados = document.createElement('p');
    estados.className = 'atlas-regiao-estados';
    estados.textContent = regiao.estados;
    conteudo.appendChild(estados);
  }

  if (regiao.descricao) {
    const descricao = document.createElement('p');
    descricao.className = 'atlas-regiao-descricao';
    descricao.textContent = regiao.descricao;
    conteudo.appendChild(descricao);
  }

  const rodape = document.createElement('div');
  rodape.className = 'atlas-regiao-rodape';

  if (typeof contagemNoticias === 'number') {
    const badge = document.createElement('span');
    badge.className = 'atlas-regiao-contagem';
    badge.textContent = contagemNoticias === 1 ? '1 notícia' : `${contagemNoticias} notícias`;
    rodape.appendChild(badge);
  }

  const cta = document.createElement('span');
  cta.className = 'atlas-regiao-cta';
  cta.textContent = 'Explorar região →';
  rodape.appendChild(cta);

  conteudo.appendChild(rodape);
  bloco.appendChild(conteudo);
  return bloco;
}

// Conta notícias reais por região usando /api/regioes (id ↔ nome) e
// /api/noticias (regiao_id de cada notícia). Se qualquer chamada falhar,
// os blocos simplesmente não mostram contagem — nunca um número estimado.
async function contarNoticiasPorRegiao() {
  const [respostaRegioes, respostaNoticias] = await Promise.all([
    fetch('/api/regioes'),
    fetch('/api/noticias'),
  ]);
  if (!respostaRegioes.ok || !respostaNoticias.ok) {
    throw new Error('Não foi possível buscar regiões/notícias.');
  }

  const regioesApi = await respostaRegioes.json();
  const noticias = await respostaNoticias.json();

  const idParaChave = {};
  regioesApi.forEach((r) => {
    const chave = REGIOES_ORDEM.find((k) => dadosRegioes[k] && dadosRegioes[k].nome === r.nome);
    if (chave) idParaChave[r.id] = chave;
  });

  const contagens = {};
  noticias.forEach((n) => {
    const chave = idParaChave[n.regiao_id];
    if (!chave) return;
    contagens[chave] = (contagens[chave] || 0) + 1;
  });
  return contagens;
}

async function renderizarAtlasRegioes() {
  const grade = document.getElementById('atlas-regioes-grade');
  if (!grade) return;

  let contagens = {};
  try {
    contagens = await contarNoticiasPorRegiao();
  } catch {
    // segue sem contagem — ver comentário acima
  }

  grade.innerHTML = '';
  REGIOES_ORDEM.forEach((chave) => {
    const bloco = criarBlocoRegiao(chave, contagens[chave]);
    if (bloco) grade.appendChild(bloco);
  });
}

// ---------------------------------------------------------------------------
// "Um Brasil, muitos biomas" — usa window.BIOMAS (dados reais já existentes
// no projeto) e o campo mapaDestaque de cada bioma pra listar em quais
// regiões ele ocorre. É esse dado que deixa claro que bioma e região não
// são a mesma coisa (ex.: Mata Atlântica cruza Sudeste, Sul e Nordeste).
// ---------------------------------------------------------------------------
function nomesDasRegioes(chaves) {
  return (chaves || [])
    .map((chave) => dadosRegioes[chave] && dadosRegioes[chave].nome)
    .filter(Boolean)
    .join(', ');
}

function criarBlocoBioma(bioma) {
  const link = document.createElement('a');
  link.className = 'bioma-bloco';
  link.href = bioma.slug ? `biomas/${bioma.slug}.html` : 'biomas.html';
  link.style.setProperty('--cor-bioma', bioma.corDestaque || 'var(--cor-floresta)');
  link.setAttribute('aria-label', `Saiba mais sobre o bioma ${bioma.nome}`);

  if (bioma.heroImagem) {
    // heroImagem em biomas-data.js é relativa a public/biomas/ ("../assets/...");
    // regioes.html vive em public/, então tiramos o "../" daqui.
    const caminho = bioma.heroImagem.replace(/^\.\.\//, '');
    const imagem = document.createElement('div');
    imagem.className = 'bioma-bloco-imagem';
    imagem.style.backgroundImage = `url('${caminho}')`;
    link.appendChild(imagem);
  }

  const corpo = document.createElement('div');
  corpo.className = 'bioma-bloco-corpo';

  const nome = document.createElement('h4');
  nome.textContent = bioma.nome;
  corpo.appendChild(nome);

  if (bioma.subtitulo) {
    const subtitulo = document.createElement('p');
    subtitulo.className = 'bioma-bloco-subtitulo';
    subtitulo.textContent = bioma.subtitulo;
    corpo.appendChild(subtitulo);
  }

  const regioesDoBioma = nomesDasRegioes(bioma.mapaDestaque);
  if (regioesDoBioma) {
    const ocorre = document.createElement('p');
    ocorre.className = 'bioma-bloco-regioes';
    ocorre.textContent = `Ocorre em: ${regioesDoBioma}`;
    corpo.appendChild(ocorre);
  }

  link.appendChild(corpo);
  return link;
}

function renderizarAtlasBiomas() {
  const grade = document.getElementById('atlas-biomas-grade');
  if (!grade) return;
  grade.innerHTML = '';
  Object.values(dadosBiomas).forEach((bioma) => {
    grade.appendChild(criarBlocoBioma(bioma));
  });
}

// ---------------------------------------------------------------------------
// "Em pauta pelo Brasil" — notícias regionais reais (nunca de
// noticias-data.js/regiao-noticias-data.js). Se a API não trouxer nenhuma
// notícia com região associada, a seção inteira some — nunca mostramos
// notícia inventada nem placeholder.
// ---------------------------------------------------------------------------
function criarCardEmPauta(noticia, nomeRegiao) {
  const card = document.createElement('a');
  card.className = 'empauta-card';
  card.href = `noticia.html?id=${encodeURIComponent(noticia.id)}`;

  if (noticia.imagem_url) {
    const imagem = document.createElement('img');
    imagem.className = 'empauta-card-imagem';
    imagem.src = noticia.imagem_url;
    imagem.alt = noticia.titulo || '';
    card.appendChild(imagem);
  }

  const corpo = document.createElement('div');
  corpo.className = 'empauta-card-corpo';

  const tagRegiao = document.createElement('span');
  tagRegiao.className = 'tag';
  tagRegiao.textContent = nomeRegiao;
  corpo.appendChild(tagRegiao);

  const titulo = document.createElement('h4');
  titulo.textContent = noticia.titulo || '';
  corpo.appendChild(titulo);

  if (noticia.resumo) {
    const resumo = document.createElement('p');
    resumo.textContent = noticia.resumo;
    corpo.appendChild(resumo);
  }

  card.appendChild(corpo);
  return card;
}

async function renderizarEmPauta() {
  const secao = document.getElementById('secao-empauta');
  const trilho = document.getElementById('empauta-trilho');
  if (!secao || !trilho) return;

  try {
    const resposta = await fetch('/api/noticias');
    if (!resposta.ok) throw new Error('Falha ao buscar notícias.');
    const noticias = await resposta.json();

    const regionais = noticias.filter((n) => n.regiao_nome);
    if (regionais.length === 0) {
      secao.remove();
      return;
    }

    trilho.innerHTML = '';
    regionais.slice(0, 6).forEach((noticia) => {
      trilho.appendChild(criarCardEmPauta(noticia, noticia.regiao_nome));
    });
  } catch {
    // Sem gambiarra: se a API falhar, a seção não aparece.
    secao.remove();
  }
}

inicializarMapaHero();
renderizarAtlasRegioes();
renderizarAtlasBiomas();
renderizarEmPauta();
