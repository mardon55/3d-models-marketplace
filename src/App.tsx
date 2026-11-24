import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Armchair,
  ArrowLeft,
  ArrowRight,
  Box,
  Car,
  Check,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  Gamepad2,
  Grid2X2,
  Headphones,
  Home,
  House,
  Layers3,
  Plane,
  Search,
  ShoppingBag,
  ShoppingCart,
  Target,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { categories, products, type CartLine, type Product } from './data/models'
import { Kalashnikov3DViewer } from './components/Kalashnikov3DViewer'
import { GLBModelViewer } from './components/GLBModelViewer'
import { Shared3DCanvas } from './components/Shared3DCanvas'

type Route = 'home' | 'catalog' | 'cart' | 'profile'

type TelegramUser = {
  id?: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        requestFullscreen?: () => void
        exitFullscreen?: () => void
        isFullscreen?: boolean
        disableVerticalSwipes?: () => void
        enableClosingConfirmation?: () => void
        setHeaderColor?: (color: string) => void
        setBackgroundColor?: (color: string) => void
        initData?: string
        initDataUnsafe?: { user?: TelegramUser }
        sendData?: (data: string) => void
        showAlert?: (message: string, callback?: () => void) => void
        BackButton?: {
          show: () => void
          hide: () => void
          onClick: (cb: () => void) => void
          offClick: (cb: () => void) => void
        }
      }
    }
  }
}

const DEFAULT_USER: TelegramUser = {
  id: 8766903510,
  first_name: 'Mardonbek',
  username: 'mardonbek_oo8',
}

function getTelegramUser(): TelegramUser {
  try {
    const webApp = window.Telegram?.WebApp
    if (webApp?.initDataUnsafe?.user && (webApp.initDataUnsafe.user.first_name || webApp.initDataUnsafe.user.id || webApp.initDataUnsafe.user.username)) {
      const u = webApp.initDataUnsafe.user
      try {
        localStorage.setItem('tg_user_cache', JSON.stringify(u))
      } catch (_) {}
      return u
    }

    if (webApp?.initData) {
      const params = new URLSearchParams(webApp.initData)
      const userStr = params.get('user')
      if (userStr) {
        const u = JSON.parse(decodeURIComponent(userStr))
        try {
          localStorage.setItem('tg_user_cache', JSON.stringify(u))
        } catch (_) {}
        return u
      }
    }

    // Check search params or hash for user fields
    const searchParams = new URLSearchParams(window.location.search)
    const directFirst = searchParams.get('first_name') || searchParams.get('firstName')
    const directUser = searchParams.get('username')
    const directId = searchParams.get('id') || searchParams.get('user_id')
    if (directFirst || directUser) {
      const u: TelegramUser = {
        id: directId ? parseInt(directId, 10) : undefined,
        first_name: directFirst || undefined,
        last_name: searchParams.get('last_name') || undefined,
        username: directUser || undefined,
      }
      try {
        localStorage.setItem('tg_user_cache', JSON.stringify(u))
      } catch (_) {}
      return u
    }

    let raw = searchParams.get('tgWebAppData')
    if (!raw && window.location.hash) {
      const hash = window.location.hash.substring(1)
      const qIndex = hash.indexOf('?')
      const queryPart = qIndex >= 0 ? hash.substring(qIndex + 1) : (hash.includes('=') ? hash : '')
      if (queryPart) {
        const hashParams = new URLSearchParams(queryPart)
        const hFirst = hashParams.get('first_name')
        const hUser = hashParams.get('username')
        const hId = hashParams.get('id')
        if (hFirst || hUser) {
          const u: TelegramUser = {
            id: hId ? parseInt(hId, 10) : undefined,
            first_name: hFirst || undefined,
            username: hUser || undefined,
          }
          try {
            localStorage.setItem('tg_user_cache', JSON.stringify(u))
          } catch (_) {}
          return u
        }
        raw = hashParams.get('tgWebAppData')
      }
    }

    if (raw) {
      const inner = new URLSearchParams(raw)
      const userStr = inner.get('user')
      if (userStr) {
        const u = JSON.parse(decodeURIComponent(userStr))
        try {
          localStorage.setItem('tg_user_cache', JSON.stringify(u))
        } catch (_) {}
        return u
      }
    }

    // Try localStorage
    const cached = localStorage.getItem('tg_user_cache')
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed && (parsed.first_name || parsed.username)) {
        return parsed
      }
    }
  } catch (err) {
    console.warn('Error reading Telegram user:', err)
  }
  return DEFAULT_USER
}

