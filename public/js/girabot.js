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

// Cria a "bolinha" que representa o Gira-Bot ao lado de cada mensagem dele
function criarAvatar() {
  const avatar = document.createElement('div');
  avatar.className = 'avatar-bot';
  avatar.setAttribute('aria-hidden', 'true');
  return avatar;
}

// Escapa HTML e aplica uma formatação mínima e segura ao texto do bot:
// parágrafos (linha em branco separa parágrafos) e **negrito**.
function formatarTextoBot(texto) {
  const escapado = texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const paragrafos = escapado.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const fonte = paragrafos.length ? paragrafos : [escapado];

  return fonte
    .map((p) => `<p>${p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</p>`)
    .join('');
}

// Cria e insere uma linha de mensagem na conversa.
// tipo: 'usuario' | 'bot' | 'erro' — usuário fica à direita, sem avatar;
// bot e erro ficam à esquerda, com a bolinha do Gira-Bot.
function adicionarMensagem(texto, tipo) {
  const linha = document.createElement('div');
  linha.className = `mensagem-linha ${tipo === 'usuario' ? 'usuario' : 'bot'}`;

  if (tipo !== 'usuario') {
    linha.appendChild(criarAvatar());
  }

  const balao = document.createElement('div');
  balao.className = `balao ${tipo}`;
  if (tipo === 'usuario') {
    balao.textContent = texto;
  } else {
    balao.innerHTML = formatarTextoBot(texto);
  }

  linha.appendChild(balao);
  chatMensagens.appendChild(linha);
  chatMensagens.scrollTop = chatMensagens.scrollHeight;
  return linha;
}

// Mostra um indicador de "digitando" (bolinha + três pontinhos pulsando)
// enquanto se espera a resposta do bot.
function mostrarDigitando() {
  const linha = document.createElement('div');
  linha.className = 'mensagem-linha bot';
  linha.id = 'linhaDigitando';
  linha.appendChild(criarAvatar());

  const balao = document.createElement('div');
  balao.className = 'balao bot balao-digitando';
  balao.innerHTML = '<span></span><span></span><span></span>';

  linha.appendChild(balao);
  chatMensagens.appendChild(linha);
  chatMensagens.scrollTop = chatMensagens.scrollHeight;
}

function removerDigitando() {
  const linha = document.getElementById('linhaDigitando');
  if (linha) linha.remove();
}

formEnvio.addEventListener('submit', (evento) => {
  evento.preventDefault();

  const texto = campoMensagem.value.trim();
  if (!texto) return;

  esconderEstadoVazio();
  adicionarMensagem(texto, 'usuario');
  campoMensagem.value = '';

  mostrarDigitando();

  // Pequeno atraso simulando o tempo de resposta, antes de mostrar o aviso
  setTimeout(() => {
    removerDigitando();
    adicionarMensagem(
      'O Gira-Bot ainda está em desenvolvimento e não pode responder no momento. Volte em breve!',
      'erro'
    );
  }, 900);
});
