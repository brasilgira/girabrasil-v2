// GiraBrasil — Envio de resultados para o ranking (usado por jogos-modal.js)
//
// Fluxo: ao começar uma partida o jogo chama GiraRanking.iniciar(jogo), que
// pede ao servidor uma "partida" (o servidor anota quem joga e a hora). Ao
// terminar, o jogo chama GiraRanking.enviar(partida, pontuacao).
//
// Regra de ouro: NENHUM resultado pode se perder em silêncio.
//  - se a partida não tinha sido criada (rede/sessão falhou no começo), cria na hora;
//  - se o envio falhar por rede/servidor, tenta de novo;
//  - se ainda assim falhar, guarda no navegador e reenvia na próxima vez que
//    uma página com este arquivo abrir (jogos ou ranking).
// Nada daqui pode atrapalhar o jogo: falhas viram `null` e a partida segue.
(function () {
  const BASE = '/api/ranking';
  const TEMPO_LIMITE_MS = 10000;
  const CHAVE_PENDENTES = 'girabrasil_ranking_pendentes';
  const VALIDADE_PENDENTE_MS = 7 * 24 * 60 * 60 * 1000;

  // Devolve { ok, status, dados }. Nunca lança erro.
  async function postar(url, corpo) {
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
    try {
      // fetchAutenticado (auth.js) manda o token do Supabase e lança erro se
      // não houver sessão. keepalive deixa o envio terminar mesmo se a pessoa
      // fechar o jogo ou a página logo após a partida.
      const resposta = await fetchAutenticado(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
        signal: controle.signal,
        keepalive: true,
      });
      let dados = null;
      try { dados = await resposta.json(); } catch (e) { /* sem corpo */ }
      return { ok: resposta.ok, status: resposta.status, dados };
    } catch (erro) {
      return { ok: false, status: 0, dados: null };
    } finally {
      clearTimeout(relogio);
    }
  }

  const espera = (ms) => new Promise((r) => setTimeout(r, ms));

  // Devolve uma Promise com { partidaId, valendo, restantes, limite } (ou null).
  // `valendo` é false quando o jogador já usou as partidas do dia (vira treino).
  function iniciar(jogo) {
    return postar(BASE + '/partidas', { jogo }).then((r) => (r.ok && r.dados && r.dados.partidaId ? r.dados : null));
  }

  // ── resultados pendentes (guardados no navegador) ──
  function lerPendentes() {
    try { return JSON.parse(localStorage.getItem(CHAVE_PENDENTES) || '[]'); } catch (e) { return []; }
  }
  function gravarPendentes(lista) {
    try { localStorage.setItem(CHAVE_PENDENTES, JSON.stringify(lista)); } catch (e) { /* sem espaço/bloqueado */ }
  }
  function guardarPendente(jogo, pontuacao) {
    const lista = lerPendentes();
    lista.push({ jogo, pontuacao, quando: Date.now() });
    gravarPendentes(lista.slice(-20));
  }

  // Envia uma pontuação para uma partida já criada. Tenta de novo se a falha
  // foi de rede/servidor (status 0 ou 5xx); erros 4xx são respostas finais.
  async function enviarNaPartida(partidaId, pontuacao) {
    let r = await postar(BASE + '/partidas/' + encodeURIComponent(partidaId) + '/pontuacao', { pontuacao });
    for (let tentativa = 0; tentativa < 2 && !r.ok && (r.status === 0 || r.status >= 500); tentativa++) {
      await espera(1500 * (tentativa + 1));
      r = await postar(BASE + '/partidas/' + encodeURIComponent(partidaId) + '/pontuacao', { pontuacao });
    }
    return r;
  }

  // `partida` é o que iniciar() devolveu (Promise). Devolve a resposta do
  // servidor ({ posicao, novoRecorde, treino... }) ou null.
  async function enviar(partida, pontuacao, jogo) {
    if (!Number.isInteger(pontuacao) || pontuacao <= 0) return null;
    let info = null;
    try { info = await partida; } catch (e) { info = null; }

    // A partida não foi criada no começo (sessão/rede): cria agora.
    if (!info || !info.partidaId) {
      info = jogo ? await iniciar(jogo) : null;
    }
    if (!info || !info.partidaId) {
      if (jogo) guardarPendente(jogo, pontuacao);
      return null;
    }
    const r = await enviarNaPartida(info.partidaId, pontuacao);
    if (r.ok) return r.dados;
    if (r.status === 0 || r.status >= 500 || r.status === 401) {
      if (jogo) guardarPendente(jogo, pontuacao);
    }
    return null;
  }

  // Reenvia o que ficou pendente (roda uma vez ao abrir a página).
  let reenviando = false;
  async function reenviarPendentes() {
    if (reenviando) return;
    const lista = lerPendentes().filter((p) => p && p.jogo && Number.isInteger(p.pontuacao) && Date.now() - p.quando < VALIDADE_PENDENTE_MS);
    if (!lista.length) { gravarPendentes([]); return; }
    if (typeof usuarioEstaLogado === 'function' && !usuarioEstaLogado()) return;
    reenviando = true;
    const restantes = [];
    for (const p of lista) {
      const info = await iniciar(p.jogo);
      if (!info) { restantes.push(p); continue; }
      const r = await enviarNaPartida(info.partidaId, p.pontuacao);
      if (!r.ok && (r.status === 0 || r.status >= 500 || r.status === 401)) restantes.push(p);
    }
    gravarPendentes(restantes);
    reenviando = false;
  }

  window.GiraRanking = { iniciar, enviar, reenviarPendentes };
  window.addEventListener('load', () => setTimeout(reenviarPendentes, 1500));
})();