export interface NavigationState {
  route: Route
  category: string | null
  productId: string | null
}

export function parseNavigationHash(hashStr: string): NavigationState {
  let clean = hashStr.replace(/^#\/?/, '').trim()
  const qIdx = clean.indexOf('?')
  if (qIdx !== -1) {
    clean = clean.substring(0, qIdx)
  }
  clean = clean.replace(/\/+$/, '')

  if (!clean || clean === 'home') {
    return { route: 'home', category: null, productId: null }
  }

  const parts = clean.split('/').map((p) => {
    try {
      return decodeURIComponent(p)
    } catch {
      return p
    }
  })

  if (parts[0] === 'product' && parts[1]) {
    return { route: 'home', category: null, productId: parts[1] }
  }

  if (parts[0] === 'catalog') {
    const productIdx = parts.indexOf('product')
    if (productIdx !== -1 && parts[productIdx + 1]) {
      const pId = parts[productIdx + 1]
      const cat = productIdx === 2 ? parts[1] : null
      return { route: 'catalog', category: cat, productId: pId }
    }
    const cat = parts[1] || null
    return { route: 'catalog', category: cat, productId: null }
  }

  if (parts[0] === 'cart') {
    if (parts[1] === 'product' && parts[2]) {
      return { route: 'cart', category: null, productId: parts[2] }
    }
    return { route: 'cart', category: null, productId: null }
  }

  if (parts[0] === 'profile') {
    return { route: 'profile', category: null, productId: null }
  }

  return { route: 'home', category: null, productId: null }
}

function doProgrammaticStepBack(current: NavigationState) {
  if (current.productId) {
    if (current.route === 'catalog') {
      window.location.hash = current.category
        ? `/catalog/${encodeURIComponent(current.category)}`
        : '/catalog'
    } else if (current.route === 'cart') {
      window.location.hash = '/cart'
    } else {
      window.location.hash = '/home'
    }
  } else if (current.route === 'catalog' && current.category) {
    window.location.hash = '/catalog'
  } else if (current.route !== 'home') {
    window.location.hash = '/home'
  }
}

function GlassButton({
  children,
  className = '',
  label,
  onClick,
}: {
  children: ReactNode
  className?: string
  label: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button aria-label={label} className={`glass-button ${className}`} onClick={onClick}>
      {children}
    </button>
  )
}

function Header({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="header-actions">{actions}</div>}
    </header>
  )
}

function ProductCard({
  product,
  add,
  onOpen,
}: {
  product: Product
  add: (product: Product) => void
  onOpen: (product: Product) => void
}) {
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const handleLoaded = () => {
      setLoaded(true)
      setLoadError(false)
    }
    const handleError = () => {
      setLoadError(true)
      setLoaded(false)
    }

    if (el.getAttribute('data-loaded') === 'true') {
      setLoaded(true)
    }

    el.addEventListener('glb-loaded', handleLoaded)
    el.addEventListener('glb-error', handleError)

    // Mutation observer to detect data-loaded attribute directly
    const attrObserver = new MutationObserver(() => {
      if (el.getAttribute('data-loaded') === 'true') {
        setLoaded(true)
      }
    })
    attrObserver.observe(el, { attributes: true, attributeFilter: ['data-loaded'] })

    return () => {
      el.removeEventListener('glb-loaded', handleLoaded)
      el.removeEventListener('glb-error', handleError)
      attrObserver.disconnect()
    }
  }, [product.cardGlbUrl, product.glbUrl])

  return (
    <article
      className="glass-card product-card"
      onClick={() => onOpen(product)}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      <div className="card-badge-row">
        <span className="glb-badge">GLB</span>
        <span className="badge-3d-live">✨ 360° 3D</span>
      </div>

      <div className="product-viewport-wrap">
        {/* Real 3D GLB Scissor Viewport */}
        <div
          ref={viewportRef}
          className="card-3d-viewport"
          data-product-id={product.id}
          data-card-glb={product.cardGlbUrl || product.glbUrl}
        />

        {/* Loading state without images */}
        {!loaded && !loadError && (
          <div className="card-3d-loading-overlay">
            <div className="card-3d-spinner-ring" />
            <span className="card-3d-loading-text">3D model yuklanmoqda...</span>
          </div>
        )}

        {/* Error state without images */}
        {loadError && (
          <div className="card-3d-error-overlay">
            <span className="card-3d-error-text">Model yuklanmadi</span>
            <button
              type="button"
              className="card-3d-retry-btn"
              onClick={(e) => {
                e.stopPropagation()
                setLoadError(false)
                if (viewportRef.current) {
                  viewportRef.current.removeAttribute('data-error')
                  viewportRef.current.dispatchEvent(new CustomEvent('glb-retry', { bubbles: true }))
                }
              }}
            >
              Qayta urinish
            </button>
          </div>
        )}
      </div>

      <div className="product-info-wrap" style={{ position: 'relative', zIndex: 12 }}>
        <h3>{product.name}</h3>
        <p>GLB <span>•</span> {product.size}</p>
        <div className="product-actions">
          <div
            className="price-pill"
            onClick={(e) => {
              e.stopPropagation()
              onOpen(product)
            }}
          >
            ${product.price.toFixed(2)}
          </div>
          <GlassButton
            label={`${product.name}ni savatga qo'shish`}
            onClick={(e) => {
              e.stopPropagation()
              add(product)
            }}
          >
            <ShoppingCart size={18} />
          </GlassButton>
        </div>
      </div>
    </article>
  )
}

