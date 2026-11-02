import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Avatar, Badge, Empty, Icon, Rating, Seg, Stars } from '../components/ui'
import { Cover, Glyph, Portrait } from '../components/Art'
import { Heart } from '../components/cards'
import { DistrictMap } from '../components/Maps'
import { AMEN, CAT, CRITERIA, SV, fmtDur } from '../lib/catalog'
import { areaOf } from '../lib/geo'
import { KINDS, tierLabel } from '../lib/seed'
import { isOpen } from '../lib/search'
import { ago, fa, haptic, hh, short, toman } from '../lib/util'

export function ReviewItem({ r, showSalon, showArtist = true }) {
  const { db } = useStore()
  const nav = useNav()
  const a = db.artists.find((x) => x.id === r.artist)
  const s = db.salons.find((x) => x.id === r.salon)
  const avg = Object.values(r.scores).reduce((x, y) => x + y, 0) / 5
  return (
    <article className="review">
      <header>
        <Avatar u={{ name: r.user, hue: r.hue }} size={36} />
        <div><b>{r.user}{r.mine && <small className="mine"> (شما)</small>}</b><small className="muted">{ago(r.t)} · {SV[r.svc]?.name}</small></div>
        <span className="rv-score"><Stars v={avg} s={12} /></span>
      </header>
      <p>{r.text}</p>
      {r.tags?.length > 0 && <div className="rv-tags">{r.tags.map((t) => <span key={t}>{t}</span>)}</div>}
      <footer>
        {r.verified && <span className="vf-pill"><Icon n="verified" s={12} /> مشتری واقعی</span>}
        {showArtist && a && <button onClick={() => nav.push({ type: 'artist', id: a.id })}>آرتیست: <b>{a.name}</b></button>}
        {showSalon && s && <button onClick={() => nav.push({ type: 'salon', id: s.id })}>{s.name}</button>}
      </footer>
      {r.reply && <div className="rv-reply"><b>پاسخ سالن</b><p>{r.reply}</p></div>}
    </article>
  )
}

