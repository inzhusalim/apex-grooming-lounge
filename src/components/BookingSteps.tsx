import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  Moon,
  Scissors,
  Star,
  Sun,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import {
  barbers,
  dateKey,
  firstBookableDate,
  formatDate,
  formatTime,
  formatWeekday,
  getSlots,
  isBookableDate,
  parseDate,
  services,
  todayInAustin,
} from '../lib/booking'
import type { Barber, Service, SlotReservation } from '../lib/booking'

export function ServiceStep({
  selected,
  onSelect,
}: {
  selected: Service | null
  onSelect: (service: Service) => void
}) {
  return (
    <div className="selection-grid" role="group" aria-label="Choose a service">
      {services.map((service, index) => (
        <button
          type="button"
          key={service.id}
          className={`service-card selection-card ${selected?.id === service.id ? 'selected' : ''}`}
          aria-pressed={selected?.id === service.id}
          onClick={() => onSelect(service)}
        >
          <div className="service-image">
            <img
              src={service.image}
              alt={
                index === 0
                  ? 'Precision haircut and razor detailing'
                  : index === 1
                    ? 'Professional grooming tools on a walnut counter'
                    : 'Leather barber chairs in a warm, welcoming lounge'
              }
            />
            {index === 0 && (
              <span className="popular-tag">
                <Star size={10} fill="currentColor" /> MOST POPULAR
              </span>
            )}
            <span className="select-indicator">
              {selected?.id === service.id && <Check size={13} />}
            </span>
          </div>
          <div className="service-content">
            <span className="service-eyebrow">{service.tag}</span>
            <h3>{service.name}</h3>
            <p>{service.description}</p>
            <div className="service-price">
              <span>
                ${service.price}
                <small>.00</small>
              </span>
              <span className="duration-badge">
                <Clock3 size={12} /> {service.duration} min
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
export function BarberStep({
  selected,
  onSelect,
}: {
  selected: Barber | null
  onSelect: (barber: Barber) => void
}) {
  return (
    <>
      <div className="selection-grid" role="group" aria-label="Choose your barber">
        {barbers.map((barber) => (
          <button
            type="button"
            className={`barber-card selection-card ${selected?.id === barber.id ? 'selected' : ''}`}
            key={barber.id}
            aria-pressed={selected?.id === barber.id}
            onClick={() => onSelect(barber)}
          >
            <div className="barber-image">
              <img src={barber.image} alt={`${barber.name}, ${barber.title}`} />
              <span className="select-indicator">
                {selected?.id === barber.id && <Check size={13} />}
              </span>
              <span className="barber-rating">
                <Star size={12} fill="currentColor" /> {barber.rating}
                <small>({barber.reviews})</small>
              </span>
            </div>
            <div className="barber-content">
              <h3>{barber.name}</h3>
              <span className="barber-title">{barber.title}</span>
              <p>{barber.specialty}</p>
              <span className="experience">
                <Scissors size={12} /> {barber.experience}
              </span>
            </div>
          </button>
        ))}
      </div>
      <div className="step-note">
        <UserRound size={16} />
        <p>Different personalities. The same attention to detail. You’re in good hands.</p>
      </div>
    </>
  )
}
export function DateStep({
  date,
  time,
  barber,
  service,
  reservations,
  onDate,
  onTime,
}: {
  date: string
  time: number | null
  barber: Barber
  service: Service
  reservations: SlotReservation[]
  onDate: (date: string) => void
  onTime: (minutes: number) => void
}) {
  const [month, setMonth] = useState(() => {
    const initial = parseDate(date)
    return new Date(Date.UTC(initial.getUTCFullYear(), initial.getUTCMonth(), 1, 12))
  })
  const slots = getSlots(date, barber.id, service.duration, reservations)
  const first = month.getUTCDay()
  const days = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate()
  const today = parseDate(todayInAustin())
  const prevDisabled =
    month.getUTCFullYear() === today.getUTCFullYear() && month.getUTCMonth() === today.getUTCMonth()
  const nextDisabled =
    month.getTime() >= Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 6, 1, 12)
  const changeMonth = (direction: number) =>
    setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + direction, 1, 12)))
  const findNextAvailable = () => {
    let next = parseDate(date)
    for (let i = 0; i < 190; i++) {
      next = new Date(next.getTime() + 86400000)
      const key = dateKey(next)
      if (getSlots(key, barber.id, service.duration, reservations).some((slot) => slot.available)) {
        onDate(key)
        setMonth(new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth(), 1, 12)))
        break
      }
    }
  }
  const allBooked = slots.every((slot) => !slot.available)
  return (
    <div className="date-time-grid">
      <div className="calendar-panel">
        <div className="calendar-heading">
          <h3>
            {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
          </h3>
          <div className="month-controls">
            <button
              type="button"
              aria-label="Previous month"
              disabled={prevDisabled}
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              aria-label="Next month"
              disabled={nextDisabled}
              onClick={() => changeMonth(1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
        <div className="calendar-grid" role="group" aria-label="Appointment date">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <span key={index} className="weekday">
              {day}
            </span>
          ))}
          {Array.from({ length: first }, (_, index) => (
            <span key={`blank-${index}`} />
          ))}
          {Array.from({ length: days }, (_, index) => {
            const day = index + 1
            const key = dateKey(
              new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), day, 12)),
            )
            const disabled = !isBookableDate(key)
            return (
              <button
                type="button"
                key={key}
                className={`calendar-day ${key === date ? 'chosen' : ''} ${key === todayInAustin() ? 'today' : ''}`}
                disabled={disabled}
                aria-label={`${formatDate(key)}${disabled ? ', unavailable' : ''}`}
                aria-pressed={date === key}
                onClick={() => onDate(key)}
              >
                {day}
              </button>
            )
          })}
        </div>
        <div className="calendar-legend">
          <span>
            <i /> Available
          </span>
          <span className="muted">
            <i /> Unavailable
          </span>
        </div>
        <p className="calendar-footnote">
          <Coffee size={13} /> Sundays are for slowing down. We’re closed.
        </p>
        <button
          className="text-link today-link"
          onClick={() => {
            const key = firstBookableDate()
            onDate(key)
            const next = parseDate(key)
            setMonth(new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth(), 1, 12)))
          }}
        >
          Jump to today <ChevronRight size={13} />
        </button>
      </div>
      <div className="time-panel">
        <div className="time-panel-title">
          <h3>
            {formatWeekday(date)}, {formatDate(date)}
          </h3>
          <span>All times in Austin · Central Time</span>
        </div>
        {allBooked ? (
          <div className="empty-state">
            <CalendarDays size={32} />
            <h3>Good things are worth a little wait.</h3>
            <p>
              {barber.name} has no remaining openings on this date. Let’s find your next available
              day.
            </p>
            <button className="secondary-button" onClick={findNextAvailable}>
              Find next available date <ChevronRight size={15} />
            </button>
          </div>
        ) : (
          <>
            {[
              { label: 'Morning', Icon: Sun, filter: (minutes: number) => minutes < 720 },
              { label: 'Afternoon', Icon: Moon, filter: (minutes: number) => minutes >= 720 },
            ].map(({ label, Icon, filter }) => {
              const group = slots.filter((slot) => filter(slot.minutes))
              return (
                <div className="slot-group" key={label}>
                  <h4>
                    <Icon size={14} /> {label}
                  </h4>
                  {group.some((slot) => slot.available) ? (
                    <div className="time-slots">
                      {group.map((slot) => (
                        <button
                          type="button"
                          key={slot.minutes}
                          className={`time-slot ${time === slot.minutes ? 'chosen' : ''}`}
                          disabled={!slot.available}
                          aria-pressed={time === slot.minutes}
                          aria-label={`${formatTime(slot.minutes)}${slot.available ? '' : ', unavailable'}`}
                          onClick={() => onTime(slot.minutes)}
                        >
                          {formatTime(slot.minutes)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="no-slots">No {label.toLowerCase()} openings on this date.</p>
                  )}
                </div>
              )
            })}
            <p className="availability-note">
              <span className="live-dot" /> {slots.filter((slot) => slot.available).length} openings
              with {barber.name}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
