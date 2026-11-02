import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from '../screens/Shell'
import { Badge, Icon, Rating } from './ui'
import { Portrait } from './Art'
import { img } from '../lib/photos'
import { areaOf } from '../lib/geo'
import { CAT } from '../lib/catalog'
import { KINDS } from '../lib/seed'
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

// کارت سالن: ردیفی جمع‌وجور (عکس کنار، اطلاعات، چند ساعت آزاد) — compact برای ریل‌ها
export function SalonCard({ s, onSlot, compact }) {
  const nav = useNav()
  const area = areaOf(s.city, s.area)
  const open = () => nav.push({ type: 'salon', id: s.id })
  if (compact) return (
    <motion.article className="sc-mini" whileTap={{ scale: 0.98 }} onClick={open}>
      <div className="scm-ph"><img src={img(s.photos[0])} alt="" loading="lazy" /><Heart id={s.id} light />{s.offer && <span className="sc-offer">٪{fa(s.offer.pct)}</span>}</div>
      <b>{s.name}</b>
      <small className="muted">{s.hood} · <Icon n="star" s={10} fill="currentColor" w={0} className="gold" /> {fa(s.rating.toFixed(1))}</small>
    </motion.article>
  )
  return (
    <motion.article className="sc-row" layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={open}>
      <div className="scr-ph"><img src={img(s.photos[0])} alt="" loading="lazy" />{s.offer && <span className="sc-offer">٪{fa(s.offer.pct)}</span>}</div>
      <div className="scr-body">
        <div className="scr-top"><h3>{s.name}{s.verified && <Icon n="verified" s={14} className="vf" />}</h3><Heart id={s.id} /></div>
        <small className="muted">{KINDS[s.kind].name} · {s.hood}، {area?.name}</small>
        <span className="scr-meta"><Rating v={s.rating} n={s.reviewsN} />{s.price != null && <em>از {short(s.price)}</em>}</span>
        {s.slots && (
          <div className="scr-slots" onClick={(e) => e.stopPropagation()}>
            {s.slots.length ? <>
              {s.slots.slice(0, 3).map((h) => <button key={h} onClick={() => { haptic(); onSlot ? onSlot(s, h) : nav.book({ salon: s.id, svc: s.sid && s.picked ? [s.sid] : [], start: h }) }}>{hh(h)}</button>)}
              {s.slots.length > 3 && <span className="more">+{fa(s.slots.length - 3)}</span>}
            </> : <span className="muted small">این روز پر است</span>}
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
