import { useMemo } from 'react'
import { useStore } from '../store'
import { CITIES, areaOf } from './geo'
import { DAYPARTS, SERVICES, SV, byCat } from './catalog'
import { KINDS, freeStarts, fromPrice } from './seed'
import { today } from './util'

export const BLANK = { areas: [], cat: '', sid: '', date: today(), daypart: '', text: '', minRating: 0, amen: [], tiers: [], sort: 'best', kind: '', freeOnly: false }

const norm = (s) => (s || '').toLowerCase().replace(/[‌\s]+/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک')
export const isOpen = (s) => { const h = new Date().getHours(); return h >= s.open && h < s.close }

// خلاصه‌ی جستجو: سالن‌ها با ساعت‌های آزاد بعدی، آرتیست‌ها و خدمات منطبق
export function useSearch(q) {
  const { db, me } = useStore()
  const city = me.city
  return useMemo(() => {
    const t = norm(q.text)
    const art = Object.fromEntries(db.artists.map((a) => [a.id, a]))
    const dp = DAYPARTS.find((d) => d.id === q.daypart) || DAYPARTS[0]
    const sids = q.sid ? [q.sid] : q.cat ? byCat(q.cat).map((s) => s.id) : []
    const match = (s) => {
      if (!t) return true
      const area = areaOf(s.city, s.area)
      const hay = [s.name, s.en, s.hood, area?.name, ...(area?.hoods || []), KINDS[s.kind].name, ...s.artists.flatMap((id) => [art[id].name, art[id].handle]), ...s.svc.map((x) => SV[x.sid].name)]
      return hay.some((h) => norm(h).includes(t))
    }
    let list = db.salons.filter((s) => s.city === city
      && (!q.areas.length || q.areas.includes(s.area))
      && (!sids.length || s.svc.some((x) => sids.includes(x.sid)))
      && (!q.kind || s.kind === q.kind)
      && s.rating >= q.minRating
      && q.amen.every((x) => s.amen.includes(x))
      && (!q.tiers.length || q.tiers.includes(s.tier))
      && match(s))
    // ساعت‌های آزاد روز انتخابی برای خدمت انتخابی
    list = list.map((s) => {
      const sid = q.sid || s.svc.find((x) => !q.cat || SV[x.sid].cat === q.cat)?.sid
      const dur = sid ? SV[sid].dur : 60
      const pros = s.artists.map((id) => art[id]).filter((a) => !sid || a.cats.includes(SV[sid].cat))
      const set = new Set()
      pros.forEach((a) => freeStarts(s, a, q.date, dur, db.bookings, dp.from, dp.to).forEach((h) => set.add(h)))
      const slots = [...set].sort((a, b) => a - b)
      const price = q.sid ? s.svc.find((x) => x.sid === q.sid)?.price : fromPrice(s, q.cat)
      return { ...s, slots, price, sid, picked: !!q.sid }
    })
    if (q.freeOnly) list = list.filter((s) => s.slots.length)
    const score = (s) => s.rating * 2 + Math.log10(s.reviewsN) + (s.verified ? 0.4 : 0) + (s.slots.length ? 0.6 : 0) + (me.area === s.area ? 0.8 : 0)
    const sorts = {
      best: (a, b) => score(b) - score(a),
      rating: (a, b) => b.rating - a.rating || b.reviewsN - a.reviewsN,
      price: (a, b) => (a.price ?? 1e12) - (b.price ?? 1e12),
      soon: (a, b) => (a.slots[0] ?? 99) - (b.slots[0] ?? 99),
    }
    list.sort(sorts[q.sort] || sorts.best)

    const artists = db.artists.filter((a) => a.city === city
      && (!q.areas.length || q.areas.includes(a.area))
      && (!q.cat || a.cats.includes(q.cat)) && (!q.sid || a.cats.includes(SV[q.sid].cat))
      && (!t || [a.name, a.handle].some((h) => norm(h).includes(t))))
      .sort((a, b) => (b.badge === 'star') - (a.badge === 'star') || b.rating - a.rating)
    const services = t ? SERVICES.filter((s) => norm(s.name).includes(t)).slice(0, 4) : []
    // تطابق کامل و از ابتدا جلوتر؛ «ونک» نباید اول «پونک» را بیاورد
    const rank = (a) => Math.max(...[a.name, ...a.hoods].map((h) => (norm(h) === t ? 3 : norm(h).startsWith(t) ? 2 : norm(h).includes(t) ? 1 : 0)))
    const areas = t ? CITIES[city].areas.filter((a) => rank(a) > 0).sort((a, b) => rank(b) - rank(a)).slice(0, 4) : []
    return { list, artists, services, areas }
  }, [db, city, me.area, JSON.stringify(q)])
}

// تعداد سالن هر ناحیه برای رنگ نقشه
export function useAreaStats(salons) {
  return useMemo(() => salons.reduce((m, s) => ({ ...m, [s.area]: (m[s.area] || 0) + 1 }), {}), [salons])
}
