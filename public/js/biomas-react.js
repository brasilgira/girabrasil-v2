// ==========================================================================
// GiraBrasil — Motor da página de biomas (versão React)
// Lê qual bioma renderizar a partir de document.body.dataset.bioma e monta
// a página inteira com base no objeto window.BIOMAS (js/biomas-data.js),
// que continua sendo a mesma fonte única de dados de antes.
//
// Isso substitui o antigo js/biomas.js (manipulação direta do DOM) por
// componentes React, seguindo o mesmo padrão já usado em noticia.html:
// React + ReactDOM + Babel Standalone via CDN, sem build/Vite.
// ==========================================================================

const { useState, useEffect, useRef } = React;

function StatCard({ stat }) {
  const ref = useRef(null);
  const [emVista, setEmVista] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => e.isIntersecting && setEmVista(true)),
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`bioma-stat-card ${emVista ? 'em-vista' : ''}`} ref={ref}>
      <div className="rotulo">{stat.label}</div>
      <span className="valor">{stat.valor}</span>
      <div className="detalhe">{stat.detalhe}</div>
    </div>
  );
}

function MapaBioma({ mapaDestaque }) {
  const wrapRef = useRef(null);
  const [indisponivel, setIndisponivel] = useState(false);

  useEffect(() => {
    fetch('../assets/biomas/mapa-regioes-simplificado.svg')
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((svgText) => {
        if (!wrapRef.current) return;
        wrapRef.current.innerHTML = svgText;
        const destaque = mapaDestaque || [];
        wrapRef.current.querySelectorAll('.regiao-mapa').forEach((g) => {
          if (destaque.includes(g.getAttribute('data-regiao'))) g.classList.add('destaque');
        });
      })
      .catch(() => setIndisponivel(true));
  }, [mapaDestaque]);

  return (
    <div className="bioma-mapa-wrap" ref={wrapRef}>
      {indisponivel && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cor-texto-suave)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
          Mapa indisponível no momento
        </div>
      )}
    </div>
  );
}

function TimelineSecao({ linhaDoTempo }) {
  const wrapRef = useRef(null);
  const [progresso, setProgresso] = useState(0);
  const [itemVistos, setItemVistos] = useState([]);

  useEffect(() => {
    function atualizar() {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const alturaVisivel = window.innerHeight * 0.7;
      const p = Math.min(Math.max((alturaVisivel - rect.top) / rect.height, 0), 1);
      setProgresso(p);
      setItemVistos(linhaDoTempo.map((_, i) => p >= i / linhaDoTempo.length));
    }
    document.addEventListener('scroll', atualizar, { passive: true });
    atualizar();
    return () => document.removeEventListener('scroll', atualizar);
  }, [linhaDoTempo]);

  return (
    <div className="timeline-wrap" ref={wrapRef}>
      <div className="timeline-progresso" style={{ height: `${progresso * 100}%` }}></div>
      {linhaDoTempo.map((t, i) => (
        <div className={`timeline-item ${itemVistos[i] ? 'em-vista' : ''}`} key={i}>
          <div className="periodo">{t.periodo}</div>
          <h3>{t.titulo}</h3>
          <p>{t.texto}</p>
        </div>
      ))}
    </div>
  );
}

function EspecieCard({ item, tipo, onAbrir }) {
  const emoji = tipo === 'fauna' ? '🐾' : '🌿';
  return (
    <button className="especie-card" onClick={() => onAbrir(item, tipo)}>
      <div className="especie-emoji">{emoji}</div>
      <div className="especie-corpo">
        <h3>{item.nome}</h3>
        <span className="cientifico">{item.cientifico}</span>
        <p className="desc">{item.desc || item.papel}</p>
        {item.status && <span className="status-tag">{item.status}</span>}
      </div>
    </button>
  );
}

function ModalEspecie({ item, tipo, onFechar }) {
  if (!item) return null;
  return (
    <div className="especie-modal-overlay aberto" onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="especie-modal" role="dialog" aria-modal="true">
        <button className="especie-modal-fechar" aria-label="Fechar" onClick={onFechar}>×</button>
        <h3>{item.nome}</h3>
        <span className="cientifico">{item.cientifico}</span>
        {tipo === 'fauna' && item.status && (
          <span className="status-tag" style={{ marginBottom: '16px', display: 'inline-block' }}>{item.status}</span>
        )}
        {tipo === 'fauna' && (
          <React.Fragment>
            <div className="campo"><div className="rotulo">Habitat</div><p>{item.habitat}</p></div>
            <div className="campo"><div className="rotulo">Alimentação</div><p>{item.dieta}</p></div>
          </React.Fragment>
        )}
        <div className="campo"><div className="rotulo">Papel ecológico</div><p>{item.papel}</p></div>
        <div className="campo"><div className="rotulo">Você sabia?</div><p>{item.curiosidade}</p></div>
      </div>
    </div>
  );
}

