import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../../store'
import { Avatar, Badge, Empty, Icon, Sheet, Stars } from '../../components/ui'
import { Portrait } from '../../components/Art'
import { Logo } from '../../components/Logo'
import { ThemeToggle } from '../../lib/theme'
import { CAT, SV, fmtDur } from '../../lib/catalog'
import { SOURCE_NAME, agenda, clientBook, dayTotals, favSvc } from '../../lib/agenda'
import { KINDS } from '../../lib/seed'
import { img } from '../../lib/photos'
import { PCATS, PCAT, SHOP_PH, lastDays } from '../../lib/market'
import { addDays, ago, dateLong, dateShort, dayNum, fa, haptic, hh, relDay, short, today, toman, wdShort } from '../../lib/util'

const NAV = [
  { id: 'overview', name: 'نمای کلی', icon: 'grid' },
  { id: 'calendar', name: 'تقویم آرتیست‌ها', icon: 'cal' },
  { id: 'bookings', name: 'نوبت‌ها', icon: 'list' },
  { id: 'team', name: 'تیم', icon: 'users' },
  { id: 'services', name: 'خدمات و قیمت', icon: 'tag' },
  { id: 'clients', name: 'مشتری‌ها', icon: 'heart' },
  { id: 'reviews', name: 'نظرها', icon: 'star' },
  { id: 'shop', name: 'فروشگاه من', icon: 'bag' },
  { id: 'finance', name: 'مالی', icon: 'money' },
]
const COMMISSION = 0.1 // کارمزد بیوتی‌ست فقط روی نوبت‌های آنلاین
const svcName = (x) => x.svc.map((s) => SV[s].name).join(' + ')
const Kpi = ({ label, value, sub, icon }) => <div className="kpi"><div><small>{label}</small><Icon n={icon} s={18} /></div><b>{value}</b>{sub && <span>{sub}</span>}</div>
const Panel = ({ title, action, children, className = '' }) => <section className={`panel ${className}`}>{(title || action) && <div className="panel-head"><h3>{title}</h3>{action}</div>}{children}</section>

export default function Manager({ id }) {
  const { db, logout } = useStore()
  const s = db.salons.find((x) => x.id === id)
  const [sec, setSec] = useState('overview')
  const [menu, setMenu] = useState(false)
  const [walk, setWalk] = useState(null)
  const [appt, setAppt] = useState(null)
  if (!s) return <Empty title="سالن پیدا نشد"><button className="btn primary" onClick={logout}>بازگشت</button></Empty>
  const team = s.artists.map((a) => db.artists.find((x) => x.id === a))
  const pending = db.reviews.filter((r) => r.salon === s.id && !r.reply).length
  const cur = NAV.find((n) => n.id === sec)
  const props = { s, team, go: setSec, onWalk: setWalk, onAppt: setAppt }
  return (
    <div className="dash">
      <aside className={`dash-side ${menu ? 'open' : ''}`}>
        <Logo size={20} light />
        <div className="ds-salon"><img src={img(s.photos[0])} alt="" /><div><b>{s.name}</b><small>{KINDS[s.kind].name} · {s.hood}</small></div></div>
        <nav>
          {NAV.map((n) => (
            <button key={n.id} className={sec === n.id ? 'on' : ''} onClick={() => { setSec(n.id); setMenu(false) }}>
              <Icon n={n.icon} s={18} /><span>{n.name}</span>{n.id === 'reviews' && pending > 0 && <i>{fa(pending)}</i>}
            </button>
          ))}
        </nav>
        <ThemeToggle />
        <button className="ds-out" onClick={logout}><Icon n="logout" s={16} /> خروج</button>
      </aside>
      {menu && <div className="ds-scrim" onClick={() => setMenu(false)} />}
      <main className="dash-main">
        <header className="dash-head">
          <button className="icon-btn ds-burger" onClick={() => setMenu(true)} aria-label="منو"><Icon n="list" /></button>
          <div className="grow"><h1>{cur.name}</h1><p className="muted">{dateLong(today())}</p></div>
          <button className="btn primary" onClick={() => setWalk({ date: today() })}><Icon n="plus" s={16} /> نوبت حضوری</button>
        </header>
        <motion.div key={sec} className="dash-body" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {sec === 'overview' && <Overview {...props} />}
          {sec === 'calendar' && <Calendar {...props} />}
          {sec === 'bookings' && <Bookings {...props} />}
          {sec === 'team' && <Team {...props} />}
          {sec === 'services' && <Services {...props} />}
          {sec === 'clients' && <Clients {...props} />}
          {sec === 'reviews' && <Reviews {...props} />}
          {sec === 'finance' && <Finance {...props} />}
          {sec === 'shop' && <MyShop {...props} />}
        </motion.div>
      </main>
      <WalkIn s={s} team={team} init={walk} onClose={() => setWalk(null)} />
      <ApptSheet appt={appt} team={team} onClose={() => setAppt(null)} />
    </div>
  )
}

