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

// ---- Sistema de nível (calculado a partir de perfil.criado_em) -----------
// Progressão baseada só no tempo real de conta. Sem tabela nova: tudo
// calculado no front a partir da data que a API já devolve.
const NIVEIS = [
  { nome: 'Novo Explorador', meses: 0 },
  { nome: 'Explorador', meses: 1 },
  { nome: 'Guardião', meses: 3 },
  { nome: 'Guardião da Floresta', meses: 6 },
  { nome: 'Guardião do Brasil', meses: 12 },
];

function calcularNivel(dataCriacaoIso) {
  const criado = new Date(dataCriacaoIso);
  const agora = new Date();
  const diasTotais = Math.max(0, Math.floor((agora - criado) / (1000 * 60 * 60 * 24)));
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

  return { indiceAtual, atual, proximo, progresso, diasTotais, mesesDecorridos };
}

function formatarTempoDeConta(dias) {
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

function renderizarNivel(perfil) {
  const info = calcularNivel(perfil.criado_em);

  document.querySelector('[data-nivel-nome]').textContent = info.atual.nome;
  document.querySelector('[data-nivel-barra]').style.width = `${info.progresso}%`;
  document.querySelector('[data-tempo-conta]').textContent = formatarTempoDeConta(info.diasTotais);

  // Modal
  document.querySelector('[data-modal-nivel-nome]').textContent = info.atual.nome;
  document.querySelector('[data-modal-nivel-tempo]').textContent = formatarTempoDeConta(info.diasTotais);
  document.querySelector('[data-modal-nivel-barra]').style.width = `${info.progresso}%`;

  const elProximo = document.querySelector('[data-modal-proximo]');
  if (info.proximo) {
    elProximo.textContent = `Próximo nível (${info.proximo.nome}) em aproximadamente ${info.proximo.meses - info.atual.meses <= 1 ? 'algumas semanas' : `${Math.max(1, Math.ceil(info.proximo.meses - info.mesesDecorridos))} ${Math.ceil(info.proximo.meses - info.mesesDecorridos) === 1 ? 'mês' : 'meses'}`}.`;
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

function configurarModalNivel() {
  const modal = document.querySelector('[data-modal-nivel]');
  const abrir = document.querySelector('[data-abrir-nivel]');

  function abrirModal() {
    modal.hidden = false;
    modal.querySelector('[data-fechar-modal-nivel]').focus();
  }
  function fecharModal() {
    modal.hidden = true;
    abrir.focus();
  }

  abrir?.addEventListener('click', abrirModal);
  abrir?.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      abrirModal();
    }
  });
  modal.querySelector('[data-fechar-modal-nivel]').addEventListener('click', fecharModal);
  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) fecharModal();
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !modal.hidden) fecharModal();
  });
}

