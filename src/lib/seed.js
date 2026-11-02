// داده‌ی نمونه: سالن‌ها، آرتیست‌ها و نظرها — تکرارپذیر با بذر ثابت
import { CITIES, pointIn } from './geo'
import { SERVICES, SV, byCat } from './catalog'
import { addDays, pick, rng, today } from './util'
import { KIND_PH, PH } from './photos'
import { seedMarket, seedPayouts } from './market'

export const SEED_V = 9

// نوع هر کسب‌وکار و دسته‌هایی که ارائه می‌دهد
export const KINDS = {
  salon: { name: 'سالن زیبایی', pre: ['سالن', 'آتلیه‌ی زیبایی', 'خانه‌ی زیبایی'], cats: ['hair', 'color', 'nail', 'brow', 'makeup', 'skin'] },
  nail: { name: 'استودیو ناخن', pre: ['استودیو ناخن', 'نیل‌بار'], cats: ['nail', 'brow'] },
  lash: { name: 'ابرو و مژه', pre: ['لش‌بار', 'استودیو ابرو'], cats: ['brow', 'pmu', 'makeup'] },
  spa: { name: 'اسپا و ماساژ', pre: ['اسپا', 'خانه‌ی ماساژ'], cats: ['spa', 'skin', 'wax'] },
  skin: { name: 'مرکز پوست و لیزر', pre: ['مرکز پوست', 'کلینیک زیبایی'], cats: ['skin', 'wax', 'pmu'] },
  bridal: { name: 'سالن عروس', pre: ['سالن عروس', 'مزون زیبایی'], cats: ['bridal', 'makeup', 'hair', 'color', 'nail'] },
}

const WORDS = [
  ['رز سفید', 'Rose Blanche'], ['مهتاب', 'Mahtab'], ['ترمه', 'Termeh'], ['پرنیان', 'Parnian'], ['شب‌بو', 'Shabbou'], ['نیلوفر', 'Niloufar'],
  ['یاس', 'Yas'], ['آوا', 'Ava'], ['لوتوس', 'Lotus'], ['گیسو', 'Gisou'], ['ماهرخ', 'Mahrokh'], ['آیلین', 'Aylin'], ['ونوس', 'Venus'],
  ['نارون', 'Naroun'], ['سپیده', 'Sepideh'], ['ترانه', 'Taraneh'], ['آرامیس', 'Aramis'], ['گلاره', 'Golareh'], ['دلارام', 'Delaram'],
  ['نیکا', 'Nika'], ['مهرسا', 'Mehrsa'], ['پریچهر', 'Parichehr'], ['شیدا', 'Sheyda'], ['رونا', 'Rona'], ['ژینا', 'Zhina'], ['آناهید', 'Anahid'],
  ['هلیا', 'Helia'], ['باران', 'Baran'], ['کاژه', 'Kazheh'], ['آرتمیس', 'Artemis'], ['سارینا', 'Sarina'], ['لیانا', 'Liana'], ['نوا', 'Nava'],
  ['مروارید', 'Morvarid'], ['صدف', 'Sadaf'], ['گل‌سرخ', 'Golsorkh'], ['ماه‌بانو', 'Mahbanoo'], ['ایلا', 'Ila'], ['سورن', 'Souren'], ['آنیا', 'Ania'],
  ['کیمیا', 'Kimia'], ['رستا', 'Rasta'], ['مانا', 'Mana'], ['دیبا', 'Diba'], ['نگین', 'Negin'], ['بهار نارنج', 'Bahar Naranj'], ['سوگل', 'Sogol'],
  ['ماهور', 'Mahour'], ['تینا', 'Tina'], ['آذین', 'Azin'], ['نسیم', 'Nasim'], ['هستی', 'Hasti'], ['شمیم', 'Shamim'], ['الماس', 'Almas'],
  ['ارکیده', 'Orkideh'], ['آلاله', 'Alaleh'], ['پونه', 'Pouneh'], ['نیلا', 'Nila'], ['ستاره', 'Setareh'], ['آینا', 'Aina'], ['یاقوت', 'Yaghout'],
]
export const FIRST = [
  ['سارا', 'sara'], ['نگار', 'negar'], ['مهسا', 'mahsa'], ['الناز', 'elnaz'], ['نیلوفر', 'niloufar'], ['ترانه', 'taraneh'], ['آیدا', 'aida'], ['شیما', 'shima'],
  ['پریا', 'parya'], ['رها', 'raha'], ['یاسمن', 'yasaman'], ['هستی', 'hasti'], ['مریم', 'maryam'], ['سمیرا', 'samira'], ['لیلا', 'leila'], ['کیانا', 'kiana'],
  ['آناهیتا', 'anahita'], ['ستاره', 'setareh'], ['مهتاب', 'mahtab'], ['غزل', 'ghazal'], ['پرستو', 'parastoo'], ['نازنین', 'nazanin'], ['فرناز', 'farnaz'],
  ['بهاره', 'bahareh'], ['ساغر', 'saghar'], ['ملیکا', 'melika'], ['تینا', 'tina'], ['آیلین', 'aylin'], ['دنیا', 'donya'], ['شقایق', 'shaghayegh'],
  ['رویا', 'roya'], ['فاطمه', 'fatemeh'], ['زهرا', 'zahra'], ['سحر', 'sahar'], ['مینا', 'mina'], ['هانیه', 'hanieh'], ['عسل', 'asal'], ['درسا', 'dorsa'],
]
export const LAST = ['رضایی', 'کریمی', 'احمدی', 'موسوی', 'صادقی', 'نوری', 'توکلی', 'شریفی', 'حسینی', 'جعفری', 'فرهادی', 'مرادی', 'رحیمی', 'کاظمی', 'نیک‌نام', 'امینی', 'سلطانی', 'زمانی', 'افشار', 'پارسا', 'مهرپور', 'ستوده', 'بهرامی', 'یزدانی']
const HANDLE = { hair: 'hair', color: 'color', nail: 'nails', brow: 'lash', skin: 'skin', makeup: 'makeup', bridal: 'bridal', wax: 'smooth', spa: 'touch', pmu: 'brows' }

