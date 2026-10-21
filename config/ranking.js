// config/ranking.js
//
// Regras do ranking dos jogos num lugar só: quais jogos existem, em que
// unidade cada um pontua e até onde uma pontuação é considerada plausível.
//
// Por que "plausível"? Os jogos rodam inteiramente no navegador (canvas), então
// o servidor não consegue recalcular a partida. O que ele consegue é:
//   1. saber QUEM está jogando (token do Supabase, nunca o corpo da requisição);
//   2. saber QUANDO a partida começou (o servidor anota a hora de início);
//   3. recusar pontuações impossíveis para o tempo que a partida durou.
// Isso barra o envio de números inventados (ex.: 999999), mas não impede que
// alguém muito determinado jogue com um script/bot — por isso o ideal é a equipe
// conferir os três primeiros colocados antes de entregar qualquer prêmio.

const JOGOS = {
  sapo: { nome: 'De Volta ao Rio', apelido: 'Sapo', unidade: 'm' },
  onca: { nome: 'Fuga pela Floresta', apelido: 'Onça', unidade: 'm' },
  mico: { nome: 'Jogo do Mico', apelido: 'Mico', unidade: 'pontos' },
};

const CHAVES_JOGOS = Object.keys(JOGOS);

// Quantas partidas VALENDO cada jogador pode fazer por jogo, por dia (o dia vira
// à meia-noite, horário de Brasília). Depois disso o jogo segue como treino.
const PARTIDAS_VALENDO_POR_DIA = 5;

// Folga para latência de rede e pequenas diferenças de relógio entre o clique
// em "Começar" e a chegada do pedido de início no servidor.
const FOLGA_SEGUNDOS = 5;

// Tempo máximo considerado nos cálculos (2 horas). Partidas mais longas são
// tratadas como se tivessem 2 horas — o teto de pontuação para de crescer.
const TEMPO_MAXIMO_SEGUNDOS = 7200;

// --- Sapo (De Volta ao Rio) -------------------------------------------------
// Cada pulo leva 7 quadros de jogo (a 60 quadros/s ≈ 0,117 s) e só um comando
// fica na fila durante o pulo, então o sapo avança no máximo ~8,6 fileiras por
// segundo. Usamos 9,5 por segurança.
const SAPO_FILEIRAS_POR_SEGUNDO = 9.5;

function limiteSapo(segundos) {
  return Math.floor((segundos + FOLGA_SEGUNDOS) * SAPO_FILEIRAS_POR_SEGUNDO);
}

// --- Onça (Fuga pela Floresta) ---------------------------------------------
// Na engine: velocidade (px/quadro) = 4,8 + nível * 0,4; o nível sobe cada vez
// que a distância passa de nível * 1700 px; e a pontuação é distância / 6.
// Como o tempo do jogo nunca passa mais rápido que o tempo real, simulamos
// "a onça correndo sem nunca morrer" a 60 quadros/s para saber a distância
// máxima possível em N segundos. A tabela é montada uma única vez.
let tabelaOnca = null;

function montarTabelaOnca() {
  const tabela = new Float64Array(TEMPO_MAXIMO_SEGUNDOS + 1);
  let distancia = 0;
  let nivel = 1;
  for (let segundo = 1; segundo <= TEMPO_MAXIMO_SEGUNDOS; segundo++) {
    for (let quadro = 0; quadro < 60; quadro++) {
      const velocidade = 4.8 + nivel * 0.4;
      distancia += velocidade;
      if (distancia > nivel * 1700) nivel++;
    }
    tabela[segundo] = distancia;
  }
  return tabela;
}

// A velocidade da onça cresce sem parar, então o limite "por tempo" explode
// depois de alguns minutos. Em ~10.000 m a velocidade já passa de 19 px/quadro,
// o que nenhum jogador humano consegue acompanhar — usamos isso como teto fixo
// (também evita estourar o INTEGER do banco). Ajuste aqui se o jogo mudar.
const ONCA_PONTUACAO_MAXIMA = 10000;

function limiteOnca(segundos) {
  if (!tabelaOnca) tabelaOnca = montarTabelaOnca();
  const alvo = Math.min(TEMPO_MAXIMO_SEGUNDOS, Math.ceil(segundos + FOLGA_SEGUNDOS));
  return Math.min(ONCA_PONTUACAO_MAXIMA, Math.floor(tabelaOnca[alvo] / 6));
}

// --- Mico -------------------------------------------------------------------
// 5 rodadas (7, 9, 11, 13 e 17 cartas => 3, 4, 5, 6 e 8 pares = 26 pares).
// Por rodada vencida: bônus máximo de 1000 + 3000 (tempo) + 1000 (turnos) = 5000.
// Pares: 100 cada (2600) + combos (50 * (combo - 1) por turno, no máximo 3100).
// Total máximo teórico ~30.700 — arredondamos para 31.000.
const MICO_PONTUACAO_MAXIMA = 31000;
// Pontuação máxima por segundo de partida. Uma rodada vencida muito rápido
// rende ~500 pontos/s; 700 deixa folga para jogadores muito bons.
const MICO_PONTOS_POR_SEGUNDO = 700;
// A jogada do Mico envia a pontuação ao fim de cada rodada (5 rodadas + a derrota).
const MICO_MAX_ENVIOS = 12;

function limiteMico(segundos) {
  const porTempo = Math.floor((segundos + FOLGA_SEGUNDOS) * MICO_PONTOS_POR_SEGUNDO);
  return Math.min(MICO_PONTUACAO_MAXIMA, porTempo);
}

// Trava de SANIDADE apenas (impede número absurdo/estouro do banco). Não tenta
// adivinhar o que é "possível" em cada jogo: uma versão anterior fazia isso e
// recusou pontuações legítimas altas. Os resultados são sempre aceitos; o
// histórico (jogo_partida: início, fim e pontuação) fica para a equipe conferir
// os primeiros colocados antes de premiar.
const PONTUACAO_MAXIMA_ABSURDA = 2000000;

function limiteDePontuacao() {
  return PONTUACAO_MAXIMA_ABSURDA;
}

module.exports = {
  JOGOS,
  CHAVES_JOGOS,
  PARTIDAS_VALENDO_POR_DIA,
  MICO_MAX_ENVIOS,
  limiteDePontuacao,
};