/* ==========================================================
   Full Page Product Detail Screen (Store App Style)
   ========================================================== */
function ProductDetailScreen({
  product,
  add,
}: {
  product: Product
  add: (product: Product) => void
}) {
  const [added, setAdded] = useState(false)
  const isInteractiveAk47 = Boolean(
    product.id === 'ak47-interactive' || product.name.includes('(Interaktiv)')
  )
  const hasGlb = Boolean(product.glbUrl)
  const is3D = Boolean(isInteractiveAk47 || hasGlb || product.has3D)

  const handleAdd = () => {
    add(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="product-detail-page">
      <section className={`detail-stage ${is3D ? 'has-3d-viewer' : ''}`}>
        {isInteractiveAk47 ? (
          <Kalashnikov3DViewer />
        ) : (
          <GLBModelViewer glbUrl={product.glbUrl} productName={product.name} />
        )}
      </section>

      <section className="glass-card detail-info-section">
        <div className="detail-category-row">
          <div className="detail-category-tag">
            <span />
            {product.category || '3D Model'}
          </div>
          <span className="detail-format-badge">GLB Format</span>
        </div>

        <div className="detail-title-price">
          <div>
            <h2>{product.name}</h2>
            <p>GLB Format <span>•</span> {product.size}</p>
          </div>
          <div className="detail-price-badge">${product.price.toFixed(2)}</div>
        </div>
      </section>

      <section className="detail-specs-grid">
        <div className="detail-spec-card">
          <span>Format</span>
          <b>{product.format || 'GLB / GLTF'}</b>
        </div>
        <div className="detail-spec-card">
          <span>Hajmi</span>
          <b>{product.size}</b>
        </div>
        <div className="detail-spec-card">
          <span>Poligonlar</span>
          <b>{product.polygons || '24,500'}</b>
        </div>
        <div className="detail-spec-card">
          <span>To'r (Vertices)</span>
          <b>{product.vertices || '18,200'}</b>
        </div>
      </section>

      <section className="glass-card detail-desc-card">
        <h3>Model tavsifi</h3>
        <p>{product.description || "Yuqori sifatli va to'liq optimallashtirilgan 3D model. O'yinlar, animatsiya va vizualizatsiyalar uchun to'liq moslangan."}</p>

        <div className="detail-features-list">
          <div className="detail-feature-item">
            <Check size={16} />
            <span>Unity, Unreal Engine va Blender bilan 100% mos</span>
          </div>
          <div className="detail-feature-item">
            <Check size={16} />
            <span>Toza UV xaritasi va PBR teksturalar</span>
          </div>
          <div className="detail-feature-item">
            <Check size={16} />
            <span>Tijoriy va shaxsiy loyihalarda erkin foydalanish</span>
          </div>
        </div>
      </section>

      <div className="detail-bottom-bar">
        <button
          className={`detail-add-full-btn ${added ? 'added' : ''}`}
          onClick={handleAdd}
        >
          {added ? (
            <>
              <Check size={20} />
              <span>Savatga qo'shildi!</span>
            </>
          ) : (
            <>
              <ShoppingCart size={20} />
              <span>Savatga</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function HomeScreen({
  add,
  onOpen,
}: {
  add: (product: Product) => void
  onOpen: (product: Product) => void
}) {
  const featuredProduct = products.find(p => p.id === 'transport-02') || products[1] || products[0]

  return (
    <>
      <Header title="3D Models" />
      <main>
        <section className="glass-card hero" style={{ position: 'relative', overflow: 'hidden', minHeight: '160px' }}>
          <div className="hero-copy" style={{ maxWidth: '52%' }}>
            <span className="hero-badge">GLB <i /> 3D</span>
            <h2>Sifatli 3D modellar</h2>
            <p>O'yinlar, animatsiya va loyihalaringiz uchun</p>
          </div>
          <div
            className="hero-visual"
            onClick={() => onOpen(featuredProduct)}
            style={{ cursor: 'pointer' }}
          >
            <div
              className="card-3d-viewport"
              data-product-id={`hero-${featuredProduct?.id}`}
              data-card-glb={featuredProduct?.cardGlbUrl || featuredProduct?.glbUrl}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <div className="carousel-dots"><b /><i /><i /></div>
        </section>

        <section className="product-grid" style={{ marginTop: '16px' }}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              add={add}
              onOpen={onOpen}
            />
          ))}
        </section>
      </main>
    </>
  )
}

const categoryIcons: Record<string, LucideIcon> = {
  car: Car, house: House, plane: Plane, gamepad: Gamepad2, target: Target,
  box: Box, armchair: Armchair, layers: Layers3,
}

function CatalogScreen({
  onOpen,
  add,
  selectedCategory,
  setSelectedCategory,
}: {
  onOpen: (product: Product) => void
  add: (product: Product) => void
  selectedCategory: string | null
  setSelectedCategory: (cat: string | null) => void
}) {
  const [search, setSearch] = useState('')

  const displayedProducts = useMemo(() => {
    let list = selectedCategory ? products.filter((p) => p.category === selectedCategory) : products
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q)))
    }
    return list
  }, [selectedCategory, search])

  return (
    <>
      <Header
        title={selectedCategory ? selectedCategory : "Katalog"}
        actions={
          <GlassButton label="Qidirish" className="header-icon"><Search size={19} /></GlassButton>
        }
      />
      <main>
        {/* Quick Search Bar */}
        <div style={{ marginBottom: '14px', position: 'relative' }}>
          <input
            type="text"
            placeholder={selectedCategory ? `${selectedCategory} ichidan qidirish...` : "Model nomini qidiring (masalan: AK-47, M4A1)..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              boxSizing: 'border-box'
            }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.45)' }} />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category Switcher Tabs when a category is selected */}
        {selectedCategory && (
          <div className="no-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: '5px 12px',
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)',
                color: '#e9d5ff',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ← Barcha toifalar
            </button>
            {categories.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedCategory(c.name)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: selectedCategory === c.name ? '#c084fc' : 'rgba(255,255,255,0.12)',
                  background: selectedCategory === c.name ? 'linear-gradient(135deg, #9333ea, #7c3aed)' : 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {c.name} ({c.count})
              </button>
            ))}
          </div>
        )}

        {/* If category selected or searching: show product grid */}
        {selectedCategory || search.trim() ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#e9d5ff' }}>
                {selectedCategory ? `${selectedCategory} (${displayedProducts.length} ta model)` : `Natijalar (${displayedProducts.length} ta model)`}
              </span>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  style={{ background: 'none', border: 'none', color: '#c084fc', fontSize: '12px', cursor: 'pointer' }}
                >
                  Toifalarga qaytish
                </button>
              )}
            </div>

            {displayedProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.6)' }}>
                Model topilmadi
              </div>
            ) : (
              <section className="product-grid">
                {displayedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    add={add}
                    onOpen={onOpen}
                  />
                ))}
              </section>
            )}
          </div>
        ) : (
          /* Main Category Grid Cards */
          <section className="catalog-grid">
            {categories.map((category) => {
              const Icon = categoryIcons[category.icon]
              return (
                <button
                  type="button"
                  className="glass-card category-card"
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <span className="category-icon"><Icon size={24} /></span>
                  <div>
                    <h2>{category.name}</h2>
                    <p>{category.count} ta model</p>
                  </div>
                  <span className="category-arrow"><ChevronRight size={18} /></span>
                </button>
              )
            })}
          </section>
        )}
      </main>
    </>
  )
}

