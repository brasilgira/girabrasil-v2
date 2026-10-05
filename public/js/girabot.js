
// GiraBot — histórico persistente por conta 


const sidebar = document.getElementById('girabotSidebar');
const overlay = document.getElementById('girabotOverlay');
const botaoAbrirSidebar = document.getElementById('botaoAbrirSidebar');
const botaoFecharSidebar = document.getElementById('botaoFecharSidebar');
const botaoNovaConversa = document.getElementById('botaoNovaConversa');
const listaHistorico = document.getElementById('listaHistorico');

const estadoVazio = document.getElementById('estadoVazio');
const chatMensagens = document.getElementById('chatMensagens');
const formEnvio = document.getElementById('formEnvio');
const campoMensagem = document.getElementById('campoMensagem');
const botaoEnviar = formEnvio.querySelector('.botao-enviar');

const VELOCIDADE_DIGITACAO_MS = 18;

const estado = {
  conversas: [],
  conversaAtualId: null,
  enviando: false,
};

// --- Sidebar retrátil ----------------------------------------------------

function abrirSidebar() { sidebar.classList.add('aberta'); overlay.classList.add('visivel'); }
function fecharSidebar() { sidebar.classList.remove('aberta'); overlay.classList.remove('visivel'); }

botaoAbrirSidebar.addEventListener('click', abrirSidebar);
botaoFecharSidebar.addEventListener('click', fecharSidebar);
overlay.addEventListener('click', fecharSidebar);
document.addEventListener('keydown', (evento) => { if (evento.key === 'Escape') fecharSidebar(); });

// --- Estado vazio (boas-vindas) ------------------------------------------

function mostrarEstadoVazio() { estadoVazio.classList.remove('escondido'); chatMensagens.innerHTML = ''; }
function esconderEstadoVazio() { estadoVazio.classList.add('escondido'); }

campoMensagem.addEventListener('input', () => {
  if (campoMensagem.value.length > 0) esconderEstadoVazio();
});

document.querySelectorAll('.sugestao-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    campoMensagem.value = chip.textContent;
    esconderEstadoVazio();
    campoMensagem.focus();
  });
});

// --- Balões de mensagem ----------------------------------------------------

function adicionarMensagem(texto, tipo) {
  const balao = document.createElement('div');
  balao.className = `mensagem ${tipo}`;
  balao.textContent = texto;
  chatMensagens.appendChild(balao);
  chatMensagens.scrollTop = chatMensagens.scrollHeight;
  return balao;
}

function digitarTexto(elemento, textoCompleto) {
  return new Promise((resolve) => {
    elemento.textContent = '';
    let posicao = 0;
    const intervalo = setInterval(() => {
      posicao++;
      elemento.textContent = textoCompleto.slice(0, posicao);
      chatMensagens.scrollTop = chatMensagens.scrollHeight;
      if (posicao >= textoCompleto.length) { clearInterval(intervalo); resolve(); }
    }, VELOCIDADE_DIGITACAO_MS);
  });
}

// --- Sidebar: lista de conversas reais -------------------------------------

