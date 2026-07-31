// Esse arquivo só sabe conversar com a tabela "regiao" no banco.
// Nenhuma outra parte do projeto deve escrever SQL fora daqui.

const pool = require('../config/db');

// Busca todas as regiões cadastradas
async function listarTodas() {
  const resultado = await pool.query('SELECT * FROM regiao ORDER BY nome');
  return resultado.rows;
}

module.exports = { listarTodas };