import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const worktreesDir = path.join(rootDir, '.worktrees');

function run(command, options = {}) {
  return execSync(command, { cwd: rootDir, encoding: 'utf8', stdio: options.silent ? 'pipe' : 'inherit', ...options });
}

function branchToDir(branch) {
  return branch.replace(/\//g, '-');
}

const branch = process.argv[2];
if (!branch) {
  console.error('Usage: npm run worktree:merge -- feature/<name>');
  process.exit(1);
}

const worktreePath = path.join(worktreesDir, branchToDir(branch));

console.log('Verifying builds in worktree...');
run('npm run build --prefix Server', { cwd: worktreePath });
run('npm run build --prefix Client -- --configuration=development', { cwd: worktreePath });

console.log(`Merging ${branch} into master...`);
run('git checkout master');
run(`git merge "${branch}" --no-edit`);

if (fs.existsSync(worktreePath)) {
  console.log('Removing worktree...');
  run(`git worktree remove "${worktreePath}" --force`);
}

console.log('Deleting feature branch...');
run(`git branch -d "${branch}"`);

console.log('');
console.log(`Merged ${branch} into master. Worktree removed.`);
