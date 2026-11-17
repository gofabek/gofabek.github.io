// Generates social cards (Open Graph) and app icons with headless Chrome.
// Usage: node tools/build-images.mjs
// Output: images/og/*.png, icons/*.png
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import vm from 'node:vm';

const ROOT = resolve(import.meta.dirname, '..');
const CHROME = process.env.CHROME || 'google-chrome';
const tmp = mkdtempSync(join(tmpdir(), 'og-'));

const ctx = {};
vm.createContext(ctx);
vm.runInContext(readFileSync(join(ROOT, 'i18n.js'), 'utf8') + ';this.T = translations; this.P = PROJECTS;', ctx);
const uz = ctx.T.uz;

const fontCss = readFileSync(join(ROOT, 'styles.css'), 'utf8')
  .split('/* ---------- */')[0]
  .match(/@font-face \{[^}]+\}/g)
  .join('\n')
  .replaceAll('url(fonts/', `url(file://${ROOT}/fonts/`);

const GIRIH =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cg fill='none' stroke='%23000' stroke-width='1'%3E%3Cpath d='M24 10 38 24 24 38 10 24Z'/%3E%3Cpath d='M14 14h20v20H14Z'/%3E%3Cpath d='M24 0v10M24 38v10M0 24h10M38 24h10M0 0l14 14M48 0 34 14M0 48l14-14M48 48 34 34'/%3E%3C/g%3E%3C/svg%3E\")";

const STAR = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><g fill="#e8502e"><rect x="7" y="7" width="18" height="18"/><rect x="7" y="7" width="18" height="18" transform="rotate(45 16 16)"/></g><circle cx="16" cy="16" r="4" fill="#f1efe9"/></svg>`;

const base = `
${fontCss}
* { box-sizing: border-box; margin: 0; }
html, body { width: 100%; height: 100%; overflow: hidden; }
body { background: #f1efe9; color: #141414; font-family: Inter, sans-serif; position: relative; }
.pattern { position: absolute; inset: 0; background: #141414; opacity: .07;
  -webkit-mask: ${GIRIH} 0 0 / 48px 48px repeat, radial-gradient(circle at 85% 40%, #000 10%, transparent 70%);
  -webkit-mask-composite: source-in; }
.band { position: absolute; left: 0; right: 0; bottom: 0; height: 14px; background: #e8502e; }
.serif { font-family: 'Cormorant Garamond', serif; font-weight: 400; }
em { color: #e8502e; font-style: italic; }
.url { font-size: 22px; color: #6b6762; letter-spacing: .02em; display: flex; align-items: center; gap: 12px; }
.url i { width: 18px; height: 18px; background: #e8502e; display: inline-block;
  clip-path: polygon(50% 0, 64.6% 14.6%, 85.4% 14.6%, 85.4% 35.4%, 100% 50%, 85.4% 64.6%, 85.4% 85.4%, 64.6% 85.4%, 50% 100%, 35.4% 85.4%, 14.6% 85.4%, 14.6% 64.6%, 0 50%, 14.6% 35.4%, 14.6% 14.6%, 35.4% 14.6%); }
.tag { font-size: 20px; letter-spacing: .1em; text-transform: uppercase; color: #6b6762; }
`;

function shot(name, html, w, h) {
  const file = join(tmp, `${name.replaceAll('/', '_')}.html`);
  writeFileSync(file, `<!doctype html><meta charset="utf-8"><style>${base}</style>${html}`);
  const out = join(ROOT, name);
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${w},${h}`, '--virtual-time-budget=3000', `--screenshot=${out}`, `file://${file}`
  ], { stdio: 'ignore' });
  console.log('✓', name);
}

mkdirSync(join(ROOT, 'images/og'), { recursive: true });
mkdirSync(join(ROOT, 'icons'), { recursive: true });

/* ---------- Main social card ---------- */
shot('images/og/home.jpg', `
<div class="pattern"></div>
<div style="position:absolute;left:72px;top:70px;bottom:70px;width:660px;display:flex;flex-direction:column;justify-content:space-between">
  <div class="url"><i></i>gofabek.github.io</div>
  <div>
    <h1 class="serif" style="font-size:104px;line-height:.95;letter-spacing:-.01em">Soliyev<br>Gʻofur</h1>
    <p class="serif" style="font-size:46px;margin-top:22px;line-height:1.05"><em>Mobil va web dasturchi</em></p>
  </div>
  <p style="font-size:24px;color:#6b6762;line-height:1.45">Android ilovalar · Veb-saytlar · Telegram botlar<br>JizPI · Hazorasp, Xorazm</p>
</div>
<div style="position:absolute;right:72px;top:56px;width:378px;height:504px;border-radius:10px;overflow:hidden;background:#e8e5dd">
  <img src="file://${ROOT}/images/gofur.jpg" style="width:100%;height:100%;object-fit:cover;object-position:50% 60%">
</div>
<div class="band"></div>`, 1200, 630);

/* ---------- Project cards ---------- */
for (const [id, p] of Object.entries(ctx.P)) {
  const visual = id === 'upf'
    ? `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1c3d63,#229ed9);display:flex;align-items:center;justify-content:center;gap:34px;color:#fff;font-weight:600">
         <div style="display:grid;grid-template-columns:auto auto;gap:12px">${['DOCX', 'XLSX', 'PPTX', 'JPG'].map((x) => `<b style="font-size:20px;padding:12px 18px;border-radius:8px;background:rgba(255,255,255,.16)">${x}</b>`).join('')}</div>
         <span style="font-size:52px;opacity:.8">→</span>
         <span style="font-size:40px;font-weight:700;padding:28px 26px;border-radius:12px;background:#fff;color:#d93025">PDF</span></div>`
    : `<img src="file://${ROOT}/images/${id}.webp" style="width:100%;height:100%;object-fit:cover">`;
  shot(`images/og/${id}.jpg`, `
<div class="pattern"></div>
<div style="position:absolute;left:72px;top:70px;bottom:70px;width:470px;display:flex;flex-direction:column;justify-content:space-between">
  <div class="url"><i></i>gofabek.github.io/${id}</div>
  <div>
    <p class="tag">${uz[p.status]}</p>
    <h1 class="serif" style="font-size:${p.name.length > 14 ? 74 : 96}px;line-height:1;margin-top:14px">${p.name.replace(' (', '<br><span style="font-size:.5em;color:#6b6762">(').replace(/\)$/, ')</span>')}</h1>
  </div>
  <p style="font-size:24px;color:#6b6762;line-height:1.45">${uz['desc_' + id]}</p>
</div>
<div style="position:absolute;right:64px;top:50%;transform:translateY(-50%);width:560px;aspect-ratio:1024/500;border-radius:12px;overflow:hidden;box-shadow:0 30px 60px -30px rgba(0,0,0,.45)">${visual}</div>
<div class="band"></div>`, 1200, 630);
}

/* ---------- Icons ---------- */
const icon = (pad, bg = '#f1efe9') =>
  `<div style="position:absolute;inset:0;background:${bg};display:grid;place-items:center"><div style="width:${100 - pad * 2}%;height:${100 - pad * 2}%">${STAR}</div></div>`;
shot('icons/apple-touch-icon.png', icon(14), 180, 180);
shot('icons/icon-192.png', icon(10), 192, 192);
shot('icons/icon-512.png', icon(10), 512, 512);
shot('icons/icon-maskable-512.png', icon(22), 512, 512);

rmSync(tmp, { recursive: true, force: true });
