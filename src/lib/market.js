// مارکت‌پلیس، عاملین فروش و حساب‌های پلتفرم
import { FIRST, LAST, baseBusy } from './seed'
import { SV } from './catalog'
import { addDays, monthName, pick, rng, today } from './util'

// ---------- تنظیمات پیش‌فرض کسب‌وکار ----------
export const DEFAULTS = {
  bookingRate: 0.1, // کارمزد بیوتی‌ست از نوبت‌های آنلاین
  shopRate: 0.12, // کارمزد بیوتی‌ست از فروش فروشگاه‌ها
  agentRate: 0.2, // سهم عامل فروش از کارمزدی که پلتفرم از معرفی‌های او می‌گیرد
  agentMonths: 12, // سهم عامل تا چند ماه بعد از معرفی
}

export const PCATS = [
  { id: 'skin', name: 'مراقبت پوست' },
  { id: 'makeup', name: 'آرایشی' },
  { id: 'hair', name: 'مو' },
  { id: 'nail', name: 'ناخن' },
  { id: 'perfume', name: 'عطر' },
  { id: 'tools', name: 'ابزار حرفه‌ای' },
]
export const PCAT = Object.fromEntries(PCATS.map((c) => [c.id, c]))

// عکس محصولات بدون نشان تجاری
const PPH = {
  skin: ['1583209814683-c023dd293cc6', '1629198688000-71f23e745b6e', '1612817288484-6f916006741a', '1620916566398-39f1143ab7be', '1781344116880-029945a42b75', '1608979048467-6194dabc6a3d', '1580870069867-74c57ee1bb07', '1608571423902-eed4a5ad8108'],
  makeup: ['1631730486572-226d1f595b68', '1773372238338-f26460145162', '1631214499500-2e34edcaccfe', '1596704017254-9b121068fb31', '1596462502278-27bfdc403348', '1598528738936-c50861cc75a9'],
  hair: ['1771535626784-7de36a960c1a', '1762815716180-1d3a167828f8', '1786725009844-3daea6bd1fb0', '1760488295641-3a73bde6e872', '1602143407151-7111542de6e8'],
  nail: ['1602585578130-c9076e09330d', '1759526997116-c8f4f2431869', '1619607146034-5a05296c8f9a'],
  perfume: ['1784183972601-17a1b00ea05e', '1761659760494-32b921a2449f', '1458538977777-0549b2370168', '1622618991746-fe6004db3a47', '1760920250029-36af9369a0bb', '1773527142311-cb06ee861d98'],
  tools: ['1596462502278-27bfdc403348', '1511923199659-1c16881689de', '1595475884562-073c30d45670'],
}
export const SHOP_PH = ['1742631454377-3eb6645b4780', '1754321159253-8c9bd02cfb4c', '1736236279745-b2c000357470', '1676570092589-a6c09ecbb373', '1736236560164-bc741c70bca5', '1760621393386-3906922b0b78']

const P = (cat, name, price) => ({ cat, name, price })
const CATALOG = [
  P('skin', 'سرم ویتامین C', 690000), P('skin', 'کرم آبرسان هیالورونیک', 540000), P('skin', 'ضدآفتاب SPF50 بی‌رنگ', 480000), P('skin', 'تونر گل رز', 320000),
  P('skin', 'ماسک ورقه‌ای کلاژن (۵ عدد)', 260000), P('skin', 'ژل شست‌وشوی ملایم', 290000), P('skin', 'روغن صورت گل محمدی', 610000), P('skin', 'کرم دور چشم', 450000),
  P('makeup', 'رژ لب مات مخملی', 380000), P('makeup', 'پالت سایه ۱۲ رنگ نود', 720000), P('makeup', 'کرم پودر سبک', 640000), P('makeup', 'ریمل حجم‌دهنده', 330000),
  P('makeup', 'رژ گونه کرمی هلویی', 290000), P('makeup', 'ست براش ۸ تایی', 850000), P('makeup', 'هایلایتر شامپاینی', 410000),
  P('hair', 'شامپو بدون سولفات', 360000), P('hair', 'ماسک موی کراتینه', 520000), P('hair', 'روغن آرگان خالص', 470000), P('hair', 'اسپری محافظ حرارت', 390000), P('hair', 'نرم‌کننده موی رنگ‌شده', 340000),
  P('nail', 'لاک ژل رنگ نود', 180000), P('nail', 'روغن کوتیکول', 140000), P('nail', 'ست لاک ۶ رنگ پاییزی', 520000), P('nail', 'تاپ‌کات براق', 160000),
  P('perfume', 'ادوپرفیوم یاس و وانیل', 1850000), P('perfume', 'ادوپرفیوم گل صدتومانی', 1650000), P('perfume', 'بادی‌میست هلو', 420000), P('perfume', 'ادوتویلت مرکبات', 1250000),
  P('tools', 'سشوار حرفه‌ای ۲۲۰۰ وات', 3900000), P('tools', 'اتو موی سرامیکی', 2600000), P('tools', 'دستگاه فرز ناخن', 2200000), P('tools', 'چراغ UV/LED ناخن', 1350000),
]
const BRANDS = ['رُزا', 'ماهتاب', 'نیلا', 'آریا', 'سورن', 'Lumière', 'Velvet', 'Oriane']

