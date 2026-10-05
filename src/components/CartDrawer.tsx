import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { content } from '../content'
import { cartLines, cartTotals } from '../lib/cart'
import type { Cart } from '../lib/cart'
import { motionTokens, springs } from '../lib/motion'
import { Icon } from './Icon'
import { SushiArt } from './Sushi'
import { buttonPrimary } from './ui'

const rub = new Intl.NumberFormat('ru-RU')
const clock = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

type Field = 'name' | 'phone' | 'address'
type Step = 'cart' | 'checkout' | 'done'

// Formats input as +7 (XXX) XXX-XX-XX. Separators are added together with the next digit,
// so backspace never gets stuck on a bracket or dash.
function formatPhone(raw: string) {
  let digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`
  if (!digits.startsWith('7')) digits = `7${digits}`
  const rest = digits.slice(1, 11)
  let result = '+7'
  if (rest.length > 0) result += ` (${rest.slice(0, 3)}`
  if (rest.length > 3) result += `) ${rest.slice(3, 6)}`
  if (rest.length > 6) result += `-${rest.slice(6, 8)}`
  if (rest.length > 8) result += `-${rest.slice(8, 10)}`
  return result
}

const fieldClass =
  'w-full rounded-2xl border-2 border-nori/10 bg-white px-4 py-3 outline-none transition focus:border-salmon-deep aria-[invalid=true]:border-salmon-deep'

type Props = {
  open: boolean
  cart: Cart
  onClose: () => void
  onQty: (id: string, qty: number) => void
  onClear: () => void
}

export function CartDrawer({ open, cart, onClose, onQty, onClear }: Props) {
  const id = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState<Step>('cart')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [eta, setEta] = useState('')

  const lines = cartLines(cart)
  const totals = cartTotals(cart)
  const fieldId = (field: string) => `${id}-${field}`

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  const close = () => {
    onClose()
    if (step === 'done') setStep('cart')
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found: Partial<Record<Field, string>> = {}
    if (name.trim().length < 2) found.name = 'Как к вам обращаться?'
    if (phone.replace(/\D/g, '').length !== 11) found.phone = 'Введите номер полностью'
    if (address.trim().length < 5) found.address = 'Укажите улицу и дом'
    setErrors(found)
    const firstInvalid = (Object.keys(found) as Field[])[0]
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid))?.focus()
      return
    }
    setEta(clock.format(new Date(Date.now() + 45 * 60 * 1000)))
    setStep('done')
    onClear()
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            className="absolute inset-0 bg-nori/50 backdrop-blur-sm"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.duration.normal }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={fieldId('title')}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-rice shadow-2xl outline-none"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={springs.snappy}
          >
            <div className="flex items-center justify-between border-b border-nori/10 px-5 py-4">
              <h2 id={fieldId('title')} className="font-display text-2xl font-extrabold">
                {step === 'checkout' ? 'Оформление' : 'Корзина'}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Закрыть корзину"
                className="grid size-10 place-items-center rounded-full transition hover:bg-rice-deep"
              >
                <Icon name="close" className="size-5" />
              </button>
            </div>

            {step === 'done' ? (
              <motion.div
                role="status"
                className="flex flex-1 flex-col items-center justify-center px-6 text-center"
                initial={{ opacity: 0, y: motionTokens.distance.md }}
                animate={{ opacity: 1, y: 0 }}
                transition={springs.gentle}
              >
                <motion.span
                  className="grid size-20 place-items-center rounded-full bg-wasabi text-nori"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...springs.bouncy, delay: motionTokens.duration.fast }}
                >
                  <Icon name="check" className="size-10" />
                </motion.span>
                <h3 className="mt-6 font-display text-2xl font-extrabold">Заказ принят, {name.trim()}!</h3>
                <p className="mt-3 text-nori-soft">
                  Уже катаем роллы. Курьер привезёт заказ примерно к {eta} и позвонит за 10 минут.
                </p>
                <p className="mt-2 text-sm text-nori-soft">Это демо-сайт: заказ никуда не отправлен.</p>
                <button type="button" onClick={close} className={`${buttonPrimary} mt-8`}>
                  Вернуться в меню
                </button>
              </motion.div>
            ) : lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <SushiArt kind="maki-cucumber" className="size-28 rounded-full opacity-70" />
                <p className="mt-4 font-display text-xl font-extrabold">Пока пусто</p>
                <p className="mt-1 text-nori-soft">Андрюша грустит. Добавьте что-нибудь вкусное.</p>
                <button type="button" onClick={close} className={`${buttonPrimary} mt-6`}>
                  В меню
                </button>
              </div>
            ) : step === 'cart' ? (
              <>
                <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  <AnimatePresence initial={false}>
                    {lines.map(({ item, qty }) => (
                      <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: motionTokens.distance.lg }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: motionTokens.distance.xl }}
                        transition={springs.snappy}
                        className="flex items-center gap-3 rounded-2xl bg-white p-3"
                      >
                        <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-rice-deep">
                          <SushiArt src={item.image} className="size-14" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold">{item.name}</span>
                          <span className="text-sm text-nori-soft">{rub.format(item.price * qty)}&nbsp;₽</span>
                        </span>
                        <span className="flex items-center gap-1 rounded-full bg-rice-deep p-1">
                          <button
                            type="button"
                            onClick={() => onQty(item.id, qty - 1)}
                            aria-label={`Убрать одну порцию «${item.name}»`}
                            className="grid size-8 place-items-center rounded-full transition hover:bg-white"
                          >
                            <Icon name="minus" className="size-4" />
                          </button>
                          <span className="w-5 text-center font-bold tabular-nums">{qty}</span>
                          <button
                            type="button"
                            onClick={() => onQty(item.id, qty + 1)}
                            aria-label={`Добавить ещё «${item.name}»`}
                            className="grid size-8 place-items-center rounded-full transition hover:bg-white"
                          >
                            <Icon name="plus" className="size-4" />
                          </button>
                        </span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <div className="border-t border-nori/10 px-5 py-4">
                  <p className="text-sm font-bold">
                    {totals.leftToFree > 0
                      ? `До бесплатной доставки — ${rub.format(totals.leftToFree)} ₽`
                      : 'Доставка бесплатная'}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-rice-deep">
                    <motion.div
                      className="h-full origin-left rounded-full bg-wasabi"
                      initial={false}
                      animate={{ scaleX: Math.min(1, totals.subtotal / content.delivery.freeFrom) }}
                      transition={springs.snappy}
                    />
                  </div>
                  <dl className="mt-4 grid gap-1.5">
                    <div className="flex justify-between">
                      <dt className="text-nori-soft">Роллы и суши</dt>
                      <dd className="font-bold">{rub.format(totals.subtotal)} ₽</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-nori-soft">Доставка</dt>
                      <dd className="font-bold">{totals.delivery ? `${totals.delivery} ₽` : 'бесплатно'}</dd>
                    </div>
                    <div className="flex justify-between border-t border-nori/10 pt-2 font-display text-xl font-extrabold">
                      <dt>Итого</dt>
                      <dd>{rub.format(totals.total)} ₽</dd>
                    </div>
                  </dl>
                  <button type="button" onClick={() => setStep('checkout')} className={`${buttonPrimary} mt-4 w-full`}>
                    Оформить заказ
                  </button>
                </div>
              </>
            ) : (
              <form noValidate onSubmit={onSubmit} className="flex flex-1 flex-col overflow-y-auto px-5 py-4">
                <div className="grid gap-4">
                  <Input id={fieldId('name')} label="Имя" error={errors.name}>
                    <input
                      id={fieldId('name')}
                      className={fieldClass}
                      autoComplete="given-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-invalid={Boolean(errors.name)}
                    />
                  </Input>
                  <Input id={fieldId('phone')} label="Телефон" error={errors.phone}>
                    <input
                      id={fieldId('phone')}
                      className={fieldClass}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+7 (___) ___-__-__"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      aria-invalid={Boolean(errors.phone)}
                    />
                  </Input>
                  <Input id={fieldId('address')} label="Адрес" error={errors.address}>
                    <input
                      id={fieldId('address')}
                      className={fieldClass}
                      autoComplete="street-address"
                      placeholder="Улица, дом, квартира"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      aria-invalid={Boolean(errors.address)}
                    />
                  </Input>
                </div>
                <div className="mt-auto pt-6">
                  <p className="flex justify-between font-display text-xl font-extrabold">
                    <span>К оплате</span>
                    <span>{rub.format(totals.total)} ₽</span>
                  </p>
                  <button type="submit" className={`${buttonPrimary} mt-4 w-full`}>
                    Подтвердить заказ
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="mt-3 w-full py-2 font-bold text-nori-soft hover:text-nori"
                  >
                    ← Назад в корзину
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function Input({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-bold">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-sm font-bold text-salmon-deep">{error}</p>}
    </div>
  )
}
