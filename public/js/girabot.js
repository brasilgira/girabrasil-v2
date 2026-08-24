const sidebar = document.getElementById('girabotSidebar');
const overlay = document.getElementById('girabotOverlay');
const botaoAbrirSidebar = document.getElementById('botaoAbrirSidebar');
const botaoFecharSidebar = document.getElementById('botaoFecharSidebar');

const estadoVazio = document.getElementById('estadoVazio');
const chatMensagens = document.getElementById('chatMensagens');
const formEnvio = document.getElementById('formEnvio');
const campoMensagem = document.getElementById('campoMensagem');

let estadoVazioEscondido = false;

// Histórico da conversa
let mensagens = [];


// ======================================================
// SIDEBAR
// ======================================================

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
    if (evento.key === 'Escape') {
        fecharSidebar();
    }
});


// ======================================================
// ESTADO INICIAL
// ======================================================

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


// ======================================================
// SUGESTÕES
// ======================================================

document.querySelectorAll('.sugestao-chip').forEach((chip) => {

    chip.addEventListener('click', () => {

        campoMensagem.value = chip.textContent;

        esconderEstadoVazio();

        campoMensagem.focus();
    });

});


// ======================================================
// "BOLINHA" QUE REPRESENTA O GIRA-BOT (sem emoji)
// ======================================================

function criarAvatar() {
    const avatar = document.createElement('div');
    avatar.className = 'avatar-bot';
    avatar.setAttribute('aria-hidden', 'true');
    return avatar;
}


// ======================================================
// ADICIONAR MENSAGEM DO USUÁRIO (ou erro)
// ======================================================

function adicionarMensagem(texto, tipo) {

    const linha = document.createElement('div');
    linha.className = `mensagem-linha ${tipo === 'usuario' ? 'usuario' : 'bot'}`;

    if (tipo !== 'usuario') {
        linha.appendChild(criarAvatar());
    }

    const balao = document.createElement('div');
    balao.className = `balao ${tipo}`;
    balao.textContent = texto;

    linha.appendChild(balao);

    chatMensagens.appendChild(linha);

    chatMensagens.scrollTop = chatMensagens.scrollHeight;

    return linha;
}


// ======================================================
// INDICADOR "GIRA-BOT ESTÁ PENSANDO"
// ======================================================

function mostrarPensando() {

    const linha = document.createElement('div');
    linha.className = 'mensagem-linha bot';
    linha.appendChild(criarAvatar());

    const balao = document.createElement('div');
    balao.className = 'balao bot balao-digitando';
    balao.innerHTML = `
        <span class="ponto"></span>
        <span class="ponto"></span>
        <span class="ponto"></span>
    `;

    linha.appendChild(balao);

    chatMensagens.appendChild(linha);

    chatMensagens.scrollTop = chatMensagens.scrollHeight;

    return linha;
}


// ======================================================
// EFEITO DE DIGITAÇÃO
// ======================================================

async function escreverResposta(elemento, texto) {

    // Velocidade da escrita
    const velocidade = 18;

    for (let i = 0; i < texto.length; i++) {

        elemento.textContent += texto[i];

        chatMensagens.scrollTop = chatMensagens.scrollHeight;

        // Pequena pausa entre caracteres
        await new Promise(resolve => {
            setTimeout(resolve, velocidade);
        });

    }
}


// ======================================================
// CRIAR BALÃO DO GIRA-BOT
// ======================================================

async function adicionarRespostaBot(texto) {

    const linha = document.createElement('div');
    linha.className = 'mensagem-linha bot';
    linha.appendChild(criarAvatar());

    const balao = document.createElement('div');
    balao.className = 'balao bot';

    const campoResposta = document.createElement('div');
    campoResposta.className = 'resposta-texto';
    balao.appendChild(campoResposta);

    linha.appendChild(balao);

    chatMensagens.appendChild(linha);

    chatMensagens.scrollTop = chatMensagens.scrollHeight;

    await escreverResposta(campoResposta, texto);

    return linha;
}


// ======================================================
// ENVIO
// ======================================================

formEnvio.addEventListener('submit', async (evento) => {

    evento.preventDefault();

    const texto = campoMensagem.value.trim();

    if (!texto) return;

    esconderEstadoVazio();

    // ------------------------------------------
    // MOSTRA MENSAGEM DO USUÁRIO
    // ------------------------------------------

    adicionarMensagem(texto, 'usuario');

    // Adiciona ao histórico
    mensagens.push({
        role: 'user',
        content: texto
    });

    // Limpa campo
    campoMensagem.value = '';

    // ------------------------------------------
    // MOSTRA "PENSANDO..."
    // ------------------------------------------

    const indicadorPensando = mostrarPensando();

    try {

        // ------------------------------------------
        // CHAMA O BACKEND
        // ------------------------------------------

        const resposta = await fetch('/api/girabot', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                messages: mensagens
            })

        });


        const dados = await resposta.json();


        // ------------------------------------------
        // VERIFICA ERRO
        // ------------------------------------------

        if (!resposta.ok) {

            throw new Error(
                dados.erro || 'Erro ao conversar com o Gira-Bot'
            );

        }


        // ------------------------------------------
        // REMOVE "PENSANDO..."
        // ------------------------------------------

        indicadorPensando.remove();


        // ------------------------------------------
        // ESCREVE A RESPOSTA GRADUALMENTE
        // ------------------------------------------

        await adicionarRespostaBot(dados.resposta);


        // ------------------------------------------
        // SALVA RESPOSTA NO HISTÓRICO
        // ------------------------------------------

        mensagens.push({
            role: 'assistant',
            content: dados.resposta
        });


    } catch (erro) {

        console.error(
            'Erro ao conversar com o Gira-Bot:',
            erro
        );


        // Remove indicador
        indicadorPensando.remove();


        // Mensagem de erro
        adicionarMensagem(
            'Não foi possível conectar ao Gira-Bot no momento. Tente novamente em alguns instantes.',
            'erro'
        );

    }

});
