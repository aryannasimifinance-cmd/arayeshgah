import { useEffect } from 'react'
import { useStore } from './store'
import { Toasts } from './components/ui'
import { Logo } from './components/Logo'
import Gate from './screens/Gate'
import Shell from './screens/Shell'

// لینک دمو: ‎#demo یا ‎#demo=map (تب دلخواه) با حساب نمونه وارد می‌شود
const [hashRole, hashTab] = location.hash.slice(1).split('=')
export const startTab = hashRole === 'demo' && hashTab ? hashTab : 'home'

export default function App() {
  const { me, login } = useStore()
  useEffect(() => {
    if (hashRole === 'demo' && !me) login({ name: 'نگار کاظمی', phone: '09120000000', city: 'tehran', area: 't2', hue: 345 })
  }, [])
  return (
    <div className="stage">
      {/* روی دسکتاپ: قاب گوشی با نوشته‌ی برند کنارش */}
      <aside className="stage-side">
        <Logo size={26} />
        <em className="en">Beauty, beautifully booked.</em>
        <p>رزرو سالن‌های زیبایی، اسپا و آرتیست‌ها در تهران و کرج.</p>
      </aside>
      <div className="phone">
        {me ? <Shell /> : <Gate />}
        <div id="portal" />
        <Toasts />
      </div>
    </div>
  )
}
