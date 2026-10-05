// Liga o aviso de conta nos botões "Jogar" de cada card.

document.querySelectorAll('.jogo-botoes .botao-jogar').forEach((botaoJogar) => {
  botaoJogar.addEventListener('click', (evento) => {
    if (!usuarioEstaLogado()) {
      evento.preventDefault();
      // Evita que o clique "vaze" pro <button class="jogo-card"> que
      // envolve esse link e acabe expandindo/recolhendo o card sem querer
      evento.stopPropagation();
      abrirAvisoConta('Crie uma conta pra jogar e salvar seu progresso nos jogos educativos.');
    }
    // Se já estiver logado, o clique segue normal — o jogos-modal.js
    // (motor de jogo) cuida do resto.
  });
});
