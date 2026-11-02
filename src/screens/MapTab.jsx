import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Icon, Rating } from '../components/ui'
import { Glyph, Portrait } from '../components/Art'
import { SalonCard } from '../components/cards'
import { CityMap } from '../components/Maps'
import { CATS, CAT } from '../lib/catalog'
import { CITIES, CITY_IDS, areaOf } from '../lib/geo'
import { img } from '../lib/photos'
import { BLANK, isOpen, useAreaStats, useSearch } from '../lib/search'
import { fa, haptic, hh, km, short } from '../lib/util'
import { FilterSheet } from './Results'

const PEEK = 148 // ارتفاع دیده‌شده در حالت جمع (با نوار تب)
const MID = 352

// کارت افقی جمع‌وجور برای ریل پایین نقشه
function MiniCard({ s, on, onPick, svc }) {
  const nav = useNav()
  const area = areaOf(s.city, s.area)
  return (
    <motion.div className={`mcard ${on ? 'on' : ''}`} data-id={s.id} whileTap={{ scale: 0.98 }} onClick={() => (on ? nav.push({ type: 'salon', id: s.id }) : onPick(s.id))}>
      <div className="mc-ph"><img src={img(s.photos[0])} alt="" loading="lazy" />{s.offer && <span>٪{fa(s.offer.pct)}</span>}</div>
      <div className="mc-body">
        <b>{s.name}</b>
        <small className="muted">{s.hood} · {area.name}</small>
        <span className="mc-row"><Rating v={s.rating} n={s.reviewsN} />{s.price != null && <em>از {short(s.price)}</em>}</span>
        <span className="mc-slots">
          {s.slots.length ? s.slots.slice(0, 3).map((h) => (
            <button key={h} onClick={(e) => { e.stopPropagation(); haptic(); nav.book({ salon: s.id, svc: svc ? [svc] : [], start: h }) }}>{hh(h)}</button>
          )) : <i className="muted">امروز پر است</i>}
        </span>
      </div>
    </motion.div>
  )
}

