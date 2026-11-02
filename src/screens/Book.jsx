import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Icon, Seg, Sheet } from '../components/ui'
import { Glyph } from '../components/Art'
import { TileMap } from '../components/Maps'
import { CATS, CAT, DAYPARTS, byCat, fmtDur } from '../lib/catalog'
import { CITIES, CITY_IDS } from '../lib/geo'
import { BLANK, useAreaStats, useSearch } from '../lib/search'
import { addDays, dayNum, fa, haptic, km, relDay, short, today, wdShort } from '../lib/util'

const SHORTCUTS = [
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
        <p className="muted small center">نقشه‌ی شماتیک — شمال بالا. رنگ پررنگ‌تر یعنی سالن بیشتر.</p>
      </div>
      <div className="sheet-foot">
        <button className="btn ghost" onClick={() => setAreas([])}>همه‌ی شهر</button>
        <button className="btn primary" onClick={onClose}>{areas.length ? `${fa(areas.length)} ناحیه انتخاب شد` : 'تأیید'}</button>
      </div>
    </Sheet>
  )
}

export default function Book() {
  const { me, updateMe, toast } = useStore()
  const nav = useNav()
  const [q, setQ] = useState(BLANK)
  const [areaOpen, setAreaOpen] = useState(false)
  const set = (p) => setQ((x) => ({ ...x, ...p }))
  const { list } = useSearch(q)
  const C = CITIES[me.city]
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today(), i)), [])
  const done = [q.cat, true, q.date !== today() || q.daypart].filter(Boolean).length
  const go = (extra = {}, title) => nav.push({ type: 'results', q: { ...q, ...extra }, title })

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
    <div className="scroll book">
      <section className="finder">
        <div className="finder-head">
          <div className="ring" style={{ '--p': done / 3 }}><span>{done === 3 ? <Icon n="check" s={15} w={2.6} /> : `${fa(done)}/۳`}</span></div>
          <div><em className="en">Book your moment</em><h1>نوبت زیبایی‌تون رو بگیرید</h1></div>
        </div>

        <div className="f-step"><i className={q.cat ? 'ok' : ''}>۱</i><b>چه خدمتی می‌خواهید؟</b></div>
        <div className="f-cats">
          {CATS.map((c) => (
            <motion.button key={c.id} className={q.cat === c.id ? 'on' : ''} style={{ '--t': c.tone }} whileTap={{ scale: 0.9 }}
              onClick={() => { haptic(8); set({ cat: q.cat === c.id ? '' : c.id, sid: '' }) }}>
              <span className="fc-orb"><Glyph cat={c.id} s={24} w={1.3} /></span>
              <b>{c.name}</b>
            </motion.button>
          ))}
        </div>
        <AnimatePresence>
          {q.cat && (
            <motion.div className="f-svcs" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div className="chips">
                <button className={`chip ${!q.sid ? 'on' : ''}`} onClick={() => set({ sid: '' })}>همه‌ی {CAT[q.cat].name}</button>
                {byCat(q.cat).map((s) => (
                  <button key={s.id} className={`chip ${q.sid === s.id ? 'on' : ''}`} onClick={() => set({ sid: s.id })}>{s.name} <small>{fmtDur(s.dur)}</small></button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="f-step"><i className="ok">۲</i><b>کجا؟</b></div>
        <Seg id="city" items={CITY_IDS.map((c) => [c, CITIES[c].name])} value={me.city} onChange={(c) => { updateMe({ city: c, area: null }); set({ areas: [] }) }} />
        <button className="f-area" onClick={() => setAreaOpen(true)}>
          <Icon n="map" s={18} />
          <span>{q.areas.length ? q.areas.map((id) => C.areas.find((a) => a.id === id)?.name).join('، ') : `همه‌ی نواحی ${C.name}`}</span>
          <small>انتخاب ناحیه</small>
        </button>

        <div className="f-step"><i className={q.date !== today() || q.daypart ? 'ok' : ''}>۳</i><b>کی؟</b></div>
        <div className="days">
          {days.map((d) => (
            <button key={d} className={q.date === d ? 'on' : ''} onClick={() => set({ date: d })}>
              <small>{relDay(d) === 'امروز' || relDay(d) === 'فردا' ? relDay(d) : wdShort(d)}</small><b>{dayNum(d)}</b>
            </button>
          ))}
        </div>
        <div className="parts">
          {DAYPARTS.map((d) => <button key={d.id} className={q.daypart === d.id ? 'on' : ''} onClick={() => set({ daypart: d.id })}>{d.icon && <Icon n={d.icon} s={14} />}{d.name}</button>)}
        </div>

        <motion.button className={`cta ${done === 3 ? 'ready' : ''}`} whileTap={{ scale: 0.97 }} onClick={() => go({}, q.sid ? undefined : q.cat ? CAT[q.cat].name : 'همه‌ی سالن‌ها')}>
          <Icon n="search" s={19} w={2.2} />
          <span>نمایش <AnimatePresence mode="popLayout"><motion.b key={list.length} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}>{fa(list.length)}</motion.b></AnimatePresence> سالن</span>
          {list.length > 0 && list.some((s) => s.price) && <small>از {short(Math.min(...list.filter((s) => s.price).map((s) => s.price)))}</small>}
        </motion.button>
      </section>

      <div className="sec-title"><div><em className="en">Quick picks</em><h2>انتخاب سریع</h2></div></div>
      <div className="shortcuts">
        {SHORTCUTS.map((s, i) => (
          <motion.button key={s.id} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }} onClick={() => shortcut(s)}>
            <span><Icon n={s.icon} s={18} /></span><b>{s.name}</b>
          </motion.button>
        ))}
      </div>
      <div className="foot-space" />
      <AreaSheet open={areaOpen} onClose={() => setAreaOpen(false)} areas={q.areas} setAreas={(areas) => set({ areas })} />
    </div>
  )
}
