import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Logo } from '../components/Logo'
import { Avatar, Icon } from '../components/ui'
import { CATS } from '../lib/catalog'
import { PH, img } from '../lib/photos'
import { BLANK } from '../lib/search'
import { haptic } from '../lib/util'
import { Finder } from './Book'
import MapTab from './MapTab'

// کاشی‌های فیلتر زیر کارت جستجو؛ هر کدام صفحه‌ی سالن‌ها/آرتیست‌ها را با همان فیلتر باز می‌کند
const QUICK = [
  { name: 'آزاد همین امروز', ph: PH.hero[2], q: { freeOnly: true, sort: 'soon' } },
  { name: 'برترین سالن‌ها', ph: PH.interior[1], q: { sort: 'rating', minRating: 4.6 } },
  { name: 'آرتیست‌های ستاره', ph: PH.makeup[1], q: { star: true }, who: 'artists' },
  { name: 'تخفیف‌دارها', ph: PH.nail[4], q: { offer: true } },
  { name: 'خدمات در منزل', ph: PH.makeup[0], q: { amen: ['home'] }, who: 'artists' },
  { name: 'به‌صرفه', ph: PH.interior[3], q: { sort: 'price', tiers: [1, 2] } },
]

// صفحه‌ی وسط: جستجو (کارت + کاشی‌ها) یا نقشه
export default function Home() {
  const { me } = useStore()
  const nav = useNav()
  const [mode, setMode] = useState('find')
  const open = (t) => { haptic(8); nav.push({ type: 'results', q: { ...BLANK, ...t.q }, title: t.name, who: t.who }) }
  const head = (
    <header className="search-head">
      <Logo size={15} en={false} />
      <div className="mode-seg">
        {[['find', 'جستجو', 'search'], ['map', 'نقشه', 'map']].map(([k, n, ic]) => (
          <button key={k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>
            {mode === k && <motion.span layoutId="mode-on" className="mode-ind" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
            <Icon n={ic} s={15} /><span>{n}</span>
          </button>
        ))}
      </div>
      <button onClick={() => nav.go('me')} aria-label="پروفایل من" className="me-btn"><Avatar u={me} size={34} />{me.notes.some((n) => !n.read) && <i className="ping" />}</button>
    </header>
  )
  if (mode === 'map') return <div className="search-page">{head}<div className="map-embed"><MapTab /></div></div>
  return (
    <div className="scroll home">
      {head}
      <Finder onMap={() => setMode('map')} />

      <div className="sec-title"><div><em className="en">Quick filters</em><h2>انتخاب سریع</h2></div></div>
      <div className="qtiles">
        {QUICK.map((t, i) => (
          <motion.button key={t.name} whileTap={{ scale: 0.96 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }} onClick={() => open(t)}>
            <img src={img(t.ph)} alt="" loading="lazy" /><b>{t.name}</b>
          </motion.button>
        ))}
      </div>

      <div className="sec-title"><div><em className="en">Services</em><h2>بر اساس خدمت</h2></div></div>
      <div className="qtiles three">
        {CATS.map((c, i) => (
          <motion.button key={c.id} whileTap={{ scale: 0.96 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.02 } }} onClick={() => open({ name: c.name, q: { cat: c.id } })}>
            <img src={img(PH[c.id][0])} alt="" loading="lazy" /><b>{c.name}</b>
          </motion.button>
        ))}
      </div>
      <div className="foot-space" />
    </div>
  )
}
