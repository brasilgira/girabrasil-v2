
const ID_NOTICIA_DESTAQUE_HOME = 10; // ex.: 7

function tempoDeLeituraHome(texto) {
  const palavras = (texto || '').trim().split(/\s+/).filter(Boolean).length;
  const minutos = Math.max(1, Math.round(palavras / 200));
  return `${minutos} min de leitura`;
}

function formatarDataHome(isoString) {
  const data = new Date(isoString);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function criarMedia(noticia) {
  const media = document.createElement('div');
  media.className = 'gb-news-media';
  const img = document.createElement('img');
  img.src = noticia.imagem_url || 'assets/noticias/news-agua.png';
  img.alt = noticia.titulo || '';
  media.appendChild(img);
  return media;
}

function criarDestaque(noticia) {
  const link = document.createElement('a');
  link.href = `noticia.html?id=${encodeURIComponent(noticia.id)}`;
  link.className = 'noticia-destaque';
  link.appendChild(criarMedia(noticia));

  const info = document.createElement('div');
  info.className = 'gb-news-info';

  if (noticia.categoria) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = noticia.categoria;
    info.appendChild(tag);
  }

  const titulo = document.createElement('h3');
  titulo.textContent = noticia.titulo || '';
  info.appendChild(titulo);

  if (noticia.resumo) {
    const resumo = document.createElement('p');
    resumo.textContent = noticia.resumo;
    info.appendChild(resumo);
  }

  link.appendChild(info);
  return link;
}

function criarItemLista(noticia) {
  const link = document.createElement('a');
  link.href = `noticia.html?id=${encodeURIComponent(noticia.id)}`;
  link.className = 'item-noticia';
  link.appendChild(criarMedia(noticia));

  const info = document.createElement('div');

  if (noticia.categoria) {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = noticia.categoria;
    info.appendChild(tag);
  }

  const titulo = document.createElement('h4');
  titulo.textContent = noticia.titulo || '';
  info.appendChild(titulo);

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `${formatarDataHome(noticia.criado_em)} · ${tempoDeLeituraHome(noticia.conteudo || noticia.resumo)}`;
  info.appendChild(meta);

  link.appendChild(info);
  return link;
}

async function carregarUltimasNoticiasHome() {
  const grid = document.getElementById('homeNoticiasGrid');
  if (!grid) return;

  try {
    const resposta = await fetch('/api/noticias?geral=true');
    if (!resposta.ok) throw new Error(`API respondeu ${resposta.status}`);
    const noticias = await resposta.json();

    if (!noticias.length) {
      grid.replaceChildren();
      const vazio = document.createElement('p');
      vazio.className = 'home-noticias-vazio';
      vazio.textContent = 'Nenhuma notícia publicada ainda.';
      grid.appendChild(vazio);
      return;
    }

    // Usa a notícia forçada em ID_NOTICIA_DESTAQUE_HOME, se ela existir na
    // lista; senão cai no padrão (a primeira = mais recente).
    const indiceForcado = ID_NOTICIA_DESTAQUE_HOME
      ? noticias.findIndex((n) => n.id === ID_NOTICIA_DESTAQUE_HOME)
      : -1;
    const destaque = indiceForcado >= 0 ? noticias[indiceForcado] : noticias[0];
    const resto = noticias.filter((n) => n.id !== destaque.id);

    grid.replaceChildren();
    grid.appendChild(criarDestaque(destaque));

    const lista = document.createElement('div');
    lista.className = 'lista-noticias';
    resto.slice(0, 3).forEach((n) => lista.appendChild(criarItemLista(n)));
    grid.appendChild(lista);
  } catch (erro) {
    console.error('Erro ao carregar últimas notícias da home:', erro);
    grid.replaceChildren();
    const mensagemErro = document.createElement('p');
    mensagemErro.className = 'home-noticias-erro';
    mensagemErro.textContent = 'Não foi possível carregar as notícias agora.';
    grid.appendChild(mensagemErro);
  }
}

carregarUltimasNoticiasHome();
