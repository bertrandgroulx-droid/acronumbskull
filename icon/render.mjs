import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
// what the site actually links to, and what each platform wants
const OUT = [
  ['icon-square.svg',   'apple-touch-icon.png',   180],   // iOS masks it itself
  ['icon.svg',          'icon-192.png',           192],
  ['icon.svg',          'icon-512.png',           512],
  ['icon-maskable.svg', 'icon-maskable-512.png',  512],   // Android adaptive
  ['icon.svg',          'favicon-32.png',          32],
  ['icon.svg',          'favicon-16.png',          16],
  ['icon-round.svg',    'icon-round-512.png',     512],
];
const b = await chromium.launch();
for (const [src, out, px] of OUT) {
  const svg = fs.readFileSync(src, 'utf8').replace(/width="512" height="512"/, `width="${px}" height="${px}"`);
  const p = await b.newPage({ viewport: { width: px, height: px } });
  await p.setContent(`<style>html,body{margin:0;padding:0;background:transparent}</style>${svg}`);
  await p.screenshot({ path: out, omitBackground: true });
  await p.close();
  console.log(out.padEnd(24), px + 'px', fs.statSync(out).size + 'b');
}
await b.close();
