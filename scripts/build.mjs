import { rm, cp, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';

const run = (cmd, args) => new Promise((resolve, reject) => {
  const child = execFile(cmd, args, { stdio: 'inherit' });
  child.on('error', reject);
  child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`))));
});

if (existsSync('dist')) await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });

try {
  await run('tsc', ['-p', 'tsconfig.json']);
} catch (error) {
  if (error?.code !== 'ENOENT' || !existsSync('src/App.js')) throw error;
  console.warn('TypeScript compiler not found; using checked-in compiled browser bundle at src/App.js.');
  await cp('src/App.js', 'dist/assets/App.js');
}

await cp('index.html', 'dist/index.html');
await cp('public', 'dist', { recursive: true });
console.log('Built static site to dist/');
