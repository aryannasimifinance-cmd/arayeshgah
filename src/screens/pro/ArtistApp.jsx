import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../../store'
import { Avatar, Badge, Empty, Icon, Rating, Sheet } from '../../components/ui'
import { Portrait } from '../../components/Art'
import { SV, fmtDur } from '../../lib/catalog'
import { SOURCE_NAME, agenda, clientBook, favSvc, venueOf } from '../../lib/agenda'
import { img } from '../../lib/photos'
import { addDays, dateLong, dateShort, dayNum, fa, haptic, hh, relDay, short, today, toman, wdShort } from '../../lib/util'
import { ReviewItem } from '../Salon'

const TABS = [
  { id: 'today', name: 'امروز', icon: 'sun' },
  { id: 'cal', name: 'تقویم', icon: 'cal' },
  { id: 'clients', name: 'مشتری‌ها', icon: 'users' },
  { id: 'me', name: 'درآمد و پروفایل', icon: 'wallet' },
]
const STATUS = { upcoming: ['در انتظار', ''], now: ['در حال انجام', 'now'], arrived: ['رسیده', 'now'], done: ['انجام شد', 'ok'], noshow: ['نیامد', 'bad'] }
const svcName = (a) => a.svc.map((s) => SV[s].name).join(' + ')

// پنل آرتیست: نوبت‌ها، تقویم، مشتری‌ها و درآمد
export default function ArtistApp({ id }) {
  const { db, logout } = useStore()
  const a = db.artists.find((x) => x.id === id)
  const [tab, setTab] = useState('today')
  const [appt, setAppt] = useState(null)
  const [client, setClient] = useState(null)
  if (!a) return <Empty title="حساب پیدا نشد"><button className="btn primary" onClick={logout}>بازگشت</button></Empty>
  return (
    <div className="shell pro">
      <div className="tab-pages">
        {tab === 'today' && <Today a={a} onAppt={setAppt} />}
        {tab === 'cal' && <Calendar a={a} onAppt={setAppt} />}
        {tab === 'clients' && <Clients a={a} onClient={setClient} />}
        {tab === 'me' && <Me a={a} />}
      </div>
      <nav className="tabbar four">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => { haptic(); setTab(t.id) }}>
            <span className="tab-ico"><Icon n={t.icon} s={22} w={tab === t.id ? 2 : 1.6} /></span><span>{t.name}</span>
          </button>
        ))}
      </nav>
      <ApptSheet a={a} appt={appt} onClose={() => setAppt(null)} onClient={(c) => { setAppt(null); setClient(c) }} />
      <ClientSheet a={a} c={client} onClose={() => setClient(null)} />
    </div>
  )
}

function Head({ a, title, en }) {
  const { db } = useStore()
  const v = venueOf(db, a)
  return (
    <header className="pro-head">
      <Portrait a={a} size={44} ring={false} />
      <div><em className="en">{en}</em><h1>{title}</h1><small className="muted">{v.name || 'آزادکار · در منزل'}</small></div>
    </header>
  )
}

