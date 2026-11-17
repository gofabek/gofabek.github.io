// Cloudflare Worker: receives the site's contact form and forwards it to Telegram.
// Secrets (set in Cloudflare, never in this file): BOT_TOKEN, CHAT_ID
// Setup steps: see worker/README.md

const ALLOWED_ORIGINS = ['https://gofabek.github.io'];
const MAX = { name: 100, email: 200, message: 3000 };

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin'
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(origin) }
  });
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, origin);
    if (!ALLOWED_ORIGINS.includes(origin)) return json({ ok: false, error: 'origin' }, 403, origin);

    let data;
    try {
      data = await request.json();
    } catch {
      return json({ ok: false, error: 'json' }, 400, origin);
    }

    const name = String(data.name || '').trim().slice(0, MAX.name);
    const email = String(data.email || '').trim().slice(0, MAX.email);
    const message = String(data.message || '').trim().slice(0, MAX.message);
    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ ok: false, error: 'invalid' }, 400, origin);
    }

    const text =
      `<b>📩 Saytdan yangi xabar</b>\n\n` +
      `<b>Ism:</b> ${escapeHtml(name)}\n` +
      `<b>Email:</b> ${escapeHtml(email)}\n` +
      `<b>Til:</b> ${escapeHtml(String(data.lang || '-'))} · <b>Sahifa:</b> ${escapeHtml(String(data.page || '/'))}\n\n` +
      escapeHtml(message);

    const tg = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true })
    });

    if (!tg.ok) return json({ ok: false, error: 'telegram' }, 502, origin);
    return json({ ok: true }, 200, origin);
  }
};
