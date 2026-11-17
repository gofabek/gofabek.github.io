const root = document.documentElement;
const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const themeToggle = document.querySelector('.theme-toggle');
const yearNode = document.getElementById('year');
const form = document.querySelector('.contact-form');
const formStatus = document.querySelector('.form-status');
const langButtons = document.querySelectorAll('.lang-btn');

root.classList.add('js');

/* ---------- Storage helpers ---------- */

function store(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
}

function load(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

/* ---------- Language ---------- */

function setLanguage(lang) {
  const strings = translations[lang] || translations.uz;
  root.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const value = strings[el.dataset.i18n];
    if (value) el.textContent = value;
  });

  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const value = strings[el.dataset.i18nHtml];
    if (value) el.innerHTML = value;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const value = strings[el.dataset.i18nPlaceholder];
    if (value) el.placeholder = value;
  });

  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const value = strings[el.dataset.i18nAria];
    if (value) el.setAttribute('aria-label', value);
  });

  if (typeof currentProject !== 'undefined' && currentProject) renderProject(currentProject);
  if (typeof renderCommits === 'function') renderCommits();

  if (themeToggle && strings.theme_toggle) {
    themeToggle.setAttribute('aria-label', strings.theme_toggle);
  }

  langButtons.forEach((button) => {
    const isActive = button.dataset.lang === lang;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  store('lang', lang);
}

langButtons.forEach((button) => {
  button.addEventListener('click', () => setLanguage(button.dataset.lang));
});

/* ---------- Theme with ink transition ---------- */

function applyTheme(theme) {
  root.dataset.theme = theme;
  store('theme', theme);
  syncThemeButton();
}

function syncThemeButton() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', root.dataset.theme === 'dark' ? '#0d0d0f' : '#f1efe9');
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', String(root.dataset.theme === 'dark'));
  }
}

function seededRandom(seed) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

