import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { startBot, setupMenuButton, setWebAppUrl, loadEnv, getLatestTelegramUser } from './bot.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

loadEnv()

const PORT = parseInt(process.env.PORT || '3000', 10)
let WEB_APP_URL = process.env.WEB_APP_URL || ''
const DIST_DIR = path.join(__dirname, 'dist')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
}

/**
 * Statik fayllarni uzatuvchi HTTP server
 */
function createStaticServer() {
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', '*')
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    res.setHeader('X-Robots-Tag', 'all')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    let reqPath = decodeURIComponent(parsedUrl.pathname)

    if (reqPath === '/robots.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end("User-agent: *\nAllow: /\n")
      return
    }

    if (reqPath === '/api/current-user') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify(getLatestTelegramUser()))
      return
    }

    if (reqPath === '/api/save-preview' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', () => {
        try {
          const { name, base64 } = JSON.parse(body)
          const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')
          const pubDir = path.join(__dirname, 'public/assets/previews/harbiy')
          const distDir = path.join(__dirname, 'dist/assets/previews/harbiy')
          if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true })
          if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true })
          fs.writeFileSync(path.join(pubDir, name), buffer)
          fs.writeFileSync(path.join(distDir, name), buffer)
          res.writeHead(200, { 'Content-Type': 'text/plain' })
          res.end('OK')
        } catch (e) {
          res.writeHead(500)
          res.end(e.message)
        }
      })
      return
    }

    if (!fs.existsSync(DIST_DIR)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(`
        <h2>Ilova hali yig'ilmagan (Build qilinmagan)</h2>
        <p>Iltimos, avval <code>pnpm run build</code> yoki <code>npm run build</code> buyrug'ini ishga tushiring.</p>
      `)
      return
    }

    const safeDist = path.resolve(DIST_DIR)
    const safePublic = path.resolve(path.join(__dirname, 'public'))
    let filePath = path.resolve(safeDist, '.' + reqPath)

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html')
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      const publicPath = path.resolve(safePublic, '.' + reqPath)
      if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
        filePath = publicPath
      } else {
        filePath = path.join(safeDist, 'index.html')
      }
    }

    console.log(`[HTTP ${req.method}] ${req.url} -> ${path.basename(filePath)}`)

    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500)
        res.end('Server xatoligi')
        return
      }
      if (ext === '.glb' || ext === '.wasm') {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      }

      const acceptEncoding = req.headers['accept-encoding'] || ''
      const isCompressible = ['.js', '.css', '.html', '.json', '.svg', '.txt'].includes(ext)

      if (isCompressible && acceptEncoding.includes('gzip')) {
        zlib.gzip(data, (gErr, compressed) => {
          if (gErr) {
            res.writeHead(200, { 'Content-Type': contentType })
            res.end(data)
          } else {
            res.writeHead(200, {
              'Content-Type': contentType,
              'Content-Encoding': 'gzip',
              'Content-Length': compressed.length,
            })
            res.end(compressed)
          }
        })
      } else {
        res.writeHead(200, { 'Content-Type': contentType })
        res.end(data)
      }
    })
  })

  return server
}

/**
 * Cloudflare orqali tezkor va barqaror HTTPS tunnel ochish
 */
