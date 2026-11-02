import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../../store'
import { Avatar, Empty, Icon, Sheet } from '../../components/ui'
import { Logo } from '../../components/Logo'
import { ThemeToggle } from '../../lib/theme'
import { CITIES, areaOf } from '../../lib/geo'
import { KINDS } from '../../lib/seed'
import { agentLedger, entityFee, lastDays, salonDay, shopDay } from '../../lib/market'
import { img } from '../../lib/photos'
import { dateShort, dayNum, fa, short, toman } from '../../lib/util'

const NAV = [
  { id: 'overview', name: 'نمای کلی', icon: 'grid' },
  { id: 'agents', name: 'عاملین فروش', icon: 'users' },
  { id: 'salons', name: 'سالن‌ها', icon: 'home' },
  { id: 'shops', name: 'فروشگاه‌ها', icon: 'bag' },
  { id: 'orders', name: 'سفارش‌ها', icon: 'list' },
  { id: 'requests', name: 'درخواست‌های همکاری', icon: 'chat' },
  { id: 'settings', name: 'تنظیمات کارمزد', icon: 'gear' },
]
const pct = (x) => `٪${fa(Math.round(x * 1000) / 10)}`
const Kpi = ({ label, value, sub, icon, tone }) => <div className={`kpi ${tone || ''}`}><div><small>{label}</small><Icon n={icon} s={18} /></div><b>{value}</b>{sub && <span>{sub}</span>}</div>
const Panel = ({ title, action, children, className = '' }) => <section className={`panel ${className}`}>{(title || action) && <div className="panel-head"><h3>{title}</h3>{action}</div>}{children}</section>
const STATUS = { active: ['فعال', 'done'], pending: ['در انتظار تأیید', 'now'], suspended: ['تعلیق', 'noshow'] }
const St = ({ s }) => <span className={`st ${STATUS[s][1]}`}>{STATUS[s][0]}</span>

// خلاصه‌ی ۳۰ روز هر سالن و فروشگاه — یک بار برای هر نسخه‌ی داده
function useBook() {
  const { db } = useStore()
  return useMemo(() => {
    const d30 = lastDays(30)
    const salons = db.salons.map((s) => ({ s, ...entityFee(db, 'salon', s, d30) }))
    const shops = db.shops.map((s) => ({ s, ...entityFee(db, 'shop', s, d30) }))
    const ledgers = Object.fromEntries(db.agents.map((g) => [g.id, agentLedger(db, g)]))
    return { d30, salons, shops, ledgers }
  }, [db])
}

