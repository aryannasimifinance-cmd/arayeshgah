// ابزارهای مشترک: عدد فارسی، پول، تاریخ شمسی، اعداد تصادفی تکرارپذیر

export const fa = (n) => (n == null ? '' : String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]))
export const num = (n) => Math.round(n).toLocaleString('fa-IR')
// مبالغ به تومان؛ بالای میلیون کوتاه نوشته می‌شود
export const toman = (n) => `${num(n)} تومان`
export const short = (n) => {
  if (n >= 1e9) return `${(n / 1e9).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیارد`
  if (n >= 1e6) return `${(n / 1e6).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیون`
  if (n >= 1e3) return `${num(n / 1e3)} هزار`
  return num(n)
}
export const pct = (x) => `٪${num(x * 100)}`

// ---------- تاریخ ----------
export const DAY = 864e5
export const dkey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}` }
export const today = () => dkey(Date.now())
export const addDays = (key, n) => { const [y, m, d] = key.split('-').map(Number); return dkey(new Date(y, m - 1, d + n)) }
export const toDate = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d) }
export const diffDays = (a, b) => Math.round((toDate(a) - toDate(b)) / DAY)
const fmt = (o) => new Intl.DateTimeFormat('fa-IR-u-ca-persian', o)
export const weekday = (key) => fmt({ weekday: 'long' }).format(toDate(key))
export const wdShort = (key) => fmt({ weekday: 'short' }).format(toDate(key))
export const dayNum = (key) => fmt({ day: 'numeric' }).format(toDate(key))
export const monthName = (key) => fmt({ month: 'long' }).format(toDate(key))
export const dateLong = (key) => fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(toDate(key))
export const dateShort = (key) => fmt({ day: 'numeric', month: 'long' }).format(toDate(key))
export const relDay = (key) => {
  const n = diffDays(key, today())
  if (n === 0) return 'امروز'
  if (n === 1) return 'فردا'
  if (n === -1) return 'دیروز'
  if (n === 2) return 'پس‌فردا'
  return weekday(key)
}
export const hh = (h) => fa(`${String(Math.floor(h) % 24).padStart(2, '0')}:${h % 1 ? '۳۰' : '۰۰'}`)
export const span = (h, dur) => `${hh(h)} تا ${hh(h + dur)}`
export const ago = (t) => {
  const m = Math.round((Date.now() - t) / 6e4)
  if (m < 1) return 'همین حالا'
  if (m < 60) return `${fa(m)} دقیقه پیش`
  if (m < 1440) return `${fa(Math.round(m / 60))} ساعت پیش`
  return `${fa(Math.round(m / 1440))} روز پیش`
}
// کلید مرتب‌سازی زمانی رزروها
export const bkey = (b) => `${b.date}${String(Math.round(b.start * 10)).padStart(3, '0')}`
export const isFriday =(key) => toDate(key).getDay() === 5

// ---------- تصادفی تکرارپذیر (برای داده‌ی نمونه) ----------
export function rng(seed) {
  let s = seed >>> 0
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
export const pick = (r, arr) => arr[Math.floor(r() * arr.length)]
export const uid = (p = 'x') => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
export const sum = (arr, f = (x) => x) => arr.reduce((a, x) => a + f(x), 0)
export const groupBy = (arr, f) => arr.reduce((m, x) => { const k = f(x); (m[k] ||= []).push(x); return m }, {})
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x))

// فاصله‌ی تقریبی دو نقطه به کیلومتر
export function km(a, b) {
  const R = 6371, r = Math.PI / 180
  const dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

export function haptic(ms = 8) { try { navigator.vibrate?.(ms) } catch { /* پشتیبانی نمی‌شود */ } }
