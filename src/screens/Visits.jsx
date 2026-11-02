import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Empty, Icon, Seg, Sheet, Stars } from '../components/ui'
import { img } from '../lib/photos'
import { Portrait } from '../components/Art'
import { CRITERIA, REVIEW_TAGS, SV } from '../lib/catalog'
import { dateShort, fa, haptic, hh, monthName, relDay, toDate, toman } from '../lib/util'
import { celebrate } from '../lib/fx'

const WORDS = ['', 'ضعیف', 'متوسط', 'خوب', 'خیلی خوب', 'عالی']

// برگه‌ی نظر: امتیاز جدا برای هر معیار، برچسب‌ها و متن
export function ReviewSheet({ b, onClose }) {
  const { db, me, review, updateMe, toast } = useStore()
  const [sc, setSc] = useState({ quality: 0, hygiene: 0, manner: 0, time: 0, value: 0 })
  const [tags, setTags] = useState([])
  const [text, setText] = useState('')
  const a = b && db.artists.find((x) => x.id === b.artist)
  const ok = Object.values(sc).every(Boolean)
  const all = (v) => setSc(Object.fromEntries(CRITERIA.map((c) => [c.id, v])))
  const submit = () => {
    review(b.id, { scores: sc, text: text.trim() || 'بدون متن', tags })
    updateMe({ wallet: me.wallet + 50000 })
    celebrate(); toast({ icon: '🤍', text: 'ممنون از نظرتون! ۵۰٬۰۰۰ تومان اعتبار هدیه گرفتید' }); onClose()
  }
  return (
    <Sheet open={!!b} onClose={onClose} title="تجربه‌تون چطور بود؟">
      {b && (
        <div className="pad review-form">
          <div className="rf-who"><Portrait a={a} size={44} /><div><b>{a.name}</b><small className="muted">{b.svc.map((id) => SV[id].name).join(' + ')}</small></div></div>
          <div className="rf-quick"><span className="muted small">امتیاز سریع به همه:</span>{[5, 4, 3].map((v) => <button key={v} className="chip" onClick={() => all(v)}>{fa(v)} ★</button>)}</div>
          {CRITERIA.map((c) => (
            <div key={c.id} className="rf-row">
              <span>{c.name}</span>
              <div className="rf-stars">
                {[1, 2, 3, 4, 5].map((v) => (
                  <motion.button key={v} whileTap={{ scale: 1.3 }} className={sc[c.id] >= v ? 'on' : ''} onClick={() => { haptic(6); setSc({ ...sc, [c.id]: v }) }} aria-label={`${v}`}>
                    <Icon n="star" s={22} fill={sc[c.id] >= v ? 'currentColor' : 'none'} w={1.3} />
                  </motion.button>
                ))}
              </div>
              <small className="muted">{WORDS[sc[c.id]]}</small>
            </div>
          ))}
          <h4>چه چیزی بیشتر به چشم‌تون اومد؟</h4>
          <div className="chips wrap">{REVIEW_TAGS.map((t) => <button key={t} className={`chip ${tags.includes(t) ? 'on' : ''}`} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</button>)}</div>
          <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="چند خط برای بقیه‌ی خانم‌ها بنویسید…" />
          <button className="photo-add" onClick={() => toast({ icon: '📷', text: 'افزودن عکس در نسخه‌ی بعد' })}><Icon n="camera" s={18} /> افزودن عکس نتیجه</button>
          <button className="btn primary block" disabled={!ok} onClick={submit}>ثبت نظر</button>
        </div>
      )}
    </Sheet>
  )
}

const yearOf = (d) => new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric' }).format(toDate(d))
const ST = { done: ['انجام شد', 'ok'], cancelled: ['لغو شد', 'bad'], confirmed: ['تأییدشده', ''] }

// یک ردیف نوبت: عکس کوچک، خدمت، سالن و آرتیست، زمان، وضعیت و کار بعدی
function Row({ b, onReview, onCancel }) {
  const { db } = useStore()
  const nav = useNav()
  const s = db.salons.find((x) => x.id === b.salon)
  const a = db.artists.find((x) => x.id === b.artist)
  const mine = db.reviews.find((r) => r.mine && r.salon === b.salon && r.artist === b.artist)
  const score = mine && Object.values(mine.scores).reduce((x, y) => x + y, 0) / 5
  return (
    <article className={`vrow v-${b.status}`}>
      <button className="vr-main" onClick={() => (s ? nav.push({ type: 'salon', id: s.id }) : nav.push({ type: 'artist', id: a.id }))}>
        <span className="vr-ph"><img src={img(s ? s.photos[0] : a.works[0].ph)} alt="" /></span>
        <div>
          <b>{b.svc.map((id) => SV[id].name).join(' + ')}</b>
          <small>{s ? s.name : 'در منزل'} · {a?.name}</small>
          <small className="muted">{dateShort(b.date)} · ساعت {hh(b.start)} · {toman(b.price)}</small>
        </div>
        <span className={`st ${ST[b.status][1]}`}>{b.status === 'confirmed' ? relDay(b.date) : ST[b.status][0]}</span>
      </button>
      <div className="vr-foot">
        {b.status === 'confirmed' && <button className="danger" onClick={() => onCancel(b)}>لغو نوبت</button>}
        {b.status === 'done' && !b.reviewed && <button className="hl" onClick={() => onReview(b)}><Icon n="star" s={13} /> امتیاز بدید</button>}
        {b.status === 'done' && b.reviewed && <span className="muted"><Stars v={score || 5} s={11} /> نظر شما</span>}
        {b.status !== 'confirmed' && <button onClick={() => nav.book({ salon: b.salon || undefined, freelancer: b.salon ? undefined : b.artist, artist: b.artist, svc: b.svc })}><Icon n="route" s={13} /> رزرو دوباره</button>}
      </div>
    </article>
  )
}