function startCloudflareTunnel(localPort) {
  return new Promise((resolve) => {
    console.log('🚇 Telegram Mini App uchun Cloudflare HTTPS tunnel ochilmoqda...')

    const cloudflaredPath = path.join(__dirname, 'cloudflared.exe')
    const cmd = fs.existsSync(cloudflaredPath) ? cloudflaredPath : 'cloudflared'

    const cf = spawn(cmd, [
      'tunnel',
      '--url', `http://127.0.0.1:${localPort}`,
      '--http-host-header', 'localhost',
      '--no-autoupdate'
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let resolved = false

    const handleData = (chunk) => {
      const text = chunk.toString()
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/)
      if (match && !resolved) {
        resolved = true
        const url = match[0]
        resolve({ url, process: cf })
      }
    }

    cf.stdout.on('data', handleData)
    cf.stderr.on('data', handleData)

    cf.on('error', (err) => {
      console.warn('⚠️ Cloudflare tunnel ishga tushirishda ogohlantirish:', err.message)
      if (!resolved) {
        resolved = true
        resolve(null)
      }
    })

    setTimeout(() => {
      if (!resolved) {
        resolved = true
        resolve({ url: null, process: cf })
      }
    }, 12000)
  })
}

/**
 * Agentlar, botlar va test skriptlari uchun Cloudflare bot filtri yo'q ochiq HTTPS tunnel
 */
function startOpenSshTunnel(localPort) {
  return new Promise((resolve) => {
    console.log('🤖 Agentlar va botlar uchun to\'siqsiz ochiq HTTPS tunnel ochilmoqda...')

    const ssh = spawn('ssh.exe', [
      '-T',
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'ServerAliveInterval=15',
      '-R', `80:127.0.0.1:${localPort}`,
      'nokey@localhost.run',
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let resolved = false

    const handleData = (chunk) => {
      const text = chunk.toString()
      const match = text.match(/https:\/\/[a-zA-Z0-9\.\-]+\.life/)
      if (match && !resolved) {
        resolved = true
        const url = match[0]
        resolve({ url, process: ssh })
      }
    }

    ssh.stdout.on('data', handleData)
    ssh.stderr.on('data', handleData)

    ssh.on('error', (err) => {
      console.warn('⚠️ Ochiq SSH tunnel ogohlantirish:', err.message)
      if (!resolved) {
        resolved = true
        resolve(null)
      }
    })

    setTimeout(() => {
      if (!resolved) {
        resolved = true
        resolve({ url: null, process: ssh })
      }
    }, 15000)
  })
}

async function main() {
  console.log('========================================================')
  console.log('🎮 3D Models Marketplace & Telegram Bot ishga tushmoqda...')
  console.log('========================================================')

  // 1. Mahalliy veb-serverni ishga tushirish
  const server = createStaticServer()
  await new Promise((resolve) => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Mahalliy veb server tinglamoqda: http://localhost:${PORT}`)
      resolve()
    })
  })

  // 2. HTTPS Web App URL ni tekshirish yoki Cloudflare tunnel ochish
  let activeTunnel = null
  let activeOpenTunnel = null
  let OPEN_AGENT_URL = ''
  const isDynamicTunnel = !WEB_APP_URL || !WEB_APP_URL.startsWith('https://') || WEB_APP_URL.includes('.trycloudflare.com')

  if (isDynamicTunnel) {
    const [cfRes, openRes] = await Promise.all([
      startCloudflareTunnel(PORT),
      startOpenSshTunnel(PORT),
    ])

    if (cfRes && cfRes.url) {
      WEB_APP_URL = cfRes.url
      activeTunnel = cfRes.process
      console.log(`🚀 Cloudflare HTTPS Tunnel: ${WEB_APP_URL}`)
    }

    if (openRes && openRes.url) {
      OPEN_AGENT_URL = openRes.url
      activeOpenTunnel = openRes.process
      console.log(`🤖 Ochiq agent havolasi (403-siz, botlar uchun): ${OPEN_AGENT_URL}`)
    }

    setWebAppUrl(WEB_APP_URL || OPEN_AGENT_URL)
  } else {
    console.log(`🔗 Sozlangan Web App URL: ${WEB_APP_URL}`)
    setWebAppUrl(WEB_APP_URL)
  }

  console.log('========================================================')
  console.log('📱 Telegram Bot: https://t.me/kubix3d_bot')
  if (WEB_APP_URL) {
    console.log(`🌐 Mini App Havolasi (Brauzer/Telegram): ${WEB_APP_URL}`)
  }
  if (OPEN_AGENT_URL) {
    console.log(`🤖 Agent/Bot Havolasi (Bot Fight yo'q, 200 OK): ${OPEN_AGENT_URL}`)
  }
  console.log('========================================================\n')

  // 3. Botni ishga tushirish
  try {
    await startBot(WEB_APP_URL || OPEN_AGENT_URL)
  } finally {
    if (activeTunnel) {
      activeTunnel.kill()
    }
    if (activeOpenTunnel) {
      activeOpenTunnel.kill()
    }
    server.close()
  }
}

main().catch((err) => {
  console.error('Asosiy server xatosi:', err)
  process.exit(1)
})
