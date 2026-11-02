import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CITIES, areaShapes } from '../lib/geo'
import { fa, haptic } from '../lib/util'

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
// شهرها عریض‌اند و گوشی باریک؛ کمی بزرگ‌تر از «جا شدن کامل» تا نواحی خوانا باشند
const fitCity = (m, C) => { const b = L.latLngBounds(C.outline); m.setView(b.getCenter(), m.getBoundsZoom(b) + 0.75) }
const label = (a) => (a.id.startsWith('t') ? fa(a.id.slice(1)) : a.name)

// نقشه‌ی واقعی: نواحی رنگی (به تعداد سالن) + پین امتیاز هر سالن
export function DistrictMap({ city, salons, stats, selected = [], onArea, active, onSalon, showPins = true, single }) {
  const el = useRef(null), map = useRef(null), areaL = useRef(null), pinL = useRef(null)
  const cb = useRef({}); cb.current = { onArea, onSalon }

  useEffect(() => {
    const C = CITIES[city]
    map.current = L.map(el.current, { zoomControl: false, attributionControl: true, zoomSnap: 0.25, dragging: !single, scrollWheelZoom: !single, doubleClickZoom: !single, touchZoom: !single }).setView(C.center, C.zoom)
    L.tileLayer(TILES, { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map.current)
    const fit = () => { map.current.invalidateSize(); if (!single) fitCity(map.current, C) }
    fit(); const ft = setTimeout(fit, 350)
    // دور: پین‌ها نقطه می‌شوند تا نام نواحی خوانا بماند
    const zoomCls = () => el.current?.classList.toggle('far', map.current.getZoom() < 13)
    map.current.on('zoomend', zoomCls); zoomCls()
    areaL.current = L.layerGroup().addTo(map.current)
    pinL.current = L.layerGroup().addTo(map.current)
    return () => { clearTimeout(ft); map.current.remove() }
  }, [])

  useEffect(() => { if (!single) fitCity(map.current, CITIES[city]) }, [city])

  // نواحی
  useEffect(() => {
    areaL.current.clearLayers()
    if (single) return
    const C = CITIES[city], shapes = areaShapes(city)
    const max = Math.max(1, ...C.areas.map((a) => stats?.[a.id] || 0))
    C.areas.forEach((a) => {
      const n = stats?.[a.id] || 0, on = selected.includes(a.id)
      const poly = L.polygon(shapes[a.id], {
        color: on ? '#A8834E' : '#A9636D', weight: on ? 2.4 : 1.1, opacity: on ? 1 : 0.7,
        fillColor: on ? '#D9B98A' : '#D88E9A', fillOpacity: on ? 0.38 : 0.05 + (n / max) * 0.26,
      })
      poly.bindTooltip(`<b>${label(a)}</b>${n ? `<small>${fa(n)}</small>` : ''}`, { permanent: true, direction: 'center', className: `area-tip ${on ? 'on' : ''}` })
      poly.on('click', () => { haptic(10); cb.current.onArea?.(a.id) })
      poly.addTo(areaL.current)
    })
  }, [city, selected.join(), JSON.stringify(stats)])

  // پین‌ها
  useEffect(() => {
    pinL.current.clearLayers()
    if (!showPins) return
    salons.forEach((s) => {
      const html = single ? '<span class="pin-dot"></span>' : `<span class="pin ${active === s.id ? 'on' : ''}">★ ${fa(s.rating.toFixed(1))}</span>`
      const m = L.marker(s.at, { icon: L.divIcon({ className: 'pin-wrap', html, iconSize: null }), zIndexOffset: active === s.id ? 1000 : 0 })
      if (!single) m.on('click', () => cb.current.onSalon?.(s.id))
      m.addTo(pinL.current)
    })
    if (single && salons[0]) map.current.setView(salons[0].at, 14)
  }, [salons.map((s) => s.id).join(), active, showPins])

  useEffect(() => {
    const s = salons.find((x) => x.id === active)
    if (s && !single) map.current.panTo(s.at, { animate: true })
  }, [active])

  // وقتی ناحیه انتخاب شد، نقشه روی آن ناحیه‌ها می‌رود
  useEffect(() => {
    if (single || !selected.length) return
    const shapes = areaShapes(city)
    const pts = selected.flatMap((id) => shapes[id] || [])
    if (pts.length) map.current.fitBounds(L.latLngBounds(pts).pad(0.15), { maxZoom: 13, animate: true })
  }, [selected.join()])

  return <div className="leaflet-box" ref={el} />
}

// نقشه‌ی شماتیک نواحی: هر ناحیه یک کاشی، شمال بالا و غرب چپ
export function TileMap({ city, selected, onToggle, stats }) {
  const c = CITIES[city]
  const max = Math.max(1, ...Object.values(stats))
  return (
    <div className="tilemap" style={{ gridTemplateColumns: `repeat(${c.cols}, 1fr)` }} dir="ltr">
      <span className="compass">N</span>
      {c.areas.map((a, i) => {
        const n = stats[a.id] || 0
        const on = selected.includes(a.id)
        return (
          <motion.button key={a.id} dir="rtl" className={`tile ${on ? 'on' : ''} ${n ? '' : 'empty'}`}
            style={{ gridColumn: `${a.x + 1} / span ${a.w}`, gridRow: `${a.y + 1} / span ${a.h}`, '--heat': n / max }}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.02 } }} whileTap={{ scale: 0.94 }}
            onClick={() => { if (!n) return; haptic(10); onToggle(a.id) }}>
            <b>{a.id.startsWith('t') ? fa(a.id.slice(1)) : a.name}</b>
            <small>{n ? `${fa(n)} سالن` : 'به‌زودی'}</small>
            {a.id.startsWith('t') && <i>{a.hoods[0]}</i>}
          </motion.button>
        )
      })}
    </div>
  )
}
