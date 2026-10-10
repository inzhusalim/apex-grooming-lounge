import { z } from 'zod'

export const TIME_ZONE = 'America/Chicago'
export const ADDRESS = '214 Congress Ave, Austin, TX 78701'
export const TAX_RATE = 0.0825
export const services = [
  {
    id: 'signature',
    name: 'Signature Haircut',
    shortName: 'Signature Haircut',
    price: 45,
    duration: 30,
    image: '/images/haircut.jpg',
    description: 'A precision cut, a clean finish, and a look that’s entirely yours.',
    includes: ['Personal consultation', 'Precision cut & style', 'Hot towel finish'],
    tag: 'THE EVERYDAY ELEVATED',
  },
  {
    id: 'beard',
    name: 'Beard Sculpt & Hot Towel',
    shortName: 'Beard Sculpt',
    price: 35,
    duration: 30,
    image: '/images/beard.jpg',
    description: 'Expert shaping and a warm towel ritual. Every detail, considered.',
    includes: ['Beard shaping & detailing', 'Straight razor lineup', 'Hot towel treatment'],
    tag: 'SHARP IN EVERY DETAIL',
  },
  {
    id: 'executive',
    name: 'The Full Executive Package',
    shortName: 'Executive Package',
    price: 75,
    duration: 45,
    image: '/images/executive.jpg',
    description: 'The complete reset. A signature cut, beard sculpt, and a little extra.',
    includes: ['Signature haircut & style', 'Beard sculpt & lineup', 'Hot towel & scalp massage'],
    tag: 'THE COMPLETE EXPERIENCE',
  },
] as const
export const barbers = [
  {
    id: 'marcus',
    name: 'Marcus',
    title: 'Master Barber',
    rating: '4.9',
    reviews: 218,
    experience: '12 years behind the chair',
    specialty: 'Precision fades · Classic cuts',
    image: '/images/marcus.jpg',
  },
  {
    id: 'james',
    name: 'James',
    title: 'Senior Barber',
    rating: '4.9',
    reviews: 164,
    experience: '8 years behind the chair',
    specialty: 'Beard design · Modern styles',
    image: '/images/james.jpg',
  },
  {
    id: 'daniel',
    name: 'Daniel',
    title: 'Style Specialist',
    rating: '4.8',
    reviews: 127,
    experience: '6 years behind the chair',
    specialty: 'Textured cuts · Scissor work',
    image: '/images/daniel.jpg',
  },
] as const
export type Service = (typeof services)[number]
export type Barber = (typeof barbers)[number]
export type Payment = 'shop' | 'card'
export type SlotReservation = {
  barberId: string
  date: string
  minutes: number
  duration: number
  reference: string
}
export type Booking = {
  reference: string
  service: Service
  barber: Barber
  date: string
  minutes: number
  contact: Contact
  createdAt: string
}
export const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Please enter your full name.')
    .max(80, 'Please keep your name under 80 characters.')
    .refine((value) => value.split(/\s+/).length >= 2, 'Please include your first and last name.'),
  email: z.email('Please enter a valid email address.').max(254),
  phone: z
    .string()
    .refine(
      (value) => /^[2-9]\d{2}[2-9]\d{6}$/.test(value.replace(/\D/g, '')),
      'Enter a valid 10-digit US phone number.',
    ),
  notes: z.string().max(500, 'Please keep notes under 500 characters.'),
  payment: z.enum(['shop', 'card']),
  sms: z.boolean(),
})
export type Contact = z.infer<typeof contactSchema>

export function money(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}
export function getTotals(price: number) {
  const tax = Math.round(price * TAX_RATE * 100) / 100
  return { subtotal: price, tax, total: price + tax }
}
export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}
export function parseDate(key: string) {
  return new Date(`${key}T12:00:00Z`)
}
export function todayInAustin(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((item) => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
export function formatDate(key: string) {
  return parseDate(key).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}
export function formatWeekday(key: string) {
  return parseDate(key).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long' })
}
export function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  return `${hours % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`
}
export function formatPhone(value: string) {
  let digits = value.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1)
  digits = digits.slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}
