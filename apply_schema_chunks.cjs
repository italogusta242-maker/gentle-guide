const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Reduzindo o host para IPv4 explicitamente se possível, ou mantendo o original
const connectionString = 'postgresql://postgres:Wall99696332$@db.hyjpxscsixeoibzhhtaf.supabase.co:5432/postgres';

const client = new Client({
  connectionString: connectionString,
  connectionTimeoutMillis: 60000, // 60 segundos para conectar
});

async function applySchema() {
  try {
    console.log('--- INICIANDO PROCESSO DE SCHEMA ---');
    const sqlPath = path.join(__dirname, 'FULL_SCHEMA.sql');
    console.log('Caminho do arquivo:', sqlPath);
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Arquivo não encontrado: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('Arquivo lido. Tamanho:', sqlContent.length, 'bytes');

    console.log('Conectando ao banco de dados...');
    await client.connect();
    console.log('CONECTADO COM SUCESSO!');

    // Tentar rodar em blocos de 50.000 caracteres (aproximadamente)
    const chunkSize = 50000;
    const totalLength = sqlContent.length;
    let offset = 0;
    let chunkIndex = 1;

    console.log('Iniciando aplicação por CHUNKS...');

    while (offset < totalLength) {
      // Tentar encontrar o final de um comando (;) dentro do próximo chunk
      let endOffset = offset + chunkSize;
      if (endOffset > totalLength) endOffset = totalLength;
      
      // Ajustar endOffset para o próximo ponto e vírgula
      const nextSemicolon = sqlContent.indexOf(';', endOffset);
      if (nextSemicolon !== -1 && nextSemicolon < offset + chunkSize * 1.5) {
        endOffset = nextSemicolon + 1;
      }

      const chunk = sqlContent.substring(offset, endOffset);
      console.log(`Enviando Chunk ${chunkIndex} (${offset} - ${endOffset})...`);
      
      try {
        await client.query(stmt => stmt, [chunk]); // Note: query(string) is better
        await client.query(chunk);
        console.log(`Chunk ${chunkIndex} OK!`);
      } catch (chunkErr) {
        console.error(`ERRO NO CHUNK ${chunkIndex}:`, chunkErr.message);
        // Se falhar, vamos logar os primeiros 200 caracteres do chunk que falhou
        console.error('Início do chunk falho:', chunk.substring(0, 200));
        throw chunkErr;
      }

      offset = endOffset;
      chunkIndex++;
    }

    console.log('PARABÉNS! SCHEMA TOTALMENTE APLICADO.');

  } catch (err) {
    console.error('\n!!! FALHA NO PROCESSO !!!');
    console.error('Mensagem:', err.message);
    if (err.stack) console.error('Stack:', err.stack);
    process.exit(1);
  } finally {
    try {
      await client.end();
      console.log('Conexão encerrada.');
    } catch (e) {}
  }
}

applySchema();
 Joseph