// ---------- نمای کلی ----------
function Overview({ s, team, go, onAppt }) {
  const { db } = useStore()
  const t = useMemo(() => dayTotals(db, team, today()), [db, team])
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => { const d = addDays(today(), i - 13); return { d, ...dayTotals(db, team, d) } }), [db, team])
  const week = days.slice(7).reduce((a, x) => a + x.revenue, 0), prev = days.slice(0, 7).reduce((a, x) => a + x.revenue, 0)
  const now = new Date().getHours() + new Date().getMinutes() / 60
  const next = team.flatMap((a) => agenda(db, a, today()).list.map((x) => ({ ...x, a }))).filter((x) => x.start + x.dur / 60 > now).sort((a, b) => a.start - b.start).slice(0, 6)
  const reviews = db.reviews.filter((r) => r.salon === s.id).sort((a, b) => b.t - a.t).slice(0, 3)
  return (
    <>
      <div className="kpis">
        <Kpi label="نوبت امروز" value={fa(t.count)} sub={`${fa(next.length)} نوبت باقی‌مانده`} icon="cal" />
        <Kpi label="درآمد امروز" value={short(t.revenue)} sub="تومان" icon="money" />
        <Kpi label="درآمد این هفته" value={short(week)} sub={<span className={week >= prev ? 'up' : 'down'}>{week >= prev ? '▲' : '▼'} ٪{fa(Math.abs(Math.round(((week - prev) / Math.max(prev, 1)) * 100)))} نسبت به هفته‌ی قبل</span>} icon="trend" />
        <Kpi label="پر بودن امروز" value={`٪${fa(Math.round(t.occ * 100))}`} sub={`امتیاز سالن ${fa(s.rating.toFixed(1))} از ${s.reviewsN.toLocaleString('fa-IR')} نظر`} icon="sparkle" />
      </div>
      <div className="grid-2">
        <Panel title="درآمد ۱۴ روز گذشته">
          <div className="bars">{days.map((x) => <span key={x.d} title={toman(x.revenue)}><i style={{ height: `${(x.revenue / Math.max(...days.map((y) => y.revenue), 1)) * 100}%` }} className={x.d === today() ? 'on' : ''} /><small>{dayNum(x.d)}</small></span>)}</div>
        </Panel>
        <Panel title="امروز هر آرتیست" action={<button className="link" onClick={() => go('calendar')}>تقویم</button>}>
          {team.map((a) => { const g = agenda(db, a, today()); const m = g.list.reduce((x, y) => x + y.dur, 0); return (
            <div key={a.id} className="load-row"><Portrait a={a} size={34} ring={false} /><div><b>{a.name}</b><span className="load"><i style={{ width: `${Math.min(100, (m / ((s.close - s.open) * 60)) * 100)}%` }} /></span></div><small>{g.off ? 'مرخصی' : `${fa(g.list.length)} نوبت`}</small></div>
          ) })}
        </Panel>
      </div>
      <div className="grid-2">
        <Panel title="نوبت‌های بعدی امروز" action={<button className="link" onClick={() => go('bookings')}>همه</button>}>
          {next.length ? next.map((x) => (
            <button key={x.id} className="row-btn" onClick={() => onAppt(x)}><b className="time">{hh(x.start)}</b><Avatar u={x.client} size={30} /><span className="grow"><b>{x.client.name}</b><small className="muted">{svcName(x)} · {x.a.name}</small></span><span className={`src src-${x.source}`}>{SOURCE_NAME[x.source]}</span></button>
          )) : <p className="muted">برای امروز نوبتی باقی نمانده.</p>}
        </Panel>
        <Panel title="تازه‌ترین نظرها" action={<button className="link" onClick={() => go('reviews')}>همه</button>}>
          {reviews.map((r) => <div key={r.id} className="mini-rev"><Stars v={Object.values(r.scores).reduce((a, x) => a + x, 0) / 5} s={11} /><p>{r.text}</p><small className="muted">{r.user} · {ago(r.t)}{r.reply ? ' · پاسخ داده شد' : ''}</small></div>)}
        </Panel>
      </div>
    </>
  )
}

