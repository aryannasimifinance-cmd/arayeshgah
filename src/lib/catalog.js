// دسته‌بندی خدمات آرایشگاه‌های زنانه، اسپا و ماساژ
// dur: دقیقه — price: قیمت پایه به تومان (هر سالن و هر آرتیست ضریب خودش را دارد)

export const CATS = [
  { id: 'hair', name: 'مو', en: 'Hair', tone: '#C9A27E' },
  { id: 'color', name: 'رنگ و لایت', en: 'Color', tone: '#B9786A' },
  { id: 'nail', name: 'ناخن', en: 'Nails', tone: '#D08C97' },
  { id: 'brow', name: 'ابرو و مژه', en: 'Brows & Lashes', tone: '#8E6E63' },
  { id: 'skin', name: 'پوست و فیشیال', en: 'Skin', tone: '#A9B49A' },
  { id: 'makeup', name: 'میکاپ', en: 'Makeup', tone: '#C7707A' },
  { id: 'bridal', name: 'عروس', en: 'Bridal', tone: '#C8A96A' },
  { id: 'wax', name: 'اپیلاسیون و لیزر', en: 'Hair Removal', tone: '#9C8AA5' },
  { id: 'spa', name: 'ماساژ و اسپا', en: 'Massage & Spa', tone: '#7F9C96' },
  { id: 'pmu', name: 'آرایش دائم', en: 'Permanent Makeup', tone: '#9A5B62' },
]
export const CAT = Object.fromEntries(CATS.map((c) => [c.id, c]))

// dur = حداقل زمان معمول (نوبت با همین بلوک می‌شود)، upto = حداکثر معمول؛ برگرفته از نوبت‌دهی سالن‌ها
const S = (id, cat, name, dur, price, note) => ({ id, cat, name, dur: DUR[id][0], upto: DUR[id][1], price, note })
const DUR = {'cut': [30, 60], 'blow': [30, 45], 'style': [60, 120], 'keratin': [120, 240], 'protein': [60, 120], 'ext': [150, 240], 'root': [60, 90], 'fullcolor': [90, 150], 'highlight': [120, 240], 'balayage': [180, 270], 'ombre': [180, 240], 'toner': [30, 45], 'mani': [30, 45], 'pedi': [45, 60], 'gel': [30, 60], 'acrylic': [90, 150], 'refill': [60, 90], 'nailart': [30, 60], 'face': [15, 30], 'brow': [15, 30], 'browlam': [45, 60], 'lashlift': [45, 75], 'lashext': [90, 150], 'henna': [20, 30], 'clean': [60, 90], 'hydra': [45, 60], 'peel': [30, 45], 'microneedle': [60, 75], 'mask': [30, 45], 'mkparty': [60, 90], 'mkday': [30, 45], 'mkengage': [90, 120], 'mklesson': [60, 120], 'brideFull': [300, 420], 'brideTest': [90, 120], 'brideMate': [90, 120], 'waxleg': [30, 45], 'waxfull': [60, 90], 'laserface': [15, 30], 'laserfull': [60, 90], 'swedish': [60, 90], 'relax': [60, 90], 'deep': [60, 90], 'stone': [75, 90], 'lymph': [60, 75], 'prenatal': [60, 60], 'facemassage': [30, 45], 'microblade': [120, 180], 'powder': [120, 180], 'lipblush': [120, 150], 'liner': [60, 120]}

