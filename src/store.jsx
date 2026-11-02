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
    if (s?.db?.v === SEED_V) return { accounts: [], ...s, session: s.session || (s.me ? { role: 'customer' } : null) }
  } catch { /* داده‌ی خراب: از نو */ }
  return { db: seedDB(), me: null, session: null, accounts: [] }
}

// حساب‌های نمونه برای ارائه (رمز همه ۱۲۳۴)
export const DEMO_PASS = '1234'
export const demoAccounts = (db) => [
  { username: 'negar', phone: '09120000000', pass: DEMO_PASS, role: 'customer', name: 'نگار کاظمی', city: 'tehran', area: 't2' },
  ...(() => { const a = db.artists.find((x) => x.badge === 'star' && x.salon); return a ? [{ username: a.handle, phone: '09121111111', pass: DEMO_PASS, role: 'artist', id: a.id, name: a.name }] : [] })(),
  ...(() => { const s = db.salons.find((x) => x.kind === 'salon' && x.city === 'tehran'); return s ? [{ username: 'salon', phone: '09122222222', pass: DEMO_PASS, role: 'manager', id: s.id, name: s.name }] : [] })(),
]

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
    // سه نقش: customer (مشتری) · artist (آرتیست، id) · manager (مدیر سالن، id)
    login: (p) => setState((s) => ({ ...s, me: freshMe(p), session: { role: 'customer' } })),
    loginPro: (role, id) => setState((s) => ({ ...s, session: { role, id } })),
    logout: () => setState((s) => ({ ...s, me: s.session?.role === 'customer' ? null : s.me, session: null })),
    reset: () => { localStorage.removeItem(KEY); setState({ db: seedDB(), me: null, session: null, accounts: [] }) },
    // ورود با نام کاربری/موبایل و رمز؛ خروجی: نقش یا پیام خطا
    signIn: (user, pass) => {
      const u = user.trim().toLowerCase().replace(/^@/, '')
      const acc = [...state.accounts, ...demoAccounts(state.db)].find((a) => a.username.toLowerCase() === u || a.phone === u)
      if (!acc) return { error: 'حسابی با این مشخصات پیدا نشد' }
      if (acc.pass !== pass) return { error: 'رمز عبور درست نیست' }
      setState((s) => acc.role === 'customer'
        ? { ...s, me: s.me?.phone === acc.phone ? s.me : freshMe({ name: acc.name, phone: acc.phone, city: acc.city, area: acc.area, hue: 345 }), session: { role: 'customer' } }
        : { ...s, session: { role: acc.role, id: acc.id } })
      return { ok: true }
    },
    signUp: (acc) => setState((s) => ({ ...s, accounts: [...s.accounts, { ...acc, role: 'customer' }], me: freshMe({ name: acc.name, phone: acc.phone, city: acc.city, area: acc.area, hue: 330 + Math.floor(Math.random() * 40) }), session: { role: 'customer' } })),
    accountExists: (user) => [...state.accounts, ...demoAccounts(state.db)].some((a) => a.username.toLowerCase() === user.toLowerCase() || a.phone === user),
    resetPass: (phone, pass) => setState((s) => ({ ...s, accounts: s.accounts.map((a) => (a.phone === phone ? { ...a, pass } : a)) })),
    // ---- آرتیست ----
    toggleOff: (aid, date) => setDB((db) => ({ artists: db.artists.map((a) => (a.id === aid ? { ...a, off: (a.off || []).includes(date) ? a.off.filter((d) => d !== date) : [...(a.off || []), date] } : a)) })),
    mark: (id, status) => setDB((db) => ({ marks: { ...(db.marks || {}), [id]: status } })),
    updateArtist: (aid, p) => setDB((db) => ({ artists: db.artists.map((a) => (a.id === aid ? { ...a, ...p } : a)) })),
    // ---- مدیر سالن ----
    addWalkin: (b) => setDB((db) => ({ bookings: [...db.bookings, { ...b, id: uid('w'), status: 'confirmed', user: 'walkin', t: Date.now() }] })),
    reply: (rid, text) => setDB((db) => ({ reviews: db.reviews.map((r) => (r.id === rid ? { ...r, reply: text } : r)) })),
    updateSalon: (sid, f) => setDB((db) => ({ salons: db.salons.map((s) => (s.id === sid ? { ...s, ...f(s) } : s)) })),
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