export const WORKS = {
  hair: ['لخت براق', 'موج ساحلی', 'کوتاهی باب', 'لایه‌ای پرحجم', 'کوتاهی کرتین'],
  color: ['بالیاژ عسلی', 'شکلاتی سرد', 'بلوند یخی', 'آمبره کاراملی', 'مسی گرم', 'دودی نقره‌ای'],
  nail: ['فرنچ مینیمال', 'ناخن مرمری', 'نود براق', 'گل‌های ریز', 'کروم صدفی', 'بادامی شیری'],
  brow: ['ابروی پرپشت طبیعی', 'لیفت مژه', 'کاشت مژه کلاسیک', 'لمینت ابرو'],
  skin: ['پوست شیشه‌ای', 'آبرسانی عمیق', 'پاکسازی قبل و بعد'],
  makeup: ['میکاپ نود', 'اسموکی شب', 'گلو طبیعی', 'رژ قرمز کلاسیک', 'میکاپ هلویی'],
  bridal: ['عروس کلاسیک', 'شینیون رمانتیک', 'تور و تاج', 'عروس مینیمال'],
  wax: ['پوست صاف و نرم'],
  spa: ['آرامش عمیق', 'سنگ داغ', 'روغن‌های گیاهی'],
  pmu: ['میکروبلیدینگ طبیعی', 'رژ لب دائم هلویی', 'خط چشم نازک', 'فیبروز پودری'],
}

const QUOTES = {
  hair: ['کوتاهی دقیقاً همونی شد که عکسشو نشون داده بودم.', 'موهام بعد از کراتین واقعاً زنده شد.', 'سشوار تا سه روز موند، عالی بود.'],
  color: ['رنگ دقیقاً همون چیزی بود که می‌خواستم، بدون زردی.', 'بالیاژ خیلی نرم و طبیعی دراومد.', 'مشاوره‌ی رنگ قبلش خیلی کمکم کرد.'],
  nail: ['کاشت خیلی ظریف و تمیز بود، سه هفته‌ست سالمه.', 'طراحی‌ها بی‌نقص بود.', 'ابزارها رو جلوی چشمم استریل کردن.'],
  brow: ['ابروهام کاملاً طبیعی شده.', 'لیفت مژه عالی بود، بدون ریمل هم قشنگه.', 'کاشت مژه سبک و راحت بود.'],
  skin: ['پوستم بعد از هیدرافیشیال می‌درخشید.', 'خیلی با حوصله نوع پوستمو بررسی کردن.'],
  makeup: ['میکاپ تا آخر شب دست‌نخورده موند.', 'دقیقاً با لباسم هماهنگ شد.', 'خیلی سبک بود، اصلاً حس سنگینی نداشت.'],
  bridal: ['روز عروسیم همه‌چی بی‌نقص بود، ممنونم.', 'تست گریم کمک کرد خیالم راحت باشه.'],
  wax: ['کم‌درد و سریع بود.', 'محیط خیلی تمیز و خصوصی بود.'],
  spa: ['بهترین ماساژ عمرم بود، کاملاً ریلکس شدم.', 'فضا آروم و خوش‌بو بود.', 'دردهای گردنم خیلی کمتر شد.'],
  pmu: ['نتیجه طبیعی و قرینه‌ست.', 'خیلی دقیق طراحی کردن قبل از شروع.'],
}
const REPLIES = ['ممنونیم از لطفتون، خوشحالیم راضی بودید 🤍', 'قدم‌تون روی چشم، منتظر دیدار دوباره‌تون هستیم.', 'سپاس از وقتی که گذاشتید؛ نظرتون به تیم منتقل شد.']