export const SERVICES = [
  // مو
  S('cut', 'hair', 'کوتاهی و فرم‌دهی', 60, 450000),
  S('blow', 'hair', 'سشوار و براشینگ', 45, 300000),
  S('style', 'hair', 'شینیون و بافت مجلسی', 90, 1200000),
  S('keratin', 'hair', 'کراتین و صافی', 180, 3500000, 'بسته به بلندی مو'),
  S('protein', 'hair', 'پروتئین‌تراپی و احیا', 120, 2200000),
  S('ext', 'hair', 'اکستنشن مو', 180, 6000000, 'مو جدا محاسبه می‌شود'),
  // رنگ
  S('root', 'color', 'رنگ ریشه', 90, 900000),
  S('fullcolor', 'color', 'رنگ کامل', 120, 1600000),
  S('highlight', 'color', 'هایلایت', 180, 2800000),
  S('balayage', 'color', 'بالیاژ', 240, 4500000),
  S('ombre', 'color', 'آمبره و سامبره', 210, 3800000),
  S('toner', 'color', 'تونر و گلاس', 45, 700000),
  // ناخن
  S('mani', 'nail', 'مانیکور', 45, 350000),
  S('pedi', 'nail', 'پدیکور', 60, 450000),
  S('gel', 'nail', 'لاک ژل', 45, 400000),
  S('acrylic', 'nail', 'کاشت ناخن', 120, 1100000),
  S('refill', 'nail', 'ترمیم کاشت', 90, 750000),
  S('nailart', 'nail', 'طراحی ناخن', 30, 250000, 'هر ده ناخن'),
  // ابرو و مژه
  S('face', 'brow', 'اصلاح صورت', 20, 120000),
  S('brow', 'brow', 'اصلاح و فرم ابرو', 20, 150000),
  S('browlam', 'brow', 'لیفت و لمینت ابرو', 60, 900000),
  S('lashlift', 'brow', 'لیفت مژه', 60, 850000),
  S('lashext', 'brow', 'کاشت مژه', 120, 1500000),
  S('henna', 'brow', 'رنگ و هنای ابرو', 30, 250000),
  // پوست
  S('clean', 'skin', 'پاکسازی عمقی پوست', 75, 950000),
  S('hydra', 'skin', 'هیدرافیشیال', 60, 1500000),
  S('peel', 'skin', 'لایه‌برداری', 45, 1200000),
  S('microneedle', 'skin', 'میکرونیدلینگ', 60, 2200000),
  S('mask', 'skin', 'ماسک و آبرسانی', 40, 500000),
  // میکاپ
  S('mkparty', 'makeup', 'میکاپ مجلسی', 75, 1800000),
  S('mkday', 'makeup', 'میکاپ روزانه', 45, 800000),
  S('mkengage', 'makeup', 'میکاپ نامزدی', 120, 3500000),
  S('mklesson', 'makeup', 'آموزش خودآرایی', 90, 1500000),
  // عروس
  S('brideFull', 'bridal', 'پکیج کامل عروس', 360, 25000000, 'مو، میکاپ، ناخن و همراه'),
  S('brideTest', 'bridal', 'تست گریم عروس', 120, 3000000),
  S('brideMate', 'bridal', 'میکاپ و موی همراه عروس', 120, 3500000),
  // اپیلاسیون
  S('waxleg', 'wax', 'وکس پا', 45, 450000),
  S('waxfull', 'wax', 'وکس کامل بدن', 90, 1100000),
  S('laserface', 'wax', 'لیزر صورت', 20, 600000),
  S('laserfull', 'wax', 'لیزر کامل بدن', 90, 3500000),
  // اسپا
  S('swedish', 'spa', 'ماساژ سوئدی', 60, 1200000),
  S('relax', 'spa', 'ماساژ ریلکسی و آروماتراپی', 60, 1100000),
  S('deep', 'spa', 'ماساژ بافت عمقی', 75, 1500000),
  S('stone', 'spa', 'ماساژ سنگ داغ', 75, 1600000),
  S('lymph', 'spa', 'ماساژ لنفاوی و لاغری', 60, 1300000),
  S('prenatal', 'spa', 'ماساژ بارداری', 60, 1200000),
  S('facemassage', 'spa', 'ماساژ صورت و گوآشا', 30, 600000),
  // آرایش دائم
  S('microblade', 'pmu', 'میکروبلیدینگ ابرو', 150, 5500000),
  S('powder', 'pmu', 'فیبروز پودری ابرو', 150, 5000000),
  S('lipblush', 'pmu', 'رژ لب دائم', 120, 4500000),
  S('liner', 'pmu', 'خط چشم دائم', 90, 3200000),
]
export const SV = Object.fromEntries(SERVICES.map((s) => [s.id, s]))
export const byCat = (cat) => SERVICES.filter((s) => s.cat === cat)

// امکانات سالن که در فیلترها و صفحه‌ی سالن دیده می‌شوند
export const AMEN = {
  parking: { name: 'پارکینگ', icon: 'car' },
  home: { name: 'خدمات در منزل', icon: 'home' },
  late: { name: 'باز تا دیروقت', icon: 'moon' },
  private: { name: 'اتاق خصوصی', icon: 'lock' },
  kids: { name: 'مناسب همراه کودک', icon: 'heart' },
  organic: { name: 'محصولات ارگانیک', icon: 'leaf' },
  card: { name: 'پرداخت قسطی', icon: 'wallet' },
  cafe: { name: 'کافه و پذیرایی', icon: 'cup' },
}

export const DAYPARTS = [
  { id: '', name: 'هر ساعتی', from: 0, to: 24 },
  { id: 'am', name: 'صبح', from: 8, to: 12, icon: 'sun' },
  { id: 'noon', name: 'ظهر', from: 12, to: 16, icon: 'sunset' },
  { id: 'pm', name: 'عصر و شب', from: 16, to: 23, icon: 'moon' },
]

// معیارهای امتیازدهی — میانگینشان امتیاز کلی است
export const CRITERIA = [
  { id: 'quality', name: 'کیفیت کار' },
  { id: 'hygiene', name: 'بهداشت' },
  { id: 'manner', name: 'برخورد' },
  { id: 'time', name: 'وقت‌شناسی' },
  { id: 'value', name: 'ارزش قیمت' },
]
export const REVIEW_TAGS = ['دقیق و حرفه‌ای', 'فضای آرام', 'مشاوره‌ی خوب', 'تمیز و مرتب', 'سر وقت', 'نتیجه ماندگار', 'قیمت منصفانه', 'دوباره میرم']

export const fmtDur = (m) => {
  const h = Math.floor(m / 60), r = m % 60
  const fa = (n) => n.toLocaleString('fa-IR')
  return [h && `${fa(h)} ساعت`, r && `${fa(r)} دقیقه`].filter(Boolean).join(' و ')
}

// «حداقل ۳۰ دقیقه · تا ۱ ساعت»
export const durRange = (s) => (s.upto > s.dur ? `${fmtDur(s.dur)} تا ${fmtDur(s.upto)}` : fmtDur(s.dur))
// بلوک تقویم: مضرب نیم‌ساعت
export const slotsOf = (min) => Math.ceil(min / 30)
