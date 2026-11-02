import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore, DEMO_PASS, demoAccounts } from '../store'
import { Icon } from '../components/ui'
import { Logo, Mark } from '../components/Logo'
import { CITIES, CITY_IDS } from '../lib/geo'
import { PH, img } from '../lib/photos'
import { fa, haptic } from '../lib/util'

const toEn = (s) => s.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
const slide = { initial: { opacity: 0, x: -24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 24 }, transition: { duration: 0.22 } }
const SIGNUP = ['موبایل', 'کد تأیید', 'حساب', 'شهر']

// پیامک شبیه‌سازی‌شده: کد واقعاً ساخته و در اعلان بالای صفحه نشان داده می‌شود
function useSms() {
  const [sent, setSent] = useState('')
  const [show, setShow] = useState(false)
  const send = () => {
    const c = String(1000 + Math.floor(Math.random() * 9000))
    setSent(c); setShow(false)
    setTimeout(() => { setShow(true); haptic(20) }, 800)
    setTimeout(() => setShow(false), 10000)
    return c
  }
  return { sent, show, setShow, send }
}

function SmsBanner({ sms, onFill }) {
  return (
    <AnimatePresence>
      {sms.show && (
        <motion.button className="sms" initial={{ y: -120 }} animate={{ y: 0 }} exit={{ y: -120 }} transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          onClick={() => { onFill(sms.sent); sms.setShow(false) }}>
          <span className="sms-ico"><Mark size={22} color="#fff" accent="var(--gold-2)" /></span>
          <div><small>پیامک · همین الان</small><b>بیوتی‌ست: کد تأیید شما <span dir="ltr">{fa(sms.sent)}</span></b><em>برای پر کردن خودکار لمس کنید</em></div>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// ورودی کد چهاررقمی
function Otp({ value, onChange, bad }) {
  const ref = useRef(null)
  useEffect(() => { setTimeout(() => ref.current?.focus(), 300) }, [])
  return (
    <motion.label className={`otp ${bad ? 'bad' : ''}`} dir="ltr" animate={bad ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.4 }}>
      {[0, 1, 2, 3].map((i) => <span key={i} className={value.length === i ? 'cur' : value[i] ? 'fill' : ''}>{value[i] ? fa(value[i]) : ''}</span>)}
      <input ref={ref} inputMode="numeric" autoComplete="one-time-code" maxLength={4} value={value} onChange={(e) => onChange(toEn(e.target.value).replace(/\D/g, ''))} />
    </motion.label>
  )
}

const Field = ({ label, children, error }) => <label className="field"><span>{label}</span>{children}{error && <small className="f-err">{error}</small>}</label>

export default function Gate() {
  const [mode, setMode] = useState('login') // login · signup · forgot · partner
  return (
    <div className="gate">
      <div className="gate-bg"><span className="g1" /><span className="g2" /><span className="g3" /></div>
      <AnimatePresence mode="wait">
        {mode === 'login' && <Login key="l" go={setMode} />}
        {mode === 'signup' && <Signup key="s" go={setMode} />}
        {mode === 'forgot' && <Forgot key="f" go={setMode} />}
        {mode === 'partner' && <Partner key="p" go={setMode} />}
      </AnimatePresence>
    </div>
  )
}

// ---------- ورود ----------
function Login({ go }) {
  const { db, signIn } = useStore()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [see, setSee] = useState(false)
  const [err, setErr] = useState('')
  const submit = (e) => {
    e?.preventDefault()
    const r = signIn(toEn(user), toEn(pass))
    if (r.error) { setErr(r.error); haptic(60) }
  }
  // ورود نمایشی برای ارائه: همان حساب‌های نمونه با رمز ۱۲۳۴
  const demo = (role) => { const a = demoAccounts(db).find((x) => x.role === role); signIn(a.username, DEMO_PASS) }
  return (
    <motion.form className="gate-in login" {...slide} onSubmit={submit}>
      <div className="login-hero">
        <img src={img(PH.hero[0])} alt="" />
        <div><Logo size={24} light /><em className="en">Beauty, beautifully booked.</em></div>
      </div>
      <h1>خوش آمدید</h1>
      <p className="muted">برای ورود، نام کاربری یا شماره موبایل و رمز عبورتون رو وارد کنید.</p>
      <Field label="نام کاربری یا موبایل">
        <input className="in" dir="ltr" autoComplete="username" value={user} onChange={(e) => { setUser(e.target.value); setErr('') }} placeholder="negar یا 0912…" />
      </Field>
      <Field label="رمز عبور" error={err}>
        <div className="pass">
          <input className="in" dir="ltr" type={see ? 'text' : 'password'} autoComplete="current-password" value={pass} onChange={(e) => { setPass(e.target.value); setErr('') }} placeholder="••••" />
          <button type="button" onClick={() => setSee(!see)} aria-label="نمایش رمز"><Icon n="eye" s={18} /></button>
        </div>
      </Field>
      <button type="button" className="link start" onClick={() => go('forgot')}>رمز رو فراموش کردید؟</button>
      <button className="btn primary block lg" type="submit" disabled={!user || !pass}>ورود</button>
      <p className="switch">حساب ندارید؟ <button type="button" onClick={() => go('signup')}>ثبت‌نام کنید</button></p>
      <p className="switch small">صاحب سالن یا آرتیست هستید؟ <button type="button" onClick={() => go('partner')}>درخواست همکاری</button></p>
      <div className="demo-bar">
        <small>ورود نمایشی (ارائه):</small>
        <button type="button" onClick={() => demo('customer')}>مشتری عادی</button>
        <button type="button" onClick={() => demo('artist')}>آرتیست</button>
        <button type="button" onClick={() => demo('manager')}>صاحب سالن</button>
        <button type="button" onClick={() => demo('admin')}>مدیر کل</button>
      </div>
    </motion.form>
  )
}

// ---------- ثبت‌نام (چهار قدم) ----------
function Signup({ go }) {
  const { signUp, accountExists } = useStore()
  const sms = useSms()
  const [step, setStep] = useState(0)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [bad, setBad] = useState(false)
  const [f, setF] = useState({ name: '', username: '', pass: '', city: 'tehran', area: null })
  const set = (p) => setF((x) => ({ ...x, ...p }))
  const P = toEn(phone)
  const okPhone = /^09\d{9}$/.test(P)
  const phoneTaken = okPhone && accountExists(P)
  const userOk = /^[a-z0-9._]{3,20}$/i.test(f.username)
  const userTaken = userOk && accountExists(f.username)
  const passOk = toEn(f.pass).length >= 4
  useEffect(() => {
    if (code.length < 4) return
    if (code === sms.sent) { haptic(); setTimeout(() => setStep(2), 250) }
    else { setBad(true); haptic(60); setTimeout(() => { setCode(''); setBad(false) }, 700) }
  }, [code])
  const back = () => (step ? setStep(step === 2 ? 0 : step - 1) : go('login'))
  return (
    <motion.section className="gate-in form" {...slide}>
      <SmsBanner sms={sms} onFill={setCode} />
      <div className="wiz-top">
        <button className="icon-btn" onClick={back} aria-label="بازگشت"><Icon n="back" s={22} /></button>
        <div className="wiz-steps">{SIGNUP.map((s, i) => <span key={s} className={i <= step ? 'on' : ''}><i /><small>{s}</small></span>)}</div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} className="wiz-body" {...slide}>
          {step === 0 && <>
            <em className="en">Create account</em>
            <h1>ثبت‌نام در بیوتی‌ست</h1>
            <p className="muted">شماره موبایل‌تون رو وارد کنید؛ یک کد تأیید پیامک می‌شه.</p>
            <Field label="شماره موبایل" error={phoneTaken ? 'این شماره قبلاً ثبت‌نام کرده؛ وارد شوید.' : ''}>
              <input className="in big" dir="ltr" inputMode="numeric" maxLength={11} placeholder="09xx xxx xxxx" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d۰-۹]/g, ''))} autoFocus />
            </Field>
            <button className="btn primary block lg" disabled={!okPhone || phoneTaken} onClick={() => { sms.send(); setCode(''); setStep(1) }}>ارسال کد</button>
            <p className="switch">حساب دارید؟ <button onClick={() => go('login')}>وارد شوید</button></p>
          </>}
          {step === 1 && <>
            <h1>کد تأیید</h1>
            <p className="muted">کد چهاررقمی به <span dir="ltr">{phone}</span> پیامک شد.</p>
            <Otp value={code} onChange={setCode} bad={bad} />
            {bad && <p className="warn center">کد درست نیست</p>}
            <button className="link" onClick={() => { sms.send(); setCode('') }}>کد نرسید؟ ارسال دوباره</button>
          </>}
          {step === 2 && <>
            <em className="en">Your account</em>
            <h1>اطلاعات حساب</h1>
            <Field label="نام و نام خانوادگی"><input className="in" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="مثلاً نگار کاظمی" autoFocus /></Field>
            <Field label="نام کاربری (انگلیسی)" error={f.username && !userOk ? 'فقط حروف انگلیسی، عدد، نقطه یا _ (۳ تا ۲۰ حرف)' : userTaken ? 'این نام کاربری گرفته شده' : ''}>
              <input className="in" dir="ltr" value={f.username} onChange={(e) => set({ username: e.target.value.trim().toLowerCase() })} placeholder="negar.k" />
            </Field>
            <Field label="رمز عبور (حداقل ۴ رقم یا حرف)"><input className="in" dir="ltr" type="password" value={f.pass} onChange={(e) => set({ pass: e.target.value })} placeholder="••••" /></Field>
            <button className="btn primary block lg" disabled={f.name.trim().length < 2 || !userOk || userTaken || !passOk} onClick={() => setStep(3)}>ادامه</button>
          </>}
          {step === 3 && <>
            <em className="en">Almost there</em>
            <h1>کجا زندگی می‌کنید؟</h1>
            <p className="muted">سالن‌های نزدیک شما اول نشان داده می‌شوند.</p>
            <div className="city-pick">
              {CITY_IDS.map((c) => <button key={c} className={f.city === c ? 'on' : ''} onClick={() => set({ city: c, area: null })}><em className="en">{CITIES[c].en}</em><b>{CITIES[c].name}</b></button>)}
            </div>
            <div className="chips wrap small-chips">
              {CITIES[f.city].areas.map((a) => <button key={a.id} className={`chip ${f.area === a.id ? 'on' : ''}`} onClick={() => set({ area: f.area === a.id ? null : a.id })}>{a.name} · {a.hoods[0]}</button>)}
            </div>
            <button className="btn primary block lg" onClick={() => signUp({ ...f, name: f.name.trim(), pass: toEn(f.pass), phone: P })}>ساختن حساب و ورود</button>
          </>}
        </motion.div>
      </AnimatePresence>
    </motion.section>
  )
}

