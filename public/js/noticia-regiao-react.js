// ============================================================================
// js/noticia-regiao-react.js
//
// Monta a tela de LEITURA de uma notícia de região, a partir da URL:
// noticia-regiao.html?regiao=norte&id=3.
//
// FASE 2: antes lia window.REGIAO_NOTICIAS (js/regiao-noticias-data.js);
// agora busca da API (/api/noticias/:id).
//
// Abordagem HÍBRIDA (opção C):
//   - se a notícia tiver `blocos` (JSON com parágrafo, título, estatísticas,
//     citação...), desenha o visual rico;
//   - se não tiver, cai pro campo `conteudo` (texto simples) e transforma
//     cada linha em branco em um parágrafo.
// ============================================================================

const { useEffect, useState } = React;

// Lê ?regiao= e ?id= da URL
const parametrosUrl = new URLSearchParams(window.location.search);
const regiaoChaveUrl = parametrosUrl.get('regiao');
const idUrl = parseInt(parametrosUrl.get('id'), 10);
const regiaoInfo = (window.REGIOES || {})[regiaoChaveUrl];

function normalizarTexto(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatarData(iso) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleDateString('pt-BR');
}

function caminhoImagemDe(imagem) {
  if (!imagem) return '';
  const valor = String(imagem).trim();
  return /^https?:\/\//i.test(valor) ? valor : `../${valor.replace(/^\/+/, '')}`;
}

// Só deixa passar link http/https (evita javascript: e coisas do tipo)
function urlExternaSegura(url) {
  if (!url) return '';
  try {
    const v = new URL(String(url), window.location.origin);
    if (v.protocol === 'http:' || v.protocol === 'https:') return v.href;
  } catch (_) {}
  return '';
}

// Aceita `blocos` como array (JSONB já vem parseado) ou como string JSON.
// Se não existir ou estiver inválido, devolve null e usamos o `conteudo`.
function obterBlocos(artigo) {
  let blocos = artigo.blocos;
  if (typeof blocos === 'string') {
    try { blocos = JSON.parse(blocos); } catch (_) { blocos = null; }
  }
  return Array.isArray(blocos) && blocos.length > 0 ? blocos : null;
}

// Plano B: transforma o texto simples em blocos de parágrafo.
function blocosDoConteudo(conteudo) {
  return String(conteudo || '')
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((texto) => ({ tipo: 'paragrafo', texto }));
}

function renderBloco(bloco, i) {
  switch (bloco.tipo) {
    case 'paragrafo':
      return <p key={i}>{bloco.texto}</p>;
    case 'titulo':
      return <h2 key={i} id={bloco.id}>{bloco.texto}</h2>;
    case 'subtitulo':
      return <h3 key={i} id={bloco.id}>{bloco.texto}</h3>;
    case 'lista':
      return <ul key={i}>{(bloco.itens || []).map((item, j) => <li key={j}>{item}</li>)}</ul>;
    case 'estatisticas':
      return (
        <div className="stat-strip" key={i}>
          {(bloco.itens || []).map((s, j) => (
            <div className="stat-cell" key={j}>
              <span className="stat-num">{s.numero}</span>
              <span className="stat-label">{s.legenda}</span>
            </div>
          ))}
        </div>
      );
    case 'citacao':
      return (
        <div className="quote-block" key={i}>
          <blockquote>{bloco.texto}</blockquote>
          <cite>— {bloco.autor}</cite>
        </div>
      );
    case 'regiao':
      return (
        <div className="region-card" key={i}>
          <span className="region-eyebrow">Esta notícia está relacionada</span>
          <h3 className="region-name">{bloco.nome}</h3>
          <p className="region-desc">{bloco.descricao}</p>
          <a className="region-btn" href={bloco.link}>Explorar região →</a>
        </div>
      );
    default:
      return null;
  }
}

function Aviso({ children }) {
  return (
    <div className="breadcrumb" style={{ padding: '60px 32px' }}>
      {children} <a href="../regioes.html">Voltar para regiões</a>
    </div>
  );
}