function RedeDeVida({ rede }) {
  const [ativo, setAtivo] = useState(null); // ex: "produtores:2"

  function alternar(camada, idx) {
    const chave = `${camada}:${idx}`;
    setAtivo((atual) => (atual === chave ? null : chave));
  }

  const camadas = [
    ['Produtores', 'produtores', rede.produtores],
    ['Herbívoros', 'herbivoros', rede.herbivoros],
    ['Predadores', 'predadores', rede.predadores],
    ['Decompositores', 'decompositores', rede.decompositores],
  ];

  return (
    <div className={`rede-vida-wrap ${ativo ? 'selecionado' : ''}`}>
      {camadas.map(([rotulo, chaveCamada, itens], i) => (
        <React.Fragment key={chaveCamada}>
          <div className="rede-vida-camada">
            <div className="rotulo-camada">{rotulo}</div>
            <div className="rede-vida-itens">
              {itens.map((nome, idx) => (
                <button
                  key={idx}
                  className={`rede-vida-item ${ativo === `${chaveCamada}:${idx}` ? 'ativo' : ''}`}
                  onClick={() => alternar(chaveCamada, idx)}
                >
                  {nome}
                </button>
              ))}
            </div>
          </div>
          {i < camadas.length - 1 && <div className="rede-vida-seta">↓</div>}
        </React.Fragment>
      ))}
    </div>
  );
}

function FatoCard({ texto }) {
  const [aberto, setAberto] = useState(false);
  return (
    <button className={`fato-card ${aberto ? 'aberto' : ''}`} onClick={() => setAberto((a) => !a)}>
      <span className="fato-pergunta">Você sabia?</span>
      <span className="fato-resposta">{texto}</span>
    </button>
  );
}

function SomBioma({ som }) {
  const [tocando, setTocando] = useState(false);
  return (
    <div className={`som-card ${tocando ? 'tocando' : ''}`}>
      <button
        className="som-botao"
        aria-pressed={tocando}
        aria-label="Ativar som ambiente"
        onClick={() => setTocando((t) => !t)}
      >
        {tocando ? '❚❚' : '▶'}
      </button>
      <div className="som-onda"><span></span><span></span><span></span><span></span><span></span></div>
      <div className="som-texto">
        <div className="titulo">{som.label}</div>
        <div className="descricao">Ambiente com {som.descricao}. O som nunca é ativado automaticamente.</div>
      </div>
    </div>
  );
}

function ExploracaoBarra({ totalSecoes, secoesRef }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const vistas = new Set();
    const observer = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => e.isIntersecting && vistas.add(e.target));
        setPct(Math.round((vistas.size / totalSecoes) * 100));
      },
      { threshold: 0.3 }
    );
    secoesRef.current.forEach((s) => s && observer.observe(s));
    return () => observer.disconnect();
  }, [totalSecoes, secoesRef]);

  return (
    <div className="exploracao-card">
      <h2>Você está explorando este bioma.</h2>
      <div className="exploracao-barra"><div className="exploracao-barra-fill" style={{ width: `${pct}%` }}></div></div>
      <div className="exploracao-legenda">{pct}% do conteúdo visto</div>
    </div>
  );
}

