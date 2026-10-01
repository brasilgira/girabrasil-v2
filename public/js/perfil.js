// ==========================================================================
// perfil.js — página de perfil (dados reais via /api/perfil/:id)
// ==========================================================================

const toast = document.getElementById('toast');

function showToast(mensagem) {
  toast.textContent = mensagem;
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ---- Avatares reais (fotos já existentes no projeto, nada inventado) -----
const AVATARES_DISPONIVEIS = [
  { nome: 'Onça-pintada', url: 'assets/games/species/onca.jpg' },
  { nome: 'Lobo-guará', url: 'assets/games/species/lobo.webp' },
  { nome: 'Arara-azul', url: 'assets/games/species/arara.jpg' },
  { nome: 'Mico-leão-dourado', url: 'assets/games/species/mico.webp' },
  { nome: 'Tamanduá-bandeira', url: 'assets/games/species/tamandua.jpg' },
  { nome: 'Boto', url: 'assets/games/species/boto.webp' },
  { nome: 'Capivara', url: 'assets/games/species/capivara.webp' },
  { nome: 'Tucano', url: 'assets/games/species/Tucano.jpg' },
  { nome: 'Jaguatirica', url: 'assets/games/species/jaguatirica.jpg' },
  { nome: 'Anta', url: 'assets/games/species/anta.jpg' },
];

// ---- Frases do dia (reais, com autoria verificada; mesma para todo mundo
// no mesmo dia — escolhida de forma determinística, sem precisar de banco) --
// Critério: só entram frases com relação direta e verificável com
// natureza/meio ambiente/conservação — nada de citações famosas só porque
// o autor é conhecido (ver histórico de revisões deste arquivo).
const FRASES_DO_DIA = [
  { texto: 'No começo eu pensava que estava lutando para salvar seringueiras. Depois pensei que estava lutando para salvar a floresta amazônica. Agora percebo que estou lutando pela humanidade.', autor: 'Chico Mendes' },
  { texto: 'Não quero flores no meu enterro, porque sei que elas seriam arrancadas da floresta.', autor: 'Chico Mendes' },
  { texto: 'O extrativismo, aliado à preservação, é a melhor alternativa para conciliar produção e meio ambiente.', autor: 'Chico Mendes' },
  { texto: 'A humanidade perdeu o sentido da Terra.', autor: 'Ailton Krenak' },
  { texto: 'Adiar o fim do mundo é hoje o exercício mais urgente que a humanidade deveria se policiar para fazer.', autor: 'Ailton Krenak' },
];

function fraseDoDia() {
  const hoje = new Date();
  const diaDoAno = Math.floor((hoje - new Date(hoje.getFullYear(), 0, 0)) / 86400000);
  return FRASES_DO_DIA[diaDoAno % FRASES_DO_DIA.length];
}

// ---- Sistema de nível (calculado a partir da data real de criação da conta) -
const NIVEIS = [
  { nome: 'Novo Explorador', meses: 0 },
  { nome: 'Explorador', meses: 1 },
  { nome: 'Guardião', meses: 3 },
  { nome: 'Guardião da Floresta', meses: 6 },
  { nome: 'Guardião do Brasil', meses: 12 },
];

function calcularNivel(dataCriacaoIso, isAdmin) {
  // Admin real (confirmado pelo backend via Supabase Auth) sempre aparece
  // no nível máximo — não depende de nome nem de texto fixo no front.
  if (isAdmin) {
    const ultimo = NIVEIS.length - 1;
    return { indiceAtual: ultimo, atual: NIVEIS[ultimo], proximo: null, progresso: 100, diasTotais: null, mesesDecorridos: null };
  }

  const criado = new Date(dataCriacaoIso);
  const agora = new Date();
  const diasTotais = Number.isNaN(criado.getTime()) ? 0 : Math.max(0, Math.floor((agora - criado) / (1000 * 60 * 60 * 24)));
  const mesesDecorridos = diasTotais / 30;

  let indiceAtual = 0;
  for (let i = 0; i < NIVEIS.length; i++) {
    if (mesesDecorridos >= NIVEIS[i].meses) indiceAtual = i;
  }

  const atual = NIVEIS[indiceAtual];
  const proximo = NIVEIS[indiceAtual + 1] || null;

  let progresso = 100;
  let mesesFaltando = 0;
  if (proximo) {
    const faixa = proximo.meses - atual.meses;
    progresso = Math.min(100, Math.round(((mesesDecorridos - atual.meses) / faixa) * 100));
    mesesFaltando = Math.max(0, Math.ceil(proximo.meses - mesesDecorridos));
  }

  return { indiceAtual, atual, proximo, progresso, diasTotais, mesesDecorridos, mesesFaltando };
}

function formatarTempoDeConta(dias) {
  if (dias === null) return 'Acesso administrativo.';
  if (dias < 1) return 'Você entrou hoje no Gira-Brasil.';
  if (dias < 30) return `Você está há ${dias} dia${dias === 1 ? '' : 's'} no Gira-Brasil.`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `Você está há ${meses} ${meses === 1 ? 'mês' : 'meses'} no Gira-Brasil.`;
  const anos = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;
  const parteAnos = `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  const parteMeses = mesesRestantes ? ` e ${mesesRestantes} ${mesesRestantes === 1 ? 'mês' : 'meses'}` : '';
  return `Você está há ${parteAnos}${parteMeses} no Gira-Brasil.`;
}

function formatarDataPorExtenso(iso) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function renderizarNivel(perfil, isAdmin) {
  const info = calcularNivel(perfil.criadoEmConta || perfil.criado_em, isAdmin);

  document.querySelector('[data-nivel-nome]').textContent = info.atual.nome;
  document.querySelector('[data-nivel-barra]').style.width = `${info.progresso}%`;
  document.querySelector('[data-nivel-chip]').textContent = info.atual.nome;
  document.querySelector('[data-tempo-conta]').textContent = isAdmin ? 'Acesso administrativo' : formatarTempoDeConta(info.diasTotais);

  document.querySelector('[data-modal-nivel-nome]').textContent = info.atual.nome;
  document.querySelector('[data-modal-nivel-tempo]').textContent = isAdmin ? 'Conta administrativa do Gira-Brasil.' : formatarTempoDeConta(info.diasTotais);
  document.querySelector('[data-modal-nivel-barra]').style.width = `${info.progresso}%`;

  const elProximo = document.querySelector('[data-modal-proximo]');
  if (isAdmin) {
    elProximo.textContent = 'Contas administrativas ficam no nível máximo.';
  } else if (info.proximo) {
    const faltam = Math.max(1, info.mesesFaltando || 1);
    elProximo.textContent = `Próximo nível (${info.proximo.nome}) em aproximadamente ${faltam} ${faltam === 1 ? 'mês' : 'meses'}.`;
  } else {
    elProximo.textContent = 'Você alcançou o nível máximo — obrigado por fazer parte da comunidade há tanto tempo!';
  }

  const escada = document.querySelector('[data-modal-escada]');
  escada.innerHTML = '';
  NIVEIS.forEach((nivel, indice) => {
    const li = document.createElement('li');
    if (indice === info.indiceAtual) li.className = 'atual';
    else if (indice < info.indiceAtual) li.className = 'concluido';

    const marcador = document.createElement('span');
    marcador.className = 'marcador';
    const texto = document.createElement('span');
    texto.textContent = indice === 0 ? nivel.nome : `${nivel.nome} — a partir de ${nivel.meses} ${nivel.meses === 1 ? 'mês' : 'meses'} de conta`;

    li.append(marcador, texto);
    escada.appendChild(li);
  });
}

function configurarModal(seletorModal, seletorAbrir, seletorFechar) {
  const modal = document.querySelector(seletorModal);
  const abridores = document.querySelectorAll(seletorAbrir);
  if (!modal) return;

  function abrirModal(evento) {
    if (evento) evento.preventDefault();
    modal.hidden = false;
    modal.querySelector(seletorFechar)?.focus();
  }
  function fecharModal() {
    modal.hidden = true;
  }

  abridores.forEach((abrir) => {
    abrir.addEventListener('click', abrirModal);
    abrir.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter' || evento.key === ' ') abrirModal(evento);
    });
  });
  modal.querySelector(seletorFechar)?.addEventListener('click', fecharModal);
  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) fecharModal();
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !modal.hidden) fecharModal();
  });

  return { abrirModal, fecharModal };
}

// ---- Identidade (nome, avatar, admin real, data real) ---------------------
function preencherIdentidade(usuario, perfil, isAdmin) {
  const nome = perfil.nome || usuario.nome || (usuario.email ? usuario.email.split('@')[0] : 'Visitante');
  const iniciais = nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  document.querySelector('[data-nome-usuario]').textContent = nome;
  document.querySelector('[data-nome-boasvindas]').textContent = nome;
  // O e-mail saiu da sidebar nesta rodada (composição mais enxuta); o
  // optional chaining aqui é só pra não quebrar se algum outro trecho da
  // página ainda tiver esse elemento.
  const elEmail = document.querySelector('[data-email-usuario]');
  if (elEmail) elEmail.textContent = usuario.email || '';

  atualizarAvatarNaTela(perfil.avatar_url, nome, iniciais);

  // Selo "Administrador" só aparece com confirmação vinda do backend
  // (que por sua vez consultou o Supabase Auth de verdade) — nunca pelo
  // nome do usuário nem por um valor que o próprio front possa inventar.
  document.querySelector('[data-admin-badge]').hidden = !isAdmin;

  document.querySelector('[data-membro-desde]').textContent = formatarDataPorExtenso(perfil.criadoEmConta || perfil.criado_em);
}

function atualizarAvatarNaTela(avatarUrl, nome, iniciais) {
  const avatarEl = document.querySelector('[data-avatar]');
  if (avatarUrl) {
    avatarEl.innerHTML = '';
    const img = document.createElement('img');
    img.src = avatarUrl;
    img.alt = `Foto de ${nome}`;
    avatarEl.appendChild(img);
  } else {
    avatarEl.textContent = iniciais || '?';
  }
}

// ---- Seletor de avatar ------------------------------------------------
function configurarSeletorAvatar(perfil, usuario) {
  const grid = document.querySelector('[data-avatar-grid]');
  grid.innerHTML = '';

  AVATARES_DISPONIVEIS.forEach((opcao) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'avatar-opcao';
    botao.dataset.avatarUrl = opcao.url;
    if (perfil.avatar_url === opcao.url) botao.classList.add('selecionado');

    // Container circular fixo (mesma técnica do avatar final): a imagem
    // preenche 100% com object-fit:cover, nunca esticada/deformada.
    const foto = document.createElement('span');
    foto.className = 'avatar-opcao__foto';
    const img = document.createElement('img');
    img.src = opcao.url;
    img.alt = opcao.nome;
    img.loading = 'lazy';
    foto.appendChild(img);

    const rotulo = document.createElement('span');
    rotulo.className = 'avatar-opcao__nome';
    rotulo.textContent = opcao.nome;

    botao.append(foto, rotulo);
    grid.appendChild(botao);
  });

  // Delegação de evento no container, não um listener por botão: assim
  // a troca continua funcionando mesmo que o grid seja reconstruído no
  // futuro, e nunca existe risco de um listener "grudado" num botão antigo
  // impedir trocas seguintes.
  if (!grid.dataset.delegado) {
    grid.addEventListener('click', (evento) => {
      const botao = evento.target.closest('.avatar-opcao');
      if (!botao || grid.dataset.salvando === '1') return;
      const opcao = AVATARES_DISPONIVEIS.find((a) => a.url === botao.dataset.avatarUrl);
      if (opcao) selecionarAvatar(opcao, perfil, usuario, grid);
    });
    grid.dataset.delegado = '1';
  }
}

async function selecionarAvatar(opcao, perfil, usuario, grid) {
  grid.dataset.salvando = '1';
  try {
    const resposta = await fetchAutenticado(`/api/perfil/${encodeURIComponent(usuario.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl: opcao.url }),
    });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || 'Erro ao salvar avatar');

    perfil.avatar_url = dados.avatar_url;
    grid.querySelectorAll('.avatar-opcao').forEach((el) => el.classList.toggle('selecionado', el.dataset.avatarUrl === dados.avatar_url));

    const nome = document.querySelector('[data-nome-usuario]').textContent;
    atualizarAvatarNaTela(perfil.avatar_url, nome, nome[0]);

    // Mesma foto precisa aparecer na bolinha do header — em qualquer
    // página, inclusive na própria tela de perfil.
    atualizarCamposUsuarioLogado({ avatar_url: perfil.avatar_url });

    showToast(`Foto de perfil atualizada: ${opcao.nome}.`);
    document.querySelector('[data-modal-avatar]').hidden = true;
  } catch (erro) {
    console.error('Erro ao trocar avatar:', erro);
    showToast('Não foi possível salvar sua nova foto agora. Tente de novo.');
  } finally {
    grid.dataset.salvando = '0';
  }
}

