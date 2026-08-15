// ATENÇÃO: o Gira-Bot ainda não tem IA de verdade conectada (isso é um
// passo futuro do roteiro, que vai integrar com a Groq API no backend).
// Por enquanto, este script só cuida da interface: mostrar a mensagem do
// usuário na tela e avisar que o bot ainda não está disponível.

const sidebar = document.getElementById('girabotSidebar');
const overlay = document.getElementById('girabotOverlay');
const botaoAbrirSidebar = document.getElementById('botaoAbrirSidebar');
const botaoFecharSidebar = document.getElementById('botaoFecharSidebar');

const estadoVazio = document.getElementById('estadoVazio');
const chatMensagens = document.getElementById('chatMensagens');
const formEnvio = document.getElementById('formEnvio');
const campoMensagem = document.getElementById('campoMensagem');

let estadoVazioEscondido = false;

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

// Fecha a sidebar com a tecla Esc, por acessibilidade
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') fecharSidebar();
});

// --- Estado vazio (boas-vindas) ------------------------------------------

// Esconde a tela de boas-vindas com fade out suave.
// Só executa uma vez (o CSS já cuida da transição via a classe .escondido).
function esconderEstadoVazio() {
  if (estadoVazioEscondido) return;
  estadoVazio.classList.add('escondido');
  estadoVazioEscondido = true;
}

// Assim que o usuário começa a digitar, o estado vazio já começa a sumir
campoMensagem.addEventListener('input', () => {
  if (campoMensagem.value.length > 0) {
    esconderEstadoVazio();
  }
});

// Clicar numa sugestão preenche o campo e foca nele, mas não envia sozinho
// (o usuário decide se quer editar antes de mandar)
document.querySelectorAll('.sugestao-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    campoMensagem.value = chip.textContent;
    esconderEstadoVazio();
    campoMensagem.focus();
  });
});

// --- Envio de mensagem -----------------------------------------------

// Cria e insere um balão de mensagem na conversa
function adicionarMensagem(texto, tipo) {
  const balao = document.createElement('div');
  balao.className = `mensagem ${tipo}`;
  balao.textContent = texto;
  chatMensagens.appendChild(balao);
  chatMensagens.scrollTop = chatMensagens.scrollHeight;
}

formEnvio.addEventListener('submit', (evento) => {
  evento.preventDefault();

  const texto = campoMensagem.value.trim();
  if (!texto) return;

  esconderEstadoVazio();
  adicionarMensagem(texto, 'usuario');
  campoMensagem.value = '';

  // Pequeno atraso simulando o tempo de resposta, antes de mostrar o aviso
  setTimeout(() => {
    adicionarMensagem(
      '⚠️ O Gira-Bot ainda está em desenvolvimento e não pode responder no momento. Volte em breve!',
      'erro'
    );
  }, 500);
});
