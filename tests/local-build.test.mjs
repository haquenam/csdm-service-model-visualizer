import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

test('v2.1 production HTML uses only local runtime JavaScript and CSS assets', async () => {
  const html = await readFile('dist/index.html', 'utf8');
  assert.match(html, /assets\/App\.bundle\.js/);
  assert.match(html, /assets\/site\.css/);
  assert.match(html, /assets\/reactflow\.css/);
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /https?:\/\/(?:cdn\.tailwindcss|unpkg|cdn\.jsdelivr|cdnjs)/);
  assert.doesNotMatch(html, /assets\/App\.js["']/);
  for (const file of ['dist/assets/App.bundle.js', 'dist/assets/site.css', 'dist/assets/reactflow.css']) {
    const info = await stat(file);
    assert.ok(info.size > 100, file + ' is a non-empty local asset');
  }
});

test('production bundle carries the application and v2.1 session features', async () => {
  const js = await readFile('dist/assets/App.bundle.js', 'utf8');
  assert.match(js, /csdm-v2\.1-session\.json/);
  assert.match(js, /csdm-visualizer-assessment/);
  assert.match(js, /Uses::Used by/);
  assert.match(js, /Consumes::Consumed by/);
});
