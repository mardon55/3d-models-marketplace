import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// .env faylini o'qish
export function loadEnv() {
  const envPath = path.join(__dirname, '.env')
  if (!fs.existsSync(envPath)) return

  const content = fs.readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = val
    }
  }
}

loadEnv()

export const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9285136966:AAH3d_XBe_Bo-_eNrJC0xtOO4yJfc5X-3us'
export let WEB_APP_URL = process.env.WEB_APP_URL || ''
export function setWebAppUrl(url) {
  WEB_APP_URL = url
}
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`

export let latestTelegramUser = {
  id: 8766903510,
  first_name: 'Mardonbek',
  last_name: '',
  username: 'mardonbek_oo8',
}

export function getLatestTelegramUser() {
  return latestTelegramUser
}

/**
 * Telegram Bot API so'rov yuborish (avtomatik qayta urinish bilan)
 */
export async function callApi(method, data = null, retries = 3) {
  const url = `${API_BASE}/${method}`
  const options = {
    method: data ? 'POST' : 'GET',
    headers: data ? { 'Content-Type': 'application/json' } : {},
  }
  if (data) {
    options.body = JSON.stringify(data)
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options)
      const json = await response.json()
      if (!json.ok) {
        throw new Error(`Telegram API Error [${method}]: ${json.description || 'Unknown error'}`)
      }
      return json.result
    } catch (err) {
      if (attempt === retries) throw err
      await new Promise((r) => setTimeout(r, 1000 * attempt))
    }
  }
}

/**
 * Xabar yuborish
 */
export async function sendMessage(chatId, text, extra = {}) {
  return callApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...extra,
  })
}

/**
 * Callback query ga javob qaytarish
 */
export async function answerCallbackQuery(callbackQueryId, text = '') {
  return callApi('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
  })
}

/**
 * Asosiy Inline tugmalarni shakllantirish
 */
export function getMainKeyboard(webAppUrl, user = latestTelegramUser) {
  if (webAppUrl && webAppUrl.startsWith('https://')) {
    const q = user?.first_name
      ? `?id=${user.id || ''}&first_name=${encodeURIComponent(user.first_name)}&username=${encodeURIComponent(user.username || '')}`
      : ''
    const fullUrl = `${webAppUrl}${q}`
    return {
      inline_keyboard: [
        [
          {
            text: '🚀 3D Do\'konni ochish (Mini App)',
            web_app: { url: fullUrl },
          },
        ],
        [
          {
            text: '📦 Katalog',
            web_app: { url: `${webAppUrl}${q}#/catalog` },
          },
          {
            text: '🛒 Savat',
            web_app: { url: `${webAppUrl}${q}#/cart` },
          },
        ],
        [
          {
            text: '🌐 Brauzer orqali to\'g\'ridan-to\'g\'ri ochish',
            url: fullUrl,
          },
        ],
        [
          {
            text: '👤 Profil',
            web_app: { url: `${webAppUrl}${q}#/profile` },
          },
          { text: '🔥 Top modellar', callback_data: 'popular_models' },
        ],
        [
          { text: 'ℹ️ Yordam va qo\'llanma', callback_data: 'help_info' },
        ],
      ],
    }
  }

  return {
    inline_keyboard: [
      [
        { text: '🔥 Mashhur modellar', callback_data: 'popular_models' },
        { text: '📂 Katalog toifalari', callback_data: 'categories_info' },
      ],
      [{ text: 'ℹ️ Yordam va qo\'llanma', callback_data: 'help_info' }],
    ],
  }
}

/**
 * Doimiy pastki menyu klaviaturasi
 */
export function getReplyKeyboard(webAppUrl) {
  if (webAppUrl && webAppUrl.startsWith('https://')) {
    return {
      keyboard: [
        [
          {
            text: '🛍️ 3D Do\'konni ochish',
            web_app: { url: webAppUrl },
          },
        ],
      ],
      resize_keyboard: true,
      persistent: true,
    }
  }
  return undefined
}

export function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Start xabari matni
 */
