import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Icon, Sheet } from '../components/ui'
import { Glyph, Portrait } from '../components/Art'
import { TileMap } from '../components/Maps'
import { CATS, CAT, DAYPARTS, byCat, fmtDur } from '../lib/catalog'
import { CITIES, CITY_IDS } from '../lib/geo'
import { PH, img } from '../lib/photos'
import { BLANK, useAreaStats, useSearch } from '../lib/search'
import { addDays, dateShort, dayNum, fa, haptic, isFriday, monthName, relDay, toDate, today } from '../lib/util'

const CITY_IMG = { tehran: './img/city-tehran.jpg', karaj: './img/city-karaj.jpg' }

// برگه‌ی انتخاب ناحیه: نقشه‌ی شماتیک + جستجوی محله
export function AreaSheet({ open, onClose, areas, setAreas }) {
  const { db, me } = useStore()
  const [t, setT] = useState('')
  const stats = useAreaStats(db.salons.filter((s) => s.city === me.city))
  const C = CITIES[me.city]
  const hits = t ? C.areas.filter((a) => [a.name, ...a.hoods].some((h) => h.includes(t))) : []
  const toggle = (id) => setAreas(areas.includes(id) ? areas.filter((x) => x !== id) : [...areas, id])
  return (
    <Sheet open={open} onClose={onClose} title={`مناطق ${C.name}`}>
      <div className="pad">
        <label className="search-in"><Icon n="search" s={17} /><input value={t} onChange={(e) => setT(e.target.value)} placeholder="محله رو بنویسید؛ مثلاً ونک یا گوهردشت" /></label>
        {hits.length > 0 && <div className="chips wrap">{hits.map((a) => <button key={a.id} className={`chip ${areas.includes(a.id) ? 'on' : ''}`} onClick={() => toggle(a.id)}>{a.name} <small>· {a.hoods.find((h) => h.includes(t)) || a.hoods[0]}</small></button>)}</div>}
        <TileMap city={me.city} selected={areas} onToggle={toggle} stats={stats} />
        <p className="muted small center">شمال بالا · رنگ پررنگ‌تر یعنی سالن بیشتر</p>
      </div>
      <div className="sheet-foot">
        <button className="btn ghost" onClick={() => setAreas([])}>همه‌ی شهر</button>
        <button className="btn primary" onClick={onClose}>{areas.length ? `${fa(areas.length)} منطقه انتخاب شد` : 'تأیید'}</button>
      </div>
    </Sheet>
  )
}

// تقویم شمسی ۶۰ روز آینده؛ هفته از شنبه، جمعه‌ها رنگی
export function MonthCal({ value, onPick }) {
  const days = Array.from({ length: 60 }, (_, i) => addDays(today(), i))
  const months = []
  days.forEach((k) => { const m = monthName(k); if (!months.length || months.at(-1).m !== m) months.push({ m, days: [] }); months.at(-1).days.push(k) })
  const offset = (k) => (toDate(k).getDay() + 1) % 7
  return (
    <div className="pad mcal-fa">
      {months.map(({ m, days: ds }) => (
        <section key={m}>
          <h4>{m}</h4>
          <div className="mcal-grid">
            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((w) => <small key={w}>{w}</small>)}
            {Array.from({ length: offset(ds[0]) }, (_, i) => <span key={'e' + i} />)}
            {ds.map((k) => <button key={k} className={`${value === k ? 'on' : ''} ${isFriday(k) ? 'fri' : ''} ${k === today() ? 'today' : ''}`} onClick={() => onPick(k)}>{dayNum(k)}</button>)}
          </div>
        </section>
      ))}
    </div>
  )
}

