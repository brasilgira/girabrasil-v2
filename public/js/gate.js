// ==========================================================================
// GiraBrasil — Aviso "é preciso ter conta" (soft-gate)
// Componente genérico e reaproveitável. Qualquer página que precise pedir
// conta antes de liberar uma ação (jogar, conversar com o GiraBot,
// curtir/salvar/comentar) só precisa chamar abrirAvisoConta(mensagem).
//
// Depende de js/auth.js estar carregado antes dele (usa obterUsuarioLogado()).
// ==========================================================================

function usuarioEstaLogado() {
  return !!obterUsuarioLogado();
}

// Detecta se a página atual está numa subpasta (ex: public/biomas/*.html)
// pra montar o caminho certo até login.html/cadastro.html
function prefixoAte(arquivo) {
  const estaEmSubpasta = window.location.pathname.includes('/biomas/');
  return estaEmSubpasta ? `../${arquivo}` : arquivo;
}

function criarModalAvisoConta() {
  const overlay = document.createElement('div');
  overlay.id = 'avisoContaOverlay';
  overlay.className = 'aviso-conta-overlay';
  overlay.innerHTML = `
    <div class="aviso-conta-modal" role="dialog" aria-modal="true" aria-labelledby="avisoContaTitulo">
      <button class="aviso-conta-fechar" aria-label="Fechar">×</button>
      <div class="aviso-conta-icone">🔒</div>
      <h3 id="avisoContaTitulo">Crie uma conta pra continuar</h3>
      <p class="aviso-conta-mensagem"></p>
      <div class="aviso-conta-botoes">
        <a class="botao botao-primario" id="avisoContaCriar">Criar conta →</a>
        <a class="botao botao-secundario" id="avisoContaEntrar">Já tenho conta →</a>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (evento) => {
    if (evento.target === overlay) fecharAvisoConta();
  });
  overlay.querySelector('.aviso-conta-fechar').addEventListener('click', fecharAvisoConta);

  return overlay;
}

function fecharAvisoConta() {
  const overlay = document.getElementById('avisoContaOverlay');
  if (overlay) overlay.classList.remove('aberto');
}

// Abre o aviso com uma mensagem específica do contexto (ex: "pra jogar",
// "pra conversar com o Gira-Bot", "pra curtir esta notícia")
function abrirAvisoConta(mensagem) {
  const overlay = document.getElementById('avisoContaOverlay') || criarModalAvisoConta();

  overlay.querySelector('.aviso-conta-mensagem').textContent = mensagem;

  // Depois de logar/cadastrar, a pessoa volta pra própria página onde
  // estava tentando fazer a ação — sem esse redirect ela cairia sempre
  // na Início depois de entrar, o que é uma experiência ruim.
  const paginaAtual = encodeURIComponent(
    window.location.pathname.split('/').pop() || 'index.html'
  );

  overlay.querySelector('#avisoContaCriar').href = `${prefixoAte('cadastro.html')}?redirect=${paginaAtual}`;
  overlay.querySelector('#avisoContaEntrar').href = `${prefixoAte('login.html')}?redirect=${paginaAtual}`;

  overlay.classList.add('aberto');
}

// Fecha com a tecla Esc, em qualquer página que use o aviso
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') fecharAvisoConta();
});
