// نشان بیوتی‌ست: طاق آینه با یک درخشش — آینه‌ی سالن و لحظه‌ی دیده‌شدن
export function Mark({ size = 34, color = 'currentColor', accent = 'var(--gold)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <path d="M9 36V17a11 11 0 0 1 22 0v19" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13 36V17.5a7 7 0 0 1 14 0V36" fill="none" stroke={color} strokeOpacity=".35" strokeWidth="1" />
      <path d="M20 14c.5 3.6 1.7 4.8 5.3 5.3-3.6.5-4.8 1.7-5.3 5.3-.5-3.6-1.7-4.8-5.3-5.3 3.6-.5 4.8-1.7 5.3-5.3Z" fill={accent} />
      <path d="M6 36h28" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ size = 22, en = true, mark = true, light }) {
  return (
    <span className={`logo ${light ? 'light' : ''}`} style={{ fontSize: size }}>
      {mark && <Mark size={size * 1.55} />}
      <span className="logo-txt">
        <b>بیوتی‌ست</b>
        {en && <i>BEAUTYSET</i>}
      </span>
    </span>
  )
}