function formatarDataHistorico(isoString) {
  const data = new Date(isoString);
  if (Number.isNaN(data.getTime())) return '';
  const hoje = new Date();
  const mesmoDia = data.toDateString() === hoje.toDateString();
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (mesmoDia) return `Hoje, ${hora}`;
  return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}, ${hora}`;
}

function renderizarListaConversas() {
  listaHistorico.innerHTML = '';

  if (estado.conversas.length === 0) {
    const vazio = document.createElement('p');
    vazio.className = 'sidebar-historico-vazio';
    vazio.textContent = 'Suas conversas aparecem aqui.';
    listaHistorico.appendChild(vazio);
    return;
  }

  estado.conversas.forEach((conversa) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'item-historico' + (conversa.id === estado.conversaAtualId ? ' ativo' : '');

    const texto = document.createElement('span');
    texto.className = 'item-texto';

    const titulo = document.createElement('span');
    titulo.className = 'item-titulo';
    titulo.textContent = conversa.titulo || 'Nova conversa';

    const data = document.createElement('span');
    data.className = 'item-data';
    data.textContent = formatarDataHistorico(conversa.atualizado_em);

    texto.append(titulo, data);

    const botaoExcluir = document.createElement('button');
    botaoExcluir.type = 'button';
    botaoExcluir.className = 'item-historico-excluir';
    botaoExcluir.setAttribute('aria-label', 'Excluir conversa');
    botaoExcluir.textContent = '×';
    botaoExcluir.addEventListener('click', (evento) => {
      evento.stopPropagation();
      pedirConfirmacaoExclusaoConversa(conversa.id, conversa.titulo || 'esta conversa');
    });

    item.append(texto, botaoExcluir);
    item.addEventListener('click', () => abrirConversa(conversa.id));
    listaHistorico.appendChild(item);
  });
}

async function carregarConversas() {
  try {
    const resposta = await fetchAutenticado('/api/girabot/conversas');
    if (!resposta.ok) throw new Error('Falha ao carregar conversas.');
    estado.conversas = await resposta.json();
    renderizarListaConversas();
  } catch (erro) {
    console.error('Erro ao carregar conversas do GiraBot:', erro);
    listaHistorico.innerHTML = '<p class="sidebar-historico-erro">Não foi possível carregar seu histórico agora.</p>';
  }
}

async function abrirConversa(conversaId) {
  if (estado.enviando) return; // evita trocar de conversa no meio de um envio
  estado.conversaAtualId = conversaId;
  renderizarListaConversas();
  fecharSidebar();

  chatMensagens.innerHTML = '<p class="girabot-carregando">Carregando conversa…</p>';
  esconderEstadoVazio();

  try {
    const resposta = await fetchAutenticado(`/api/girabot/conversas/${conversaId}/mensagens`);
    if (!resposta.ok) throw new Error('Conversa não encontrada.');
    const dados = await resposta.json();

    chatMensagens.innerHTML = '';
    if (dados.mensagens.length === 0) {
      mostrarEstadoVazio();
    } else {
      dados.mensagens.forEach((m) => {
        adicionarMensagem(m.conteudo, m.papel === 'user' ? 'usuario' : 'bot');
      });
    }
  } catch (erro) {
    console.error('Erro ao abrir conversa do GiraBot:', erro);
    chatMensagens.innerHTML = '';
    adicionarMensagem('⚠️ Não foi possível carregar essa conversa agora.', 'erro');
  }
}

async function criarNovaConversa() {
  if (estado.enviando) return;
  try {
    const resposta = await fetchAutenticado('/api/girabot/conversas', { method: 'POST' });
    if (!resposta.ok) throw new Error('Falha ao criar conversa.');
    const conversa = await resposta.json();
    estado.conversas.unshift(conversa);
    estado.conversaAtualId = conversa.id;
    renderizarListaConversas();
    fecharSidebar();
    chatMensagens.innerHTML = '';
    mostrarEstadoVazio();
    campoMensagem.focus();
  } catch (erro) {
    console.error('Erro ao criar nova conversa:', erro);
    adicionarMensagem('⚠️ Não foi possível iniciar uma nova conversa agora.', 'erro');
  }
}

botaoNovaConversa.addEventListener('click', criarNovaConversa);

// --- Exclusão de conversa (confirmação visual, sem confirm() nativo) -------

let conversaParaExcluir = null;

function pedirConfirmacaoExclusaoConversa(conversaId, titulo) {
  conversaParaExcluir = conversaId;
  const modal = document.getElementById('modalExcluirConversa');
  modal.querySelector('[data-texto-exclusao-conversa]').textContent =
    `Tem certeza que quer excluir "${titulo}"? Essa ação não pode ser desfeita.`;
  modal.hidden = false;
}

function fecharModalExclusao() {
  const modal = document.getElementById('modalExcluirConversa');
  modal.hidden = true;
  conversaParaExcluir = null;
}

document.getElementById('modalExcluirConversa').addEventListener('click', (evento) => {
  if (evento.target.hasAttribute('data-fechar-modal')) fecharModalExclusao();
});

document.getElementById('botaoConfirmarExclusaoConversa').addEventListener('click', async () => {
  if (!conversaParaExcluir) return;
  const id = conversaParaExcluir;
  const botao = document.getElementById('botaoConfirmarExclusaoConversa');
  botao.disabled = true;
  try {
    const resposta = await fetchAutenticado(`/api/girabot/conversas/${id}`, { method: 'DELETE' });
    if (!resposta.ok) throw new Error('Falha ao excluir.');

    estado.conversas = estado.conversas.filter((c) => c.id !== id);
    renderizarListaConversas();

    if (estado.conversaAtualId === id) {
      estado.conversaAtualId = null;
      chatMensagens.innerHTML = '';
      mostrarEstadoVazio();
    }
  } catch (erro) {
    console.error('Erro ao excluir conversa:', erro);
    adicionarMensagem('⚠️ Não foi possível excluir essa conversa agora.', 'erro');
  } finally {
    botao.disabled = false;
    fecharModalExclusao();
  }
});

// --- Envio de mensagem ------------------------------------------------------

formEnvio.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  if (!usuarioEstaLogado()) {
    abrirAvisoConta('Crie uma conta pra conversar com o Gira-Bot e salvar seu histórico.');
    return;
  }

  const texto = campoMensagem.value.trim();
  if (!texto || estado.enviando) return;

  // Garante que existe uma conversa antes de mandar a primeira mensagem.
  if (!estado.conversaAtualId) {
    try {
      const resposta = await fetchAutenticado('/api/girabot/conversas', { method: 'POST' });
      if (!resposta.ok) throw new Error('Falha ao criar conversa.');
      const conversa = await resposta.json();
      estado.conversas.unshift(conversa);
      estado.conversaAtualId = conversa.id;
    } catch (erro) {
      console.error('Erro ao criar conversa para a primeira mensagem:', erro);
      adicionarMensagem('⚠️ Não foi possível iniciar a conversa agora. Tente novamente.', 'erro');
      return;
    }
  }

  estado.enviando = true;
  botaoEnviar.disabled = true; // evita duplo clique/duplo envio

  esconderEstadoVazio();
  adicionarMensagem(texto, 'usuario');
  campoMensagem.value = '';

  const indicador = adicionarMensagem('Gira-Bot está pensando...', 'bot pensando');

  try {
    const resposta = await fetchAutenticado(`/api/girabot/conversas/${estado.conversaAtualId}/mensagens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conteudo: texto }),
    });

    const dados = await resposta.json();
    indicador.remove();

    if (!resposta.ok) {
      adicionarMensagem(
        dados.erro || '⚠️ Não consegui pensar em uma resposta agora. Tente novamente em instantes.',
        'erro'
      );
      return;
    }

    const balaoResposta = adicionarMensagem('', 'bot');
    await digitarTexto(balaoResposta, dados.mensagemAssistente.conteudo);

    if (dados.avisoNaoSalvo) {
      adicionarMensagem('⚠️ Essa resposta não foi salva no seu histórico. Se recarregar a página, ela pode não aparecer.', 'erro');
    }

    // Atualiza a entrada da conversa na sidebar (título gerado na primeira
    // mensagem, ordenação por atividade mais recente).
    await carregarConversas();
  } catch (erro) {
    console.error('Erro ao conversar com o GiraBot:', erro);
    indicador.remove();
    adicionarMensagem(
      '⚠️ Não foi possível conectar com o Gira-Bot agora. Verifique sua conexão e tente novamente.',
      'erro'
    );
  } finally {
    estado.enviando = false;
    botaoEnviar.disabled = false;
  }
});