// ---------- تقویم ----------
const ROW = 30 // پیکسل هر نیم‌ساعت
function Calendar({ s, team, onWalk, onAppt }) {
  const { db } = useStore()
  const [date, setDate] = useState(today())
  const days = Array.from({ length: 14 }, (_, i) => addDays(today(), i - 2))
  const hours = []
  for (let h = s.open; h < s.close; h += 0.5) hours.push(h)
  const now = new Date().getHours() + new Date().getMinutes() / 60
  return (
    <>
      <div className="day-strip">
        {days.map((d) => <button key={d} className={date === d ? 'on' : ''} onClick={() => setDate(d)}><small>{relDay(d) === 'امروز' || relDay(d) === 'فردا' || relDay(d) === 'دیروز' ? relDay(d) : wdShort(d)}</small><b>{dayNum(d)}</b></button>)}
      </div>
      <Panel className="cal-panel">
        <div className="mcal" style={{ gridTemplateColumns: `56px repeat(${team.length}, minmax(150px, 1fr))` }}>
          <div className="mc-corner" />
          {team.map((a) => <div key={a.id} className="mc-head"><Portrait a={a} size={30} ring={false} /><b>{a.name.split(' ')[0]}</b><small>{a.cats.map((c) => CAT[c].name).slice(0, 2).join('، ')}</small></div>)}
          <div className="mc-hours">{hours.map((h) => <span key={h} style={{ height: ROW }}>{h % 1 ? '' : hh(h)}</span>)}</div>
          {team.map((a) => {
            const g = agenda(db, a, date)
            return (
              <div key={a.id} className={`mc-col ${g.off ? 'off' : ''}`} style={{ height: hours.length * ROW }}>
                {hours.map((h) => <button key={h} className="mc-cell" style={{ top: (h - s.open) * 2 * ROW, height: ROW }} onClick={() => !g.off && onWalk({ date, artist: a.id, start: h })} aria-label="نوبت جدید" />)}
                {g.off && <span className="mc-off">مرخصی / تعطیل</span>}
                {g.list.map((x) => (
                  <button key={x.id} className={`mc-appt src-${x.source} st-${x.status} ${x.dur <= 30 ? 'short' : ''}`} style={{ top: (x.start - s.open) * 2 * ROW + 1, height: (x.dur / 30) * ROW - 3 }} onClick={() => onAppt({ ...x, a })}>
                    <b>{x.client.name}</b><small>{hh(x.start)} · {svcName(x)}</small>
                  </button>
                ))}
                {date === today() && now > s.open && now < s.close && <i className="mc-now" style={{ top: (now - s.open) * 2 * ROW }} />}
              </div>
            )
          })}
        </div>
        <div className="legend"><span className="src src-app">بیوتی‌ست</span><span className="src src-phone">تلفنی</span><span className="src src-walkin">حضوری</span><span className="muted small">روی جای خالی بزنید تا نوبت حضوری ثبت شود</span></div>
      </Panel>
    </>
  )
}

