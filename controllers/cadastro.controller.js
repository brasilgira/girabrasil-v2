// Validações de cadastro que precisam de autoridade no backend (nome
// duplicado e termos ofensivos) — o frontend chama isto ANTES de criar a
// conta no Supabase Auth, pra dar feedback cedo. Não substitui a
// constraint do banco (ver migration proposta), é só a primeira camada.

const pool = require('../config/db');

// Lista curta e deliberadamente conservadora: só termos inequivocamente
// ofensivos em português, pra evitar falso positivo em nomes comuns.
// Comparação é por palavra inteira (não por substring), então nomes como
// "Carla" ou "Putnam" não são afetados por coincidência de letras.
const TERMOS_PROIBIDOS = [
  'porra', 'caralho', 'buceta', 'piroca', 'cacete', 'cuzao', 'cuzão',
  'arrombado', 'arrombada', 'viado', 'bicha', 'puta', 'putinha',
  'desgraçado', 'desgracado', 'retardado', 'retardada', 'imbecil',
  'idiota', 'vagabundo', 'vagabunda', 'corno', 'corna', 'otario', 'otário',
  'fdp', 'vsf', 'pqp',
];

function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos pra comparar
    .toLowerCase();
}

function contemTermoProibido(nome) {
  const palavras = normalizar(nome).split(/[^a-z0-9]+/).filter(Boolean);
  const proibidosNormalizados = TERMOS_PROIBIDOS.map(normalizar);
  return palavras.some((palavra) => proibidosNormalizados.includes(palavra));
}

// GET /api/auth/nome-disponivel?nome=...
// Checagem best-effort (não é garantia de unicidade sozinha — isso exige
// a constraint no banco, ver proposta de migration no relatório final).
async function verificarNome(req, res) {
  try {
    const nome = (req.query.nome || '').toString().trim();

    if (!nome) {
      return res.status(400).json({ erro: 'Informe um nome.' });
    }
    if (nome.length < 2 || nome.length > 40) {
      return res.json({ disponivel: false, motivo: 'tamanho', mensagem: 'O nome precisa ter entre 2 e 40 caracteres.' });
    }
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1f\x7f]/.test(nome)) {
      return res.json({ disponivel: false, motivo: 'invalido', mensagem: 'O nome contém caracteres inválidos.' });
    }
    if (contemTermoProibido(nome)) {
      return res.json({ disponivel: false, motivo: 'ofensivo', mensagem: 'Esse nome não pode ser usado. Escolha outro, por favor.' });
    }

    const resultado = await pool.query(
      'SELECT 1 FROM perfil WHERE lower(nome) = lower($1) LIMIT 1',
      [nome]
    );

    if (resultado.rows.length > 0) {
      return res.json({ disponivel: false, motivo: 'duplicado', mensagem: 'Esse nome já está sendo usado por outra conta.' });
    }

    return res.json({ disponivel: true });
  } catch (erro) {
    console.error('Erro ao verificar nome:', erro);
    // Falha na checagem não deve travar o cadastro — melhor deixar passar
    // aqui (o backend de signup continua sendo a fonte final de verdade
    // quando a constraint do banco existir) do que bloquear por um erro
    // transitório de rede/banco.
    return res.json({ disponivel: true, verificacaoFalhou: true });
  }
}

module.exports = { verificarNome, contemTermoProibido };