// Builds an SVG mask: a circle + satellite blobs, distorted by turbulence so the edge looks like spreading ink.
function inkMask(w, h, r, cx, cy, seed, scale) {
  let blobs = '';
  for (let i = 0; i < 16; i++) {
    const angle = seededRandom(seed + i) * Math.PI * 2;
    const dist = r * (0.75 + seededRandom(seed + i + 50) * 0.45);
    const br = r * (0.08 + seededRandom(seed + i + 90) * 0.18);
    blobs += `<circle cx="${(cx + Math.cos(angle) * dist).toFixed(1)}" cy="${(cy + Math.sin(angle) * dist).toFixed(1)}" r="${br.toFixed(1)}"/>`;
  }
  const displacement = Math.min(160, 50 + r / scale * 0.3) * scale;
  const freq = (0.012 / scale).toFixed(4);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<filter id="f" x="-50%" y="-50%" width="200%" height="200%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="4" seed="${seed}"/>` +
    `<feDisplacementMap in="SourceGraphic" scale="${displacement.toFixed(1)}" xChannelSelector="R" yChannelSelector="G"/>` +
    `</filter><g filter="url(#f)" fill="#fff"><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}"/>${blobs}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const INK_DURATION = 3000;
let inkRunning = false;

async function toggleTheme() {
  if (inkRunning) return;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!document.startViewTransition || reduceMotion) {
    applyTheme(next);
    return;
  }

  inkRunning = true;

  const rect = themeToggle.getBoundingClientRect();
  const W = window.innerWidth;
  const H = window.innerHeight;
  const S = 0.4; // mask is drawn at lower resolution, then stretched — keeps it fast
  const w = Math.ceil(W * S);
  const h = Math.ceil(H * S);
  const cx = (rect.left + rect.width / 2) * S;
  const cy = (rect.top + rect.height / 2) * S;
  const R = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) * 1.4;
  const seed = Math.floor(Math.random() * 90) + 1;

  root.style.setProperty('--ink', inkMask(w, h, 0, cx, cy, seed, S));
  root.classList.add('ink-run');

  const transition = document.startViewTransition(() => applyTheme(next));

  try {
    await transition.ready;
    const start = performance.now();
    const frame = (now) => {
      const p = Math.min(1, (now - start) / INK_DURATION);
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      root.style.setProperty('--ink', inkMask(w, h, eased * R, cx, cy, seed, S));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    await transition.finished;
  } catch (e) {
    applyTheme(next);
  } finally {
    root.classList.remove('ink-run');
    root.style.removeProperty('--ink');
    inkRunning = false;
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

/* ---------- Mobile nav ---------- */

function closeNav() {
  header.classList.remove('nav-open');
  navToggle.setAttribute('aria-expanded', 'false');
}

if (navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('nav-open')) {
      closeNav();
      navToggle.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (header.classList.contains('nav-open') && !header.contains(event.target)) {
      closeNav();
    }
  });
}

/* ---------- Contact form ---------- */

const CONTACT_EMAIL = 'soliyevgofur7@gmail.com';
// Cloudflare Worker URL (see worker/README.md). Empty → messages go to email via formsubmit.co.
const CONTACT_ENDPOINT = '';

function t(key) {
  const strings = translations[root.lang] || translations.uz;
  return strings[key] || translations.uz[key] || '';
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    if (data.get('_honey')) return;
    const name = data.get('name')?.toString().trim() || '';
    const email = data.get('email')?.toString().trim() || '';
    const message = data.get('message')?.toString().trim() || '';
    const button = form.querySelector('button[type="submit"]');

    button.disabled = true;
    formStatus.textContent = t('form_sending');

    try {
      if (CONTACT_ENDPOINT) {
        const response = await fetch(CONTACT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message, lang: root.lang, page: location.pathname })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error('send failed');
        formStatus.textContent = t('form_thanks').replace('{name}', name);
        form.reset();
        return;
      }
      const response = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message,
          _subject: `Saytdan xabar — ${name}`,
          _template: 'table',
          _captcha: 'false'
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || String(result.success) !== 'true') throw new Error('send failed');
      formStatus.textContent = t('form_thanks').replace('{name}', name);
      form.reset();
    } catch (e) {
      const subject = encodeURIComponent(`Saytdan xabar — ${name}`);
      const body = encodeURIComponent(`${message}\n\n${name}\n${email}`);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      formStatus.textContent = t('form_error');
    } finally {
      button.disabled = false;
    }
  });
}

/* ---------- Project details ---------- */


const dialog = document.getElementById('project-dialog');
let currentProject = null;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderProject(id) {
  const p = PROJECTS[id];
  if (!dialog || !p) return;
  dialog.querySelector('.pd-status').textContent = t(p.status);
  dialog.querySelector('#pd-title').textContent = p.name;
  dialog.querySelector('.pd-long').textContent = t(`long_${id}`);

  const shots = dialog.querySelector('.pd-shots');
  shots.replaceChildren();
  shots.hidden = !p.shots;
  for (let i = 1; i <= p.shots; i++) {
    const img = el('img');
    img.src = `images/shots/${id}-${i}.webp`;
    img.alt = `${p.name} — ${i}`;
    img.width = 480;
    img.height = p.shotHeight;
    img.loading = 'lazy';
    img.decoding = 'async';
    shots.append(img);
  }

  const features = dialog.querySelector('.pd-features');
  features.replaceChildren();
  for (let i = 1; i <= 4; i++) features.append(el('li', '', t(`f_${id}_${i}`)));

  const tech = dialog.querySelector('.pd-tech');
  tech.replaceChildren(...p.tech.map((name) => el('li', '', name)));

  const links = dialog.querySelector('.pd-links');
  links.replaceChildren();
  if (p.privacy) {
    const a = el('a', 'btn-link', `${t('dlg_privacy')} ↗`);
    a.href = p.privacy;
    a.target = '_blank';
    a.rel = 'noreferrer';
    links.append(a);
  }
  links.prepend(playButton(p));
  const page = el('a', 'btn-link', `${t('project_page')} →`);
  page.href = `${id}/`;
  links.append(page);
  if (p.store && !p.play) links.append(el('p', 'pd-soon', t('dlg_soon')));
}

const PLAY_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 1.8 13.8 12 3.6 22.2a1.6 1.6 0 0 1-.6-1.3V3.1c0-.5.2-1 .6-1.3Zm11.3 11.3 2.6 2.6-11.4 6.5 8.8-9.1Zm3.9-3.9 3 1.7c1 .6 1 1.6 0 2.2l-3 1.7-2.8-2.8 2.8-2.8ZM6.1 1.8l11.4 6.5-2.6 2.6-8.8-9.1Z"/></svg>';

function playButton(p) {
  const btn = el(p.play ? 'a' : 'span', p.play ? 'play-btn' : 'play-btn is-soon');
  btn.innerHTML = `${PLAY_ICON}<span>${t(p.play ? 'play_get' : 'play_soon')}</span>`;
  if (p.play) {
    btn.href = p.play;
    btn.target = '_blank';
    btn.rel = 'noreferrer';
  }
  if (!p.store) btn.hidden = true;
  return btn;
}

function openProject(id) {
  if (!dialog) return;
  currentProject = id;
  renderProject(id);
  if (!dialog.open) dialog.showModal();
  history.replaceState(null, '', `#p-${id}`);
  dialog.querySelector('.pd-inner').scrollTop = 0;
  dialog.querySelector('.pd-shots').scrollLeft = 0;
}

