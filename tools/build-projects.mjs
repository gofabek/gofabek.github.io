// Builds one static page per project (girih/index.html, …) and sitemap.xml
// from i18n.js (texts + PROJECTS) and the header/footer of index.html.
// Usage: node tools/build-projects.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import vm from 'node:vm';

const ROOT = resolve(import.meta.dirname, '..');
const SITE = 'https://gofabek.github.io';
const ctx = {};
vm.createContext(ctx);
vm.runInContext(readFileSync(join(ROOT, 'i18n.js'), 'utf8') + ';this.T = translations; this.P = PROJECTS;', ctx);
const uz = ctx.T.uz;
const PROJECTS = ctx.P;

const index = readFileSync(join(ROOT, 'index.html'), 'utf8');
const pick = (re) => {
  const m = index.match(re);
  if (!m) throw new Error(`index.html: not found ${re}`);
  return m[0];
};
const toRoot = (html) =>
  html
    .replace(/href="#home"/g, 'href="../"')
    .replace(/href="#([a-z]+)"/g, 'href="../#$1"');

const headerHtml = toRoot(pick(/<header class="site-header">[\s\S]*?<\/header>/));
const footerHtml = toRoot(pick(/<footer class="site-footer">[\s\S]*?<\/footer>/));
const themeScript = pick(/<script>\s*\(function \(\) \{[\s\S]*?<\/script>/);
const favicon = pick(/<link rel="icon"[^>]*\/>/);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const PLAY_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 1.8 13.8 12 3.6 22.2a1.6 1.6 0 0 1-.6-1.3V3.1c0-.5.2-1 .6-1.3Zm11.3 11.3 2.6 2.6-11.4 6.5 8.8-9.1Zm3.9-3.9 3 1.7c1 .6 1 1.6 0 2.2l-3 1.7-2.8-2.8 2.8-2.8ZM6.1 1.8l11.4 6.5-2.6 2.6-8.8-9.1Z"/></svg>';

const CATEGORY = { girih: 'GameApplication', koshin: 'GameApplication', bloksxema: 'EducationalApplication', upf: 'UtilitiesApplication' };

function visual(id, p, eager) {
  if (id === 'upf') {
    return `<div class="project-visual visual-upf pp-visual" aria-hidden="true"><div class="upf-files"><b>DOCX</b><b>XLSX</b><b>PPTX</b><b>JPG</b></div><span class="upf-arrow">→</span><span class="upf-pdf">PDF</span></div>`;
  }
  return `<div class="project-visual pp-visual"><img src="../images/${id}.webp" alt="${esc(p.name)}" width="800" height="391"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async" /></div>`;
}

function page(id, p) {
  const url = `${SITE}/${id}/`;
  const title = `${p.name} — Soliyev Gʻofur`;
  const desc = uz[`desc_${id}`];
  const isApp = Boolean(p.store);

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: p.name,
      description: uz[`long_${id}`],
      applicationCategory: CATEGORY[id] || 'Application',
      operatingSystem: isApp ? 'Android' : 'Telegram',
      url,
      image: `${SITE}/images/og/${id}.jpg`,
      ...(p.play ? { downloadUrl: p.play, installUrl: p.play } : {}),
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@type': 'Person', name: 'Soliyev Gʻofur', url: `${SITE}/` }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Soliyev Gʻofur', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: uz.projects_title, item: `${SITE}/#projects` },
        { '@type': 'ListItem', position: 3, name: p.name, item: url }
      ]
    }
  ];

  const play = !isApp
    ? ''
    : p.play
      ? `<a class="play-btn" href="${esc(p.play)}" target="_blank" rel="noreferrer">${PLAY_ICON}<span data-i18n="play_get">${uz.play_get}</span></a>`
      : `<span class="play-btn is-soon">${PLAY_ICON}<span data-i18n="play_soon">${uz.play_soon}</span></span>`;
  const privacy = p.privacy
    ? `<a class="btn-link" href="${esc(p.privacy)}" target="_blank" rel="noreferrer"><span data-i18n="dlg_privacy">${uz.dlg_privacy}</span> ↗</a>`
    : '';

  const shots = Array.from({ length: p.shots }, (_, i) =>
    `<img src="../images/shots/${id}-${i + 1}.webp" alt="${esc(p.name)} — ${i + 1}" width="480" height="${p.shotHeight}" loading="lazy" decoding="async" />`
  ).join('\n            ');

  const features = [1, 2, 3, 4].map((i) => `<li data-i18n="f_${id}_${i}">${uz[`f_${id}_${i}`]}</li>`).join('\n              ');
  const tech = p.tech.map((x) => `<li>${esc(x)}</li>`).join('');

  const others = Object.entries(PROJECTS)
    .filter(([k]) => k !== id)
    .map(([k, o]) => `
          <a class="pp-other" href="../${k}/">
            ${visual(k, o, false)}
            <span class="tag" data-i18n="${o.status}">${uz[o.status]}</span>
            <span class="pp-other-name">${esc(o.name)}</span>
          </a>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="uz">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}" />
    <meta name="author" content="Soliyev Gʻofur" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:image" content="${SITE}/images/og/${id}.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(p.name)}" />
    <meta property="og:site_name" content="Soliyev Gʻofur" />
    <meta property="og:locale" content="uz_UZ" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">${JSON.stringify(ld)}</script>
    ${themeScript}
    <meta name="theme-color" content="#f1efe9" />
    ${favicon}
    <link rel="apple-touch-icon" href="../icons/apple-touch-icon.png" />
    <link rel="manifest" href="../manifest.webmanifest" />
    <link rel="stylesheet" href="../styles.css" />
  </head>
  <body class="project-page">
    <!-- Generated by tools/build-projects.mjs — edit i18n.js and re-run instead of editing this file. -->
    ${headerHtml}

    <main id="home" class="container pp">
      <nav class="pp-crumbs" aria-label="Breadcrumb">
        <a class="btn-link" href="../#projects">← <span data-i18n="pp_back">${uz.pp_back}</span></a>
      </nav>

      <header class="pp-hero">
        <div class="pp-copy">
          <span class="tag" data-i18n="${p.status}">${uz[p.status]}</span>
          <h1 class="pp-title">${esc(p.name)}</h1>
          <p class="pp-lead" data-i18n="desc_${id}">${desc}</p>
          <div class="pp-actions">
            ${play}
            ${privacy}
          </div>
          ${isApp && !p.play ? `<p class="pd-soon" data-i18n="dlg_soon">${uz.dlg_soon}</p>` : ''}
        </div>
        ${visual(id, p, true)}
      </header>

      <section class="pp-section">
        <p class="pp-long" data-i18n="long_${id}">${uz[`long_${id}`]}</p>
      </section>
${p.shots ? `
      <section class="pp-section" aria-labelledby="pp-shots-title">
        <h2 class="pp-h" id="pp-shots-title" data-i18n="pp_shots">${uz.pp_shots}</h2>
        <div class="pd-shots pp-shots" tabindex="0">
            ${shots}
        </div>
      </section>
` : ''}
      <section class="pp-section pd-cols pp-cols">
        <div>
          <h2 class="pp-h" data-i18n="dlg_features">${uz.dlg_features}</h2>
          <ul class="project-features pp-features">
              ${features}
          </ul>
        </div>
        <div>
          <h2 class="pp-h" data-i18n="dlg_tech">${uz.dlg_tech}</h2>
          <ul class="pd-tech">${tech}</ul>
        </div>
      </section>

      <section class="pp-section" aria-labelledby="pp-other-title">
        <h2 class="pp-h" id="pp-other-title" data-i18n="pp_other">${uz.pp_other}</h2>
        <div class="pp-others">${others}
        </div>
      </section>
    </main>

    ${footerHtml}

    <script src="../i18n.js"></script>
    <script src="../script.js"></script>
  </body>
</html>
`;
}

for (const [id, p] of Object.entries(PROJECTS)) {
  mkdirSync(join(ROOT, id), { recursive: true });
  writeFileSync(join(ROOT, id, 'index.html'), page(id, p));
  if (!existsSync(join(ROOT, 'images/og', `${id}.jpg`))) console.warn(`! images/og/${id}.jpg missing — run tools/build-images.mjs`);
  console.log('✓', `${id}/index.html`);
}

const today = new Date().toISOString().slice(0, 10);
const urls = ['', ...Object.keys(PROJECTS).map((id) => `${id}/`)];
writeFileSync(
  join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${SITE}/${u}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join('\n')}
</urlset>
`
);
console.log('✓ sitemap.xml');
