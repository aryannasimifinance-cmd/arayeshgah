import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Badge, Icon, Rating } from '../components/ui'
import { Cover, Glyph, Portrait } from '../components/Art'
import { CAT, DAYPARTS, SV, byCat, fmtDur } from '../lib/catalog'
import { canDo, freeStarts, priceOf } from '../lib/seed'
import { addDays, dateLong, dayNum, fa, haptic, hh, relDay, today, toman, wdShort } from '../lib/util'
import { celebrate } from '../lib/fx'

const STEPS = ['خدمات', 'آرتیست', 'زمان', 'تأیید']

// مکان نوبت: سالن، یا «در منزل» برای آرتیست آزادکار
function useVenue(opts) {
  const { db } = useStore()
  return useMemo(() => {
    if (!opts) return null
    if (opts.salon) return db.salons.find((s) => s.id === opts.salon)
    const a = db.artists.find((x) => x.id === opts.freelancer)
    return { id: null, home: true, name: `در منزل · ${a.name}`, kind: 'salon', seed: a.seed, cats: a.cats, city: a.city, area: a.area, open: 9, close: 21, artists: [a.id], svc: a.cats.flatMap((c) => byCat(c).map((s) => ({ sid: s.id, price: s.price }))) }
  }, [opts, db.salons, db.artists])
}