function CartItem({
  item,
  change,
  remove,
  onOpen,
}: {
  item: CartLine
  change: (id: string, amount: number) => void
  remove: (id: string) => void
  onOpen: (product: Product) => void
}) {
  return (
    <article className="glass-card cart-item">
      <div
        className="cart-thumb"
        onClick={() => onOpen(item)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box size={24} color="#c084fc" />
      </div>
      <div className="cart-info">
        <span className="glb-badge">GLB</span>
        <h3
          onClick={() => onOpen(item)}
          style={{ cursor: 'pointer' }}
        >
          {item.name}
        </h3>
        <p>GLB <span>•</span> {item.size}</p>
        <div className="stepper">
          <button aria-label="Kamaytirish" onClick={() => change(item.id, -1)}>−</button>
          <b>{item.quantity}</b>
          <button aria-label="Ko'paytirish" onClick={() => change(item.id, 1)}>+</button>
        </div>
      </div>
      <button className="remove-item" aria-label="Olib tashlash" onClick={() => remove(item.id)}>
        <X size={14} />
      </button>
      <div className="line-price">
        <b>${(item.price * item.quantity).toFixed(2)}</b>
        {item.quantity > 1 && <small>(${item.price.toFixed(2)} × {item.quantity})</small>}
      </div>
    </article>
  )
}

function CartScreen({
  cart,
  change,
  remove,
  clear,
  onOpen,
}: {
  cart: CartLine[]
  change: (id: string, amount: number) => void
  remove: (id: string) => void
  clear: () => void
  onOpen: (product: Product) => void
}) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleCheckout = () => {
    if (!cart.length) return
    const webApp = window.Telegram?.WebApp
    const payload = {
      type: 'order',
      items: cart.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      totalAmount: total.toFixed(2),
    }

    if (webApp && typeof webApp.sendData === 'function') {
      try {
        webApp.sendData(JSON.stringify(payload))
        return
      } catch (err) {
        console.error('sendData error:', err)
      }
    }

    if (webApp?.showAlert) {
      webApp.showAlert(`🎉 Buyurtmangiz qabul qilindi!\nJami: $${total.toFixed(2)}`, () => {
        clear()
        window.location.hash = '/home'
      })
    } else {
      alert(`🎉 Buyurtmangiz qabul qilindi!\nJami: $${total.toFixed(2)}`)
      clear()
      window.location.hash = '/home'
    }
  }

  return (
    <>
      <Header
        title="Savat"
        subtitle="Tanlangan mahsulotlar"
        actions={
          <GlassButton label="Savatni tozalash" className="header-icon danger-icon" onClick={clear}>
            <Trash2 size={18} />
          </GlassButton>
        }
      />
      <main>
        {cart.length ? (
          <>
            <section className="cart-list">
              {cart.map((item) => (
                <CartItem
                  item={item}
                  change={change}
                  remove={remove}
                  onOpen={onOpen}
                  key={item.id}
                />
              ))}
            </section>
            <section className="glass-card summary-card">
              <div><span>Mahsulotlar ({cart.length} ta)</span><b>${total.toFixed(2)}</b></div>
              <hr />
              <div className="summary-total"><strong>Jami to'lov</strong><strong>${total.toFixed(2)}</strong></div>
            </section>
            <button className="checkout-button" onClick={handleCheckout}>
              <CreditCard size={20} />
              <span>To'lovga o'tish</span>
              <ArrowRight size={19} />
            </button>
          </>
        ) : (
          <section className="glass-card empty-state">
            <div><ShoppingBag size={35} /></div>
            <h2>Savatingiz bo'sh</h2>
            <p>Yoqtirgan modellaringizni savatga qo'shing.</p>
            <button onClick={() => (window.location.hash = '/home')}>Modellarni ko'rish</button>
          </section>
        )}
      </main>
    </>
  )
}

