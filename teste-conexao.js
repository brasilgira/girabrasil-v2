require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect()
  .then(() => {
    console.log('CONECTOU COM SUCESSO!');
    return client.query('SELECT NOW()');
  })
  .then((res) => {
    console.log('Resultado:', res.rows);
    client.end();
  })
  .catch((err) => {
    console.error('ERRO:', err.message);
    client.end();
  });