export default function MapTab() {
  const { me, updateMe, toast } = useStore()
  const nav = useNav()
  const C = CITIES[me.city]
  const [q, setQ] = useState({ ...BLANK, sort: 'rating' })
  const set = (p) => setQ((x) => ({ ...x, ...p }))
  const [focus, setFocus] = useState(false)
  const [openNow, setOpenNow] = useState(false)
  const [filt, setFilt] = useState(false)
  const [active, setActive] = useState(null)
  const [view, setView] = useState(null)
  const mapRef = useRef(null)
  const box = useRef(null)
  const rail = useRef(null)

  const res = useSearch(q)
  const base = useSearch({ ...q, areas: [] })
  const all = useMemo(() => base.list.filter((s) => !openNow || isOpen(s)), [base.list, openNow])
  const stats = useAreaStats(all)
  const free = useMemo(() => new Set(all.filter((s) => s.slots.length).map((s) => s.id)), [all])
  // فهرست پایین: ناحیه‌ی انتخابی، وگرنه هر چه در قاب نقشه است
  const list = useMemo(() => {
    const l = q.areas.length ? all.filter((s) => q.areas.includes(s.area)) : view ? all.filter((s) => view.includes(s.id)) : all
    return [...l].sort((a, b) => (b.slots.length > 0) - (a.slots.length > 0) || b.rating - a.rating)
  }, [all, q.areas.join(), view])

  // برگه‌ی کشیدنی با سه حالت
  const [H, setH] = useState(700)
  useEffect(() => { const ro = new ResizeObserver(([e]) => setH(e.contentRect.height)); ro.observe(box.current); return () => ro.disconnect() }, [])
  const snaps = { full: 70, mid: H - MID, peek: H - PEEK }
  const [snap, setSnap] = useState('peek')
  const y = useMotionValue(H - PEEK)
  useEffect(() => { animate(y, snaps[snap], { type: 'spring', stiffness: 380, damping: 38 }) }, [snap, H])
  const endDrag = (_, info) => {
    const at = y.get() + info.velocity.y * 0.18
    const best = Object.entries(snaps).sort((a, b) => Math.abs(a[1] - at) - Math.abs(b[1] - at))[0][0]
    setSnap(best); animate(y, snaps[best], { type: 'spring', stiffness: 380, damping: 38 })
  }

  const pickArea = (id) => {
    setActive(null)
    const next = q.areas.includes(id) ? q.areas.filter((x) => x !== id) : [id]
    set({ areas: next })
    setSnap(next.length ? 'mid' : 'peek')
  }
  const pickSalon = (id, from) => {
    setActive(id)
    if (id && snap === 'peek') setSnap('mid')
    if (id && from !== 'rail') requestAnimationFrame(() => rail.current?.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }))
  }
  // اسکرول ریل ← پین فعال
  // فقط اسکرول خود کاربر پین را عوض می‌کند، نه اسکرولی که با عوض شدن فهرست پیش می‌آید
  const railT = useRef(0)
  const byUser = useRef(false)
  const onRail = () => {
    if (!byUser.current) return
    clearTimeout(railT.current)
    railT.current = setTimeout(() => {
      const r = rail.current; if (!r) return
      const mid = r.getBoundingClientRect().left + r.clientWidth / 2
      let best = null, d = 1e9
      r.querySelectorAll('[data-id]').forEach((el) => { const b = el.getBoundingClientRect(); const x = Math.abs(b.left + b.width / 2 - mid); if (x < d) { d = x; best = el.dataset.id } })
      byUser.current = false
      if (best && best !== active) setActive(best)
    }, 160)
  }
  const switchCity = (c) => { if (c === me.city) return; haptic(); updateMe({ city: c, area: null }); set({ areas: [], text: '' }); setActive(null); setView(null); setSnap('peek') }
  const locate = () => {
    if (!navigator.geolocation) return toast({ icon: '📍', text: 'موقعیت در دسترس نیست' })
    navigator.geolocation.getCurrentPosition((p) => {
      const at = [p.coords.latitude, p.coords.longitude]
      const c = CITY_IDS.map((x) => ({ x, d: km(at, CITIES[x].center) })).sort((a, b) => a.d - b.d)[0]
      if (c.d > 60) return toast({ icon: '📍', text: 'فعلاً فقط تهران و کرج فعالیم' })
      switchCity(c.x); setTimeout(() => mapRef.current?.flyTo(at, 14.5), 300)
    }, () => toast({ icon: '📍', text: 'اجازه‌ی موقعیت داده نشد' }), { timeout: 6000 })
  }
  const typing = focus && q.text
  const one = q.areas.length === 1 ? areaOf(me.city, q.areas[0]) : null

  return (
    <div className="maptab" ref={box}>
      <CityMap ref={mapRef} city={me.city} salons={all} stats={stats} selected={q.areas} active={active} free={free}
        onArea={pickArea} onSalon={(id) => pickSalon(id)} onView={setView} pad={{ top: 150, bottom: snap === 'peek' ? PEEK + 20 : MID + 20 }} />

      {/* بالا: جستجو، شهر و فیلترها */}
      <div className="map-top">
        <div className={`map-search ${focus ? 'focus' : ''}`}>
          <Icon n="search" s={18} />
          <input value={q.text} onFocus={() => setFocus(true)} onChange={(e) => set({ text: e.target.value })} placeholder="سالن، آرتیست، خدمت یا محله" />
          {(q.text || focus) && <button className="ms-x" onClick={() => { set({ text: '' }); setFocus(false) }} aria-label="بستن"><Icon n="close" s={16} /></button>}
          <div className="ms-city">
            {CITY_IDS.map((c) => (
              <button key={c} className={me.city === c ? 'on' : ''} onClick={() => switchCity(c)}>
                {me.city === c && <motion.span layoutId="mcity" className="ms-ind" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
                <span>{CITIES[c].name}</span>
              </button>
            ))}
          </div>
        </div>
        <AnimatePresence>
          {!typing && (
            <motion.div className="map-chips" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <button className={`chip glass ${q.minRating || q.amen.length || q.tiers.length || q.kind ? 'on' : ''}`} onClick={() => setFilt(true)} aria-label="فیلتر"><Icon n="filter" s={14} /></button>
              <button className={`chip glass ${q.freeOnly ? 'on' : ''}`} onClick={() => set({ freeOnly: !q.freeOnly })}><span className="live" /> آزاد امروز</button>
              <button className={`chip glass ${openNow ? 'on' : ''}`} onClick={() => setOpenNow(!openNow)}>الان باز</button>
              {CATS.map((c) => <button key={c.id} className={`chip glass ${q.cat === c.id ? 'on' : ''}`} onClick={() => set({ cat: q.cat === c.id ? '' : c.id, sid: '' })}><Glyph cat={c.id} s={14} w={1.6} /> {c.name}</button>)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* کنترل‌ها */}
      <div className="map-ctrl" style={{ bottom: snap === 'peek' ? PEEK + 14 : MID + 14 }}>
        <button onClick={locate} aria-label="موقعیت من"><Icon n="locate" s={19} /></button>
        <button onClick={() => { set({ areas: [] }); setActive(null); setSnap('peek'); mapRef.current?.recenter() }} aria-label="کل شهر"><Icon n="map" s={18} /></button>
      </div>

      {/* پیشنهادهای جستجو */}
      <AnimatePresence>
        {typing && (
          <motion.div className="suggest" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {res.areas.map((a) => <button key={a.id} onClick={() => { set({ text: '' }); setFocus(false); pickArea(a.id) }}><span className="sg-ico"><Icon n="pin" s={16} /></span><b>{a.name}</b><small>{a.hoods.join('، ')}</small></button>)}
            {res.services.map((s) => <button key={s.id} onClick={() => { set({ text: '', cat: s.cat, sid: s.id }); setFocus(false) }}><span className="sg-ico"><Glyph cat={s.cat} s={16} /></span><b>{s.name}</b><small>{CAT[s.cat].name}</small></button>)}
            {res.artists.slice(0, 4).map((a) => <button key={a.id} onClick={() => nav.push({ type: 'artist', id: a.id })}><Portrait a={a} size={34} ring={false} /><b>{a.name}</b><small dir="ltr">@{a.handle}</small></button>)}
            {res.list.slice(0, 5).map((s) => <button key={s.id} onClick={() => { set({ text: '' }); setFocus(false); pickSalon(s.id) }}><span className="sg-ph"><img src={img(s.photos[0])} alt="" /></span><b>{s.name}</b><small>{s.hood} · ★ {fa(s.rating.toFixed(1))}</small></button>)}
            {!res.areas.length && !res.services.length && !res.artists.length && !res.list.length && <p className="muted center pad">نتیجه‌ای نبود</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* برگه‌ی پایین */}
      <motion.div className={`map-sheet s-${snap}`} style={{ y, height: H - 70 }}>
        {/* فقط سربرگ کشیده می‌شود تا اسکرول فهرست و ریل آزاد بماند */}
        <motion.div className="ms-grab" onPanEnd={endDrag} onPan={(_, i) => y.set(Math.min(snaps.peek + 30, Math.max(snaps.full - 20, y.get() + i.delta.y)))}>
          <span className="grip" />
          <div className="ms-head" onClick={() => setSnap(snap === 'peek' ? 'mid' : snap === 'mid' ? 'full' : 'mid')}>
            {one ? (
              <div><b>{one.name}</b><small className="muted">{one.hoods.join('، ')}</small></div>
            ) : (
              <div><b>{q.areas.length ? `${fa(q.areas.length)} ناحیه` : view ? 'در این محدوده' : `همه‌ی ${C.name}`}</b><small className="muted">برای دیدن فهرست بکشید بالا</small></div>
            )}
            <span className="ms-count"><b>{fa(list.length)}</b> سالن · <em>{fa(list.filter((s) => s.slots.length).length)} آزاد امروز</em></span>
            {q.areas.length > 0 && <button className="chip sm" onClick={(e) => { e.stopPropagation(); set({ areas: [] }); setActive(null); setSnap('peek') }}>همه‌ی شهر</button>}
          </div>
        </motion.div>
        {snap !== 'full' ? (
          <div className="mr-cards" ref={rail} key={q.areas.join() + me.city} onScroll={onRail} onPointerDown={() => { byUser.current = true }} onWheel={() => { byUser.current = true }} onTouchStart={() => { byUser.current = true }}>
            {list.slice(0, 30).map((s) => <MiniCard key={s.id} s={s} svc={q.sid} on={active === s.id} onPick={(id) => pickSalon(id, 'rail')} />)}
            {!list.length && <p className="muted pad">در این محدوده سالنی نیست؛ نقشه را جابه‌جا کنید.</p>}
          </div>
        ) : (
          <div className="ms-list scroll">
            {list.map((s) => <SalonCard key={s.id} s={s} />)}
            <div className="foot-space" />
          </div>
        )}
      </motion.div>
      <FilterSheet open={filt} onClose={() => setFilt(false)} q={q} set={set} count={all.length} />
    </div>
  )
}