// ---------- ساخت داده‌ی نمونه ----------
export function seedMarket(salons, artists) {
  const r = rng(20261103)
  const t0 = today()
  // عاملین فروش
  const agents = [
    ['سارا محمدی', 'SARA', 0.2, 't'], ['رضا کریمی', 'REZA', 0.2, 't'], ['مهسا نوری', 'MAHSA', 0.25, 't'],
    ['امید رحیمی', 'OMID', 0.15, 't'], ['الهام صادقی', 'ELHAM', 0.2, 'k'], ['حمید افشار', 'HAMID', 0.18, 'k'],
  ].map(([name, code, rate, region], i) => ({ id: `g${i + 1}`, name, code: `BS-${code}`, rate, region: region === 't' ? 'tehran' : 'karaj', phone: `0912${String(3000000 + i * 117331).padStart(7, '0')}`, joined: addDays(t0, -320 + i * 25), status: 'active', hue: Math.floor(r() * 360) }))
  const agentFor = (city) => { const pool = agents.filter((a) => a.region === city); return r() < 0.75 ? pick(r, pool).id : null }
  // هر سالن: معرف، نرخ کارمزد، تاریخ پیوستن
  salons.forEach((s) => { s.agent = agentFor(s.city); s.rate = DEFAULTS.bookingRate; s.joined = addDays(t0, -Math.floor(30 + r() * 300)); s.status = 'active' })

  // فروشگاه‌ها: سالن‌دار، برند مستقل، آرتیست
  const shops = []
  const mk = (o) => shops.push({ id: `p${shops.length + 1}`, rate: DEFAULTS.shopRate, status: 'active', rating: Math.round((4.2 + r() * 0.75) * 10) / 10, joined: addDays(t0, -Math.floor(20 + r() * 260)), ...o })
  salons.filter((s) => s.kind !== 'spa').slice(0, 40).filter(() => r() < 0.22).slice(0, 6).forEach((s) => mk({ name: `فروشگاه ${s.name}`, type: 'salon', salon: s.id, city: s.city, agent: s.agent, cover: s.photos[0], logo: s.photos[1] || s.photos[0], about: `محصولاتی که خودمان در ${s.name} استفاده می‌کنیم.`, cats: ['skin', 'hair', 'nail'] }))
  ;[['خانه‌ی زیبایی رُزا', ['skin', 'makeup']], ['عطرکده‌ی ماهتاب', ['perfume']], ['نیلا پرو', ['tools', 'hair', 'nail']], ['آریا کازمتیکس', ['makeup', 'skin']], ['ابزار حرفه‌ای سورن', ['tools']]].forEach(([name, cats], i) => {
    const city = i === 4 ? 'karaj' : 'tehran'
    mk({ name, type: 'vendor', city, agent: agentFor(city), cover: SHOP_PH[i % SHOP_PH.length], logo: SHOP_PH[(i + 2) % SHOP_PH.length], about: 'فروشنده‌ی رسمی محصولات اصل با ضمانت اصالت کالا.', cats })
  })
  artists.filter((a) => a.badge === 'star').slice(0, 2).forEach((a) => mk({ name: `منتخب ${a.name}`, type: 'artist', artist: a.id, city: a.city, agent: null, cover: a.works[0].ph, logo: a.works[1]?.ph || a.works[0].ph, about: 'محصولاتی که در کارهایم استفاده می‌کنم و پیشنهاد می‌دهم.', cats: a.cats.includes('nail') ? ['nail', 'tools'] : ['makeup', 'skin'] }))
  // یک درخواست در انتظار تأیید
  mk({ name: 'بیوتی‌بار ترمه', type: 'vendor', city: 'tehran', agent: 'g3', status: 'pending', cover: SHOP_PH[5], logo: SHOP_PH[4], about: 'لوازم آرایشی و مراقبتی وارداتی.', cats: ['makeup', 'skin'], rating: 0 })

  // محصولات
  const products = []
  const cursor = {}
  shops.forEach((sh) => {
    const pool = CATALOG.filter((p) => sh.cats.includes(p.cat))
    const n = Math.min(pool.length, 5 + Math.floor(r() * 5))
    ;[...pool].sort(() => r() - 0.5).slice(0, n).forEach((p) => {
      const list = PPH[p.cat]; cursor[p.cat] = ((cursor[p.cat] ?? Math.floor(r() * list.length)) + 1) % list.length
      const price = Math.round((p.price * (0.85 + r() * 0.35)) / 10000) * 10000
      products.push({ id: `pr${products.length + 1}`, shop: sh.id, cat: p.cat, name: p.name, brand: pick(r, BRANDS), price, old: r() < 0.25 ? Math.round((price * 1.2) / 10000) * 10000 : null, stock: Math.floor(r() * 40), photo: list[cursor[p.cat]], rating: Math.round((4 + r()) * 10) / 10, sold: Math.floor(r() * 300) })
    })
  })

  // سفارش‌های ۹۰ روز گذشته
  const orders = []
  const live = shops.filter((s) => s.status === 'active')
  for (let d = -90; d <= 0; d++) {
    const date = addDays(t0, d)
    const n = 6 + Math.floor(r() * 16)
    for (let i = 0; i < n; i++) {
      const sh = pick(r, live)
      if (date < sh.joined) continue
      const items = products.filter((p) => p.shop === sh.id).sort(() => r() - 0.5).slice(0, 1 + Math.floor(r() * 2)).map((p) => ({ pid: p.id, qty: 1 + (r() < 0.2 ? 1 : 0), price: p.price }))
      if (!items.length) continue
      const f = pick(r, FIRST)
      orders.push({ id: `o${orders.length + 1}`, shop: sh.id, date, items, total: items.reduce((s, x) => s + x.price * x.qty, 0), buyer: `${f[0]} ${pick(r, LAST)}`, status: d < -4 ? 'delivered' : d < -1 ? 'shipped' : 'paid' })
    }
  }
  // پرداخت‌های قبلی به عاملین: همه‌ی ماه‌های گذشته به‌جز ماه قبل برای دو نفر
  return { shops, products, orders, agents, payouts: [], requests: [], settings: { ...DEFAULTS } }
}

