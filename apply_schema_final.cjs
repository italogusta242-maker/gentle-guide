const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:Wall99696332$@db.hyjpxscsixeoibzhhtaf.supabase.co:5432/postgres';

const client = new Client({
  connectionString: connectionString,
  connectionTimeoutMillis: 60000,
});

async function applySchema() {
  try {
    console.log('--- INICIANDO PROCESSO DE SCHEMA (CHUNKS) ---');
    const sqlPath = path.join(__dirname, 'FULL_SCHEMA.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('Arquivo lido. Tamanho:', sqlContent.length, 'bytes');

    console.log('Conectando ao banco de dados...');
    await client.connect();
    console.log('CONECTADO!');

    // Dividir em blocos lógicos por ; e \n
    const chunks = sqlContent.split(/;\s*\n/);
    console.log(`Total de blocos: ${chunks.length}`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim();
      if (!chunk || chunk.startsWith('--')) continue;

      try {
        process.stdout.write(`Bloco ${i+1}/${chunks.length}... `);
        await client.query(chunk + ';');
        process.stdout.write('OK\n');
      } catch (err) {
        process.stdout.write('ERRO\n');
        // Ignorar erros de "já existe"
        if (err.message.includes('already exists') || err.message.includes('already a member')) {
          console.log('  (Ignorado: Já existe)');
        } else {
          console.error('ERRO CRÍTICO:', err.message);
          console.error('CONTEÚDO DO BLOCO:', chunk.substring(0, 300));
          throw err;
        }
      }
    }

    console.log('SCHEMA APLICADO COM SUCESSO!');

  } catch (err) {
    console.error('\n!!! FALHA NO PROCESSO !!!');
    console.error(err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applySchema();
