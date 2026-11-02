import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Logo } from '../components/Logo'
import { Avatar, Badge, Icon, Rating } from '../components/ui'
import { Portrait } from '../components/Art'
import { SalonCard } from '../components/cards'
import { CAT, SV } from '../lib/catalog'
import { BLANK, useSearch } from '../lib/search'
import { fa, hh, relDay } from '../lib/util'
import { Finder } from './Book'

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'صبح بخیر' : h < 17 ? 'روز بخیر' : 'عصر بخیر' }

// گزینه‌های «برترین‌ها» زیر کارت جستجو
const TOPS = [
  { id: 'salons', name: 'سالن‌ها', icon: 'star' },
  { id: 'artists', name: 'آرتیست‌ها', icon: 'crown' },
  { id: 'free', name: 'آزاد امروز', icon: 'bolt' },
  { id: 'offer', name: 'تخفیف‌دار', icon: 'tag' },
  { id: 'spa', name: 'اسپا و ماساژ', icon: 'leaf' },
  { id: 'bridal', name: 'عروس', icon: 'heart' },
]

// صفحه‌ی وسط (جستجو): کارت جستجو + برترین‌ها
export default function Home() {
  const { db, me } = useStore()
  const nav = useNav()
  const [top, setTop] = useState('salons')
  const free = useSearch({ ...BLANK, freeOnly: true, sort: 'soon' }).list
  const all = useSearch({ ...BLANK, sort: 'rating' }).list
  const next = db.bookings.filter((b) => b.user === 'me' && b.status === 'confirmed').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0]
  const score = (s) => s.rating * Math.log(s.reviewsN)

  const pick = useMemo(() => {
    const best = (l) => [...l].sort((a, b) => score(b) - score(a)).slice(0, 5)
    if (top === 'artists') return { artists: db.artists.filter((a) => a.city === me.city).sort((a, b) => (b.badge === 'star') - (a.badge === 'star') || b.rating - a.rating || b.followers - a.followers).slice(0, 5) }
    if (top === 'free') return { salons: free.slice(0, 5), q: { freeOnly: true, sort: 'soon' } }
    if (top === 'offer') return { salons: best(all.filter((s) => s.offer)), q: { sort: 'rating' } }
    if (top === 'spa') return { salons: best(all.filter((s) => s.kind === 'spa')), q: { kind: 'spa' } }
    if (top === 'bridal') return { salons: best(all.filter((s) => s.cats.includes('bridal'))), q: { cat: 'bridal' } }
    return { salons: best(all), q: { sort: 'rating' } }
  }, [top, all, free, db.artists, me.city])
  const T = TOPS.find((x) => x.id === top)

  return (
    <div className="scroll home">
      <header className="top">
        <Logo size={17} />
        <div className="top-r">
          <small className="muted">{greet()}، {me.name.split(' ')[0]}</small>
          <button onClick={() => nav.go('me')} aria-label="پروفایل من" className="me-btn">
            <Avatar u={me} size={38} />
            {me.notes.some((n) => !n.read) && <i className="ping" />}
          </button>
        </div>
      </header>

      <Finder />

      {next && (() => { const s = db.salons.find((x) => x.id === next.salon); return (
        <motion.button className="next-card" whileTap={{ scale: 0.98 }} onClick={() => nav.go('visits')}>
          <div className="nc-date"><b>{relDay(next.date)}</b><span>{hh(next.start)}</span></div>
          <div className="nc-body"><small>نوبت بعدی شما</small><b>{SV[next.svc[0]].name}</b><span className="muted">{s ? s.name : 'در منزل'}</span></div>
          <Icon n="fwd" s={18} />
        </motion.button>
      ) })()}

      <div className="sec-title"><div><em className="en">The Best</em><h2>برترین‌ها</h2></div>
        <button onClick={() => (top === 'artists' ? nav.go('artists') : nav.push({ type: 'results', q: { ...BLANK, ...pick.q }, title: `برترین‌ها · ${T.name}` }))}>همه</button>
      </div>
      <div className="top-chips">
        {TOPS.map((t) => (
          <button key={t.id} className={top === t.id ? 'on' : ''} onClick={() => setTop(t.id)}>
            {top === t.id && <motion.span layoutId="top-on" className="tc-on" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
            <Icon n={t.icon} s={15} /><span>{t.name}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={top} className="pad-x tops" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          {pick.artists ? pick.artists.map((a, i) => {
            const s = db.salons.find((x) => x.id === a.salon)
            return (
              <button key={a.id} className="top-artist" onClick={() => nav.push({ type: 'artist', id: a.id })}>
                <span className="rank">{fa(i + 1)}</span>
                <Portrait a={a} size={52} ring={false} />
                <div><b>{a.name} <Badge a={a} /></b><small className="muted">{a.cats.slice(0, 2).map((c) => CAT[c].name).join(' · ')} · {s ? s.name : 'در منزل'}</small></div>
                <Rating v={a.rating} />
              </button>
            )
          }) : pick.salons.length ? pick.salons.map((s) => <SalonCard key={s.id} s={s} />) : <p className="muted center pad">فعلاً موردی نیست.</p>}
        </motion.div>
      </AnimatePresence>
      <div className="foot-space" />
    </div>
  )
}
