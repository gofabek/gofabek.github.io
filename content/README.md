# Blog

Maqolalar `/blog/` va `/blog/<fayl-nomi>/` manzillarida chiqadi.
Birinchi maqola chop etilganda menyuda **Blog** bandi o‘zi paydo bo‘ladi, sitemap'ga ham o‘zi qo‘shiladi.

## Yangi maqola — 3 qadam

1. `content/posts/` ga yangi fayl oching. Fayl nomi manzil bo‘ladi:
   `godot-1000-daraja.html` → `https://gofabek.github.io/blog/godot-1000-daraja/`
   (lotin harflari, raqam va `-` ishlating).
2. Fayl boshiga sarlavha (JSON), keyin oddiy HTML matn yozing:

   ```html
   <!-- {
     "title": "Sarlavha",
     "date": "2026-11-24",
     "description": "Bir-ikki gaplik tavsif (Google va Telegram uchun)",
     "tags": ["Godot", "GDScript"],
     "image": "images/og/girih.jpg",
     "draft": true
   } -->
   <p>Birinchi xatboshi…</p>

   <h2>Bo‘lim sarlavhasi</h2>
   <p>Matn…</p>
   ```

3. Tayyor bo‘lgach `"draft": true` qatorini o‘chiring → `node tools/build-pages.mjs` → commit + push.

### Sarlavha maydonlari

| Maydon | Majburiy | Izoh |
|---|---|---|
| `title` | ha | Maqola sarlavhasi |
| `date` | ha | `YYYY-MM-DD` — ro‘yxat shu sana bo‘yicha tartiblanadi |
| `description` | ha | Ro‘yxatda, Google va Telegram'da ko‘rinadi |
| `tags` | yo‘q | Teglar ro‘yxati |
| `image` | yo‘q | Ulashishdagi rasm (1200×630). Bo‘lmasa — `images/og/home.jpg` |
| `updated` | yo‘q | Maqolani keyinroq yangilasangiz, yangilangan sana |
| `draft` | yo‘q | `true` — saytga chiqmaydi (faqat lokal ko‘rishda) |

## Matn ichida

- **Kod** (rangli bo‘lib chiqadi):
  ```html
  <pre><code class="language-gdscript">func _ready():
      pass</code></pre>
  ```
  Tillar: `gdscript`, `kotlin`, `python`, `javascript`, `bash`, `json` va boshqalar.
  Kod ichidagi `<` va `>` ni `&lt;` va `&gt;` deb yozing.
- **Qatordagi kod:** `<code>move_and_slide()</code>`
- **Rasm:** `images/blog/` ga qo‘ying va:
  ```html
  <figure>
    <img src="/images/blog/rasm.webp" alt="Rasmda nima borligi" width="480" height="853" loading="lazy" />
    <figcaption>Izoh</figcaption>
  </figure>
  ```
- **Eslatma (faqat o‘zingiz uchun):** `<p class="todo">…</p>` — sariq blok.

## Ko‘rish

`node tools/build-pages.mjs --drafts` — qoralamalar ham chiqadi (sariq "qoralama" belgisi bilan).
Keyin `python3 -m http.server` va brauzerda `http://localhost:8000/blog/`.
Commit qilishdan oldin oddiy `node tools/build-pages.mjs` ni ishga tushiring (qoralamasiz).

`content/drafts/` papkasi ham bor — u git'ga umuman qo‘shilmaydi (faqat shu kompyuterda).
