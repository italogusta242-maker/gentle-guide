const fs = require('fs');
const path = require('path');

const DIRECTORY = path.join(__dirname, 'src');

const replacements = [
  // Exact quotes
  { regex: /Bem-vindo ao Coliseu/g, replace: 'Bem-vinda ao Desafio, Miri!' },
  { regex: /Sua Jornada Épica Começa Agora/g, replace: 'Sua Transformação Começa Agora' },
  { regex: /O FORJADOR ESTÁ TRABALHANDO/g, replace: 'SELECIONE O SEU PLANO NA ÁREA DE MEMBROS' },
  { regex: /O Forjador está trabalhando/g, replace: 'Selecione o seu plano na area de membros' },
  { regex: /Desafio Shape Insano[ \-•]+Gladiador/g, replace: 'Desafio Miris No Foco' },
  { regex: /COMUNIDADE - Shape Insano - Gladiador/g, replace: 'COMUNIDADE - Miris No Foco' },
  { regex: /COMUNIDADE \- Shape Insano/g, replace: 'COMUNIDADE - Miris No Foco' },
  
  // Gym Rats
  { regex: /Gym Rats/g, replace: 'Ranking do Mês' },
  { regex: /GYM RATS/g, replace: 'RANKING DO MÊS' },

  // Role names / Profile
  { regex: /GLADIADOR — Focado/g, replace: 'MIRI — No Foco' },
  { regex: /GLADIADOR/g, replace: 'MIRI' },
  { regex: /Gladiador/g, replace: 'Miri' },
  { regex: /Coliseu/g, replace: 'Desafio' },

  // Core Brand
  { regex: /Shape Insano Pro/gi, replace: 'Miris No Foco VIP' },
  { regex: /Shape Insano/g, replace: 'Miris No Foco' },
  { regex: /SHAPE INSANO/g, replace: 'MIRIS NO FOCO' },
  { regex: /shapeinsano/g, replace: 'mirisnofoco' },
  
  // Neutralizar ícones de guerra se encontrados como strings, etc.
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

try {
  const files = walk(DIRECTORY);
  // Also include index.html
  files.push(path.join(__dirname, 'index.html'));

  let changedFiles = 0;

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    replacements.forEach(rule => {
      content = content.replace(rule.regex, rule.replace);
    });

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      changedFiles++;
    }
  });

  console.log(`Rebranding completo! Modificados ${changedFiles} arquivos.`);
} catch (error) {
  console.error("Erro no script de rebranding:", error);
}
