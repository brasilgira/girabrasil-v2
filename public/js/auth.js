// ==========================================================================
// GiraBrasil — Autenticação com Supabase (login.html e cadastro.html)
//
// IMPORTANTE: este arquivo usa EXCLUSIVAMENTE o Supabase Auth
// (supabaseClient.auth.signUp / signInWithPassword). Não existe mais
// nenhum caminho alternativo via fetch('/api/auth/cadastro') — se essa
// rota ainda existir no backend, ela não é mais chamada por este arquivo,
// porque ter dois sistemas de conta ao mesmo tempo é exatamente o que
// estava causando o login não reconhecer contas criadas pelo outro caminho.
//
// O restante do site (Jogos, GiraBot, Notícia) continua lendo o "usuário
// logado" do localStorage — guardamos os dados básicos lá depois que o
// Supabase confirma o login/cadastro. Isso agora inclui is_admin, lido do
// app_metadata do Supabase (o único lugar em que essa permissão pode ser
// setada — nunca pelo navegador).
// ==========================================================================

const CHAVE_USUARIO = 'girabrasil_usuario';
const SUPABASE_URL = 'https://tybkeihuwpelsmfdmzhj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LpIRhyUfQIl14Ud8vHcoSw_nfTLveAZ';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  supabaseClient.auth.signOut();
}

// ---- Token de acesso (pra chamadas autenticadas na nossa API) ------------
// FASE 3: as rotas que alteram dado em nome de um usuário (curtir, salvar,
// comentar, excluir comentário, editar perfil) agora exigem um token do
// Supabase válido no cabeçalho Authorization — não basta mais mandar o id
// no corpo da requisição. Esta função pega esse token da sessão atual do
// Supabase (guardada pelo próprio supabase-js, não é o mesmo localStorage
// de girabrasil_usuario).
async function obterTokenAcesso() {
  try {
    const { data } = await supabaseClient.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

// Helper pra chamar a nossa API já com o Authorization: Bearer <token>
// preenchido. Se não houver sessão válida, lança erro (quem chamar deve
// tratar isso pedindo login, igual já é feito com abrirAvisoConta).
async function fetchAutenticado(url, opcoes = {}) {
  const token = await obterTokenAcesso();
  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  const cabecalhos = {
    ...(opcoes.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  return fetch(url, { ...opcoes, headers: cabecalhos });
}

function obterRedirectDaUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('redirect');
}

function redirecionarSeJaLogado() {
  if (obterUsuarioLogado()) {
    window.location.href = obterRedirectDaUrl() || 'index.html';
  }
}

// ---- Cadastro ------------------------------------------------------------
// Único caminho de cadastro agora: Supabase Auth (auth.signUp).
// O nome vai em user_metadata, então não precisa de tabela extra.
async function cadastrarUsuario(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  const nome = document.querySelector('#nome')?.value.trim();
  const email = document.querySelector('#email')?.value.trim();
  const senha = document.querySelector('#senha')?.value.trim();

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome }
    }
  });

  if (error) {
    alert('Erro no cadastro: ' + error.message);
    return;
  }

  if (data.user) {
    definirUsuarioLogado({
      email,
      nome,
      id: data.user.id,
      is_admin: data.user.app_metadata?.is_admin === true
    });
    alert('Conta criada com sucesso!');
    window.location.href = obterRedirectDaUrl() || 'index.html';
  }
}

// ---- Login -----------------------------------------------------------
async function logarUsuario(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  const email = document.querySelector('#email')?.value.trim();
  const senha = document.querySelector('#senha')?.value.trim();

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) throw error;

    const meta = (data.user && data.user.user_metadata) || {};
    const nome = meta.nome || meta.display_name || email.split('@')[0];

    definirUsuarioLogado({
      email,
      nome,
      id: data.user ? data.user.id : null,
      is_admin: data.user?.app_metadata?.is_admin === true
    });

    alert('Login realizado com sucesso!');
    window.location.href = obterRedirectDaUrl() || 'index.html';
  } catch (error) {
    console.error('Erro de autenticação:', error);
    const mensagem = error.message === 'Invalid login credentials'
      ? 'E-mail ou senha incorretos.'
      : error.message;
    alert('Erro ao entrar: ' + mensagem);
  }
}

// ---- Header (Entrar/Criar conta -> nome + avatar) -------------------------
function renderizarHeaderAuth() {
  const container = document.querySelector('.header-acoes');
  if (!container) return;
  if (container.querySelector('#perfilUsuario')) return; // já foi renderizado
  const usuario = obterUsuarioLogado();
  if (!usuario) return; // mantém o HTML padrão (Entrar / Criar conta)

  const nome = usuario.nome || usuario.email.split('@')[0];
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  container.innerHTML = `
    <div class="perfil-usuario" id="perfilUsuario" title="Clique para sair">
      <span class="perfil-avatar">${iniciais}</span>
      <span class="perfil-nome">${nome}</span>
    </div>
  `;

  document.getElementById('perfilUsuario').addEventListener('click', () => {
    // Páginas dentro de /biomas/ e /regioes/ precisam voltar uma pasta
    const emSubpasta = /\/(biomas|regioes)\//.test(window.location.pathname);
    window.location.href = (emSubpasta ? '../' : '') + 'perfil.html';
  });

  renderizarLinkAdmin(usuario);
}

// ---- Link "Admin" no header (só aparece pra quem tem is_admin) -----------
function renderizarLinkAdmin(usuario) {
  const linkExistente = document.getElementById('header-link-admin');
  if (linkExistente) linkExistente.remove();

  if (!usuario || !usuario.is_admin) return;

  const link = document.createElement('a');
  link.id = 'header-link-admin';
  link.href = 'admin.html';
  link.textContent = 'Admin';
  link.className = 'header-link-admin';

if (window.location.pathname.endsWith('/admin.html')) {
  link.classList.add('ativo');
}
  
  const container = document.querySelector('.header-acoes');
  if (container) container.prepend(link);
}

document.addEventListener('DOMContentLoaded', renderizarHeaderAuth);

// Renderiza o header assim que ele termina de ser lido pelo navegador
// (evita piscar "Entrar / Criar conta" antes de mostrar o nome e o avatar).
(function () {
  function headerPronto() {
    const header = document.querySelector('.header-site');
    if (header && header.nextElementSibling) {
      renderizarHeaderAuth();
      return true;
    }
    return false;
  }
  if (headerPronto()) return;
  const observador = new MutationObserver(() => {
    if (headerPronto()) observador.disconnect();
  });
  observador.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => observador.disconnect());
})();
