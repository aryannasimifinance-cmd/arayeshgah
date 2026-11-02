import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { SEED_V, seedDB } from './lib/seed'
import { uid } from './lib/util'

const KEY = 'beautyset:v1'
const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

const freshMe = (p = {}) => ({
  name: '', phone: '', city: 'tehran', area: null, wallet: 2500000, hue: 340,
  favs: [], follows: [], notes: [{ id: 'n0', text: 'به بیوتی‌ست خوش اومدید ✨ اولین رزروتون ۱۵٪ تخفیف داره.', t: Date.now(), read: false }],
  ...p,
})

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    if (s?.db?.v === SEED_V) return s
  } catch { /* داده‌ی خراب: از نو */ }
  return { db: seedDB(), me: null }
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)
  const [toasts, setToasts] = useState([])
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* حالت خصوصی */ } }, [state])

  const toast = useCallback((t) => {
    const id = uid('t')
    setToasts((x) => [...x, { ...t, id }])
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), t.ms || 2600)
  }, [])
  const setDB = (f) => setState((s) => ({ ...s, db: { ...s.db, ...f(s.db) } }))
  const setMe = (f) => setState((s) => ({ ...s, me: { ...s.me, ...f(s.me) } }))

  const api = useMemo(() => ({
    login: (p) => setState((s) => ({ ...s, me: freshMe(p) })),
    logout: () => setState((s) => ({ ...s, me: null })),
    reset: () => { localStorage.removeItem(KEY); setState({ db: seedDB(), me: null }) },
    updateMe: (p) => setMe(() => p),
    toggleFav: (id) => setMe((m) => ({ favs: m.favs.includes(id) ? m.favs.filter((x) => x !== id) : [...m.favs, id] })),
    toggleFollow: (id) => {
      setMe((m) => ({ follows: m.follows.includes(id) ? m.follows.filter((x) => x !== id) : [...m.follows, id] }))
      setDB((db) => ({ artists: db.artists.map((a) => (a.id === id ? { ...a, followers: a.followers + (state.me?.follows.includes(id) ? -1 : 1) } : a)) }))
    },
    readNotes: () => setMe((m) => ({ notes: m.notes.map((n) => ({ ...n, read: true })) })),
    // b: { salon, artist, svc[], date, start, dur, price, paid, method, note }
    book: (b) => {
      const id = uid('b')
      setDB((db) => ({ bookings: [...db.bookings, { ...b, id, status: 'confirmed', reviewed: false, user: 'me', t: Date.now() }] }))
      setMe((m) => ({
        wallet: b.method === 'wallet' ? m.wallet - b.paid : m.wallet,
        notes: [{ id: uid('n'), text: 'نوبت شما ثبت شد. یک روز قبل یادآوری می‌فرستیم.', t: Date.now(), read: false }, ...m.notes],
      }))
      return id
    },
    cancel: (id) => {
      setDB((db) => ({ bookings: db.bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)) }))
      const b = state.db.bookings.find((x) => x.id === id)
      if (b) setMe((m) => ({ wallet: m.wallet + b.paid }))
    },
    // نظر فقط برای نوبت انجام‌شده؛ امتیاز سالن و آرتیست به‌روز می‌شود
    review: (bid, { scores, text, tags }) => setDB((db) => {
      const b = db.bookings.find((x) => x.id === bid)
      const avg = Object.values(scores).reduce((a, x) => a + x, 0) / 5
      const bump = (o) => ({ ...o, rating: Math.round(((o.rating * o.reviewsN + avg) / (o.reviewsN + 1)) * 10) / 10, reviewsN: o.reviewsN + 1 })
      return {
        reviews: [{ id: uid('r'), salon: b.salon, artist: b.artist, user: state.me?.name || 'شما', hue: state.me?.hue, svc: b.svc[0], scores, text, tags, t: Date.now(), reply: null, verified: true, mine: true }, ...db.reviews],
        bookings: db.bookings.map((x) => (x.id === bid ? { ...x, reviewed: true } : x)),
        salons: db.salons.map((s) => (s.id === b.salon ? bump(s) : s)),
        artists: db.artists.map((a) => (a.id === b.artist ? bump(a) : a)),
      }
    }),
  }), [state])

  const value = { ...state, ...api, toast, toasts }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// دسترسی سریع
export const useSalon = (id) => useStore().db.salons.find((s) => s.id === id)
export const useArtist = (id) => useStore().db.artists.find((a) => a.id === id)
