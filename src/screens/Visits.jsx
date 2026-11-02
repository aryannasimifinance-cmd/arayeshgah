import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Empty, Icon, Seg, Sheet } from '../components/ui'
import { Cover, Portrait } from '../components/Art'
import { CRITERIA, REVIEW_TAGS, SV } from '../lib/catalog'
import { dateLong, diffDays, fa, haptic, hh, relDay, today, toman } from '../lib/util'
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
  const list = tab === 'up' ? up : past

  return (
    <div className="scroll visits">
      <header className="top plain"><div><em className="en">My Appointments</em><h1>نوبت‌های من</h1></div></header>
      {pending.length > 0 && (
        <motion.button className="review-nudge" whileTap={{ scale: 0.98 }} onClick={() => setRev(pending[0])}>
          <span className="rn-stars"><Icon n="star" s={20} fill="currentColor" w={0} /></span>
          <div><b>به {db.artists.find((a) => a.id === pending[0].artist).name} امتیاز بدید</b><small>نظر شما به بقیه کمک می‌کنه · ۵۰ هزار تومان اعتبار هدیه</small></div>
          <Icon n="fwd" s={18} />
        </motion.button>
      )}
      <div className="pad-x"><Seg id="vtab" items={[['up', `پیش رو (${fa(up.length)})`], ['past', 'گذشته']]} value={tab} onChange={setTab} /></div>
      <div className="pad">
        {list.length === 0 && <Empty icon="cal" title={tab === 'up' ? 'نوبتی ندارید' : 'هنوز سابقه‌ای نیست'} text="وقتشه یه کم به خودتون برسید ✨"><button className="btn primary" onClick={() => nav.go('book')}>رزرو نوبت</button></Empty>}
        {list.map((b) => {
          const s = db.salons.find((x) => x.id === b.salon)
          const a = db.artists.find((x) => x.id === b.artist)
          const d = diffDays(b.date, today())
          return (
            <article key={b.id} className={`visit ${b.status}`}>
              <div className="v-cover" onClick={() => (s ? nav.push({ type: 'salon', id: s.id }) : nav.push({ type: 'artist', id: a.id }))}>
                {s ? <Cover salon={s} ratio={0.42} glyph={false} /> : <div className="v-home" />}
                <span className="v-when">{b.status === 'confirmed' ? (d <= 1 ? relDay(b.date) : `${fa(d)} روز دیگه`) : b.status === 'cancelled' ? 'لغو شده' : 'انجام شد'}</span>
              </div>
              <div className="v-body">
                <h3>{s ? s.name : 'خدمات در منزل'}</h3>
                <p className="muted"><Icon n="cal" s={14} /> {dateLong(b.date)} · {hh(b.start)}</p>
                <p className="v-who"><Portrait a={a} size={26} ring={false} /> {a.name} · {b.svc.map((id) => SV[id].name).join(' + ')}</p>
                <p className="v-money"><span>بیعانه {toman(b.paid)}</span><span className="muted">از {toman(b.price)}</span></p>
                <div className="v-actions">
                  {b.status === 'confirmed' && <>
                    <button className="btn ghost sm" onClick={() => toast({ icon: '🧭', text: 'مسیریابی در نقشه باز می‌شود' })}><Icon n="route" s={15} /> مسیر</button>
                    <button className="btn ghost sm" onClick={() => toast({ icon: '📞', text: 'تماس با سالن' })}><Icon n="phone" s={15} /> تماس</button>
                    <button className="btn ghost sm danger" onClick={() => setCx(b)}>لغو</button>
                  </>}
                  {b.status === 'done' && !b.reviewed && <button className="btn primary sm" onClick={() => setRev(b)}><Icon n="star" s={15} /> ثبت نظر</button>}
                  {b.status === 'done' && b.reviewed && <span className="muted small"><Icon n="check" s={14} /> نظر شما ثبت شده</span>}
                  {b.status !== 'confirmed' && <button className="btn ghost sm" onClick={() => nav.book({ salon: b.salon || undefined, freelancer: b.salon ? undefined : b.artist, artist: b.artist, svc: b.svc })}>رزرو دوباره</button>}
                </div>
              </div>
            </article>
          )
        })}
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