// ذره‌بین: با هر قدم تکمیل‌شده یک درخشش داخلش روشن می‌شود
function Magnifier({ step }) {
  // رنگ‌ها از CSS می‌آیند تا در هر دو ظاهر درست دیده شود
  return (
    <motion.svg className="magnifier" width="46" height="46" viewBox="0 0 80 80" initial={{ scale: 0.8, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }} aria-hidden>
      <circle className="mg-glass" cx="34" cy="34" r="24" strokeWidth="3" />
      <circle className="mg-ring" cx="34" cy="34" r="17" fill="none" strokeWidth="1" />
      <path className="mg-handle" d="M52 52 70 70" strokeWidth="7" strokeLinecap="round" />
      <path className="mg-accent" d="M52 52 70 70" strokeWidth="2.5" strokeLinecap="round" />
      <path className="mg-shine" d="M22 26a14 14 0 0 1 9-8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {[[34, 34, 9], [27, 41, 4.5], [42, 27, 4]].map(([x, y, r], i) => (
        <motion.path key={i} className={i < step ? 'mg-lit' : 'mg-dim'} d={`M${x} ${y - r}c${r * 0.12} ${r * 0.75} ${r * 0.25} ${r * 0.88} ${r} ${r}-${r * 0.75} ${r * 0.12}-${r * 0.88} ${r * 0.25}-${r} ${r}-${r * 0.12}-${r * 0.75}-${r * 0.25}-${r * 0.88}-${r}-${r} ${r * 0.75}-${r * 0.12} ${r * 0.88}-${r * 0.25} ${r}-${r}Z`}
          animate={i < step ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.4 }} style={{ transformOrigin: `${x}px ${y}px` }} />
      ))}
    </motion.svg>
  )
}

