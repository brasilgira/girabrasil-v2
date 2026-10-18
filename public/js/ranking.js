// GiraBrasil — Página Ranking
//
// Lê o ranking REAL do backend (GET /api/ranking/...) e monta a tela. Nada aqui
// calcula ou inventa pontuação: o navegador só exibe o que o servidor devolve.
//
// Endpoints usados:
//   GET /api/ranking/destaques   -> 1º de cada jogo + nº de jogadores (público)
//   GET /api/ranking/:jogo       -> classificação do jogo (público)
//   GET /api/ranking/:jogo/meu   -> posição de quem está logado (precisa de token)
(function () {
  'use strict';

  // ── PRÊMIOS ────────────────────────────────────────────────────────────
  // Texto opcional do prêmio de cada jogo, exibido no cartão da seção
  // "Prêmios". Deixe '' enquanto a equipe não definir. Exemplo:
  //   sapo: 'Kit de livros sobre a fauna brasileira',
  const PREMIOS = {
    sapo: '',
    onca: '',
    mico: '',
  };

  const JOGOS = {
    sapo: {
      apelido: 'Sapo',
      nome: 'De Volta ao Rio',
      unidade: 'm',
      regra: 'Vale a distância que o sapo percorre até ser atropelado, cair na água ou ficar para trás.',
    },
    onca: {
      apelido: 'Onça',
      nome: 'Fuga pela Floresta',
      unidade: 'm',
      regra: 'Vale a distância que a onça-pintada percorre fugindo do desmatamento, até ser capturada.',
    },
    mico: {
      apelido: 'Mico',
      nome: 'Jogo do Mico',
      unidade: 'pontos',
      regra: 'Vale a pontuação acumulada até a última rodada vencida. Ficar com o Mico zera a jogada.',
    },
  };
  const ORDEM = ['sapo', 'onca', 'mico'];

  const LIMITE = 50;          // posições pedidas ao servidor
  const VALIDADE_MS = 20000;  // quanto tempo reaproveitar um ranking já carregado

  const $ = (seletor) => document.querySelector(seletor);
  const abas = Array.from(document.querySelectorAll('.rk-aba'));
  const painel = $('#rk-painel');
  const areaQuadro = $('#rk-quadro');
  const areaMeu = $('#rk-meu');
  const statusEl = $('#rk-status');

  const cache = new Map();   // jogo -> { quando, rank, meu }
  let destaques = null;      // resposta de /destaques (ou null se falhou)
  let jogoAtual = null;
  let sequencia = 0;         // descarta respostas de abas que já foram trocadas
  let primeiraVez = true;

  // ── utilitários de DOM (sempre textContent: nome de jogador é texto do usuário) ──
  function h(tag, atributos, ...filhos) {
    const no = document.createElement(tag);
    if (atributos) {
      for (const [chave, valor] of Object.entries(atributos)) {
        if (valor === null || valor === undefined || valor === false) continue;
        if (chave === 'class') no.className = valor;
        else if (chave === 'text') no.textContent = valor;
        else if (chave.startsWith('on')) no.addEventListener(chave.slice(2), valor);
        else no.setAttribute(chave, valor === true ? '' : valor);
      }
    }
    filhos.flat().forEach((filho) => {
      if (filho === null || filho === undefined || filho === false) return;
      no.append(filho.nodeType ? filho : document.createTextNode(String(filho)));
    });
    return no;
  }

  function icone(id) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    const uso = document.createElementNS(ns, 'use');
    uso.setAttribute('href', '#' + id);
    svg.append(uso);
    return svg;
  }

  function limpar(no) { while (no.firstChild) no.removeChild(no.firstChild); }

  function iniciais(nome) {
    const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return '?';
    const primeira = partes[0][0];
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (primeira + ultima).toUpperCase();
  }

  function avatar(nome, url, pequeno) {
    const caixa = h('span', { class: 'rk-avatar' + (pequeno ? ' rk-avatar--p' : ''), 'aria-hidden': 'true' }, iniciais(nome));
    if (url) {
      const img = h('img', { alt: '', loading: 'lazy', decoding: 'async' });
      img.addEventListener('error', () => img.remove());
      img.src = typeof resolverCaminhoAvatar === 'function' ? resolverCaminhoAvatar(url) : url;
      caixa.append(img);
    }
    return caixa;
  }

  // ── formatação ──
  function numero(valor) { return Number(valor).toLocaleString('pt-BR'); }
  function unidadeDe(jogo, valor) {
    const u = JOGOS[jogo].unidade;
    if (u === 'm') return 'm';
    return valor === 1 ? 'ponto' : 'pontos';
  }
  function dataCurta(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/\./g, '');
  }
  function contagemTexto(total) {
    if (total === 0) return 'Sem jogadores';
    return total === 1 ? '1 jogador' : numero(total) + ' jogadores';
  }

  // ── rede ──
  async function buscarJson(url, autenticado) {
    const resposta = autenticado ? await fetchAutenticado(url) : await fetch(url);
    if (!resposta.ok) {
      const erro = new Error('HTTP ' + resposta.status);
      erro.status = resposta.status;
      throw erro;
    }
    return resposta.json();
  }

  function usuarioLogado() {
    return typeof obterUsuarioLogado === 'function' && !!obterUsuarioLogado();
  }

  // O desempenho do usuário nunca derruba o ranking: qualquer problema vira um
  // estado próprio dentro do cartão "Seu desempenho".
  async function buscarMeu(jogo) {
    if (!usuarioLogado()) return { estado: 'deslogado' };
    try {
      const dados = await buscarJson('/api/ranking/' + jogo + '/meu', true);
      return dados.posicao ? { estado: 'ok', ...dados } : { estado: 'sem-resultado' };
    } catch (erro) {
      if (erro.status === 401 || /autenticado/i.test(erro.message)) return { estado: 'deslogado' };
      return { estado: 'erro' };
    }
  }

  // ── blocos da tela ──
  // O quadro da esquerda tem sempre: cabeçalho, (pódio) e (lista que rola por dentro).
  function cabecalho(jogo, total) {
    const info = JOGOS[jogo];
    return h('div', { class: 'rk-quadro__cab' },
      h('div', null,
        h('div', { class: 'rk-rotulo', text: 'Classificação' + (total !== null ? ' · ' + contagemTexto(total) : '') }),
        h('h2', { id: 'rk-painel-titulo', text: info.nome }),
      ),
      h('p', { class: 'rk-quadro__regra', text: info.regra }),
    );
  }

  function renderizarCarregando(jogo) {
    limpar(areaQuadro);
    areaQuadro.append(
      cabecalho(jogo, null),
      h('div', { class: 'rk-esq-podio', 'aria-hidden': 'true' }, h('div', { class: 'rk-esq' }), h('div', { class: 'rk-esq' }), h('div', { class: 'rk-esq' })),
      h('div', { class: 'rk-esq-lista', 'aria-hidden': 'true' }, [1, 2, 3, 4, 5, 6, 7, 8].map(() => h('div', { class: 'rk-esq' }))),
    );
  }

  function cartaoPodio(jogo, linha, meuPosicao) {
    const eu = meuPosicao === linha.posicao;
    return h('li', { class: 'rk-podio__item', 'data-pos': linha.posicao },
      h('article', { class: 'rk-pos-card' + (eu ? ' rk-pos-card--eu' : ''), 'aria-label': linha.posicao + 'º lugar: ' + linha.nome },
        h('span', { class: 'rk-pos-card__numero', 'aria-hidden': 'true', text: linha.posicao }),
        avatar(linha.nome, linha.avatarUrl, false),
        h('div', { class: 'rk-pos-card__corpo' },
          h('p', { class: 'rk-pos-card__nome' }, linha.nome, eu ? h('span', { class: 'rk-voce', text: 'Você' }) : null),
          h('p', { class: 'rk-pos-card__pontos' }, numero(linha.pontuacao), h('span', { class: 'rk-pos-card__unidade', text: unidadeDe(jogo, linha.pontuacao) })),
        ),
      ),
    );
  }

  function cartaoVazio(posicao) {
    return h('li', { class: 'rk-podio__item', 'data-pos': posicao },
      h('article', { class: 'rk-pos-card rk-pos-card--vazio', 'aria-label': posicao + 'º lugar: vaga aberta' },
        h('span', { class: 'rk-pos-card__numero', 'aria-hidden': 'true', text: posicao }),
        h('p', { text: 'Vaga aberta' }),
      ),
    );
  }

  function renderizarPodio(jogo, rank, meuPosicao) {
    const itens = [1, 2, 3].map((pos) => {
      const linha = rank.classificacao.find((l) => l.posicao === pos);
      return linha ? cartaoPodio(jogo, linha, meuPosicao) : cartaoVazio(pos);
    });
    return h('ol', { class: 'rk-podio', 'aria-label': 'Três primeiros colocados' }, itens);
  }

  function renderizarTabela(jogo, rank, meuPosicao) {
    const resto = rank.classificacao.slice(3);
    if (!resto.length) {
      return h('div', { class: 'rk-lista rk-lista--vazia', text: 'Os demais colocados aparecem aqui.' });
    }
    const linhas = resto.map((linha) => {
      const eu = meuPosicao === linha.posicao;
      return h('tr', { class: eu ? 'eu' : null },
        h('td', { class: 'col-pos', text: linha.posicao }),
        h('td', null, h('div', { class: 'rk-linha-jogador' },
          avatar(linha.nome, linha.avatarUrl, true),
          h('span', { class: 'nome', text: linha.nome }),
          eu ? h('span', { class: 'rk-voce', text: 'Você' }) : null,
        )),
        h('td', { class: 'col-data', text: dataCurta(linha.atingidoEm) }),
        h('td', { class: 'col-pontos' }, numero(linha.pontuacao), h('small', { text: unidadeDe(jogo, linha.pontuacao) })),
      );
    });
    const tabela = h('table', { class: 'rk-tabela' },
      h('caption', { class: 'rk-sr', text: 'Classificação a partir da 4ª posição' }),
      h('thead', null, h('tr', null,
        h('th', { class: 'col-pos', scope: 'col', text: 'Pos.' }),
        h('th', { scope: 'col', text: 'Jogador' }),
        h('th', { class: 'col-data', scope: 'col', text: 'Recorde em' }),
        h('th', { class: 'col-pontos', scope: 'col', text: 'Pontuação' }),
      )),
      h('tbody', null, linhas),
    );
    const mostrando = rank.classificacao.length;
    const rodape = rank.total > mostrando
      ? h('p', { class: 'rk-lista__rodape', text: 'Mostrando os ' + numero(mostrando) + ' primeiros de ' + numero(rank.total) + ' jogadores.' })
      : null;
    return h('div', { class: 'rk-lista', tabindex: '0', 'aria-label': 'Lista de classificação, role para ver mais' }, tabela, rodape);
  }

  function linkJogar() {
    return h('a', { class: 'rk-botao', href: 'jogos.html' }, 'Ir para os jogos', icone('ic-seta'));
  }

  function renderizarVazio(jogo) {
    const info = JOGOS[jogo];
    const logado = usuarioLogado();
    return h('div', { class: 'rk-aviso' },
      h('div', { class: 'rk-aviso__icone' }, icone('ic-trofeu')),
      h('h3', { text: 'Ninguém pontuou no ' + info.apelido + ' ainda' }),
      h('p', { text: 'O 1º lugar está livre. Seu melhor resultado entra no ranking assim que você terminar uma partida.' }),
      h('ol', { class: 'rk-passos' },
        h('li', { text: logado ? 'Conta ativa' : 'Crie uma conta ou entre' }),
        h('li', { text: 'Jogue ' + info.nome }),
        h('li', { text: 'Termine a partida' }),
      ),
      h('div', { class: 'rk-aviso__acoes' },
        logado ? linkJogar() : h('a', { class: 'rk-botao', href: 'cadastro.html?redirect=ranking.html' }, 'Criar conta'),
        logado ? null : h('a', { class: 'rk-botao rk-botao--sec', href: 'login.html?redirect=ranking.html' }, 'Entrar'),
      ),
    );
  }

  function renderizarErro(jogo) {
    return h('div', { class: 'rk-aviso rk-aviso--erro', role: 'alert' },
      h('div', { class: 'rk-aviso__icone' }, icone('ic-alerta')),
      h('h3', { text: 'Não foi possível carregar o ranking' }),
      h('p', { text: 'Verifique sua conexão e tente de novo.' }),
      h('div', { class: 'rk-aviso__acoes' },
        h('button', { type: 'button', class: 'rk-botao', onclick: () => carregar(jogo, true) }, 'Tentar novamente'),
      ),
    );
  }

  function renderizarMeu(jogo, meu, rank) {
    const info = JOGOS[jogo];
    limpar(areaMeu);
    areaMeu.append(h('div', { class: 'rk-rotulo', text: 'Meu desempenho' }), h('h3', { id: 'rk-meu-titulo', text: info.apelido }));

    if (meu && meu.estado === 'carregando') {
      areaMeu.append(h('div', { class: 'rk-esq', style: 'height:64px;margin-top:14px', 'aria-hidden': 'true' }));
      return;
    }
    if (!meu || meu.estado === 'deslogado') {
      areaMeu.append(
        h('p', { class: 'rk-meu__texto', text: 'Entre na sua conta para ver sua posição e aparecer no ranking.' }),
        h('div', { class: 'rk-meu__acoes' },
          h('a', { class: 'rk-botao', href: 'login.html?redirect=ranking.html' }, 'Entrar'),
          h('a', { class: 'rk-botao rk-botao--sec', href: 'cadastro.html?redirect=ranking.html' }, 'Criar conta'),
        ),
      );
      return;
    }
    if (meu.estado === 'erro') {
      areaMeu.append(h('p', { class: 'rk-meu__texto', text: 'Não foi possível carregar o seu desempenho agora.' }));
      return;
    }
    if (meu.estado === 'sem-resultado') {
      areaMeu.append(
        h('p', { class: 'rk-meu__texto', text: 'Você ainda não pontuou no ' + info.apelido + '. Termine uma partida para entrar no ranking.' }),
        h('div', { class: 'rk-meu__acoes' }, linkJogar()),
      );
      return;
    }
    const lider = rank && rank.classificacao[0];
    let dica = null;
    if (meu.posicao === 1) dica = h('p', { class: 'rk-meu__texto' }, h('strong', { text: 'Você lidera o ranking.' }));
    else if (lider) dica = h('p', { class: 'rk-meu__texto' }, 'Supere ', h('strong', { text: numero(lider.pontuacao) + ' ' + unidadeDe(jogo, lider.pontuacao) }), ' para assumir o 1º lugar.');
    areaMeu.append(
      h('div', { class: 'rk-meu__valores' },
        h('span', { class: 'rk-meu__posicao', 'aria-label': 'Posição ' + meu.posicao, text: meu.posicao + 'º' }),
        h('span', { class: 'rk-meu__pontos' }, numero(meu.pontuacao), h('small', { text: unidadeDe(jogo, meu.pontuacao) })),
      ),
      h('p', { class: 'rk-meu__texto', text: 'Melhor resultado, em ' + dataCurta(meu.atingidoEm) + '. Empate: vence quem chegou primeiro.' }),
      dica,
    );
  }

  function marcarTroca() {
    areaQuadro.classList.remove('rk-troca');
    void areaQuadro.offsetWidth;
    areaQuadro.classList.add('rk-troca');
  }

  function renderizarPainel(jogo, dados) {
    const { rank, meu } = dados;
    const meuPosicao = meu && meu.estado === 'ok' ? meu.posicao : null;
    limpar(areaQuadro);
    areaQuadro.append(cabecalho(jogo, rank.total));
    if (rank.total === 0 || !rank.classificacao.length) {
      areaQuadro.append(renderizarVazio(jogo));
    } else {
      areaQuadro.append(renderizarPodio(jogo, rank, meuPosicao), renderizarTabela(jogo, rank, meuPosicao));
    }
    renderizarMeu(jogo, meu, rank);
    marcarTroca();
  }

  // ── fluxo principal ──
  async function carregar(jogo, forcar) {
    const minha = ++sequencia;
    const guardado = cache.get(jogo);
    painel.setAttribute('aria-busy', 'true');

    if (guardado && !forcar && Date.now() - guardado.quando < VALIDADE_MS) {
      renderizarPainel(jogo, guardado);
      painel.setAttribute('aria-busy', 'false');
      statusEl.textContent = 'Ranking do ' + JOGOS[jogo].apelido + ' carregado.';
      return;
    }

    statusEl.textContent = 'Carregando o ranking do ' + JOGOS[jogo].apelido + '…';
    renderizarCarregando(jogo);
    renderizarMeu(jogo, { estado: usuarioLogado() ? 'carregando' : 'deslogado' }, null);

    try {
      const [rank, meu] = await Promise.all([
        buscarJson('/api/ranking/' + jogo + '?limite=' + LIMITE, false),
        buscarMeu(jogo),
      ]);
      if (minha !== sequencia) return; // o usuário já trocou de aba
      const dados = { quando: Date.now(), rank, meu };
      cache.set(jogo, dados);
      renderizarPainel(jogo, dados);
      statusEl.textContent = 'Ranking do ' + JOGOS[jogo].apelido + ' carregado.';
    } catch (erro) {
      if (minha !== sequencia) return;
      limpar(areaQuadro);
      areaQuadro.append(cabecalho(jogo, null), renderizarErro(jogo));
      statusEl.textContent = 'Não foi possível carregar o ranking.';
    } finally {
      if (minha === sequencia) painel.setAttribute('aria-busy', 'false');
    }
  }

  // ── abas (teclado: setas, Home e End) ──
  function selecionar(jogo, { foco, atualizarUrl } = {}) {
    if (!JOGOS[jogo]) jogo = ORDEM[0];
    jogoAtual = jogo;
    abas.forEach((aba) => {
      const ativa = aba.dataset.jogo === jogo;
      aba.setAttribute('aria-selected', ativa ? 'true' : 'false');
      aba.tabIndex = ativa ? 0 : -1;
      if (ativa) {
        painel.setAttribute('aria-labelledby', aba.id);
        if (foco) aba.focus();
      }
    });
    if (atualizarUrl) history.replaceState(null, '', '#' + jogo);
    carregar(jogo, false);
  }

  abas.forEach((aba, indice) => {
    aba.addEventListener('click', () => { if (aba.dataset.jogo !== jogoAtual) selecionar(aba.dataset.jogo, { atualizarUrl: true }); });
    aba.addEventListener('keydown', (e) => {
      let alvo = null;
      if (e.key === 'ArrowRight') alvo = (indice + 1) % abas.length;
      else if (e.key === 'ArrowLeft') alvo = (indice - 1 + abas.length) % abas.length;
      else if (e.key === 'Home') alvo = 0;
      else if (e.key === 'End') alvo = abas.length - 1;
      if (alvo === null) return;
      e.preventDefault();
      selecionar(abas[alvo].dataset.jogo, { foco: true, atualizarUrl: true });
    });
  });

  window.addEventListener('hashchange', () => {
    const jogo = location.hash.replace('#', '');
    if (JOGOS[jogo] && jogo !== jogoAtual) selecionar(jogo);
  });

  // ── celular: alterna Classificação / Meu desempenho / Prêmios na mesma tela ──
  document.querySelectorAll('.rk-vista').forEach((botao) => {
    botao.addEventListener('click', () => {
      painel.dataset.vista = botao.dataset.vista;
      document.querySelectorAll('.rk-vista').forEach((b) => b.setAttribute('aria-pressed', b === botao ? 'true' : 'false'));
    });
  });

  // ── destaques: contagem nas abas e seção "Prêmios" ──
  function aplicarDestaques() {
    ORDEM.forEach((jogo) => {
      const info = destaques && destaques.find((d) => d.jogo === jogo);
      const aba = document.getElementById('aba-' + jogo);
      const contagem = aba && aba.querySelector('[data-contagem]');
      if (contagem) contagem.textContent = info ? contagemTexto(info.totalJogadores) : '';

      const cartao = document.querySelector('.rk-premio[data-jogo="' + jogo + '"]');
      if (!cartao) return;
      const alvoLider = cartao.querySelector('[data-lider]');
      limpar(alvoLider);
      if (info && info.lider) {
        alvoLider.append('Líder: ', h('strong', { text: info.lider.nome }), ', com ' + numero(info.lider.pontuacao) + ' ' + unidadeDe(jogo, info.lider.pontuacao) + '.');
      } else if (info) {
        alvoLider.textContent = 'Vaga aberta, ninguém pontuou ainda.';
      }
      const descricao = cartao.querySelector('[data-descricao]');
      if (PREMIOS[jogo]) { descricao.textContent = PREMIOS[jogo]; descricao.hidden = false; }
    });
  }

  async function carregarDestaques() {
    try {
      const dados = await buscarJson('/api/ranking/destaques', false);
      destaques = dados.destaques || null;
    } catch (erro) {
      destaques = null; // a página funciona sem isso
    }
    aplicarDestaques();
  }

  // ── início ──
  const inicial = location.hash.replace('#', '');
  selecionar(JOGOS[inicial] ? inicial : ORDEM[0]);
  carregarDestaques();
})();
