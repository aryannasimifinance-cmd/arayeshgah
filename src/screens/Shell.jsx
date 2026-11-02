import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { Icon } from '../components/ui'
import { haptic } from '../lib/util'
import { startTab } from '../App'
import Discover from './Discover'
import MapTab from './MapTab'
import Artists from './Artists'
import Visits from './Visits'
import Me from './Me'
import Salon from './Salon'
import Artist from './Artist'
import Results from './Results'
import Wizard from './Wizard'

// ترتیب تب‌ها از راست؛ رزرو در وسط
const TABS = [
  { id: 'home', name: 'خانه', icon: 'home' },
  { id: 'artists', name: 'آرتیست‌ها', icon: 'sparkle' },
  { id: 'map', name: 'نقشه', icon: 'map', center: true },
  { id: 'visits', name: 'نوبت‌ها', icon: 'cal' },
  { id: 'me', name: 'من', icon: 'user' },
]

const Nav = createContext(null)
export const useNav = () => useContext(Nav)

export default function Shell() {
  const { db, me } = useStore()
  // لینک دمو می‌تواند مستقیم صفحه‌ای را باز کند: ‎#demo=salon.s3 یا ‎#demo=wizard.s3
  const [dt, did] = startTab.split('.')
  const [tab, setTab] = useState(did ? 'home' : startTab)
  const [stack, setStack] = useState(did && dt !== 'wizard' ? [{ type: dt, id: did, k: 1 }] : [])
  const [wiz, setWiz] = useState(dt === 'wizard' ? { salon: did, svc: [] } : null)

  const push = useCallback((p) => setStack((s) => [...s, { ...p, k: Math.random() }]), [])
  const pop = useCallback(() => setStack((s) => s.slice(0, -1)), [])
  // ویزارد رزرو: { salon, svc[], artist, date, start }
  const book = useCallback((o) => { haptic(); setWiz(o) }, [])
  const go = useCallback((t) => { setStack([]); setTab(t) }, [])

  const upcoming = db.bookings.filter((b) => b.user === 'me' && b.status === 'confirmed').length
  const toReview = db.bookings.filter((b) => b.user === 'me' && b.status === 'done' && !b.reviewed).length
  const badge = { visits: upcoming + toReview, me: me.notes.filter((n) => !n.read).length }
  const top = stack[stack.length - 1]

  return (
    <Nav.Provider value={{ push, pop, book, go, tab }}>
      <div className="shell">
        <div className="tab-pages">
          {tab === 'home' && <Discover />}
          {tab === 'artists' && <Artists />}
          {tab === 'map' && <MapTab />}
          {tab === 'visits' && <Visits />}
          {tab === 'me' && <Me />}
        </div>
        <AnimatePresence>
          {stack.map((p, i) => (
            <motion.div key={p.k} className="page-over" style={{ zIndex: 30 + i }} initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 34, stiffness: 330 }}>
              {p.type === 'salon' && <Salon id={p.id} />}
              {p.type === 'artist' && <Artist id={p.id} />}
              {p.type === 'results' && <Results init={p.q} title={p.title} />}
            </motion.div>
          ))}
        </AnimatePresence>
        <nav className="tabbar">
          {TABS.map((t) => (
            <button key={t.id} className={`${tab === t.id && !top ? 'on' : ''} ${t.center ? 'center' : ''}`} onClick={() => { haptic(); go(t.id) }}>
              <span className="tab-ico">
                <Icon n={t.icon} s={t.center ? 24 : 22} w={tab === t.id || t.center ? 2 : 1.6} />
                {badge[t.id] > 0 && <i className="dot">{badge[t.id].toLocaleString('fa-IR')}</i>}
              </span>
              <span>{t.name}</span>
            </button>
          ))}
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
