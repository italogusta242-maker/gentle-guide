const fs = require('fs');
const file = 'src/pages/Dashboard.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(/text-primary/g, 'text-foreground');
data = data.replace(/text-muted/g, 'text-muted-foreground');
data = data.replace(/<span className="text-white">\\{profile\\\?\\.nome\\\?\\.split\\(' '\\)\\[0\\] \\|\\| "ATLETA"\\}<\\/span>/g, '<span className="text-foreground">{profile?.nome?.split(\\' \\')[0] || "ATLETA"}</span>');
data = data.replace(/<span className="text-white">\\{profile\\\?\\.nome\\\?\\.toUpperCase\\(\\) \\|\\| "GLADIADOR"\\}<\\/span>/g, '<span className="text-foreground">{profile?.nome?.toUpperCase() || "GLADIADOR"}</span>');

data = data.replace(/text-muted-foreground-foreground/g, 'text-muted-foreground');

fs.writeFileSync(file, data);

const file2 = 'src/pages/Desafio.tsx';
let data2 = fs.readFileSync(file2, 'utf8');
data2 = data2.replace(/text-muted/g, 'text-muted-foreground');
data2 = data2.replace(/text-muted-foreground-foreground/g, 'text-muted-foreground');
fs.writeFileSync(file2, data2);

console.log("Fixed files successfully");
