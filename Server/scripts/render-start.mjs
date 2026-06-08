import { execSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const maxAttempts = 12;
const delayMs = 5000;

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    break;
  } catch {
    if (attempt === maxAttempts) {
      console.error('Database unreachable after retries.');
      process.exit(1);
    }
    console.log(`Database not ready (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs / 1000}s…`);
    await sleep(delayMs);
  }
}

execSync('node dist/main.js', { stdio: 'inherit' });
