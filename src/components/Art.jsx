import { CAT } from '../lib/catalog'
import { img } from '../lib/photos'

// طرح‌های خطی هر دسته (۲۴×۲۴)
const G = {
  hair: <><circle cx="6" cy="6" r="2.6" /><circle cx="6" cy="18" r="2.6" /><path d="M8.2 7.4 20 16M8.2 16.6 20 8" /></>,
  color: <><path d="M12 3s5 5.6 5 9.5a5 5 0 0 1-10 0C7 8.6 12 3 12 3Z" /><path d="M9.5 13.5c1 1.2 3.4 1.6 5 0" /></>,
  nail: <><path d="M10 3h4v5h-4z" /><path d="M8 8h8l1 3v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8Z" /><path d="M7.5 14h9" /></>,
  brow: <><path d="M3 13s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" /><circle cx="12" cy="13" r="2.4" /><path d="M12 4.5v2M7 5.5l1 2M17 5.5l-1 2" /></>,
  skin: <><path d="M5 19C5 10 11 5 20 5c0 9-5 14-14 14Z" /><path d="m5 19 9-9" /></>,
  makeup: <><path d="M9 21h6v-8H9z" /><path d="M9 13V8.5L13 4l2 1v8" /></>,
  bridal: <><circle cx="12" cy="15" r="5" /><path d="M9.5 7 12 4l2.5 3L12 10Z" /></>,
  wax: <><path d="M20 4C11 4 6 10 6 18l-2 2" /><path d="M6 18c6 0 11-4 12-10M9.5 13H14" /></>,
  spa: <><path d="M12 20c-4 0-8-2-9-6 3-1 6 0 9 3 3-3 6-4 9-3-1 4-5 6-9 6Z" /><path d="M12 17c-2-3-2-7 0-11 2 4 2 8 0 11Z" /></>,
  pmu: <><path d="M15 4l5 5L9 20H4v-5Z" /><path d="m13 6 5 5" /></>,
}
export function Glyph({ cat, s = 24, w = 1.4, color = 'currentColor' }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{G[cat] || G.skin}</svg>
}

// پالت هر نوع کسب‌وکار: نود، رز، تاپ، مریم‌گلی، هلو، شامپاینی
const PAL = {
  salon: ['#F4E3DD', '#E6C2B8', '#B9817C'],
  nail: ['#F7E1E4', '#E9B3BD', '#B86C7E'],
  lash: ['#EFE4DB', '#D2BBA9', '#8A6A5E'],
  spa: ['#E5EBE3', '#C2D0BE', '#6F8F88'],
  skin: ['#F7EADD', '#EACDAF', '#B98F68'],
  bridal: ['#F5EEE2', '#E5D3AF', '#A88552'],
}

// کاور سالن: عکس اصلی (یا عکس i ام گالری)
export function Cover({ salon, ratio = 0.62, i = 0, className = '' }) {
  const id = salon.photos?.[i % (salon.photos?.length || 1)]
  return (
    <div className={`cover ${className}`} style={{ aspectRatio: `${1 / ratio}`, background: (PAL[salon.kind] || PAL.salon)[1] }}>
      {id && <img src={img(id)} alt="" loading="lazy" decoding="async" />}
    </div>
  )
}

// نمونه‌کار آرتیست
export function Work({ w, className = '' }) {
  return (
    <div className={`work ${className}`} style={{ background: CAT[w.cat]?.tone }}>
      {w.ph && <img src={img(w.ph)} alt={w.title} loading="lazy" decoding="async" />}
    </div>
  )
}

// پرتره‌ی آرتیست: عکس کار امضایش در قاب گرد، با حلقه‌ی طلایی برای ستاره‌ها
export function Portrait({ a, size = 64, ring = true }) {
  const ph = a.works?.[0]?.ph
  return (
    <span className={`portrait ${ring ? 'ring' : ''} ${a.badge === 'star' ? 'star' : ''}`} style={{ width: size, height: size }}>
      {ph ? <img src={img(ph)} alt="" loading="lazy" /> : <b>{a.name[0]}</b>}
      {size >= 56 && <i>{a.name[0]}</i>}
    </span>
  )
}