export default function Admin() {
  const { db, logout } = useStore()
  const [sec, setSec] = useState('overview')
  const [menu, setMenu] = useState(false)
  const book = useBook()
  const badge = {
    requests: db.requests.filter((r) => r.status === 'new').length,
    shops: db.shops.filter((s) => s.status === 'pending').length,
    agents: db.agents.filter((g) => book.ledgers[g.id].due > 0).length,
  }
  const cur = NAV.find((n) => n.id === sec)
  return (
    <div className="dash admin">
      <aside className={`dash-side ${menu ? 'open' : ''}`}>
        <Logo size={20} light />
        <div className="ds-salon owner"><span className="own-ico"><Icon n="crown" s={20} /></span><div><b>مدیر کل</b><small>اشراف بر کل بیوتی‌ست</small></div></div>
        <nav>
          {NAV.map((n) => (
            <button key={n.id} className={sec === n.id ? 'on' : ''} onClick={() => { setSec(n.id); setMenu(false) }}>
              <Icon n={n.icon} s={18} /><span>{n.name}</span>{badge[n.id] > 0 && <i>{fa(badge[n.id])}</i>}
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
          <div className="grow"><h1>{cur.name}</h1><p className="muted">گزارش‌ها بر اساس ۳۰ روز اخیر، مگر جایی که ذکر شده</p></div>
        </header>
        <motion.div key={sec} className="dash-body" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {sec === 'overview' && <Overview book={book} go={setSec} />}
          {sec === 'agents' && <Agents book={book} />}
          {sec === 'salons' && <Salons book={book} />}
          {sec === 'shops' && <Shops book={book} />}
          {sec === 'orders' && <Orders />}
          {sec === 'requests' && <Requests />}
          {sec === 'settings' && <Settings />}
        </motion.div>
      </main>
    </div>
  )
}

// ---------- نمای کلی ----------
function Overview({ book, go }) {
  const { db } = useStore()
  const sum = (l, k) => l.reduce((a, x) => a + x[k], 0)
  const gmvB = sum(book.salons, 'gmv'), feeB = sum(book.salons, 'fee'), gmvS = sum(book.shops, 'gmv'), feeS = sum(book.shops, 'fee')
  const agentCut = Object.values(book.ledgers).reduce((a, l) => a + l.months.at(-1).share, 0)
  const due = Object.values(book.ledgers).reduce((a, l) => a + l.due, 0)
  const days = useMemo(() => book.d30.map((d) => ({
    d,
    b: db.salons.reduce((a, s) => a + salonDay(db, s, d).app * s.rate, 0),
    s: db.shops.reduce((a, s) => a + shopDay(db, s, d) * s.rate, 0),
  })), [db])
  const max = Math.max(1, ...days.map((x) => x.b + x.s))
  const todo = [
    ...db.shops.filter((s) => s.status === 'pending').map((s) => ({ t: `فروشگاه «${s.name}» منتظر تأیید است`, go: 'shops' })),
    ...db.requests.filter((r) => r.status === 'new').map((r) => ({ t: `درخواست همکاری: ${r.name} (${r.type === 'salon' ? 'سالن' : 'آرتیست'})`, go: 'requests' })),
    ...db.agents.filter((g) => book.ledgers[g.id].due > 0).map((g) => ({ t: `تسویه با ${g.name}: ${toman(book.ledgers[g.id].due)}`, go: 'agents' })),
  ]
  const topAgents = [...db.agents].sort((a, b) => book.ledgers[b.id].months.at(-1).fee - book.ledgers[a.id].months.at(-1).fee).slice(0, 5)
  return (
    <>
      <div className="kpis">
        <Kpi label="گردش کل (نوبت + فروشگاه)" value={short(gmvB + gmvS)} sub={`نوبت ${short(gmvB)} · فروشگاه ${short(gmvS)}`} icon="trend" />
        <Kpi label="درآمد بیوتی‌ست" value={short(feeB + feeS)} sub={`کارمزد نوبت ${short(feeB)} · فروشگاه ${short(feeS)}`} icon="money" tone="hl" />
        <Kpi label="سهم عاملین (ماه جاری)" value={short(agentCut)} sub={`مانده‌ی قابل تسویه ${short(due)}`} icon="users" />
        <Kpi label="شبکه" value={`${fa(db.salons.filter((s) => s.status === 'active').length)} سالن`} sub={`${fa(db.artists.length)} آرتیست · ${fa(db.shops.filter((s) => s.status === 'active').length)} فروشگاه · ${fa(db.products.length)} محصول`} icon="grid" />
      </div>
      <div className="grid-2 wide-first">
        <Panel title="درآمد روزانه‌ی بیوتی‌ست">
          <div className="bars stacked">{days.map((x) => (
            <span key={x.d} title={`${dateShort(x.d)} · ${toman(x.b + x.s)}`}><i className="b-phone" style={{ height: `${(x.s / max) * 100}%` }} /><i className="b-app" style={{ height: `${(x.b / max) * 100}%` }} /><small>{dayNum(x.d)}</small></span>
          ))}</div>
          <div className="legend"><span className="src src-app">کارمزد نوبت‌ها</span><span className="src src-phone">کارمزد فروشگاه‌ها</span></div>
        </Panel>
        <Panel title="کارهای در انتظار">
          {todo.length ? todo.map((x, i) => <button key={i} className="row-btn" onClick={() => go(x.go)}><Icon n="bell" s={15} /><span className="grow">{x.t}</span><Icon n="fwd" s={14} /></button>) : <p className="muted">همه‌چیز مرتب است ✨</p>}
        </Panel>
      </div>
      <div className="grid-2">
        <Panel title="عاملین برتر این ماه" action={<button className="link" onClick={() => go('agents')}>همه</button>}>
          {topAgents.map((g, i) => { const l = book.ledgers[g.id]; return (
            <div key={g.id} className="load-row"><span className="rank">{fa(i + 1)}</span><Avatar u={g} size={32} /><div><b>{g.name}</b><small className="muted">{fa(l.refs.length)} معرفی · کارمزد ایجادشده {short(l.months.at(-1).fee)}</small></div><small>{short(l.months.at(-1).share)}</small></div>
          ) })}
        </Panel>
        <Panel title="پرفروش‌ترین سالن‌ها" action={<button className="link" onClick={() => go('salons')}>همه</button>}>
          {[...book.salons].sort((a, b) => b.gmv - a.gmv).slice(0, 5).map(({ s, gmv, fee }) => (
            <div key={s.id} className="load-row"><img className="tbl-img" src={img(s.photos[0])} alt="" /><div><b>{s.name}</b><small className="muted">{s.hood} · گردش {short(gmv)}</small></div><small>{short(fee)}</small></div>
          ))}
        </Panel>
      </div>
    </>
  )
}

// ---------- عاملین فروش ----------
function Agents({ book }) {
  const { db, addAgent, setEntity, toast } = useStore()
  const [open, setOpen] = useState(null)
  const [add, setAdd] = useState(null)
  const rows = db.agents.map((g) => ({ g, l: book.ledgers[g.id] }))
  const tot = (k) => rows.reduce((a, x) => a + x.l[k], 0)
  return (
    <>
      <div className="explain">
        <Icon n="users" s={18} />
        <p><b>قانون سهم عامل فروش:</b> هر سالن یا فروشگاه یک معرف دارد. عامل، درصد مشخصی (پیش‌فرض {pct(db.settings.agentRate)}) از <b>کارمزدی که بیوتی‌ست</b> از همان سالن یا فروشگاه می‌گیرد، تا {fa(db.settings.agentMonths)} ماه بعد از پیوستن دریافت می‌کند. حساب‌ها ماهانه بسته و شنبه‌ی اول ماه بعد تسویه می‌شوند.</p>
      </div>
      <div className="kpis">
        <Kpi label="عاملین فعال" value={fa(db.agents.filter((g) => g.status === 'active').length)} sub={`${fa(rows.reduce((a, x) => a + x.l.refs.length, 0))} معرفی`} icon="users" />
        <Kpi label="سهم عاملین (۳ ماه)" value={short(tot('earned'))} sub="تومان" icon="money" />
        <Kpi label="پرداخت‌شده" value={short(tot('paid'))} sub="تومان" icon="check" />
        <Kpi label="قابل تسویه الان" value={short(tot('due'))} sub={`ماه جاری در جریان: ${short(tot('pending'))}`} icon="wallet" tone="hl" />
      </div>
      <Panel title="فهرست عاملین" action={<button className="btn primary sm" onClick={() => setAdd({ name: '', phone: '', code: '', rate: db.settings.agentRate, region: 'tehran' })}><Icon n="plus" s={14} /> عامل جدید</button>}>
        <table className="tbl">
          <thead><tr><th>عامل</th><th>کد معرف</th><th>منطقه</th><th>سالن / فروشگاه</th><th>گردش معرفی‌ها (۳۰ روز)</th><th>کارمزد ایجادشده (ماه جاری)</th><th>درصد</th><th>سهم ماه جاری</th><th>قابل تسویه</th><th /></tr></thead>
          <tbody>{rows.map(({ g, l }) => (
            <tr key={g.id} onClick={() => setOpen(g.id)}>
              <td><span className="cell-u"><Avatar u={g} size={28} />{g.name}{g.status !== 'active' && <span className="st noshow">غیرفعال</span>}</span></td>
              <td dir="ltr" className="code">{g.code}</td>
              <td>{CITIES[g.region].name}</td>
              <td>{fa(l.refs.filter((x) => x.kind === 'salon').length)} / {fa(l.refs.filter((x) => x.kind === 'shop').length)}</td>
              <td>{short(l.refs.reduce((a, x) => a + x.gmv, 0))}</td>
              <td>{short(l.months.at(-1).fee)}</td>
              <td>{pct(g.rate)}</td>
              <td>{short(l.pending)}</td>
              <td>{l.due > 0 ? <b className="due">{short(l.due)}</b> : <span className="muted">—</span>}</td>
              <td><Icon n="fwd" s={14} /></td>
            </tr>
          ))}</tbody>
        </table>
      </Panel>
      <AgentSheet id={open} book={book} onClose={() => setOpen(null)} />
      <Sheet open={!!add} onClose={() => setAdd(null)} title="عامل فروش جدید" className="desk-sheet">
        {add && (
          <div className="pad form-grid">
            <label>نام<input value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} /></label>
            <label>موبایل<input dir="ltr" value={add.phone} onChange={(e) => setAdd({ ...add, phone: e.target.value })} placeholder="09…" /></label>
            <label>کد معرف<input dir="ltr" value={add.code} onChange={(e) => setAdd({ ...add, code: e.target.value.toUpperCase() })} placeholder="BS-NAME" /></label>
            <label>منطقه<select value={add.region} onChange={(e) => setAdd({ ...add, region: e.target.value })}><option value="tehran">تهران</option><option value="karaj">کرج</option></select></label>
            <label>درصد از کارمزد<select value={add.rate} onChange={(e) => setAdd({ ...add, rate: +e.target.value })}>{[0.1, 0.15, 0.2, 0.25, 0.3].map((r) => <option key={r} value={r}>{pct(r)}</option>)}</select></label>
            <button className="btn primary full" disabled={!add.name || !add.code} onClick={() => { addAgent({ ...add, code: add.code.startsWith('BS-') ? add.code : `BS-${add.code}` }); toast({ icon: '✓', text: 'عامل اضافه شد؛ کد معرف را برایش بفرستید' }); setAdd(null) }}>افزودن</button>
          </div>
        )}
      </Sheet>
    </>
  )
}

function AgentSheet({ id, book, onClose }) {
  const { db, payAgent, setEntity, toast } = useStore()
  const g = db.agents.find((x) => x.id === id)
  const l = g && book.ledgers[g.id]
  return (
    <Sheet open={!!g} onClose={onClose} className="desk-sheet wide">
      {g && (
        <div className="pad agent-detail">
          <header className="ag-head">
            <Avatar u={g} size={56} />
            <div><h3>{g.name}</h3><small className="muted"><span dir="ltr" className="code">{g.code}</span> · {CITIES[g.region].name} · عضو از {dateShort(g.joined)} · <span dir="ltr">{g.phone}</span></small></div>
            <label className="rate-in">درصد سهم<select value={g.rate} onChange={(e) => { setEntity('agents', g.id, { rate: +e.target.value }); toast({ icon: '✓', text: 'درصد عامل عوض شد' }) }}>{[0.1, 0.15, 0.18, 0.2, 0.25, 0.3].map((r) => <option key={r} value={r}>{pct(r)}</option>)}</select></label>
            <button className="btn ghost sm" onClick={() => setEntity('agents', g.id, { status: g.status === 'active' ? 'suspended' : 'active' })}>{g.status === 'active' ? 'غیرفعال کردن' : 'فعال کردن'}</button>
          </header>
          <div className="kpis small">
            <Kpi label="سهم ۳ ماه" value={short(l.earned)} icon="money" />
            <Kpi label="پرداخت‌شده" value={short(l.paid)} icon="check" />
            <Kpi label="قابل تسویه" value={short(l.due)} icon="wallet" tone={l.due > 0 ? 'hl' : ''} />
            <Kpi label="ماه جاری (باز)" value={short(l.pending)} icon="clock" />
          </div>
          <h4>حساب ماهانه</h4>
          <table className="tbl">
            <thead><tr><th>ماه</th><th>کارمزد بیوتی‌ست از معرفی‌ها</th><th>سهم عامل ({pct(g.rate)})</th><th>پرداخت‌شده</th><th>وضعیت</th></tr></thead>
            <tbody>{l.months.map((m) => (
              <tr key={m.m}><td><b>{m.m}</b></td><td>{toman(m.fee)}</td><td>{toman(m.share)}</td><td>{toman(m.paid)}</td>
                <td>{m.current ? <span className="st now">در جریان</span> : m.share - m.paid < 1000 ? <span className="st done">تسویه شد</span> : <span className="st noshow">پرداخت نشده</span>}</td></tr>
            ))}</tbody>
          </table>
          {l.due > 0 && <button className="btn primary" onClick={() => { payAgent(g.id, l.months.filter((m) => !m.current && m.share - m.paid > 1000).map((m) => ({ m: m.m, amount: m.share - m.paid }))); toast({ icon: '💸', text: `${toman(l.due)} به ${g.name} پرداخت شد` }) }}>تسویه {toman(l.due)}</button>}
          <h4>معرفی‌ها ({fa(l.refs.length)})</h4>
          <table className="tbl">
            <thead><tr><th>نام</th><th>نوع</th><th>پیوستن</th><th>سهم تا</th><th>گردش ۳۰ روز</th><th>کارمزد ۳ ماه</th><th>سهم عامل</th></tr></thead>
            <tbody>{l.refs.sort((a, b) => b.fee - a.fee).map(({ kind, e, gmv, fee, until }) => (
              <tr key={e.id}><td><span className="cell-u"><img className="tbl-img" src={img(kind === 'salon' ? e.photos[0] : e.logo)} alt="" />{e.name}</span></td><td>{kind === 'salon' ? KINDS[e.kind].name : 'فروشگاه'}</td>
                <td>{dateShort(e.joined)}</td><td className={until < new Date().toISOString().slice(0, 10) ? 'muted' : ''}>{dateShort(until)}</td><td>{short(gmv)}</td><td>{short(fee)}</td><td><b>{short(fee * g.rate)}</b></td></tr>
            ))}</tbody>
          </table>
          {!l.refs.length && <Empty icon="users" title="هنوز معرفی‌ای ندارد" />}
        </div>
      )}
    </Sheet>
  )
}

// ---------- سالن‌ها و فروشگاه‌ها ----------
function AgentPick({ value, onChange }) {
  const { db } = useStore()
  return <select className="tbl-sel" value={value || ''} onClick={(e) => e.stopPropagation()} onChange={(e) => onChange(e.target.value || null)}><option value="">بدون معرف</option>{db.agents.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
}
const RateSel = ({ value, onChange, opts }) => <select className="tbl-sel" value={value} onChange={(e) => onChange(+e.target.value)}>{opts.map((r) => <option key={r} value={r}>{pct(r)}</option>)}</select>

function Salons({ book }) {
  const { setEntity, toast } = useStore()
  const [t, setT] = useState('')
  const [city, setCity] = useState('')
  const rows = book.salons.filter(({ s }) => (!city || s.city === city) && (!t || s.name.includes(t) || s.hood.includes(t))).sort((a, b) => b.gmv - a.gmv)
  return (
    <Panel title={`${fa(rows.length)} سالن`} action={<div className="chips">
      {[['', 'همه'], ['tehran', 'تهران'], ['karaj', 'کرج']].map(([k, n]) => <button key={k} className={`chip ${city === k ? 'on' : ''}`} onClick={() => setCity(k)}>{n}</button>)}
      <label className="search-in sm"><Icon n="search" s={15} /><input value={t} onChange={(e) => setT(e.target.value)} placeholder="جستجو" /></label>
    </div>}>
      <table className="tbl">
        <thead><tr><th>سالن</th><th>منطقه</th><th>معرف</th><th>پیوستن</th><th>گردش ۳۰ روز</th><th>کارمزد</th><th>درآمد بیوتی‌ست</th><th>وضعیت</th><th /></tr></thead>
        <tbody>{rows.map(({ s, gmv, fee }) => (
          <tr key={s.id} className="no-click">
            <td><span className="cell-u"><img className="tbl-img" src={img(s.photos[0])} alt="" />{s.name}</span></td>
            <td>{areaOf(s.city, s.area)?.name} · {CITIES[s.city].name}</td>
            <td><AgentPick value={s.agent} onChange={(v) => setEntity('salons', s.id, { agent: v })} /></td>
            <td>{dateShort(s.joined)}</td><td>{short(gmv)}</td>
            <td><RateSel value={s.rate} opts={[0.05, 0.08, 0.1, 0.12, 0.15]} onChange={(v) => { setEntity('salons', s.id, { rate: v }); toast({ icon: '✓', text: 'کارمزد سالن عوض شد' }) }} /></td>
            <td><b>{short(fee)}</b></td><td><St s={s.status} /></td>
            <td><button className="link" onClick={() => setEntity('salons', s.id, { status: s.status === 'active' ? 'suspended' : 'active' })}>{s.status === 'active' ? 'تعلیق' : 'فعال‌سازی'}</button></td>
          </tr>
        ))}</tbody>
      </table>
    </Panel>
  )
}

function Shops({ book }) {
  const { db, setEntity, toast } = useStore()
  const TYPE = { salon: 'سالن', vendor: 'فروشنده', artist: 'آرتیست' }
  const rows = [...book.shops].sort((a, b) => (a.s.status === 'pending' ? -1 : 0) - (b.s.status === 'pending' ? -1 : 0) || b.gmv - a.gmv)
  return (
    <Panel title={`${fa(rows.length)} فروشگاه · ${fa(db.products.length)} محصول`}>
      <table className="tbl">
        <thead><tr><th>فروشگاه</th><th>نوع</th><th>معرف</th><th>محصول</th><th>فروش ۳۰ روز</th><th>کارمزد</th><th>درآمد بیوتی‌ست</th><th>وضعیت</th><th /></tr></thead>
        <tbody>{rows.map(({ s, gmv, fee }) => (
          <tr key={s.id} className={`no-click ${s.status === 'pending' ? 'hl-row' : ''}`}>
            <td><span className="cell-u"><img className="tbl-img" src={img(s.logo)} alt="" />{s.name}</span></td><td>{TYPE[s.type]}</td>
            <td><AgentPick value={s.agent} onChange={(v) => setEntity('shops', s.id, { agent: v })} /></td>
            <td>{fa(db.products.filter((p) => p.shop === s.id).length)}</td><td>{short(gmv)}</td>
            <td><RateSel value={s.rate} opts={[0.08, 0.1, 0.12, 0.15, 0.18]} onChange={(v) => setEntity('shops', s.id, { rate: v })} /></td>
            <td><b>{short(fee)}</b></td><td><St s={s.status} /></td>
            <td>{s.status === 'pending'
              ? <span className="row-acts"><button className="btn primary sm" onClick={() => { setEntity('shops', s.id, { status: 'active', joined: new Date().toISOString().slice(0, 10) }); toast({ icon: '✓', text: 'فروشگاه تأیید و در اپ منتشر شد' }) }}>تأیید</button><button className="link" onClick={() => setEntity('shops', s.id, { status: 'suspended' })}>رد</button></span>
              : <button className="link" onClick={() => setEntity('shops', s.id, { status: s.status === 'active' ? 'suspended' : 'active' })}>{s.status === 'active' ? 'تعلیق' : 'فعال‌سازی'}</button>}</td>
          </tr>
        ))}</tbody>
      </table>
    </Panel>
  )
}

function Orders() {
  const { db } = useStore()
  const ST = { paid: 'پرداخت‌شده', shipped: 'ارسال‌شده', delivered: 'تحویل‌شده' }
  const list = [...db.orders].sort((a, b) => b.date.localeCompare(a.date) || (b.t || 0) - (a.t || 0)).slice(0, 60)
  return (
    <Panel title="آخرین سفارش‌های مارکت‌پلیس">
      <table className="tbl">
        <thead><tr><th>تاریخ</th><th>خریدار</th><th>فروشگاه</th><th>کالا</th><th>مبلغ</th><th>کارمزد بیوتی‌ست</th><th>وضعیت</th></tr></thead>
        <tbody>{list.map((o) => { const s = db.shops.find((x) => x.id === o.shop); return (
          <tr key={o.id} className="no-click"><td>{dateShort(o.date)}</td><td>{o.buyer}</td><td>{s?.name}</td><td>{fa(o.items.reduce((a, i) => a + i.qty, 0))}</td><td>{toman(o.total)}</td><td>{toman(o.total * (s?.rate || 0))}</td><td><span className={`st ${o.status === 'delivered' ? 'done' : 'now'}`}>{ST[o.status]}</span></td></tr>
        ) })}</tbody>
      </table>
    </Panel>
  )
}

function Requests() {
  const { db, setRequest, toast } = useStore()
  if (!db.requests.length) return <Panel><Empty icon="chat" title="درخواستی نیست" text="فرم «درخواست همکاری» در صفحه‌ی ورود این‌جا ثبت می‌شود." /></Panel>
  return (
    <Panel title="درخواست‌های همکاری">
      <table className="tbl">
        <thead><tr><th>نام</th><th>نوع</th><th>کسب‌وکار</th><th>موبایل</th><th>کد معرف</th><th>عامل</th><th>وضعیت</th><th /></tr></thead>
        <tbody>{db.requests.map((r) => { const g = db.agents.find((x) => x.code === (r.code || '').toUpperCase()); return (
          <tr key={r.id} className="no-click"><td>{r.name}</td><td>{r.type === 'salon' ? 'صاحب سالن' : 'آرتیست'}</td><td>{r.biz}</td><td dir="ltr">{r.phone}</td><td dir="ltr" className="code">{r.code || '—'}</td><td>{g ? g.name : <span className="muted">—</span>}</td>
            <td><span className={`st ${r.status === 'new' ? 'now' : r.status === 'ok' ? 'done' : 'noshow'}`}>{{ new: 'جدید', ok: 'تأیید شد', no: 'رد شد' }[r.status]}</span></td>
            <td>{r.status === 'new' && <span className="row-acts"><button className="btn primary sm" onClick={() => { setRequest(r.id, 'ok'); toast({ icon: '📞', text: 'تأیید شد؛ کارشناس برای راه‌اندازی تماس می‌گیرد' }) }}>تأیید</button><button className="link" onClick={() => setRequest(r.id, 'no')}>رد</button></span>}</td></tr>
        ) })}</tbody>
      </table>
    </Panel>
  )
}

function Settings() {
  const { db, setSettings, toast } = useStore()
  const s = db.settings
  const Row = ({ k, label, hint, opts, fmt = pct }) => (
    <div className="set-line"><div><b>{label}</b><small className="muted">{hint}</small></div>
      <select value={s[k]} onChange={(e) => { setSettings({ [k]: +e.target.value }); toast({ icon: '✓', text: 'ذخیره شد (برای عضوهای جدید)' }) }}>{opts.map((o) => <option key={o} value={o}>{fmt(o)}</option>)}</select></div>
  )
  return (
    <Panel title="کارمزدها و قوانین پیش‌فرض">
      <Row k="bookingRate" label="کارمزد نوبت آنلاین" hint="از مبلغ نوبت‌هایی که مشتری از اپ می‌گیرد؛ نوبت حضوری و تلفنی کارمزد ندارد" opts={[0.05, 0.08, 0.1, 0.12, 0.15]} />
      <Row k="shopRate" label="کارمزد فروش فروشگاه‌ها" hint="از مبلغ هر سفارش مارکت‌پلیس" opts={[0.08, 0.1, 0.12, 0.15, 0.18]} />
      <Row k="agentRate" label="سهم پیش‌فرض عامل فروش" hint="درصدی از کارمزد بیوتی‌ست از معرفی‌های او" opts={[0.1, 0.15, 0.2, 0.25, 0.3]} />
      <Row k="agentMonths" label="مدت سهم عامل" hint="چند ماه بعد از پیوستن هر سالن یا فروشگاه" opts={[6, 12, 18, 24]} fmt={(m) => `${fa(m)} ماه`} />
    </Panel>
  )
}

