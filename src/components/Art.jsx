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

// نقشه‌ی تزئینی پس‌زمینه‌ی دکمه‌ی «روی نقشه»: بلوک‌ها، خیابان‌ها، پارک، رود و پین‌ها
export function MapArt() {
  return (
    <svg className="map-art" viewBox="0 0 120 60" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="120" height="60" fill="#EFE7DC" />
      <path d="M0 8h34v14H0zM40 0h30v18H40zM76 0h44v12H76zM0 28h22v32H0zM28 26h30v14H28zM64 22h22v20H64zM92 18h28v16H92zM28 46h40v14H28zM74 48h46v12H74z" fill="#F8F3EC" />
      <path d="M92 38h28v8H92zM40 0h12v10H40z" fill="#CFE3C1" />
      <path d="M-4 52C18 44 30 58 54 50s38-10 70-2" fill="none" stroke="#B9D7E6" strokeWidth="6" />
      <g fill="none" stroke="#fff" strokeLinecap="round">
        <path d="M0 24h120M0 43h120M25 0v60M61 0v60M89 0v60" strokeWidth="3.4" />
        <path d="M0 4 120 56" strokeWidth="4.5" stroke="#F3D59B" />
      </g>
      <g fill="#E0584F" stroke="#fff" strokeWidth="1.2">
        <path d="M43 30c0-3.3 2.4-5.5 5-5.5s5 2.2 5 5.5c0 4-5 8.5-5 8.5s-5-4.5-5-8.5Z" /><path d="M94 16c0-2.6 1.9-4.3 4-4.3s4 1.7 4 4.3c0 3.1-4 6.6-4 6.6s-4-3.5-4-6.6Z" fill="#C7707A" /><path d="M10 40c0-2.2 1.6-3.6 3.4-3.6s3.4 1.4 3.4 3.6c0 2.7-3.4 5.6-3.4 5.6S10 42.7 10 40Z" fill="#8E6E63" />
      </g>
    </svg>
  )
}

// تصویرسازی‌های برداری کاشی‌های «انتخاب سریع» (۱۶۰×۸۰)
const QA = {
  today: ['#FFE3D6', '#F6B9A3', <>
    <rect x="58" y="16" width="44" height="42" rx="8" fill="#fff" /><path d="M58 24a8 8 0 0 1 8-8h28a8 8 0 0 1 8 8v6H58Z" fill="#E0584F" />
    <path d="M68 12v8M92 12v8" stroke="#8B3A33" strokeWidth="3" strokeLinecap="round" />
    <path d="m70 44 7 6 13-13" fill="none" stroke="#E0584F" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="108" cy="54" r="12" fill="#fff" stroke="#F0A08A" strokeWidth="2.5" /><path d="M108 47v7l5 3" fill="none" stroke="#8B3A33" strokeWidth="2.4" strokeLinecap="round" />
  </>],
  top: ['#FBEFD3', '#EBCB86', <>
    <path d="M64 16h32v14a16 16 0 0 1-32 0Z" fill="#D9A441" /><path d="M64 20H54a10 10 0 0 0 12 13M96 20h10a10 10 0 0 1-12 13" fill="none" stroke="#D9A441" strokeWidth="3.4" />
    <path d="M76 45h8v7h-8zM68 52h24v6H68z" fill="#B7832A" /><path d="m80 19 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z" fill="#fff" />
    <path d="m36 30 1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5ZM124 20l1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5Z" fill="#fff" />
  </>],
  star: ['#FBE1E6', '#E7A5B3', <>
    <path d="M60 60 88 22l8 6-28 38Z" fill="#7A4A52" /><path d="M88 22c4-8 12-12 18-8s3 13-4 18l-6 4Z" fill="#F2C7CF" stroke="#C7707A" strokeWidth="2" /><path d="M86 25l9 7" stroke="#D9A441" strokeWidth="4" />
    <path d="m118 10 2.6 7.4 7.4 2.6-7.4 2.6L118 30l-2.6-7.4-7.4-2.6 7.4-2.6ZM50 22l1.6 4.4L56 28l-4.4 1.6L50 34l-1.6-4.4L44 28l4.4-1.6Z" fill="#fff" />
    <circle cx="124" cy="44" r="3" fill="#fff" />
  </>],
  offer: ['#EDE3F3', '#C7AED8', <>
    <path d="M60 22h30l20 20-24 24-26-26Z" fill="#fff" transform="rotate(-8 85 44)" /><circle cx="72" cy="33" r="4" fill="#9C8AA5" />
    <text x="86" y="56" textAnchor="middle" fontSize="22" fontWeight="800" fill="#7E5F96" fontFamily="sans-serif">%</text>
    <circle cx="40" cy="20" r="5" fill="#fff" opacity=".7" /><circle cx="126" cy="60" r="7" fill="#fff" opacity=".6" />
  </>],
  home: ['#E4EFE5', '#A9C9AE', <>
    <path d="M56 38 80 16l24 22v24H56Z" fill="#fff" /><path d="M50 40 80 12l30 28" fill="none" stroke="#5E8C6A" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M80 58s-11-6.6-11-13.4a5.5 5.5 0 0 1 11-1 5.5 5.5 0 0 1 11 1C91 51.4 80 58 80 58Z" fill="#E0584F" />
    <path d="M120 30c4 0 7 3 7 7M34 50c-4 0-7-3-7-7" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
  </>],
  save: ['#DDF0EE', '#94CCC4', <>
    <ellipse cx="72" cy="56" rx="16" ry="5" fill="#C9962F" /><path d="M56 50v6c0 2.8 7 5 16 5s16-2.2 16-5v-6" fill="#D9A441" /><ellipse cx="72" cy="50" rx="16" ry="5" fill="#F0C565" />
    <path d="M56 42v6c0 2.8 7 5 16 5s16-2.2 16-5v-6" fill="#D9A441" /><ellipse cx="72" cy="42" rx="16" ry="5" fill="#F0C565" />
    <circle cx="100" cy="34" r="16" fill="#F0C565" stroke="#C9962F" strokeWidth="3" /><circle cx="100" cy="34" r="9.5" fill="none" stroke="#C9962F" strokeWidth="2" /><path d="m100 28.5 1.7 3.5 3.8.5-2.8 2.6.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.6 3.8-.5Z" fill="#9B6F1E" />
  </>],
}
export function QuickArt({ k }) {
  const [a, b, art] = QA[k]
  return (
    <svg className="qart" viewBox="0 0 160 80" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs><linearGradient id={`qa-${k}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient></defs>
      <rect width="160" height="80" fill={`url(#qa-${k})`} />
      <circle cx="18" cy="70" r="26" fill="#fff" opacity=".22" /><circle cx="146" cy="6" r="20" fill="#fff" opacity=".22" />
      {art}
    </svg>
  )
}