function ProfileScreen({ user }: { user: TelegramUser }) {
  const activeUser = (user.first_name || user.username) ? user : DEFAULT_USER
  const fullName = [activeUser.first_name, activeUser.last_name].filter(Boolean).join(' ') || activeUser.first_name || 'Mardonbek'
  const usernameDisplay = activeUser.username ? `@${activeUser.username}` : (activeUser.id ? `ID: ${activeUser.id}` : '@mardonbek_oo8')
  const initial = (activeUser.first_name?.charAt(0) || activeUser.username?.charAt(0) || 'M').toUpperCase()
  const menu = [
    { label: "Yordam va qo'llab-quvvatlash", icon: Headphones },
  ]
  return (
    <>
      <Header
        title="Profil"
        subtitle="Mening hisobim"
      />
      <main>
        <section className="glass-card user-card">
          <div className="profile-wave" />
          <div className="avatar">
            {activeUser.photo_url ? <img src={activeUser.photo_url} alt="" /> : <span>{initial}</span>}
            <i><svg viewBox="0 0 24 24"><path d="m20.7 4.2-3 15.1c-.2 1.1-.9 1.4-1.8.9l-4.5-3.3-2.2 2.1c-.2.3-.4.5-.9.5l.3-4.6L17 7.3c.4-.3-.1-.5-.6-.2L6 13.6l-4.5-1.4c-1-.3-1-1 .2-1.4L19.4 4c.8-.3 1.5.2 1.3.2Z"/></svg></i>
          </div>
          <div className="user-copy">
            <h2>{fullName}</h2>
            <p>{usernameDisplay}</p>
            <span>✓ Telegram foydalanuvchisi</span>
          </div>
          <ChevronRight className="user-chevron" size={20} />
        </section>

        <section className="glass-card profile-menu">
          {menu.map(({ label, icon: Icon }) => (
            <button key={label}>
              <span className="menu-icon"><Icon size={19} /></span>
              <b>{label}</b>
              <ChevronRight size={18} />
            </button>
          ))}
        </section>
      </main>
    </>
  )
}

