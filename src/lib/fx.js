import confetti from 'canvas-confetti'

// جشن ثبت نوبت با رنگ‌های برند: رز، شامپاینی، نود
export function celebrate() {
  const colors = ['#C98B8B', '#B08D57', '#E9C9C1', '#F3EADB', '#5B2A43']
  confetti({ particleCount: 90, spread: 80, origin: { y: 0.65 }, colors, scalar: 0.9, disableForReducedMotion: true, zIndex: 9999 })
  setTimeout(() => confetti({ particleCount: 40, spread: 120, origin: { y: 0.55 }, colors, shapes: ['circle'], scalar: 0.7, disableForReducedMotion: true, zIndex: 9999 }), 220)
}