// تعداد کسب‌وکار در هر ناحیه (شمال شهر شلوغ‌تر)
const DENSITY = { t1: 5, t2: 5, t3: 5, t4: 3, t5: 3, t6: 4, t7: 3, t8: 2, t22: 2, t21: 1, t9: 1, t10: 1, t11: 2, t12: 1, t13: 2, t14: 1, t15: 1, t16: 1, t17: 1, t18: 1, t19: 0, t20: 1, k1: 3, k2: 3, k3: 3, k4: 3, k5: 3, k6: 2, k7: 1, k8: 1, k9: 2, k10: 2 }
const KIND_POOL = ['salon', 'salon', 'salon', 'nail', 'lash', 'spa', 'spa', 'skin', 'bridal']
const TIER_MUL = [0, 0.75, 1, 1.35, 1.8]
const NORTH = ['t1', 't2', 't3', 'k1', 'k3']

const r1 = (x) => Math.round(x * 10) / 10
const roundP = (x) => Math.round(x / 50000) * 50000

export function seedDB() {
  const r = rng(20261102)
  const salons = [], artists = [], reviews = []
  let w = 0, a = 0
  const usedFirst = {}
  // عکس‌ها به نوبت از هر دسته برداشته می‌شوند تا تکرار کم باشد
  const cursor = {}
  const nextPh = (k) => { const list = PH[k]; const i = (cursor[k] = (cursor[k] ?? Math.floor(r() * list.length)) + 1); return list[i % list.length] }
  const salonPhotos = (kind, cats) => {
    const pools = KIND_PH[kind]
    const out = [nextPh(pools[0])]
    ;[...pools.slice(1), ...cats].forEach((k) => { if (out.length < 5 && PH[k]) { const p = nextPh(k); if (!out.includes(p)) out.push(p) } })
    return out
  }

  const makeArtist = (cats, salon, city, area) => {
    let f = pick(r, FIRST)
    for (let k = 0; k < 4 && usedFirst[f[0]] > 3; k++) f = pick(r, FIRST)
    usedFirst[f[0]] = (usedFirst[f[0]] || 0) + 1
    const last = pick(r, LAST)
    const main = cats[0]
    const top = r() < 0.22
    const id = `a${++a}`
    const spec = [main, ...cats.slice(1).filter(() => r() < 0.45)].slice(0, 3)
    const sig = pick(r, byCat(main))
    const art = {
      id, name: `${f[0]} ${last}`, handle: `${f[1]}.${HANDLE[main]}${r() < 0.4 ? '' : Math.floor(r() * 90 + 10)}`,
      salon: salon?.id || null, city, area, cats: spec, signature: sig.id,
      rating: r1(top ? 4.8 + r() * 0.2 : 4.3 + r() * 0.6), reviewsN: Math.floor((top ? 180 : 20) + r() * 260),
      followers: Math.floor((top ? 18000 : 900) + r() * (top ? 60000 : 9000)), years: Math.floor(2 + r() * (top ? 14 : 8)),
      badge: top ? 'star' : r() < 0.18 ? 'rising' : null, mul: r1(top ? 1.2 + r() * 0.3 : 0.9 + r() * 0.25), hue: Math.floor(r() * 360),
      home: !salon || r() < 0.15, seed: Math.floor(r() * 1e6),
      bio: `${WORKS[main][0]} و ${WORKS[main][1] || 'جزئیات ظریف'} تخصص منه. ${top ? 'هر کار یک امضاست.' : 'با حوصله و دقت، برای شما.'}`,
      works: Array.from({ length: 6 + Math.floor(r() * 4) }, (_, i) => { const c = spec[i % spec.length]; return { cat: c, title: WORKS[c][Math.floor(r() * WORKS[c].length)], seed: Math.floor(r() * 1e6), likes: Math.floor(40 + r() * 2400), ph: nextPh(c) } }),
    }
    artists.push(art)
    return art
  }

  Object.entries(CITIES).forEach(([city, C]) => {
    C.areas.forEach((ar) => {
      for (let i = 0; i < (DENSITY[ar.id] || 0); i++) {
        const kind = pick(r, KIND_POOL)
        const K = KINDS[kind]
        const [word, en] = WORDS[w++ % WORDS.length]
        const tier = Math.min(4, Math.max(1, Math.round((NORTH.includes(ar.id) ? 2.8 : 1.9) + (r() - 0.5) * 1.6)))
        const id = `s${salons.length + 1}`
        const cats = K.cats.filter((_, j) => j < 2 || r() < 0.7)
        const svc = cats.flatMap((c) => byCat(c).filter(() => r() < 0.8)).map((s) => ({ sid: s.id, price: roundP(s.price * TIER_MUL[tier] * (0.9 + r() * 0.2)) }))
        const amen = ['parking', 'home', 'late', 'private', 'kids', 'organic', 'card', 'cafe'].filter((x) => r() < (x === 'private' && kind === 'spa' ? 0.95 : 0.32))
        const open = kind === 'spa' ? 10 : 9 + (r() < 0.3 ? 1 : 0)
        const s = {
          id, kind, name: `${pick(r, K.pre)} ${word}`, word, en, city, area: ar.id, hood: pick(r, ar.hoods),
          at: pointIn(city, ar.id, r), tier, cats, svc, amen,
          open, close: amen.includes('late') ? 23 : 20 + Math.floor(r() * 2),
          rating: r1(4.1 + r() * 0.85), reviewsN: Math.floor(30 + r() * 600), verified: r() < 0.6,
          since: 1390 + Math.floor(r() * 13), hue: Math.floor(r() * 360), seed: Math.floor(r() * 1e6),
          offer: r() < 0.22 ? { pct: pick(r, [10, 15, 20, 25]), cat: cats[0] } : null,
          about: `${K.name} ${word} در ${ar.hoods[0]}؛ ${tier >= 3 ? 'فضایی لوکس و آرام با تیمی از بهترین آرتیست‌ها' : 'فضایی صمیمی، تمیز و دقیق'} — فقط مخصوص بانوان.`,
          artists: [],
          photos: salonPhotos(kind, cats),
        }
        salons.push(s)
        const n = 2 + Math.floor(r() * 3)
        for (let j = 0; j < n; j++) {
          const rot = [...cats.slice(j % cats.length), ...cats.slice(0, j % cats.length)]
          s.artists.push(makeArtist(rot, s, city, ar.id).id)
        }
        // نظرهای نمونه
        const rn = 3 + Math.floor(r() * 6)
        for (let j = 0; j < rn; j++) {
          const aid = pick(r, s.artists)
          const art = artists.find((x) => x.id === aid)
          const cat = pick(r, art.cats.filter((c) => cats.includes(c)).concat(cats[0]))
          const base = s.rating + (r() - 0.6)
          const sc = (d) => Math.max(3, Math.min(5, Math.round(base + d)))
          const f = pick(r, FIRST)
          reviews.push({
            id: `r${reviews.length + 1}`, salon: id, artist: art.id, user: `${f[0]} ${pick(r, LAST)[0]}.`, hue: Math.floor(r() * 360),
            svc: pick(r, byCat(cat)).id, scores: { quality: sc(0.3), hygiene: sc(0.4), manner: sc(0.3), time: sc(-0.2), value: sc(-0.3) },
            text: pick(r, QUOTES[cat]), tags: ['دقیق و حرفه‌ای', 'تمیز و مرتب', 'فضای آرام', 'دوباره میرم'].filter(() => r() < 0.35),
            t: Date.now() - Math.floor(r() * 120) * 864e5 - Math.floor(r() * 864e5), reply: r() < 0.4 ? pick(r, REPLIES) : null, verified: true,
          })
        }
      }
    })
    // آرتیست‌های آزادکار با خدمات در منزل
    for (let i = 0; i < (city === 'tehran' ? 7 : 3); i++) {
      const main = pick(r, ['makeup', 'nail', 'bridal', 'spa', 'hair', 'brow'])
      const ar = pick(r, C.areas)
      const art = makeArtist([main, main === 'bridal' ? 'makeup' : 'hair'], null, city, ar.id)
      art.home = true
    }
  })
  // آرتیست‌های ویژه همیشه نشان ستاره دارند
  artists.filter((x) => x.badge === 'star').forEach((x) => { x.followers = Math.max(x.followers, 12000) })
  const db = { v: SEED_V, salons, artists, reviews, bookings: seedBookings(salons, artists), ...seedMarket(salons, artists) }
  db.payouts = seedPayouts(db)
  return db
}

