// ============================================================================
// Gira-Brasil — leitura de notícia regional
//
// Este é o único molde React usado pelas páginas individuais regionais.
// A URL fornece apenas a região e o id; todos os dados da matéria continuam
// vindo da API. O componente preserva os dados próprios de cada notícia.
// ============================================================================

const { useEffect, useState } = React;

const parametrosUrl = new URLSearchParams(window.location.search);
const regiaoChaveUrl = parametrosUrl.get('regiao');
const idUrl = Number.parseInt(parametrosUrl.get('id'), 10);
const regiaoInfo = (window.REGIOES || {})[regiaoChaveUrl];

function normalizarTexto(texto) {
  return (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function limparReferenciaEditorial(texto) {
  return String(texto || '')
    .replace(/\s*Fonte\s*:\s*fonte\s*consultada\.?/gi, '')
    .replace(/\s*Fonte\s+original\s*:?[^.]*\.?/gi, '')
    .replace(/Gira-Brasil/gi, 'a reportagem')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function formatarData(iso) {
  if (!iso) return '';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleDateString('pt-BR');
}

function formatarDataComentario(iso) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  const diffMs = Date.now() - data.getTime();
  if (diffMs < 60 * 1000) return 'agora';
  return data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

function caminhoImagemDe(imagem) {
  if (!imagem) return '';
  const valor = String(imagem).trim();
  return /^https?:\/\//i.test(valor) ? valor : `../${valor.replace(/^\/+/, '')}`;
}

function urlExternaSegura(url) {
  if (!url) return '';
  try {
    const valor = new URL(String(url), window.location.origin);
    if (valor.protocol === 'http:' || valor.protocol === 'https:') return valor.href;
  } catch (_) {}
  return '';
}

function obterUsuarioSessao() {
  try {
    const bruto = localStorage.getItem('girabrasil_usuario');
    return bruto ? JSON.parse(bruto) : null;
  } catch (_) {
    return null;
  }
}

function obterIniciais(nome) {
  if (!nome) return '?';
  return nome.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
}

const PALAVRAS_BLOQUEADAS = [
  'puta', 'puto', 'merda', 'caralho', 'porra', 'viado',
  'vagabunda', 'vagabundo', 'arrombado', 'arrombada', 'fdp'
];

function contemOfensa(texto) {
  const normalizado = (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return PALAVRAS_BLOQUEADAS.some((termo) =>
    new RegExp('(^|\\W)' + termo + '(?=$|\\W)', 'i').test(normalizado)
  );
}

function obterBlocos(artigo) {
  let blocos = artigo?.corpo_json ?? artigo?.blocos;
  if (typeof blocos === 'string') {
    try { blocos = JSON.parse(blocos); } catch (_) { blocos = null; }
  }
  return Array.isArray(blocos) && blocos.length ? blocos : null;
}

function blocosDoConteudo(conteudo) {
  return String(conteudo || '')
    .split(/\n\s*\n/)
    .map((texto) => texto.trim())
    .filter(Boolean)
    .map((texto) => ({ tipo: 'paragrafo', texto }));
}

function localizarConteudoEditorial(noticia) {
  const lista = (window.REGIAO_NOTICIAS || {})[regiaoChaveUrl] || [];
  const alvo = normalizarTexto(noticia?.titulo);
  if (!alvo || !lista.length) return null;

  // Os IDs da API são os IDs reais do banco e não coincidem necessariamente
  // com os IDs editoriais antigos. Por isso a associação é feita pelo título.
  return lista.find((item) => normalizarTexto(item.titulo) === alvo)
    || lista.find((item) => {
      const titulo = normalizarTexto(item.titulo);
      return titulo.length > 45 && (alvo.includes(titulo) || titulo.includes(alvo));
    })
    || null;
}

function adaptarNoticia(noticia) {
  const metadados = noticia?.metadados || {};
  const editorial = localizarConteudoEditorial(noticia);

  // A API continua sendo a fonte de identidade e estado da notícia
  // (id, curtidas, salvo, imagem, etc.). O conteúdo editorial revisado
  // local só complementa/substitui texto quando existe uma versão curada.
  return {
    ...noticia,
    ...(editorial ? {
      titulo: editorial.titulo || noticia.titulo,
      resumo: editorial.resumo || noticia.resumo,
      categoria: editorial.categoria || noticia.categoria,
      bioma: editorial.bioma || noticia.bioma,
      corpo: Array.isArray(editorial.corpo) ? editorial.corpo : obterBlocos(noticia),
      link_fonte: editorial.linkFonte || noticia.link_fonte,
      autor: /Gira-Brasil/i.test(editorial?.autor || '') ? 'Redação' : (editorial.autor || metadados.autor || noticia.autor || 'Redação'),
      dataPublicacao: editorial.dataPublicacao || metadados.dataPublicacao || formatarData(noticia?.criado_em),
      dataAtualizacao: editorial.dataAtualizacao || metadados.dataAtualizacao || formatarData(noticia?.atualizado_em || noticia?.criado_em),
      tempoLeitura: editorial.tempoLeitura || metadados.tempoLeitura || '',
      legendaHero: limparReferenciaEditorial(editorial.legendaHero || metadados.legendaHero || ''),
    } : {
      imagem: noticia?.imagem_url || '',
      corpo: obterBlocos(noticia) || [],
      autor: metadados.autor || noticia?.autor || 'Redação',
      dataPublicacao: metadados.dataPublicacao || formatarData(noticia?.criado_em),
      dataAtualizacao: metadados.dataAtualizacao || formatarData(noticia?.atualizado_em || noticia?.criado_em),
      tempoLeitura: metadados.tempoLeitura || '',
      legendaHero: limparReferenciaEditorial(metadados.legendaHero || ''),
    }),
    imagem: noticia?.imagem_url || editorial?.imagem || '',
  };
}

function Icone({ nome, tamanho = 20 }) {
  const comum = {
    width: tamanho,
    height: tamanho,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  const desenhos = {
    curtir: <path d="M20.8 8.7c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z" />,
    comentario: <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.5-3A7.5 7.5 0 1 1 20 11.5Z" />,
    compartilhar: <><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M18 13v6H5V6h6" /></>,
    salvar: <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4Z" />,
    link: <><path d="M10 13.5a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 10.5a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 19.6l1.1-1.1" /></>,
    fechar: <><path d="m18 6-12 12" /><path d="M6 6l12 12" /></>,
  };

  return <svg {...comum}>{desenhos[nome] || desenhos.compartilhar}</svg>;
}

function RailAcoes({ curtido, salvo, curtidas, onCurtir, onSalvar, onCompartilhar, onIrComentarios, onFonteMenor, onFonteMaior }) {
  return (
    <aside className="rail" aria-label="Ações da notícia">
      <button className={`rail-btn ${curtido ? 'active' : ''}`} onClick={onCurtir} aria-pressed={curtido} aria-label="Curtir notícia">
        <Icone nome="curtir" />
        <span className="count">{curtidas > 0 ? `${curtidas} curtida${curtidas === 1 ? '' : 's'}` : 'Curtir'}</span>
      </button>
      <button className="rail-btn" onClick={onIrComentarios} aria-label="Ir para comentários">
        <Icone nome="comentario" /><span className="count">Comentar</span>
      </button>
      <button className="rail-btn" onClick={onCompartilhar} aria-label="Compartilhar">
        <Icone nome="compartilhar" /><span className="count">Compartilhar</span>
      </button>
      <button className={`rail-btn ${salvo ? 'active' : ''}`} onClick={onSalvar} aria-pressed={salvo} aria-label="Salvar notícia">
        <Icone nome="salvar" /><span className="count">Salvar</span>
      </button>
      <div className="rail-divider" />
      <button className="rail-btn small" onClick={onFonteMenor} aria-label="Diminuir tamanho do texto">A−</button>
      <button className="rail-btn small" onClick={onFonteMaior} aria-label="Aumentar tamanho do texto">A+</button>
    </aside>
  );
}

function RailMobile({ curtido, salvo, onCurtir, onSalvar, onCompartilhar, onIrComentarios }) {
  return (
    <div className="mobile-rail" aria-label="Ações da notícia">
      <button className={curtido ? 'active' : ''} onClick={onCurtir} aria-label="Curtir notícia" aria-pressed={curtido}><Icone nome="curtir" /></button>
      <button onClick={onIrComentarios} aria-label="Comentários"><Icone nome="comentario" /></button>
      <button onClick={onCompartilhar} aria-label="Compartilhar"><Icone nome="compartilhar" /></button>
      <button className={salvo ? 'active' : ''} onClick={onSalvar} aria-label="Salvar notícia" aria-pressed={salvo}><Icone nome="salvar" /></button>
    </div>
  );
}

function ModalCompartilhar({ aberto, onFechar }) {
  const [copiado, setCopiado] = useState(false);
  const url = window.location.href;
  const texto = document.title;

  async function copiarLink() {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else {
        const campo = document.createElement('textarea');
        campo.value = url;
        document.body.appendChild(campo);
        campo.select();
        document.execCommand('copy');
        campo.remove();
      }
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1800);
    } catch (erro) {
      console.error('Erro ao copiar link:', erro);
      mostrarToast('Não foi possível copiar o link.', 'erro');
    }
  }

  return (
    <div className={`modal-overlay ${aberto ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="share-modal" role="dialog" aria-modal="true" aria-labelledby="tituloCompartilhar">
        <div className="share-header">
          <h4 id="tituloCompartilhar">Compartilhar</h4>
          <button onClick={onFechar} aria-label="Fechar"><Icone nome="fechar" tamanho={18} /></button>
        </div>
        <div className="share-options">
          <button className="share-opt" onClick={copiarLink}><span className="ic"><Icone nome="link" /></span> Copiar link</button>
          <a className="share-opt" href={`https://wa.me/?text=${encodeURIComponent(`${texto} — ${url}`)}`} target="_blank" rel="noopener noreferrer"><span className="ic"><Icone nome="compartilhar" /></span> WhatsApp</a>
          <a className="share-opt" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer"><span className="ic"><Icone nome="compartilhar" /></span> X</a>
        </div>
        <div className={`copy-feedback ${copiado ? 'show' : ''}`}>Link copiado!</div>
      </div>
    </div>
  );
}

function Comentarios({ comentarios, carregando, erro, enviando, usuarioAtualId, onCurtirComentario, onEnviar, onExcluir }) {
  const [texto, setTexto] = useState('');

  function enviar() {
    if (!usuarioEstaLogado()) {
      abrirAvisoConta('Crie uma conta pra comentar nesta notícia.');
      return;
    }
    const limpo = texto.trim();
    if (!limpo) return;
    if (contemOfensa(limpo)) {
      mostrarToast('Seu comentário contém linguagem ofensiva. Revise o texto antes de publicar.', 'erro');
      return;
    }
    onEnviar(limpo);
    setTexto('');
  }

  return (
    <section className="comments" id="comentarios">
      <h2>Comentários</h2>
      <p className="sub">Compartilhe sua opinião sobre esta notícia.</p>

      <div className="comment-form">
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva um comentário..." aria-label="Escrever comentário" disabled={enviando} />
        <div className="comment-form-actions">
          <button onClick={enviar} disabled={enviando}>{enviando ? 'Enviando...' : 'Comentar'}</button>
        </div>
      </div>

      {carregando && <p className="sub">Carregando comentários...</p>}
      {!carregando && erro && <p className="sub">Não foi possível carregar os comentários agora. Tente recarregar a página.</p>}
      {!carregando && !erro && comentarios.length === 0 && <p className="sub">Ainda não há comentários nesta notícia. Seja o primeiro a comentar!</p>}

      {!carregando && !erro && comentarios.length > 0 && (
        <div className="comment-list">
          {comentarios.map((comentario) => (
            <div className="comment" key={comentario.id}>
              <div className="avatar">{obterIniciais(comentario.usuario_nome)}</div>
              <div className="comment-content">
                <span className="name">{comentario.usuario_nome}</span>
                <span className="date">{formatarDataComentario(comentario.criado_em)}</span>
                <p>{comentario.conteudo}</p>
                <div className="comment-actions">
                  <button className={comentario.curtido_por_mim ? 'liked' : ''} onClick={() => onCurtirComentario(comentario.id)}>
                    {comentario.curtido_por_mim ? 'Curtido' : 'Curtir'} · {comentario.curtidas}
                  </button>
                  {usuarioAtualId && comentario.usuario_id === usuarioAtualId && (
                    <button className="comment-delete" onClick={() => onExcluir(comentario.id)}>Excluir</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


function rotuloDoDado(valor) {
  const v = String(valor).toLowerCase();
  if (v.includes('%')) return 'percentual';
  if (v.includes('km²') || v.includes('km2')) return 'área';
  if (v.includes('hectare') || v.includes(' ha')) return 'extensão territorial';
  if (v.includes('espéc')) return 'espécies';
  if (v.includes('município')) return 'municípios';
  if (v.includes('veículo')) return 'veículos';
  if (v.includes('tonelada') || v.includes('kg')) return 'volume';
  if (v.includes('litro')) return 'volume';
  if (v.includes('milhão') || v.includes('bilhão') || v.includes('mil')) return 'quantidade';
  if (v.includes('ano')) return 'período';
  return 'indicador';
}

function frasesDoTexto(blocos) {
  return (blocos || [])
    .filter((bloco) => bloco.tipo === 'paragrafo' && typeof bloco.texto === 'string')
    .flatMap((bloco) => bloco.texto.split(/(?<=[.!?])\s+/).map((frase) => frase.trim()))
    .filter((frase) => frase.length >= 45)
    .filter((frase, i, lista) => lista.findIndex((item) => normalizarTexto(item) === normalizarTexto(frase)) === i);
}

function extrairDestaquesNumericos(blocos) {
  const texto = (blocos || [])
    .filter((bloco) => bloco.tipo === 'paragrafo' || bloco.tipo === 'lista')
    .map((bloco) => Array.isArray(bloco.itens) ? bloco.itens.join(' ') : (bloco.texto || ''))
    .join(' ');

  const padrao = /\b\d+(?:[.,]\d+)?\s*(?:%|km²|km2|hectares?|ha|milhões?|milhão|bilhões?|bilhão|mil|toneladas?|kg|litros?|espécies|municípios|veículos|anos?)\b/gi;
  const encontrados = [];
  for (const match of texto.matchAll(padrao)) {
    const valor = match[0].replace(/\s+/g, ' ').trim();
    if (!encontrados.some((item) => item.toLowerCase() === valor.toLowerCase())) encontrados.push(valor);
    if (encontrados.length >= 4) break;
  }
  if (!encontrados.length) return null;

  return {
    tipo: 'estatisticas',
    itens: encontrados.slice(0, 3).map((valor) => ({ numero: valor, legenda: rotuloDoDado(valor) })),
  };
}

const CONTEXTO_POR_CATEGORIA = {
  'Desmatamento': 'Alertas de desmatamento indicam áreas que precisam de acompanhamento e fiscalização. Eles não significam, sozinhos, que toda a área alertada já tenha sido confirmada como desmatamento consolidado; o período e a metodologia do monitoramento são parte importante da leitura dos números.',
  'Clima': 'Previsões e registros climáticos precisam ser lidos considerando o período e a área analisados. Um cenário pode mudar com novas medições, mas os dados publicados ajudam a dimensionar tendências e impactos sobre cidades, rios, produção e comunidades.',
  'Clima e Meio Ambiente': 'Os indicadores ambientais ganham significado quando observados ao longo do tempo. Comparar períodos, áreas e condições anteriores ajuda a separar uma variação pontual de uma tendência que merece acompanhamento.',
  'Conservação': 'A criação, ampliação ou gestão de áreas protegidas influencia a forma como o território é utilizado. O resultado depende da proteção efetiva, do planejamento e da participação das comunidades que vivem no entorno.',
  'Biodiversidade': 'Números de espécies e registros de fauna ajudam a dimensionar a diversidade de cada bioma. Também permitem identificar áreas e grupos que podem exigir monitoramento, pesquisa e medidas de conservação.',
  'Fauna e Saúde': 'Quando uma ocorrência ambiental envolve animais e saúde pública, o acompanhamento contínuo é essencial. Monitoramento, prevenção e comunicação rápida ajudam a reduzir riscos e orientam as medidas adotadas pelas autoridades.',
  'Recursos Hídricos': 'Vazão, nível dos rios e disponibilidade de água variam conforme chuva, estação e condições da bacia. Por isso, uma medição isolada ganha mais sentido quando comparada com períodos anteriores e com a média esperada.',
  'Agricultura': 'Os indicadores agrícolas refletem a combinação entre clima, disponibilidade de água, condições do solo, tecnologia e decisões de produção. O mesmo número pode ter impactos diferentes conforme a cultura e o território analisados.',
  'Energia': 'Dados de geração, consumo e investimentos ajudam a entender como a transição energética está acontecendo na prática. Além do volume anunciado, importa observar capacidade instalada, prazo de execução e alcance territorial.',
  'Economia': 'Indicadores econômicos precisam ser comparados com uma base de referência. Percentuais de crescimento ou queda ganham significado quando acompanhados do período, do tamanho do mercado e dos fatores que explicam a variação.',
};

function enriquecerBlocos(blocos, artigo) {
  const filtrados = (blocos || []).filter((bloco) => {
    if ((bloco.tipo === 'titulo' || bloco.tipo === 'subtitulo') && /fonte e contexto/i.test(bloco.texto)) return false;
    if (bloco.tipo === 'regiao') return false;
    return true;
  }).map((bloco) => {
    if (typeof bloco.texto === 'string') return { ...bloco, texto: limparReferenciaEditorial(bloco.texto) };
    if (Array.isArray(bloco.itens)) return { ...bloco, itens: bloco.itens.map(limparReferenciaEditorial) };
    return bloco;
  });
  const fatosBase = frasesDoTexto(filtrados);
  const base = filtrados.map((bloco) => {
    if (bloco.tipo === 'lista') {
      const fatos = fatosBase.filter((frase) => /\d|%|km²|hectares?|municípios?|mil|milhão|bilhão/i.test(frase));
      if (fatos.length) return { ...bloco, itens: fatos.slice(0, 4) };
      return bloco;
    }
    return bloco;
  });

  const fatos = frasesDoTexto(base);
  const numericas = fatos.filter((frase) => /\d|%|km²|hectares?|municípios?|mil|milhão|bilhão/i.test(frase));
  const contexto = CONTEXTO_POR_CATEGORIA[artigo?.categoria] || 'Os números da reportagem devem ser lidos junto com o período, o território e a metodologia usados na apuração. Essa comparação ajuda a entender melhor o que mudou e evita interpretar um indicador isoladamente.';

  const resultado = [];
  let adicionouContexto = false;
  let adicionouAcompanhar = false;

  base.forEach((bloco) => {
    resultado.push(bloco);
    if (!adicionouContexto && bloco.tipo === 'paragrafo' && numericas.length > 1) {
      resultado.push({ tipo: 'titulo', id: 'sec-dados-contexto', texto: 'Os números em contexto' });
      resultado.push({ tipo: 'paragrafo', texto: `Os dados apresentados mostram mais de uma dimensão do mesmo cenário. ${numericas[0]} aparece no recorte principal da reportagem, enquanto ${numericas[1]} permite comparar ou dimensionar esse resultado. ${numericas[2] ? `O terceiro indicador, ${numericas[2]}, ajuda a completar essa leitura.` : ''}`.trim() });
      if (numericas[2]) resultado.push({ tipo: 'paragrafo', texto: `A comparação entre esses valores é mais útil do que observar um número isolado, porque mostra a escala do fenômeno e o período considerado na reportagem.` });
      adicionouContexto = true;
    }
    if (!adicionouAcompanhar && bloco.tipo === 'subtitulo' && /por que isso importa/i.test(bloco.texto)) {
      resultado.push({ tipo: 'paragrafo', texto: contexto });
      resultado.push({ tipo: 'titulo', id: 'sec-acompanhar', texto: 'O que acompanhar daqui para frente' });
      resultado.push({ tipo: 'paragrafo', texto: 'Novas medições e atualizações podem alterar o retrato apresentado hoje. O mais importante é observar se os próximos dados confirmam, ampliam ou reduzem a tendência registrada nesta reportagem, sempre mantendo o mesmo período e recorte territorial para a comparação.' });
      adicionouAcompanhar = true;
    }
  });

  return resultado;
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
          {(bloco.itens || []).map((item, j) => (
            <div className="stat-cell" key={j}>
              <span className="stat-num">{item.numero}</span>
              <span className="stat-label">{item.legenda}</span>
            </div>
          ))}
        </div>
      );
    case 'citacao':
      return (
        <div className="quote-block" key={i}>
          <blockquote>{bloco.texto}</blockquote>
          {bloco.autor && <cite>— {bloco.autor}</cite>}
        </div>
      );
    case 'regiao':
      return (
        <div className="region-card" key={i}>
          <span className="region-eyebrow">Esta notícia está relacionada</span>
          <h3 className="region-name">{bloco.nome}</h3>
          <p className="region-desc">{bloco.descricao}</p>
          {bloco.link && <a className="region-btn" href={bloco.link}>Explorar região →</a>}
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
  const [estado, setEstado] = useState('carregando');
  const [curtido, setCurtido] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [curtidas, setCurtidas] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [tocAtivo, setTocAtivo] = useState('');
  const [comentarios, setComentarios] = useState([]);
  const [carregandoComentarios, setCarregandoComentarios] = useState(true);
  const [erroComentarios, setErroComentarios] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  const noticiaId = artigo?.id;
  const blocosBrutos = artigo?.corpo?.length ? artigo.corpo : blocosDoConteudo(artigo?.conteudo);
  const blocosSemFonte = enriquecerBlocos(blocosBrutos, artigo);
  const destaques = extrairDestaquesNumericos(blocosSemFonte);
  const blocos = destaques && !blocosSemFonte.some((bloco) => bloco.tipo === 'estatisticas')
    ? [blocosSemFonte[0], destaques, ...blocosSemFonte.slice(1)]
    : blocosSemFonte;
  const sumario = blocos
    .filter((bloco) => (bloco.tipo === 'titulo' || bloco.tipo === 'subtitulo') && bloco.id)
    .map((bloco) => ({ id: bloco.id, titulo: bloco.texto }));

  useEffect(() => {
    if (Number.isNaN(idUrl)) {
      setEstado('erro');
      return;
    }

    async function carregar() {
      try {
        const usuario = obterUsuarioSessao();
        const queryUsuario = usuario?.id ? `?usuarioId=${encodeURIComponent(usuario.id)}` : '';
        const resposta = await fetch(`/api/noticias/${idUrl}${queryUsuario}`);
        if (!resposta.ok) throw new Error(`API respondeu ${resposta.status}`);
        const dados = await resposta.json();
        const noticia = Array.isArray(dados) ? dados[0] : dados;
        if (!noticia) throw new Error('Notícia vazia');
        setArtigo(adaptarNoticia(noticia));
        setEstado('ok');
      } catch (erro) {
        console.error('Erro ao carregar notícia regional:', erro);
        setEstado('erro');
      }
    }
    carregar();
  }, []);

  useEffect(() => {
    if (!regiaoInfo) return;

    async function carregarOutras() {
      try {
        const respostaRegioes = await fetch('/api/regioes');
        if (!respostaRegioes.ok) throw new Error('Erro ao buscar regiões');
        const regioes = await respostaRegioes.json();
        const regiao = regioes.find((item) => normalizarTexto(item.nome) === normalizarTexto(regiaoInfo.nome));
        if (!regiao) return;

        const respostaNoticias = await fetch(`/api/noticias?regiao=${regiao.id}`);
        if (!respostaNoticias.ok) throw new Error('Erro ao buscar notícias da região');
        const lista = await respostaNoticias.json();
        setOutras(lista.filter((noticia) => noticia.id !== idUrl).slice(0, 3));
      } catch (erro) {
        console.error('Erro ao carregar notícias relacionadas:', erro);
      }
    }

    carregarOutras();
  }, []);

  useEffect(() => {
    if (!noticiaId) {
      setCarregandoComentarios(false);
      return;
    }

    const usuario = obterUsuarioSessao();
    const queryUsuario = usuario?.id ? `?usuarioId=${encodeURIComponent(usuario.id)}` : '';
    setCarregandoComentarios(true);
    setErroComentarios(false);

    fetch(`/api/comentarios/noticia/${noticiaId}${queryUsuario}`)
      .then((resposta) => {
        if (!resposta.ok) throw new Error('Erro ao buscar comentários');
        return resposta.json();
      })
      .then(setComentarios)
      .catch((erro) => {
        console.error('Erro ao carregar comentários:', erro);
        setErroComentarios(true);
      })
      .finally(() => setCarregandoComentarios(false));
  }, [noticiaId]);

  useEffect(() => {
    if (!artigo) return;
    document.title = `${artigo.titulo} — Gira-Brasil`;
    setCurtido(!!artigo.curtido_por_mim);
    setSalvo(!!artigo.salvo_por_mim);
    setCurtidas(Number(artigo.curtidas) || 0);
  }, [artigo?.id]);

  useEffect(() => {
    document.documentElement.style.setProperty('--reading-scale', fontScale);
    return () => document.documentElement.style.removeProperty('--reading-scale');
  }, [fontScale]);

  useEffect(() => {
    const progressFill = document.getElementById('progressFill');

    function atualizar() {
      const artigoEl = document.querySelector('.article-body');
      if (progressFill && artigoEl) {
        const total = Math.max(artigoEl.offsetHeight - window.innerHeight, 1);
        const rolado = Math.min(Math.max(-artigoEl.getBoundingClientRect().top, 0), total);
        progressFill.style.width = `${(rolado / total) * 100}%`;
      }

      let atual = null;
      sumario.forEach((item) => {
        const elemento = document.getElementById(item.id);
        if (elemento && elemento.getBoundingClientRect().top < 140) atual = item.id;
      });
      setTocAtivo(atual);
    }

    document.addEventListener('scroll', atualizar, { passive: true });
    atualizar();
    return () => document.removeEventListener('scroll', atualizar);
  }, [artigo?.id, sumario.length]);

  function alternarCurtida() {
    if (!usuarioEstaLogado()) {
      abrirAvisoConta('Crie uma conta pra curtir esta notícia.');
      return;
    }
    if (!noticiaId) return;

    const estadoAnterior = { curtido, curtidas };
    setCurtido(!curtido);
    setCurtidas((valor) => Math.max(0, valor + (curtido ? -1 : 1)));

    fetchAutenticado(`/api/noticias/${noticiaId}/curtir`, { method: 'POST' })
      .then((resposta) => {
        if (!resposta.ok) throw new Error('Erro ao curtir notícia');
        return resposta.json();
      })
      .then((resultado) => {
        setCurtido(!!resultado.curtidoPorMim);
        setCurtidas(Number(resultado.curtidas) || 0);
      })
      .catch((erro) => {
        console.error('Erro ao curtir notícia:', erro);
        setCurtido(estadoAnterior.curtido);
        setCurtidas(estadoAnterior.curtidas);
      });
  }

  function alternarSalvar() {
    if (!usuarioEstaLogado()) {
      abrirAvisoConta('Crie uma conta pra salvar reportagens e ler depois.');
      return;
    }
    if (!noticiaId) return;

    const estadoAnterior = salvo;
    setSalvo(!salvo);

    fetchAutenticado(`/api/noticias/${noticiaId}/salvar`, { method: 'POST' })
      .then((resposta) => {
        if (!resposta.ok) throw new Error('Erro ao salvar notícia');
        return resposta.json();
      })
      .then((resultado) => setSalvo(!!resultado.salvoPorMim))
      .catch((erro) => {
        console.error('Erro ao salvar notícia:', erro);
        setSalvo(estadoAnterior);
      });
  }

  function irParaComentarios() {
    document.getElementById('comentarios')?.scrollIntoView({ behavior: 'smooth' });
  }

  function compartilhar() {
    if (navigator.share) {
      navigator.share({ title: artigo?.titulo || document.title, text: artigo?.resumo || '', url: window.location.href }).catch(() => {});
      return;
    }
    setModalAberto(true);
  }

  function curtirComentario(id) {
    if (!usuarioEstaLogado()) {
      abrirAvisoConta('Crie uma conta pra curtir comentários.');
      return;
    }

    setComentarios((lista) => lista.map((comentario) => {
      if (comentario.id !== id) return comentario;
      return {
        ...comentario,
        curtido_por_mim: !comentario.curtido_por_mim,
        curtidas: Math.max(0, comentario.curtidas + (comentario.curtido_por_mim ? -1 : 1)),
      };
    }));

    fetchAutenticado(`/api/comentarios/${id}/curtir`, { method: 'POST' })
      .then((resposta) => {
        if (!resposta.ok) throw new Error('Erro ao curtir comentário');
        return resposta.json();
      })
      .then((resultado) => setComentarios((lista) => lista.map((comentario) =>
        comentario.id === id
          ? { ...comentario, curtido_por_mim: resultado.curtidoPorMim, curtidas: resultado.curtidas }
          : comentario
      )))
      .catch((erro) => {
        console.error('Erro ao curtir comentário:', erro);
        setComentarios((lista) => lista.map((comentario) => {
          if (comentario.id !== id) return comentario;
          return {
            ...comentario,
            curtido_por_mim: !comentario.curtido_por_mim,
            curtidas: Math.max(0, comentario.curtidas + (comentario.curtido_por_mim ? -1 : 1)),
          };
        }));
      });
  }

  function enviarComentario(texto) {
    if (!usuarioEstaLogado()) {
      abrirAvisoConta('Crie uma conta pra comentar nesta notícia.');
      return;
    }

    setEnviandoComentario(true);
    fetchAutenticado('/api/comentarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conteudo: texto, noticiaId }),
    })
      .then(async (resposta) => {
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro || 'Erro ao publicar comentário');
        setComentarios((lista) => [dados, ...lista]);
      })
      .catch((erro) => {
        console.error('Erro ao enviar comentário:', erro);
        mostrarToast(erro.message || 'Não foi possível publicar seu comentário.', 'erro');
      })
      .finally(() => setEnviandoComentario(false));
  }

  function excluirComentario(id) {
    const comentarioAnterior = comentarios.find((comentario) => comentario.id === id);
    if (!comentarioAnterior) return;

    confirmarAcao({
      titulo: 'Excluir comentário?',
      mensagem: 'Seu comentário será removido desta notícia. Essa ação não pode ser desfeita.',
      confirmar: 'Excluir',
      cancelar: 'Manter',
      perigo: true,
    }).then((confirmado) => {
      if (!confirmado) return;

      setComentarios((lista) => lista.filter((comentario) => comentario.id !== id));
      fetchAutenticado(`/api/comentarios/${id}`, { method: 'DELETE' })
        .then((resposta) => {
          if (!resposta.ok) throw new Error('Erro ao excluir comentário');
          mostrarToast('Comentário excluído.', 'sucesso');
        })
        .catch((erro) => {
          console.error('Erro ao excluir comentário:', erro);
          mostrarToast('Não foi possível excluir o comentário. Tente novamente.', 'erro');
          setComentarios((lista) => [...lista, comentarioAnterior].sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em)));
        });
    });
  }

  if (!regiaoInfo) return <Aviso>Região não encontrada.</Aviso>;
  if (estado === 'carregando') return <Aviso>Carregando notícia...</Aviso>;
  if (estado === 'erro' || !artigo) return <Aviso>Notícia não encontrada.</Aviso>;

  const imagem = caminhoImagemDe(artigo.imagem);
  const linkFonte = ''; // A fonte não é exibida na página; permanece apenas no dataset/API.

  return (
    <React.Fragment>
      <div className="breadcrumb">
        <a href="../index.html">Início</a><span className="sep">/</span>
        <a href={`${regiaoChaveUrl}.html`}>Região {regiaoInfo.nome}</a><span className="sep">/</span>
        <span className="current">{artigo.categoria || 'Notícia'}</span>
      </div>

      <header className="article-header">
        {artigo.categoria && <span className="category-badge">{artigo.categoria}</span>}
        <h1 className="headline">{artigo.titulo}</h1>
        {artigo.resumo && <p className="deck">{artigo.resumo}</p>}
        <div className="meta-row">
          {artigo.regiao_nome && <><span>{artigo.regiao_nome}</span><span className="meta-dot" /></>}
          {artigo.autor && <><span className="author">Por {artigo.autor}</span><span className="meta-dot" /></>}
          {artigo.dataPublicacao && <><span>{artigo.dataPublicacao}</span><span className="meta-dot" /></>}
          {artigo.dataAtualizacao && artigo.dataAtualizacao !== artigo.dataPublicacao && <><span>Atualizado em {artigo.dataAtualizacao}</span><span className="meta-dot" /></>}
          {artigo.tempoLeitura && <span>{artigo.tempoLeitura}</span>}
        </div>
      </header>

      {imagem && (
        <div className="hero">
          <div className="hero-frame">
            <img src={imagem} alt={artigo.titulo} />
          </div>
          {artigo.legendaHero && <p className="hero-caption">{artigo.legendaHero}</p>}
        </div>
      )}

      <div className="layout">
        <RailAcoes
          curtido={curtido}
          salvo={salvo}
          curtidas={curtidas}
          onCurtir={alternarCurtida}
          onSalvar={alternarSalvar}
          onCompartilhar={compartilhar}
          onIrComentarios={irParaComentarios}
          onFonteMenor={() => setFontScale((valor) => Math.max(valor - 0.1, 0.85))}
          onFonteMaior={() => setFontScale((valor) => Math.min(valor + 0.1, 1.3))}
        />

        <article className="article-body">
          {blocos.map((bloco, i) => renderBloco(bloco, i))}

        </article>

        <aside className="sidebar">
          {sumario.length > 0 && (
            <div className="side-block">
              <div className="side-title">Neste artigo</div>
              <ul className="toc-list">
                {sumario.map((item) => (
                  <li key={item.id}><a href={`#${item.id}`} className={tocAtivo === item.id ? 'active' : ''}>{item.titulo}</a></li>
                ))}
              </ul>
            </div>
          )}
          {outras.slice(0, 2).map((noticia) => (
            <a className="side-article" href={`noticia-regiao.html?regiao=${regiaoChaveUrl}&id=${noticia.id}`} key={noticia.id}>
              {caminhoImagemDe(noticia.imagem_url) && <img src={caminhoImagemDe(noticia.imagem_url)} alt="" />}
              <div><div className="cat">{noticia.categoria}</div><div className="t">{noticia.titulo}</div></div>
            </a>
          ))}
        </aside>
      </div>

      <div className="engagement">
        <p>Você gostou desta notícia?</p>
        <div className="engage-actions">
          <button className={`pill-btn ${curtido ? 'active' : ''}`} onClick={alternarCurtida}><Icone nome="curtir" /> {curtido ? `Curtido${curtidas > 0 ? ` (${curtidas})` : ''}` : 'Gostei'}</button>
          <button className={`pill-btn ${salvo ? 'active' : ''}`} onClick={alternarSalvar}><Icone nome="salvar" /> {salvo ? 'Salvo' : 'Salvar notícia'}</button>
          <button className="pill-btn" onClick={compartilhar}><Icone nome="compartilhar" /> Compartilhar</button>
        </div>
      </div>

      {outras.length > 0 && (
        <section className="related">
          <span className="section-label">Continue lendo</span>
          <h2>Mais notícias da Região {regiaoInfo.nome}</h2>
          <div className="related-grid">
            {outras.map((noticia) => (
              <a className="news-card" href={`noticia-regiao.html?regiao=${regiaoChaveUrl}&id=${noticia.id}`} key={noticia.id}>
                <div className="thumb">{caminhoImagemDe(noticia.imagem_url) && <img src={caminhoImagemDe(noticia.imagem_url)} alt={noticia.titulo} />}</div>
                <div className="body">
                  <span className="cat">{noticia.categoria}</span>
                  <h3>{noticia.titulo}</h3>
                  {noticia.resumo && <p>{noticia.resumo}</p>}
                  <span className="meta">{formatarData(noticia.criado_em)}</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <Comentarios
        comentarios={comentarios}
        carregando={carregandoComentarios}
        erro={erroComentarios}
        enviando={enviandoComentario}
        usuarioAtualId={obterUsuarioSessao()?.id || null}
        onCurtirComentario={curtirComentario}
        onEnviar={enviarComentario}
        onExcluir={excluirComentario}
      />



      <div className="back-link">
        <a href={`${regiaoChaveUrl}.html`} className="link-voltar"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5"></path><path d="m12 19-7-7 7-7"></path></svg> Voltar para Região {regiaoInfo.nome}</a>
      </div>

      <RailMobile curtido={curtido} salvo={salvo} onCurtir={alternarCurtida} onSalvar={alternarSalvar} onCompartilhar={compartilhar} onIrComentarios={irParaComentarios} />
      <ModalCompartilhar aberto={modalAberto} onFechar={() => setModalAberto(false)} />
    </React.Fragment>
  );
}

const raizNoticiaRegiaoEl = document.getElementById('noticia-regiao-root');
if (raizNoticiaRegiaoEl) ReactDOM.createRoot(raizNoticiaRegiaoEl).render(<App />);
