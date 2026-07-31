// Esse arquivo é o único responsável por conectar o projeto ao PostgreSQL.
// Ele exporta um "pool" de conexões, que o resto do projeto reaproveita.

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;