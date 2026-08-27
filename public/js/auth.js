// ==========================================================================
// GiraBrasil — Simulação de autenticação (só front-end, por enquanto)
// Não existe backend de login/cadastro ainda. Igual o protótipo do colega
// avisa na tela: "fica salvo apenas neste navegador, não envia dados a
// nenhum servidor". Isso é proposital, serve pra já validar o fluxo de
// "logado / não logado" no resto do site (Jogos, GiraBot, Notícia).
//
// QUANDO O BACKEND DE VERDADE EXISTIR: as funções abaixo devem virar
// chamadas fetch pra rotas tipo POST /api/auth/entrar e /api/auth/cadastro,
// e o "usuário" deve vir de um token/sessão em vez do localStorage.
// ==========================================================================

const CHAVE_USUARIO = 'girabrasil_usuario';

function obterUsuarioLogado() {
  try {
    const bruto = localStorage.getItem(CHAVE_USUARIO);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

function definirUsuarioLogado(usuario) {
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

function sairDaConta() {
  localStorage.removeItem(CHAVE_USUARIO);
}

// Lê o parâmetro ?redirect= da URL (usado pra voltar a pessoa pra onde
// ela estava quando o aviso de conta apareceu — ver js/gate.js)
function obterRedirectDaUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('redirect');
}

// Se a pessoa já está logada e caiu numa página de login/cadastro,
// manda ela de volta em vez de mostrar o formulário de novo
function redirecionarSeJaLogado() {
  if (obterUsuarioLogado()) {
    window.location.href = obterRedirectDaUrl() || 'index.html';
  }
}
