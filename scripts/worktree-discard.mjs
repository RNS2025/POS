import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const worktreesDir = path.join(rootDir, '.worktrees');

function run(command, options = {}) {
  execSync(command, { cwd: rootDir, encoding: 'utf8', stdio: options.silent ? 'pipe' : 'inherit', ...options });
}

function branchToDir(branch) {
  return branch.replace(/\//g, '-');
}

const branch = process.argv[2];
if (!branch) {
  console.error('Usage: npm run worktree:discard -- feature/<name>');
  process.exit(1);
}

const worktreePath = path.join(worktreesDir, branchToDir(branch));

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question(`Delete branch ${branch} and worktree without merging? Type "discard" to confirm: `, (answer) => {
  rl.close();
  if (answer.trim() !== 'discard') {
    console.log('Aborted.');
    process.exit(1);
  }

  run('git checkout master');

  if (fs.existsSync(worktreePath)) {
    run(`git worktree remove "${worktreePath}" --force`);
  }

  run(`git branch -D "${branch}"`);
  console.log(`Discarded ${branch}.`);
});