// ---------- نوبت‌ها ----------
function Bookings({ team, onAppt }) {
  const { db } = useStore()
  const [day, setDay] = useState(0)
  const [src, setSrc] = useState('')
  const d = addDays(today(), day)
  const list = team.flatMap((a) => agenda(db, a, d).list.map((x) => ({ ...x, a }))).filter((x) => !src || x.source === src).sort((a, b) => a.start - b.start)
  return (
    <Panel title={`${relDay(d)} · ${dateShort(d)}`} action={
      <div className="chips">
        {[-1, 0, 1, 2].map((i) => <button key={i} className={`chip ${day === i ? 'on' : ''}`} onClick={() => setDay(i)}>{relDay(addDays(today(), i))}</button>)}
        <span className="sep" />
        {['', 'app', 'phone', 'walkin'].map((k) => <button key={k} className={`chip soft ${src === k ? 'on' : ''}`} onClick={() => setSrc(k)}>{k ? SOURCE_NAME[k] : 'همه'}</button>)}
      </div>}>
      <table className="tbl">
        <thead><tr><th>ساعت</th><th>مشتری</th><th>خدمت</th><th>آرتیست</th><th>منبع</th><th>مبلغ</th><th>وضعیت</th></tr></thead>
        <tbody>{list.map((x) => (
          <tr key={x.id} onClick={() => onAppt(x)}>
            <td><b>{hh(x.start)}</b></td><td><span className="cell-u"><Avatar u={x.client} size={26} />{x.client.name}</span></td><td>{svcName(x)}</td><td>{x.a.name}</td>
            <td><span className={`src src-${x.source}`}>{SOURCE_NAME[x.source]}</span></td><td>{toman(x.price)}</td><td><span className={`st ${x.status}`}>{{ upcoming: 'در انتظار', now: 'در حال انجام', arrived: 'رسیده', done: 'انجام شد', noshow: 'نیامد' }[x.status]}</span></td>
          </tr>
        ))}</tbody>
      </table>
      {!list.length && <p className="muted pad">نوبتی نیست.</p>}
    </Panel>
  )
}

// ---------- تیم ----------
function Team({ s, team }) {
  const { db, toggleOff, toast } = useStore()
  return (
    <div className="team-grid">
      {team.map((a) => {
        const wk = Array.from({ length: 7 }, (_, i) => agenda(db, a, addDays(today(), -i)).list)
        const n = wk.reduce((x, l) => x + l.length, 0), rev = wk.reduce((x, l) => x + l.reduce((y, z) => y + z.price, 0), 0)
        const offToday = a.off?.includes(today())
        return (
          <Panel key={a.id} className="tm-card">
            <div className="tm-cover"><img src={img(a.works[0].ph)} alt="" /></div>
            <div className="tm-body">
              <Portrait a={a} size={64} />
              <h3>{a.name} <Badge a={a} /></h3>
              <small className="handle" dir="ltr">@{a.handle}</small>
              <small className="muted">{a.cats.map((c) => CAT[c].name).join(' · ')} · {fa(a.years)} سال سابقه</small>
              <div className="tm-stats"><span><b>{fa(n)}</b><small>نوبت ۷ روز</small></span><span><b>{short(rev)}</b><small>درآمد ۷ روز</small></span><span><b>{fa(a.rating.toFixed(1))}</b><small>امتیاز</small></span></div>
              <label className="switch-row"><span>{offToday ? 'امروز مرخصی' : 'امروز سر کار'}</span><input type="checkbox" checked={!offToday} onChange={() => { toggleOff(a.id, today()); toast({ icon: '📅', text: 'برنامه‌ی امروز به‌روز شد' }) }} /></label>
            </div>
          </Panel>
        )
      })}
      <Panel className="tm-card add"><button onClick={() => toast({ icon: '✉️', text: 'دعوت‌نامه برای آرتیست جدید پیامک شد (دمو)' })}><Icon n="plus" s={26} /><b>افزودن آرتیست</b><small className="muted">با شماره موبایل دعوت کنید</small></button></Panel>
    </div>
  )
}