export function getStartMessage(firstName, webAppUrl) {
  const urlStatus = webAppUrl && webAppUrl.startsWith('https://')
    ? `\n🌐 <b>Mini App manzili:</b> <code>${webAppUrl}</code>\n`
    : '\n💡 <i>Mini App to\'liq ishlashi uchun server ishga tushirilgan.</i>\n'

  return `👋 <b>Assalomu alaykum, ${escapeHtml(firstName || 'foydalanuvchi')}!</b>

🎮 <b>3D Models Marketplace</b> rasmiy Telegram botiga xush kelibsiz!

Bizning platformada siz o'yinlar, animatsiyalar, me'morchilik va 3D loyihalaringiz uchun eng sara <b>GLB / 3D modellarni</b> ko'rishingiz, ularni to'liq 3D ko'rinishida aylantirib tekshirishingiz va xarid qilishingiz mumkin.
${urlStatus}
✨ <b>Mavjud toifalar:</b>
🚗 <b>Transport:</b> Mercedes G63 va avtomobillar
🏢 <b>Binolar:</b> Zamonaviy villalar va inshootlar
🚁 <b>Harbiy texnika:</b> Vertolyotlar va qurollar
🎮 <b>O'yin aktivlari:</b> Game-ready modellar va kreslolar
🛋️ <b>Mebel & Dekor:</b> Sifatli interyer elementlari

👇 <b>Do'konni ochish uchun pastdagi tugmani bosing:</b>`
}

/**
 * Bot buyruqlarini sozlash
 */
export async function setupBotCommands() {
  try {
    await callApi('setMyCommands', {
      commands: [
        { command: 'start', description: '🚀 Botni ishga tushirish va 3D do\'konni ochish' },
        { command: 'shop', description: '🛍️ Mashhur 3D modellarni ko\'rish' },
        { command: 'catalog', description: '📦 Modellar katalogi va toifalari' },
        { command: 'cart', description: '🛒 Savat holati' },
        { command: 'help', description: 'ℹ️ Yordam va ma\'lumot' },
      ],
    })
    console.log('✅ Bot buyruqlari muvaffaqiyatli sozlandi (/start, /shop, /catalog, /cart, /help)')
  } catch (err) {
    console.warn('⚠️ Bot buyruqlarini sozlashda ogohlantirish:', err.message)
  }
}

/**
 * Chat Menyusi tugmasini sozlash (Pastdagi '🛍️ 3D Do'kon' tugmasi)
 */
export async function setupMenuButton(webAppUrl) {
  if (!webAppUrl || !webAppUrl.startsWith('https://')) {
    return
  }

  try {
    await callApi('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '🛍️ 3D Do\'kon',
        web_app: { url: webAppUrl },
      },
    })
    console.log(`✅ Chat menyusi tugmasi ulandi: 🛍️ 3D Do'kon -> ${webAppUrl}`)
  } catch (err) {
    console.warn('⚠️ Chat menyusi tugmasini sozlashda ogohlantirish:', err.message)
  }
}

/**
 * Xabarlarni qayta ishlash
 */