// ---- Meu bioma --------------------------------------------------------
// Os 6 biomas reais do projeto (mesmas imagens usadas em regioes.html).
// IMPORTANTE: a tabela `perfil` não tem hoje nenhum campo pra guardar essa
// escolha (só nome/avatar_url/bio/criado_em). Criar esse campo exigiria
// uma migration — por instrução explícita, isso não foi feito sem
// aprovação. Então esta escolha fica só NESTA visita (em memória), nunca
// em localStorage fingindo ser persistência real. Ver relatório final para
// a proposta exata de campo/tabela/tipo.
const BIOMAS_DISPONIVEIS = [
  { id: 'amazonia', nome: 'Amazônia', imagem: 'assets/biomas/bioma-amazonia.jpg' },
  { id: 'cerrado', nome: 'Cerrado', imagem: 'assets/biomas/bioma-cerrado.jpg' },
  { id: 'caatinga', nome: 'Caatinga', imagem: 'assets/biomas/bioma-caatinga.jpg' },
  { id: 'mata-atlantica', nome: 'Mata Atlântica', imagem: 'assets/biomas/bioma-mata-atlantica.jpg' },
  { id: 'pampa', nome: 'Pampa', imagem: 'assets/biomas/bioma-pampa.jpg' },
  { id: 'pantanal', nome: 'Pantanal', imagem: 'assets/biomas/bioma-pantanal.jpg' },
];