// ---------- خدمات و قیمت ----------
function Services({ s }) {
  const { updateSalon, toast } = useStore()
  const cats = [...new Set(s.svc.map((x) => SV[x.sid].cat))]
  const setPrice = (sid, v) => updateSalon(s.id, (x) => ({ svc: x.svc.map((y) => (y.sid === sid ? { ...y, price: v } : y)) }))
  return (
    <div className="grid-2 wide-first">
      <Panel title="منوی خدمات">
        {cats.map((c) => (
          <div key={c} className="svc-group">
            <h4>{CAT[c].name}</h4>
            {s.svc.filter((x) => SV[x.sid].cat === c).map((x) => (
              <div key={x.sid} className="svc-edit"><span>{SV[x.sid].name}<small className="muted"> · {fmtDur(SV[x.sid].dur)}</small></span>
                <label><input type="number" step="50000" value={x.price} onChange={(e) => setPrice(x.sid, Math.max(0, +e.target.value))} /><small>تومان</small></label></div>
            ))}
          </div>
        ))}
      </Panel>
      <div>
        <Panel title="تخفیف این هفته">
          <p className="muted small">روی کارت سالن در اپ دیده می‌شود.</p>
          <div className="chips wrap">
            <button className={`chip ${!s.offer ? 'on' : ''}`} onClick={() => updateSalon(s.id, () => ({ offer: null }))}>بدون تخفیف</button>
            {cats.map((c) => <button key={c} className={`chip ${s.offer?.cat === c ? 'on' : ''}`} onClick={() => updateSalon(s.id, () => ({ offer: { cat: c, pct: s.offer?.pct || 15 } }))}>{CAT[c].name}</button>)}
          </div>
          {s.offer && <div className="chips">{[10, 15, 20, 25, 30].map((p) => <button key={p} className={`chip soft ${s.offer.pct === p ? 'on' : ''}`} onClick={() => updateSalon(s.id, (x) => ({ offer: { ...x.offer, pct: p } }))}>٪{fa(p)}</button>)}</div>}
        </Panel>
        <Panel title="ساعت کاری">
          <div className="hours-edit">
            <label>از<select value={s.open} onChange={(e) => updateSalon(s.id, () => ({ open: +e.target.value }))}>{[8, 9, 10, 11].map((h) => <option key={h} value={h}>{hh(h)}</option>)}</select></label>
            <label>تا<select value={s.close} onChange={(e) => updateSalon(s.id, () => ({ close: +e.target.value }))}>{[19, 20, 21, 22, 23].map((h) => <option key={h} value={h}>{hh(h)}</option>)}</select></label>
          </div>
          <button className="btn ghost sm" onClick={() => toast({ icon: '✓', text: 'ذخیره شد' })}>ذخیره</button>
        </Panel>
      </div>
    </div>
  )
}

// ---------- مشتری‌ها ----------
function Clients({ team }) {
  const { db } = useStore()
  const [t, setT] = useState('')
  const all = useMemo(() => clientBook(db, team, 45), [db, team])
  const list = all.filter((c) => !t || c.name.includes(t) || c.phone.includes(t))
  const art = (c) => db.artists.find((a) => a.id === Object.entries(c.artists).sort((x, y) => y[1] - x[1])[0]?.[0])
  return (
    <Panel title={`${fa(all.length)} مشتری · ${fa(all.filter((c) => c.visits >= 3).length)} مشتری ثابت`} action={<label className="search-in sm"><Icon n="search" s={15} /><input value={t} onChange={(e) => setT(e.target.value)} placeholder="جستجوی مشتری" /></label>}>
      <table className="tbl">
        <thead><tr><th>مشتری</th><th>موبایل</th><th>مراجعه</th><th>خرید</th><th>آخرین بار</th><th>خدمت محبوب</th><th>آرتیست</th><th>نوبت بعدی</th></tr></thead>
        <tbody>{list.map((c) => (
          <tr key={c.id}><td><span className="cell-u"><Avatar u={c} size={26} />{c.name}</span></td><td dir="ltr" className="muted">{c.phone}</td><td>{fa(c.visits)}</td><td>{short(c.spend)}</td>
            <td>{c.last ? dateShort(c.last.date) : '—'}</td><td>{favSvc(c) ? SV[favSvc(c)].name : '—'}</td><td>{art(c)?.name.split(' ')[0]}</td><td>{c.next ? `${relDay(c.next.date)} ${hh(c.next.start)}` : '—'}</td></tr>
        ))}</tbody>
      </table>
    </Panel>
  )
}

// ---------- نظرها ----------
function Reviews({ s }) {
  const { db, reply, toast } = useStore()
  const [txt, setTxt] = useState({})
  const list = db.reviews.filter((r) => r.salon === s.id).sort((a, b) => (!!a.reply - !!b.reply) || b.t - a.t)
  return (
    <div className="grid-2 wide-first">
      <Panel title="نظرها">
        {list.map((r) => {
          const a = db.artists.find((x) => x.id === r.artist)
          return (
            <div key={r.id} className="rev-row">
              <div className="rv-top"><Avatar u={{ name: r.user, hue: r.hue }} size={32} /><b>{r.user}</b><Stars v={Object.values(r.scores).reduce((x, y) => x + y, 0) / 5} s={12} /><small className="muted">{ago(r.t)} · {SV[r.svc]?.name} · {a?.name}</small></div>
              <p>{r.text}</p>
              {r.reply ? <div className="rv-reply"><b>پاسخ شما</b><p>{r.reply}</p></div> : (
                <div className="reply-box"><input value={txt[r.id] || ''} onChange={(e) => setTxt({ ...txt, [r.id]: e.target.value })} placeholder="پاسخ مؤدبانه بنویسید…" />
                  <button className="btn primary sm" disabled={!txt[r.id]?.trim()} onClick={() => { reply(r.id, txt[r.id].trim()); toast({ icon: '💬', text: 'پاسخ منتشر شد' }) }}>ارسال</button></div>
              )}
            </div>
          )
        })}
      </Panel>
      <Panel title="امتیاز سالن">
        <div className="big-score"><b>{fa(s.rating.toFixed(1))}</b><Stars v={s.rating} s={16} /><small className="muted">{s.reviewsN.toLocaleString('fa-IR')} نظر</small></div>
        <p className="muted small">به نظرهای بی‌پاسخ زودتر جواب بدید؛ پاسخ مدیر در صفحه‌ی سالن زیر همان نظر دیده می‌شود.</p>
      </Panel>
    </div>
  )
}

