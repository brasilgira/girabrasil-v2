// Esse arquivo é o único responsável por conectar o projeto ao PostgreSQL.
// Ele exporta um "pool" de conexões, que o resto do projeto reaproveita.

require('dotenv').config();
console.log('Testando variáveis:', process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_NAME, process.env.DB_PORT, process.env.DB_HOST);
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST?.trim(),
  port: Number(process.env.DB_PORT?.trim()),
  user: process.env.DB_USER?.trim(),
  password: process.env.DB_PASSWORD?.trim(),
  database: process.env.DB_NAME?.trim(),
});

module.exports = pool;