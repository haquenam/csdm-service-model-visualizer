import { rm, cp, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';

const run = (cmd, args) => new Promise((resolve, reject) => {
  const child = execFile(cmd, args, { stdio: 'inherit' });
  child.on('error', reject);
  child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(cmd + ' ' + args.join(' ') + ' exited with ' + code))));
});

await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });
await run('tsc', ['-p', 'tsconfig.json']); // compiler required; never deploy a stale checked-in bundle
await cp('index.html', 'dist/index.html');
await cp('public', 'dist', { recursive: true });
console.log('Built static site to dist/');