// ---------- امروز ----------
function Today({ a, onAppt }) {
  const { db, mark, toast } = useStore()
  const { list, off } = useMemo(() => agenda(db, a, today()), [db, a])
  const next = list.find((x) => x.status === 'now' || x.status === 'arrived') || list.find((x) => x.status === 'upcoming')
  const earned = list.filter((x) => x.status === 'done').reduce((s, x) => s + x.price, 0)
  const total = list.filter((x) => x.status !== 'noshow').reduce((s, x) => s + x.price, 0)
  const h = new Date().getHours()
  return (
    <div className="scroll">
      <Head a={a} en={h < 12 ? 'Good morning' : 'Have a lovely day'} title={`سلام ${a.name.split(' ')[0]} 🤍`} />
      <div className="pro-stats">
        <span><b>{fa(list.length)}</b><small>نوبت امروز</small></span>
        <span><b>{short(earned)}</b><small>درآمد تا الان</small></span>
        <span><b>{short(total)}</b><small>پیش‌بینی امروز</small></span>
      </div>
      {off ? <div className="pad"><Empty icon="moon" title="امروز مرخصی هستید" text="از تب تقویم می‌تونید روزهای کاری رو تغییر بدید." /></div> : <>
        {next && (
          <motion.section className="next-client" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <small>{next.status === 'upcoming' ? 'مشتری بعدی' : 'الان'} · ساعت {hh(next.start)}</small>
            <div className="nc-row" onClick={() => onAppt(next)}>
              <Avatar u={next.client} size={52} />
              <div><b>{next.client.name}</b><span>{svcName(next)}</span><small>{fmtDur(next.dur)} · {toman(next.price)}</small></div>
            </div>
            {next.note && <p className="nc-note"><Icon n="chat" s={14} /> {next.note}</p>}
            <div className="nc-actions">
              <button onClick={() => toast({ icon: '📞', text: `تماس با ${next.client.name}` })}><Icon n="phone" s={16} /> تماس</button>
              {next.status !== 'arrived' && <button onClick={() => { mark(next.id, 'arrived'); toast({ icon: '👋', text: 'رسیدن مشتری ثبت شد' }) }}><Icon n="check" s={16} /> رسید</button>}
              <button className="main" onClick={() => { mark(next.id, 'done'); haptic(20); toast({ icon: '✨', text: 'نوبت انجام شد' }) }}>انجام شد</button>
            </div>
          </motion.section>
        )}
        <div className="sec-title"><div><em className="en">Timeline</em><h2>برنامه‌ی امروز</h2></div><small className="muted">{dateLong(today())}</small></div>
        <Timeline list={list} onAppt={onAppt} />
      </>}
      <div className="foot-space" />
    </div>
  )
}