export async function handleMessage(msg) {
  const chatId = msg.chat?.id
  const text = msg.text?.trim()
  const firstName = msg.from?.first_name || 'Mardonbek'
  const username = msg.from?.username || 'mardonbek_oo8'

  if (msg.from) {
    latestTelegramUser = {
      id: msg.from.id,
      first_name: msg.from.first_name || 'Mardonbek',
      last_name: msg.from.last_name || '',
      username: msg.from.username || 'mardonbek_oo8',
    }
  }

  console.log(`📩 Yangi xabar: [Chat ${chatId}] "${text || (msg.web_app_data ? 'web_app_data' : 'boshqa')}" from ${firstName} (@${username})`)

  // 1. Agar foydalanuvchi Mini App dan buyurtma (sendData) yuborgan bo'lsa
  if (msg.web_app_data?.data) {
    try {
      const order = JSON.parse(msg.web_app_data.data)
      const orderId = Math.floor(100000 + Math.random() * 900000)
      const itemsList = Array.isArray(order.items)
        ? order.items.map((i) => `• <b>${escapeHtml(i.name)}</b> (${i.quantity} dona) — $${i.price}`).join('\n')
        : '• Tanlangan 3D modellar'

      const confirmMsg = `🎉 <b>Buyurtmangiz qabul qilindi!</b>

🆔 <b>Buyurtma ID:</b> <code>#3D-${orderId}</code>
👤 <b>Xaridor:</b> ${escapeHtml(firstName)}${username ? ` (@${username})` : ''}
📅 <b>Sana:</b> ${new Date().toLocaleString('uz-UZ')}

📦 <b>Xarid qilingan 3D modellar:</b>
${itemsList}

💰 <b>Jami to'lov:</b> <b>$${order.totalAmount || order.total || '0.00'}</b>

📥 <b>Fayllar haqida:</b>
Siz tanlagan barcha modellar (GLB formatida) arxivlanmoqda va profilingizga yuklab olish uchun biriktirildi!

Rahmat! Siz bilan ishlashdan mamnunmiz! 🌟`

      await sendMessage(chatId, confirmMsg, {
        reply_markup: getMainKeyboard(WEB_APP_URL),
      })
      return
    } catch (e) {
      console.error('web_app_data o\'qishda xatolik:', e)
    }
  }

  // 2. /start buyrug'i
  if (text?.startsWith('/start')) {
    const welcome = getStartMessage(firstName, WEB_APP_URL)
    const replyMarkup = getMainKeyboard(WEB_APP_URL)
    const replyKeyboard = getReplyKeyboard(WEB_APP_URL)

    await sendMessage(chatId, welcome, {
      reply_markup: replyMarkup,
    })

    if (replyKeyboard) {
      await sendMessage(chatId, '👇 Quyidagi menyu orqali ham to\'g\'ridan-to\'g\'ri do\'konga kirishingiz mumkin:', {
        reply_markup: replyKeyboard,
      })
    }
    return
  }

  // 3. /shop yoki /catalog buyruqlari
  if (text === '/shop' || text === '/catalog') {
    const shopMsg = `📦 <b>3D Modellari Katalogi:</b>

🔥 <b>Eng mashhur modellar:</b>
1. <b>Mercedes G63</b> — GLB • 4.8 MB — <b>$12.99</b>
2. <b>Zamonaviy villa</b> — GLB • 15.2 MB — <b>$24.99</b>
3. <b>Harbiy vertolyot</b> — GLB • 18.6 MB — <b>$19.99</b>
4. <b>Gaming kreslo</b> — GLB • 2.1 MB — <b>$4.99</b>
5. <b>M4A1 (Game-Ready)</b> — GLB • 6.7 MB — <b>$9.99</b>
6. <b>Yuk konteyneri</b> — GLB • 3.9 MB — <b>$5.99</b>

Barcha modellarni 3D interaktiv ko'rinishida tomosha qilish va xarid qilish uchun ilovani oching:`

    await sendMessage(chatId, shopMsg, {
      reply_markup: getMainKeyboard(WEB_APP_URL),
    })
    return
  }

  // 4. /cart buyrug'i
  if (text === '/cart') {
    const cartMsg = `🛒 <b>Savat bo'limi:</b>

Siz tanlagan 3D modellaringiz Mini App ichidagi savatda saqlanadi. 
Savatni boshqarish, mahsulotlar sonini o'zgartirish va buyurtmani tasdiqlash uchun pastdagi tugmani bosing:`

    const cartKeyboard = WEB_APP_URL && WEB_APP_URL.startsWith('https://')
      ? {
          inline_keyboard: [
            [{ text: '🛒 Savatni ochish', web_app: { url: `${WEB_APP_URL}#/cart` } }],
            [{ text: '🚀 Asosiy do\'konga qaytish', web_app: { url: WEB_APP_URL } }],
          ],
        }
      : getMainKeyboard(WEB_APP_URL)

    await sendMessage(chatId, cartMsg, { reply_markup: cartKeyboard })
    return
  }

  // 5. /help buyrug'i
  if (text === '/help') {
    await sendHelpMessage(chatId)
    return
  }

  // Oddiy matn kelsa
  await sendMessage(
    chatId,
    `Kerakli bo'limni tanlash yoki 3D do'konni ochish uchun pastdagi tugmalardan foydalaning.
Yordam uchun: /help buyrug'ini yuboring.`,
    {
      reply_markup: getMainKeyboard(WEB_APP_URL),
    },
  )
}

/**
 * Yordam xabarini yuborish
 */
