import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { Icon } from '../components/ui'
import { Logo, Mark } from '../components/Logo'
import { Glyph } from '../components/Art'
import { CATS } from '../lib/catalog'
import { CITIES, CITY_IDS } from '../lib/geo'
import { fa, haptic } from '../lib/util'

const TAG = ['Beauty, beautifully booked.', 'Your glow, your time.', 'Find your artist.']
const toEn = (s) => s.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))

export default function Gate() {
  const { login } = useStore()
  const [step, setStep] = useState(0)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [city, setCity] = useState('tehran')
  const [area, setArea] = useState(null)
  const [t, setT] = useState(0)
  const inp = useRef(null)
  useEffect(() => { const i = setInterval(() => setT((x) => (x + 1) % TAG.length), 3200); return () => clearInterval(i) }, [])
  useEffect(() => { setTimeout(() => inp.current?.focus(), 350) }, [step])
  useEffect(() => { if (code.length === 4) { haptic(); setTimeout(() => setStep(3), 300) } }, [code])

  const okPhone = /^09\d{9}$/.test(toEn(phone))
  const enter = () => login({ name: name.trim(), phone: toEn(phone), city, area, hue: 330 + Math.floor(Math.random() * 40) })
  const demo = () => login({ name: 'نگار کاظمی', phone: '09120000000', city: 'tehran', area: 't2', hue: 345, follows: [], favs: [] })

  return (
    <div className="gate">
      <div className="gate-bg"><span className="g1" /><span className="g2" /><span className="g3" /></div>
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.section key="w" className="gate-in welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}>
            <motion.div className="arch" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}>
              <div className="arch-orbit">
                {CATS.slice(0, 8).map((c, i) => (
                  <motion.span key={c.id} style={{ '--a': `${i * 45}deg`, '--t': c.tone }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.08 }}><Glyph cat={c.id} s={20} w={1.3} /></motion.span>
                ))}
              </div>
              <Mark size={84} color="var(--ink)" />
            </motion.div>
            <Logo size={30} mark={false} />
            <div className="tagline">
              <AnimatePresence mode="wait"><motion.em key={t} className="en" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>{TAG[t]}</motion.em></AnimatePresence>
            </div>
            <p className="gate-lead">رزرو سالن‌های زیبایی، اسپا و آرتیست‌های محبوب‌تون در تهران و کرج — با نظرهای واقعی خانم‌ها.</p>
            <div className="gate-actions">
              <motion.button className="btn primary block lg" whileTap={{ scale: 0.97 }} onClick={() => setStep(1)}>شروع کنید</motion.button>
              <button className="link" onClick={demo}>ورود سریع با حساب نمونه</button>
            </div>
          </motion.section>
        )}
        {step === 1 && (
          <motion.section key="p" className="gate-in form" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
            <button className="icon-btn" onClick={() => setStep(0)}><Icon n="back" s={22} /></button>
            <em className="en">Welcome</em>
            <h1>شماره موبایل‌تون؟</h1>
            <p className="muted">یک کد چهاررقمی براتون پیامک می‌کنیم.</p>
            <input ref={inp} className="big-in" dir="ltr" inputMode="numeric" maxLength={11} placeholder="09xx xxx xxxx" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d۰-۹]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && okPhone && setStep(2)} />
            <button className="btn primary block lg" disabled={!okPhone} onClick={() => setStep(2)}>دریافت کد</button>
            <small className="muted center">ورود شما یعنی پذیرش قوانین و حریم خصوصی بیوتی‌ست.</small>
          </motion.section>
        )}
        {step === 2 && (
          <motion.section key="o" className="gate-in form" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
            <button className="icon-btn" onClick={() => setStep(1)}><Icon n="back" s={22} /></button>
            <h1>کد تأیید</h1>
            <p className="muted">به <span dir="ltr">{phone}</span> فرستادیم. <small>(دمو: هر چهار رقمی)</small></p>
            <label className="otp" dir="ltr">
              {[0, 1, 2, 3].map((i) => <span key={i} className={code.length === i ? 'cur' : code[i] ? 'fill' : ''}>{code[i] ? fa(code[i]) : ''}</span>)}
              <input ref={inp} inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(toEn(e.target.value).replace(/\D/g, ''))} />
            </label>
          </motion.section>
        )}
        {step === 3 && (
          <motion.section key="n" className="gate-in form" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
            <em className="en">Nice to meet you</em>
            <h1>اسم‌تون چیه؟</h1>
            <input ref={inp} className="big-in" placeholder="نام و نام خانوادگی" value={name} onChange={(e) => setName(e.target.value)} />
            <h4>کجا زندگی می‌کنید؟</h4>
            <div className="city-pick">
              {CITY_IDS.map((c) => (
                <button key={c} className={city === c ? 'on' : ''} onClick={() => { setCity(c); setArea(null) }}><em className="en">{CITIES[c].en}</em><b>{CITIES[c].name}</b></button>
              ))}
            </div>
            <div className="chips wrap small-chips">
              {CITIES[city].areas.map((a) => <button key={a.id} className={`chip ${area === a.id ? 'on' : ''}`} onClick={() => setArea(area === a.id ? null : a.id)}>{a.id.startsWith('t') ? `${a.name} · ${a.hoods[0]}` : a.name}</button>)}
            </div>
            <button className="btn primary block lg" disabled={name.trim().length < 2} onClick={enter}>ورود به بیوتی‌ست</button>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