// ---------- فراموشی رمز ----------
function Forgot({ go }) {
  const { accountExists, resetPass, toast } = useStore()
  const sms = useSms()
  const [step, setStep] = useState(0)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [pass, setPass] = useState('')
  const P = toEn(phone)
  useEffect(() => { if (code.length === 4) { if (code === sms.sent) setStep(2); else setCode('') } }, [code])
  return (
    <motion.section className="gate-in form" {...slide}>
      <SmsBanner sms={sms} onFill={setCode} />
      <button className="icon-btn" onClick={() => (step ? setStep(0) : go('login'))}><Icon n="back" s={22} /></button>
      <h1>بازیابی رمز</h1>
      {step === 0 && <>
        <Field label="شماره موبایل" error={/^09\d{9}$/.test(P) && !accountExists(P) ? 'حسابی با این شماره نیست' : ''}><input className="in big" dir="ltr" inputMode="numeric" maxLength={11} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09…" /></Field>
        <button className="btn primary block lg" disabled={!accountExists(P)} onClick={() => { sms.send(); setStep(1) }}>ارسال کد</button>
      </>}
      {step === 1 && <><p className="muted">کد پیامک‌شده رو وارد کنید.</p><Otp value={code} onChange={setCode} /></>}
      {step === 2 && <>
        <Field label="رمز جدید"><input className="in" dir="ltr" type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoFocus /></Field>
        <button className="btn primary block lg" disabled={pass.length < 4} onClick={() => { resetPass(P, toEn(pass)); toast({ icon: '🔑', text: 'رمز عوض شد؛ وارد شوید' }); go('login') }}>ذخیره و ورود</button>
      </>}
    </motion.section>
  )
}

