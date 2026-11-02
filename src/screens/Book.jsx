import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Icon, Sheet } from '../components/ui'
import { Glyph } from '../components/Art'
import { TileMap } from '../components/Maps'
import { CATS, CAT, DAYPARTS, byCat, fmtDur } from '../lib/catalog'
import { CITIES, CITY_IDS } from '../lib/geo'
import { PH, img } from '../lib/photos'
import { BLANK, useAreaStats, useSearch } from '../lib/search'
import { addDays, dayNum, fa, haptic, km, relDay, today, wdShort } from '../lib/util'

export const SHORTCUTS = [
  { id: 'today', name: 'نوبت آزاد امروز', icon: 'bolt', q: { freeOnly: true, sort: 'soon' } },
  { id: 'top', name: 'بالاترین امتیاز', icon: 'star', q: { sort: 'rating', minRating: 4.6 } },
  { id: 'home', name: 'خدمات در منزل', icon: 'home', q: { amen: ['home'] } },
  { id: 'bridal', name: 'پکیج عروس', icon: 'crown', q: { cat: 'bridal' } },
  { id: 'spa', name: 'اسپا و ماساژ', icon: 'leaf', q: { kind: 'spa' } },
  { id: 'cheap', name: 'به‌صرفه', icon: 'tag', q: { sort: 'price', tiers: [1, 2] } },
  { id: 'late', name: 'باز تا دیروقت', icon: 'moon', q: { amen: ['late'] } },
  { id: 'near', name: 'نزدیک من', icon: 'locate', near: true },
]

// برگه‌ی انتخاب ناحیه: نقشه‌ی شماتیک + جستجوی محله
export function AreaSheet({ open, onClose, areas, setAreas }) {
  const { db, me } = useStore()
  const [t, setT] = useState('')
  const stats = useAreaStats(db.salons.filter((s) => s.city === me.city))
  const C = CITIES[me.city]
  const hits = t ? C.areas.filter((a) => [a.name, ...a.hoods].some((h) => h.includes(t))) : []
  const toggle = (id) => setAreas(areas.includes(id) ? areas.filter((x) => x !== id) : [...areas, id])
  return (
    <Sheet open={open} onClose={onClose} title={`نواحی ${C.name}`}>
      <div className="pad">
        <label className="search-in"><Icon n="search" s={17} /><input value={t} onChange={(e) => setT(e.target.value)} placeholder="محله رو بنویسید؛ مثلاً ونک یا گوهردشت" /></label>
        {hits.length > 0 && <div className="chips wrap">{hits.map((a) => <button key={a.id} className={`chip ${areas.includes(a.id) ? 'on' : ''}`} onClick={() => toggle(a.id)}>{a.name} <small>· {a.hoods.find((h) => h.includes(t)) || a.hoods[0]}</small></button>)}</div>}
        <TileMap city={me.city} selected={areas} onToggle={toggle} stats={stats} />
        <p className="muted small center">شمال بالا · رنگ پررنگ‌تر یعنی سالن بیشتر</p>
      </div>
      <div className="sheet-foot">
        <button className="btn ghost" onClick={() => setAreas([])}>همه‌ی شهر</button>
        <button className="btn primary" onClick={onClose}>{areas.length ? `${fa(areas.length)} ناحیه انتخاب شد` : 'تأیید'}</button>
      </div>
    </Sheet>
  )
}