function Timeline({ list, onAppt }) {
  if (!list.length) return <div className="pad"><Empty icon="cal" title="نوبتی نیست" /></div>
  return (
    <div className="timeline">
      {list.map((x) => (
        <button key={x.id} className={`tl-row st-${x.status}`} onClick={() => onAppt(x)}>
          <span className="tl-time"><b>{hh(x.start)}</b><small>{hh(x.start + x.dur / 60)}</small></span>
          <span className="tl-dot" />
          <div className="tl-card">
            <Avatar u={x.client} size={34} />
            <div><b>{x.client.name}</b><small>{svcName(x)}</small></div>
            <span className={`st ${STATUS[x.status][1]}`}>{STATUS[x.status][0]}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

// ---------- تقویم ----------
function Calendar({ a, onAppt }) {
  const { db, toggleOff, toast } = useStore()
  const [date, setDate] = useState(today())
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today(), i)), [])
  const { list, off } = useMemo(() => agenda(db, a, date), [db, a, date])
  const v = venueOf(db, a)
  const mine = a.off?.includes(date)
  // جاهای خالی بین نوبت‌ها
  const rows = []
  if (!off) {
    let t = v.open
    list.forEach((x) => { if (x.start - t >= 0.5) rows.push({ gap: true, start: t, end: x.start }); rows.push(x); t = Math.max(t, x.start + x.dur / 60) })
    if (v.close - t >= 0.5) rows.push({ gap: true, start: t, end: v.close })
  }
  const busyMin = list.reduce((s, x) => s + x.dur, 0)
  return (
    <div className="scroll">
      <Head a={a} en="Schedule" title="تقویم من" />
      <div className="pad-x">
        <div className="days">
          {days.map((d) => {
            const o = a.off?.includes(d)
            return <button key={d} className={`${date === d ? 'on' : ''} ${o ? 'offd' : ''}`} onClick={() => setDate(d)}><small>{relDay(d) === 'امروز' || relDay(d) === 'فردا' ? relDay(d) : wdShort(d)}</small><b>{dayNum(d)}</b></button>
          })}
        </div>
        <div className="cal-sum">
          <div><b>{dateShort(date)}</b><small className="muted">{off ? 'تعطیل' : `${fa(list.length)} نوبت · ${fmtDur(busyMin) || '۰'} کار`}</small></div>
          <label className="switch-row"><span>{mine ? 'مرخصی هستم' : 'روز کاری'}</span>
            <input type="checkbox" checked={!mine} onChange={() => { toggleOff(a.id, date); toast({ icon: mine ? '💼' : '🌙', text: mine ? 'این روز دوباره کاری شد' : 'مرخصی ثبت شد؛ مشتری‌ها این روز را آزاد نمی‌بینند' }) }} /></label>
        </div>
      </div>
      {off ? <div className="pad"><Empty icon="moon" title={mine ? 'مرخصی' : 'سالن تعطیل است'} /></div> : (
        <div className="day-list">
          {rows.map((x, i) => x.gap ? (
            <div key={'g' + i} className="gap-row"><span>{hh(x.start)}</span><i>آزاد · {fmtDur((x.end - x.start) * 60)}</i></div>
          ) : (
            <button key={x.id} className={`appt-row st-${x.status}`} onClick={() => onAppt(x)}>
              <span className="ar-time"><b>{hh(x.start)}</b><small>{fmtDur(x.dur)}</small></span>
              <div><b>{x.client.name}</b><small>{svcName(x)}</small></div>
              <span className={`src src-${x.source}`}>{SOURCE_NAME[x.source]}</span>
            </button>
          ))}
        </div>
      )}
      <div className="foot-space" />
    </div>
  )
}

// ---------- مشتری‌ها ----------
function Clients({ a, onClient }) {
  const { db } = useStore()
  const [t, setT] = useState('')
  const all = useMemo(() => clientBook(db, [a], 45), [db, a])
  const list = all.filter((c) => !t || c.name.includes(t) || c.phone.includes(t))
  return (
    <div className="scroll">
      <Head a={a} en="My clients" title="مشتری‌های من" />
      <div className="pad-x">
        <div className="pro-stats inline">
          <span><b>{fa(all.length)}</b><small>مشتری</small></span>
          <span><b>{fa(all.filter((c) => c.visits >= 3).length)}</b><small>مشتری ثابت</small></span>
          <span><b>{fa(all.filter((c) => c.next).length)}</b><small>نوبت آینده</small></span>
        </div>
        <label className="search-in"><Icon n="search" s={17} /><input value={t} onChange={(e) => setT(e.target.value)} placeholder="اسم یا شماره" /></label>
      </div>
      <div className="client-list">
        {list.map((c) => (
          <button key={c.id} onClick={() => onClient(c)}>
            <Avatar u={c} size={42} />
            <div><b>{c.name}{c.visits > 2 && <span className="loyal">ثابت</span>}</b><small className="muted">{c.last ? `آخرین: ${SV[c.last.svc[0]].name} · ${relDay(c.last.date)}` : 'مشتری جدید'}</small></div>
            <span className="cl-n"><b>{fa(c.visits)}</b><small>بار</small></span>
          </button>
        ))}
      </div>
      <div className="foot-space" />
    </div>
  )
}

// ---------- درآمد و پروفایل ----------
function Me({ a }) {
  const { db, logout } = useStore()
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = addDays(today(), i - 13)
    return { d, v: agenda(db, a, d).list.reduce((s, x) => s + x.price, 0) }
  }), [db, a])
  const max = Math.max(1, ...days.map((x) => x.v))
  const week = days.slice(7).reduce((s, x) => s + x.v, 0)
  const prev = days.slice(0, 7).reduce((s, x) => s + x.v, 0)
  const share = a.salon ? 0.6 : 0.9 // سهم آرتیست از مبلغ نوبت
  const reviews = db.reviews.filter((r) => r.artist === a.id).slice(0, 4)
  return (
    <div className="scroll">
      <div className="pro-banner"><img src={img(a.works[0].ph)} alt="" /></div>
      <section className="pro-card">
        <Portrait a={a} size={78} />
        <h1>{a.name}</h1>
        <small className="handle" dir="ltr">@{a.handle}</small>
        <div className="art-badges"><Badge a={a} /></div>
        <div className="pro-stats inline">
          <span><b>{fa(a.rating.toFixed(1))}</b><small>امتیاز</small></span>
          <span><b>{a.followers.toLocaleString('fa-IR')}</b><small>دنبال‌کننده</small></span>
          <span><b>{fa(a.reviewsN)}</b><small>نظر</small></span>
        </div>
      </section>
      <div className="sec-title"><div><em className="en">Earnings</em><h2>درآمد</h2></div></div>
      <div className="earn pad-x">
        <div className="earn-top">
          <div><small className="muted">این هفته (سهم شما ٪{fa(share * 100)})</small><b>{toman(Math.round(week * share / 1000) * 1000)}</b></div>
          <span className={`delta ${week >= prev ? 'up' : 'down'}`}>{week >= prev ? '▲' : '▼'} ٪{fa(Math.abs(Math.round(((week - prev) / Math.max(prev, 1)) * 100)))}</span>
        </div>
        <div className="mini-bars">
          {days.map((x) => <span key={x.d} title={x.d}><i style={{ height: `${(x.v / max) * 100}%` }} className={x.d === today() ? 'on' : ''} /><small>{dayNum(x.d)}</small></span>)}
        </div>
      </div>
      <div className="sec-title"><div><em className="en">Reviews</em><h2>نظر مشتری‌ها</h2></div><Rating v={a.rating} n={a.reviewsN} /></div>
      <div className="pad-x">{reviews.length ? reviews.map((r) => <ReviewItem key={r.id} r={r} showArtist={false} />) : <p className="muted">هنوز نظر مکتوبی نیست.</p>}</div>
      <div className="pad"><button className="btn ghost block" onClick={logout}><Icon n="logout" s={16} /> خروج</button></div>
      <div className="foot-space" />
    </div>
  )
}

