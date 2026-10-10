import { CalendarDays, Check, Clock3, MapPin, Scissors, ShieldCheck, UserRound } from 'lucide-react'
import type { Barber, Service } from '../lib/booking'
import { formatDate, formatTime, getTotals, money } from '../lib/booking'

export default function AppointmentSummary({
  service,
  barber,
  date,
  time,
  completed,
  onEdit,
}: {
  service: Service | null
  barber: Barber | null
  date: string
  time: number | null
  completed: boolean
  onEdit: (step: number) => void
}) {
  const totals = getTotals(service?.price ?? 0)
  return (
    <aside className="summary-area" aria-label="Appointment summary">
      <div className="summary-card">
        <div className="summary-image">
          <img
            src="/images/executive.jpg"
            alt="The Apex experience: warm lights and classic leather barber chairs"
          />
          <div>
            <span className="summary-image-eyebrow">MORE THAN A HAIRCUT.</span>
            <span>A moment, well spent.</span>
          </div>
        </div>
        <div className="summary-content">
          <h2>
            Your appointment
            {completed && (
              <span className="summary-status">
                <Check size={12} /> Confirmed
              </span>
            )}
          </h2>
          <div className="summary-items">
            <div className={`summary-item ${!service ? 'pending' : ''}`}>
              <Scissors size={17} />
              <div>
                <span>Service</span>
                <strong>{service?.name ?? 'Your next great look'}</strong>
                {service && <small>{service.duration} minutes of you time</small>}
              </div>
              {service && !completed && (
                <button onClick={() => onEdit(0)} aria-label="Change service">
                  Edit
                </button>
              )}
            </div>
            <div className={`summary-item ${!barber ? 'pending' : ''}`}>
              <UserRound size={17} />
              <div>
                <span>Your barber</span>
                <strong>
                  {barber ? `${barber.name} · ${barber.title}` : 'Choose your craftsman'}
                </strong>
              </div>
              {barber && !completed && (
                <button onClick={() => onEdit(1)} aria-label="Change barber">
                  Edit
                </button>
              )}
            </div>
            <div className={`summary-item ${time === null ? 'pending' : ''}`}>
              <CalendarDays size={17} />
              <div>
                <span>Date & time</span>
                <strong>{time !== null ? formatDate(date) : 'Find your perfect moment'}</strong>
                {time !== null && <small>{formatTime(time)} · Central Time</small>}
              </div>
              {time !== null && !completed && (
                <button onClick={() => onEdit(2)} aria-label="Change date and time">
                  Edit
                </button>
              )}
            </div>
          </div>
          <div className="price-breakdown" aria-live="polite">
            <div>
              <span>Subtotal</span>
              <span>{service ? money(totals.subtotal) : '—'}</span>
            </div>
            <div>
              <span>
                Estimated tax <small>(8.25%)</small>
              </span>
              <span>{service ? money(totals.tax) : '—'}</span>
            </div>
            <div className="total-row">
              <strong>Estimated total</strong>
              <strong>{service ? money(totals.total) : '$0.00'}</strong>
            </div>
            <p>
              {service
                ? 'Gratuity is always appreciated, never expected.'
                : 'Select a service to start your appointment.'}
            </p>
          </div>
        </div>
        <div className="summary-guarantee">
          <ShieldCheck size={16} />
          <span>Your time matters. So does every detail.</span>
        </div>
      </div>
      <div className="location-card">
        <div className="location-icon">
          <MapPin size={18} />
        </div>
        <div>
          <strong>Right here in the heart of Austin.</strong>
          <p>
            214 Congress Ave
            <br />
            Austin, TX 78701
          </p>
          <span>
            <Clock3 size={12} /> Mon–Fri 9 AM–7 PM · Sat 10 AM–5 PM
          </span>
        </div>
      </div>
      <p className="summary-help">
        A change of plans? We understand.
        <br />
        Please give us at least 24 hours’ notice.
      </p>
    </aside>
  )
}
