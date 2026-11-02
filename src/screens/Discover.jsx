import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Logo } from '../components/Logo'
import { Avatar, Icon } from '../components/ui'
import { ArtistCard, SalonCard } from '../components/cards'
import { CATS, CAT, SV } from '../lib/catalog'
import { PH, img } from '../lib/photos'
import { BLANK, useSearch } from '../lib/search'
import { fa, haptic, hh, relDay } from '../lib/util'
import { Finder } from './Book'

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'صبح بخیر' : h < 17 ? 'روز بخیر' : 'عصر بخیر' }

// صفحه‌ی اول: کارت جستجو، آزادهای همین امروز، دسته‌ها، آرتیست‌ها و لوک‌بوک
export default function Home() {
  const { db, me } = useStore()
  const nav = useNav()
  const city = me.city
  const salons = db.salons.filter((s) => s.city === city)
  // آزادهای امروز: اول ناحیه‌ی خود کاربر، بعد بهترین‌ها
  const now = useSearch({ ...BLANK, freeOnly: true, sort: 'soon' }).list
    .sort((a, b) => (b.area === me.area) - (a.area === me.area) || a.slots[0] - b.slots[0]).slice(0, 8)
  const stars = db.artists.filter((a) => a.city === city && a.badge === 'star').sort((a, b) => b.followers - a.followers).slice(0, 10)
  const top = [...salons].sort((a, b) => b.rating * Math.log(b.reviewsN) - a.rating * Math.log(a.reviewsN)).slice(0, 6)
  const next = db.bookings.filter((b) => b.user === 'me' && b.status === 'confirmed').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0]
  const results = (q, title) => nav.push({ type: 'results', q: { ...BLANK, ...q }, title })

  return (
    <div className="scroll home">
      <header className="top">
        <Logo size={17} />
        <div className="top-r">
          <small className="muted">{greet()}، {me.name.split(' ')[0]}</small>
          <button onClick={() => nav.go('me')} aria-label="پروفایل"><Avatar u={me} size={38} /></button>
        </div>
      </header>

      <Finder />

      {next && (() => { const s = db.salons.find((x) => x.id === next.salon); return (
        <motion.button className="next-card" whileTap={{ scale: 0.98 }} onClick={() => nav.go('visits')}>
          <div className="nc-date"><b>{relDay(next.date)}</b><span>{hh(next.start)}</span></div>
          <div className="nc-body"><small>نوبت بعدی شما</small><b>{SV[next.svc[0]].name}</b><span className="muted">{s ? s.name : 'در منزل'}</span></div>
          <Icon n="fwd" s={18} />
        </motion.button>
      ) })()}

      {now.length > 0 && <>
        <div className="sec-title"><div><em className="en">Free today</em><h2>همین امروز نوبت دارند</h2></div><button onClick={() => results({ freeOnly: true, sort: 'soon' }, 'آزاد امروز')}>همه</button></div>
        <div className="rail now">
          {now.map((s) => (
            <motion.div key={s.id} className="now-card" whileTap={{ scale: 0.98 }} onClick={() => nav.push({ type: 'salon', id: s.id })}>
              <img src={img(s.photos[0])} alt="" loading="lazy" />
              <div className="nw-in">
                <b>{s.name}</b>
                <small>{s.hood} · ★ {fa(s.rating.toFixed(1))}</small>
                <span className="nw-slots">{s.slots.slice(0, 3).map((h) => <button key={h} onClick={(e) => { e.stopPropagation(); haptic(); nav.book({ salon: s.id, svc: [], start: h }) }}>{hh(h)}</button>)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </>}

      <div className="sec-title"><div><em className="en">Services</em><h2>همه‌ی خدمات</h2></div></div>
      <div className="cat-tiles">
        {CATS.map((c, i) => (
          <motion.button key={c.id} className={i === 0 ? 'wide' : ''} whileTap={{ scale: 0.97 }} onClick={() => results({ cat: c.id }, c.name)}>
            <img src={img(PH[c.id][0])} alt="" loading="lazy" />
            <span><em className="en">{c.en}</em><b>{c.name}</b></span>
          </motion.button>
        ))}
      </div>

      <div className="sec-title"><div><em className="en">The Artists</em><h2>ستاره‌های بیوتی‌ست</h2></div><button onClick={() => nav.go('artists')}>همه</button></div>
      <div className="rail artists">{stars.map((a) => <ArtistCard key={a.id} a={a} size="lg" />)}</div>

      <div className="sec-title"><div><em className="en">Most Loved</em><h2>محبوب‌ترین سالن‌ها</h2></div><button onClick={() => results({ sort: 'rating' }, 'محبوب‌ترین‌ها')}>همه</button></div>
      <div className="pad-x">{top.slice(0, 4).map((s) => <SalonCard key={s.id} s={s} />)}</div>

      <div className="foot-space" />
    </div>
  )
}

