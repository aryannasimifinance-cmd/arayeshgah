import { useEffect, useState } from 'react'

// دو ظاهر: clay (جدید، خلوت و کرم) و classic (نسخه‌ی قبلی). انتخاب در مرورگر می‌ماند
const KEY = 'beautyset:theme'
const read = () => { try { return localStorage.getItem(KEY) || 'clay' } catch { return 'clay' } }
export const applyTheme = (t = read()) => { document.documentElement.dataset.theme = t; try { localStorage.setItem(KEY, t) } catch { /* حالت خصوصی */ } }

export function useTheme() {
  const [t, setT] = useState(read)
  useEffect(() => { applyTheme(t); window.dispatchEvent(new Event('bs-theme')) }, [t])
  useEffect(() => { const f = () => setT(read()); window.addEventListener('bs-theme', f); return () => window.removeEventListener('bs-theme', f) }, [])
  return [t, setT]
}

export function ThemeToggle({ className = '' }) {
  const [t, setT] = useTheme()
  return (
    <button className={`theme-toggle ${className}`} onClick={() => setT(t === 'clay' ? 'classic' : 'clay')}>
      ظاهر: <b>{t === 'clay' ? 'جدید' : 'کلاسیک'}</b> <span>⇄</span>
    </button>
  )
}
