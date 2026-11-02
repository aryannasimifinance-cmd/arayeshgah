import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Badge, Empty, Icon, Seg, Sheet } from '../components/ui'
import { Glyph, Portrait, Work } from '../components/Art'
import { CAT, SV, byCat, fmtDur } from '../lib/catalog'
import { areaOf } from '../lib/geo'
import { priceOf } from '../lib/seed'
import { fa, haptic, short } from '../lib/util'
import { ReviewItem, ScoreSummary } from './Salon'

const k = (n) => (n >= 1000 ? `${(n / 1000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}K` : n.toLocaleString('fa-IR'))

// صفحه‌ی برند شخصی آرتیست
export default function Artist({ id }) {
  const { db, me, toggleFollow } = useStore()
  const nav = useNav()
  const a = db.artists.find((x) => x.id === id)
  const salon = db.salons.find((s) => s.id === a.salon)
  const [tab, setTab] = useState('works')
  const [open, setOpen] = useState(null)
  const following = me.follows.includes(a.id)
  const reviews = useMemo(() => db.reviews.filter((r) => r.artist === id).sort((x, y) => y.t - x.t), [db.reviews, id])
  const svcs = salon ? salon.svc.filter((x) => a.cats.includes(SV[x.sid].cat)).map((x) => x.sid) : a.cats.flatMap((c) => byCat(c).map((s) => s.id))
  const done = db.bookings.filter((b) => b.artist === id).length + Math.round(a.reviewsN * 2.4)
  const area = areaOf(a.city, a.area)

  return (
    <div className="scroll artist">
      <div className="art-top">
        <button className="icon-btn" onClick={nav.pop} aria-label="بازگشت"><Icon n="back" s={22} /></button>
        <b dir="ltr">@{a.handle}</b>
        <span className="icon-btn" />
      </div>
      <section className="art-head">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><Portrait a={a} size={104} /></motion.div>
        <h1>{a.name}</h1>
        <div className="art-badges"><Badge a={a} />{a.home && <span className="badge home"><Icon n="home" s={11} w={2} /> در منزل</span>}</div>
        <p className="muted">{a.cats.map((c) => CAT[c].name).join(' · ')} · {fa(a.years)} سال سابقه</p>
        <div className="art-stats">
          <span><b>{fa(a.rating.toFixed(1))}</b><small>امتیاز</small></span>
          <span><b>{k(a.followers)}</b><small>دنبال‌کننده</small></span>
          <span><b>{k(done)}</b><small>نوبت موفق</small></span>
          <span><b>{fa(a.reviewsN)}</b><small>نظر</small></span>
        </div>
        <p className="art-bio">{a.bio}</p>
        <div className="art-actions">
          <motion.button className={`btn ${following ? 'ghost' : 'dark'}`} whileTap={{ scale: 0.95 }} onClick={() => { haptic(12); toggleFollow(a.id) }}>
            {following ? <><Icon n="check" s={16} /> دنبال می‌کنید</> : <><Icon n="plus" s={16} /> دنبال کردن</>}
          </motion.button>
          <motion.button className="btn primary" whileTap={{ scale: 0.95 }} onClick={() => nav.book({ salon: a.salon || undefined, artist: a.id, freelancer: !a.salon ? a.id : undefined, svc: [] })}>رزرو با {a.name.split(' ')[0]}</motion.button>
        </div>
        <button className="art-where" onClick={() => salon && nav.push({ type: 'salon', id: salon.id })}>
          <Icon n="pin" s={15} /> {salon ? <>در <b>{salon.name}</b> · {salon.hood}</> : <>آزادکار · خدمات در منزل در {area.name} و اطراف</>}
          {salon && <Icon n="fwd" s={14} />}
        </button>
        <div className="signature"><Glyph cat={SV[a.signature].cat} s={18} /><span>کار امضای {a.name.split(' ')[0]}:</span><b>{SV[a.signature].name}</b></div>
      </section>

      <div className="salon-tabs"><Seg id="atab" items={[['works', 'نمونه‌کارها'], ['svc', 'خدمات و قیمت'], ['rev', 'نظرها']]} value={tab} onChange={setTab} /></div>

      {tab === 'works' && (
        <div className="works-grid">
          {a.works.map((w, i) => (
            <motion.button key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.03 } }} onClick={() => setOpen(w)}>
              <Work w={w} />
              <span className="wg-like"><Icon n="heart" s={12} fill="currentColor" w={0} /> {k(w.likes)}</span>
            </motion.button>
          ))}
        </div>
      )}
      {tab === 'svc' && (
        <section className="pad svc-list">
          {svcs.map((sid) => (
            <button key={sid} className="svc" onClick={() => nav.book({ salon: a.salon || undefined, artist: a.id, freelancer: !a.salon ? a.id : undefined, svc: [sid] })}>
              <div><b>{SV[sid].name}</b><small className="muted">{fmtDur(SV[sid].dur)} · {CAT[SV[sid].cat].name}</small></div>
              <span className="svc-price">{short(priceOf(salon, sid, a))}</span>
              <span className="svc-add"><Icon n="fwd" s={16} /></span>
            </button>
          ))}
        </section>
      )}
      {tab === 'rev' && (
        <section className="pad">
          <ScoreSummary rating={a.rating} n={a.reviewsN} reviews={reviews} />
          {reviews.length ? reviews.map((r) => <ReviewItem key={r.id} r={r} showArtist={false} showSalon />) : <Empty icon="chat" title="هنوز نظر مکتوبی نیست" />}
        </section>
      )}
      <div className="foot-space" />

      <Sheet open={!!open} onClose={() => setOpen(null)}>
        {open && (
          <div className="work-view">
            <Work w={open} />
            <div className="pad">
              <h3>{open.title}</h3>
              <p className="muted">{CAT[open.cat].name} · <span dir="ltr">@{a.handle}</span> · {k(open.likes)} پسند</p>
              <button className="btn primary block" onClick={() => { setOpen(null); nav.book({ salon: a.salon || undefined, artist: a.id, freelancer: !a.salon ? a.id : undefined, svc: [] }) }}>همین رو می‌خوام — رزرو</button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
