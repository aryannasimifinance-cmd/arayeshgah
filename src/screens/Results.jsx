import { useState } from 'react'
import { useStore } from '../store'
import { PageHead } from './Shell'
import { Empty, Icon, Sheet } from '../components/ui'
import { ArtistCard, SalonCard } from '../components/cards'
import { CityMap } from '../components/Maps'
import { AMEN, CAT, SV } from '../lib/catalog'
import { CITIES } from '../lib/geo'
import { KINDS } from '../lib/seed'
import { BLANK, useAreaStats, useSearch } from '../lib/search'
import { dateShort, fa, relDay } from '../lib/util'
import { AreaSheet } from './Book'

const SORTS = [['best', 'پیشنهادی'], ['rating', 'امتیاز'], ['soon', 'زودترین'], ['price', 'ارزان‌ترین']]

export function FilterSheet({ open, onClose, q, set, count }) {
  const tog = (k, v) => set({ [k]: q[k].includes(v) ? q[k].filter((x) => x !== v) : [...q[k], v] })
  return (
    <Sheet open={open} onClose={onClose} title="فیلترها">
      <div className="pad filters">
        <h4>حداقل امتیاز</h4>
        <div className="chips">{[0, 4, 4.5, 4.8].map((r) => <button key={r} className={`chip ${q.minRating === r ? 'on' : ''}`} onClick={() => set({ minRating: r })}>{r ? `${fa(r)}+ ★` : 'همه'}</button>)}</div>
        <h4>نوع مکان</h4>
        <div className="chips wrap"><button className={`chip ${!q.kind ? 'on' : ''}`} onClick={() => set({ kind: '' })}>همه</button>{Object.entries(KINDS).map(([k, v]) => <button key={k} className={`chip ${q.kind === k ? 'on' : ''}`} onClick={() => set({ kind: q.kind === k ? '' : k })}>{v.name}</button>)}</div>
        <h4>سطح قیمت</h4>
        <div className="chips">{[1, 2, 3, 4].map((t) => <button key={t} className={`chip ${q.tiers.includes(t) ? 'on' : ''}`} onClick={() => tog('tiers', t)} dir="ltr">{'$'.repeat(t)}</button>)}</div>
        <h4>امکانات</h4>
        <div className="chips wrap">{Object.entries(AMEN).map(([k, v]) => <button key={k} className={`chip ${q.amen.includes(k) ? 'on' : ''}`} onClick={() => tog('amen', k)}><Icon n={v.icon} s={14} /> {v.name}</button>)}</div>
        <label className="switch-row"><span>فقط سالن‌هایی که نوبت آزاد دارند</span><input type="checkbox" checked={q.freeOnly} onChange={(e) => set({ freeOnly: e.target.checked })} /></label>
      </div>
      <div className="sheet-foot">
        <button className="btn ghost" onClick={() => set({ minRating: 0, kind: '', tiers: [], amen: [], freeOnly: false })}>پاک کردن</button>
        <button className="btn primary" onClick={onClose}>نمایش {fa(count)} سالن</button>
      </div>
    </Sheet>
  )
}

export default function Results({ init, title, who: who0 = 'salons' }) {
  const { me } = useStore()
  const [q, setQ] = useState({ ...BLANK, ...init })
  const set = (p) => setQ((x) => ({ ...x, ...p }))
  const [view, setView] = useState('list')
  const [who, setWho] = useState(who0)
  const [filt, setFilt] = useState(false)
  const [areaOpen, setAreaOpen] = useState(false)
  const [active, setActive] = useState(null)
  const { list, artists: arts0 } = useSearch(q)
  // آرتیست‌ها: همان فیلترها + فقط ستاره‌ها یا در منزل اگر کاشی خواسته باشد
  const arts = arts0.filter((a) => (!q.star || a.badge === 'star') && (!q.amen.includes('home') || a.home) && a.rating >= q.minRating)
  const all = useSearch({ ...q, areas: [] }).list
  const stats = useAreaStats(all)
  const nFilt = (q.minRating ? 1 : 0) + q.amen.length + q.tiers.length + (q.kind ? 1 : 0) + (q.freeOnly ? 1 : 0)
  const head = title || (q.sid ? SV[q.sid].name : q.cat ? CAT[q.cat].name : 'سالن‌ها')
  const C = CITIES[me.city]

  return (
    <div className="results">
      <PageHead title={head} sub={`${C.name}${q.areas.length ? ` · ${fa(q.areas.length)} ناحیه` : ''} · ${relDay(q.date) === 'امروز' || relDay(q.date) === 'فردا' ? relDay(q.date) : dateShort(q.date)}`}
        right={who === 'salons' && <button className="icon-btn" onClick={() => setView(view === 'list' ? 'map' : 'list')} aria-label="نقشه/فهرست"><Icon n={view === 'list' ? 'map' : 'list'} /></button>} />
      <div className="who-seg">
        {[['salons', `سالن‌ها (${fa(list.length)})`], ['artists', `آرتیست‌ها (${fa(arts.length)})`]].map(([k, n]) => (
          <button key={k} className={who === k ? 'on' : ''} onClick={() => { setWho(k); setView('list') }}>{n}</button>
        ))}
      </div>
      <div className="res-bar">
        <button className={`chip ${nFilt ? 'on' : ''}`} onClick={() => setFilt(true)}><Icon n="filter" s={14} /> فیلتر{nFilt ? ` (${fa(nFilt)})` : ''}</button>
        <button className={`chip ${q.areas.length ? 'on' : ''}`} onClick={() => setAreaOpen(true)}><Icon n="pin" s={14} /> {q.areas.length ? q.areas.map((id) => C.areas.find((a) => a.id === id)?.name).join('، ') : 'ناحیه'}</button>
        {SORTS.map(([k, n]) => <button key={k} className={`chip soft ${q.sort === k ? 'on' : ''}`} onClick={() => set({ sort: k })}>{n}</button>)}
      </div>
      {who === 'artists' ? (
        <div className="scroll res-list">
          {arts.length ? <div className="artist-grid flat">{arts.map((a) => <ArtistCard key={a.id} a={a} size="lg" />)}</div> : <Empty icon="search" title="آرتیستی پیدا نشد" />}
          <div className="foot-space" />
        </div>
      ) : view === 'list' ? (
        <div className="scroll res-list">
          <p className="muted small res-count">{fa(list.length)} سالن پیدا شد</p>
          {list.length ? list.map((s) => <SalonCard key={s.id} s={s} />) : (
            <Empty icon="search" title="چیزی پیدا نشد" text="فیلترها یا ناحیه رو کمتر کنید.">
              <button className="btn ghost" onClick={() => setQ({ ...BLANK, cat: q.cat })}>حذف فیلترها</button>
            </Empty>
          )}
          <div className="foot-space" />
        </div>
      ) : (
        <div className="res-map">
          <CityMap city={me.city} salons={list} stats={stats} selected={q.areas} active={active} onSalon={setActive} pad={{ top: 30, bottom: 220 }}
            free={new Set(list.filter((s) => s.slots.length).map((s) => s.id))}
            onArea={(id) => set({ areas: q.areas.includes(id) ? q.areas.filter((x) => x !== id) : [...q.areas, id] })} />
          {active && list.find((s) => s.id === active) && <div className="map-card"><SalonCard s={list.find((s) => s.id === active)} /></div>}
        </div>
      )}
      <FilterSheet open={filt} onClose={() => setFilt(false)} q={q} set={set} count={list.length} />
      <AreaSheet open={areaOpen} onClose={() => setAreaOpen(false)} areas={q.areas} setAreas={(areas) => set({ areas })} />
    </div>
  )
}
