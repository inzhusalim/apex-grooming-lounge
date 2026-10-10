import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Award,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Heart,
  LoaderCircle,
  MapPin,
  Menu,
  Phone,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { BarberStep, DateStep, ServiceStep } from './components/BookingSteps'
import ContactForm from './components/ContactForm'
import AppointmentSummary from './components/AppointmentSummary'
import {
  ADDRESS,
  barbers,
  downloadCalendar,
  firstBookableDate,
  formatDate,
  formatTime,
  formatWeekday,
  getSlots,
  getTotals,
  googleCalendarUrl,
  makeReference,
  money,
  readReservations,
  reserveSlot,
} from './lib/booking'
import type { Barber, Booking, Contact, Service } from './lib/booking'

const stepTitles = ['Service', 'Barber', 'Date & time', 'Your details', 'Confirmation']
const stepIcons = [Scissors, UserRound, CalendarDays, ShieldCheck, CheckCheck]
const headings = [
  'Choose your service.',
  'Meet your next barber.',
  'Make a little time for you.',
  'The finishing details.',
  'You’re on the books.',
]
const descriptions = [
  'A fresh start, a sharper look, or the full experience. Make it yours.',
  'Find your kind of craftsman. Every chair comes with exceptional care.',
  'Pick a day and an opening that fits your rhythm.',
  'Tell us a little about yourself. We’ll take care of the rest.',
  'A fresh look and a good moment are waiting for you.',
]
const initialContact: Contact = {
  fullName: '',
  email: '',
  phone: '',
  notes: '',
  payment: 'shop',
  sms: false,
}
type Modal = 'lounge' | 'team' | 'policy' | 'privacy' | null

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand ${compact ? 'compact' : ''}`}>
      <svg viewBox="0 0 40 45" aria-hidden="true">
        <path d="M20 2 39 39H28l-8-16-8 16H1Z" fill="currentColor" />
        <path d="m20 27 6 12H14Z" fill="var(--background)" />
        <path d="M9 44h22" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span>
        <strong>APEX</strong>
        <small>GROOMING LOUNGE</small>
      </span>
    </span>
  )
}

export default function App() {
  const [step, setStep] = useState(0)
  const [service, setService] = useState<Service | null>(null)
  const [barber, setBarber] = useState<Barber | null>(null)
  const [date, setDate] = useState(firstBookableDate)
  const [time, setTime] = useState<number | null>(null)
  const [contact, setContact] = useState<Contact>(initialContact)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [modal, setModal] = useState<Modal>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [reservations, setReservations] = useState(readReservations)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const previousStep = useRef(0)
  const submissionLock = useRef(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const available =
    step === 0 ? !!service : step === 1 ? !!barber : step === 2 ? time !== null : true
  useEffect(() => {
    if (previousStep.current === step) return
    previousStep.current = step
    headingRef.current?.focus({ preventScroll: true })
    document.getElementById('booking-flow')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [step])
  useEffect(() => {
    if (modal) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [modal])
  useEffect(() => {
    const handler = () => setReservations(readReservations())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])
  useEffect(() => {
    if (
      barber &&
      service &&
      time !== null &&
      !getSlots(date, barber.id, service.duration, reservations).some(
        (slot) => slot.minutes === time && slot.available,
      ) &&
      !booking
    ) {
      setTime(null)
      if (step === 3) {
        setBookingError('That opening is no longer available. Please choose another time.')
        setStep(2)
      }
    }
  }, [reservations, date, barber, service, time, step, booking])
  const selectService = (value: Service) => {
    if (service?.id !== value.id) setTime(null)
    setService(value)
    setBookingError('')
  }
  const selectBarber = (value: Barber) => {
    if (barber?.id !== value.id) setTime(null)
    setBarber(value)
    setBookingError('')
  }
  const visitStep = (target: number) => {
    if (booking) return
    if (
      target === 0 ||
      (target === 1 && service) ||
      (target === 2 && service && barber) ||
      (target === 3 && service && barber && time !== null)
    ) {
      setStep(target)
      setMenuOpen(false)
    }
  }
  const submitBooking = (data: Contact) => {
    if (submissionLock.current || !service || !barber || time === null) return
    setContact(data)
    const latest = readReservations()
    if (
      !getSlots(date, barber.id, service.duration, latest).some(
        (slot) => slot.minutes === time && slot.available,
      )
    ) {
      setTime(null)
      setStep(2)
      setBookingError('That opening is no longer available. Please choose another time.')
      setReservations(latest)
      return
    }
    submissionLock.current = true
    setSubmitting(true)
    setBookingError('')
    const reference = makeReference()
    const confirmed: Booking = {
      reference,
      service,
      barber,
      date,
      minutes: time,
      contact: data,
      createdAt: new Date().toISOString(),
    }
    const reservation = {
      barberId: barber.id,
      date,
      minutes: time,
      duration: service.duration,
      reference,
    }
    reserveSlot(reservation)
    setBooking(confirmed)
    setReservations([...latest, reservation])
    setStep(4)
    setSubmitting(false)
  }
  const startAgain = () => {
    setBooking(null)
    setService(null)
    setBarber(null)
    setTime(null)
    setDate(firstBookableDate())
    setContact(initialContact)
    setBookingError('')
    submissionLock.current = false
    setStep(0)
  }
  const copyReference = async () => {
    if (!booking) return
    try {
      await navigator.clipboard.writeText(`#${booking.reference}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }
  return (
    <>
      <a href="#booking-flow" className="skip-link">
        Skip to booking
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a
            href="#"
            className="brand-link"
            aria-label="Apex Grooming Lounge home"
            onClick={(event) => {
              event.preventDefault()
              if (!booking) visitStep(0)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <Brand />
          </a>
          <nav className={menuOpen ? 'nav open' : 'nav'} aria-label="Main navigation">
            <button
              onClick={() => {
                setModal('lounge')
                setMenuOpen(false)
              }}
            >
              The lounge
            </button>
            <button onClick={() => visitStep(0)} className={step === 0 ? 'nav-active' : ''}>
              Our services
            </button>
            <button
              onClick={() => {
                setModal('team')
                setMenuOpen(false)
              }}
            >
              Our barbers
            </button>
          </nav>
          <div className="header-right">
            <span className="header-location">
              <MapPin size={13} /> AUSTIN, TX
            </span>
            <a href="#booking-flow" className="header-book">
              Book a visit <ArrowDown size={13} />
            </a>
            <button
              className="menu-button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>
      <main className="page-shell">
        <section className="intro">
          <div className="intro-copy">
            <div className="eyebrow">
              <span /> THE APEX STANDARD · AUSTIN, TEXAS
            </div>
            <h1>
              Look sharp. <em>Feel like yourself.</em>
            </h1>
            <p>Exceptional grooming. Unhurried care. A chair with your name on it.</p>
          </div>
          <div className="social-proof">
            <div className="proof-avatars">
              {barbers.map((item) => (
                <img src={item.image} alt="" key={item.id} />
              ))}
              <span>
                <Scissors size={17} />
              </span>
            </div>
            <div>
              <div className="proof-stars" aria-label="Rated 4.9 out of 5">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} size={11} fill="currentColor" />
                ))}
                <strong>4.9</strong>
              </div>
              <p>Austin’s good looks start here.</p>
            </div>
          </div>
        </section>
        <div className="booking-layout" id="booking-flow">
          <div className="wizard">
            <nav className="stepper" aria-label="Booking progress">
              <ol>
                {stepTitles.map((title, index) => {
                  const Icon = stepIcons[index]
                  const complete = step > index
                  const reachable =
                    !booking &&
                    (index === 0 ||
                      (index === 1 && !!service) ||
                      (index === 2 && !!service && !!barber) ||
                      (index === 3 && !!service && !!barber && time !== null))
                  return (
                    <li
                      key={title}
                      className={`${index === step ? 'active' : ''} ${complete ? 'complete' : ''}`}
                    >
                      <button
                        disabled={!reachable}
                        onClick={() => visitStep(index)}
                        aria-current={index === step ? 'step' : undefined}
                        aria-label={`Step ${index + 1}: ${title}${complete ? ', completed' : ''}`}
                      >
                        <span className="step-circle">
                          {complete ? <Check size={15} /> : <Icon size={15} />}
                        </span>
                        <span className="step-label">{title}</span>
                      </button>
                      {index < 4 && <span className="step-line" />}
                    </li>
                  )
                })}
              </ol>
            </nav>
            <section key={step} className="step-content" aria-label={stepTitles[step]}>
              <div className="step-heading">
                <span className="eyebrow">
                  STEP {String(step + 1).padStart(2, '0')} <span className="step-out-of">/ 05</span>
                </span>
                <h2 ref={headingRef} tabIndex={-1}>
                  {headings[step]}
                </h2>
                <p>{descriptions[step]}</p>
              </div>
              {step === 0 && <ServiceStep selected={service} onSelect={selectService} />}
              {step === 1 && <BarberStep selected={barber} onSelect={selectBarber} />}
              {step === 2 && service && barber && (
                <DateStep
                  date={date}
                  time={time}
                  service={service}
                  barber={barber}
                  reservations={reservations}
                  onDate={(value) => {
                    setDate(value)
                    setTime(null)
                    setBookingError('')
                  }}
                  onTime={(value) => {
                    setTime(value)
                    setBookingError('')
                  }}
                />
              )}
              {step === 3 && (
                <ContactForm
                  initial={contact}
                  submitting={submitting}
                  error={bookingError}
                  onSubmit={submitBooking}
                  onDraftChange={setContact}
                />
              )}
              {step === 2 && bookingError && (
                <p className="booking-error" role="alert">
                  {bookingError}
                </p>
              )}
              {step === 4 && booking && (
                <div className="confirmation">
                  <div className="confirmation-banner">
                    <span className="confirmation-check">
                      <Check size={26} strokeWidth={1.6} />
                    </span>
                    <div>
                      <span className="eyebrow">YOUR NEXT GOOD DAY</span>
                      <h3>See you in the chair, {booking.contact.fullName.split(' ')[0]}.</h3>
                      <p>Your demo appointment is confirmed.</p>
                    </div>
                  </div>
                  <div className="confirmation-details">
                    <div>
                      <CalendarDays size={20} />
                      <span>
                        <small>{formatWeekday(booking.date)}</small>
                        <strong>
                          {formatDate(booking.date)} · {formatTime(booking.minutes)}
                        </strong>
                        <small>Central Time · {booking.service.duration} minutes</small>
                      </span>
                    </div>
                    <div>
                      <Scissors size={20} />
                      <span>
                        <small>{booking.service.name}</small>
                        <strong>With {booking.barber.name}</strong>
                        <small>{booking.barber.title}</small>
                      </span>
                    </div>
                  </div>
                  <div className="reference-row">
                    <span>
                      Booking reference <strong>#{booking.reference}</strong>
                    </span>
                    <button
                      onClick={copyReference}
                      className="icon-button"
                      aria-label="Copy booking reference"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="calendar-actions">
                    <a
                      className="primary-button"
                      href={googleCalendarUrl(booking)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <CalendarCheck2 size={17} /> Google Calendar <ExternalLink size={13} />
                    </a>
                    <button className="secondary-button" onClick={() => downloadCalendar(booking)}>
                      <CalendarDays size={17} /> Apple Calendar <ArrowDown size={14} />
                    </button>
                  </div>
                  <div className="confirmation-totals">
                    <span>
                      Subtotal <strong>{money(getTotals(booking.service.price).subtotal)}</strong>
                    </span>
                    <span>
                      Estimated Texas sales tax (8.25%){' '}
                      <strong>{money(getTotals(booking.service.price).tax)}</strong>
                    </span>
                    <span>
                      Estimated total{' '}
                      <strong>{money(getTotals(booking.service.price).total)}</strong>
                    </span>
                  </div>
                  <p className="confirmation-payment">
                    <ShieldCheck size={15} />{' '}
                    {booking.contact.payment === 'shop'
                      ? 'Pay in shop · No payment taken'
                      : 'Demo Visa ending in 4242 · No payment taken'}
                  </p>
                  <p className="confirmation-demo">
                    Preview only. No real appointment is reserved and no confirmation or reminder is
                    sent. Your calendar export is labeled as a demo.
                  </p>
                  <button className="text-link another-booking" onClick={startAgain}>
                    Book another visit <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </section>
            {step < 4 && (
              <div className="wizard-actions">
                {step === 0 ? (
                  <span className="action-hint">
                    <LockIcon /> A little self-care goes a long way.
                  </span>
                ) : (
                  <button
                    className="back-button"
                    disabled={submitting}
                    onClick={() => visitStep(step - 1)}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                )}
                <button
                  key={step}
                  className="primary-button continue-button"
                  disabled={!available || submitting}
                  type={step === 3 ? 'submit' : 'button'}
                  form={step === 3 ? 'booking-contact' : undefined}
                  onClick={
                    step < 3
                      ? (event) => {
                          event.preventDefault()
                          setStep(step + 1)
                        }
                      : undefined
                  }
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={17} className="spin" /> Confirming…
                    </>
                  ) : (
                    <>
                      {step === 3
                        ? 'Confirm appointment'
                        : step === 0
                          ? 'Choose your barber'
                          : step === 1
                            ? 'Find a time'
                            : 'Continue to your details'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
            <div className="care-strip">
              <div>
                <Award size={23} strokeWidth={1.3} />
                <span>
                  <strong>Masters of the craft</strong>
                  <small>Experience in every detail.</small>
                </span>
              </div>
              <div>
                <Sparkles size={23} strokeWidth={1.3} />
                <span>
                  <strong>Made for you</strong>
                  <small>Your style. Your signature.</small>
                </span>
              </div>
              <div>
                <Clock3 size={23} strokeWidth={1.3} />
                <span>
                  <strong>Good things take time</strong>
                  <small>Never rushed. Always considered.</small>
                </span>
              </div>
            </div>
          </div>
          <AppointmentSummary
            service={service}
            barber={barber}
            date={date}
            time={time}
            completed={step === 4}
            onEdit={visitStep}
          />
        </div>
        <section className="bottom-note">
          <span className="line" />
          <Scissors size={15} />
          <p>THE CRAFT IS IN THE DETAILS. THE DIFFERENCE IS HOW YOU FEEL.</p>
          <span className="line" />
        </section>
      </main>
      <footer className="site-footer">
        <div>
          <Brand compact />
          <span>© {new Date().getFullYear()} Apex Grooming Lounge.</span>
        </div>
        <nav aria-label="Footer navigation">
          <button onClick={() => setModal('policy')}>Cancellation policy</button>
          <button onClick={() => setModal('privacy')}>Privacy</button>
          <span className="footer-demo">BOOKING PREVIEW</span>
        </nav>
      </footer>
      <dialog
        ref={dialogRef}
        className="info-dialog"
        aria-label="Apex Grooming Lounge information"
        onCancel={() => setModal(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setModal(null)
        }}
      >
        <div className="dialog-inner">
          <button className="dialog-close" onClick={() => setModal(null)} aria-label="Close dialog">
            <X size={22} />
          </button>
          {modal === 'lounge' && (
            <>
              <img
                className="dialog-hero"
                src="/images/executive.jpg"
                alt="Warm vintage barbershop interior"
              />
              <span className="eyebrow">THE LOUNGE</span>
              <h2>Austin roots. Apex standards.</h2>
              <p>
                Make a little room in your day for yourself. Settle into a leather chair, enjoy the
                conversation, and leave feeling your best.
              </p>
              <div className="dialog-info">
                <p>
                  <MapPin size={17} /> {ADDRESS}
                </p>
                <p>
                  <Clock3 size={17} /> Monday–Friday: 9:00 AM–7:00 PM
                  <br />
                  Saturday: 10:00 AM–5:00 PM · Sunday: Closed
                </p>
                <p>
                  <Phone size={17} /> (512) 555-0124
                </p>
              </div>
              <p className="fine-print">
                Apex is a demonstration business. Address, phone, and hours are illustrative.
              </p>
            </>
          )}
          {modal === 'team' && (
            <>
              <span className="eyebrow">THE PEOPLE BEHIND THE CRAFT</span>
              <h2>Good hands. Great company.</h2>
              <p>Meet the barbers bringing the Apex standard to every appointment.</p>
              <div className="dialog-team">
                {barbers.map((item) => (
                  <div key={item.id}>
                    <img src={item.image} alt={item.name} />
                    <span>
                      <strong>{item.name}</strong>
                      <small>
                        {item.title} · {item.rating} ★
                      </small>
                      <small>{item.specialty}</small>
                    </span>
                  </div>
                ))}
              </div>
              <p className="fine-print">Barber profiles and ratings are illustrative.</p>
            </>
          )}
          {modal === 'policy' && (
            <>
              <span className="eyebrow">A LITTLE CONSIDERATION</span>
              <h2>Plans change. We get it.</h2>
              <p>
                Please cancel or reschedule at least 24 hours before your appointment so we can
                offer the chair to someone else.
              </p>
              <p>
                Arriving 5 minutes early gives you time to settle in. If you’re running more than 10
                minutes late, please give the lounge a call.
              </p>
              <p>No cancellation fees or real appointments are created by this preview.</p>
            </>
          )}
          {modal === 'privacy' && (
            <>
              <span className="eyebrow">YOUR DETAILS, CONSIDERED</span>
              <h2>Privacy in this preview.</h2>
              <p>
                Your name, email, phone, and notes stay in this page’s memory and are cleared when
                the page is reloaded. They are not sent to a server.
              </p>
              <p>
                Anonymous appointment slots and booking reference IDs are stored in your browser to
                demonstrate availability. Clear this site’s browser storage to remove them.
              </p>
              <p>
                Choosing Google Calendar opens Google with the appointment’s service, barber,
                location, and reference. Your contact details are excluded. Apple Calendar downloads
                a local .ics file.
              </p>
            </>
          )}
          {modal !== 'privacy' && modal !== 'policy' && (
            <button
              className="primary-button"
              onClick={() => {
                setModal(null)
                document.getElementById('booking-flow')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Your chair is waiting <ChevronRight size={16} />
            </button>
          )}
        </div>
      </dialog>
    </>
  )
}
function LockIcon() {
  return <Heart size={13} />
}