// ---------- محاسبات مالی ----------
const pph = new Map() // قیمت متوسط هر ساعت کار هر سالن
const salonPPH = (s) => {
  // میانه، تا خدمات خیلی گران (مثل پکیج عروس) برآورد را بالا نبرد
  if (!pph.has(s.id)) { const l = s.svc.map((x) => x.price / (SV[x.sid].dur / 60)).sort((a, b) => a - b); pph.set(s.id, l.length ? l[Math.floor(l.length / 2)] : 0) }
  return pph.get(s.id)
}
// برآورد سریع کارکرد روزانه‌ی سالن (نیمه‌ی نوبت‌ها آنلاین از بیوتی‌ست می‌آیند)
const dayCache = new WeakMap()
export function salonDay(db, s, date) {
  let c = dayCache.get(db); if (!c) dayCache.set(db, (c = {}))
  const k = s.id + date
  if (c[k]) return c[k]
  if (date < (s.joined || '0')) return (c[k] = { gmv: 0, app: 0 })
  let hours = 0
  s.artists.forEach((id) => { const a = db.artists.find((x) => x.id === id); if (a) baseBusy(a, date).forEach((h) => { if (h >= s.open && h < s.close) hours += 0.5 }) })
  const gmv = hours * salonPPH(s)
  const real = db.bookings.filter((b) => b.salon === s.id && b.date === date && b.status !== 'cancelled' && b.user === 'me').reduce((a, b) => a + b.price, 0)
  return (c[k] = { gmv: gmv + real, app: gmv * 0.35 + real })
}
export const shopDay = (db, sh, date) => db.orders.filter((o) => o.shop === sh.id && o.date === date).reduce((a, o) => a + o.total, 0)

