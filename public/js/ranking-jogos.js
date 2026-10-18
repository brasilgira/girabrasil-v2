// GiraBrasil — Envio de resultados para o ranking (usado por jogos-modal.js)
//
// Fluxo: ao começar uma partida o jogo chama GiraRanking.iniciar(jogo), que
// pede ao servidor uma "partida" (o servidor anota quem joga e a hora). Ao
// terminar, o jogo chama GiraRanking.enviar(partida, pontuacao). O servidor
// decide se a pontuação vale — aqui o navegador só entrega o resultado.
//
// Nada daqui pode atrapalhar o jogo: todas as falhas (sem login, sem rede,
// servidor fora do ar) viram `null` e a partida segue normalmente.
(function () {
  const BASE = '/api/ranking';
  const TEMPO_LIMITE_MS = 8000;

  async function postar(url, corpo) {
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
    try {
      // fetchAutenticado (auth.js) já manda o token do Supabase e lança erro
      // se não houver sessão — nesse caso o resultado simplesmente não é salvo.
      const resposta = await fetchAutenticado(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
        signal: controle.signal,
      });
      if (!resposta.ok) return null;
      return await resposta.json();
    } catch (erro) {
      return null;
    } finally {
      clearTimeout(relogio);
    }
  }

  // Devolve uma Promise com o id da partida (ou null). Não precisa de await:
  // o jogo guarda a Promise e a entrega de volta em enviar().
  function iniciar(jogo) {
    return postar(BASE + '/partidas', { jogo }).then((dados) => (dados && dados.partidaId) || null);
  }

  // `partida` é o que iniciar() devolveu (Promise do id).
  async function enviar(partida, pontuacao) {
    const partidaId = await partida;
    if (!partidaId || !Number.isInteger(pontuacao) || pontuacao < 0) return null;
    return postar(BASE + '/partidas/' + encodeURIComponent(partidaId) + '/pontuacao', { pontuacao });
  }

  window.GiraRanking = { iniciar, enviar };
})();
