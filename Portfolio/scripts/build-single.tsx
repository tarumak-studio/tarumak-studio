/**
 * Builds a single self-contained, pre-rendered HTML file at dist/index.html.
 * Run with: bun scripts/build-single.tsx
 * (The regular `npm run build` Vite build is the alternative, multi-file output.)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { App } from '../src/App';
import { profile, socials } from '../src/content/site';

const root = join(import.meta.dir, '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

const result = await Bun.build({
  entrypoints: [join(root, 'src/main.tsx')],
  minify: true,
  target: 'browser',
  define: { 'process.env.NODE_ENV': '"production"' },
});
if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}
const js = (await result.outputs.find((o) => o.path.endsWith('.js'))!.text()).replace(/<\/script/gi, '<\\/script');

const css = ['tokens', 'base', 'sections'].map((n) => read(`src/styles/${n}.css`)).join('\n');

const markup = renderToString(
  <StrictMode>
    <App />
  </StrictMode>,
);

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  jobTitle: profile.title,
  description: profile.description,
  url: profile.url,
  address: { '@type': 'PostalAddress', addressLocality: 'Ambala', addressRegion: 'Haryana', addressCountry: 'IN' },
  sameAs: socials.map((s) => s.href),
  knowsAbout: ['Brand identity', 'UI/UX design', 'Website design', 'Marketing design', 'Motion design'],
});

const html = read('index.html')
  .replace('<!--JSONLD-->', `<script type="application/ld+json">${jsonLd}</script>`)
  .replace('<!--STYLES-->', () => `<style>${css}</style>`)
  .replace('<!--APP-->', () => markup)
  .replace('<!--SCRIPT-->', () => `<script type="module">${js}</script>`)
  .replace('<script type="module" src="/src/main.tsx"></script>', '');

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/index.html'), html);
console.log(`dist/index.html  ${(html.length / 1024).toFixed(0)} KB`);