// کارت جستجوی صفحه‌ی وسط — همان ساختار صفحه‌ی اصلی کلاب‌ست: کجا ← چه خدمتی ← کی
export function Finder({ onMap }) {
  const { me, updateMe } = useStore()
  const nav = useNav()
  const [q, setQ] = useState({ ...BLANK, freeOnly: true, sort: 'soon' })
  const [touched, setTouched] = useState({ where: false, what: false, when: false })
  const [cal, setCal] = useState(false)
  const [text, setText] = useState('')
  const set = (p) => setQ((x) => ({ ...x, ...p }))
  const touch = (k) => { haptic(8); setTouched((t) => ({ ...t, [k]: true })) }
  const { list } = useSearch(q)
  const found = useSearch({ ...BLANK, text })
  const C = CITIES[me.city]
  const done = Object.values(touched).filter(Boolean).length
  // عکس پس‌زمینه با دسته‌ی انتخابی عوض می‌شود
  const photos = q.cat ? PH[q.cat].slice(0, 4) : PH.hero
  const [slide, setSlide] = useState(0)
  useEffect(() => { setSlide(0); const t = setInterval(() => setSlide((x) => x + 1), 5000); return () => clearInterval(t) }, [q.cat])
  const cur = photos[slide % photos.length]
  const quick = [0, 1, 2].map((d) => addDays(today(), d))
  const far = !quick.includes(q.date)
  const go = () => nav.push({ type: 'results', q, title: q.sid ? undefined : q.cat ? CAT[q.cat].name : 'سالن‌های آزاد' })
  const toggleArea = (id) => { set({ areas: q.areas.includes(id) ? q.areas.filter((x) => x !== id) : [...q.areas, id] }); touch('where') }
  const rail = useRef(null)

  return (
    <section className="finder cs">
      <AnimatePresence>
        <motion.img key={cur} className="finder-bg" src={img(cur)} alt="" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} />
      </AnimatePresence>
      <div className="finder-shade" />
      <div className="finder-in">
        <div className="finder-top">
          <div className="f-ring" style={{ '--p': done / 3 }}><span>{done === 3 ? <Icon n="check" s={14} w={2.6} /> : `${fa(done)}/۳`}</span></div>
          <Magnifier step={done} />
          <h1>جستجو</h1>
          <div className="finder-dots">{photos.map((_, k) => <i key={k} className={k === slide % photos.length ? 'on' : ''} />)}</div>
        </div>

        {/* جستجوی اسم */}
        <label className="f-search"><Icon n="search" s={17} /><input value={text} onChange={(e) => setText(e.target.value)} placeholder="اسم سالن، آرتیست یا خدمت…" />{text && <button onClick={() => setText('')}><Icon n="close" s={15} /></button>}</label>
        <AnimatePresence>
          {text && (
            <motion.div className="f-suggest" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              {found.services.map((s) => <button key={s.id} onClick={() => { set({ cat: s.cat, sid: s.id }); touch('what'); setText('') }}><span className="fs-ico"><Glyph cat={s.cat} s={15} /></span><b>{s.name}</b><small>{CAT[s.cat].name}</small></button>)}
              {found.artists.slice(0, 3).map((a) => <button key={a.id} onClick={() => nav.push({ type: 'artist', id: a.id })}><Portrait a={a} size={28} ring={false} /><b>{a.name}</b><small dir="ltr">@{a.handle}</small></button>)}
              {found.list.slice(0, 4).map((s) => <button key={s.id} onClick={() => nav.push({ type: 'salon', id: s.id })}><span className="fs-ph"><img src={img(s.photos[0])} alt="" /></span><b>{s.name}</b><small>{s.hood}</small></button>)}
              {found.areas.map((a) => <button key={a.id} onClick={() => { toggleArea(a.id); setText('') }}><span className="fs-ico"><Icon n="pin" s={15} /></span><b>{a.name}</b><small>{a.hoods.join('، ')}</small></button>)}
              {!found.services.length && !found.artists.length && !found.list.length && !found.areas.length && <p>چیزی پیدا نشد</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ۱. کجا */}
        <div className="f-step"><i className={touched.where ? 'ok' : ''}>۱</i><b>کجا؟</b></div>
        <div className="f-cities">
          {CITY_IDS.map((c) => (
            <motion.button key={c} className={me.city === c ? 'on' : ''} whileTap={{ scale: 0.94 }} onClick={() => { updateMe({ city: c, area: null }); set({ areas: [] }); touch('where') }}>
              <img src={CITY_IMG[c]} alt="" />
              <b>{CITIES[c].name}</b>
              {me.city === c && <motion.span layoutId="f-city" className="f-on" transition={{ type: 'spring', stiffness: 500, damping: 32 }} />}
            </motion.button>
          ))}
          <button className="f-mapbtn" onClick={onMap}><Icon n="map" s={22} /><b>روی نقشه</b><small>انتخاب منطقه</small></button>
        </div>
        <div className="f-areas-rail" ref={rail}>
          <button className={!q.areas.length ? 'on' : ''} onClick={() => { set({ areas: [] }); touch('where') }}>همه‌ی {C.name}</button>
          {C.areas.map((a) => (
            <button key={a.id} className={q.areas.includes(a.id) ? 'on' : ''} onClick={() => toggleArea(a.id)}>{a.name}<small>{a.hoods[0]}</small></button>
          ))}
        </div>

        {/* ۲. چه خدمتی */}
        <div className="f-step"><i className={touched.what ? 'ok' : ''}>۲</i><b>چه خدمتی؟</b></div>
        <div className="f-cats5">
          {CATS.map((c) => (
            <motion.button key={c.id} className={q.cat === c.id ? 'on' : ''} style={{ '--c': c.tone }} whileTap={{ scale: 0.92 }} onClick={() => { set({ cat: q.cat === c.id ? '' : c.id, sid: '' }); touch('what') }}>
              <Glyph cat={c.id} s={18} w={1.5} /><b>{c.name}</b>
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
        <div className="f-when">
          {quick.map((d) => <button key={d} className={q.date === d ? 'on' : ''} onClick={() => { set({ date: d }); touch('when') }}>{relDay(d)}</button>)}
          <button className={`f-cal ${far ? 'on' : ''}`} onClick={() => setCal(true)}><Icon n="cal" s={15} />{far ? dateShort(q.date) : 'تقویم'}</button>
        </div>
        <div className="f-parts">
          {DAYPARTS.map((d) => <button key={d.id} className={q.daypart === d.id ? 'on' : ''} onClick={() => { set({ daypart: d.id }); touch('when') }}>{d.name}</button>)}
        </div>

        <motion.button className={`f-cta ${done === 3 ? 'ready' : ''}`} whileTap={{ scale: 0.97 }} onClick={go}>
          <Icon n="search" s={19} w={2.2} />
          <span>نمایش <AnimatePresence mode="popLayout"><motion.b key={list.length} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}>{fa(list.length)}</motion.b></AnimatePresence> سالن آزاد</span>
        </motion.button>
      </div>
      <Sheet open={cal} onClose={() => setCal(false)} title="انتخاب روز">
        <MonthCal value={q.date} onPick={(date) => { set({ date }); touch('when'); setCal(false) }} />
      </Sheet>
    </section>
  )
}

