import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import { useStore } from '../store'
import { fa } from '../lib/util'

// آیکون‌های خطی ۲۴×۲۴
const P = {
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4.2-4.2',
  pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  star: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z',
  heart: 'M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z',
  back: 'm9 6 6 6-6 6', fwd: 'm15 6-6 6 6 6', close: 'M6 6l12 12M18 6 6 18', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14',
  check: 'm5 12.5 4.5 4.5L19 7.5', clock: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
  cal: 'M4 8h16M8 3v3M16 3v3M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  home: 'M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1Z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0m1-9a3 3 0 1 0 0-6m2 15h3a5 5 0 0 0-4-5',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15ZM10 20a2 2 0 0 0 4 0',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2Zm0 0v14m6-12v14', list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  filter: 'M4 6h16M7 12h10M10 18h4', wallet: 'M4 7h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Zm0 0 12-3v3m0 7h2',
  bolt: 'M13 3 5 13h6l-1 8 8-10h-6Z', car: 'M5 16h14v-4l-2-5H7l-2 5Zm2 0v2m10-2v2M5 12h14',
  lock: 'M6 11h12v9H6Zm2 0V8a4 4 0 0 1 8 0v3', cup: 'M5 8h11v6a5 5 0 0 1-10 0Zm11 1h2a2 2 0 0 1 0 4h-2M8 3v2m3-2v2',
  shield: 'M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6Z', verified: 'M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6Zm-3.5 9 2.5 2.5 4.5-5',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10', grid: 'M4 4h7v7H4Zm9 0h7v7h-7ZM4 13h7v7H4Zm9 0h7v7h-7Z',
  money: 'M3 7h18v10H3Zm9 2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z', gift: 'M4 11h16v9H4Zm-1-4h18v4H3Zm9 0v13M12 7S10 3 8 4s0 3 4 3Zm0 0s2-4 4-3 0 3-4 3Z',
  locate: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v4m0 12v4M2 12h4m12 0h4',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-15v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z', sunset: 'M3 18h18M7 18a5 5 0 0 1 10 0M12 4v4M5 9l2 2m12-2-2 2',
  leaf: 'M5 19C5 10 11 5 20 5c0 9-5 14-14 14Zm0 0 9-9', sparkle: 'M12 3c.6 4.8 2.2 6.4 7 7-4.8.6-6.4 2.2-7 7-.6-4.8-2.2-6.4-7-7 4.8-.6 6.4-2.2 7-7Zm7 11c.3 2 .9 2.7 3 3-2.1.3-2.7 1-3 3-.3-2-.9-2.7-3-3 2.1-.3 2.7-1 3-3Z',
  crown: 'M4 18h16M5 15 4 7l5 4 3-6 3 6 5-4-1 8Z', camera: 'M4 8h4l2-3h4l2 3h4v11H4Zm8 3a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
  share: 'M16 8a3 3 0 1 0 0-.01M8 15a3 3 0 1 0 0-.01M16 22a3 3 0 1 0 0-.01M10.5 13.5l3-2M10.5 16.5l3 2', phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 17h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7',
  chat: 'M4 5h16v11H9l-5 4Z', bag: 'M5 8h14l-1 12H6Zm4 0V6a3 3 0 0 1 6 0v2', users2: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0', tag: 'M3 12V4h8l10 10-8 8Zm5-5h.01', trend: 'M3 17l6-6 4 4 8-8M15 7h6v6', gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-3 2-1-2-3.5-2 .7a7 7 0 0 0-1.7-1L15 5h-4l-.3 2.2a7 7 0 0 0-1.7 1l-2-.7L5 11l2 1-2 1 2 3.5 2-.7a7 7 0 0 0 1.7 1L11 19h4l.3-2.2a7 7 0 0 0 1.7-1l2 .7L21 13Z',
}
export function Icon({ n, s = 20, w = 1.7, fill, className, style }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill || 'none'} stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden>
      <path d={P[n] || P.sparkle} />
    </svg>
  )
}

export function Stars({ v, s = 13 }) {
  return (
    <span className="stars" aria-label={`${v} از ۵`}>
      {[1, 2, 3, 4, 5].map((i) => <Icon key={i} n="star" s={s} w={1.4} fill={i <= Math.round(v) ? 'currentColor' : 'none'} />)}
    </span>
  )
}
export const Rating = ({ v, n }) => (
  <span className="rating"><Icon n="star" s={12} fill="currentColor" w={0} /> <b>{fa(v.toFixed(1))}</b>{n != null && <span className="muted">({n.toLocaleString('fa-IR')})</span>}</span>
)

// آواتار تک‌حرفی روی گرادیان نود
export function Avatar({ u, size = 36, ring }) {
  const name = u?.name || '؟'
  const hue = u?.hue ?? 340
  return (
    <span className="avatar" style={{
      width: size, height: size, fontSize: size * 0.42,
      background: `linear-gradient(145deg, hsl(${hue} 45% 90%), hsl(${(hue + 30) % 360} 35% 78%))`, color: `hsl(${hue} 30% 26%)`,
      boxShadow: ring ? `0 0 0 2px var(--paper), 0 0 0 3.5px ${ring}` : undefined,
    }}>{name[0]}</span>
  )
}

export function Sheet({ open, onClose, children, title, full, className = '' }) {
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  const host = document.getElementById('portal') || document.body
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="sheet-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="sheet-bg" onClick={onClose} />
          <motion.div className={`sheet ${full ? 'full' : ''} ${className}`} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}>
            <div className="sheet-grip" />
            {title && <div className="sheet-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="بستن"><Icon n="close" /></button></div>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    host,
  )
}

export function Toasts() {
  const { toasts } = useStore()
  return (
    <div className="toasts">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} className="toast" initial={{ y: -30, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -20, opacity: 0 }}>
            {t.icon && <span className="toast-ico">{t.icon}</span>}<span>{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export const Chip = ({ on, children, onClick, className = '' }) => (
  <button className={`chip ${on ? 'on' : ''} ${className}`} onClick={onClick}>{children}</button>
)
export const Seg = ({ items, value, onChange, id = 'seg' }) => (
  <div className="seg">
    {items.map(([v, label]) => (
      <button key={v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>
        {value === v && <motion.span layoutId={id} className="seg-ind" transition={{ type: 'spring', damping: 30, stiffness: 400 }} />}
        <span>{label}</span>
      </button>
    ))}
  </div>
)
export const Empty = ({ icon = 'sparkle', title, text, children }) => (
  <div className="empty"><span className="empty-ico"><Icon n={icon} s={24} /></span><b>{title}</b>{text && <p>{text}</p>}{children}</div>
)
export const Badge = ({ a }) => a.badge === 'star'
  ? <span className="badge star"><Icon n="crown" s={11} w={2} /> ستاره</span>
  : a.badge === 'rising' ? <span className="badge rising"><Icon n="trend" s={11} w={2} /> رو به رشد</span> : null