document.querySelectorAll('.project-open').forEach((button) => {
  button.addEventListener('click', () => openProject(button.dataset.project));
});

if (dialog) {
  dialog.querySelector('.pd-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    currentProject = null;
    if (location.hash.startsWith('#p-')) history.replaceState(null, '', '#projects');
  });
}

function openFromHash() {
  const id = location.hash.startsWith('#p-') ? location.hash.slice(3) : '';
  if (PROJECTS[id] && currentProject !== id) openProject(id);
}

/* ---------- Latest commits (GitHub) ---------- */

const ghList = document.querySelector('.gh-commits');
let ghCommits = null;

const UZ_AGO = { year: 'yil', month: 'oy', week: 'hafta', day: 'kun', hour: 'soat', minute: 'daqiqa' };

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  const [unit, sec] = units.find(([, s]) => diff >= s) || ['minute', 60];
  const n = Math.max(1, Math.round(diff / sec));
  // ICU has no proper Uzbek relative-time data in many browsers, so Uzbek is formatted by hand.
  if (root.lang === 'uz') return diff < 60 ? 'hozirgina' : `${n} ${UZ_AGO[unit]} oldin`;
  try {
    return new Intl.RelativeTimeFormat(root.lang, { numeric: 'auto' }).format(-n, unit);
  } catch (e) {
    return new Date(date).toLocaleDateString();
  }
}

function renderCommits() {
  if (!ghList || !ghCommits) return;
  ghList.replaceChildren(
    ...ghCommits.map((c) => {
      const li = el('li');
      const a = el('a', '', c.message);
      a.href = c.url;
      a.target = '_blank';
      a.rel = 'noreferrer';
      const time = el('time', '', timeAgo(c.date));
      time.dateTime = c.date;
      li.append(a, time);
      return li;
    })
  );
  ghList.closest('.gh-box').hidden = false;
}

async function loadCommits() {
  if (!ghList) return;
  const cacheKey = 'gh-commits';
  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
    if (cached) {
      ghCommits = cached;
      renderCommits();
      return;
    }
  } catch (e) {}
  try {
    const response = await fetch('https://api.github.com/repos/gofabek/gofabek.github.io/commits?per_page=4');
    if (!response.ok) return;
    const data = await response.json();
    ghCommits = data.map((c) => ({
      message: c.commit.message.split('\n')[0],
      date: c.commit.author.date,
      url: c.html_url
    }));
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(ghCommits));
    } catch (e) {}
    renderCommits();
  } catch (e) {}
}

/* ---------- Reveal on scroll ---------- */

const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  revealItems.forEach((item, i) => {
    item.style.transitionDelay = `${(i % 4) * 70}ms`;
    observer.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add('in'));
}

/* ---------- Init ---------- */

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

syncThemeButton();

const savedLang = load('lang');
setLanguage(translations[savedLang] ? savedLang : 'uz');

openFromHash();
window.addEventListener('hashchange', openFromHash);
loadCommits();
