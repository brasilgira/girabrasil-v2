// Liga o aviso de conta nos botões "Jogar" de cada card.
// Arquivo separado de propósito — jogos.js e jogos-modal.js já cuidam do
// comportamento de expandir/recolher card e do motor de jogo (canvas),
// e não devem ser tocados aqui.
//
// Depende de js/auth.js e js/gate.js estarem carregados antes deste.

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
