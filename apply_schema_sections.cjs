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
    console.log('Lendo FULL_SCHEMA.sql...');
    const sql = fs.readFileSync(path.join(__dirname, 'FULL_SCHEMA.sql'), 'utf8');

    // Split based on logical sections (e.g., -- ====================)
    const sections = sql.split(/-- ============================================================/);
    console.log(`Total de seções lógicas: ${sections.length}`);

    await client.connect();
    console.log('Conectado!');

    for (let i = 0; i < sections.length; i++) {
        let section = sections[i].trim();
        if (!section) continue;

        console.log(`Aplicando seção ${i+1}/${sections.length}...`);
        try {
            await client.query(section);
            console.log(`Seção ${i+1} OK!`);
        } catch (err) {
            console.warn(`ERRO na seção ${i+1}: ${err.message}. Tentando continuar...`);
        }
    }

    console.log('PROCESSO CONCLUÍDO.');

  } catch (err) {
    console.error('FALHA:', err.message);
  } finally {
    await client.end();
  }
}

applySchema();