// --- Inicialização -----------------------------------------------------------

function limparEstadoDeConta() {
  estado.conversas = [];
  estado.conversaAtualId = null;
  chatMensagens.innerHTML = '';
  mostrarEstadoVazio();
  renderizarListaConversas();
}

if (usuarioEstaLogado()) {
  carregarConversas();
} else {
  // Visitante: mesmo comportamento de sempre (nenhum histórico, gate pede
  // conta só quando a pessoa tenta mandar uma mensagem).
  listaHistorico.innerHTML = '<p class="sidebar-historico-vazio">Crie uma conta para salvar suas conversas.</p>';
}

// Se a pessoa sair/entrar com outra conta nesta mesma aba (sem recarregar a
// página), o Supabase dispara este evento — limpamos tudo e recarregamos o
// histórico da conta nova, nunca misturando com o da anterior.
if (typeof supabaseClient !== 'undefined') {
  supabaseClient.auth.onAuthStateChange((evento) => {
    if (evento === 'SIGNED_OUT') {
      limparEstadoDeConta();
      listaHistorico.innerHTML = '<p class="sidebar-historico-vazio">Crie uma conta para salvar suas conversas.</p>';
    } else if (evento === 'SIGNED_IN') {
      limparEstadoDeConta();
      carregarConversas();
    }
  });
}
