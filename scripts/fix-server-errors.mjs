import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const duplicateServerDir = path.join(rootDir, 'Server', 'express-gen-ts');

if (fs.existsSync(duplicateServerDir)) {
  fs.rmSync(duplicateServerDir, { recursive: true, force: true });
  console.log('Removed duplicate Server/express-gen-ts (use Server/ at repo root).');
} else {
  console.log('No Server/express-gen-ts folder found.');
}

console.log('Run "npm run build --prefix Server" to verify the API project.');