// ---------- مالی ----------
function Finance({ team }) {
  const { db } = useStore()
  const days = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = addDays(today(), i - 29)
    const l = team.flatMap((a) => agenda(db, a, d).list)
    const by = (k) => l.filter((x) => x.source === k).reduce((s, x) => s + x.price, 0)
    return { d, app: by('app'), phone: by('phone'), walkin: by('walkin') }
  }), [db, team])
  const sum = (k) => days.reduce((s, x) => s + x[k], 0)
  const total = sum('app') + sum('phone') + sum('walkin')
  const fee = sum('app') * COMMISSION
  const max = Math.max(1, ...days.map((x) => x.app + x.phone + x.walkin))
  return (
    <>
      <div className="kpis">
        <Kpi label="درآمد ۳۰ روز" value={short(total)} sub="تومان" icon="money" />
        <Kpi label="از بیوتی‌ست" value={`٪${fa(Math.round((sum('app') / Math.max(total, 1)) * 100))}`} sub={short(sum('app'))} icon="sparkle" />
        <Kpi label="کارمزد بیوتی‌ست (٪۱۰ آنلاین)" value={short(fee)} sub="تومان" icon="tag" />
        <Kpi label="تسویه‌ی شنبه" value={short(sum('app') * 0.3 * (1 - COMMISSION) / 4)} sub="بیعانه‌های این هفته منهای کارمزد" icon="wallet" />
      </div>
      <Panel title="درآمد روزانه به تفکیک منبع">
        <div className="bars stacked">{days.map((x) => (
          <span key={x.d} title={`${dateShort(x.d)} · ${toman(x.app + x.phone + x.walkin)}`}>
            <i className="b-walkin" style={{ height: `${(x.walkin / max) * 100}%` }} /><i className="b-phone" style={{ height: `${(x.phone / max) * 100}%` }} /><i className="b-app" style={{ height: `${(x.app / max) * 100}%` }} />
            <small>{dayNum(x.d)}</small>
          </span>
        ))}</div>
        <div className="legend"><span className="src src-app">بیوتی‌ست</span><span className="src src-phone">تلفنی</span><span className="src src-walkin">حضوری</span></div>
      </Panel>
    </>
  )
}

