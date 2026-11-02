import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Icon } from '../components/ui'
import { Portrait } from '../components/Art'
import { SalonCard } from '../components/cards'
import { DistrictMap } from '../components/Maps'
import { CATS, CAT } from '../lib/catalog'
import { CITIES, CITY_IDS } from '../lib/geo'
import { BLANK, isOpen, useAreaStats, useSearch } from '../lib/search'
import { fa } from '../lib/util'
import { FilterSheet } from './Results'

// نقشه‌ی کامل با نواحی، جستجوی زنده و فیلتر
export default function MapTab() {
  const { me, updateMe } = useStore()
  const nav = useNav()
  const [q, setQ] = useState({ ...BLANK, sort: 'rating' })
  const set = (p) => setQ((x) => ({ ...x, ...p }))
  const [focus, setFocus] = useState(false)
  const [openNow, setOpenNow] = useState(false)
  const [filt, setFilt] = useState(false)
  const [active, setActive] = useState(null)
  const rail = useRef(null)
  const res = useSearch(q)
  const base = useSearch({ ...q, areas: [] })
  const pins = base.list.filter((s) => !openNow || isOpen(s))
  const list = res.list.filter((s) => !openNow || isOpen(s))
  const stats = useAreaStats(pins)
  const C = CITIES[me.city]
  const sel = q.areas.length ? list : active ? pins.filter((s) => s.id === active) : []
  const showRail = sel.length > 0 && !focus

  useEffect(() => {
    if (!active || !rail.current) return
    rail.current.querySelector(`[data-id="${active}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [active])

  const toggleArea = (id) => { setActive(null); set({ areas: q.areas.includes(id) ? q.areas.filter((x) => x !== id) : [...q.areas, id] }) }
  const typing = focus && q.text

  return (
    <div className="maptab">
      <DistrictMap city={me.city} salons={pins} stats={stats} selected={q.areas} active={active} onArea={toggleArea} onSalon={(id) => { setActive(id); setFocus(false) }} />

      <div className="map-top">
        <div className={`map-search ${focus ? 'focus' : ''}`}>
          <Icon n="search" s={18} />
          <input value={q.text} onFocus={() => setFocus(true)} onChange={(e) => set({ text: e.target.value })} placeholder="سالن، آرتیست، خدمت یا محله" />
          {(q.text || focus) && <button onClick={() => { set({ text: '' }); setFocus(false) }} aria-label="پاک کردن"><Icon n="close" s={16} /></button>}
          <span className="ms-sep" />
          <button className="ms-city" onClick={() => { const c = CITY_IDS[(CITY_IDS.indexOf(me.city) + 1) % CITY_IDS.length]; updateMe({ city: c, area: null }); set({ areas: [] }); setActive(null) }}>{C.name} <Icon n="back" s={12} style={{ transform: 'rotate(90deg)' }} /></button>
        </div>
        {!typing && (
          <div className="map-chips">
            <button className={`chip glass ${filt ? 'on' : ''}`} onClick={() => setFilt(true)}><Icon n="filter" s={14} /></button>
            <button className={`chip glass ${openNow ? 'on' : ''}`} onClick={() => setOpenNow(!openNow)}><span className="live" /> باز است</button>
            <button className={`chip glass ${q.minRating ? 'on' : ''}`} onClick={() => set({ minRating: q.minRating ? 0 : 4.6 })}>★ ۴٫۶+</button>
            {CATS.map((c) => <button key={c.id} className={`chip glass ${q.cat === c.id ? 'on' : ''}`} onClick={() => set({ cat: q.cat === c.id ? '' : c.id })}>{c.name}</button>)}
          </div>
        )}
      </div>

      {/* پیشنهادهای جستجو */}
      <AnimatePresence>
        {typing && (
          <motion.div className="suggest" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {res.areas.map((a) => <button key={a.id} onClick={() => { toggleArea(a.id); set({ text: '' }); setFocus(false) }}><span className="sg-ico"><Icon n="pin" s={16} /></span><b>{a.name}</b><small>{a.hoods.join('، ')}</small></button>)}
            {res.services.map((s) => <button key={s.id} onClick={() => { set({ text: '', cat: s.cat, sid: s.id }); setFocus(false) }}><span className="sg-ico"><Icon n="sparkle" s={16} /></span><b>{s.name}</b><small>{CAT[s.cat].name}</small></button>)}
            {res.artists.slice(0, 4).map((a) => <button key={a.id} onClick={() => nav.push({ type: 'artist', id: a.id })}><Portrait a={a} size={32} ring={false} /><b>{a.name}</b><small dir="ltr">@{a.handle}</small></button>)}
            {list.slice(0, 5).map((s) => <button key={s.id} onClick={() => { setActive(s.id); setFocus(false) }}><span className="sg-ico"><Icon n="home" s={16} /></span><b>{s.name}</b><small>{s.hood} · ★ {fa(s.rating.toFixed(1))}</small></button>)}
            {!res.areas.length && !res.services.length && !res.artists.length && !list.length && <p className="muted center pad">نتیجه‌ای نبود</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {!showRail && !typing && (
        <div className="map-hint">
          <Icon n="map" s={16} /> <span>یک ناحیه رو لمس کنید · <b>{fa(pins.length)}</b> سالن در {C.name}</span>
        </div>
      )}
      <AnimatePresence>
        {showRail && (
          <motion.div className="map-rail" initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 220 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
            <div className="mr-head">
              <b>{q.areas.length ? q.areas.map((id) => C.areas.find((a) => a.id === id)?.name).join('، ') : 'سالن انتخابی'}</b>
              <small className="muted">{fa(sel.length)} سالن</small>
              <button className="chip" onClick={() => { set({ areas: [] }); setActive(null) }}>پاک کردن</button>
            </div>
            <div className="mr-cards" ref={rail}>
              {sel.map((s) => <div key={s.id} data-id={s.id} className={`mr-item ${active === s.id ? 'on' : ''}`}><SalonCard s={s} compact /></div>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <FilterSheet open={filt} onClose={() => setFilt(false)} q={q} set={set} count={list.length} />
    </div>
  )
}
