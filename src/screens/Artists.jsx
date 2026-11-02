import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Badge, Icon, Rating } from '../components/ui'
import { Glyph, Portrait } from '../components/Art'
import { CATS, CAT } from '../lib/catalog'
import { img } from '../lib/photos'
import { fa, haptic } from '../lib/util'

const k = (n) => (n >= 1000 ? `${(n / 1000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}K` : n.toLocaleString('fa-IR'))

// تب آرتیست‌ها: آدم‌ها برندند — با کار شاخص، دنبال‌کننده و نشان
export default function Artists() {
  const { db, me, toggleFollow } = useStore()
  const nav = useNav()
  const [cat, setCat] = useState('')
  const [mode, setMode] = useState('all')
  const [t, setT] = useState('')
  const list = useMemo(() => db.artists
    .filter((a) => a.city === me.city && (!cat || a.cats.includes(cat)) && (mode !== 'mine' || me.follows.includes(a.id)) && (mode !== 'home' || a.home)
      && (!t || a.name.includes(t) || a.handle.includes(t.toLowerCase())))
    .sort((a, b) => (b.badge === 'star') - (a.badge === 'star') || b.rating - a.rating || b.followers - a.followers), [db.artists, me.city, cat, mode, t, me.follows])

  return (
    <div className="scroll artists-tab">
      <header className="top plain"><div><em className="en">Find your artist</em><h1>آرتیست‌ها</h1></div></header>
      <div className="pad-x">
        <label className="search-in"><Icon n="search" s={17} /><input value={t} onChange={(e) => setT(e.target.value)} placeholder="اسم یا آیدی آرتیست" /></label>
        <div className="chips">
          {[['all', 'همه'], ['mine', `دنبال‌شده‌ها (${fa(me.follows.length)})`], ['home', 'در منزل']].map(([v, n]) => <button key={v} className={`chip ${mode === v ? 'on' : ''}`} onClick={() => setMode(v)}>{n}</button>)}
        </div>
        <div className="chips">
          <button className={`chip soft ${!cat ? 'on' : ''}`} onClick={() => setCat('')}>همه‌ی تخصص‌ها</button>
          {CATS.map((c) => <button key={c.id} className={`chip soft ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(cat === c.id ? '' : c.id)}><Glyph cat={c.id} s={14} /> {c.name}</button>)}
        </div>
      </div>
      <div className="artist-grid">
        {list.map((a, i) => {
          const salon = db.salons.find((s) => s.id === a.salon)
          const on = me.follows.includes(a.id)
          return (
            <motion.article key={a.id} className="ag-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.03 } }} onClick={() => nav.push({ type: 'artist', id: a.id })}>
              <div className="ag-cover">
                <img src={img(a.works[1]?.ph || a.works[0].ph)} alt="" loading="lazy" />
                <span className="ag-fol">{k(a.followers)} دنبال‌کننده</span>
              </div>
              <div className="ag-body">
                <Portrait a={a} size={52} />
                <b>{a.name}</b>
                <small className="handle" dir="ltr">@{a.handle}</small>
                <span className="ac-cats">{a.cats.slice(0, 2).map((c) => CAT[c].name).join(' · ')}</span>
                <span className="ac-foot"><Rating v={a.rating} /> <Badge a={a} /></span>
                <small className="muted ag-where">{salon ? salon.name : 'آزادکار · در منزل'}</small>
                <button className={`ag-follow ${on ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); haptic(10); toggleFollow(a.id) }}>{on ? 'دنبال می‌کنید' : 'دنبال کردن'}</button>
              </div>
            </motion.article>
          )
        })}
      </div>
      <div className="foot-space" />
    </div>
  )
}