// ---------- فروشگاه سالن در مارکت‌پلیس ----------
function MyShop({ s }) {
  const { db, openShop, addProduct, updateProduct, shipOrder, toast } = useStore()
  const sh = db.shops.find((x) => x.salon === s.id)
  const [f, setF] = useState(null)
  if (!sh) return (
    <Panel className="shop-intro">
      <img src={img(SHOP_PH[1])} alt="" />
      <div>
        <h3>فروشگاه سالن‌تان را در بیوتی‌ست باز کنید</h3>
        <p className="muted">محصولاتی که در سالن استفاده می‌کنید را به مشتری‌ها بفروشید. پرداخت نزد بیوتی‌ست می‌ماند و بعد از تحویل، منهای کارمزد ٪{fa(Math.round(db.settings.shopRate * 100))} هر شنبه به حساب شما واریز می‌شود.</p>
        <button className="btn primary" onClick={() => { openShop(s); toast({ icon: '🛍️', text: 'درخواست ثبت شد؛ بعد از تأیید مدیر بیوتی‌ست فعال می‌شود' }) }}>درخواست باز کردن فروشگاه</button>
      </div>
    </Panel>
  )
  const prods = db.products.filter((p) => p.shop === sh.id)
  const orders = db.orders.filter((o) => o.shop === sh.id).sort((a, b) => (b.t || 0) - (a.t || 0) || b.date.localeCompare(a.date))
  const d30 = lastDays(30)
  const sales = orders.filter((o) => d30.includes(o.date)).reduce((a, o) => a + o.total, 0)
  const ST = { paid: 'پرداخت‌شده · آماده‌ی ارسال', shipped: 'ارسال شد', delivered: 'تحویل شد' }
  return (
    <>
      {sh.status === 'pending' && <div className="warn">فروشگاه شما در انتظار تأیید مدیر بیوتی‌ست است؛ تا تأیید، در اپ دیده نمی‌شود. محصولات را از همین حالا اضافه کنید.</div>}
      <div className="kpis">
        <Kpi label="فروش ۳۰ روز" value={short(sales)} sub="تومان" icon="money" />
        <Kpi label="کارمزد بیوتی‌ست" value={`٪${fa(Math.round(sh.rate * 100))}`} sub={short(sales * sh.rate)} icon="tag" />
        <Kpi label="سفارش‌های در انتظار ارسال" value={fa(orders.filter((o) => o.status === 'paid').length)} icon="bag" />
        <Kpi label="محصولات" value={fa(prods.length)} sub={`${fa(prods.filter((p) => !p.stock).length)} ناموجود`} icon="grid" />
      </div>
      <div className="grid-2 wide-first">
        <Panel title="محصولات" action={<button className="btn primary sm" onClick={() => setF({ name: '', brand: '', cat: 'skin', price: 300000, stock: 10 })}><Icon n="plus" s={14} /> محصول جدید</button>}>
          <table className="tbl">
            <thead><tr><th>محصول</th><th>دسته</th><th>قیمت (تومان)</th><th>موجودی</th><th>فروش</th></tr></thead>
            <tbody>{prods.map((p) => (
              <tr key={p.id}>
                <td><span className="cell-u"><img className="tbl-img" src={img(p.photo)} alt="" />{p.name}</span></td><td>{PCAT[p.cat].name}</td>
                <td><input className="tbl-in" type="number" step="10000" value={p.price} onChange={(e) => updateProduct(p.id, { price: Math.max(0, +e.target.value) })} /></td>
                <td><input className="tbl-in sm" type="number" value={p.stock} onChange={(e) => updateProduct(p.id, { stock: Math.max(0, +e.target.value) })} /></td>
                <td>{fa(p.sold)}</td>
              </tr>
            ))}</tbody>
          </table>
        </Panel>
        <Panel title="سفارش‌ها">
          {orders.slice(0, 12).map((o) => (
            <div key={o.id} className="order-row">
              <div><b>{o.buyer}</b><small className="muted">{dateShort(o.date)} · {fa(o.items.reduce((a, i) => a + i.qty, 0))} کالا · {toman(o.total)}</small></div>
              {o.status === 'delivered' ? <span className="st done">{ST[o.status]}</span> : <button className="btn ghost sm" onClick={() => shipOrder(o.id)}>{o.status === 'paid' ? 'ارسال شد' : 'تحویل شد'}</button>}
            </div>
          ))}
          {!orders.length && <p className="muted">هنوز سفارشی نیامده.</p>}
        </Panel>
      </div>
      <Sheet open={!!f} onClose={() => setF(null)} title="محصول جدید" className="desk-sheet">
        {f && (
          <div className="pad form-grid">
            <label>نام محصول<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="مثلاً سرم آبرسان" /></label>
            <label>برند<input value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} /></label>
            <label>دسته<select value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>{PCATS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label>قیمت (تومان)<input type="number" value={f.price} onChange={(e) => setF({ ...f, price: +e.target.value })} /></label>
            <label>موجودی<input type="number" value={f.stock} onChange={(e) => setF({ ...f, stock: +e.target.value })} /></label>
            <button className="btn primary full" disabled={!f.name.trim() || !f.price} onClick={() => { addProduct({ ...f, shop: sh.id, brand: f.brand || s.word, photo: SHOP_PH[0] }); toast({ icon: '✓', text: 'محصول اضافه شد' }); setF(null) }}>افزودن</button>
          </div>
        )}
      </Sheet>
    </>
  )
}

