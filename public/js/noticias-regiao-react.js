// ============================================================================
// js/noticias-regiao-react.js
//


const { useState, useEffect, useRef } = React;

function normalizarTexto(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Ícones simples em SVG (sem emoji).
const ICONES = {
  folha: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17 3C10 3 4 9 4 17v3h3c8 0 14-6 14-13V3h-4z"/></svg>',
  seta: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>',
  arvore: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2 5 12h4l-5 8h16l-5-8h4L12 2z"/><rect x="11" y="20" width="2" height="2"/></svg>',
  pessoas: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3"></circle><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"></path><circle cx="17" cy="9" r="2.3"></circle><path d="M16 14c2.8.3 5 2.5 5 6"></path></svg>'
};

// Card de notícia da região. Agora SEMPRE é clicável e leva pra tela de
// leitura interna (noticia-regiao.html?regiao=X&id=Y), já que toda
// notícia tem um `corpo` completo agora — não depende mais de ter um
// link externo de verdade preenchido.
function CardNoticiaRegiao({ noticia, regiaoChave }) {
  const caminhoImagem = noticia.imagem
    ? (/^https?:\/\//i.test(noticia.imagem) ? noticia.imagem : `../${noticia.imagem}`)
    : '';

  return (
    <a className="card-noticia card-noticia-placeholder" href={`noticia-regiao.html?regiao=${regiaoChave}&id=${noticia.id}`}>
      {caminhoImagem
        ? <img className="card-noticia-imagem" src={caminhoImagem} alt={noticia.titulo} />
        : <div className="card-noticia-imagem"></div>}
      <div className="card-noticia-tags">
        <span className="tag tag-regiao-cor">{noticia.categoria}</span>
      </div>
      <h3>{noticia.titulo}</h3>
      <p>{noticia.resumo}</p>
      <div className="card-noticia-meta">{noticia.data || 'Em breve'}</div>
    </a>
  );
}

function RegiaoNoticiasApp() {
  const chave = document.body.dataset.regiao;
  const regiao = (window.REGIOES || {})[chave];
  const todasNoticias = (window.REGIAO_NOTICIAS || {})[chave] || [];

  const [temaAtivo, setTemaAtivo] = useState('Todas');
  const miniMapaRef = useRef(null);

  useEffect(() => {
    if (regiao) document.title = `Região ${regiao.nome} — Gira-Brasil`;
  }, []);

  useEffect(() => {
    if (miniMapaRef.current && window.MAPA_BRASIL_SVG) {
      miniMapaRef.current.innerHTML = window.MAPA_BRASIL_SVG;
      miniMapaRef.current.querySelectorAll('.regiao-mapa').forEach((g) => {
        g.classList.toggle('ativo', g.dataset.regiao === chave);
      });
    }
  }, []);

  if (!regiao) {
    return <p className="regiao-erro">Região não encontrada.</p>;
  }

  const categoriasDisponiveis = [...new Set(todasNoticias.map((n) => n.categoria))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const temas = ['Todas', ...categoriasDisponiveis];

  const lista = temaAtivo === 'Todas'
    ? todasNoticias
    : todasNoticias.filter((n) => n.categoria === temaAtivo);

  return (
    <React.Fragment>

      <section
        className="regiao-hero"
        style={{
          backgroundImage: `linear-gradient(100deg, rgba(10,18,13,0.94) 0%, rgba(10,18,13,0.6) 45%, rgba(10,18,13,0.15) 100%), linear-gradient(0deg, rgba(10,18,13,0.35) 0%, rgba(10,18,13,0) 55%), url('../${regiao.imagem}')`
        }}
      >
        <div className="regiao-hero-conteudo">
          <div className="regiao-hero-tag">
            <span dangerouslySetInnerHTML={{ __html: ICONES.folha }} /> REGIÃO {regiao.nome.toUpperCase()}
          </div>
          <h1 className="regiao-hero-titulo">
            {regiao.heroLinha1}<br />
            <span className="regiao-hero-destaque">{regiao.heroLinha2}</span>
          </h1>
          <p className="regiao-hero-texto">{regiao.descricao}</p>
        </div>

        <div className="destaques-regiao-card">
          <h4><span dangerouslySetInnerHTML={{ __html: ICONES.folha }} /> Destaques da região</h4>
          {regiao.destaques.map((texto, i) => (
            <a className="destaque-regiao-item" href="../noticias.html" key={i}>
              <span className="destaque-regiao-icone" dangerouslySetInnerHTML={{ __html: ICONES.folha }} />
              <span>{texto}</span>
              <span className="destaque-regiao-seta" dangerouslySetInnerHTML={{ __html: ICONES.seta }} />
            </a>
          ))}
        </div>
      </section>

      <div className="regiao-layout">

        <main className="regiao-noticias-centro">
          <div className="regiao-noticias-cabecalho-lista">
            <h2>Notícias da Região {regiao.nome}</h2>
          </div>

          <div className="pills-tema-regiao">
            {temas.map((tema) => (
              <button
                key={tema}
                className={`pill-tema-regiao ${tema === temaAtivo ? 'ativo' : ''}`}
                onClick={() => setTemaAtivo(tema)}
              >
                {tema}
              </button>
            ))}
          </div>

          <p className="contador-resultados">
            {lista.length} notícia{lista.length === 1 ? '' : 's'}
          </p>

          {lista.length === 0 ? (
            <div className="sem-resultados"><p>Nenhuma notícia com esse filtro.</p></div>
          ) : (
            <div className="grid-noticias">
              {lista.map((n) => <CardNoticiaRegiao noticia={n} regiaoChave={chave} key={n.id} />)}
            </div>
          )}
        </main>

        <aside className="regiao-lateral">
          <div className="regiao-mini-mapa-card">
            <h4><span dangerouslySetInnerHTML={{ __html: ICONES.folha }} /> Região {regiao.nome}</h4>
            <div className="regiao-mini-mapa" ref={miniMapaRef}></div>
            <ul className="regiao-stats">
              <li>
                <span dangerouslySetInnerHTML={{ __html: ICONES.arvore }} />
                <div><strong>{regiao.area}</strong><span>Área aproximada</span></div>
              </li>
              <li>
                <span dangerouslySetInnerHTML={{ __html: ICONES.pessoas }} />
                <div><strong>{regiao.populacao}</strong><span>População</span></div>
              </li>
            </ul>
            <blockquote className="regiao-frase">“{regiao.frase}”</blockquote>
          </div>

          <div className="sobre-regiao-card">
            <h4><span dangerouslySetInnerHTML={{ __html: ICONES.folha }} /> Sobre a Região {regiao.nome}</h4>
            <p>{regiao.estados}. {regiao.descricao}</p>
          </div>
        </aside>

      </div>
    </React.Fragment>
  );
}

const raizRegiaoEl = document.getElementById('noticias-regiao-root');
if (raizRegiaoEl) {
  ReactDOM.createRoot(raizRegiaoEl).render(<RegiaoNoticiasApp />);
}