export default function Visits() {
  const { db, cancel, toast } = useStore()
  const nav = useNav()
  const [tab, setTab] = useState('up')
  const [rev, setRev] = useState(null)
  const [cx, setCx] = useState(null)
  const mine = db.bookings.filter((b) => b.user === 'me')
  const up = mine.filter((b) => b.status === 'confirmed').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  const past = mine.filter((b) => b.status !== 'confirmed').sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))
  const pending = past.filter((b) => b.status === 'done' && !b.reviewed)
  const next = up[0]
  const list = tab === 'up' ? up : past
  const groups = Object.entries(past.reduce((m, b) => { const k = `${monthName(b.date)} ${yearOf(b.date)}`; (m[k] ||= []).push(b); return m }, {}))

  return (
    <div className="scroll visits">
      <header className="top plain"><div><em className="en">My Appointments</em><h1>نوبت‌های من</h1></div></header>
      {next && (() => { const s = db.salons.find((x) => x.id === next.salon); const a = db.artists.find((x) => x.id === next.artist); return (
        <section className="next-big">
          <small>نوبت بعدی شما</small>
          <div className="nb-row">
            <div className="nc-date"><b>{relDay(next.date)}</b><span>{hh(next.start)}</span></div>
            <div><b>{next.svc.map((id) => SV[id].name).join(' + ')}</b><span>{s ? s.name : 'خدمات در منزل'} · {a?.name}</span></div>
          </div>
          <div className="nc-actions"><button onClick={() => toast({ icon: '🧭', text: 'مسیریابی باز می‌شود' })}><Icon n="route" s={15} /> مسیر</button><button onClick={() => toast({ icon: '📅', text: 'به تقویم گوشی اضافه شد' })}><Icon n="cal" s={15} /> تقویم</button><button onClick={() => s && nav.push({ type: 'salon', id: s.id })}><Icon n="fwd" s={15} /> سالن</button></div>
        </section>
      ) })()}
      {pending.length > 0 && (
        <motion.button className="review-nudge" whileTap={{ scale: 0.98 }} onClick={() => setRev(pending[0])}>
          <span className="rn-stars"><Icon n="star" s={20} fill="currentColor" w={0} /></span>
          <div><b>به {db.artists.find((a) => a.id === pending[0].artist).name} امتیاز بدید</b><small>نظر شما به بقیه کمک می‌کنه · ۵۰ هزار تومان اعتبار هدیه</small></div>
          <Icon n="fwd" s={18} />
        </motion.button>
      )}
      <div className="pad-x"><Seg id="vtab" items={[['up', `پیش رو (${fa(up.length)})`], ['past', 'گذشته']]} value={tab} onChange={setTab} /></div>
      <div className="pad">
        {list.length === 0 && <Empty icon="cal" title={tab === 'up' ? 'نوبتی ندارید' : 'هنوز سابقه‌ای نیست'} text="وقتشه یه کم به خودتون برسید ✨"><button className="btn primary" onClick={() => nav.go('search')}>رزرو نوبت</button></Empty>}
        {tab === 'up' && list.slice(1).map((b) => <Row key={b.id} b={b} onCancel={setCx} />)}
        {tab === 'up' && list.length === 1 && <p className="muted small center">نوبت دیگری ندارید.</p>}
        {tab === 'past' && groups.map(([m, items]) => (
          <section key={m} className="v-month">
            <h4>{m}<small>{fa(items.length)} نوبت</small></h4>
            {items.map((b) => <Row key={b.id} b={b} onReview={setRev} />)}
          </section>
        ))}
      </div>
      <div className="foot-space" />
      <ReviewSheet b={rev} onClose={() => setRev(null)} />
      <Sheet open={!!cx} onClose={() => setCx(null)} title="لغو نوبت؟">
        {cx && (
          <div className="pad">
            <p>بیعانه‌ی {toman(cx.paid)} به کیف پول شما برمی‌گردد.</p>
            <div className="sheet-foot in">
              <button className="btn ghost" onClick={() => setCx(null)}>منصرف شدم</button>
              <button className="btn danger" onClick={() => { cancel(cx.id); setCx(null); toast({ icon: '↩️', text: 'نوبت لغو شد و بیعانه برگشت' }) }}>لغو نوبت</button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
