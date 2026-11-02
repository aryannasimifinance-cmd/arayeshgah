import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Icon } from '../components/ui'
import { CATS, CAT, SERVICES, byCat, fmtDur } from '../lib/catalog'
import { PH, img } from '../lib/photos'
import { BLANK } from '../lib/search'
import { fa, haptic, short } from '../lib/util'

// کمترین قیمت و تعداد سالن هر خدمت در شهر کاربر
function useSvcStats() {
  const { db, me } = useStore()
  return useMemo(() => {
    const m = {}
    db.salons.filter((s) => s.city === me.city).forEach((s) => s.svc.forEach((x) => {
      const o = (m[x.sid] ||= { n: 0, min: Infinity })
      o.n++; o.min = Math.min(o.min, x.price)
    }))
    return m
  }, [db.salons, me.city])
}

const results = (nav, q, title) => { haptic(); nav.push({ type: 'results', q: { ...BLANK, ...q }, title }) }

function SvcRow({ s, st, i }) {
  const nav = useNav()
  return (
    <motion.button className="svc-pick" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }} onClick={() => results(nav, { cat: s.cat, sid: s.id }, s.name)}>
      <img src={img(PH[s.cat][i % PH[s.cat].length])} alt="" loading="lazy" />
      <div><b>{s.name}</b><small className="muted">{fmtDur(s.dur)}{st ? ` · ${fa(st.n)} سالن` : ''}</small></div>
      <span>{st ? <>از <b>{short(st.min)}</b></> : <small className="muted">به‌زودی</small>}</span>
      <Icon n="fwd" s={16} />
    </motion.button>
  )
}

// تب خدمات: کاشی‌های عکس‌دار همه‌ی دسته‌ها
export default function Services() {
  const nav = useNav()
  const stats = useSvcStats()
  const [t, setT] = useState('')
  const hits = t ? SERVICES.filter((s) => s.name.includes(t) || CAT[s.cat].name.includes(t)) : []
  return (
    <div className="scroll services-tab">
      <header className="top plain"><div><em className="en">Services</em><h1>همه‌ی خدمات</h1></div></header>
      <div className="pad-x"><label className="search-in"><Icon n="search" s={17} /><input value={t} onChange={(e) => setT(e.target.value)} placeholder="مثلاً کراتین، کاشت مژه، ماساژ سنگ داغ" /></label></div>
      {t ? (
        <div className="pad-x">{hits.length ? hits.map((s, i) => <SvcRow key={s.id} s={s} st={stats[s.id]} i={i} />) : <p className="muted center pad">خدمتی با این اسم نداریم.</p>}</div>
      ) : (
        <div className="svc-tiles">
          {CATS.map((c, i) => {
            const list = byCat(c.id)
            const min = Math.min(...list.map((s) => stats[s.id]?.min ?? Infinity))
            return (
              <motion.button key={c.id} className={i === 0 || i === 7 ? 'wide' : ''} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.04 } }} whileTap={{ scale: 0.97 }}
                onClick={() => { haptic(); nav.push({ type: 'cat', id: c.id }) }}>
                <img src={img(PH[c.id][i === 0 ? 2 : 0])} alt="" loading="lazy" />
                <span className="st-in">
                  <em className="en">{c.en}</em>
                  <b>{c.name}</b>
                  <small>{fa(list.length)} خدمت{min < Infinity ? ` · از ${short(min)}` : ''}</small>
                </span>
              </motion.button>
            )
          })}
        </div>
      )}
      <div className="foot-space" />
    </div>
  )
}

// صفحه‌ی یک دسته: عکس بزرگ و فهرست خدمات
export function CategoryPage({ id }) {
  const nav = useNav()
  const stats = useSvcStats()
  const c = CAT[id]
  return (
    <div className="scroll cat-page">
      <div className="cat-hero">
        <img src={img(PH[id][1] || PH[id][0])} alt="" />
        <button className="icon-btn glass" onClick={nav.pop} aria-label="بازگشت"><Icon n="back" s={22} /></button>
        <div><em className="en">{c.en}</em><h1>{c.name}</h1></div>
      </div>
      <div className="pad">
        <button className="btn primary block" onClick={() => results(nav, { cat: id }, c.name)}><Icon n="search" s={16} /> همه‌ی سالن‌های {c.name}</button>
        <h4 className="cat-sub">یک خدمت را انتخاب کنید</h4>
        {byCat(id).map((s, i) => <SvcRow key={s.id} s={s} st={stats[s.id]} i={i} />)}
      </div>
      <div className="foot-space" />
    </div>
  )
}
