// controllers/ranking.controller.js
//
// Ranking dos jogos (Sapo, Onça e Mico).
//
// Fluxo de uma partida:
//   1. O jogo chama POST /api/ranking/partidas -> o servidor anota quem e quando.
//   2. Ao terminar, chama POST /api/ranking/partidas/:id/pontuacao com o resultado.
//   3. O servidor confere o dono da partida, o estado dela e se a pontuação é
//      plausível para o tempo decorrido; só então atualiza o recorde.
// A página Ranking lê tudo por GET /api/ranking/:jogo (público).
const rankingModel = require('../models/ranking.model');
const perfilModel = require('../models/perfil.model');
const {
  JOGOS,
  CHAVES_JOGOS,
  PARTIDAS_VALENDO_POR_DIA,
  MICO_MAX_ENVIOS,
  limiteDePontuacao,
} = require('../config/ranking');

const LIMITE_PADRAO = 50;
const LIMITE_MAXIMO = 100;
const PARTIDAS_POR_MINUTO = 40;
const PONTUACAO_MAXIMA_ACEITA = 10000000; // trava barata antes de qualquer consulta

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jogoValido(valor) {
  return typeof valor === 'string' && Object.prototype.hasOwnProperty.call(JOGOS, valor);
}

// Nome usado só se for preciso criar a linha de `perfil` que faltava (mesmo
// fallback já usado em outros pontos do projeto).
function nomeParaPerfil(usuario) {
  return (
    usuario.user_metadata?.nome ||
    (usuario.email ? usuario.email.split('@')[0] : 'Jogador')
  );
}

function formatarLinha(linha) {
  return {
    posicao: linha.posicao,
    nome: linha.nome,
    avatarUrl: linha.avatar_url || null,
    pontuacao: linha.pontuacao,
    atingidoEm: linha.atingido_em,
  };
}

// POST /api/ranking/partidas  { jogo }  (precisa estar logado)
async function iniciarPartida(req, res) {
  try {
    const { jogo } = req.body || {};
    if (!jogoValido(jogo)) {
      return res.status(400).json({ erro: 'Jogo inválido.' });
    }

    const usuarioId = req.usuarioLogado.id;

    const recentes = await rankingModel.contarPartidasUltimoMinuto(usuarioId);
    if (recentes >= PARTIDAS_POR_MINUTO) {
      return res.status(429).json({ erro: 'Muitas partidas em pouco tempo. Aguarde um instante.' });
    }

        const limiteDiario = jogo === 'sapo' ? 1000000 : PARTIDAS_VALENDO_POR_DIA;
    let partida;
    try {
      partida = await rankingModel.criarPartida(usuarioId, jogo, limiteDiario);
    } catch (erro) {
      // 23503 = violação de foreign key: a conta existe no Supabase Auth mas a
      // linha de `perfil` ainda não foi criada. Cria e tenta de novo, uma vez.
      if (erro.code !== '23503') throw erro;
      await perfilModel.garantirPerfil(usuarioId, nomeParaPerfil(req.usuarioLogado));
      partida = await rankingModel.criarPartida(usuarioId, jogo, limiteDiario);
    }

    // Quantas partidas valendo ainda restam hoje (0 se esta já é só treino).
    let restantes = 0;
    if (partida.valendo) {
      const usadas = await rankingModel.contarPartidasValendoHoje(usuarioId, jogo);
      restantes = Math.max(0, limiteDiario - usadas);
    }

    return res.status(201).json({
      partidaId: partida.id,
      valendo: partida.valendo,
      restantes,
      limite: limiteDiario,
    });
  } catch (erro) {
    console.error('Erro ao iniciar partida do ranking:', erro);
    return res.status(500).json({ erro: 'Erro ao iniciar a partida.' });
  }
}