export function isBookableDate(key: string, now = new Date()) {
  return key >= todayInAustin(now) && parseDate(key).getUTCDay() !== 0
}
export function firstBookableDate(now = new Date()) {
  let date = parseDate(todayInAustin(now))
  if (date.getUTCDay() === 0) date = new Date(date.getTime() + 86400000)
  return dateKey(date)
}
export function overlaps(a: number, aDuration: number, b: number, bDuration: number) {
  return a < b + bDuration && b < a + aDuration
}
export function getSlots(
  key: string,
  barberId: string,
  duration: number,
  reservations: SlotReservation[] = [],
  now = new Date(),
) {
  if (!isBookableDate(key, now)) return []
  const date = parseDate(key)
  const saturday = date.getUTCDay() === 6
  const opens = saturday ? 600 : 540
  const closes = saturday ? 1020 : 1140
  const day = date.getUTCDate()
  const barberIndex = barbers.findIndex((barber) => barber.id === barberId)
  const seededBusy = [opens + ((day + barberIndex) % 3) * 30, 780 + barberIndex * 30, 960]
  const timeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const currentMinutes =
    Number(timeParts.find((part) => part.type === 'hour')?.value) * 60 +
    Number(timeParts.find((part) => part.type === 'minute')?.value)
  const sameDay = key === todayInAustin(now)
  const slots: { minutes: number; available: boolean }[] = []
  for (let minutes = opens; minutes + duration <= closes; minutes += 30) {
    const busy =
      day % 13 === 0 ||
      seededBusy.some((start) => overlaps(minutes, duration, start, 30)) ||
      reservations.some(
        (item) =>
          item.date === key &&
          item.barberId === barberId &&
          overlaps(minutes, duration, item.minutes, item.duration),
      )
    slots.push({ minutes, available: !busy && (!sameDay || minutes >= currentMinutes + 30) })
    if (minutes === 840 && minutes + 15 + duration <= closes)
      slots.push({
        minutes: 855,
        available:
          !busy &&
          (!sameDay || 855 >= currentMinutes + 30) &&
          !seededBusy.some((start) => overlaps(855, duration, start, 30)) &&
          !reservations.some(
            (item) =>
              item.date === key &&
              item.barberId === barberId &&
              overlaps(855, duration, item.minutes, item.duration),
          ),
      })
  }
  return slots
}
const STORAGE_KEY = 'apex-reservations-v1'
export function readReservations(): SlotReservation[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(raw)) return []
    return raw
      .filter(
        (value): value is SlotReservation =>
          value &&
          typeof value.barberId === 'string' &&
          typeof value.date === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
          value.date >= todayInAustin() &&
          typeof value.minutes === 'number' &&
          Number.isFinite(value.minutes) &&
          typeof value.duration === 'number' &&
          value.duration > 0 &&
          typeof value.reference === 'string',
      )
      .slice(-100)
  } catch {
    return []
  }
}
export function reserveSlot(reservation: SlotReservation) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...readReservations(), reservation]))
  } catch {
    /* The in-memory confirmation still works when browser storage is unavailable. */
  }
}
export function makeReference() {
  return `APX-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().padStart(7, '0')}`
}

// Convert the shop's wall-clock appointment to UTC, including daylight saving time.
export function appointmentInstant(key: string, minutes: number) {
  const wall = new Date(
    `${key}T${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00Z`,
  )
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    timeZoneName: 'longOffset',
  }).formatToParts(wall)
  const match = parts
    .find((part) => part.type === 'timeZoneName')
    ?.value.match(/GMT([+-])(\d{2}):(\d{2})/)
  const offset = match
    ? (match[1] === '+' ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3]))
    : 0
  return new Date(wall.getTime() - offset * 60000)
}
export function calendarTimestamp(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}
export function googleCalendarUrl(booking: Booking) {
  const start = appointmentInstant(booking.date, booking.minutes)
  const end = new Date(start.getTime() + booking.service.duration * 60000)
  return `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: 'TEMPLATE', text: `${booking.service.name} at Apex Grooming Lounge`, dates: `${calendarTimestamp(start)}/${calendarTimestamp(end)}`, ctz: TIME_ZONE, location: ADDRESS, details: `Demo appointment with ${booking.barber.name}. Reference #${booking.reference}. This preview does not reserve a real appointment.` })}`
}
const escapeIcs = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
export function makeIcs(booking: Booking) {
  const start = appointmentInstant(booking.date, booking.minutes)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Apex Grooming Lounge//Booking Preview//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${booking.reference}@apexgrooming.example`,
    `DTSTAMP:${calendarTimestamp(new Date(booking.createdAt))}`,
    `DTSTART:${calendarTimestamp(start)}`,
    `DTEND:${calendarTimestamp(new Date(start.getTime() + booking.service.duration * 60000))}`,
    `SUMMARY:${escapeIcs(`${booking.service.name} at Apex Grooming Lounge`)}`,
    `LOCATION:${escapeIcs(ADDRESS)}`,
    `DESCRIPTION:${escapeIcs(`Demo appointment with ${booking.barber.name}. Reference #${booking.reference}. This preview does not reserve a real appointment.`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  // RFC 5545 folds content lines at 75 octets without splitting a UTF-8 character.
  return (
    lines
      .map((line) => {
        let result = ''
        let bytes = 0
        for (const char of line) {
          const length = new TextEncoder().encode(char).length
          if (bytes + length > 75) {
            result += '\r\n '
            bytes = 1
          }
          result += char
          bytes += length
        }
        return result
      })
      .join('\r\n') + '\r\n'
  )
}
export function downloadCalendar(booking: Booking) {
  const url = URL.createObjectURL(
    new Blob([makeIcs(booking)], { type: 'text/calendar;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `apex-${booking.reference}.ics`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
