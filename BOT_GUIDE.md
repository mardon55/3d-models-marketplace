# 🎮 3D Models Marketplace — Telegram Bot & Mini App

Telegram boti muvaffaqiyatli ulandi va ishga tushirildi!

---

## 🤖 Bot Ma'lumotlari

- **Bot nomi:** `3D-glb`
- **Username:** [@kubix3d_bot](https://t.me/kubix3d_bot)
- **Bot ID:** `9285136966`
- **Token:** `9285136966:AAH3d_XBe_Bo-_eNrJC0xtOO4yJfc5X-3us`

---

## 🚀 Ishga Tushirish Buyruqlari

Terminalda quyidagi buyruqlar orqali boshqarishingiz mumkin:

```bash
# 1. Server + Telegram Botni birgalikda ishga tushirish (Tavsiya etiladi)
pnpm server
# yoki
npm run server

# 2. Faqat Telegram Botni ishga tushirish
pnpm bot
# yoki
npm run bot

# 3. Ilovani qayta yig'ish (Build)
pnpm run build
```

---

## ⚙️ Sozlamalar (`.env`)

Loyiha ildizidagi `.env` faylida quyidagi parametrlar mavjud:

```env
TELEGRAM_BOT_TOKEN=9285136966:AAH3d_XBe_Bo-_eNrJC0xtOO4yJfc5X-3us
WEB_APP_URL=https://sizning-domeningiz.uz
PORT=3000
```

> **Eslatma:** Telegram Mini App ochilishi uchun URL **HTTPS** bo'lishi shart. Agar `WEB_APP_URL` ko'rsatilmasa, server ishga tushganda avtomatik ravishda bepul HTTPS tunnel orqali ulaydi yoki o'zingizning Vercel/Netlify domeningizni kiritishingiz mumkin.

---

## ✨ Bot Imkoniyatlari

1. **`/start`** — 3D do'kon haqida to'liq ma'lumot va interaktiv **🚀 3D Do'konni ochish (Mini App)** tugmalari.
2. **`/shop` & `/catalog`** — Mavjud toifalar (Transport, Binolar, Harbiy texnika, Mebel, Qurollar va boshqalar) hamda eng mashhur 3D modellarning GLB o'lchami va narxlari.
3. **`/cart`** — Savat holatini ko'rish va to'g'ridan-to'g'ri savatga o'tish tugmasi.
4. **`/help`** — GLB formati, 3D modellar xaridi va platformadan foydalanish bo'yicha batafsil qo'llanma.
5. **🛍️ 3D Do'kon Menyusi (Chat Menu Button)** — Telegram chatida xabar yozish maydonining chap tomonida doimiy "🛍️ 3D Do'kon" tugmasi avtomatik o'rnatilgan.
6. **Buyurtmalarni avtomatik qabul qilish (`sendData`)** — Foydalanuvchi Mini App ichida savatga model qo'shib, "To'lovga o'tish" tugmasini bossa, buyurtma ma'lumotlari to'g'ridan-to'g'ri Telegram botga uzatiladi va bot mijozga rasmiy tasdiqlash chekini yuboradi.
7. **Telegram BackButton integratsiyasi** — Mini App ichida sahifalar orasida o'tilganda Telegramning yuqori chap burchagidagi "Orqaga" tugmasi avtomatik ishlaydi.

---

## 🛠️ BotFather orqali Mini App nomini biriktirish (Ixtiyoriy)

Agar foydalanuvchilar bot profilida to'g'ridan-to'g'ri "Open App" tugmasini ko'rishini istasangiz:
1. [@BotFather](https://t.me/BotFather) ga kiring.
2. `/newapp` buyrug'ini yuboring.
3. `@kubix3d_bot` ni tanlang.
4. Ilova nomi, tavsifi va fotosuratini yuklang.
5. Web App URL so'ralganda HTTPS havolangizni kiriting.
