import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const round = fs.readFileSync('icon-round.svg', 'utf8');
const sq = fs.readFileSync('icon.svg', 'utf8');
const at = (s, px) => s.replace(/width="512" height="512"/, `width="${px}" height="${px}"`);
const dummy = (label, kind) => `<div class="app"><div class="ph ${kind}"></div><div class="lb">${label}</div></div>`;
const ours = (svg, px, kind) => `<div class="app"><div class="me ${kind}">${at(svg, px)}</div><div class="lb">Acronumbskull</div></div>`;
const tray = (cls, svg, kind) => `<div class="tray ${cls}">
  ${dummy('Mail', kind)}${ours(svg, 56, kind)}${dummy('Maps', kind)}${dummy('Photos', kind)}</div>`;

const page = `<!doctype html><meta charset="utf-8"><style>
  body { margin:0; padding:30px 28px 26px; background:#0b0d12; color:#c9d2e3;
         font:500 13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
  h1 { font-size:12px; font-weight:700; letter-spacing:.09em; text-transform:uppercase;
       color:#8b96ab; margin:0 0 22px; }
  .row { display:flex; gap:26px; align-items:flex-start; }
  .case { text-align:center; }
  .tray { display:flex; gap:20px; padding:18px 20px; border-radius:26px; }
  .dark  { background:linear-gradient(150deg,#2b3044,#1b2030 60%,#221f2e); }
  .light { background:linear-gradient(150deg,#f4f6fb,#e6eaf4); }
  .ios   { background:linear-gradient(150deg,#141822,#1d2434 55%,#131722); }
  .app { width:56px; text-align:center; }
  .ph { width:56px; height:56px; border-radius:50%; background:rgba(255,255,255,.13); }
  .light .ph { background:rgba(20,26,40,.10); }
  .ios .ph { border-radius:14px; background:rgba(255,255,255,.09); }
  .me svg { display:block; }
  .lb { margin-top:7px; font-size:10px; letter-spacing:.01em; color:#e7ecf6; }
  .light .lb { color:#20263a; }
  .cap { margin:12px 0 0; font-size:11.5px; color:#7d879b; }
  .sizes { margin-top:30px; padding:20px 22px; background:#11141b; border-radius:16px; display:flex; align-items:flex-end; gap:24px; }
  .sizes span { display:block; }
  .sizes .n { font-size:10.5px; color:#7d879b; text-align:center; margin-top:8px; }
  .grp { text-align:center; }
</style>
<h1>Acronumbskull — stylised A, rasterised properly</h1>
<div class="row">
  <div class="case">${tray('dark', round, 'ph')}<p class="cap">Android, dark wallpaper</p></div>
  <div class="case">${tray('light', round, 'ph')}<p class="cap">Android, light wallpaper</p></div>
  <div class="case">${tray('ios', sq, 'ios')}<p class="cap">iOS squircle</p></div>
</div>
<div class="sizes">
  ${[180, 120, 76, 48, 32, 20].map(px => `<div class="grp"><span>${at(sq, px)}</span><div class="n">${px}px</div></div>`).join('')}
</div>`;
fs.writeFileSync('preview.html', page);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1000, height: 470 }, deviceScaleFactor: 2 });
await p.goto('file://' + process.cwd() + '/preview.html');
await p.screenshot({ path: 'preview.png', fullPage: true });
await b.close();
console.log('ok');