function seedBookings(salons, artists) {
  // برای اینکه «نوبت‌های من» و ثبت نظر از اول قابل دیدن باشد
  const s1 = salons.find((s) => s.area === 't2' && s.cats.includes('nail')) || salons[0]
  const s2 = salons.find((s) => s.area === 't3' && s.cats.includes('color')) || salons[1]
  const s3 = salons.find((s) => s.kind === 'spa') || salons[2]
  const firstArtist = (s, cat) => s.artists.find((id) => artists.find((x) => x.id === id).cats.includes(cat)) || s.artists[0]
  const mk = (id, s, cat, days, start, status, reviewed) => {
    const sv = s.svc.find((x) => SV[x.sid].cat === cat) || s.svc[0]
    const price = sv.price
    return { id, salon: s.id, artist: firstArtist(s, cat), svc: [sv.sid], date: addDays(today(), days), start, dur: SV[sv.sid].dur, price, paid: Math.round(price * 0.3), status, reviewed, user: 'me', t: Date.now() }
  }
  return [
    mk('b1', s1, 'nail', 2, 17, 'confirmed'),
    mk('b2', s3, 'spa', -1, 18, 'done', false),
    mk('b3', s2, 'color', -24, 11, 'done', true),
    mk('b4', s1, 'nail', -38, 16, 'cancelled', false),
    mk('b5', s1, 'nail', -46, 15, 'done', true),
    mk('b6', s3, 'spa', -63, 19, 'done', true),
  ]
}