// ---------- درخواست همکاری صاحب سالن یا آرتیست ----------
function Partner({ go }) {
  const { addRequest, toast } = useStore()
  const [f, setF] = useState({ type: 'salon', name: '', phone: '', biz: '', code: '' })
  const set = (p) => setF((x) => ({ ...x, ...p }))
  return (
    <motion.section className="gate-in form" {...slide}>
      <button className="icon-btn" onClick={() => go('login')}><Icon n="back" s={22} /></button>
      <em className="en">Join BeautySet</em>
      <h1>همکاری با بیوتی‌ست</h1>
      <div className="seg">{[['salon', 'صاحب سالن'], ['artist', 'آرتیست']].map(([k, n]) => <button key={k} className={f.type === k ? 'on' : ''} onClick={() => set({ type: k })}>{f.type === k && <span className="seg-ind" />}<span>{n}</span></button>)}</div>
      <Field label="نام و نام خانوادگی"><input className="in" value={f.name} onChange={(e) => set({ name: e.target.value })} /></Field>
      <Field label="شماره موبایل"><input className="in" dir="ltr" value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="09…" /></Field>
      <Field label={f.type === 'salon' ? 'نام سالن و محله' : 'تخصص و محل کار'}><input className="in" value={f.biz} onChange={(e) => set({ biz: e.target.value })} /></Field>
      <Field label="کد معرف (اگر عامل فروش معرفی‌تان کرده)"><input className="in" dir="ltr" value={f.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} placeholder="BS-SARA" /></Field>
      <button className="btn primary block lg" disabled={!f.name || !/^09\d{9}$/.test(toEn(f.phone)) || !f.biz} onClick={() => { addRequest({ ...f, phone: toEn(f.phone) }); toast({ icon: '🤝', text: 'درخواست ثبت شد؛ کارشناسان ما تماس می‌گیرند' }); go('login') }}>ارسال درخواست</button>
    </motion.section>
  )
}
