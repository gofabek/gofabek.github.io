# Kontakt formasi → Telegram

Saytdagi formadan yuborilgan xabarlar to'g'ridan-to'g'ri Telegram'ingizga keladi.
Hozircha `script.js` dagi `CONTACT_ENDPOINT` bo'sh, shuning uchun xabarlar avvalgidek
emailga (formsubmit.co) boradi. Quyidagilarni qilgandan keyin Telegram'ga o'tadi.

## 1. Bot yaratish
1. Telegram'da [@BotFather](https://t.me/BotFather) → `/newbot` → nom bering.
2. Bergan **token**ni saqlab qo'ying (`123456:ABC...`). Uni hech kimga bermang va repoga yozmang.
3. Yangi botingizga `/start` yozing.
4. Brauzerda oching: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   javobdagi `"chat":{"id": ...}` — bu sizning **CHAT_ID**ingiz.

## 2. Cloudflare Worker
1. [dash.cloudflare.com](https://dash.cloudflare.com) da bepul akkaunt oching.
2. **Workers & Pages → Create → Worker** → nom: `gofa-contact` → Deploy.
3. **Edit code** → `telegram-contact.js` ichidagini to'liq qo'ying → Deploy.
4. **Settings → Variables and Secrets** → ikkita *Secret* qo'shing:
   - `BOT_TOKEN` = botning tokeni
   - `CHAT_ID` = 1-bosqichdagi raqam
5. Worker manzilini nusxalang: `https://gofa-contact.<sizning-nom>.workers.dev`

## 3. Saytga ulash
`script.js` da:
```js
const CONTACT_ENDPOINT = 'https://gofa-contact.<sizning-nom>.workers.dev';
```
Commit + push. Worker ishlamay qolsa, forma pochta ilovasini ochib beradi (xabar yo'qolmaydi).

Worker faqat `https://gofabek.github.io` dan kelgan so'rovlarni qabul qiladi.