export default function Wizard({ opts, onClose }) {
  return (
    <AnimatePresence>
      {opts && (
        <motion.div className="wizard" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 34, stiffness: 300 }}>
          <Flow opts={opts} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Flow({ opts, onClose }) {
  const { db, me, book } = useStore()
  const nav = useNav()
  const v = useVenue(opts)
  const [svc, setSvc] = useState(opts.svc || [])
  const [artist, setArtist] = useState(opts.artist || 'any')
  const [date, setDate] = useState(opts.date || today())
  const [start, setStart] = useState(opts.start ?? null)
  const [method, setMethod] = useState(me.wallet > 0 ? 'wallet' : 'card')
  const [note, setNote] = useState('')
  // دسته‌هایی که این مکان (و اگر آرتیست مشخص است، همان آرتیست) خدمت دارد
  const preset = opts.artist && db.artists.find((a) => a.id === opts.artist)
  const cats = v.cats.filter((c) => v.svc.some((x) => SV[x.sid].cat === c) && (!preset || preset.cats.includes(c)))
  const [cat, setCat] = useState(svc[0] ? SV[svc[0]].cat : cats[0])
  // از تقویم صفحه‌ی سالن با ساعت انتخاب‌شده آمده: مستقیم تأیید و پرداخت
  const first = svc.length ? (opts.start != null && opts.date ? 3 : opts.artist ? 2 : 1) : 0
  const [step, setStep] = useState(first)
  // خلاصه‌ی نوبت ثبت‌شده؛ بعد از ثبت، آن ساعت دیگر آزاد نیست پس از وضعیت زنده خوانده نمی‌شود
  const [done, setDone] = useState(null)

  const team = v.artists.map((id) => db.artists.find((a) => a.id === id))
  const able = team.filter((a) => canDo(a, svc))
  const dur = svc.reduce((s, id) => s + SV[id].dur, 0)
  const pro = artist === 'any' ? null : db.artists.find((a) => a.id === artist)
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today(), i)), [])

  // ساعت‌های آزاد: برای «هر آرتیستی»، اجتماع همه و اولین آزاد اختصاص می‌یابد
  const slotsFor = (d) => {
    const list = pro ? [pro] : able
    const map = new Map()
    list.forEach((a) => freeStarts(v, a, d, dur, db.bookings).forEach((h) => { if (!map.has(h)) map.set(h, a.id) }))
    return map
  }
  useEffect(() => { if (pro && svc.length && !canDo(pro, svc)) setArtist('any') }, [svc.join()])
  const slots = useMemo(() => slotsFor(date), [date, artist, svc.join(), db.bookings])
  useEffect(() => { if (!done && start != null && !slots.has(start)) setStart(null) }, [slots])
  const who = pro || (start != null ? db.artists.find((a) => a.id === slots.get(start)) : null)
  const price = svc.reduce((s, id) => s + priceOf(v, id, who || null), 0)
  const off = v.offer ? svc.filter((id) => SV[id].cat === v.offer.cat).reduce((s, id) => s + priceOf(v, id, who) * v.offer.pct / 100, 0) : 0
  const total = Math.round((price - off) / 1000) * 1000
  const deposit = Math.round(total * 0.3 / 1000) * 1000

  const can = [svc.length > 0, true, start != null, method !== 'wallet' || me.wallet >= deposit][step]
  const next = () => {
    haptic()
    if (step === 0 && opts.artist && canDo(db.artists.find((a) => a.id === opts.artist), svc)) return setStep(2)
    if (step === 0 && able.length === 0) return
    if (step < 3) return setStep(step + 1)
    book({ salon: v.id, home: !!v.home, artist: who.id, svc, date, start, dur, price: total, paid: deposit, method, note })
    setDone({ who, svc, date, start, deposit }); celebrate()
  }
  const back = () => { if (step <= first) return onClose(); setStep(step === 2 && opts.artist && first === 0 ? 0 : step - 1) }

  if (done) return <Done v={v} {...done} onClose={onClose} onVisits={() => { onClose(); nav.go('visits') }} />

  return (
    <>
      <header className="wz-head">
        <button className="icon-btn" onClick={back} aria-label="بازگشت"><Icon n={step <= first ? 'close' : 'back'} s={22} /></button>
        <div className="wz-title"><b>{v.name}</b><small>{STEPS[step]}</small></div>
        <span className="icon-btn" />
      </header>
      <div className="wz-steps">{STEPS.map((s, i) => <span key={s} className={i <= step ? 'on' : ''}><i /><small>{s}</small></span>)}</div>

      <div className="scroll wz-body">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.22 }}>
            {step === 0 && (
              <section className="pad">
                <h2 className="wz-h">چه خدماتی می‌خواهید؟</h2>
                <p className="muted small">می‌تونید چند خدمت رو با هم انتخاب کنید؛ پشت هم انجام می‌شن.</p>
                <div className="chips">{cats.map((c) => <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}><Glyph cat={c} s={15} /> {CAT[c].name}</button>)}</div>
                <div className="svc-list">
                  {v.svc.filter((x) => SV[x.sid].cat === cat).map((x) => {
                    const on = svc.includes(x.sid)
                    return (
                      <button key={x.sid} className={`svc ${on ? 'on' : ''}`} onClick={() => { haptic(8); setSvc(on ? svc.filter((y) => y !== x.sid) : [...svc, x.sid]) }}>
                        <div><b>{SV[x.sid].name}</b><small className="muted">{fmtDur(SV[x.sid].dur)}</small></div>
                        <span className="svc-price">{toman(priceOf(v, x.sid, pro))}</span>
                        <span className="svc-add">{on ? <Icon n="check" s={16} w={2.4} /> : <Icon n="plus" s={16} />}</span>
                      </button>
                    )
                  })}
                </div>
                {svc.length > 0 && able.length === 0 && <p className="warn">هیچ آرتیستی همه‌ی این خدمات رو با هم انجام نمی‌ده؛ لطفاً جدا رزرو کنید.</p>}
              </section>
            )}

            {step === 1 && (
              <section className="pad">
                <h2 className="wz-h">با کدوم آرتیست؟</h2>
                <button className={`pro-row ${artist === 'any' ? 'on' : ''}`} onClick={() => setArtist('any')}>
                  <span className="any-ico"><Icon n="users" s={22} /></span>
                  <div><b>فرقی نمی‌کنه</b><small className="muted">اولین آرتیست آزاد · زودترین نوبت</small></div>
                  <span className="radio" />
                </button>
                {able.map((a) => (
                  <button key={a.id} className={`pro-row ${artist === a.id ? 'on' : ''}`} onClick={() => setArtist(a.id)}>
                    <Portrait a={a} size={50} />
                    <div><b>{a.name} <Badge a={a} /></b><small className="muted">{a.cats.map((c) => CAT[c].name).join(' · ')} · <Rating v={a.rating} /></small></div>
                    <span className="radio" />
                  </button>
                ))}
              </section>
            )}

            {step === 2 && (
              <section className="pad">
                <h2 className="wz-h">چه روزی و چه ساعتی؟</h2>
                <div className="days">
                  {days.map((d) => (
                    <button key={d} className={date === d ? 'on' : ''} onClick={() => setDate(d)}>
                      <small>{relDay(d) === 'امروز' || relDay(d) === 'فردا' ? relDay(d) : wdShort(d)}</small><b>{dayNum(d)}</b>
                      <i className={slotsFor(d).size ? 'has' : ''} />
                    </button>
                  ))}
                </div>
                <p className="muted small">{dateLong(date)} · مدت {fmtDur(dur)}</p>
                {slots.size === 0 && <div className="empty-slots"><Icon n="moon" s={22} /><b>این روز پره</b><span className="muted">روز دیگه‌ای رو امتحان کنید.</span></div>}
                {DAYPARTS.slice(1).map((p) => {
                  const hs = [...slots.keys()].filter((h) => h >= p.from && h < p.to).sort((a, b) => a - b)
                  return hs.length ? (
                    <div key={p.id} className="slot-group">
                      <h4><Icon n={p.icon} s={15} /> {p.name}</h4>
                      <div className="slots">{hs.map((h) => <motion.button key={h} whileTap={{ scale: 0.9 }} className={start === h ? 'on' : ''} onClick={() => { haptic(8); setStart(h) }}>{hh(h)}</motion.button>)}</div>
                    </div>
                  ) : null
                })}
                {start != null && who && artist === 'any' && <p className="assigned"><Portrait a={who} size={26} ring={false} /> نوبت شما با <b>{who.name}</b></p>}
              </section>
            )}

            {step === 3 && (
              <section className="pad confirm">
                <div className="receipt">
                  <div className="rc-cover">{v.home ? <Portrait a={who} size={64} /> : <Cover salon={v} ratio={0.35} />}</div>
                  <div className="rc-body">
                    <h3>{v.name}</h3>
                    <p className="rc-when"><Icon n="cal" s={16} /> {dateLong(date)} · ساعت {hh(start)}</p>
                    <p className="rc-who"><Portrait a={who} size={24} ring={false} /> {who.name}</p>
                    <ul>{svc.map((id) => <li key={id}><span>{SV[id].name}</span><b>{toman(priceOf(v, id, who))}</b></li>)}</ul>
                    {off > 0 && <p className="rc-off"><span>تخفیف ویژه</span><b>− {toman(off)}</b></p>}
                    <p className="rc-total"><span>جمع</span><b>{toman(total)}</b></p>
                    <p className="rc-dep"><span>بیعانه (٪۳۰) — الان</span><b>{toman(deposit)}</b></p>
                    <small className="muted">باقی مبلغ در سالن پرداخت می‌شود · لغو رایگان تا ۲۴ ساعت قبل</small>
                  </div>
                </div>
                <h4>پرداخت بیعانه</h4>
                <button className={`pay ${method === 'wallet' ? 'on' : ''}`} onClick={() => setMethod('wallet')}><Icon n="wallet" /><div><b>کیف پول بیوتی‌ست</b><small className="muted">موجودی {toman(me.wallet)}</small></div><span className="radio" /></button>
                <button className={`pay ${method === 'card' ? 'on' : ''}`} onClick={() => setMethod('card')}><Icon n="money" /><div><b>کارت بانکی</b><small className="muted">درگاه امن شاپرک</small></div><span className="radio" /></button>
                {method === 'wallet' && me.wallet < deposit && <p className="warn">موجودی کافی نیست.</p>}
                <h4>یادداشت برای آرتیست</h4>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثلاً: پوستم حساسه / عکس مدل رو میارم" rows={3} />
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="wz-foot">
        <div className="wz-sum">{svc.length ? <><b>{toman(total)}</b><small>{fa(svc.length)} خدمت · {fmtDur(dur)}</small></> : <small className="muted">هنوز خدمتی انتخاب نشده</small>}</div>
        <motion.button className="btn primary" disabled={!can || (step === 0 && able.length === 0)} whileTap={{ scale: 0.96 }} onClick={next}>
          {step === 3 ? `پرداخت ${toman(deposit)}` : 'ادامه'}
        </motion.button>
      </footer>
    </>
  )
}

function Done({ v, who, svc, date, start, deposit, onClose, onVisits }) {
  const { toast } = useStore()
  return (
    <div className="done">
      <motion.div className="done-mark" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}>
        <Icon n="check" s={44} w={2} />
      </motion.div>
      <em className="en">See you soon, beautiful.</em>
      <h2>نوبت شما ثبت شد</h2>
      <p className="muted">{relDay(date)}، {dateLong(date)} · ساعت {hh(start)}</p>
      <div className="done-card">
        <Portrait a={who} size={48} />
        <div><b>{who.name}</b><small className="muted">{v.name}</small><small>{svc.map((id) => SV[id].name).join(' + ')}</small></div>
      </div>
      <p className="muted small">بیعانه {toman(deposit)} پرداخت شد. یک روز قبل یادآوری پیامکی می‌گیرید.</p>
      <div className="done-actions">
        <button className="btn ghost" onClick={() => toast({ icon: '📅', text: 'به تقویم گوشی اضافه شد' })}><Icon n="cal" s={16} /> افزودن به تقویم</button>
        <button className="btn primary" onClick={onVisits}>نوبت‌های من</button>
      </div>
      <button className="link" onClick={onClose}>بستن</button>
    </div>
  )
}
