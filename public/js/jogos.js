// Antes de deixar jogar, verifica se a pessoa tem "conta" (localStorage).
// Se não tiver, mostra o aviso em vez de deixar o clique seguir adiante.
// Depende de js/auth.js e js/gate.js estarem carregados antes deste.

document.querySelectorAll('.jogo-card .botao-primario').forEach((botaoJogar) => {
  botaoJogar.addEventListener('click', (evento) => {
    if (!usuarioEstaLogado()) {
      evento.preventDefault();
      abrirAvisoConta('Crie uma conta pra jogar e salvar seu progresso nos jogos educativos.');
    }
    // Se estiver logado, o clique segue normalmente (por enquanto isso só
    // significa "não bloqueia" — a lógica de cada jogo em si ainda não
    // existe, fica pros amigos do Iago implementarem).
  });
});
