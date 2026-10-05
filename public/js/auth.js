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

// Atualiza só os campos passados no usuário em cache (ex: avatar_url vindo
// do perfil), sem apagar o resto (id, nome, email, is_admin). Usado pra
// sincronizar o avatar escolhido no perfil com a bolinha do header, sem
// criar um segundo lugar de armazenamento — continua sendo o mesmo
// localStorage que o auth.js já controla.
function atualizarCamposUsuarioLogado(campos) {
  const atual = obterUsuarioLogado();
  if (!atual) return;
  const atualizado = { ...atual, ...campos };
  definirUsuarioLogado(atualizado);
  if ('avatar_url' in campos) atualizarAvatarHeader(atualizado);
}

async function sairDaConta() {
  localStorage.removeItem(CHAVE_USUARIO);
  try {
    await supabaseClient.auth.signOut();
  } catch {
    // mesmo que falhe na rede, o cache local já foi limpo
  }
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

// ---- Checagem de nome (usada pelo cadastro antes de chamar signUp) -------
// Best-effort: dá feedback cedo (nome duplicado/ofensivo/tamanho). A
// garantia definitiva de unicidade depende de uma constraint no banco
// (proposta, não aplicada — ver relatório). Se a checagem falhar por
// causa de rede, deixamos passar (o resultado traz verificacaoFalhou)
// pra não travar o cadastro por um problema transitório.
async function verificarNomeDisponivel(nome) {
  try {
    const resposta = await fetch(`/api/auth/nome-disponivel?nome=${encodeURIComponent(nome)}`);
    return await resposta.json();
  } catch {
    return { disponivel: true, verificacaoFalhou: true };
  }
}

// ---- Cadastro ------------------------------------------------------------
// Único caminho de cadastro: Supabase Auth (auth.signUp). O nome vai em
// user_metadata (sem tabela extra). avatarUrl é opcional — se vier (foto
// de espécie escolhida ou upload concluído), é salva no perfil logo
// depois do signUp, usando o mesmo PUT /api/perfil/:id que a tela de
// perfil já usa (nenhum mecanismo novo).
//
// Lança Error em caso de falha — quem chama decide como mostrar isso
// (cadastro.html usa toast + mensagem inline). Não redireciona sozinho.
async function cadastrarUsuario({ nome, email, senha, avatarUrl } = {}) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome },
    },
  });

  if (error) {
    throw new Error(traduzirErroSupabase(error, 'cadastro'));
  }
  if (!data.user) {
    throw new Error('Não foi possível criar a conta agora. Tente novamente.');
  }

  definirUsuarioLogado({
    email,
    nome,
    id: data.user.id,
    is_admin: data.user.app_metadata?.is_admin === true,
  });

  // Se a conta foi criada mas o e-mail precisa de confirmação, não existe
  // sessão ainda — fetchAutenticado (usado pelo PUT de avatar) exige
  // token, então só tenta salvar o avatar se já houver sessão ativa.
  if (avatarUrl && data.session) {
    try {
      await fetchAutenticado(`/api/perfil/${encodeURIComponent(data.user.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl }),
      });
      atualizarCamposUsuarioLogado({ avatar_url: avatarUrl });
    } catch (erroAvatar) {
      // A conta já existe nesse ponto — não falha o cadastro inteiro por
      // causa da foto. A pessoa pode trocar depois no perfil.
      console.error('Conta criada, mas a foto inicial não pôde ser salva:', erroAvatar);
    }
  }

  return { usuario: data.user, precisaConfirmarEmail: !data.session };
}

// ---- Login -----------------------------------------------------------
// Mesma ideia do cadastro: lança Error em vez de alert, não redireciona
// sozinho.
async function logarUsuario({ email, senha } = {}) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });

  if (error) {
    throw new Error(traduzirErroSupabase(error, 'login'));
  }

  const meta = (data.user && data.user.user_metadata) || {};
  const nome = meta.nome || meta.display_name || email.split('@')[0];

  definirUsuarioLogado({
    email,
    nome,
    id: data.user ? data.user.id : null,
    is_admin: data.user?.app_metadata?.is_admin === true,
  });

  return data.user;
}

// Mensagens do Supabase vêm em inglês e às vezes técnicas demais pra
// mostrar direto pro usuário — traduz só os casos mais comuns.
function traduzirErroSupabase(error, contexto) {
  const msg = error?.message || '';
  if (msg === 'Invalid login credentials') return 'E-mail ou senha incorretos.';
  if (msg.includes('User already registered')) return 'Já existe uma conta com esse e-mail.';
  if (msg.includes('Password should be at least')) return msg.replace('Password should be at least', 'A senha precisa ter pelo menos').replace('characters', 'caracteres');
  if (msg.includes('Unable to validate email address')) return 'E-mail inválido.';
  if (msg.includes('Database error saving new user')) return 'Não foi possível concluir o cadastro agora. Tente novamente em instantes.';
  return contexto === 'cadastro'
    ? 'Não foi possível criar a conta agora. Tente novamente.'
    : 'Não foi possível entrar. Tente novamente.';
}

// ---- Recuperação de senha (via e-mail, pelo próprio Supabase Auth) -------
// Não cria nenhum mecanismo paralelo: usa o fluxo nativo do Supabase.
// 1) enviarEmailRecuperacao: dispara o e-mail com um link mágico.
// 2) O link leva a pessoa pra redirectTo (redefinir-senha.html) já com uma
//    sessão temporária de recuperação criada pelo próprio Supabase.
// 3) redefinirSenha: troca a senha nessa sessão temporária.
async function enviarEmailRecuperacao(email) {
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/redefinir-senha.html`,
  });
  if (error) {
    throw new Error('Não foi possível enviar o e-mail agora. Tente novamente em instantes.');
  }
}

