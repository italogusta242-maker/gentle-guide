const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:Wall99696332$@db.hyjpxscsixeoibzhhtaf.supabase.co:5432/postgres';

const client = new Client({
  connectionString: connectionString,
  connectionTimeoutMillis: 30000,
});

async function applySchema() {
  try {
    console.log('Lendo arquivo FULL_SCHEMA.sql...');
    const sqlContent = fs.readFileSync(path.join(__dirname, 'FULL_SCHEMA.sql'), 'utf8');

    // Split by semicolon followed by newline to try and avoid breaking functions
    // This is a heuristic.
    const statements = sqlContent.split(/;\s*\n/);
    console.log(`Total de declarações encontradas: ${statements.length}`);

    console.log('Conectando ao banco de dados...');
    await client.connect();
    console.log('Conectado!');

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt || stmt.startsWith('--')) continue;

      try {
        process.stdout.write(`Executando (${i + 1}/${statements.length})... `);
        await client.query(stmt);
        process.stdout.write('OK\n');
      } catch (stmtErr) {
        process.stdout.write('ERRO\n');
        console.error(`Erro na declaração ${i + 1}:`, stmtErr.message);
        console.error('Conteúdo da declaração:', stmt.substring(0, 100) + '...');
        // Opcional: decidir se continua ou para. Vamos parar no primeiro erro crítico.
        if (!stmtErr.message.includes('already exists') && !stmtErr.message.includes('already a member')) {
             throw stmtErr;
        }
      }
    }

    console.log('SCHEMA APLICADO COM SUCESSO!');

  } catch (err) {
    console.error('\n--- FALHA CRÍTICA ---');
    console.error(err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applySchema();