export async function sendHelpMessage(chatId) {
  const helpText = `ℹ️ <b>3D Models Marketplace bo'yicha yordam:</b>

🔹 <b>GLB formati nima?</b>
GLB — bu zamonaviy 3D grafik format bo'lib, o'zida model geometriyasi, teksturalar, materiallar va animatsiyalarni bitta ixcham faylda saqlaydi. Web, Blender, Unity, Unreal Engine va Three.js bilan 100% mos keladi.

🔹 <b>Qanday qilib model sotib olaman?</b>
1. "3D Do'konni ochish" tugmasini bosing.
2. Yoqtirgan modelingizni savatga qo'shing.
3. Savatga o'tib "To'lovga o'tish" tugmasini bosing.
4. Buyurtma tasdiqlangach, faylni yuklab olish imkoniga ega bo'lasiz.

🔹 <b>Savollar yoki takliflar bormi?</b>
Qo'llab-quvvatlash xizmati doimo yordamga tayyor!`

  await sendMessage(chatId, helpText, {
    reply_markup: getMainKeyboard(WEB_APP_URL),
  })
}

/**
 * Callback querylarni qayta ishlash
 */
export async function handleCallbackQuery(cbQuery) {
  const data = cbQuery.data
  const chatId = cbQuery.message?.chat?.id

  await answerCallbackQuery(cbQuery.id)

  if (data === 'popular_models') {
    const text = `🔥 <b>Top 3D Modellar ro'yxati:</b>

• <b>Mercedes G63</b> — $12.99 (4.8 MB)
• <b>Zamonaviy villa</b> — $24.99 (15.2 MB)
• <b>Harbiy vertolyot</b> — $19.99 (18.6 MB)
• <b>Gaming kreslo</b> — $4.99 (2.1 MB)
• <b>M4A1 Avtomat</b> — $9.99 (6.7 MB)

Ilovani ochib, har bir modelni 360° ko'rinishda aylantirib ko'rishingiz mumkin!`

    await sendMessage(chatId, text, { reply_markup: getMainKeyboard(WEB_APP_URL) })
  } else if (data === 'categories_info') {
    const text = `📂 <b>Barcha toifalar:</b>

1. 🚗 <b>Transport:</b> 247 ta model
2. 🏢 <b>Binolar:</b> 186 ta model
3. 🚁 <b>Harbiy texnika:</b> 92 ta model
4. 🎮 <b>O'yin aktivlari:</b> 314 ta model
5. 🔫 <b>Qurollar:</b> 128 ta model
6. 📦 <b>Konteynerlar:</b> 57 ta model
7. 🛋️ <b>Mebel:</b> 203 ta model
8. 🏗️ <b>Materiallar:</b> 76 ta model`

    await sendMessage(chatId, text, { reply_markup: getMainKeyboard(WEB_APP_URL) })
  } else if (data === 'help_info') {
    await sendHelpMessage(chatId)
  }
}

/**
 * Botni ishga tushirish (Long Polling)
 */
export async function startBot(customWebAppUrl = null) {
  if (customWebAppUrl) {
    WEB_APP_URL = customWebAppUrl
  }

  console.log('🤖 Telegram Botga ulanilmoqda...')
  const me = await callApi('getMe')
  console.log(`✨ Bot ulandi: @${me.username} (${me.first_name}) [ID: ${me.id}]`)

  // Buyruqlarni va menyuni sozlash
  await setupBotCommands()
  if (WEB_APP_URL) {
    await setupMenuButton(WEB_APP_URL)
  }

  console.log('📡 Xabarlar qabul qilinmoqda (Long Polling faol)...')

  let offset = 0
  let isRunning = true

  const stop = () => {
    isRunning = false
    console.log('🛑 Bot to\'xtatilmoqda...')
  }

  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)

  while (isRunning) {
    try {
      const updates = await callApi('getUpdates', {
        offset,
        timeout: 25,
        allowed_updates: ['message', 'callback_query'],
      })

      for (const update of updates) {
        offset = update.update_id + 1

        if (update.message) {
          handleMessage(update.message).catch((err) => {
            console.error('Xabarni qayta ishlashda xato:', err.message)
          })
        } else if (update.callback_query) {
          handleCallbackQuery(update.callback_query).catch((err) => {
            console.error('Callback qayta ishlashda xato:', err.message)
          })
        }
      }
    } catch (err) {
      if (!isRunning) break
      console.error('⚠️ Polling xatoligi, 3 soniyadan so\'ng qayta ulanadi:', err.message)
      await new Promise((r) => setTimeout(r, 3000))
    }
  }

  console.log('Bot to\'xtatildi.')
}

// Agar to'g'ridan-to'g'ri ishga tushirilsa: node bot.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startBot().catch((err) => {
    console.error('Kutilmagan xatolik:', err)
    process.exit(1)
  })
}
