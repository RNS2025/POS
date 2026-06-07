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
  console.error('Usage: npm run worktree:new -- feature/<name>');
  process.exit(1);
}

if (!branch.startsWith('feature/')) {
  console.error('Branch must start with feature/ (e.g. feature/auth)');
  process.exit(1);
}

try {
  run('git check-ignore -q .worktrees/', { silent: true });
} catch {
  console.error('.worktrees/ must be in .gitignore before creating worktrees.');
  process.exit(1);
}

const worktreePath = path.join(worktreesDir, branchToDir(branch));
if (fs.existsSync(worktreePath)) {
  console.error(`Worktree already exists: ${worktreePath}`);
  process.exit(1);
}

fs.mkdirSync(worktreesDir, { recursive: true });

console.log(`Creating worktree for branch ${branch}...`);
run(`git worktree add "${worktreePath}" -b "${branch}" master`);

console.log('Installing dependencies in worktree...');
run('npm run install:all', { cwd: worktreePath });

console.log('');
console.log(`Worktree ready: ${worktreePath}`);
console.log(`Branch: ${branch}`);
console.log('Open that folder in Cursor/VS Code and implement the feature there.');
