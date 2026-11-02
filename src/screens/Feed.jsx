import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Logo } from '../components/Logo'
import { Avatar, Icon } from '../components/ui'
import { ArtistCard, SalonCard } from '../components/cards'
import { CAT } from '../lib/catalog'
import { img } from '../lib/photos'
import { BLANK, useSearch } from '../lib/search'
import { fa, haptic, hh } from '../lib/util'

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'صبح بخیر' : h < 17 ? 'روز بخیر' : 'عصر بخیر' }

// تب خانه: چیزهای تازه و محبوب
export default function Feed() {
  const { db, me } = useStore()
  const nav = useNav()
  const salons = db.salons.filter((s) => s.city === me.city)
  const now = useSearch({ ...BLANK, freeOnly: true, sort: 'soon' }).list
    .sort((a, b) => (b.area === me.area) - (a.area === me.area) || a.slots[0] - b.slots[0]).slice(0, 8)
  const stars = db.artists.filter((a) => a.city === me.city && a.badge === 'star').sort((a, b) => b.followers - a.followers).slice(0, 10)
  const offers = salons.filter((s) => s.offer).slice(0, 6)
  const loved = [...salons].sort((a, b) => b.rating * Math.log(b.reviewsN) - a.rating * Math.log(a.reviewsN)).slice(0, 4)
  const results = (q, title) => nav.push({ type: 'results', q: { ...BLANK, ...q }, title })
  return (
    <div className="scroll feed">
      <header className="top">
        <div className="hello-2"><small className="muted">{greet()}</small><b>{me.name.split(' ')[0]} عزیز ✨</b></div>
        <button onClick={() => nav.go('me')} aria-label="پروفایل من" className="me-btn"><Avatar u={me} size={40} />{me.notes.some((n) => !n.read) && <i className="ping" />}</button>
      </header>

      <motion.button className="feed-cta" whileTap={{ scale: 0.98 }} onClick={() => nav.go('search')}>
        <img src={img('1522337360788-8b13dee7a37e')} alt="" />
        <div><Logo size={15} light en={false} /><b>نوبت زیبایی‌تون رو پیدا کنید</b><span className="fc-go"><Icon n="search" s={15} /> جستجو و نقشه</span></div>
      </motion.button>

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

      {offers.length > 0 && <>
        <div className="sec-title"><div><em className="en">This Week</em><h2>پیشنهادهای ویژه</h2></div><button onClick={() => results({ offer: true }, 'تخفیف‌دار')}>همه</button></div>
        <div className="rail offers">
          {offers.map((s) => (
            <motion.button key={s.id} className="offer-card" whileTap={{ scale: 0.97 }} onClick={() => nav.push({ type: 'salon', id: s.id })}>
              <img src={img(s.photos[1] || s.photos[0])} alt="" loading="lazy" />
              <div className="oc-in"><span className="oc-pct">٪{fa(s.offer.pct)}</span><b>{CAT[s.offer.cat].name}</b><small>{s.name}</small></div>
            </motion.button>
          ))}
        </div>
      </>}

      <div className="sec-title"><div><em className="en">The Artists</em><h2>ستاره‌های بیوتی‌ست</h2></div><button onClick={() => nav.go('artists')}>همه</button></div>
      <div className="rail artists">{stars.map((a) => <ArtistCard key={a.id} a={a} size="lg" />)}</div>

      <div className="sec-title"><div><em className="en">Most Loved</em><h2>محبوب‌ترین سالن‌ها</h2></div><button onClick={() => results({ sort: 'rating' }, 'محبوب‌ترین‌ها')}>همه</button></div>
      <div className="pad-x">{loved.map((s) => <SalonCard key={s.id} s={s} />)}</div>
      <div className="foot-space" />
    </div>
  )
}