let biomaEscolhido = null; // espelha perfil.bioma_favorito, carregado do backend

function atualizarCardBioma() {
  const imgEl = document.querySelector('[data-bioma-atual-img]');
  const nomeEl = document.querySelector('[data-bioma-atual-nome]');
  if (biomaEscolhido) {
    imgEl.style.backgroundImage = `url("${biomaEscolhido.imagem}")`;
    nomeEl.textContent = biomaEscolhido.nome;
  } else {
    imgEl.style.backgroundImage = '';
    nomeEl.textContent = 'Escolher bioma';
  }
}

// perfil.bioma_favorito agora é persistido de verdade (coluna bioma_favorito
// em `perfil`, migration 006) — carregado aqui no início e salvo via o
// mesmo PUT /api/perfil/:id que já existia pra nome/avatar/bio.
function configurarSeletorBioma(perfil, usuario) {
  biomaEscolhido = BIOMAS_DISPONIVEIS.find((b) => b.nome === perfil.bioma_favorito) || null;

  const grid = document.querySelector('[data-bioma-grid]');
  grid.innerHTML = '';

  BIOMAS_DISPONIVEIS.forEach((bioma) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'bioma-opcao';
    botao.dataset.biomaId = bioma.id;
    if (biomaEscolhido?.id === bioma.id) botao.classList.add('selecionado');

    const foto = document.createElement('span');
    foto.className = 'bioma-opcao__foto';
    const img = document.createElement('img');
    img.src = bioma.imagem;
    img.alt = bioma.nome;
    img.loading = 'lazy';
    foto.appendChild(img);

    const rotulo = document.createElement('span');
    rotulo.className = 'bioma-opcao__nome';
    rotulo.textContent = bioma.nome;

    botao.append(foto, rotulo);
    grid.appendChild(botao);
  });

  atualizarCardBioma();

  if (!grid.dataset.delegado) {
    grid.addEventListener('click', (evento) => {
      const botao = evento.target.closest('.bioma-opcao');
      if (!botao || grid.dataset.salvando === '1') return;
      const bioma = BIOMAS_DISPONIVEIS.find((b) => b.id === botao.dataset.biomaId);
      if (bioma) salvarBioma(bioma, perfil, usuario, grid);
    });
    grid.dataset.delegado = '1';
  }
}

