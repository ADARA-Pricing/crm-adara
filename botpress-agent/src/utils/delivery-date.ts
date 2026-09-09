const weekdays: Record<string, number> = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 }

const argentinaParts = (now: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  return { year: Number(parts.find(p => p.type === 'year')?.value), month: Number(parts.find(p => p.type === 'month')?.value), day: Number(parts.find(p => p.type === 'day')?.value) }
}

const isoAtArgentinaNoon = (year: number, month: number, day: number) => new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00-03:00`).toISOString()

export function requestedDeliveryDate(text: string, now = new Date()): string | undefined {
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const today = argentinaParts(now)
  const calendar = new Date(Date.UTC(today.year, today.month - 1, today.day))
  const numeric = normalized.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/)
  if (numeric) {
    const day = Number(numeric[1]); const month = Number(numeric[2]); const rawYear = numeric[3]
    const year = rawYear ? (rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear)) : today.year
    const candidate = new Date(Date.UTC(year, month - 1, day))
    if (candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day) return isoAtArgentinaNoon(year, month, day)
  }
  if (/\bmanana\b/.test(normalized)) calendar.setUTCDate(calendar.getUTCDate() + 1)
  else if (!/\bhoy\b/.test(normalized)) {
    const weekday = Object.entries(weekdays).find(([name]) => new RegExp(`\\b${name}\\b`).test(normalized))?.[1]
    if (weekday === undefined) return undefined
    const distance = (weekday - calendar.getUTCDay() + 7) % 7
    calendar.setUTCDate(calendar.getUTCDate() + (distance || 7))
  }
  return isoAtArgentinaNoon(calendar.getUTCFullYear(), calendar.getUTCMonth() + 1, calendar.getUTCDate())
}
