import { rm, cp, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const run = (cmd, args) => new Promise((resolve, reject) => {
  const child = spawn(cmd, args, { stdio: 'inherit' });
  child.on('error', reject);
  child.on('exit', (code) => (code === 0 ? resolve() :
    reject(new Error(cmd + ' ' + args.join(' ') + ' exited with ' + code))));
});

await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });

// Retain compiled model and session modules so the pure Node tests can import them.
await run('tsc', ['-p', 'tsconfig.json']);
await run('esbuild', ['dist/assets/App.js', '--bundle', '--platform=browser', '--format=esm',
  '--target=es2020', '--minify', '--outfile=dist/assets/App.bundle.js']);
await run('tailwindcss', ['-i', 'src/styles.css', '-o', 'dist/assets/site.css', '--minify']);
await cp('node_modules/reactflow/dist/style.css', 'dist/assets/reactflow.css');
await cp('index.html', 'dist/index.html');
await cp('public', 'dist', { recursive: true });
console.log('Built fully local static site to dist/ (no runtime CDNs).');