// POST /api/ranking/partidas/:id/pontuacao  { pontuacao }  (precisa estar logado)
async function enviarPontuacao(req, res) {
  try {
    const { id } = req.params;
    const { pontuacao } = req.body || {};

    if (!REGEX_UUID.test(id)) {
      return res.status(400).json({ erro: 'Partida inválida.' });
    }
    if (!Number.isInteger(pontuacao) || pontuacao < 0 || pontuacao > PONTUACAO_MAXIMA_ACEITA) {
      return res.status(400).json({ erro: 'Pontuação inválida.' });
    }

    const usuarioId = req.usuarioLogado.id;

    const partida = await rankingModel.obterPartidaDoDono(id, usuarioId);
    if (!partida) {
      return res.status(404).json({ erro: 'Partida não encontrada.' });
    }

    // Sapo e Onça: um resultado por partida. Mico: até um checkpoint por
    // rodada vencida (a pontuação do Mico é acumulada ao longo das rodadas).
    const ehMico = partida.jogo === 'mico';
    if (!ehMico && partida.finalizada_em) {
      return res.status(409).json({ erro: 'Esta partida já foi finalizada.' });
    }

    // Partida acima do limite diário: serve de treino, não entra no ranking.
    if (!partida.valendo) {
      await rankingModel.registrarEnvioNaPartida(partida.id, 0);
      return res.json({ jogo: partida.jogo, treino: true, novoRecorde: false });
    }

    const limite = limiteDePontuacao(partida.jogo, partida.segundos);
    if (pontuacao > limite) {
      // Resultado impossível para esse tempo: encerra a partida sem pontuar
      // (assim ela não serve para ficar "testando" valores) e deixa um aviso
      // no log para a equipe poder conferir.
      await rankingModel.registrarEnvioNaPartida(partida.id, 0);
      console.warn(
        `Ranking: pontuação rejeitada (${partida.jogo}) usuario=${usuarioId} ` +
        `enviada=${pontuacao} limite=${limite} segundos=${partida.segundos.toFixed(1)}`
      );
      return res.status(422).json({ erro: 'Pontuação inválida para a duração da partida.' });
    }

    await rankingModel.registrarEnvioNaPartida(partida.id, pontuacao);

    // Pontuação 0 não entra no ranking.
    const novoRecorde = pontuacao > 0
      ? await rankingModel.salvarRecordeSeMaior(usuarioId, partida.jogo, pontuacao, partida.id)
      : false;

    const desempenho = await rankingModel.obterDesempenhoDoUsuario(usuarioId, partida.jogo);

    return res.json({
      jogo: partida.jogo,
      novoRecorde,
      recorde: desempenho ? desempenho.pontuacao : null,
      posicao: desempenho ? desempenho.posicao : null,
    });
  } catch (erro) {
    console.error('Erro ao registrar pontuação:', erro);
    return res.status(500).json({ erro: 'Erro ao registrar a pontuação.' });
  }
}

// GET /api/ranking/:jogo?limite=50  (público)
async function obterClassificacao(req, res) {
  try {
    const { jogo } = req.params;
    if (!jogoValido(jogo)) {
      return res.status(404).json({ erro: 'Jogo não encontrado.' });
    }

    let limite = parseInt(req.query.limite, 10);
    if (!Number.isInteger(limite) || limite < 1) limite = LIMITE_PADRAO;
    limite = Math.min(limite, LIMITE_MAXIMO);

    const [classificacao, total] = await Promise.all([
      rankingModel.listarClassificacao(jogo, limite),
      rankingModel.contarJogadores(jogo),
    ]);

    // Cache curto só na borda (CDN): aliviar o banco sem deixar o ranking velho.
    res.set('Cache-Control', 'public, max-age=0, s-maxage=10');
    return res.json({
      jogo,
      nomeJogo: JOGOS[jogo].nome,
      unidade: JOGOS[jogo].unidade,
      total,
      limite,
      classificacao: classificacao.map(formatarLinha),
    });
  } catch (erro) {
    console.error('Erro ao buscar ranking:', erro);
    return res.status(500).json({ erro: 'Erro ao buscar o ranking.' });
  }
}

// GET /api/ranking/:jogo/meu  (precisa estar logado)
// Posição e pontuação de quem está logado, mesmo fora das primeiras colocações.
async function obterMeuDesempenho(req, res) {
  try {
    const { jogo } = req.params;
    if (!jogoValido(jogo)) {
      return res.status(404).json({ erro: 'Jogo não encontrado.' });
    }

    const desempenho = await rankingModel.obterDesempenhoDoUsuario(req.usuarioLogado.id, jogo);

    res.set('Cache-Control', 'private, no-store');
    return res.json({
      jogo,
      posicao: desempenho ? desempenho.posicao : null,
      pontuacao: desempenho ? desempenho.pontuacao : null,
      atingidoEm: desempenho ? desempenho.atingido_em : null,
    });
  } catch (erro) {
    console.error('Erro ao buscar desempenho do usuário:', erro);
    return res.status(500).json({ erro: 'Erro ao buscar o seu desempenho.' });
  }
}

// GET /api/ranking/destaques  (público)
// O 1º colocado atual de cada jogo + quantos jogadores cada jogo tem.
async function obterDestaques(req, res) {
  try {
    const [lideres, totais] = await Promise.all([
      rankingModel.listarLideres(),
      rankingModel.contarJogadoresPorJogo(),
    ]);

    const destaques = CHAVES_JOGOS.map((jogo) => {
      const lider = lideres.find((l) => l.jogo === jogo);
      const total = totais.find((t) => t.jogo === jogo);
      return {
        jogo,
        nomeJogo: JOGOS[jogo].nome,
        unidade: JOGOS[jogo].unidade,
        totalJogadores: total ? total.total : 0,
        lider: lider
          ? {
              nome: lider.nome,
              avatarUrl: lider.avatar_url || null,
              pontuacao: lider.pontuacao,
              atingidoEm: lider.atingido_em,
            }
          : null,
      };
    });

    res.set('Cache-Control', 'public, max-age=0, s-maxage=10');
    return res.json({ destaques });
  } catch (erro) {
    console.error('Erro ao buscar destaques do ranking:', erro);
    return res.status(500).json({ erro: 'Erro ao buscar os destaques.' });
  }
}

module.exports = {
  iniciarPartida,
  enviarPontuacao,
  obterClassificacao,
  obterMeuDesempenho,
  obterDestaques,
};