// خلاصه‌ی امتیاز: عدد بزرگ + میله‌ی هر معیار
export function ScoreSummary({ rating, n, reviews }) {
  const avg = (k) => (reviews.length ? reviews.reduce((a, r) => a + r.scores[k], 0) / reviews.length : rating)
  const tags = Object.entries(reviews.flatMap((r) => r.tags || []).reduce((m, t) => ({ ...m, [t]: (m[t] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 4)
  return (
    <div className="score-sum">
      <div className="ss-big"><b>{fa(rating.toFixed(1))}</b><Stars v={rating} s={14} /><small className="muted">{n.toLocaleString('fa-IR')} نظر</small></div>
      <div className="ss-bars">
        {CRITERIA.map((c) => (
          <div key={c.id}><span>{c.name}</span><i><motion.em initial={{ width: 0 }} whileInView={{ width: `${(avg(c.id) / 5) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} /></i><b>{fa(avg(c.id).toFixed(1))}</b></div>
        ))}
      </div>
      {tags.length > 0 && <div className="rv-tags wide">{tags.map(([t, k]) => <span key={t}>{t} <small>{fa(k)}</small></span>)}</div>}
    </div>
  )
}

export default function Salon({ id }) {
  const { db, toast } = useStore()
  const nav = useNav()
  const s = db.salons.find((x) => x.id === id)
  const [tab, setTab] = useState('svc')
  const [cart, setCart] = useState([])
  const [cat, setCat] = useState(s.cats[0])
  const area = areaOf(s.city, s.area)
  const team = s.artists.map((a) => db.artists.find((x) => x.id === a))
  const reviews = useMemo(() => db.reviews.filter((r) => r.salon === id).sort((a, b) => b.t - a.t), [db.reviews, id])
  const cats = s.cats.filter((c) => s.svc.some((x) => SV[x.sid].cat === c))
  const total = cart.reduce((a, sid) => a + s.svc.find((x) => x.sid === sid).price, 0)
  const dur = cart.reduce((a, sid) => a + SV[sid].dur, 0)
  const toggle = (sid) => { haptic(10); setCart((c) => (c.includes(sid) ? c.filter((x) => x !== sid) : [...c, sid])) }
  const open = isOpen(s)

  return (
    <div className="scroll salon">
      <div className="hero">
        <Cover salon={s} ratio={0.78} />
        <div className="hero-bar">
          <button className="icon-btn glass" onClick={nav.pop} aria-label="بازگشت"><Icon n="back" s={22} /></button>
          <span />
          <button className="icon-btn glass" onClick={() => { navigator.clipboard?.writeText(`${s.name} — بیوتی‌ست`); toast({ icon: '🔗', text: 'لینک سالن کپی شد' }) }} aria-label="اشتراک"><Icon n="share" s={19} /></button>
          <Heart id={s.id} light />
        </div>
      </div>
      <section className="salon-head">
        <em className="en">{s.en}</em>
        <h1>{s.name}{s.verified && <Icon n="verified" s={18} className="vf" />}</h1>
        <p className="muted">{KINDS[s.kind].name} · {s.hood}، {area.name} · <span className="tier" dir="ltr">{tierLabel(s.tier)}</span></p>
        <div className="sh-stats">
          <button onClick={() => setTab('rev')}><Rating v={s.rating} /><small>{s.reviewsN.toLocaleString('fa-IR')} نظر</small></button>
          <span><b className={open ? 'open' : 'closed'}>{open ? 'باز است' : 'بسته است'}</b><small>{hh(s.open)} تا {hh(s.close)}</small></span>
          <span><b>{fa(team.length)}</b><small>آرتیست</small></span>
          <span><b>{fa(s.since)}</b><small>از سال</small></span>
        </div>
        {s.offer && <div className="offer-strip"><Icon n="gift" s={16} /> این هفته ٪{fa(s.offer.pct)} تخفیف روی خدمات {CAT[s.offer.cat].name}</div>}
      </section>

      <div className="salon-tabs"><Seg id="stab" items={[['svc', 'خدمات'], ['team', 'تیم'], ['rev', 'نظرها'], ['info', 'اطلاعات']]} value={tab} onChange={setTab} /></div>

      {tab === 'svc' && (
        <section className="pad">
          <div className="chips">{cats.map((c) => <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}><Glyph cat={c} s={15} /> {CAT[c].name}</button>)}</div>
          <div className="svc-list">
            {s.svc.filter((x) => SV[x.sid].cat === cat).map((x) => {
              const sv = SV[x.sid], on = cart.includes(x.sid)
              return (
                <motion.button key={x.sid} className={`svc ${on ? 'on' : ''}`} layout onClick={() => toggle(x.sid)}>
                  <div><b>{sv.name}</b><small className="muted">{fmtDur(sv.dur)}{sv.note ? ` · ${sv.note}` : ''}</small></div>
                  <span className="svc-price">{short(x.price)}</span>
                  <span className="svc-add">{on ? <Icon n="check" s={16} w={2.4} /> : <Icon n="plus" s={16} w={2} />}</span>
                </motion.button>
              )
            })}
          </div>
          <p className="muted small">قیمت‌ها به تومان و پایه‌اند؛ قیمت آرتیست‌های ستاره کمی بیشتر است.</p>
        </section>
      )}

      {tab === 'team' && (
        <section className="pad team">
          {team.map((a) => (
            <motion.button key={a.id} className="team-row" whileTap={{ scale: 0.98 }} onClick={() => nav.push({ type: 'artist', id: a.id })}>
              <Portrait a={a} size={58} />
              <div><b>{a.name} <Badge a={a} /></b><small dir="ltr" className="handle">@{a.handle}</small><small className="muted">{a.cats.map((c) => CAT[c].name).join(' · ')} · {fa(a.years)} سال سابقه</small></div>
              <Rating v={a.rating} />
            </motion.button>
          ))}
        </section>
      )}

      {tab === 'rev' && (
        <section className="pad">
          <ScoreSummary rating={s.rating} n={s.reviewsN} reviews={reviews} />
          <p className="note"><Icon n="shield" s={15} /> فقط کسانی که از بیوتی‌ست نوبت گرفته‌اند می‌توانند نظر بدهند.</p>
          {reviews.length ? reviews.map((r) => <ReviewItem key={r.id} r={r} />) : <Empty icon="chat" title="هنوز نظری نیست" />}
        </section>
      )}

      {tab === 'info' && (
        <section className="pad info">
          <p>{s.about}</p>
          <div className="mini-map"><DistrictMap city={s.city} salons={[s]} single /></div>
          <p className="muted"><Icon n="pin" s={14} /> {s.hood}، {area.name} — نشانی دقیق بعد از رزرو ارسال می‌شود.</p>
          <h4>امکانات</h4>
          <div className="amen">{s.amen.length ? s.amen.map((k) => <span key={k}><Icon n={AMEN[k].icon} s={16} /> {AMEN[k].name}</span>) : <span className="muted">—</span>}</div>
          <h4>ساعت کاری</h4>
          <p>شنبه تا پنجشنبه {hh(s.open)} تا {hh(s.close)} · جمعه‌ها با هماهنگی</p>
          <h4>قوانین لغو</h4>
          <p className="muted">لغو تا ۲۴ ساعت قبل رایگان است و بیعانه کامل برمی‌گردد.</p>
        </section>
      )}
      <div className="foot-space" />

      <AnimatePresence>
        <motion.div className="book-bar" initial={{ y: 80 }} animate={{ y: 0 }}>
          {cart.length ? (
            <div className="bb-sum"><b>{fa(cart.length)} خدمت · {toman(total)}</b><small>{fmtDur(dur)}</small></div>
          ) : <div className="bb-sum"><b>خدمات رو انتخاب کنید</b><small>یا مستقیم وقت بگیرید</small></div>}
          <motion.button className="btn primary" whileTap={{ scale: 0.96 }} onClick={() => nav.book({ salon: s.id, svc: cart })}>رزرو نوبت</motion.button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