// کارت جستجوی صفحه‌ی اول: کجا ← چه خدمتی ← کی؛ نتیجه سالن‌های آزاد است
export function Finder() {
  const { me, updateMe } = useStore()
  const nav = useNav()
  const [q, setQ] = useState({ ...BLANK, freeOnly: true, sort: 'soon' })
  const [touched, setTouched] = useState({ where: false, what: false, when: false })
  const [areaOpen, setAreaOpen] = useState(false)
  const set = (p) => setQ((x) => ({ ...x, ...p }))
  const touch = (k) => { haptic(8); setTouched((t) => ({ ...t, [k]: true })) }
  const { list } = useSearch(q)
  const C = CITIES[me.city]
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today(), i)), [])
  const done = Object.values(touched).filter(Boolean).length
  // عکس پس‌زمینه با دسته‌ی انتخابی عوض می‌شود
  const photos = q.cat ? PH[q.cat].slice(0, 4) : PH.hero
  const [slide, setSlide] = useState(0)
  useEffect(() => { setSlide(0); const t = setInterval(() => setSlide((x) => x + 1), 5000); return () => clearInterval(t) }, [q.cat])
  const cats = useRef(null)
  const go = () => nav.push({ type: 'results', q, title: q.sid ? undefined : q.cat ? CAT[q.cat].name : 'سالن‌های آزاد' })
  const cur = photos[slide % photos.length]

  return (
    <section className="finder photo">
      <AnimatePresence>
        <motion.img key={cur} className="finder-bg" src={img(cur)} alt="" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} />
      </AnimatePresence>
      <div className="finder-shade" />
      <div className="finder-in">
        {/* ذره‌بین: نماد صفحه‌ی جستجو؛ با هر قدم یک درخشش داخلش روشن می‌شود */}
        <div className="finder-head center">
          <Magnifier step={done} />
          <em className="en">Book your glow.</em>
          <h1>دنبال چی می‌گردید؟</h1>
        </div>
        <div className="finder-dots">{photos.map((_, k) => <i key={k} className={k === slide % photos.length ? 'on' : ''} />)}</div>

        {/* ۱. کجا */}
        <div className="f-step"><i className={touched.where ? 'ok' : ''}>۱</i><b>کجا؟</b></div>
        <div className="f-cities">
          {CITY_IDS.map((c) => (
            <motion.button key={c} className={me.city === c ? 'on' : ''} whileTap={{ scale: 0.95 }} onClick={() => { updateMe({ city: c, area: null }); set({ areas: [] }); touch('where') }}>
              <em className="en">{CITIES[c].en}</em><b>{CITIES[c].name}</b>
              {me.city === c && <motion.span layoutId="fcity" className="fc-on" transition={{ type: 'spring', stiffness: 500, damping: 34 }} />}
            </motion.button>
          ))}
          <button className="f-area" onClick={() => { setAreaOpen(true); touch('where') }}>
            <Icon n="pin" s={16} />
            <span>{q.areas.length ? q.areas.map((id) => C.areas.find((a) => a.id === id)?.name).join('، ') : 'همه‌ی نواحی'}</span>
          </button>
        </div>

        {/* ۲. چه خدمتی */}
        <div className="f-step"><i className={touched.what ? 'ok' : ''}>۲</i><b>چه خدمتی؟</b></div>
        <div className="f-cats" ref={cats}>
          {CATS.map((c) => (
            <motion.button key={c.id} className={q.cat === c.id ? 'on' : ''} whileTap={{ scale: 0.9 }} onClick={(e) => { set({ cat: q.cat === c.id ? '' : c.id, sid: '' }); touch('what'); e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }) }}>
              <span className="fc-orb"><Glyph cat={c.id} s={22} w={1.4} /></span>
              <b>{c.name}</b>
            </motion.button>
          ))}
        </div>
        <AnimatePresence>
          {q.cat && (
            <motion.div className="f-svcs" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div className="chips">
                <button className={`chip glass-d ${!q.sid ? 'on' : ''}`} onClick={() => set({ sid: '' })}>همه‌ی {CAT[q.cat].name}</button>
                {byCat(q.cat).map((s) => <button key={s.id} className={`chip glass-d ${q.sid === s.id ? 'on' : ''}`} onClick={() => set({ sid: s.id })}>{s.name} <small>{fmtDur(s.dur)}</small></button>)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ۳. کی */}
        <div className="f-step"><i className={touched.when ? 'ok' : ''}>۳</i><b>کی؟</b></div>
        <div className="f-days">
          {days.map((d) => (
            <button key={d} className={q.date === d ? 'on' : ''} onClick={() => { set({ date: d }); touch('when') }}>
              <small>{relDay(d) === 'امروز' || relDay(d) === 'فردا' ? relDay(d) : wdShort(d)}</small><b>{dayNum(d)}</b>
            </button>
          ))}
        </div>
        <div className="f-parts">
          {DAYPARTS.map((d) => <button key={d.id} className={q.daypart === d.id ? 'on' : ''} onClick={() => { set({ daypart: d.id }); touch('when') }}>{d.icon && <Icon n={d.icon} s={13} />}{d.name}</button>)}
        </div>

        <motion.button className={`f-cta ${done === 3 ? 'ready' : ''}`} whileTap={{ scale: 0.97 }} onClick={go}>
          <Icon n="search" s={19} w={2.2} />
          <span>نمایش <AnimatePresence mode="popLayout"><motion.b key={list.length} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}>{fa(list.length)}</motion.b></AnimatePresence> سالن آزاد</span>
        </motion.button>
      </div>
      <AreaSheet open={areaOpen} onClose={() => setAreaOpen(false)} areas={q.areas} setAreas={(areas) => set({ areas })} />
    </section>
  )
}