function App() {
  const [artigo, setArtigo] = useState(null);
  const [outras, setOutras] = useState([]);
  const [estado, setEstado] = useState('carregando'); // carregando | ok | erro

  // Busca a notícia na API
  useEffect(() => {
    async function carregar() {
      try {
        const resp = await fetch(`/api/noticias/${idUrl}`);
        if (!resp.ok) throw new Error(`API respondeu ${resp.status}`);
        const dados = await resp.json();
        // Algumas APIs devolvem a notícia direto, outras dentro de um array
        const noticia = Array.isArray(dados) ? dados[0] : dados;
        if (!noticia) throw new Error('Notícia vazia');
        setArtigo(noticia);
        setEstado('ok');
        document.title = `${noticia.titulo} — Gira-Brasil`;
      } catch (erro) {
        console.error('Erro ao carregar notícia:', erro);
        setEstado('erro');
      }
    }
    if (Number.isNaN(idUrl)) setEstado('erro');
    else carregar();
  }, []);

  // Busca "Continue lendo": outras notícias da mesma região
  useEffect(() => {
    if (!regiaoInfo) return;
    async function carregarOutras() {
      try {
        const rRegioes = await fetch('/api/regioes');
        const regioes = await rRegioes.json();
        const achada = regioes.find((r) => normalizarTexto(r.nome) === normalizarTexto(regiaoInfo.nome));
        if (!achada) return;
        const rNoticias = await fetch(`/api/noticias?regiao=${achada.id}`);
        const lista = await rNoticias.json();
        setOutras(lista.filter((n) => n.id !== idUrl).slice(0, 3));
      } catch (erro) {
        // "Continue lendo" é um extra: se falhar, só não mostra
        console.error('Erro ao carregar outras notícias:', erro);
      }
    }
    carregarOutras();
  }, []);

  if (!regiaoInfo) return <Aviso>Região não encontrada.</Aviso>;
  if (estado === 'carregando') return <Aviso>Carregando notícia...</Aviso>;
  if (estado === 'erro' || !artigo) return <Aviso>Notícia não encontrada.</Aviso>;

  const blocos = obterBlocos(artigo) || blocosDoConteudo(artigo.conteudo);
  const sumario = blocos
    .filter((b) => (b.tipo === 'titulo' || b.tipo === 'subtitulo') && b.id)
    .map((b) => ({ id: b.id, titulo: b.texto }));
  const imagem = caminhoImagemDe(artigo.imagem_url);
  const linkFonte = urlExternaSegura(artigo.link_fonte);

  return (
    <React.Fragment>

      <div className="breadcrumb">
        <a href="../index.html">Início</a><span className="sep">/</span>
        <a href={`${regiaoChaveUrl}.html`}>Região {regiaoInfo.nome}</a><span className="sep">/</span>
        <span className="current">{artigo.categoria}</span>
      </div>

      <header className="article-header">
        <span className="category-badge">{artigo.categoria}</span>
        <h1 className="headline">{artigo.titulo}</h1>
        <p className="deck">{artigo.resumo}</p>
        <div className="meta-row">
          {artigo.autor && (<React.Fragment><span className="author">Por {artigo.autor}</span><span className="meta-dot"></span></React.Fragment>)}
          <span>{formatarData(artigo.criado_em)}</span>
        </div>
      </header>

      {imagem && (
        <div className="hero">
          <div className="hero-frame">
            <img src={imagem} alt={artigo.titulo} />
          </div>
        </div>
      )}

      <div className="layout">

        <article className="article-body">
          {blocos.map((bloco, i) => renderBloco(bloco, i))}

          {linkFonte && (
            <p style={{ fontSize: '0.85rem', marginTop: '24px' }}>
              Fonte original: <a href={linkFonte} target="_blank" rel="noopener noreferrer">{linkFonte}</a>
            </p>
          )}
        </article>

        <aside className="sidebar">
          {sumario.length > 0 && (
            <div className="side-block">
              <div className="side-title">Neste artigo</div>
              <ul className="toc-list">
                {sumario.map((item) => (
                  <li key={item.id}><a href={`#${item.id}`}>{item.titulo}</a></li>
                ))}
              </ul>
            </div>
          )}
        </aside>

      </div>

      {outras.length > 0 && (
        <section className="related">
          <span className="section-label">Continue lendo</span>
          <h2>Mais notícias da Região {regiaoInfo.nome}</h2>
          <div className="related-grid">
            {outras.map((n) => (
              <a className="news-card" href={`noticia-regiao.html?regiao=${regiaoChaveUrl}&id=${n.id}`} key={n.id}>
                <div className="thumb">
                  {caminhoImagemDe(n.imagem_url)
                    ? <img src={caminhoImagemDe(n.imagem_url)} alt={n.titulo} />
                    : null}
                </div>
                <div className="body">
                  <span className="cat">{n.categoria}</span>
                  <h3>{n.titulo}</h3>
                  <p>{n.resumo}</p>
                  <span className="meta">{formatarData(n.criado_em)}</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="back-link">
        <a href={`${regiaoChaveUrl}.html`}>← Voltar para Região {regiaoInfo.nome}</a>
      </div>

    </React.Fragment>
  );
}

const raizNoticiaRegiaoEl = document.getElementById('noticia-regiao-root');
if (raizNoticiaRegiaoEl) {
  ReactDOM.createRoot(raizNoticiaRegiaoEl).render(<App />);
}