function App({ bioma }) {
  const [especieAberta, setEspecieAberta] = useState(null); // { item, tipo }
  const secoesRef = useRef([]);
  secoesRef.current = [];
  const registrarSecao = (el) => el && secoesRef.current.push(el);

  // Cor de destaque do bioma vira variável CSS, igual o script original fazia
  useEffect(() => {
    document.documentElement.style.setProperty('--cor-bioma', bioma.corDestaque);
    document.title = `${bioma.nome} — GiraBrasil`;
  }, [bioma]);

  // Barra de progresso de leitura no topo da página inteira
  useEffect(() => {
    const fill = document.getElementById('progresso-fill');
    function atualizar() {
      const alturaTotal = document.documentElement.scrollHeight - window.innerHeight;
      const pct = alturaTotal > 0 ? (window.scrollY / alturaTotal) * 100 : 0;
      if (fill) fill.style.width = pct + '%';
    }
    document.addEventListener('scroll', atualizar, { passive: true });
    atualizar();
    return () => document.removeEventListener('scroll', atualizar);
  }, []);

  // Fecha o modal de espécie com Esc
  useEffect(() => {
    function aoTeclar(e) { if (e.key === 'Escape') setEspecieAberta(null); }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, []);

  const perfil = bioma.perfilVisual;
  const perfilLinhas = [
    ['Clima', perfil.clima], ['Vegetação', perfil.vegetacao], ['Fauna', perfil.fauna],
    ['Flora', perfil.flora], ['Água', perfil.agua], ['Presença humana', perfil.presencaHumana],
    ['Pressões ambientais', perfil.pressoesAmbientais],
  ];

  const totalSecoes = 16; // mesmo número de .bioma-secao rastreadas abaixo

  return (
    <React.Fragment>

      <section className="bioma-hero">
        <div className="bioma-hero-imagem"><img src={bioma.heroImagem} alt={`Paisagem do bioma ${bioma.nome}`} /></div>
        <div className="bioma-hero-conteudo">
          <div className="eyebrow claro">{bioma.categoria}</div>
          <h1>{bioma.nome}</h1>
          <p className="bioma-subtitulo">“{bioma.subtitulo}”</p>
          <div className="bioma-localizacao">📍 {bioma.localizacao}</div>
        </div>
        <div className="bioma-scroll-indicador"><span>Explorar</span><span className="linha"></span></div>
      </section>

      <section className="bioma-secao" ref={registrarSecao}>
        <p style={{ color: 'var(--cor-texto-suave)', maxWidth: '60ch', marginBottom: '32px' }}>{bioma.descricao}</p>
        <div className="bioma-stats-grid">
          {bioma.stats.map((s, i) => <StatCard stat={s} key={i} />)}
        </div>
      </section>

      <section className="bioma-secao" ref={registrarSecao}>
        <div className="bioma-secao-cabecalho" style={{ marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
          <div className="eyebrow">GEOGRAFIA</div>
          <h2>Onde esse bioma está</h2>
          <p style={{ marginLeft: 'auto', marginRight: 'auto' }}>{bioma.localizacao} concentra a maior parte da área deste bioma no Brasil.</p>
        </div>
        <MapaBioma mapaDestaque={bioma.mapaDestaque} />
        <div className="bioma-mapa-legenda"><span className="ponto"></span> Área de maior concentração do bioma</div>
      </section>

      <section className="bioma-secao fundo-alt" ref={registrarSecao}>
        <div className="bioma-secao-inner">
          <div className="bioma-secao-cabecalho">
            <div className="eyebrow">HISTÓRIA NATURAL</div>
            <h2>Como esse bioma surgiu?</h2>
            <p>Uma linha do tempo, em grandes escalas de tempo, sobre a formação deste ecossistema.</p>
          </div>
          <TimelineSecao linhaDoTempo={bioma.linhaDoTempo} />
        </div>
      </section>

      <section className="bioma-secao" ref={registrarSecao}>
        <div className="bioma-secao-cabecalho">
          <div className="eyebrow">LINHA DO TEMPO</div>
          <h2>O bioma através do tempo</h2>
        </div>
        <div className="ppf-grid">
          <div className="ppf-card passado"><span className="rotulo">Passado</span><p>{bioma.passadoPresenteFuturo.passado}</p></div>
          <div className="ppf-card presente"><span className="rotulo">Presente</span><p>{bioma.passadoPresenteFuturo.presente}</p></div>
          <div className="ppf-card futuro"><span className="rotulo">Futuro possível</span><p>{bioma.passadoPresenteFuturo.futuro}</p></div>
        </div>
      </section>

      <section className="bioma-secao fundo-alt" ref={registrarSecao}>
        <div className="bioma-secao-inner">
          <div className="bioma-secao-cabecalho">
            <div className="eyebrow">BIODIVERSIDADE</div>
            <h2>Quem vive aqui?</h2>
            <p>Algumas espécies representativas da fauna deste bioma. Clique em um card para saber mais.</p>
          </div>
          <div className="bioma-cards-grid">
            {bioma.fauna.map((f, i) => (
              <EspecieCard item={f} tipo="fauna" key={i} onAbrir={(item, tipo) => setEspecieAberta({ item, tipo })} />
            ))}
          </div>
        </div>
      </section>

      <section className="bioma-secao" ref={registrarSecao}>
        <div className="bioma-secao-cabecalho">
          <div className="eyebrow">BIODIVERSIDADE</div>
          <h2>A vida que cresce aqui</h2>
          <p>Plantas e árvores que caracterizam a paisagem deste bioma.</p>
        </div>
        <div className="bioma-cards-grid">
          {bioma.flora.map((f, i) => (
            <EspecieCard item={f} tipo="flora" key={i} onAbrir={(item, tipo) => setEspecieAberta({ item, tipo })} />
          ))}
        </div>
      </section>

      <section className="bioma-secao fundo-alt" ref={registrarSecao}>
        <div className="bioma-secao-inner">
          <div className="bioma-secao-cabecalho">
            <div className="eyebrow">ECOSSISTEMA</div>
            <h2>Uma rede de vida</h2>
            <p>Clique em um organismo para ver como ele se destaca na cadeia alimentar.</p>
          </div>
          <RedeDeVida rede={bioma.redeDeVida} />
        </div>
      </section>

      <section className="bioma-secao" ref={registrarSecao}>
        <div className="bioma-secao-cabecalho">
          <div className="eyebrow">CONSERVAÇÃO</div>
          <h2>O que ameaça este bioma?</h2>
        </div>
        <div className="ameacas-grid">
          {bioma.ameacas.map((a, i) => (
            <div className="ameaca-card" key={i}>
              <div className="icone">{a.icone}</div>
              <div><h3>{a.titulo}</h3><p>{a.texto}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="bioma-secao fundo-alt" ref={registrarSecao}>
        <div className="bioma-secao-inner">
          <div className="bioma-secao-cabecalho">
            <div className="eyebrow">CULTURA E TERRITÓRIO</div>
            <h2>Ser humano e bioma</h2>
          </div>
          <div className="humano-grid">
            <div className="humano-texto"><p>{bioma.serHumano.texto}</p></div>
            <ul className="humano-pontos">
              {bioma.serHumano.pontos.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="bioma-secao" ref={registrarSecao}>
        <div className="bioma-secao-cabecalho">
          <div className="eyebrow">AÇÃO POSITIVA</div>
          <h2>Como podemos proteger?</h2>
        </div>
        <div className="conservacao-grid">
          {bioma.conservacao.map((c, i) => (
            <div className="conservacao-card" key={i}>
              <span className="icone">{c.icone}</span>
              <h3>{c.titulo}</h3>
              <p>{c.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bioma-secao fundo-alt" ref={registrarSecao}>
        <div className="bioma-secao-inner">
          <div className="bioma-secao-cabecalho">
            <div className="eyebrow">CURIOSIDADES</div>
            <h2>Você sabia?</h2>
            <p>Clique em cada card para revelar o fato.</p>
          </div>
          <div className="fatos-grid">
            {bioma.curiosidades.map((f, i) => <FatoCard texto={f} key={i} />)}
          </div>
        </div>
      </section>

      <section className="bioma-secao" ref={registrarSecao}>
        <div className="bioma-secao-cabecalho">
          <div className="eyebrow">EXPERIÊNCIA SENSORIAL</div>
          <h2>Ouça este bioma</h2>
        </div>
        <SomBioma som={bioma.som} />
      </section>

      <section className="bioma-secao fundo-alt" ref={registrarSecao}>
        <div className="bioma-secao-inner">
          <div className="bioma-secao-cabecalho">
            <div className="eyebrow">RESUMO</div>
            <h2>Perfil visual do bioma</h2>
          </div>
          <div className="perfil-grid">
            {perfilLinhas.map(([r, v], i) => (
              <div className="perfil-linha" key={i}><span className="rotulo">{r}</span><span className="valor">{v}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="bioma-secao" ref={registrarSecao}>
        <ExploracaoBarra totalSecoes={totalSecoes} secoesRef={secoesRef} />
      </section>

      <section className="bioma-secao" ref={registrarSecao}>
        <div className="bioma-secao-cabecalho">
          <div className="eyebrow">CONTINUE EXPLORANDO</div>
          <h2>Outros biomas brasileiros</h2>
        </div>
        <div className="relacionados-grid">
          {bioma.relacionados.map((slugRel) => {
            const rel = window.BIOMAS[slugRel];
            if (!rel) return null;
            return (
              <a href={`${rel.slug}.html`} className="card-bioma-completo" key={slugRel}>
                <div className="fundo-imagem"><img src={rel.heroImagem} alt={`Paisagem do bioma ${rel.nome}`} /></div>
                <div className="card-bioma-completo-conteudo">
                  <h3>{rel.nome}</h3>
                  <div className="tagline">{rel.subtitulo}</div>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <ModalEspecie
        item={especieAberta?.item}
        tipo={especieAberta?.tipo}
        onFechar={() => setEspecieAberta(null)}
      />

    </React.Fragment>
  );
}

// -------------------- Ponto de entrada --------------------
(function () {
  const slug = document.body.dataset.bioma;
  const bioma = window.BIOMAS && window.BIOMAS[slug];
  const root = document.getElementById('bioma-root');

  if (!bioma || !root) {
    root.innerHTML = '<div style="padding:120px 32px;text-align:center;color:var(--cor-texto-suave)">Bioma não encontrado.</div>';
    return;
  }

  const raizReact = ReactDOM.createRoot(root);
  raizReact.render(<App bioma={bioma} />);
})();
