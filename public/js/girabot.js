// O Gira-Bot agora conversa de verdade, via POST /api/girabot (que por
// trás chama a Groq API). Mantemos o histórico da conversa num array em
// memória (não persiste — recarregar a página reseta a conversa, já que
// ainda não existe backend de histórico).

const sidebar = document.getElementById('girabotSidebar');
const overlay = document.getElementById('girabotOverlay');
const botaoAbrirSidebar = document.getElementById('botaoAbrirSidebar');
const botaoFecharSidebar = document.getElementById('botaoFecharSidebar');

const estadoVazio = document.getElementById('estadoVazio');
const chatMensagens = document.getElementById('chatMensagens');
const formEnvio = document.getElementById('formEnvio');
const campoMensagem = document.getElementById('campoMensagem');

let estadoVazioEscondido = false;
let historicoMensagens = []; // [{ role: 'user'|'assistant', content: '...' }, ...]

// --- Sidebar retrátil ----------------------------------------------------

function abrirSidebar() {
  sidebar.classList.add('aberta');
  overlay.classList.add('visivel');
}

function fecharSidebar() {
  sidebar.classList.remove('aberta');
  overlay.classList.remove('visivel');
}

botaoAbrirSidebar.addEventListener('click', abrirSidebar);
botaoFecharSidebar.addEventListener('click', fecharSidebar);
overlay.addEventListener('click', fecharSidebar);

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') fecharSidebar();
});

// --- Estado vazio (boas-vindas) ------------------------------------------

function esconderEstadoVazio() {
  if (estadoVazioEscondido) return;
  estadoVazio.classList.add('escondido');
  estadoVazioEscondido = true;
}

campoMensagem.addEventListener('input', () => {
  if (campoMensagem.value.length > 0) {
    esconderEstadoVazio();
  }
});

document.querySelectorAll('.sugestao-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    campoMensagem.value = chip.textContent;
    esconderEstadoVazio();
    campoMensagem.focus();
  });
});

// --- Envio de mensagem -----------------------------------------------

// Cria e insere um balão de mensagem na conversa. Retorna o elemento
// criado, útil pra depois remover (ex: o indicador de "digitando...")
function adicionarMensagem(texto, tipo) {
  const balao = document.createElement('div');
  balao.className = `mensagem ${tipo}`;
  balao.textContent = texto;
  chatMensagens.appendChild(balao);
  chatMensagens.scrollTop = chatMensagens.scrollHeight;
  return balao;
}

formEnvio.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const texto = campoMensagem.value.trim();
  if (!texto) return;

  esconderEstadoVazio();
  adicionarMensagem(texto, 'usuario');
  campoMensagem.value = '';

  historicoMensagens.push({ role: 'user', content: texto });

  // Indicador visual de "digitando" enquanto espera a IA responder
  const indicador = adicionarMensagem('Gira-Bot está pensando...', 'bot pensando');

  try {
    const resposta = await fetch('/api/girabot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: historicoMensagens }),
    });

    const dados = await resposta.json();
    indicador.remove();

    if (!resposta.ok || !dados.resposta) {
      adicionarMensagem(
        '⚠️ Não consegui pensar em uma resposta agora. Tente novamente em instantes.',
        'erro'
      );
      return;
    }

    adicionarMensagem(dados.resposta, 'bot');
    historicoMensagens.push({ role: 'assistant', content: dados.resposta });
  } catch (erro) {
    // Erro de rede (sem internet, servidor fora do ar, etc.)
    console.error('Erro ao conversar com o GiraBot:', erro);
    indicador.remove();
    adicionarMensagem(
      '⚠️ Não foi possível conectar com o Gira-Bot agora. Verifique sua conexão e tente novamente.',
      'erro'
    );
  }
});
