import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav, PageHead } from './Shell'
import { Empty, Icon, Sheet } from '../components/ui'
import { PCATS, PCAT } from '../lib/market'
import { img } from '../lib/photos'
import { fa, haptic, short, toman } from '../lib/util'
import { celebrate } from '../lib/fx'

const TYPE = { salon: 'فروشگاه سالن', vendor: 'فروشنده', artist: 'منتخب آرتیست' }
const useLive = () => { const { db } = useStore(); return useMemo(() => { const ids = new Set(db.shops.filter((s) => s.status === 'active').map((s) => s.id)); return { shops: db.shops.filter((s) => ids.has(s.id)), products: db.products.filter((p) => ids.has(p.shop)) } }, [db.shops, db.products]) }
const cartCount = (me) => (me.cart || []).reduce((a, i) => a + i.qty, 0)

export function CartBtn() {
  const { me } = useStore()
  const nav = useNav()
  const n = cartCount(me)
  return (
    <button className="cart-btn" onClick={() => nav.push({ type: 'cart' })} aria-label="سبد خرید">
      <Icon n="bag" s={20} />{n > 0 && <i>{fa(n)}</i>}
    </button>
  )
}

function ProductCard({ p, onOpen }) {
  const { db, addToCart, toast } = useStore()
  const sh = db.shops.find((s) => s.id === p.shop)
  return (
    <motion.article className="pcard" whileTap={{ scale: 0.98 }} onClick={() => onOpen(p)}>
      <div className="pc-ph"><img src={img(p.photo)} alt="" loading="lazy" />{p.old && <span className="pc-off">٪{fa(Math.round((1 - p.price / p.old) * 100))}</span>}</div>
      <small className="muted">{p.brand}</small>
      <b>{p.name}</b>
      <div className="pc-row">
        <span>{p.old && <s>{short(p.old)}</s>}<em>{short(p.price)}</em></span>
        <button disabled={!p.stock} onClick={(e) => { e.stopPropagation(); haptic(10); addToCart(p.id); toast({ icon: '🛍️', text: 'به سبد اضافه شد' }) }} aria-label="افزودن"><Icon n="plus" s={16} w={2.2} /></button>
      </div>
      <small className="pc-shop">{sh?.name}</small>
    </motion.article>
  )
}

export function ProductSheet({ p, onClose }) {
  const { db, addToCart, toast } = useStore()
  const nav = useNav()
  const sh = p && db.shops.find((s) => s.id === p.shop)
  return (
    <Sheet open={!!p} onClose={onClose}>
      {p && (
        <div className="prod-view">
          <img src={img(p.photo)} alt="" />
          <div className="pad">
            <small className="muted">{p.brand} · {PCAT[p.cat].name}</small>
            <h3>{p.name}</h3>
            <p className="pv-price">{p.old && <s>{toman(p.old)}</s>}<b>{toman(p.price)}</b></p>
            <p className="muted small">★ {fa(p.rating.toFixed(1))} · {fa(p.sold)} فروش · {p.stock ? `${fa(p.stock)} عدد موجود` : 'ناموجود'}</p>
            <button className="pv-shop" onClick={() => { onClose(); nav.push({ type: 'shop', id: sh.id }) }}><img src={img(sh.logo)} alt="" /><div><b>{sh.name}</b><small>{TYPE[sh.type]} · ارسال از {sh.city === 'tehran' ? 'تهران' : 'کرج'}</small></div><Icon n="fwd" s={16} /></button>
            <p className="muted small"><Icon n="shield" s={13} /> پرداخت امن نزد بیوتی‌ست؛ پول بعد از تحویل به فروشنده تسویه می‌شود.</p>
            <button className="btn primary block" disabled={!p.stock} onClick={() => { addToCart(p.id); toast({ icon: '🛍️', text: 'به سبد اضافه شد' }); onClose() }}>افزودن به سبد</button>
          </div>
        </div>
      )}
    </Sheet>
  )
}

