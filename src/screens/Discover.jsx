import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Logo } from '../components/Logo'
import { Avatar, Icon } from '../components/ui'
import { Work } from '../components/Art'
import { ArtistCard, SalonCard } from '../components/cards'
import { CATS, CAT, SV } from '../lib/catalog'
import { PH, img } from '../lib/photos'
import { BLANK, useSearch } from '../lib/search'
import { fa, haptic, hh, relDay } from '../lib/util'
import { Finder, Shortcuts } from './Book'

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
  const offers = salons.filter((s) => s.offer).slice(0, 6)
  const top = [...salons].sort((a, b) => b.rating * Math.log(b.reviewsN) - a.rating * Math.log(a.reviewsN)).slice(0, 6)
  const next = db.bookings.filter((b) => b.user === 'me' && b.status === 'confirmed').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0]
  const feed = stars.flatMap((a) => a.works.slice(0, 1).map((w) => ({ w, a }))).slice(0, 7)
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

      <div className="sec-title"><div><em className="en">Quick picks</em><h2>انتخاب سریع</h2></div></div>
      <Shortcuts />

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
              <img src={img(s.photos[1] || s.photos[0])} alt="" loading="lazy" />
              <div className="oc-in"><span className="oc-pct">٪{fa(s.offer.pct)}</span><b>{CAT[s.offer.cat].name}</b><small>{s.name}</small></div>
            </motion.button>
          ))}
        </div>
      </>}

      <div className="sec-title"><div><em className="en">Most Loved</em><h2>محبوب‌ترین سالن‌ها</h2></div><button onClick={() => results({ sort: 'rating' }, 'محبوب‌ترین‌ها')}>همه</button></div>
      <div className="rail">{top.map((s) => <div key={s.id} className="rail-item"><SalonCard s={s} compact /></div>)}</div>

      <section className="manifest">
        <em className="en">Made for women, by women.</em>
        <p>همه‌ی سالن‌ها و آرتیست‌های بیوتی‌ست مخصوص بانوان‌اند و نظرها فقط از کسانی است که واقعاً نوبت گرفته‌اند.</p>
      </section>
      <div className="foot-space" />
    </div>
  )
}