// ---- Cabeçalho / sidebar com dados reais ----------------------------------
function preencherIdentidade(usuario, perfil) {
  const nome = perfil.nome || usuario.nome || (usuario.email ? usuario.email.split('@')[0] : 'Visitante');
  const iniciais = nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  document.querySelector('[data-nome-usuario]').textContent = nome;
  document.querySelector('[data-nome-boasvindas]').textContent = nome;
  document.querySelector('[data-email-usuario]').textContent = usuario.email || '';

  const avatarEl = document.querySelector('[data-avatar]');
  if (perfil.avatar_url) {
    avatarEl.innerHTML = '';
    const img = document.createElement('img');
    img.src = perfil.avatar_url;
    img.alt = `Foto de ${nome}`;
    avatarEl.appendChild(img);
  } else {
    avatarEl.textContent = iniciais || '?';
  }

  if (usuario.is_admin) {
    document.querySelector('[data-admin-badge]').hidden = false;
  }

  const dataCriacao = new Date(perfil.criado_em);
  document.querySelector('[data-membro-desde]').textContent = Number.isNaN(dataCriacao.getTime())
    ? '—'
    : dataCriacao.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ---- Estatísticas -----------------------------------------------------
function preencherEstatisticas(perfil) {
  const totalAcoes = (perfil.comentarios?.length || 0) + (perfil.noticiasCurtidas?.length || 0) + (perfil.noticiasSalvas?.length || 0);
  const el = document.querySelector('[data-total-acoes]');
  el.textContent = totalAcoes > 0 ? `${totalAcoes} ${totalAcoes === 1 ? 'ação' : 'ações'}` : 'Nenhuma atividade ainda';
}

// ---- Notícias curtidas --------------------------------------------------
function preencherCurtidas(perfil) {
  const container = document.querySelector('[data-lista-curtidas]');
  const lista = perfil.noticiasCurtidas || [];

  container.innerHTML = '';

  if (!lista.length) {
    const vazio = document.createElement('div');
    vazio.className = 'estado-vazio';
    vazio.innerHTML = 'Você ainda não curtiu nenhuma notícia.<br><a href="noticias.html">Explore as notícias do Gira-Brasil →</a>';
    container.appendChild(vazio);
    return;
  }

  lista.slice(0, 5).forEach((noticia) => {
    const item = document.createElement('a');
    item.className = 'news-item';
    item.href = `noticia.html?id=${encodeURIComponent(noticia.id)}`;

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    if (noticia.imagem_url) thumb.style.backgroundImage = `url("${noticia.imagem_url}")`;

    const copy = document.createElement('div');
    copy.className = 'item-copy';
    const titulo = document.createElement('strong');
    titulo.textContent = noticia.titulo;
    const meta = document.createElement('small');
    const data = new Date(noticia.curtido_em);
    meta.textContent = [noticia.categoria, Number.isNaN(data.getTime()) ? '' : `curtida em ${data.toLocaleDateString('pt-BR')}`].filter(Boolean).join(' · ');
    copy.append(titulo, meta);

    item.append(thumb, copy);
    container.appendChild(item);
  });
}

// ---- Jogos: acesso real, sem pontuação inventada --------------------------
// Mesmos 4 jogos de jogos.html — aqui é só um atalho, não existe histórico
// de partidas/pontuação persistido em lugar nenhum do projeto ainda.
const JOGOS_DISPONIVEIS = [
  { id: 'quiz-da-floresta', nome: 'Quiz de Espécies', descricao: 'Reconheça animais da fauna brasileira', imagem: 'assets/jogos/game-quiz.avif' },
  { id: 'guardioes-da-amazonia', nome: 'Guarda da Floresta', descricao: 'Destrua as motosserras, poupe os animais', imagem: 'assets/jogos/game-guardioes.jpg' },
  { id: 'missao-biodiversidade', nome: 'Defender o Rio', descricao: 'Bloqueie o lixo antes que chegue ao mar', imagem: 'assets/jogos/game-biodiversidade.jpg' },
  { id: 'desafio-dos-biomas', nome: 'Fuga pela Floresta', descricao: 'Guie a onça-pintada pelos obstáculos', imagem: 'assets/jogos/game-biomas.jpg' },
];

function preencherJogos() {
  const container = document.querySelector('[data-lista-jogos]');
  container.innerHTML = '';

  JOGOS_DISPONIVEIS.forEach((jogo) => {
    const item = document.createElement('a');
    item.className = 'game-item';
    item.href = `jogos.html#${jogo.id}`;

    const thumb = document.createElement('div');
    thumb.className = 'game-thumb';
    thumb.style.backgroundImage = `url("${jogo.imagem}")`;

    const copy = document.createElement('div');
    copy.className = 'item-copy';
    const titulo = document.createElement('strong');
    titulo.textContent = jogo.nome;
    const desc = document.createElement('small');
    desc.textContent = jogo.descricao;
    copy.append(titulo, desc);

    item.append(thumb, copy);
    container.appendChild(item);
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
    textoEl.textContent = perfil.bio && perfil.bio.trim()
      ? perfil.bio
      : 'Você ainda não escreveu uma bio. Conte um pouco sobre você.';
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

// Itens ainda sem página própria
function configurarEmBreve() {
  document.querySelectorAll('[data-em-breve]').forEach((item) => {
    item.addEventListener('click', (evento) => {
      evento.preventDefault();
      showToast(`${item.dataset.emBreve} em breve!`);
    });
  });
}

// ---- Inicialização -----------------------------------------------------
async function iniciarPerfil() {
  const usuario = obterUsuarioLogado();
  if (!usuario) {
    window.location.href = `login.html?redirect=${encodeURIComponent('perfil.html')}`;
    return;
  }

  configurarLogout();
  configurarEmBreve();
  configurarModalNivel();
  preencherJogos();

  try {
    const resposta = await fetch(`/api/perfil/${encodeURIComponent(usuario.id)}`);
    if (!resposta.ok) throw new Error(`API respondeu ${resposta.status}`);
    const perfil = await resposta.json();

    preencherIdentidade(usuario, perfil);
    renderizarNivel(perfil);
    preencherEstatisticas(perfil);
    preencherCurtidas(perfil);
    configurarBio(perfil, usuario);
  } catch (erro) {
    console.error('Erro ao carregar perfil:', erro);
    showToast('Não foi possível carregar seu perfil agora.');
    preencherIdentidade(usuario, { nome: usuario.nome, criado_em: null });
  }
}

document.addEventListener('DOMContentLoaded', iniciarPerfil);
