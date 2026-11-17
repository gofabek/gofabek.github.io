# Maqolalar

- `drafts/` — qoralamalar. Git'ga qo'shilmaydi (`.gitignore`), saytga chiqmaydi.
- `posts/` — tayyor maqolalar. Saytda `/blog/<fayl-nomi>/` manzilida chiqadi.

Har bir fayl boshida JSON sarlavha bo'ladi:

```html
<!-- {
  "title": "Sarlavha",
  "date": "2026-11-17",
  "description": "Bir-ikki gaplik tavsif (Google va Telegram uchun)",
  "image": "images/og/girih.jpg"
} -->
<p>Matn…</p>
```

Qoralamani ko'rish: `node tools/build-pages.mjs --drafts`
Chop etish: faylni `posts/` ga ko'chiring → `node tools/build-pages.mjs` → commit + push.
Birinchi maqola chiqqanda menyuda "Maqolalar" havolasi o'zi paydo bo'ladi.
