import { useEffect } from 'react'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Avatar, Empty, Icon, Seg } from '../components/ui'
import { ArtistCard, SalonCard } from '../components/cards'
import { Mark } from '../components/Logo'
import { CITIES, CITY_IDS } from '../lib/geo'
import { ago, fa, toman } from '../lib/util'

export default function Me({ asPage }) {
  const { db, me, updateMe, readNotes, logout, reset, toast } = useStore()
  const nav = useNav()
  const favs = db.salons.filter((s) => me.favs.includes(s.id))
  const follows = db.artists.filter((a) => me.follows.includes(a.id))
  const visits = db.bookings.filter((b) => b.user === 'me' && b.status === 'done').length
  useEffect(() => { const t = setTimeout(readNotes, 1500); return () => clearTimeout(t) }, [])

  return (
    <div className="scroll me">
      {asPage && <button className="icon-btn me-back" onClick={nav.pop} aria-label="بازگشت"><Icon n="back" s={22} /></button>}
      <section className="me-head">
        <Avatar u={me} size={72} ring="var(--gold)" />
        <h1>{me.name}</h1>
        <p className="muted" dir="ltr">{me.phone}</p>
        <div className="me-stats">
          <span><b>{fa(visits)}</b><small>نوبت انجام‌شده</small></span>
          <span><b>{fa(follows.length)}</b><small>آرتیست من</small></span>
          <span><b>{fa(favs.length)}</b><small>سالن نشان‌شده</small></span>
        </div>
      </section>

      <div className="wallet-card">
        <Mark size={40} color="#fff" accent="var(--gold-2)" />
        <div><small>کیف پول بیوتی‌ست</small><b>{toman(me.wallet)}</b></div>
        <button onClick={() => { updateMe({ wallet: me.wallet + 1000000 }); toast({ icon: '💳', text: 'یک میلیون تومان شارژ شد (دمو)' }) }}>افزایش</button>
      </div>

      <div className="sec-title"><div><em className="en">My Artists</em><h2>آرتیست‌های من</h2></div></div>
      {follows.length ? <div className="rail artists">{follows.map((a) => <ArtistCard key={a.id} a={a} />)}</div>
        : <p className="muted pad-x small">آرتیست‌های محبوب‌تون رو دنبال کنید تا کارهای تازه‌شون رو ببینید و زودتر نوبت بگیرید.</p>}

      <div className="sec-title"><div><em className="en">Saved</em><h2>سالن‌های نشان‌شده</h2></div></div>
      {favs.length ? <div className="rail">{favs.map((s) => <div key={s.id} className="rail-item"><SalonCard s={s} compact /></div>)}</div>
        : <div className="pad"><Empty icon="heart" title="هنوز چیزی نشان نکردید" text="روی قلب کارت هر سالن بزنید." /></div>}

      <div className="sec-title"><div><em className="en">Inbox</em><h2>اعلان‌ها</h2></div></div>
      <div className="notes pad-x">
        {me.notes.map((n) => <div key={n.id} className={`note-row ${n.read ? '' : 'new'}`}><Icon n="bell" s={16} /><p>{n.text}</p><small className="muted">{ago(n.t)}</small></div>)}
      </div>

      <div className="sec-title"><div><em className="en">Settings</em><h2>تنظیمات</h2></div></div>
      <div className="pad-x settings">
        <div className="set-row"><span>شهر</span><Seg id="mecity" items={CITY_IDS.map((c) => [c, CITIES[c].name])} value={me.city} onChange={(c) => updateMe({ city: c, area: null })} /></div>
        <button className="set-row" onClick={() => nav.go('visits')}><span><Icon n="cal" s={17} /> نوبت‌های من</span><Icon n="fwd" s={16} /></button>
        <button className="set-row" onClick={() => toast({ icon: '💼', text: 'پنل سالن‌دارها در نسخه‌ی بعد' })}><span><Icon n="home" s={17} /> سالن دارید؟ به بیوتی‌ست بپیوندید</span><Icon n="fwd" s={16} /></button>
        <button className="set-row" onClick={logout}><span><Icon n="logout" s={17} /> خروج</span></button>
        <button className="set-row muted" onClick={() => { if (confirm('همه‌ی داده‌های دمو پاک شود؟')) reset() }}><span><Icon n="gear" s={17} /> بازنشانی دمو</span></button>
      </div>
      <p className="center muted small sign"><em className="en">BeautySet — made with care for women.</em></p>
      <div className="foot-space" />
    </div>
  )
}
