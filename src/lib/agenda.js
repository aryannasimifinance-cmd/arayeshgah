// دفتر نوبت‌ها برای پنل آرتیست و داشبورد سالن
// ساعت‌های پر پایه به نوبت با اسم مشتری و خدمت تبدیل می‌شوند؛ رزروهای واقعی (اپ و حضوری) رویشان می‌آیند
import { SV, byCat } from './catalog'
import { FIRST, LAST, baseBusy, hash, isOffDay, priceOf } from './seed'
import { addDays, pick, rng, today } from './util'

const SOURCES = ['app', 'app', 'phone', 'walkin']
export const SOURCE_NAME = { app: 'بیوتی‌ست', phone: 'تلفنی', walkin: 'حضوری' }

// مشتری‌های هر سالن (یا آرتیست آزادکار) تا مشتری تکراری داشته باشیم
const poolCache = {}
export function clientPool(key) {
  if (poolCache[key]) return poolCache[key]
  const r = rng(hash('pool' + key))
  poolCache[key] = Array.from({ length: 320 }, (_, i) => {
    const f = pick(r, FIRST)
    return { id: `${key}-c${i}`, name: `${f[0]} ${pick(r, LAST)}`, phone: `0912${String(Math.floor(r() * 1e7)).padStart(7, '0')}`, hue: Math.floor(r() * 360) }
  })
  return poolCache[key]
}

export const venueOf = (db, artist) => db.salons.find((s) => s.id === artist.salon) || { id: null, open: 9, close: 21, svc: [] }
const nowH = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60 }

// نوبت‌های یک آرتیست در یک روز
export function agenda(db, artist, date, me) {
  const v = venueOf(db, artist)
  const pool = clientPool(artist.salon || artist.id)
  const r = rng(hash('ag' + artist.id + date))
  const out = []
  const off = isOffDay(artist, date)
  if (!off) {
    const busy = baseBusy(artist, date)
    const svcs = artist.cats.flatMap((c) => byCat(c)).filter((s) => !v.id || v.svc.some((x) => x.sid === s.id))
    for (let h = v.open; h < v.close;) {
      if (!busy.has(h)) { h += 0.5; continue }
      let len = 0
      while (busy.has(h + len) && h + len < v.close) len += 0.5
      // بازه‌ی پر به چند نوبت شکسته می‌شود
      let at = h
      while (at < h + len) {
        const left = (h + len - at) * 60
        const fit = svcs.filter((s) => s.dur <= left)
        const sv = fit.length ? pick(r, fit) : pick(r, svcs)
        const dur = Math.min(Math.ceil(sv.dur / 30) * 30, left)
        out.push({ id: `${artist.id}|${date}|${at}`, artist: artist.id, salon: artist.salon, date, start: at, dur, svc: [sv.id], client: pool[Math.floor(r() ** 2.2 * pool.length)], // چند مشتری ثابت و بسیاری گاه‌به‌گاه
 price: priceOf(v.id ? v : null, sv.id, artist), source: pick(r, SOURCES) })
        at += dur / 60
      }
      h += len
    }
  }
  // رزروهای ثبت‌شده در اپ یا دستی
  db.bookings.filter((b) => b.artist === artist.id && b.date === date && b.status !== 'cancelled').forEach((b) => {
    out.push({ id: b.id, artist: artist.id, salon: b.salon, date, start: b.start, dur: b.dur, svc: b.svc, price: b.price, paid: b.paid, note: b.note, real: true,
      client: b.user === 'me' ? { id: 'me', name: me?.name || 'مشتری بیوتی‌ست', phone: me?.phone || '', hue: me?.hue } : b.client, source: b.user === 'me' ? 'app' : b.source || 'walkin' })
  })
  const t = today(), n = nowH()
  return {
    off,
    list: out.sort((a, b) => a.start - b.start).map((a) => ({
      ...a,
      status: db.marks?.[a.id] || (a.date < t || (a.date === t && a.start + a.dur / 60 <= n) ? 'done' : a.date === t && a.start <= n ? 'now' : 'upcoming'),
    })),
  }
}

// جمع یک روز برای چند آرتیست
export function dayTotals(db, artists, date) {
  let count = 0, revenue = 0, minutes = 0, open = 0
  artists.forEach((a) => {
    const v = venueOf(db, a)
    const { list, off } = agenda(db, a, date)
    if (!off) open += (v.close - v.open) * 60
    list.forEach((x) => { if (x.status !== 'noshow') { count++; revenue += x.price; minutes += x.dur } })
  })
  return { count, revenue, occ: open ? minutes / open : 0 }
}

// مشتری‌ها: تجمیع نوبت‌های ۶۰ روز گذشته و ۷ روز آینده
export function clientBook(db, artists, days = 60) {
  const m = {}
  for (let i = -days; i <= 7; i++) {
    const d = addDays(today(), i)
    artists.forEach((a) => agenda(db, a, d).list.forEach((x) => {
      const c = (m[x.client.id] ||= { ...x.client, visits: 0, spend: 0, last: null, next: null, svcs: {}, artists: {} })
      if (d <= today()) { c.visits++; c.spend += x.price; if (!c.last || d > c.last.date) c.last = x } else if (!c.next || d < c.next.date) c.next = x
      x.svc.forEach((s) => { c.svcs[s] = (c.svcs[s] || 0) + 1 })
      c.artists[a.id] = (c.artists[a.id] || 0) + 1
    }))
  }
  return Object.values(m).sort((a, b) => (b.last?.date || '').localeCompare(a.last?.date || '') || b.visits - a.visits)
}
export const favSvc = (c) => Object.entries(c.svcs).sort((a, b) => b[1] - a[1])[0]?.[0]
export { SV }
