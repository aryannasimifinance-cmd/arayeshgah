import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Logo } from '../components/Logo'
import { Avatar, Badge, Icon, Rating } from '../components/ui'
import { Portrait } from '../components/Art'
import { SalonCard } from '../components/cards'
import { CAT } from '../lib/catalog'
import { BLANK, useSearch } from '../lib/search'
import { fa } from '../lib/util'
import { Finder } from './Book'
import MapTab from './MapTab'


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
  const [mode, setMode] = useState('find') // find · map
  const free = useSearch({ ...BLANK, freeOnly: true, sort: 'soon' }).list
  const all = useSearch({ ...BLANK, sort: 'rating' }).list
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

  const head = (
    <header className="search-head">
      <Logo size={15} en={false} />
      <div className="mode-seg">
        {[['find', 'جستجو', 'search'], ['map', 'نقشه', 'map']].map(([k, n, ic]) => (
          <button key={k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>
            {mode === k && <motion.span layoutId="mode-on" className="mode-ind" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
            <Icon n={ic} s={15} /><span>{n}</span>
          </button>
        ))}
      </div>
      <button onClick={() => nav.go('me')} aria-label="پروفایل من" className="me-btn"><Avatar u={me} size={34} />{me.notes.some((n) => !n.read) && <i className="ping" />}</button>
    </header>
  )
  if (mode === 'map') return <div className="search-page">{head}<div className="map-embed"><MapTab /></div></div>
  return (
    <div className="scroll home">
      {head}
      <Finder onMap={() => setMode('map')} />

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
