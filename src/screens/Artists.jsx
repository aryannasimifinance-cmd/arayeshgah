import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useNav } from './Shell'
import { Badge, Empty, Icon, Rating, Seg } from '../components/ui'
import { Glyph, Portrait } from '../components/Art'
import { CATS, CAT } from '../lib/catalog'
import { img } from '../lib/photos'
import { fa, haptic } from '../lib/util'

const k = (n) => (n >= 1000 ? `${(n / 1000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}K` : n.toLocaleString('fa-IR'))

// تب آرتیست‌ها: آدم‌ها برندند — با کار شاخص، دنبال‌کننده و نشان
// فید پست‌های آرتیست‌های دنبال‌شده؛ زمان انتشار از بذر هر پست ساخته می‌شود
function Feed({ onFind }) {
  const { db, me, toggleLike, toggleFollow } = useStore()
  const nav = useNav()
  const followed = db.artists.filter((a) => me.follows.includes(a.id))
  const posts = useMemo(() => followed.flatMap((a) => a.works.map((w, i) => ({ a, w, key: `${a.id}:${i}`, age: (w.seed % 13) + i * 2 })))
    .sort((x, y) => x.age - y.age).slice(0, 30), [followed.map((a) => a.id).join()])
  const suggest = db.artists.filter((a) => a.city === me.city && a.badge === 'star' && !me.follows.includes(a.id)).slice(0, 6)
  if (!followed.length) return (
    <div className="pad">
      <Empty icon="sparkle" title="هنوز کسی را دنبال نمی‌کنید" text="آرتیست‌ها را دنبال کنید تا کارهای تازه‌شان این‌جا بیاید." />
      <div className="sugg">{suggest.map((a) => (
        <div key={a.id} className="sugg-row"><Portrait a={a} size={44} ring={false} /><div onClick={() => nav.push({ type: 'artist', id: a.id })}><b>{a.name}</b><small className="handle" dir="ltr">@{a.handle}</small></div><button className="btn primary sm" onClick={() => { haptic(10); toggleFollow(a.id) }}>دنبال کردن</button></div>
      ))}</div>
      <button className="link" onClick={onFind}>دیدن همه‌ی آرتیست‌ها</button>
    </div>
  )
  return (
    <div className="ig-feed">
      <div className="stories">{followed.map((a) => <button key={a.id} onClick={() => nav.push({ type: 'artist', id: a.id })}><span className="st-ring"><Portrait a={a} size={54} ring={false} /></span><small>{a.name.split(' ')[0]}</small></button>)}</div>
      {posts.map(({ a, w, key, age }) => {
        const on = (me.liked || []).includes(key)
        const salon = db.salons.find((x) => x.id === a.salon)
        return (
          <article key={key} className="post">
            <header onClick={() => nav.push({ type: 'artist', id: a.id })}><Portrait a={a} size={36} ring={false} /><div><b className="handle-b" dir="ltr">{a.handle}</b><small className="muted">{salon ? salon.name : 'در منزل'}</small></div><Badge a={a} /></header>
            <div className="post-ph" onDoubleClick={() => !on && toggleLike(key)}><img src={img(w.ph)} alt={w.title} loading="lazy" /></div>
            <div className="post-acts">
              <motion.button whileTap={{ scale: 1.3 }} className={on ? 'liked' : ''} onClick={() => { haptic(8); toggleLike(key) }} aria-label="پسندیدن"><Icon n="heart" s={22} fill={on ? 'currentColor' : 'none'} /></motion.button>
              <span>{k(w.likes + (on ? 1 : 0))}</span>
              <button className="btn primary sm post-book" onClick={() => nav.book({ salon: a.salon || undefined, freelancer: a.salon ? undefined : a.id, artist: a.id, svc: [] })}>همین رو می‌خوام</button>
            </div>
            <p className="post-cap"><b dir="ltr">{a.handle}</b> {w.title} · {CAT[w.cat].name}</p>
            <small className="muted post-age">{age ? `${fa(age)} روز پیش` : 'امروز'}</small>
          </article>
        )
      })}
    </div>
  )
}

export default function Artists() {
  const { db, me, toggleFollow } = useStore()
  const nav = useNav()
  const [cat, setCat] = useState('')
  const [view, setView] = useState(me.follows.length ? 'feed' : 'find')
  const [t, setT] = useState('')
  const list = useMemo(() => db.artists
    .filter((a) => a.city === me.city && (!cat || a.cats.includes(cat))
      && (!t || a.name.includes(t) || a.handle.includes(t.toLowerCase())))
    .sort((a, b) => (b.badge === 'star') - (a.badge === 'star') || b.rating - a.rating || b.followers - a.followers), [db.artists, me.city, cat, t])

  return (
    <div className="scroll artists-tab">
      <header className="top plain"><div><em className="en">Find your artist</em><h1>آرتیست‌ها</h1></div></header>
      <div className="pad-x"><Seg id="aview" items={[['feed', `دنبال‌شده‌ها${me.follows.length ? ` (${fa(me.follows.length)})` : ''}`], ['find', 'کشف آرتیست']]} value={view} onChange={setView} /></div>
      {view === 'feed' ? <Feed onFind={() => setView('find')} /> : <>
      <div className="pad-x">
        <label className="search-in"><Icon n="search" s={17} /><input value={t} onChange={(e) => setT(e.target.value)} placeholder="اسم یا آیدی آرتیست" /></label>
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
      </>}
      <div className="foot-space" />
    </div>
  )
}
