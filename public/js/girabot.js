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
// ADICIONAR MENSAGEM DO USUÁRIO
// ======================================================

function adicionarMensagem(texto, tipo) {

    const balao = document.createElement('div');

    balao.className = `mensagem ${tipo}`;

    balao.textContent = texto;

    chatMensagens.appendChild(balao);

    chatMensagens.scrollTop = chatMensagens.scrollHeight;

    return balao;
}


// ======================================================
// INDICADOR "GIRA-BOT ESTÁ PENSANDO"
// ======================================================

function mostrarPensando() {

    const container = document.createElement('div');

    container.className = 'mensagem bot pensando';

    container.innerHTML = `
        <div class="girabot-identidade">
            <span class="girabot-icone">🌿</span>
            <span>Gira-Bot</span>
        </div>

        <div class="pensando-conteudo">
            <span class="ponto"></span>
            <span class="ponto"></span>
            <span class="ponto"></span>
        </div>
    `;

    chatMensagens.appendChild(container);

    chatMensagens.scrollTop = chatMensagens.scrollHeight;

    return container;
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

    const mensagem = document.createElement('div');

    mensagem.className = 'mensagem bot';

    mensagem.innerHTML = `
        <div class="girabot-identidade">
            <span class="girabot-icone">🌿</span>
            <span>Gira-Bot</span>
        </div>

        <div class="resposta-texto"></div>
    `;

    chatMensagens.appendChild(mensagem);

    chatMensagens.scrollTop = chatMensagens.scrollHeight;

    const campoResposta = mensagem.querySelector('.resposta-texto');

    await escreverResposta(campoResposta, texto);

    return mensagem;
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
            '⚠️ Não foi possível conectar ao Gira-Bot no momento. Tente novamente em alguns instantes.',
            'erro'
        );

    }

});
