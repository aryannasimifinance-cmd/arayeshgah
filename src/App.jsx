import { lazy, Suspense, useEffect } from 'react'
import { useStore } from './store'
import { Toasts } from './components/ui'
import { Logo } from './components/Logo'
import Gate from './screens/Gate'
import Shell from './screens/Shell'

// پنل‌ها جدا بارگذاری می‌شوند تا اپ مشتری سبک بماند
const ArtistApp = lazy(() => import('./screens/pro/ArtistApp'))
const Manager = lazy(() => import('./screens/pro/Manager'))

// لینک دمو: ‎#demo ‎#demo=map ‎#demo=salon.s3 (مشتری) · ‎#artist · ‎#manager
const [hashRole, hashTab] = location.hash.slice(1).split('=')
export const startTab = hashRole === 'demo' && hashTab ? hashTab : 'search'

export default function App() {
  const { db, me, session, login, loginPro } = useStore()
  useEffect(() => {
    if (hashRole === 'demo' && session?.role !== 'customer') login(me || { name: 'نگار کاظمی', phone: '09120000000', city: 'tehran', area: 't2', hue: 345 })
    if (hashRole === 'artist') loginPro('artist', hashTab || db.artists.find((a) => a.badge === 'star' && a.salon)?.id)
    if (hashRole === 'manager') loginPro('manager', hashTab || db.salons.find((s) => s.kind === 'salon' && s.city === 'tehran')?.id)
  }, [])
  const role = session?.role
  const loading = <div className="loading"><span className="spinner" /></div>

  if (role === 'manager') return <Suspense fallback={loading}><Manager id={session.id} /><div id="portal" className="portal-desk" /><Toasts /></Suspense>
  return (
    <div className="stage">
      <aside className="stage-side">
        <Logo size={26} />
        <em className="en">Beauty, beautifully booked.</em>
        <p>رزرو سالن‌های زیبایی، اسپا و آرتیست‌ها در تهران و کرج.</p>
      </aside>
      <div className="phone">
        {role === 'customer' && me ? <Shell /> : role === 'artist' ? <Suspense fallback={loading}><ArtistApp id={session.id} /></Suspense> : <Gate />}
        <div id="portal" />
        <Toasts />
      </div>
    </div>
  )
}