// ---------- برگه‌ی نوبت ----------
function ApptSheet({ a, appt, onClose, onClient }) {
  const { db, mark, toast } = useStore()
  const c = appt && clientBook(db, [a], 45).find((x) => x.id === appt.client.id)
  return (
    <Sheet open={!!appt} onClose={onClose} title="جزئیات نوبت">
      {appt && (
        <div className="pad appt-detail">
          <button className="ad-client" onClick={() => onClient(c || appt.client)}>
            <Avatar u={appt.client} size={50} />
            <div><b>{appt.client.name}</b><small className="muted" dir="ltr">{appt.client.phone}</small>{c && <small>{fa(c.visits)} بار آمده · پرونده‌ی مشتری ‹</small>}</div>
          </button>
          <ul className="kv">
            <li><span>خدمت</span><b>{svcName(appt)}</b></li>
            <li><span>زمان</span><b>{relDay(appt.date)} · {hh(appt.start)} تا {hh(appt.start + appt.dur / 60)}</b></li>
            <li><span>مبلغ</span><b>{toman(appt.price)}</b></li>
            <li><span>منبع</span><b>{SOURCE_NAME[appt.source]}{appt.paid ? ` · بیعانه ${toman(appt.paid)} پرداخت شده` : ''}</b></li>
            {appt.note && <li><span>یادداشت</span><b>{appt.note}</b></li>}
          </ul>
          <div className="ad-actions">
            {['arrived', 'done', 'noshow'].map((s) => (
              <button key={s} className={`chip ${appt.status === s ? 'on' : ''}`} onClick={() => { mark(appt.id, s); toast({ icon: '✓', text: STATUS[s][0] }); onClose() }}>{STATUS[s][0]}</button>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  )
}

function ClientSheet({ a, c, onClose }) {
  const { db, toast } = useStore()
  const hist = useMemo(() => {
    if (!c) return []
    const out = []
    for (let i = -45; i <= 7; i++) agenda(db, a, addDays(today(), i)).list.forEach((x) => x.client.id === c.id && out.push(x))
    return out.reverse()
  }, [c, db, a])
  const fav = c?.svcs && favSvc(c)
  return (
    <Sheet open={!!c} onClose={onClose}>
      {c && (
        <div className="pad client-detail">
          <div className="cd-head"><Avatar u={c} size={64} /><h3>{c.name}</h3><small className="muted" dir="ltr">{c.phone}</small></div>
          <div className="pro-stats inline">
            <span><b>{fa(c.visits ?? 0)}</b><small>مراجعه</small></span>
            <span><b>{short(c.spend ?? 0)}</b><small>خرید (تومان)</small></span>
            <span><b>{fav ? SV[fav].name : '—'}</b><small>خدمت محبوب</small></span>
          </div>
          <div className="nc-actions"><button onClick={() => toast({ icon: '📞', text: 'تماس…' })}><Icon n="phone" s={16} /> تماس</button><button onClick={() => toast({ icon: '💬', text: 'پیامک یادآوری ارسال شد' })}><Icon n="chat" s={16} /> پیامک</button></div>
          <h4>سابقه</h4>
          {hist.map((x) => (
            <div key={x.id} className="hist-row"><span>{dateShort(x.date)}</span><b>{svcName(x)}</b><small className={x.date > today() ? 'up' : ''}>{x.date > today() ? 'آینده' : toman(x.price)}</small></div>
          ))}
        </div>
      )}
    </Sheet>
  )
}
