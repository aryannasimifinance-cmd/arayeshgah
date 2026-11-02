import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Logo } from '../components/Logo'
import { Avatar, Icon } from '../components/ui'
import { Cover, Glyph, Work } from '../components/Art'
import { ArtistCard, SalonCard } from '../components/cards'
import { CATS, CAT, SV } from '../lib/catalog'
import { CITIES } from '../lib/geo'
import { BLANK } from '../lib/search'
import { fa, hh, relDay } from '../lib/util'

const LINES = [
  ['Beauty, beautifully booked.', 'زیبایی‌تون، فقط یک لمس فاصله داره'],
  ['Your glow, your time.', 'درخشش شما، به وقت شما'],
  ['Find your artist.', 'آرتیست خودتون رو پیدا کنید'],
]
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'صبح بخیر' : h < 17 ? 'روز بخیر' : 'عصر بخیر' }

export default function Discover() {
  const { db, me } = useStore()
  const nav = useNav()
  const [line, setLine] = useState(0)
  useEffect(() => { const t = setInterval(() => setLine((x) => (x + 1) % LINES.length), 4200); return () => clearInterval(t) }, [])
  const city = me.city
  const salons = db.salons.filter((s) => s.city === city)
  const stars = db.artists.filter((a) => a.city === city && a.badge === 'star').sort((a, b) => b.followers - a.followers).slice(0, 10)
  const rising = db.artists.filter((a) => a.city === city && a.badge === 'rising').slice(0, 8)
  const offers = salons.filter((s) => s.offer).slice(0, 6)
  const top = [...salons].sort((a, b) => b.rating * Math.log(b.reviewsN) - a.rating * Math.log(a.reviewsN)).slice(0, 6)
  const near = me.area ? salons.filter((s) => s.area === me.area).slice(0, 6) : []
  const next = db.bookings.filter((b) => b.user === 'me' && b.status === 'confirmed').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0]
  const feed = stars.flatMap((a) => a.works.slice(0, 2).map((w) => ({ w, a }))).slice(0, 9)
  const results = (q, title) => nav.push({ type: 'results', q: { ...BLANK, ...q }, title })

  return (
    <div className="scroll discover">
      <header className="top">
        <Logo size={17} />
        <button onClick={() => nav.go('me')} aria-label="پروفایل"><Avatar u={me} size={38} /></button>
      </header>

      <section className="hello">
        <small className="muted">{greet()}، {me.name.split(' ')[0]}</small>
        <div className="slogan">
          <AnimatePresence mode="wait">
            <motion.div key={line} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5 }}>
              <em className="en">{LINES[line][0]}</em>
              <h1>{LINES[line][1]}</h1>
            </motion.div>
          </AnimatePresence>
        </div>
        <button className="search-fake" onClick={() => nav.go('map')}>
          <Icon n="search" s={18} /> <span>سالن، آرتیست، خدمت یا محله…</span>
          <span className="sf-city"><Icon n="pin" s={13} /> {CITIES[city].name}</span>
        </button>
      </section>

      {next && (() => { const s = db.salons.find((x) => x.id === next.salon); return (
        <motion.button className="next-card" whileTap={{ scale: 0.98 }} onClick={() => nav.go('visits')}>
          <div className="nc-date"><b>{relDay(next.date)}</b><span>{hh(next.start)}</span></div>
          <div className="nc-body"><small>نوبت بعدی شما</small><b>{SV[next.svc[0]].name}</b><span className="muted">{s.name}</span></div>
          <Icon n="fwd" s={18} />
        </motion.button>
      ) })()}

      <section className="cats-rail">
        {CATS.map((c, i) => (
          <motion.button key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }} whileTap={{ scale: 0.92 }}
            onClick={() => results({ cat: c.id }, c.name)}>
            <span className="cat-orb" style={{ '--t': c.tone }}><Glyph cat={c.id} s={26} w={1.3} /></span>
            <b>{c.name}</b>
          </motion.button>
        ))}
      </section>

      <div className="sec-title"><div><em className="en">The Artists</em><h2>ستاره‌های بیوتی‌ست</h2></div><button onClick={() => results({ sort: 'rating' }, 'آرتیست‌ها')}>همه</button></div>
      <div className="rail artists">{stars.map((a) => <ArtistCard key={a.id} a={a} size="lg" />)}</div>

      <div className="sec-title"><div><em className="en">Lookbook</em><h2>تازه از دست آرتیست‌ها</h2></div></div>
      <div className="lookbook">
        {feed.map(({ w, a }, i) => (
          <motion.button key={i} className={`lb ${i === 0 ? 'big' : ''}`} whileTap={{ scale: 0.97 }} onClick={() => nav.push({ type: 'artist', id: a.id })}>
            <Work w={w} />
            <span className="lb-cap"><b>{w.title}</b><small dir="ltr">@{a.handle}</small></span>
          </motion.button>
        ))}
      </div>

      {offers.length > 0 && <>
        <div className="sec-title"><div><em className="en">This Week</em><h2>پیشنهادهای ویژه</h2></div></div>
        <div className="rail offers">
          {offers.map((s) => (
            <motion.button key={s.id} className="offer-card" whileTap={{ scale: 0.97 }} onClick={() => nav.push({ type: 'salon', id: s.id })}>
              <Cover salon={s} ratio={0.75} />
              <div className="oc-in"><span className="oc-pct">٪{fa(s.offer.pct)}</span><b>{CAT[s.offer.cat].name}</b><small>{s.name}</small></div>
            </motion.button>
          ))}
        </div>
      </>}

      {near.length > 0 && <>
        <div className="sec-title"><div><em className="en">Near You</em><h2>نزدیک شما</h2></div></div>
        <div className="rail">{near.map((s) => <div key={s.id} className="rail-item"><SalonCard s={s} compact /></div>)}</div>
      </>}

      <div className="sec-title"><div><em className="en">Most Loved</em><h2>محبوب‌ترین سالن‌ها</h2></div><button onClick={() => results({ sort: 'rating' }, 'محبوب‌ترین‌ها')}>همه</button></div>
      <div className="rail">{top.map((s) => <div key={s.id} className="rail-item"><SalonCard s={s} compact /></div>)}</div>

      {rising.length > 0 && <>
        <div className="sec-title"><div><em className="en">Rising</em><h2>استعدادهای تازه</h2></div></div>
        <div className="rail artists">{rising.map((a) => <ArtistCard key={a.id} a={a} />)}</div>
      </>}

      <section className="manifest">
        <em className="en">Made for women, by women.</em>
        <p>همه‌ی سالن‌ها و آرتیست‌های بیوتی‌ست مخصوص بانوان‌اند و نظرها فقط از کسانی است که واقعاً نوبت گرفته‌اند.</p>
      </section>
      <div className="foot-space" />
    </div>
  )
}