// تب فروشگاه: مارکت‌پلیس همه‌ی فروشگاه‌ها
export default function Shop() {
  const { shops, products } = useLive()
  const nav = useNav()
  const [cat, setCat] = useState('')
  const [t, setT] = useState('')
  const [open, setOpen] = useState(null)
  const list = products.filter((p) => (!cat || p.cat === cat) && (!t || p.name.includes(t) || p.brand.includes(t)))
  const deals = products.filter((p) => p.old).slice(0, 8)
  return (
    <div className="scroll shop-tab">
      <header className="top plain">
        <div><em className="en">Beauty Market</em><h1>فروشگاه</h1></div>
        <CartBtn />
      </header>
      <div className="pad-x"><label className="search-in"><Icon n="search" s={17} /><input value={t} onChange={(e) => setT(e.target.value)} placeholder="سرم، رژ لب، لاک ژل، سشوار…" /></label></div>
      <div className="chips pad-x">
        <button className={`chip ${!cat ? 'on' : ''}`} onClick={() => setCat('')}>همه</button>
        {PCATS.map((c) => <button key={c.id} className={`chip ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(cat === c.id ? '' : c.id)}>{c.name}</button>)}
      </div>
      {!t && !cat && <>
        <div className="sec-title"><div><em className="en">Stores</em><h2>فروشگاه‌ها</h2></div></div>
        <div className="rail">
          {shops.map((s) => (
            <motion.button key={s.id} className="shop-card" whileTap={{ scale: 0.97 }} onClick={() => nav.push({ type: 'shop', id: s.id })}>
              <img src={img(s.cover)} alt="" loading="lazy" />
              <div><span className="sh-logo"><img src={img(s.logo)} alt="" /></span><b>{s.name}</b><small>{TYPE[s.type]} · ★ {fa(s.rating.toFixed(1))}</small></div>
            </motion.button>
          ))}
        </div>
        {deals.length > 0 && <>
          <div className="sec-title"><div><em className="en">Deals</em><h2>تخفیف‌دارها</h2></div></div>
          <div className="rail">{deals.map((p) => <div key={p.id} className="rail-p"><ProductCard p={p} onOpen={setOpen} /></div>)}</div>
        </>}
        <div className="sec-title"><div><em className="en">All products</em><h2>همه‌ی محصولات</h2></div></div>
      </>}
      <div className="pgrid">{list.map((p) => <ProductCard key={p.id} p={p} onOpen={setOpen} />)}</div>
      {!list.length && <Empty icon="bag" title="محصولی پیدا نشد" />}
      <div className="sell-cta pad"><Icon n="home" s={18} /><div><b>فروشگاه دارید؟</b><small>از داشبورد سالن یا «درخواست همکاری» در صفحه‌ی ورود، فروشگاه‌تان را در بیوتی‌ست باز کنید.</small></div></div>
      <div className="foot-space" />
      <ProductSheet p={open} onClose={() => setOpen(null)} />
    </div>
  )
}

// صفحه‌ی یک فروشگاه
export function ShopPage({ id }) {
  const { db } = useStore()
  const nav = useNav()
  const sh = db.shops.find((s) => s.id === id)
  const [open, setOpen] = useState(null)
  const list = db.products.filter((p) => p.shop === id)
  const salon = sh.salon && db.salons.find((s) => s.id === sh.salon)
  return (
    <div className="scroll shop-page">
      <div className="sp-hero">
        <img src={img(sh.cover)} alt="" />
        <button className="icon-btn glass" onClick={nav.pop} aria-label="بازگشت"><Icon n="back" s={22} /></button>
        <div className="sp-cart"><CartBtn /></div>
      </div>
      <section className="sp-head">
        <span className="sh-logo big"><img src={img(sh.logo)} alt="" /></span>
        <h1>{sh.name}</h1>
        <p className="muted small">{TYPE[sh.type]} · ★ {fa(sh.rating.toFixed(1))} · {fa(list.length)} محصول</p>
        <p className="small">{sh.about}</p>
        {salon && <button className="link" onClick={() => nav.push({ type: 'salon', id: salon.id })}>رزرو نوبت در {salon.name}</button>}
      </section>
      <div className="pgrid">{list.map((p) => <ProductCard key={p.id} p={p} onOpen={setOpen} />)}</div>
      <div className="foot-space" />
      <ProductSheet p={open} onClose={() => setOpen(null)} />
    </div>
  )
}

// سبد خرید و پرداخت
export function Cart() {
  const { db, me, addToCart, checkout } = useStore()
  const nav = useNav()
  const [method, setMethod] = useState('wallet')
  const [done, setDone] = useState(null)
  const items = (me.cart || []).map((i) => ({ ...i, p: db.products.find((p) => p.id === i.pid) })).filter((i) => i.p)
  const groups = items.reduce((m, i) => { (m[i.p.shop] ||= []).push(i); return m }, {})
  const total = items.reduce((a, i) => a + i.p.price * i.qty, 0)
  const ship = Object.keys(groups).length * 60000
  if (done) return (
    <div className="results">
      <PageHead title="سفارش ثبت شد" />
      <div className="done"><div className="done-mark"><Icon n="check" s={40} w={2} /></div><h2>سفارش شما ثبت شد</h2><p className="muted">{fa(done.length)} مرسوله از {fa(done.length)} فروشگاه · پیگیری از صفحه‌ی «من»</p><button className="btn primary" onClick={nav.pop}>ادامه‌ی خرید</button></div>
    </div>
  )
  return (
    <div className="results">
      <PageHead title="سبد خرید" sub={items.length ? `${fa(items.length)} کالا` : ''} />
      <div className="scroll pad-x">
        {!items.length && <Empty icon="bag" title="سبد شما خالی است"><button className="btn primary" onClick={nav.pop}>رفتن به فروشگاه</button></Empty>}
        {Object.entries(groups).map(([sid, list]) => (
          <section key={sid} className="cart-group">
            <h4><Icon n="home" s={14} /> {db.shops.find((s) => s.id === sid)?.name}</h4>
            {list.map((i) => (
              <div key={i.pid} className="cart-row">
                <img src={img(i.p.photo)} alt="" />
                <div><b>{i.p.name}</b><small className="muted">{toman(i.p.price)}</small></div>
                <span className="qty"><button onClick={() => addToCart(i.pid, -1)}><Icon n="minus" s={14} /></button><b>{fa(i.qty)}</b><button onClick={() => addToCart(i.pid, 1)}><Icon n="plus" s={14} /></button></span>
              </div>
            ))}
          </section>
        ))}
        {items.length > 0 && <>
          <ul className="kv"><li><span>جمع کالاها</span><b>{toman(total)}</b></li><li><span>ارسال ({fa(Object.keys(groups).length)} فروشگاه)</span><b>{toman(ship)}</b></li><li><span>قابل پرداخت</span><b>{toman(total + ship)}</b></li></ul>
          <button className={`pay ${method === 'wallet' ? 'on' : ''}`} onClick={() => setMethod('wallet')}><Icon n="wallet" /><div><b>کیف پول</b><small className="muted">موجودی {toman(me.wallet)}</small></div><span className="radio" /></button>
          <button className={`pay ${method === 'card' ? 'on' : ''}`} onClick={() => setMethod('card')}><Icon n="money" /><div><b>کارت بانکی</b><small className="muted">درگاه امن</small></div><span className="radio" /></button>
          <button className="btn primary block lg" disabled={method === 'wallet' && me.wallet < total + ship} onClick={() => { setDone(checkout(method)); celebrate() }}>پرداخت {toman(total + ship)}</button>
        </>}
        <div className="foot-space" />
      </div>
    </div>
  )
}
