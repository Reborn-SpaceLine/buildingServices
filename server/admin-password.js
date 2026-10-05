// Crée ou remplace le mot de passe de l'administration, directement sur le serveur
// (premier accès sans ADMIN_PASSWORD, ou mot de passe oublié). Aucun redémarrage nécessaire.
//
//   Docker (VPS, Infomaniak) :  docker compose exec site node server/admin-password.js
//   Sans Docker              :  node server/admin-password.js      (dossier de données : DATA_DIR, défaut ./data)
//
// Le mot de passe est demandé sans s'afficher, puis enregistré haché dans <DATA_DIR>/private/admin.json.
import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { adminPasswordRecord, MIN_PASSWORD } from './api.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.resolve(root, process.env.DATA_DIR ?? 'data');
const file = path.join(dataDir, 'private', 'admin.json');

/** Lit une ligne ; au clavier, rien n'est affiché pendant la saisie */
function ask(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
    if (process.stdin.isTTY) {
      rl._writeToOutput = (text) => { if (text.includes(question)) process.stdout.write(question); };
    }
    rl.question(question, answer => {
      rl.close();
      if (process.stdin.isTTY) process.stdout.write('\n');
      resolve(answer);
    });
  });
}

const password = await ask(`Nouveau mot de passe de l'administration (${MIN_PASSWORD} caractères minimum) : `);
if (password.length < MIN_PASSWORD) {
  console.error(`Mot de passe trop court : ${MIN_PASSWORD} caractères minimum. Rien n'a été modifié.`);
  process.exit(1);
}
if (process.stdin.isTTY && (await ask('Confirmez le mot de passe : ')) !== password) {
  console.error('Les deux saisies sont différentes. Rien n\'a été modifié.');
  process.exit(1);
}

await fs.mkdir(path.dirname(file), { recursive: true });
const tmp = `${file}.${process.pid}.tmp`;
await fs.writeFile(tmp, `${JSON.stringify(adminPasswordRecord(password), null, 2)}\n`, { mode: 0o600 });
await fs.rename(tmp, file);
console.log(`Mot de passe enregistré (${file}). Connectez-vous sur /admin.`);
