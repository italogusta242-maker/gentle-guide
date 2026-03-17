const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:Wall99696332$@db.hyjpxscsixeoibzhhtaf.supabase.co:5432/postgres';

const client = new Client({
  connectionString: connectionString,
  connectionTimeoutMillis: 20000,
});

async function applySchema() {
  try {
    console.log('Lendo arquivo FULL_SCHEMA.sql...');
    const sql = fs.readFileSync(path.join(__dirname, 'FULL_SCHEMA.sql'), 'utf8');

    console.log('Conectando ao banco de dados...');
    await client.connect();
    console.log('Conectado com sucesso!');

    // Dividir o SQL por ponto e vírgula, mas sendo cuidadoso com gatilhos e funções
    // Uma abordagem melhor para arquivos gigantes é usar blocos ou tentar o arquivo todo de novo com logs melhores
    
    // Vamos tentar uma abordagem de "execução por partes" baseada em comentários de seção se existirem,
    // ou apenas rodar o arquivo todo com um timeout maior.
    
    console.log('Iniciando execução do SCHEMA completo...');
    // Aumentando o timeout para a query específica
    await client.query('SET statement_timeout = 60000'); // 60 segundos
    
    await client.query(sql);
    console.log('SCHEMA APLICADO COM SUCESSO!');

  } catch (err) {
    console.error('--- ERRO DURANTE A EXECUÇÃO ---');
    console.error('Mensagem:', err.message);
    if (err.detail) console.error('Detalhe:', err.detail);
    if (err.hint) console.error('Dica:', err.hint);
    if (err.where) console.error('Onde:', err.where);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applySchema();
