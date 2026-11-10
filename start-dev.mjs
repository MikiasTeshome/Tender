import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const nextCli = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const web = path.join(root, 'web');
const logPath = path.join(root, 'dev-server.log');
const out = createWriteStream(logPath, { flags: 'w' });

const child = spawn(process.execPath, [nextCli, 'dev', '-H', '127.0.0.1', '-p', '3000'], {
  cwd: web,
  env: { ...process.env, FORCE_COLOR: '0' },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
  detached: true,
});

child.stdout.pipe(out);
child.stderr.pipe(out);
child.unref();
console.log(JSON.stringify({ pid: child.pid, logPath }));
