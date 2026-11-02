import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { Icon } from '../components/ui'
import { Logo, Mark } from '../components/Logo'
import { Portrait } from '../components/Art'
import { CAT } from '../lib/catalog'
import { CITIES, CITY_IDS } from '../lib/geo'
import { KINDS } from '../lib/seed'
import { PH, img } from '../lib/photos'
import { fa, haptic } from '../lib/util'

const toEn = (s) => s.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
const ROLES = [
  { id: 'customer', name: 'مشتری هستم', sub: 'سالن و آرتیست پیدا کنید و نوبت بگیرید', ph: PH.hero[0] },
  { id: 'artist', name: 'آرتیست هستم', sub: 'نوبت‌ها، مشتری‌ها و درآمد خودتون', ph: PH.nail[0] },
  { id: 'manager', name: 'مدیر سالن هستم', sub: 'داشبورد سالن: تقویم، تیم، مالی', ph: PH.interior[1] },
]
const slide = { initial: { opacity: 0, x: -30 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 30 } }

export default function Gate() {
  const { db, login, loginPro } = useStore()
  const [step, setStep] = useState('role')
  const [role, setRole] = useState('customer')
  const [phone, setPhone] = useState('')
  const [sent, setSent] = useState('')
  const [code, setCode] = useState('')
  const [bad, setBad] = useState(false)
  const [sms, setSms] = useState(false)
  const [name, setName] = useState('')
  const [city, setCity] = useState('tehran')
  const inp = useRef(null)
  useEffect(() => { setTimeout(() => inp.current?.focus(), 350) }, [step])

  // پیامک شبیه‌سازی‌شده: کد واقعاً ساخته و نشان داده می‌شود
  const sendCode = () => {
    const c = String(1000 + Math.floor(Math.random() * 9000))
    setSent(c); setCode(''); setBad(false); setStep('otp')
    setTimeout(() => { setSms(true); haptic(20) }, 900)
    setTimeout(() => setSms(false), 9000)
  }
  useEffect(() => {
    if (code.length < 4) return
    if (code === sent) { haptic(); setSms(false); setTimeout(() => setStep(role === 'customer' ? 'name' : 'pick'), 250) }
    else { setBad(true); haptic(60); setTimeout(() => { setCode(''); setBad(false) }, 700) }
  }, [code])

  const okPhone = /^09\d{9}$/.test(toEn(phone))
  const enter = () => login({ name: name.trim(), phone: toEn(phone), city, hue: 330 + Math.floor(Math.random() * 40) })
  const demo = (r) => {
    if (r === 'customer') return login({ name: 'نگار کاظمی', phone: '09120000000', city: 'tehran', area: 't2', hue: 345 })
    if (r === 'artist') return loginPro('artist', db.artists.find((a) => a.badge === 'star' && a.salon)?.id)
    loginPro('manager', db.salons.find((s) => s.kind === 'salon' && s.city === 'tehran')?.id)
  }
  const artists = db.artists.filter((a) => a.city === 'tehran' && a.salon).sort((a, b) => (b.badge === 'star') - (a.badge === 'star') || b.rating - a.rating).slice(0, 8)
  const salons = db.salons.filter((s) => s.city === 'tehran').sort((a, b) => b.reviewsN - a.reviewsN).slice(0, 8)

  return (
    <div className="gate">
      <div className="gate-bg"><span className="g1" /><span className="g2" /><span className="g3" /></div>

      {/* اعلان پیامک */}
      <AnimatePresence>
        {sms && (
          <motion.button className="sms" initial={{ y: -120 }} animate={{ y: 0 }} exit={{ y: -120 }} transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            onClick={() => { setCode(sent); setSms(false) }}>
            <span className="sms-ico"><Mark size={22} color="#fff" accent="var(--gold-2)" /></span>
            <div><small>پیامک · همین الان</small><b>بیوتی‌ست: کد ورود شما <span dir="ltr">{fa(sent)}</span></b><em>برای پر کردن خودکار لمس کنید</em></div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === 'role' && (
          <motion.section key="role" className="gate-in welcome" {...slide}>
            <Mark size={58} color="var(--ink)" />
            <Logo size={28} mark={false} />
            <em className="en tagline-1">Beauty, beautifully booked.</em>
            <div className="roles">
              {ROLES.map((r, i) => (
                <motion.button key={r.id} className="role" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.07 } }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setRole(r.id); setStep('phone') }}>
                  <img src={img(r.ph)} alt="" />
                  <div><b>{r.name}</b><small>{r.sub}</small></div>
                  <Icon n="fwd" s={18} />
                </motion.button>
              ))}
            </div>
            <div className="demo-links">
              <span className="muted small">ورود سریع نمونه:</span>
              {ROLES.map((r) => <button key={r.id} className="link" onClick={() => demo(r.id)}>{r.name.replace(' هستم', '')}</button>)}
            </div>
          </motion.section>
        )}

        {step === 'phone' && (
          <motion.section key="p" className="gate-in form" {...slide}>
            <button className="icon-btn" onClick={() => setStep('role')}><Icon n="back" s={22} /></button>
            <em className="en">{role === 'customer' ? 'Welcome' : role === 'artist' ? 'Artist studio' : 'Salon dashboard'}</em>
            <h1>شماره موبایل‌تون؟</h1>
            <p className="muted">یک کد چهاررقمی براتون پیامک می‌کنیم.</p>
            <input ref={inp} className="big-in" dir="ltr" inputMode="numeric" maxLength={11} placeholder="09xx xxx xxxx" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d۰-۹]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && okPhone && sendCode()} />
            <button className="btn primary block lg" disabled={!okPhone} onClick={sendCode}>دریافت کد</button>
          </motion.section>
        )}

        {step === 'otp' && (
          <motion.section key="o" className="gate-in form" {...slide}>
            <button className="icon-btn" onClick={() => setStep('phone')}><Icon n="back" s={22} /></button>
            <h1>کد تأیید</h1>
            <p className="muted">به <span dir="ltr">{phone}</span> پیامک شد.</p>
            <motion.label className={`otp ${bad ? 'bad' : ''}`} dir="ltr" animate={bad ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.4 }}>
              {[0, 1, 2, 3].map((i) => <span key={i} className={code.length === i ? 'cur' : code[i] ? 'fill' : ''}>{code[i] ? fa(code[i]) : ''}</span>)}
              <input ref={inp} inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(toEn(e.target.value).replace(/\D/g, ''))} />
            </motion.label>
            {bad && <p className="warn center">کد درست نیست</p>}
            <button className="link" onClick={sendCode}>کد نرسید؟ ارسال دوباره</button>
          </motion.section>
        )}

        {step === 'name' && (
          <motion.section key="n" className="gate-in form" {...slide}>
            <em className="en">Nice to meet you</em>
            <h1>اسم‌تون چیه؟</h1>
            <input ref={inp} className="big-in" placeholder="نام و نام خانوادگی" value={name} onChange={(e) => setName(e.target.value)} />
            <h4>کدام شهر؟</h4>
            <div className="city-pick">
              {CITY_IDS.map((c) => <button key={c} className={city === c ? 'on' : ''} onClick={() => setCity(c)}><em className="en">{CITIES[c].en}</em><b>{CITIES[c].name}</b></button>)}
            </div>
            <button className="btn primary block lg" disabled={name.trim().length < 2} onClick={enter}>ورود به بیوتی‌ست</button>
          </motion.section>
        )}

        {/* آرتیست و مدیر: انتخاب حساب نمونه */}
        {step === 'pick' && (
          <motion.section key="k" className="gate-in form" {...slide}>
            <em className="en">{role === 'artist' ? 'Who are you?' : 'Your salon'}</em>
            <h1>{role === 'artist' ? 'کدام آرتیست هستید؟' : 'کدام سالن را مدیریت می‌کنید؟'}</h1>
            <p className="muted small">در نسخه‌ی واقعی با شماره‌تون پیدا می‌شه؛ فعلاً یکی از حساب‌های نمونه رو انتخاب کنید.</p>
            <div className="pick-list">
              {role === 'artist' ? artists.map((a) => (
                <button key={a.id} onClick={() => loginPro('artist', a.id)}>
                  <Portrait a={a} size={46} ring={false} />
                  <div><b>{a.name}</b><small className="muted">{a.cats.map((c) => CAT[c].name).join(' · ')} · {db.salons.find((s) => s.id === a.salon)?.name}</small></div>
                  <Icon n="fwd" s={16} />
                </button>
              )) : salons.map((s) => (
                <button key={s.id} onClick={() => loginPro('manager', s.id)}>
                  <img src={img(s.photos[0])} alt="" />
                  <div><b>{s.name}</b><small className="muted">{KINDS[s.kind].name} · {s.hood}</small></div>
                  <Icon n="fwd" s={16} />
                </button>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
