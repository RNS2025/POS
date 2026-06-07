import { execSync } from 'node:child_process';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

function run(command, options = {}) {
  execSync(command, { stdio: 'inherit', cwd: rootDir, ...options });
}

function isPostgresRunning() {
  try {
    const output = execSync(
      'docker ps --filter name=pos-postgres --filter status=running --format "{{.Names}}"',
      { encoding: 'utf8', cwd: rootDir },
    ).trim();
    return output === 'pos-postgres';
  } catch {
    return false;
  }
}

function ensurePostgres() {
  try {
    execSync('docker info', { stdio: 'ignore', cwd: rootDir });
  } catch {
    console.warn('Docker is not running. Start Docker Desktop, then run npm run dev again.');
    console.warn('The API will start but database health checks will fail until Postgres is up.');
    return;
  }

  if (isPostgresRunning()) {
    console.log('Postgres already running (pos-postgres).');
    return;
  }

  console.log('Starting Postgres via docker compose...');
  run('docker compose up -d postgres');

  console.log('Waiting for Postgres to be healthy...');
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const status = execSync(
        'docker inspect --format="{{.State.Health.Status}}" pos-postgres',
        { encoding: 'utf8', cwd: rootDir },
      ).trim();
      if (status === 'healthy') {
        console.log('Postgres is ready.');
        return;
      }
    } catch {
      // container may not exist yet
    }
    execSync('powershell -Command "Start-Sleep -Seconds 1"');
  }

  console.warn('Postgres did not report healthy in time. Continuing anyway.');
}

function startDev() {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  const server = spawn(npmCmd, ['run', 'dev'], {
    cwd: path.join(rootDir, 'Server'),
    stdio: 'inherit',
    shell: true,
  });

  const client = spawn(npmCmd, ['run', 'start'], {
    cwd: path.join(rootDir, 'Client'),
    stdio: 'inherit',
    shell: true,
  });

  const openBrowser = spawn(npmCmd, ['run', 'open:client'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });

  const shutdown = () => {
    server.kill();
    client.kill();
    openBrowser.kill();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  server.on('exit', (code) => {
    if (code && code !== 0) shutdown();
  });
  client.on('exit', (code) => {
    if (code && code !== 0) shutdown();
  });
}

ensurePostgres();
startDev();
