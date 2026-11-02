import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from '../screens/Shell'
import { Badge, Icon, Rating } from './ui'
import { Cover, Portrait } from './Art'
import { areaOf } from '../lib/geo'
import { CAT } from '../lib/catalog'
import { KINDS, tierLabel } from '../lib/seed'
import { fa, haptic, hh, short } from '../lib/util'

export function Heart({ id, light }) {
  const { me, toggleFav } = useStore()
  const on = me.favs.includes(id)
  return (
    <motion.button className={`heart ${on ? 'on' : ''} ${light ? 'light' : ''}`} whileTap={{ scale: 0.8 }} aria-label="نشان کردن"
      onClick={(e) => { e.stopPropagation(); haptic(12); toggleFav(id) }}>
      <motion.span key={on} initial={{ scale: on ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
        <Icon n="heart" s={18} fill={on ? 'currentColor' : 'none'} w={1.8} />
      </motion.span>
    </motion.button>
  )
}

// کارت سالن در نتایج: کاور، امتیاز، ناحیه، قیمت شروع و ساعت‌های آزاد
export function SalonCard({ s, onSlot, compact }) {
  const nav = useNav()
  const area = areaOf(s.city, s.area)
  return (
    <motion.article className={`salon-card ${compact ? 'compact' : ''}`} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onClick={() => nav.push({ type: 'salon', id: s.id })}>
      <div className="sc-cover">
        <Cover salon={s} ratio={compact ? 0.6 : 0.5} />
        <Heart id={s.id} light />
        {s.offer && <span className="sc-offer">٪{fa(s.offer.pct)} تخفیف {CAT[s.offer.cat].name}</span>}
        <span className="sc-kind">{KINDS[s.kind].name}</span>
      </div>
      <div className="sc-body">
        <div className="sc-row">
          <h3>{s.name}{s.verified && <Icon n="verified" s={15} className="vf" />}</h3>
          <Rating v={s.rating} n={compact ? undefined : s.reviewsN} />
        </div>
        <p className="muted sc-meta"><Icon n="pin" s={13} /> {s.hood} · {area?.name} <span className="dot-sep" /> <span className="tier">{tierLabel(s.tier)}</span></p>
        {!compact && s.price != null && <p className="sc-price">از <b>{short(s.price)}</b> تومان</p>}
        {!compact && s.slots && (
          <div className="sc-slots" onClick={(e) => e.stopPropagation()}>
            {s.slots.length ? s.slots.slice(0, 5).map((h) => (
              <button key={h} onClick={() => { haptic(); onSlot ? onSlot(s, h) : nav.book({ salon: s.id, svc: s.sid ? [s.sid] : [], start: h }) }}>{hh(h)}</button>
            )) : <span className="muted small">این روز نوبت آزاد ندارد</span>}
          </div>
        )}
      </div>
    </motion.article>
  )
}

// کارت آرتیست: آدم‌ها خودشان برندند
export function ArtistCard({ a, size = 'md' }) {
  const nav = useNav()
  const { db } = useStore()
  const salon = db.salons.find((s) => s.id === a.salon)
  return (
    <motion.button className={`artist-card ${size}`} whileTap={{ scale: 0.97 }} onClick={() => nav.push({ type: 'artist', id: a.id })}>
      <Portrait a={a} size={size === 'lg' ? 84 : 64} />
      <b>{a.name}</b>
      <small className="handle" dir="ltr">@{a.handle}</small>
      <span className="ac-cats">{a.cats.slice(0, 2).map((c) => CAT[c].name).join(' · ')}</span>
      <span className="ac-foot"><Rating v={a.rating} /> <Badge a={a} /></span>
      {size === 'lg' && <small className="muted">{salon ? salon.name : 'آزادکار · در منزل'}</small>}
    </motion.button>
  )
}
