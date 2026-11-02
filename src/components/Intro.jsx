import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// لوگو استینگ شروع: طاق آینه کشیده می‌شود، درخشش می‌چرخد و نام بیوتی‌ست بالا می‌آید؛ با لمس رد می‌شود
const draw = (delay, dur = 0.9) => ({ initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { pathLength: { delay, duration: dur, ease: [0.65, 0, 0.35, 1] }, opacity: { delay, duration: 0.01 } } })

export default function Intro() {
  const [on, setOn] = useState(true)
  useEffect(() => { const t = setTimeout(() => setOn(false), 2700); return () => clearTimeout(t) }, [])
  return (
    <AnimatePresence>
      {on && (
        <motion.div className="intro" onClick={() => setOn(false)} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.5, ease: 'easeInOut' }}>
          <motion.i className="intro-glow" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.9, duration: 1.2, ease: 'easeOut' }} />
          <svg className="intro-mark" viewBox="0 0 40 40" aria-hidden>
            <motion.path d="M9 36V17a11 11 0 0 1 22 0v19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...draw(0.15)} />
            <motion.path d="M13 36V17.5a7 7 0 0 1 14 0V36" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="1" {...draw(0.45)} />
            <motion.path d="M6 36h28" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...draw(0.05, 0.5)} />
            <motion.path d="M20 14c.5 3.6 1.7 4.8 5.3 5.3-3.6.5-4.8 1.7-5.3 5.3-.5-3.6-1.7-4.8-5.3-5.3 3.6-.5 4.8-1.7 5.3-5.3Z" className="intro-spark"
              style={{ originX: '20px', originY: '19.3px' }} initial={{ scale: 0, rotate: -90 }} animate={{ scale: [0, 1.5, 1], rotate: 0 }} transition={{ delay: 1, duration: 0.7, ease: 'backOut' }} />
          </svg>
          <motion.b initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 1.25, duration: 0.6 }}>بیوتی‌ست</motion.b>
          <motion.em initial={{ opacity: 0, letterSpacing: '0.1em' }} animate={{ opacity: 1, letterSpacing: '0.5em' }} transition={{ delay: 1.55, duration: 0.9, ease: 'easeOut' }}>BEAUTYSET</motion.em>
          <motion.span className="intro-bar" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2, duration: 2.3, ease: 'easeInOut' }} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
