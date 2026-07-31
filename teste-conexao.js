const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5433,
  user: 'girauser',
  password: 'Teste2026Senha',
  database: 'girabrasil',
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