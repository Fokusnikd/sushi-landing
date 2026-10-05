import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { content, telHref } from '../content'
import { navItems } from '../data'
import { motionTokens, springs } from '../lib/motion'
import { Icon } from './Icon'
import { Container, Logo, buttonPrimary } from './ui'

export function Header({ cartCount, onCartOpen }: { cartCount: number; onCartOpen: () => void }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const close = () => setOpen(false)

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors ${
        scrolled || open ? 'bg-rice/90 shadow-[0_1px_0_rgba(31,43,36,0.08)] backdrop-blur-md' : ''
      }`}
    >
      <Container className="flex h-18 items-center justify-between gap-4">
        <a href="#top" aria-label="Суши для Андрюши — на главную" onClick={close}>
          <Logo />
        </a>

        <nav aria-label="Основная навигация" className="hidden lg:block">
          <ul className="flex items-center gap-8 font-bold">
            {navItems.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="text-nori-soft transition hover:text-nori">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <a href={telHref(content.shop.phone)} className="hidden items-center gap-2 font-bold md:flex">
            <Icon name="phone" className="size-5 text-salmon-deep" />
            {content.shop.phone}
          </a>
          <motion.button
            id="cart-button"
            type="button"
            onClick={onCartOpen}
            whileTap={{ scale: motionTokens.scale.press }}
            className="relative flex items-center gap-2 rounded-full bg-nori px-4 py-2.5 font-display font-bold text-rice focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nori"
            aria-label={`Корзина: ${cartCount} шт.`}
          >
            <Icon name="bag" className="size-5" />
            <span className="max-sm:hidden">Корзина</span>
            {cartCount > 0 && (
              // Re-keyed on every change so the badge pops each time a dish lands
              <motion.span
                key={cartCount}
                className="grid min-w-6 place-items-center rounded-full bg-salmon px-1.5 text-sm text-nori"
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={springs.bouncy}
              >
                {cartCount}
              </motion.span>
            )}
          </motion.button>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border-2 border-nori/15 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? 'close' : 'menu'} className="size-5" />
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Мобильная навигация"
            className="border-t border-nori/10 lg:hidden"
            initial={{ opacity: 0, y: -motionTokens.distance.sm }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -motionTokens.distance.sm }}
            transition={{ duration: motionTokens.duration.fast, ease: motionTokens.easing.smooth }}
          >
            <Container className="py-4">
              <ul className="grid gap-1">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={close}
                      className="block rounded-2xl px-3 py-3 font-display text-lg font-bold transition hover:bg-rice-deep"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid gap-3 border-t border-nori/10 pt-4">
                <a href="#menu" onClick={close} className={buttonPrimary}>
                  Выбрать роллы
                </a>
                <a href={telHref(content.shop.phone)} className="py-2 text-center font-bold">
                  {content.shop.phone}
                </a>
              </div>
            </Container>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
