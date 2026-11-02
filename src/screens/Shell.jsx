import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { Icon } from '../components/ui'
import { haptic } from '../lib/util'
import { startTab } from '../App'
import Discover from './Discover'
import Feed from './Feed'
import Artists from './Artists'
import { CategoryPage } from './Services'
import Shop, { ShopPage, Cart } from './Shop'
import Visits from './Visits'
import Me from './Me'
import Salon from './Salon'
import Artist from './Artist'
import Results from './Results'
import Wizard from './Wizard'

// ترتیب تب‌ها از راست؛ جستجو در وسط. «من» از عکس پروفایل بالای صفحه باز می‌شود
const TABS = [
  { id: 'home', name: 'خانه', icon: 'home' },
  { id: 'shop', name: 'فروشگاه', icon: 'bag' },
  { id: 'search', name: 'جستجو', icon: 'search', center: true },
  { id: 'artists', name: 'آرتیست‌ها', icon: 'sparkle' },
  { id: 'visits', name: 'نوبت‌ها', icon: 'cal' },
]

const Nav = createContext(null)
export const useNav = () => useContext(Nav)

export default function Shell() {
  const { db, me } = useStore()
  // لینک دمو می‌تواند مستقیم صفحه‌ای را باز کند: ‎#demo=salon.s3 یا ‎#demo=wizard.s3
  const [dt, did] = startTab.split('.')
  const [tab, setTab] = useState(did ? 'search' : startTab === 'map' ? 'search' : startTab)
  const [stack, setStack] = useState(did && dt !== 'wizard' ? [{ type: dt, id: did, k: 1 }] : [])
  const [wiz, setWiz] = useState(dt === 'wizard' ? { salon: did, svc: [] } : null)

  const push = useCallback((p) => setStack((s) => [...s, { ...p, k: Math.random() }]), [])
  const pop = useCallback(() => setStack((s) => s.slice(0, -1)), [])
  // ویزارد رزرو: { salon, svc[], artist, date, start }
  const book = useCallback((o) => { haptic(); setWiz(o) }, [])
  const go = useCallback((t) => { setStack([]); if (t === 'me') setStack([{ type: 'me', k: Math.random() }]); else setTab(t) }, [])

  const upcoming = db.bookings.filter((b) => b.user === 'me' && b.status === 'confirmed').length
  const toReview = db.bookings.filter((b) => b.user === 'me' && b.status === 'done' && !b.reviewed).length
  const badge = { visits: upcoming + toReview, shop: (me.cart || []).reduce((a, i) => a + i.qty, 0) }
  const top = stack[stack.length - 1]

  return (
    <Nav.Provider value={{ push, pop, book, go, tab }}>
      <div className="shell">
        <div className="tab-pages">
          {tab === 'home' && <Feed />}
          {tab === 'search' && <Discover />}
          {tab === 'shop' && <Shop />}
          {tab === 'artists' && <Artists />}
          {tab === 'visits' && <Visits />}
        </div>
        <AnimatePresence>
          {stack.map((p, i) => (
            <motion.div key={p.k} className="page-over" style={{ zIndex: 30 + i }} initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 34, stiffness: 330 }}>
              {p.type === 'salon' && <Salon id={p.id} />}
              {p.type === 'artist' && <Artist id={p.id} />}
              {p.type === 'results' && <Results init={p.q} title={p.title} who={p.who} />}
              {p.type === 'me' && <Me asPage />}
              {p.type === 'cat' && <CategoryPage id={p.id} />}
              {p.type === 'shop' && <ShopPage id={p.id} />}
              {p.type === 'cart' && <Cart />}
            </motion.div>
          ))}
        </AnimatePresence>
        {/* تب فعال یک قرص رنگی دارد که بین تب‌ها می‌لغزد تا معلوم باشد کجا هستیم */}
        <nav className="tabbar">
          {TABS.map((t) => {
            const on = tab === t.id
            return (
              <button key={t.id} className={`${on ? 'on' : ''} ${t.center ? 'center' : ''}`} onClick={() => { haptic(); go(t.id) }} aria-current={on ? 'page' : undefined}>
                {on && !t.center && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                <span className="tab-ico">
                  <Icon n={t.icon} s={t.center ? 25 : 21} w={on || t.center ? 2.1 : 1.6} />
                  {badge[t.id] > 0 && <i className="dot">{badge[t.id].toLocaleString('fa-IR')}</i>}
                </span>
                <span className="tab-name">{t.name}</span>
                {on && t.center && <motion.i layoutId="tab-dot" className="center-dot" />}
              </button>
            )
          })}
        </nav>
        <Wizard opts={wiz} onClose={() => setWiz(null)} />
      </div>
    </Nav.Provider>
  )
}

// سربرگ صفحه‌های رو‌یی با دکمه‌ی بازگشت
export function PageHead({ title, sub, right, transparent }) {
  const nav = useNav()
  return (
    <header className={`page-head ${transparent ? 'tr' : ''}`}>
      <button className="icon-btn" onClick={nav.pop} aria-label="بازگشت"><Icon n="back" s={22} /></button>
      <div className="ph-title"><b>{title}</b>{sub && <small>{sub}</small>}</div>
      <div className="ph-right">{right}</div>
    </header>
  )
}
