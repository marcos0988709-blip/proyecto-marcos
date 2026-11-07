#!/usr/bin/env node
// Empaqueta la app web (UI + motor del juego + SQLite wasm) en un único HTML: dist/fut14-cards.html
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const r = (p) => fileURLToPath(new URL(p, import.meta.url));
const result = await build({
  entryPoints: [r('../web/ui.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  write: false,
  loader: { '.wasm': 'binary' },
  alias: {
    'node:sqlite': r('../web/shims/sqlite.js'),
    'node:crypto': r('../web/shims/crypto.js'),
    'node:fs': r('../web/shims/empty.js'),
    'node:path': r('../web/shims/empty.js'),
    fs: r('../web/shims/empty.js'),
    path: r('../web/shims/empty.js'),
    crypto: r('../web/shims/empty.js'),
  },
  logLevel: 'warning',
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = readFileSync(r('../web/index.html'), 'utf8').replace('<!--BUNDLE-->', () => `<script>${js}</script>`);
mkdirSync(r('../dist'), { recursive: true });
writeFileSync(r('../dist/fut14-cards.html'), html);
console.log(`dist/fut14-cards.html (${(html.length / 1024).toFixed(0)} KB)`);
