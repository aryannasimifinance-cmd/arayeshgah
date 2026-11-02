import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CITIES, areaCenters, areaShapes } from '../lib/geo'
import { img } from '../lib/photos'
import { fa, haptic } from '../lib/util'

// کاشی OSM با نام‌های فارسی؛ با فیلتر CSS گرم و کم‌رنگ می‌شود تا رنگ را نواحی و پین‌ها بدهند
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTR = '© OpenStreetMap'
const NEAR = 12.75 // از این بزرگ‌نمایی به بعد پین تک‌تک سالن‌ها دیده می‌شود
const WORLD = [[89, -179], [89, 179], [-89, 179], [-89, -179]]
const short = (a) => (a.id.startsWith('t') ? fa(a.id.slice(1)) : a.name)

// شهر عریض است و گوشی باریک: کمی بزرگ‌تر از «جا شدن کامل»
const cityView = (m, C, animate) => {
  const b = L.latLngBounds(C.outline)
  const z = m.getBoundsZoom(b) + (C.en === 'Tehran' ? 0.75 : 0) // کرج بلند است و بدون بزرگ‌نمایی جا می‌شود
  animate ? m.flyTo(b.getCenter(), z, { duration: 0.7 }) : m.setView(b.getCenter(), z)
}

/*
  نقشه‌ی شهر
  salons: سالن‌های قابل نمایش · stats: تعداد هر ناحیه · selected: نواحی انتخابی
  pad: فضای اشغال‌شده‌ی بالا/پایین با کنترل‌ها (برای پرواز دقیق)
*/
export const CityMap = forwardRef(function CityMap({ city, salons, stats = {}, selected = [], onArea, active, onSalon, onView, free, pad = { top: 140, bottom: 260 } }, ref) {
  const el = useRef(null)
  const m = useRef(null)
  const L_ = useRef({})
  const cb = useRef({})
  cb.current = { onArea, onSalon, onView, salons }
  const [near, setNear] = useState(false)
  const [ready, setReady] = useState(0)

  // ساخت نقشه یک بار
  useEffect(() => {
    const map = L.map(el.current, { zoomControl: false, zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 90, minZoom: 9.5, maxZoom: 18, attributionControl: true })
    L.tileLayer(TILES, { attribution: ATTR, maxZoom: 18 }).addTo(map)
    map.createPane('areas').style.zIndex = 390
    map.createPane('labels').style.zIndex = 450 // زیر پین‌ها
    L_.current = { mask: L.layerGroup().addTo(map), areas: L.layerGroup().addTo(map), labels: L.layerGroup().addTo(map), pins: L.layerGroup().addTo(map), polys: {}, marks: {} }
    m.current = map
    const zoomed = () => setNear(map.getZoom() >= NEAR)
    const moved = () => {
      const b = map.getBounds()
      cb.current.onView?.(cb.current.salons.filter((s) => b.contains(s.at)).map((s) => s.id))
    }
    map.on('zoomend', zoomed)
    map.on('moveend', moved)
    map.on('click', () => cb.current.onSalon?.(null))
    // اندازه‌ی ظرف در اولین لحظه ممکن است صفر باشد
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el.current)
    setReady(1)
    return () => { ro.disconnect(); map.remove() }
  }, [])

  // شهر: ماسک بیرون، نواحی و برچسب‌ها از نو
  useEffect(() => {
    if (!ready) return
    const map = m.current, C = CITIES[city], shapes = areaShapes(city), centers = areaCenters(city)
    const { mask, areas, labels } = L_.current
    mask.clearLayers(); areas.clearLayers(); labels.clearLayers()
    L.polygon([WORLD, C.outline], { stroke: false, fillColor: '#F6F0EB', fillOpacity: 0.66, interactive: false, pane: 'areas' }).addTo(mask)
    const polys = {}, marks = {}
    C.areas.forEach((a) => {
      const p = L.polygon(shapes[a.id], { pane: 'areas', smoothFactor: 0.5 })
      p.on('click', (e) => { L.DomEvent.stopPropagation(e); haptic(10); cb.current.onArea?.(a.id) })
      p.on('mouseover', () => p.setStyle({ fillOpacity: Math.min(0.62, (p._base?.fillOpacity || 0) + 0.12) }))
      p.on('mouseout', () => p._base && p.setStyle(p._base))
      p.addTo(areas); polys[a.id] = p
      const mk = L.marker(centers[a.id], { pane: 'labels', icon: L.divIcon({ className: 'alabel-wrap', html: '', iconSize: null }), keyboard: false })
      mk.on('click', (e) => { L.DomEvent.stopPropagation(e); haptic(10); cb.current.onArea?.(a.id) })
      mk.addTo(labels); marks[a.id] = mk
    })
    L_.current.polys = polys; L_.current.marks = marks
    cityView(map, C, false)
    setNear(map.getZoom() >= NEAR)
    setReady((r) => r + 1)
  }, [city, ready === 0])

  // رنگ و برچسب نواحی (بدون ساخت دوباره)
  const statKey = JSON.stringify(stats)
  useEffect(() => {
    if (ready < 2) return
    const C = CITIES[city], { polys, marks } = L_.current
    const max = Math.max(1, ...C.areas.map((a) => stats[a.id] || 0))
    const any = selected.length > 0
    C.areas.forEach((a) => {
      const n = stats[a.id] || 0, on = selected.includes(a.id), h = n / max
      const base = on
        ? { color: '#9C7A45', weight: 2.6, opacity: 1, fillColor: '#E3C79B', fillOpacity: 0.3, dashArray: null }
        : { color: '#B07A84', weight: 1.1, opacity: any ? 0.35 : 0.75, fillColor: '#C9808D', fillOpacity: any ? 0.03 : 0.05 + h * 0.24, dashArray: n ? null : '3 4' }
      polys[a.id]?.setStyle(base); if (polys[a.id]) polys[a.id]._base = base
      if (on) polys[a.id]?.bringToFront()
      const cls = `alabel ${on ? 'on' : ''} ${any && !on ? 'dim' : ''} ${n ? '' : 'none'}`
      marks[a.id]?.setIcon(L.divIcon({ className: 'alabel-wrap', iconSize: null, html: `<div class="${cls}" style="--h:${h}"><b>${short(a)}</b>${n ? `<i>${fa(n)}</i>` : ''}${a.hoods[0] !== a.name ? `<small>${a.hoods[0]}</small>` : ''}</div>` }))
    })
  }, [ready, statKey, selected.join()])

  // پین‌ها: نزدیک یا داخل ناحیه‌ی انتخابی
  const ids = salons.map((s) => s.id).join()
  useEffect(() => {
    if (ready < 2) return
    const { pins } = L_.current
    pins.clearLayers()
    const marks = {}
    salons.forEach((s) => {
      if (!near && !selected.includes(s.area) && s.id !== active) return
      const html = `<div class="ppin ${free?.has(s.id) ? 'free' : ''}"><span class="pp-ph"><img src="${img(s.photos[0])}" alt=""/></span><b>★ ${fa(s.rating.toFixed(1))}</b></div>`
      const mk = L.marker(s.at, { icon: L.divIcon({ className: 'ppin-wrap', html, iconSize: null }), riseOnHover: true })
      mk.on('click', (e) => { L.DomEvent.stopPropagation(e); haptic(8); cb.current.onSalon?.(s.id) })
      mk.addTo(pins); marks[s.id] = mk
    })
    L_.current.pinMarks = marks
    markActive()
  }, [ready, ids, near, selected.join(), free?.size])

  const markActive = () => {
    Object.entries(L_.current.pinMarks || {}).forEach(([id, mk]) => {
      const on = id === active
      mk.getElement()?.classList.toggle('on', on)
      mk.setZIndexOffset(on ? 2000 : 0)
    })
  }
  useEffect(() => {
    if (ready < 2) return
    markActive()
    const s = salons.find((x) => x.id === active)
    if (!s) return
    const map = m.current
    if (map.getZoom() < NEAR) map.flyTo(s.at, NEAR + 0.5, { duration: 0.6 })
    else map.panInside(s.at, { paddingTopLeft: [40, pad.top], paddingBottomRight: [40, pad.bottom] })
  }, [active])

  // پرواز نرم به نواحی انتخابی؛ با پاک شدن انتخاب برمی‌گردد
  const first = useRef(true)
  useEffect(() => {
    if (ready < 2) return
    if (first.current) { first.current = false; if (!selected.length) return }
    const map = m.current
    if (!selected.length) return cityView(map, CITIES[city], true)
    const shapes = areaShapes(city)
    const b = L.latLngBounds(selected.flatMap((id) => shapes[id] || []))
    map.flyToBounds(b, { paddingTopLeft: [24, pad.top], paddingBottomRight: [24, pad.bottom], maxZoom: 14, duration: 0.7 })
  }, [selected.join(), ready >= 2])

  useImperativeHandle(ref, () => ({
    recenter: () => cityView(m.current, CITIES[city], true),
    flyTo: (at, z = 14.5) => m.current.flyTo(at, z, { duration: 0.8 }),
  }), [city])

  return <div className={`leaflet-box citymap ${near ? 'near' : 'far'}`} ref={el} />
})

// نقشه‌ی کوچک یک سالن در صفحه‌ی اطلاعات
export function MiniMap({ at }) {
  const el = useRef(null)
  useEffect(() => {
    const map = L.map(el.current, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, boxZoom: false, keyboard: false }).setView(at, 14.5)
    L.tileLayer(TILES, { maxZoom: 18 }).addTo(map)
    L.marker(at, { icon: L.divIcon({ className: 'ppin-wrap', html: '<span class="pin-dot"></span>', iconSize: null }) }).addTo(map)
    return () => map.remove()
  }, [])
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
