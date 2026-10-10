import { Check, CreditCard, Info, LockKeyhole, MessageSquare, Store } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactSchema, formatPhone } from '../lib/booking'
import type { Contact } from '../lib/booking'

export default function ContactForm({
  initial,
  submitting,
  error,
  onSubmit,
  onDraftChange,
}: {
  initial: Contact
  submitting: boolean
  error: string
  onSubmit: (data: Contact) => void
  onDraftChange: (data: Contact) => void
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Contact>({
    resolver: zodResolver(contactSchema),
    defaultValues: initial,
    mode: 'onTouched',
  })
  useEffect(() => {
    const subscription = watch((value) => onDraftChange(value as Contact))
    return () => subscription.unsubscribe()
  }, [watch, onDraftChange])
  const payment = watch('payment')
  const phone = register('phone')
  const notes = watch('notes')
  return (
    <form
      id="booking-contact"
      aria-busy={submitting}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="contact-form"
    >
      <div className="form-grid">
        <div className="field full-width">
          <label htmlFor="full-name">
            Full name <span>*</span>
          </label>
          <input
            id="full-name"
            autoComplete="name"
            placeholder="First and last name"
            maxLength={80}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'name-error' : undefined}
            {...register('fullName')}
          />
          {errors.fullName && (
            <p id="name-error" className="field-error" role="alert">
              {errors.fullName.message}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="email">
            Email address <span>*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            maxLength={254}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className="field-error" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="phone">
            US phone number <span>*</span>
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(555) 000-0000"
            maxLength={18}
            {...phone}
            onChange={(event) => {
              const formatted = formatPhone(event.target.value)
              event.target.value = formatted
              phone.onChange(event)
            }}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="field-error" role="alert">
              {errors.phone.message}
            </p>
          )}
        </div>
        <div className="field full-width">
          <label htmlFor="notes">
            Special notes <small>Optional</small>
          </label>
          <textarea
            id="notes"
            rows={3}
            maxLength={500}
            placeholder="A style you’re after? Anything we should know?"
            {...register('notes')}
          />
          <span className="character-count">{notes.length}/500</span>
        </div>
      </div>
      <fieldset className="payment-fieldset">
        <legend>How would you like to pay?</legend>
        <div className="payment-options">
          {[
            {
              value: 'shop' as const,
              title: 'Pay in shop',
              detail: 'Settle up after your service',
              Icon: Store,
            },
            {
              value: 'card' as const,
              title: 'Card on file',
              detail: 'Stripe payment preview',
              Icon: CreditCard,
            },
          ].map(({ value, title, detail, Icon }) => (
            <label key={value} className={`payment-option ${payment === value ? 'selected' : ''}`}>
              <input type="radio" value={value} {...register('payment')} />
              <Icon size={21} />
              <span>
                <strong>{title}</strong>
                <small>{detail}</small>
              </span>
              <span className="radio-mark">{payment === value && <Check size={11} />}</span>
            </label>
          ))}
        </div>
        {payment === 'card' && (
          <div className="mock-card">
            <div>
              <CreditCard size={18} />
              <span>
                <strong>Demo Visa</strong>
                <small>•••• •••• •••• 4242</small>
              </span>
              <span className="mock-badge">TEST MODE</span>
            </div>
            <p>
              <LockKeyhole size={12} /> A sample card is provided. No real card details or charges.
            </p>
          </div>
        )}
      </fieldset>
      <label className="sms-option">
        <input type="checkbox" {...register('sms')} />
        <span className="checkbox-visual">
          <Check size={12} />
        </span>
        <span>
          <strong>
            <MessageSquare size={14} /> Send me an SMS appointment reminder
          </strong>
          <small>Reminder preference preview. No SMS will be sent.</small>
        </span>
      </label>
      <div className="demo-notice">
        <Info size={15} />
        <p>
          This is a booking preview. No real appointment, payment, email, or text message is
          created.
        </p>
      </div>
      {error && (
        <p className="booking-error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
