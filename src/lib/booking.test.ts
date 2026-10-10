import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  appointmentInstant,
  barbers,
  contactSchema,
  firstBookableDate,
  formatDate,
  formatPhone,
  formatTime,
  getSlots,
  getTotals,
  googleCalendarUrl,
  isBookableDate,
  makeIcs,
  overlaps,
  services,
  todayInAustin,
} from './booking'
import type { Booking } from './booking'

const now = new Date('2026-10-10T12:00:00Z')
const booking: Booking = {
  reference: 'APX-8492',
  service: services[2],
  barber: barbers[0],
  date: '2026-10-12',
  minutes: 855,
  createdAt: now.toISOString(),
  contact: {
    fullName: 'Alex Morgan',
    email: 'alex@example.com',
    phone: '(512) 555-0124',
    notes: '',
    sms: true,
    payment: 'shop',
  },
}

test('US currency and rounded 8.25% estimates are exact for each service', () => {
  assert.deepEqual(getTotals(45), { subtotal: 45, tax: 3.71, total: 48.71 })
  assert.deepEqual(getTotals(35), { subtotal: 35, tax: 2.89, total: 37.89 })
  assert.deepEqual(getTotals(75), { subtotal: 75, tax: 6.19, total: 81.19 })
})
test('dates and times use US formatting', () => {
  assert.equal(formatDate('2026-10-12'), '10/12/2026')
  assert.equal(formatTime(855), '2:15 PM')
  assert.equal(formatTime(540), '9:00 AM')
  assert.equal(formatTime(720), '12:00 PM')
})
test('Austin local day is used across a UTC date boundary', () => {
  assert.equal(todayInAustin(new Date('2026-10-11T02:00:00Z')), '2026-10-10')
})
test('past dates and Sundays are disabled; Monday follows a closed Sunday', () => {
  assert.equal(isBookableDate('2026-10-09', now), false)
  assert.equal(isBookableDate('2026-10-11', now), false)
  assert.equal(isBookableDate('2026-10-12', now), true)
  assert.equal(firstBookableDate(new Date('2026-10-11T12:00:00Z')), '2026-10-12')
})
test('slot lengths fit within Saturday closing time and closed days have no slots', () => {
  const slots = getSlots('2026-10-10', 'marcus', 45, [], now)
  assert.ok(slots.every((slot) => slot.minutes >= 600 && slot.minutes + 45 <= 1020))
  assert.deepEqual(getSlots('2026-10-11', 'marcus', 30, [], now), [])
})
test('same-day slots include a 30-minute lead time', () => {
  const late = new Date('2026-10-10T21:45:00Z')
  assert.ok(getSlots('2026-10-10', 'marcus', 30, [], late).every((slot) => !slot.available))
})
test('overlap checks allow adjacent appointments and reject partial overlaps', () => {
  assert.equal(overlaps(540, 45, 570, 30), true)
  assert.equal(overlaps(540, 30, 570, 30), false)
})
test('reservations block overlapping slots for the same barber only', () => {
  const reserved = [
    { barberId: 'marcus', date: '2026-10-12', minutes: 840, duration: 45, reference: 'APX-8492' },
  ]
  const slots = getSlots('2026-10-12', 'marcus', 30, reserved, now)
  assert.equal(slots.find((slot) => slot.minutes === 840)?.available, false)
  assert.equal(slots.find((slot) => slot.minutes === 855)?.available, false)
  assert.equal(slots.find((slot) => slot.minutes === 870)?.available, false)
  assert.equal(
    getSlots('2026-10-12', 'james', 30, reserved, now).find((slot) => slot.minutes === 840)
      ?.available,
    true,
  )
})
test('fully booked days provide an empty-state condition', () => {
  assert.ok(getSlots('2026-10-13', 'marcus', 30, [], now).every((slot) => !slot.available))
})
test('phone mask supports typed and pasted US numbers', () => {
  assert.equal(formatPhone('5125550124'), '(512) 555-0124')
  assert.equal(formatPhone('+1 512 555 0124'), '(512) 555-0124')
  assert.equal(formatPhone('5125'), '(512) 5')
  assert.equal(formatPhone(''), '')
})
test('form rejects invalid contact data and accepts valid US data', () => {
  assert.equal(contactSchema.safeParse(booking.contact).success, true)
  assert.equal(
    contactSchema.safeParse({ ...booking.contact, fullName: 'A', email: 'bad', phone: '123' })
      .success,
    false,
  )
  assert.equal(
    contactSchema.safeParse({ ...booking.contact, notes: 'x'.repeat(501) }).success,
    false,
  )
})
test('calendar instants adjust for Austin daylight saving time', () => {
  assert.equal(appointmentInstant('2026-10-12', 855).toISOString(), '2026-10-12T19:15:00.000Z')
  assert.equal(appointmentInstant('2026-12-12', 855).toISOString(), '2026-12-12T20:15:00.000Z')
})
test('calendar links use correct start/end and exclude contact information', () => {
  const url = new URL(googleCalendarUrl(booking))
  assert.equal(url.searchParams.get('dates'), '20261012T191500Z/20261012T200000Z')
  assert.equal(url.searchParams.get('ctz'), 'America/Chicago')
  assert.ok(!url.toString().includes('alex%40'))
  assert.match(url.searchParams.get('details') ?? '', /Demo appointment/)
})
test('Apple-compatible ICS has UTC timing, escaped location and folded lines', () => {
  const ics = makeIcs(booking)
  assert.match(ics, /DTSTART:20261012T191500Z\r\n/)
  assert.match(ics, /DTEND:20261012T200000Z\r\n/)
  assert.match(ics, /LOCATION:214 Congress Ave\\, Austin\\, TX 78701/)
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'))
  assert.ok(ics.split('\r\n').every((line) => new TextEncoder().encode(line).length <= 75))
  assert.ok(!ics.includes('alex@example.com'))
})