async function redefinirSenha(novaSenha) {
  const { error } = await supabaseClient.auth.updateUser({ password: novaSenha });
  if (error) {
    throw new Error(traduzirErroSupabase(error, 'cadastro'));
  }
}

// ---- Header (Entrar/Criar conta -> nome + avatar) -------------------------

function iniciaisDoNome(nome) {
  return (nome || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

// O avatar é salvo como caminho relativo à raiz do site (ex.:
// "assets/games/species/onca.jpg"). Nas páginas dentro de /regioes/ e
// /biomas/ esse caminho resolvia para /regioes/assets/... (que não existe),
// e a foto não carregava. Aqui sobe uma pasta quando preciso; URLs absolutas
// (http, data:, /) passam direto.
function resolverCaminhoAvatar(url) {
  if (!url) return url;
  if (/^(https?:|data:|blob:|\/)/i.test(url)) return url;
  const emSubpasta = /\/(biomas|regioes)\//.test(window.location.pathname);
  return (emSubpasta ? '../' : '') + url.replace(/^\.?\//, '');
}

// Preenche só o conteúdo da bolinha (.perfil-avatar): foto se avatar_url
// existir, iniciais caso contrário. Nunca usa innerHTML com texto do
// usuário — tudo via textContent/DOM, pra evitar XSS no nome.
function atualizarAvatarHeader(usuario) {
  const el = document.querySelector('.perfil-avatar');
  if (!el || !usuario) return;

  el.textContent = '';
  if (usuario.avatar_url) {
    // Estilo aplicado também inline (não só via CSS externo) pra garantir
    // o recorte circular mesmo se css/base.css estiver em cache antigo
    // numa implantação — não depende de nada além deste próprio script.
    el.style.overflow = 'hidden';
    const img = document.createElement('img');
    img.src = resolverCaminhoAvatar(usuario.avatar_url);
    img.alt = '';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.objectPosition = 'center';
    img.style.display = 'block';
    img.style.borderRadius = '50%';
    el.appendChild(img);
  } else {
    const nome = usuario.nome || (usuario.email ? usuario.email.split('@')[0] : '');
    el.textContent = iniciaisDoNome(nome) || '?';
  }
}

function renderizarHeaderAuth() {
  const container = document.querySelector('.header-acoes');
  if (!container) return;
  if (container.querySelector('#perfilUsuario')) return; // já foi renderizado
  const usuario = obterUsuarioLogado();
  if (!usuario) return; // mantém o HTML padrão (Entrar / Criar conta)

  const nome = usuario.nome || usuario.email.split('@')[0];

  const emSubpasta = /\/(biomas|regioes)\//.test(window.location.pathname);
  const raiz = emSubpasta ? '../' : '';

  const wrapper = document.createElement('div');
  wrapper.className = 'perfil-menu-wrap';

  // Botão (nome + foto): abre/fecha o menu em vez de ir direto pro perfil
  const gatilho = document.createElement('button');
  gatilho.type = 'button';
  gatilho.className = 'perfil-usuario';
  gatilho.id = 'perfilUsuario';
  gatilho.setAttribute('aria-haspopup', 'menu');
  gatilho.setAttribute('aria-expanded', 'false');

  const avatar = document.createElement('span');
  avatar.className = 'perfil-avatar';

  const nomeEl = document.createElement('span');
  nomeEl.className = 'perfil-nome';
  nomeEl.textContent = nome;

  const seta = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  seta.setAttribute('viewBox', '0 0 24 24');
  seta.setAttribute('fill', 'none');
  seta.setAttribute('stroke', 'currentColor');
  seta.setAttribute('stroke-width', '2.2');
  seta.setAttribute('stroke-linecap', 'round');
  seta.setAttribute('stroke-linejoin', 'round');
  seta.setAttribute('aria-hidden', 'true');
  seta.classList.add('perfil-seta');
  const setaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  setaPath.setAttribute('d', 'm6 9 6 6 6-6');
  seta.appendChild(setaPath);

  gatilho.append(avatar, nomeEl, seta);

  // Menu com as duas escolhas
  const menu = document.createElement('div');
  menu.className = 'perfil-menu';
  menu.setAttribute('role', 'menu');

  const itemPerfil = document.createElement('a');
  itemPerfil.className = 'perfil-menu__item';
  itemPerfil.href = raiz + 'perfil.html';
  itemPerfil.setAttribute('role', 'menuitem');
  itemPerfil.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>Meu perfil';

  const itemSair = document.createElement('button');
  itemSair.type = 'button';
  itemSair.className = 'perfil-menu__item perfil-menu__item--sair';
  itemSair.setAttribute('role', 'menuitem');
  itemSair.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>Sair da conta';

  menu.append(itemPerfil, itemSair);
  wrapper.append(gatilho, menu);
  container.innerHTML = '';
  container.appendChild(wrapper);

  atualizarAvatarHeader(usuario);

  // avatar_url não vem do Supabase Auth (só nome/email/is_admin ficam em
  // cache no login) — então na primeira vez que o header aparece numa
  // sessão, ele ainda não sabe se existe avatar escolhido. Busca uma vez
  // no /api/perfil/:id (o mesmo endpoint que o perfil já usa) e guarda no
  // cache pra não precisar buscar de novo nas próximas páginas.
  if (usuario.avatar_url === undefined) {
    fetch(`/api/perfil/${encodeURIComponent(usuario.id)}`)
      .then((resposta) => (resposta.ok ? resposta.json() : null))
      .then((perfil) => {
        if (perfil) atualizarCamposUsuarioLogado({ avatar_url: perfil.avatar_url || null });
      })
      .catch(() => {}); // sem avatar por enquanto, sem problema — fica nas iniciais
  }

  function fecharMenu() {
    menu.classList.remove('aberto');
    gatilho.setAttribute('aria-expanded', 'false');
  }
  function alternarMenu() {
    const abrir = !menu.classList.contains('aberto');
    menu.classList.toggle('aberto', abrir);
    gatilho.setAttribute('aria-expanded', String(abrir));
  }

  gatilho.addEventListener('click', (evento) => {
    evento.stopPropagation();
    alternarMenu();
  });
  document.addEventListener('click', (evento) => {
    if (!wrapper.contains(evento.target)) fecharMenu();
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && menu.classList.contains('aberto')) {
      fecharMenu();
      gatilho.focus();
    }
  });

  itemSair.addEventListener('click', async () => {
    await sairDaConta();
    window.location.href = raiz + 'index.html';
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
