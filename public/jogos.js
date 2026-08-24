// GiraBrasil — Seletor de jogos (página jogos.html)
// Controla qual card fica "aberto" no seletor de modo de jogo.
// Só cuida do visual (abrir/fechar card); a lógica de cada jogo em si
// continua a cargo de quem implementar via [data-jogo="..."].

document.addEventListener('DOMContentLoaded', () => {
  const seletor = document.getElementById('seletorJogos');
  if (!seletor) return;

  const cards = Array.from(seletor.querySelectorAll('.jogo-card'));

  function abrirCard(cardAlvo) {
    cards.forEach((card) => {
      const estaAtivo = card === cardAlvo;
      card.classList.toggle('ativo', estaAtivo);
      card.setAttribute('aria-pressed', estaAtivo ? 'true' : 'false');
    });
  }

  // Detecta se o dispositivo tem hover de verdade (mouse) — em telas de
  // toque isso dá 'false', então pulamos o listener de mouseenter abaixo.
  const temHoverDeVerdade = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  cards.forEach((card) => {
    if (temHoverDeVerdade) {
      // Passar o mouse por cima já seleciona (abre) o card — só pra
      // desktop. Em touch, navegadores podem simular esse evento no
      // toque e isso atrapalharia o fluxo de dois toques exigido
      // abaixo (abrir card → depois clicar em Jogar).
      card.addEventListener('mouseenter', () => {
        if (card.classList.contains('ativo')) return;
        abrirCard(card);
      });
    }

    // Clique sempre abre o card (obrigatório em telas menores/toque,
    // já que ali não existe o mouseenter acima). Se o card já está
    // aberto, deixa os links internos (Jogar/Detalhes) funcionarem
    // normalmente em vez de "recapturar" o clique.
    card.addEventListener('click', (evento) => {
      if (card.classList.contains('ativo')) return;
      evento.preventDefault();
      abrirCard(card);
    });
  });

  // Navegação por setinhas do teclado (← →) — troca qual jogo está
  // selecionado. Se nenhum estiver selecionado ainda, a primeira seta
  // pressionada abre o primeiro (→) ou o último (←) card.
  document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'ArrowRight' && evento.key !== 'ArrowLeft') return;

    // Não interfere se o foco estiver em outro campo interativo (ex: input)
    const alvoFoco = document.activeElement;
    if (alvoFoco && /^(INPUT|TEXTAREA|SELECT)$/.test(alvoFoco.tagName)) return;

    evento.preventDefault();

    const indiceAtual = cards.findIndex((card) => card.classList.contains('ativo'));
    let proximoIndice;

    if (indiceAtual === -1) {
      proximoIndice = evento.key === 'ArrowRight' ? 0 : cards.length - 1;
    } else if (evento.key === 'ArrowRight') {
      proximoIndice = (indiceAtual + 1) % cards.length;
    } else {
      proximoIndice = (indiceAtual - 1 + cards.length) % cards.length;
    }

    const proximoCard = cards[proximoIndice];
    abrirCard(proximoCard);
    proximoCard.focus();
  });
});