async function salvarBioma(bioma, perfil, usuario, grid) {
  grid.dataset.salvando = '1';
  const biomaAnterior = biomaEscolhido;

  try {
    const resposta = await fetchAutenticado(`/api/perfil/${encodeURIComponent(usuario.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ biomaFavorito: bioma.nome }),
    });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || 'Erro ao salvar bioma');

    perfil.bioma_favorito = dados.bioma_favorito;
    biomaEscolhido = bioma;
    grid.querySelectorAll('.bioma-opcao').forEach((el) => el.classList.toggle('selecionado', el.dataset.biomaId === bioma.id));
    atualizarCardBioma();
    showToast(`Bioma representativo: ${bioma.nome}.`);
    document.querySelector('[data-modal-bioma]').hidden = true;
  } catch (erro) {
    console.error('Erro ao salvar bioma:', erro);
    biomaEscolhido = biomaAnterior; // preserva a escolha anterior em caso de falha
    showToast('Não foi possível salvar seu bioma agora. Tente de novo.');
  } finally {
    grid.dataset.salvando = '0';
  }
}

// ---- Minha exploração ---------------------------------------------------
// Conta interações REAIS (curtidas + salvas + comentários) por região,
// usando noticias.regiao_id que já vem em cada item do perfil. Notícias
// gerais (regiao_id nulo) não contam pra nenhuma região específica.
// Se não houver nenhuma interação com região definida, mostra o estado
// vazio em vez de 5 barras zeradas sem sentido.
async function preencherExploracao(perfil) {
  const container = document.querySelector('[data-exploracao-lista]');

  let regioes = [];
  try {
    const resposta = await fetch('/api/regioes');
    if (resposta.ok) regioes = await resposta.json();
  } catch (erro) {
    console.error('Erro ao carregar regiões para Minha exploração:', erro);
  }

  if (!regioes.length) {
    container.innerHTML = '';
    const vazio = document.createElement('p');
    vazio.className = 'exploracao-vazio';
    vazio.textContent = 'Não foi possível carregar as regiões agora.';
    container.appendChild(vazio);
    return;
  }

  const interacoes = [
    ...(perfil.noticiasCurtidas || []),
    ...(perfil.noticiasSalvas || []),
    ...(perfil.comentarios || []),
  ];

  const contagemPorRegiao = {};
  interacoes.forEach((item) => {
    if (!item.regiao_id) return; // notícia geral, não conta pra região nenhuma
    contagemPorRegiao[item.regiao_id] = (contagemPorRegiao[item.regiao_id] || 0) + 1;
  });

  const totalComRegiao = Object.values(contagemPorRegiao).reduce((soma, n) => soma + n, 0);
  container.innerHTML = '';

  if (totalComRegiao === 0) {
    const vazio = document.createElement('p');
    vazio.className = 'exploracao-vazio';
    vazio.innerHTML = 'Comece a explorar o Brasil — curta, salve ou comente em notícias de uma região.<br><a href="regioes.html">Ver o mapa de regiões →</a>';
    container.appendChild(vazio);
    return;
  }

  const maiorContagem = Math.max(...Object.values(contagemPorRegiao));

  // Ordem geográfica fixa (Norte → Sul), não por quantidade — mais fácil
  // de ler que uma ordenação que muda a cada visita.
  const ordem = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
  const regioesOrdenadas = [...regioes].sort((a, b) => ordem.indexOf(a.nome) - ordem.indexOf(b.nome));

  regioesOrdenadas.forEach((regiao) => {
    const contagem = contagemPorRegiao[regiao.id] || 0;
    const percentual = contagem ? Math.max(6, Math.round((contagem / maiorContagem) * 100)) : 0;

    const item = document.createElement('div');
    item.className = 'exploracao-item';

    const topo = document.createElement('div');
    topo.className = 'exploracao-item__topo';
    const nome = document.createElement('span');
    nome.textContent = regiao.nome;
    const valor = document.createElement('span');
    valor.textContent = contagem ? `${contagem} ${contagem === 1 ? 'interação' : 'interações'}` : '—';
    topo.append(nome, valor);

    const barra = document.createElement('div');
    barra.className = 'exploracao-barra';
    const preenchimento = document.createElement('i');
    preenchimento.style.width = `${percentual}%`;
    barra.appendChild(preenchimento);

    item.append(topo, barra);
    container.appendChild(item);
  });
}

// ---- Estatísticas -----------------------------------------------------
function preencherEstatisticas(perfil) {
  const totalAcoes = (perfil.comentarios?.length || 0) + (perfil.noticiasCurtidas?.length || 0) + (perfil.noticiasSalvas?.length || 0);
  const el = document.querySelector('[data-total-acoes]');
  el.textContent = totalAcoes > 0 ? `${totalAcoes} ${totalAcoes === 1 ? 'ação' : 'ações'}` : 'Nenhuma atividade ainda';
}

// ---- Abas de atividade (curtidas / comentários / salvas) ------------------
function preencherAtividade(perfil) {
  const curtidas = perfil.noticiasCurtidas || [];
  const comentarios = perfil.comentarios || [];
  const salvas = perfil.noticiasSalvas || [];

  document.querySelector('[data-contador-curtidas]').textContent = curtidas.length;
  document.querySelector('[data-contador-comentarios]').textContent = comentarios.length;
  document.querySelector('[data-contador-salvas]').textContent = salvas.length;

  renderizarListaNoticias('[data-lista-curtidas]', curtidas, 'curtido_em', 'curtida', 'Você ainda não curtiu nenhuma notícia.');
  renderizarListaNoticias('[data-lista-salvas]', salvas, 'salvo_em', 'salva', 'Você ainda não salvou nenhuma notícia para ler depois.');
  renderizarListaComentarios(comentarios);

  configurarAbas();
}

function renderizarListaNoticias(seletor, lista, campoData, rotuloAcao, textoVazio) {
  const container = document.querySelector(seletor);
  container.innerHTML = '';

  if (!lista.length) {
    const vazio = document.createElement('div');
    vazio.className = 'estado-vazio';
    vazio.innerHTML = `${textoVazio}<br><a href="noticias.html">Explore as notícias do Gira-Brasil →</a>`;
    container.appendChild(vazio);
    return;
  }

  lista.forEach((noticia) => {
    const item = document.createElement('a');
    item.className = 'activity-item';
    item.href = `noticia.html?id=${encodeURIComponent(noticia.id)}`;

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    if (noticia.imagem_url) thumb.style.backgroundImage = `url("${noticia.imagem_url}")`;

    const copy = document.createElement('div');
    copy.className = 'item-copy';
    const titulo = document.createElement('strong');
    titulo.textContent = noticia.titulo;
    const meta = document.createElement('small');
    const data = new Date(noticia[campoData]);
    meta.textContent = [noticia.categoria, Number.isNaN(data.getTime()) ? '' : `${rotuloAcao} em ${data.toLocaleDateString('pt-BR')}`].filter(Boolean).join(' · ');
    copy.append(titulo, meta);

    item.append(thumb, copy);
    container.appendChild(item);
  });
}

function renderizarListaComentarios(lista) {
  const container = document.querySelector('[data-lista-comentarios]');
  container.innerHTML = '';

  if (!lista.length) {
    const vazio = document.createElement('div');
    vazio.className = 'estado-vazio';
    vazio.innerHTML = 'Você ainda não comentou em nenhuma notícia.<br><a href="noticias.html">Explore as notícias do Gira-Brasil →</a>';
    container.appendChild(vazio);
    return;
  }

  lista.forEach((comentario) => {
    const item = document.createElement('a');
    item.className = 'activity-item';
    item.href = `noticia.html?id=${encodeURIComponent(comentario.noticia_id)}#comentarios`;

    const icone = document.createElement('div');
    icone.className = 'activity-icone';
    icone.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 9 9 0 0 1-3.9-1L3 20l1.2-5.1a8.4 8.4 0 1 1 16.8-3.4Z"/></svg>';

    const copy = document.createElement('div');
    copy.className = 'item-copy';
    const trecho = document.createElement('strong');
    const texto = comentario.conteudo || '';
    trecho.textContent = texto.length > 110 ? `${texto.slice(0, 110)}…` : texto;
    const meta = document.createElement('small');
    const data = new Date(comentario.criado_em);
    meta.textContent = [comentario.noticia_titulo, Number.isNaN(data.getTime()) ? '' : data.toLocaleDateString('pt-BR')].filter(Boolean).join(' · ');
    copy.append(trecho, meta);

    item.append(icone, copy);
    container.appendChild(item);
  });
}