function BottomNav({ route, count }: { route: Route; count: number }) {
  const items: [Route, string, LucideIcon][] = [
    ['home', 'Bosh sahifa', Home],
    ['catalog', 'Katalog', Grid2X2],
    ['cart', 'Savat', ShoppingCart],
    ['profile', 'Profil', CircleUserRound],
  ]
  return (
    <nav className="bottom-nav">
      {items.map(([path, label, Icon]) => (
        <button
          className={route === path ? 'active' : ''}
          key={path}
          onClick={() => (window.location.hash = `/${path}`)}
        >
          <span><Icon size={20} />{path === 'cart' && count > 0 && <i>{count}</i>}</span>
          <b>{label}</b>
        </button>
      ))}
    </nav>
  )
}

export default function App() {
  const [navState, setNavState] = useState<NavigationState>(() =>
    parseNavigationHash(window.location.hash)
  )
  const [cart, setCart] = useState<CartLine[]>([])
  const [user, setUser] = useState<TelegramUser>(getTelegramUser)

  // Sync state on hashchange or popstate (browser back/forward, Android hardware back, swipe back)
  useEffect(() => {
    const handleNavigation = () => {
      setNavState(parseNavigationHash(window.location.hash))
    }
    window.addEventListener('hashchange', handleNavigation)
    window.addEventListener('popstate', handleNavigation)
    return () => {
      window.removeEventListener('hashchange', handleNavigation)
      window.removeEventListener('popstate', handleNavigation)
    }
  }, [])

  // Derive route, category, and product from navState
  const route = navState.route
  const selectedCategory = navState.category
  const selectedProduct = useMemo(() => {
    if (!navState.productId) return null
    return products.find((p) => p.id === navState.productId) || null
  }, [navState.productId])

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [navState.route, navState.category, navState.productId])

  useEffect(() => {
    fetch('/api/current-user')
      .then((res) => res.json())
      .then((data) => {
        if (data && (data.first_name || data.username)) {
          setUser((prev) => ({ ...prev, ...data }))
          try {
            localStorage.setItem('tg_user_cache', JSON.stringify(data))
          } catch (_) {}
        }
      })
      .catch(() => {})

    const webApp = window.Telegram?.WebApp
    if (webApp) {
      webApp.ready()
      webApp.expand()

      const resolved = getTelegramUser()
      if (resolved && (resolved.first_name || resolved.username || resolved.id)) {
        setUser(resolved)
      }

      try {
        if (typeof webApp.requestFullscreen === 'function') {
          webApp.requestFullscreen()
        }
      } catch (err) {
        console.warn('requestFullscreen error:', err)
      }

      try {
        if (typeof webApp.disableVerticalSwipes === 'function') {
          webApp.disableVerticalSwipes()
        }
      } catch (err) {
        console.warn('disableVerticalSwipes error:', err)
      }

      try {
        webApp.setHeaderColor?.('#0b0620')
        webApp.setBackgroundColor?.('#0b0620')
      } catch (_) {}
    }

    const onUserTouch = () => {
      const wa = window.Telegram?.WebApp
      if (wa) {
        try {
          wa.expand()
          if (typeof wa.requestFullscreen === 'function' && !wa.isFullscreen) {
            wa.requestFullscreen()
          }
        } catch (_) {}
      }
    }

    window.addEventListener('touchstart', onUserTouch, { once: true, passive: true })
    window.addEventListener('click', onUserTouch, { once: true, passive: true })

    return () => {
      window.removeEventListener('touchstart', onUserTouch)
      window.removeEventListener('click', onUserTouch)
    }
  }, [])

  // Telegram BackButton ko'rinishi
  useEffect(() => {
    const webApp = window.Telegram?.WebApp
    if (!webApp?.BackButton) return

    const isAtRoot = navState.route === 'home' && !navState.productId && !navState.category
    if (!isAtRoot) {
      webApp.BackButton.show()
    } else {
      webApp.BackButton.hide()
    }
  }, [navState])

  // Telegram BackButton bosilganda bosqichma-bosqich ortga qaytish
  useEffect(() => {
    const webApp = window.Telegram?.WebApp
    if (!webApp?.BackButton) return

    const onTelegramBack = () => {
      const current = parseNavigationHash(window.location.hash)
      if (current.route === 'home' && !current.productId && !current.category) {
        return
      }

      const oldHash = window.location.hash
      if (window.history.length > 1) {
        window.history.back()
        setTimeout(() => {
          if (window.location.hash === oldHash) {
            doProgrammaticStepBack(current)
          }
        }, 150)
      } else {
        doProgrammaticStepBack(current)
      }
    }

    webApp.BackButton.onClick(onTelegramBack)
    return () => {
      webApp.BackButton?.offClick(onTelegramBack)
    }
  }, [])

  const count = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart])

  const add = (product: Product) => setCart((current) => {
    const existing = current.find((item) => item.id === product.id)
    return existing
      ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...current, { ...product, quantity: 1 }]
  })

  const change = (id: string, amount: number) => setCart((current) =>
    current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item),
  )

  const handleOpenProduct = (product: Product) => {
    if (navState.route === 'catalog') {
      if (navState.category) {
        window.location.hash = `/catalog/${encodeURIComponent(navState.category)}/product/${encodeURIComponent(product.id)}`
      } else {
        window.location.hash = `/catalog/product/${encodeURIComponent(product.id)}`
      }
    } else if (navState.route === 'cart') {
      window.location.hash = `/cart/product/${encodeURIComponent(product.id)}`
    } else {
      window.location.hash = `/product/${encodeURIComponent(product.id)}`
    }
  }

  const handleSelectCategory = (cat: string | null) => {
    window.location.hash = cat ? `/catalog/${encodeURIComponent(cat)}` : '/catalog'
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <Shared3DCanvas isDetailOpen={Boolean(selectedProduct)} />
      <div className="content">
        {selectedProduct ? (
          <ProductDetailScreen
            product={selectedProduct}
            add={add}
          />
        ) : (
          <>
            {route === 'home' && <HomeScreen add={add} onOpen={handleOpenProduct} />}
            {route === 'catalog' && (
              <CatalogScreen
                onOpen={handleOpenProduct}
                add={add}
                selectedCategory={selectedCategory}
                setSelectedCategory={handleSelectCategory}
              />
            )}
            {route === 'cart' && (
              <CartScreen
                cart={cart}
                change={change}
                remove={(id) => setCart((current) => current.filter((item) => item.id !== id))}
                clear={() => setCart([])}
                onOpen={handleOpenProduct}
              />
            )}
            {route === 'profile' && <ProfileScreen user={user} />}
            <BottomNav route={route} count={count} />
          </>
        )}
      </div>
    </div>
  )
}