function Magnifier({ step }) {
  return (
    <motion.svg className="magnifier" width="74" height="74" viewBox="0 0 80 80" initial={{ scale: 0.8, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }} aria-hidden>
      <circle cx="34" cy="34" r="24" fill="rgba(255,255,255,.14)" stroke="#fff" strokeWidth="3" />
      <circle cx="34" cy="34" r="17" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1" />
      <path d="M52 52 70 70" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
      <path d="M52 52 70 70" stroke="var(--gold-2)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 26a14 14 0 0 1 9-8" stroke="rgba(255,255,255,.8)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {[[34, 34, 9], [27, 41, 4.5], [42, 27, 4]].map(([x, y, r], i) => (
        <motion.path key={i} d={`M${x} ${y - r}c${r * 0.12} ${r * 0.75} ${r * 0.25} ${r * 0.88} ${r} ${r}-${r * 0.75} ${r * 0.12}-${r * 0.88} ${r * 0.25}-${r} ${r}-${r * 0.12}-${r * 0.75}-${r * 0.25}-${r * 0.88}-${r}-${r} ${r * 0.75}-${r * 0.12} ${r * 0.88}-${r * 0.25} ${r}-${r}Z`}
          fill={i < step ? 'var(--gold-2)' : 'rgba(255,255,255,.35)'} animate={i < step ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.4 }} style={{ transformOrigin: `${x}px ${y}px` }} />
      ))}
    </motion.svg>
  )
}

// میان‌برهای زیر کارت جستجو
export function Shortcuts() {
  const { updateMe, toast } = useStore()
  const nav = useNav()
  const shortcut = (s) => {
    haptic(10)
    if (!s.near) return nav.push({ type: 'results', q: { ...BLANK, ...s.q }, title: s.name })
    if (!navigator.geolocation) return toast({ icon: '📍', text: 'موقعیت در دسترس نیست' })
    navigator.geolocation.getCurrentPosition((p) => {
      const at = [p.coords.latitude, p.coords.longitude]
      const best = CITY_IDS.map((c) => ({ c, d: km(at, CITIES[c].center) })).sort((a, b) => a.d - b.d)[0]
      if (best.d > 60) return toast({ icon: '📍', text: 'فعلاً فقط تهران و کرج فعالیم' })
      const area = [...CITIES[best.c].areas].sort((x, y) => km(at, x.at) - km(at, y.at))[0]
      updateMe({ city: best.c, area: area.id })
      nav.push({ type: 'results', q: { ...BLANK, areas: [area.id] }, title: `نزدیک شما · ${area.name}` })
    }, () => toast({ icon: '📍', text: 'اجازه‌ی موقعیت داده نشد' }), { timeout: 6000 })
  }
  return (
    <div className="shortcuts">
      {SHORTCUTS.map((s, i) => (
        <motion.button key={s.id} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }} onClick={() => shortcut(s)}>
          <span><Icon n={s.icon} s={18} /></span><b>{s.name}</b>
        </motion.button>
      ))}
    </div>
  )
}