export const lastDays = (n) => Array.from({ length: n }, (_, i) => addDays(today(), i - n + 1))

// کارمزد پلتفرم از یک سالن/فروشگاه در یک بازه
export function entityFee(db, kind, e, days) {
  let gmv = 0, base = 0
  days.forEach((d) => {
    if (kind === 'salon') { const x = salonDay(db, e, d); gmv += x.gmv; base += x.app }
    else { const v = shopDay(db, e, d); gmv += v; base += v }
  })
  return { gmv, fee: base * (e.rate ?? (kind === 'salon' ? db.settings.bookingRate : db.settings.shopRate)) }
}

// ماه‌های شمسی ۹۰ روز اخیر، از قدیم به جدید
export function months(n = 90) {
  const out = []
  lastDays(n).forEach((d) => { const m = monthName(d); if (!out.length || out.at(-1).m !== m) out.push({ m, days: [] }); out.at(-1).days.push(d) })
  return out
}

// دفتر حساب یک عامل فروش: به تفکیک ماه و معرفی
export function agentLedger(db, g) {
  const refs = [
    ...db.salons.filter((s) => s.agent === g.id).map((e) => ({ kind: 'salon', e })),
    ...db.shops.filter((s) => s.agent === g.id && s.status !== 'pending').map((e) => ({ kind: 'shop', e })),
  ]
  const cutoff = (e) => addDays(e.joined, db.settings.agentMonths * 30) // سهم تا ۱۲ ماه بعد از پیوستن
  const ms = months().map(({ m, days }) => {
    let fee = 0
    const per = refs.map((x) => { const f = entityFee(db, x.kind, x.e, days.filter((d) => d <= cutoff(x.e))).fee; fee += f; return f })
    const share = fee * g.rate
    const paid = db.payouts.filter((p) => p.agent === g.id && p.month === m).reduce((a, p) => a + p.amount, 0)
    return { m, fee, share, paid, per, current: m === monthName(today()) }
  })
  const totals = refs.map((x, i) => ({ ...x, fee: ms.reduce((a, mm) => a + mm.per[i], 0), gmv: entityFee(db, x.kind, x.e, lastDays(30)).gmv, until: cutoff(x.e) }))
  const earned = ms.reduce((a, x) => a + x.share, 0)
  const paid = ms.reduce((a, x) => a + x.paid, 0)
  // ماه جاری هنوز بسته نشده؛ قابل تسویه = ماه‌های بسته‌شده‌ی پرداخت‌نشده
  // کمتر از هزار تومان اختلاف = تسویه‌شده (گرد کردن)
  const due = ms.filter((x) => !x.current && x.share - x.paid >= 1000).reduce((a, x) => a + x.share - x.paid, 0)
  const pending = ms.find((x) => x.current)?.share || 0
  return { refs: totals, months: ms, earned, paid, due, pending }
}

// پرداخت‌های اولیه: ماه‌های بسته‌شده تسویه شده‌اند، جز ماه قبل برای چند عامل
export function seedPayouts(db) {
  const out = []
  db.agents.forEach((g, i) => {
    agentLedger(db, g).months.filter((m) => !m.current).forEach((m, j, arr) => {
      if (j === arr.length - 1 && i % 2 === 0) return
      if (m.share > 0) out.push({ id: `pay${out.length + 1}`, agent: g.id, month: m.m, amount: m.share, t: Date.now() - (arr.length - j) * 25 * 864e5 })
    })
  })
  return out
}