// ---------- برگه‌ها ----------
function WalkIn({ s, team, init, onClose }) {
  const { db, addWalkin, toast } = useStore()
  const [f, setF] = useState({})
  const v = { date: today(), artist: team[0]?.id, start: null, name: '', phone: '', sid: '', ...init, ...f }
  const a = team.find((x) => x.id === v.artist)
  const svcs = a ? s.svc.filter((x) => a.cats.includes(SV[x.sid].cat)) : []
  const sid = v.sid || svcs[0]?.sid
  const busy = a ? agenda(db, a, v.date).list : []
  const free = []
  for (let h = s.open; h < s.close; h += 0.5) if (!busy.some((x) => h >= x.start && h < x.start + x.dur / 60)) free.push(h)
  const set = (p) => setF((x) => ({ ...x, ...p }))
  const close = () => { setF({}); onClose() }
  const ok = v.name.trim() && sid && v.start != null && free.includes(v.start)
  return (
    <Sheet open={!!init} onClose={close} title="ثبت نوبت حضوری یا تلفنی" className="desk-sheet">
      {init && (
        <div className="pad form-grid">
          <label>اسم مشتری<input value={v.name} onChange={(e) => set({ name: e.target.value })} placeholder="مثلاً مریم رضایی" /></label>
          <label>موبایل<input dir="ltr" value={v.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="09…" /></label>
          <label>آرتیست<select value={v.artist} onChange={(e) => set({ artist: e.target.value, sid: '', start: null })}>{team.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>خدمت<select value={sid} onChange={(e) => set({ sid: e.target.value })}>{svcs.map((x) => <option key={x.sid} value={x.sid}>{SV[x.sid].name} · {fmtDur(SV[x.sid].dur)}</option>)}</select></label>
          <label>روز<select value={v.date} onChange={(e) => set({ date: e.target.value, start: null })}>{Array.from({ length: 10 }, (_, i) => addDays(today(), i)).map((d) => <option key={d} value={d}>{relDay(d)} · {dateShort(d)}</option>)}</select></label>
          <div className="full"><small className="muted">ساعت آزاد</small><div className="slots">{free.map((h) => <button key={h} className={v.start === h ? 'on' : ''} onClick={() => set({ start: h })}>{hh(h)}</button>)}</div></div>
          <button className="btn primary full" disabled={!ok} onClick={() => {
            addWalkin({ salon: s.id, artist: v.artist, svc: [sid], date: v.date, start: v.start, dur: SV[sid].dur, price: s.svc.find((x) => x.sid === sid).price, client: { id: 'w' + v.phone + v.name, name: v.name.trim(), phone: v.phone, hue: 20 }, source: 'walkin' })
            haptic(); toast({ icon: '✓', text: 'نوبت ثبت شد و در اپ هم پر شد' }); close()
          }}>ثبت نوبت</button>
        </div>
      )}
    </Sheet>
  )
}

function ApptSheet({ appt, team, onClose }) {
  const { mark, toast } = useStore()
  const a = appt && (appt.a || team.find((x) => x.id === appt.artist))
  return (
    <Sheet open={!!appt} onClose={onClose} title="جزئیات نوبت" className="desk-sheet">
      {appt && (
        <div className="pad appt-detail">
          <div className="ad-client"><Avatar u={appt.client} size={48} /><div><b>{appt.client.name}</b><small className="muted" dir="ltr">{appt.client.phone}</small></div></div>
          <ul className="kv">
            <li><span>خدمت</span><b>{svcName(appt)}</b></li>
            <li><span>آرتیست</span><b>{a?.name}</b></li>
            <li><span>زمان</span><b>{relDay(appt.date)} · {hh(appt.start)} تا {hh(appt.start + appt.dur / 60)}</b></li>
            <li><span>مبلغ</span><b>{toman(appt.price)}</b></li>
            <li><span>منبع</span><b>{SOURCE_NAME[appt.source]}</b></li>
          </ul>
          <div className="ad-actions">{[['arrived', 'رسید'], ['done', 'انجام شد'], ['noshow', 'نیامد']].map(([k, n]) => <button key={k} className={`chip ${appt.status === k ? 'on' : ''}`} onClick={() => { mark(appt.id, k); toast({ icon: '✓', text: n }); onClose() }}>{n}</button>)}</div>
        </div>
      )}
    </Sheet>
  )
}

