import { useId } from 'react'
import { CAT } from '../lib/catalog'
import { rng } from '../lib/util'

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

// کاور سالن: طاق آینه‌ای + لکه‌های نرم + نقش دسته؛ از بذر هر سالن ساخته می‌شود
export function Cover({ salon, ratio = 0.62, glyph = true, className = '' }) {
  const id = useId().replace(/:/g, '')
  const r = rng(salon.seed)
  const [a, b, c] = PAL[salon.kind] || PAL.salon
  const W = 400, H = W * ratio
  const blobs = Array.from({ length: 3 }, () => ({ x: r() * W, y: r() * H, rr: 90 + r() * 140 }))
  const ax = 70 + r() * (W - 200), aw = 120, ah = H * 0.78
  return (
    <svg className={`cover ${className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
        <radialGradient id={`b${id}`}><stop offset="0" stopColor={c} stopOpacity=".55" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>
        <radialGradient id={`w${id}`}><stop offset="0" stopColor="#fff" stopOpacity=".7" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <filter id={`n${id}`}><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0" /></filter>
      </defs>
      <rect width={W} height={H} fill={`url(#g${id})`} />
      {blobs.map((o, i) => <circle key={i} cx={o.x} cy={o.y} r={o.rr} fill={`url(#${i ? 'b' : 'w'}${id})`} />)}
      {/* طاق */}
      <path d={`M${ax} ${H} V${H - ah + aw / 2} a${aw / 2} ${aw / 2} 0 0 1 ${aw} 0 V${H}`} fill="#fff" fillOpacity=".22" stroke="#fff" strokeOpacity=".75" strokeWidth="1.2" />
      <path d={`M${ax + 10} ${H} V${H - ah + aw / 2 + 4} a${aw / 2 - 10} ${aw / 2 - 10} 0 0 1 ${aw - 20} 0 V${H}`} fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth=".8" />
      {glyph && <g transform={`translate(${ax + aw / 2 - 22} ${H - ah / 2 - 10}) scale(1.85)`}><g stroke="#fff" strokeWidth=".9" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".95">{G[salon.cats[0]]}</g></g>}
      <rect width={W} height={H} filter={`url(#n${id})`} />
    </svg>
  )
}

// کاشی نمونه‌کار آرتیست: هر دسته یک نقش انتزاعی دارد
export function Work({ w, className = '' }) {
  const id = useId().replace(/:/g, '')
  const r = rng(w.seed)
  const tone = CAT[w.cat]?.tone || '#C9A27E'
  const hue = r() * 40 - 20
  const S = 200
  const waves = Array.from({ length: 7 }, (_, i) => i)
  return (
    <svg className={`work ${className}`} viewBox={`0 0 ${S} ${S}`} aria-hidden style={{ filter: `hue-rotate(${hue}deg)` }}>
      <defs>
        <linearGradient id={`k${id}`} x1="0" y1="0" x2={r()} y2="1"><stop offset="0" stopColor="#FBF4EF" /><stop offset="1" stopColor={tone} /></linearGradient>
        <radialGradient id={`h${id}`} cx=".3" cy=".25"><stop offset="0" stopColor="#fff" stopOpacity=".8" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width={S} height={S} fill={`url(#k${id})`} />
      {(w.cat === 'hair' || w.cat === 'color' || w.cat === 'bridal') && waves.map((i) => (
        <path key={i} d={`M${-20 + i * 12} ${-10} C ${60 + i * 14 + r() * 30} ${60}, ${-10 + i * 18} ${130}, ${70 + i * 16} ${S + 20}`} fill="none" stroke="#fff" strokeOpacity={0.25 + (i % 3) * 0.15} strokeWidth={6 + r() * 8} strokeLinecap="round" />
      ))}
      {w.cat === 'nail' && [0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${28 + i * 32} ${70 + Math.abs(2 - i) * 14}) rotate(${(i - 2) * 6})`}>
          <rect x="-11" y="0" width="22" height="58" rx="11" fill="#fff" fillOpacity=".35" />
          <rect x="-9" y="2" width="18" height="34" rx="9" fill={tone} stroke="#fff" strokeOpacity=".8" />
          <ellipse cx="-3" cy="12" rx="2.5" ry="7" fill="#fff" fillOpacity=".6" />
        </g>
      ))}
      {(w.cat === 'brow' || w.cat === 'pmu') && <g fill="none" stroke="#5A4038" strokeOpacity=".55" strokeLinecap="round">
        <path d="M45 82 Q100 52 160 76" strokeWidth="9" />
        <path d="M50 122 Q100 96 152 122 Q100 146 50 122Z" strokeWidth="2" />
        {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${62 + i * 10} ${110 - Math.sin(i / 2.6) * 6} l${-4 + i} -12`} strokeWidth="1.6" />)}
        <circle cx="101" cy="122" r="11" fill="#5A4038" fillOpacity=".4" stroke="none" />
      </g>}
      {(w.cat === 'makeup') && <g transform="translate(100 108)">
        <path d="M-56 0 C-30 -26 -12 -18 0 -10 C 12 -18 30 -26 56 0 C 30 30 -30 30 -56 0Z" fill={tone} fillOpacity=".9" stroke="#fff" strokeOpacity=".6" />
        <path d="M-56 0 C-20 6 20 6 56 0" fill="none" stroke="#fff" strokeOpacity=".5" />
      </g>}
      {(w.cat === 'skin' || w.cat === 'spa' || w.cat === 'wax') && [0, 1, 2].map((i) => (
        <circle key={i} cx={60 + i * 42} cy={120 - (i % 2) * 22} r={26 - i * 3} fill="#fff" fillOpacity={0.25 + i * 0.12} stroke="#fff" strokeOpacity=".6" />
      ))}
      <rect width={S} height={S} fill={`url(#h${id})`} />
    </svg>
  )
}

// پرتره‌ی آرتیست: حرف اول نام روی گرادیان گرم + حلقه‌ی ظریف
export function Portrait({ a, size = 64, ring = true }) {
  const id = useId().replace(/:/g, '')
  const h = a.hue % 50 // رنج نود و رز
  const c1 = `hsl(${(h + 5) % 360} 45% 88%)`, c2 = `hsl(${(h + 345) % 360} 30% 70%)`
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="portrait" aria-hidden>
      <defs><linearGradient id={`p${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient></defs>
      {ring && <circle cx="50" cy="50" r="49" fill="none" stroke={a.badge === 'star' ? 'var(--gold)' : 'var(--line-2)'} strokeWidth="1.5" />}
      <circle cx="50" cy="50" r={ring ? 44 : 50} fill={`url(#p${id})`} />
      {/* نیم‌رخ خطی */}
      <path d="M58 26c-9-4-21 1-23 12-1 6 1 9-1 13l-4 6 5 2c0 4 0 8 3 9 3 1 7 0 9 0l1 10" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M58 26c10 4 14 16 11 27-3 10-2 18 4 26" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.3" strokeLinecap="round" />
      <text x="73" y="40" textAnchor="middle" fontSize="20" fill="#fff" fontWeight="700" style={{ fontFamily: 'var(--fa)' }}>{a.name[0]}</text>
    </svg>
  )
}