function configurarAbas() {
  const abas = document.querySelectorAll('.tab');
  abas.forEach((aba) => {
    aba.addEventListener('click', () => {
      abas.forEach((a) => { a.classList.remove('is-ativa'); a.setAttribute('aria-selected', 'false'); });
      aba.classList.add('is-ativa');
      aba.setAttribute('aria-selected', 'true');

      document.querySelectorAll('.tab-painel').forEach((painel) => { painel.hidden = true; });
      document.querySelector(`[data-painel="${aba.dataset.aba}"]`).hidden = false;
    });
  });
}

// ---- Jogos: molde de desempenho (sem inventar pontuação/ranking) ---------
const JOGOS_DISPONIVEIS = [
  { id: 'quiz-da-floresta', nome: 'Quiz de Espécies', imagem: 'assets/jogos/game-quiz.avif' },
  { id: 'guardioes-da-amazonia', nome: 'Guarda da Floresta', imagem: 'assets/jogos/game-guardioes.jpg' },
  { id: 'missao-biodiversidade', nome: 'Defender o Rio', imagem: 'assets/jogos/game-biodiversidade.jpg' },
  { id: 'desafio-dos-biomas', nome: 'Fuga pela Floresta', imagem: 'assets/jogos/game-biomas.jpg' },
];