// ---------- انتخابگرها ----------
export const priceOf = (salon, sid, artist) => {
  const p = salon?.svc.find((x) => x.sid === sid)?.price ?? SV[sid].price
  return roundP(p * (artist?.mul || 1))
}
export const fromPrice = (salon, cat) => {
  const list = salon.svc.filter((x) => !cat || SV[x.sid].cat === cat)
  return list.length ? Math.min(...list.map((x) => x.price)) : null
}
export const offers = (salon, sid) => salon.svc.some((x) => x.sid === sid)
export const tierLabel = (t) => '$'.repeat(t)

// ساعت‌های پر هر آرتیست؛ بذر از روی شناسه و روز ساخته می‌شود
export function hash(str) { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0 }
// ساعت‌های پر «پایه» (نوبت‌های تلفنی و حضوری که از قبل در دفتر سالن است)
export function baseBusy(artist, date) {
  const r = rng(hash(artist.id + date))
  const busy = new Set()
  const all = () => { for (let h = 8; h < 23; h += 0.5) busy.add(h) }
  if (artist.off?.includes(date)) { all(); return busy } // مرخصی که خود آرتیست زده
  // آرتیست‌های ستاره پرترند
  const fill = artist.badge === 'star' ? 0.55 : 0.32
  for (let h = 8; h < 23; h += 0.5) if (r() < fill) busy.add(h)
  if (r() < 0.12) all() // روز تعطیل
  return busy
}
export const isOffDay = (artist, date) => artist.off?.includes(date) || baseBusy(artist, date).size >= 30
export function busyMap(artist, date, bookings = []) {
  const busy = baseBusy(artist, date)
  bookings.filter((b) => b.artist === artist.id && b.date === date && b.status !== 'cancelled').forEach((b) => {
    for (let h = b.start; h < b.start + b.dur / 60; h += 0.5) busy.add(h)
  })
  return busy
}
// شروع‌های آزاد برای یک مدت مشخص (دقیقه)
export function freeStarts(salon, artist, date, dur, bookings, from = 0, to = 24) {
  const busy = busyMap(artist, date, bookings)
  const now = new Date()
  const isToday = date === today()
  const out = []
  const len = Math.ceil(dur / 30) / 2
  for (let h = salon.open; h + len <= salon.close; h += 0.5) {
    if (h < from || h >= to) continue
    if (isToday && h <= now.getHours() + now.getMinutes() / 60 + 0.5) continue
    let ok = true
    for (let k = h; k < h + len; k += 0.5) if (busy.has(k)) { ok = false; break }
    if (ok) out.push(h)
  }
  return out
}
export const canDo = (artist, sids) => sids.every((sid) => artist.cats.includes(SV[sid].cat))
export const ALL_SERVICES = SERVICES