function preencherJogos() {
  const container = document.querySelector('[data-lista-jogos]');
  container.innerHTML = '';

  JOGOS_DISPONIVEIS.forEach((jogo) => {
    const card = document.createElement('a');
    card.className = 'game-card';
    card.href = `jogos.html#${jogo.id}`;
    // Preparado pra receber dados reais quando o histórico existir:
    card.dataset.jogoId = jogo.id;
    card.dataset.pontuacao = '';
    card.dataset.posicao = '';

    const thumb = document.createElement('div');
    thumb.className = 'game-thumb';
    thumb.style.backgroundImage = `url("${jogo.imagem}")`;

    const copy = document.createElement('div');
    copy.className = 'item-copy';
    const titulo = document.createElement('strong');
    titulo.textContent = jogo.nome;
    const placeholder = document.createElement('span');
    placeholder.className = 'game-placeholder';
    placeholder.textContent = 'Pontuação em breve';
    copy.append(titulo, placeholder);

    card.append(thumb, copy);
    container.appendChild(card);
  });
}

// ---- Bio (visualizar / editar) --------------------------------------------
function configurarBio(perfil, usuario) {
  const textoEl = document.querySelector('[data-bio-texto]');
  const form = document.querySelector('[data-form-bio]');
  const textarea = form.querySelector('textarea[name="bio"]');
  const botaoEditar = document.querySelector('[data-editar-bio]');
  const botaoCancelar = document.querySelector('[data-cancelar-bio]');

  function mostrarTexto() {
    textoEl.textContent = perfil.bio && perfil.bio.trim() ? perfil.bio : 'Você ainda não escreveu uma bio. Conte um pouco sobre você.';
    textoEl.hidden = false;
    form.hidden = true;
  }

  mostrarTexto();

  botaoEditar.addEventListener('click', () => {
    textarea.value = perfil.bio || '';
    textoEl.hidden = true;
    form.hidden = false;
    textarea.focus();
  });

  botaoCancelar.addEventListener('click', mostrarTexto);

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const botaoSalvar = form.querySelector('button[type="submit"]');
    botaoSalvar.disabled = true;

    try {
      const resposta = await fetchAutenticado(`/api/perfil/${encodeURIComponent(usuario.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: textarea.value.trim() }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || 'Erro ao salvar bio');

      perfil.bio = dados.bio;
      mostrarTexto();
      showToast('Bio atualizada com sucesso.');
    } catch (erro) {
      console.error('Erro ao salvar bio:', erro);
      showToast('Não foi possível salvar sua bio agora.');
    } finally {
      botaoSalvar.disabled = false;
    }
  });
}

// ---- Logout real ------------------------------------------------------
function configurarLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sairDaConta();
    showToast('Sessão encerrada. Até logo!');
    setTimeout(() => { window.location.href = 'index.html'; }, 700);
  });
}

function configurarEmBreve() {
  document.querySelectorAll('[data-em-breve]').forEach((item) => {
    item.addEventListener('click', (evento) => {
      evento.preventDefault();
      showToast(`${item.dataset.emBreve} em breve!`);
    });
  });
}

function preencherFraseDoDia() {
  const frase = fraseDoDia();
  document.querySelector('[data-frase-dia]').textContent = `"${frase.texto}"`;
  document.querySelector('[data-frase-autor]').textContent = `— ${frase.autor}`;
}

// ---- Inicialização -----------------------------------------------------
async function iniciarPerfil() {
  const usuario = obterUsuarioLogado();
  if (!usuario) {
    window.location.href = `login.html?redirect=${encodeURIComponent('perfil.html')}`;
    return;
  }

  configurarLogout();
  configurarModal('[data-modal-nivel]', '[data-abrir-nivel]', '[data-fechar-modal-nivel]');
  configurarModal('[data-modal-avatar]', '[data-abrir-avatar]', '[data-fechar-modal-avatar]');
  configurarModal('[data-modal-bioma]', '[data-abrir-bioma]', '[data-fechar-modal-bioma]');
  preencherJogos();
  preencherFraseDoDia();


  try {
    const resposta = await fetch(`/api/perfil/${encodeURIComponent(usuario.id)}`);
    if (!resposta.ok) throw new Error(`API respondeu ${resposta.status}`);
    const perfil = await resposta.json();

    // isAdmin agora vem do backend (que consultou o Supabase Auth de
    // verdade nesta mesma resposta) — não do localStorage em cache, que
    // pode ficar desatualizado se a permissão mudar depois do login.
    const isAdmin = perfil.isAdmin === true;

    // Garante que o cache do usuário (o mesmo que o header lê em
    // qualquer outra página) já sai da tela de perfil com o avatar certo,
    // mesmo que o usuário não troque nada nesta visita.
    atualizarCamposUsuarioLogado({ avatar_url: perfil.avatar_url || null });

    preencherIdentidade(usuario, perfil, isAdmin);
    renderizarNivel(perfil, isAdmin);
    preencherEstatisticas(perfil);
    preencherAtividade(perfil);
    preencherExploracao(perfil);
    configurarBio(perfil, usuario);
    configurarSeletorAvatar(perfil, usuario);
    configurarSeletorBioma(perfil, usuario);
  } catch (erro) {
    console.error('Erro ao carregar perfil:', erro);
    showToast('Não foi possível carregar seu perfil agora.');
    preencherIdentidade(usuario, { nome: usuario.nome, criado_em: null }, usuario.is_admin === true);
  }
}

document.addEventListener('DOMContentLoaded', iniciarPerfil);
