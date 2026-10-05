import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react'
import { useCallback, useState } from 'react'
import { AndreyDiscount } from './components/AndreyDiscount'
import { CartDrawer } from './components/CartDrawer'
import { Conveyor } from './components/Conveyor'
import { Delivery } from './components/Delivery'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Menu } from './components/Menu'
import { Reviews } from './components/Reviews'
import { SushiArt } from './components/Sushi'
import { content } from './content'
import { cartTotals, withQty } from './lib/cart'
import type { Cart } from './lib/cart'
import { motionTokens } from './lib/motion'

type Flight = { key: number; id: string; from: { x: number; y: number }; to: { x: number; y: number } }

const center = (rect: DOMRect) => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })

export default function App() {
  const reduce = useReducedMotion()
  const [cart, setCart] = useState<Cart>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [flights, setFlights] = useState<Flight[]>([])
  const totals = cartTotals(cart)

  const setQty = (id: string, qty: number) => setCart((current) => withQty(current, id, qty))
  const addOne = (id: string) => setCart((current) => withQty(current, id, (current[id] ?? 0) + 1))

  // The dish flies from its card into the cart; it is counted when it lands
  const add = (id: string, from: DOMRect | null) => {
    const target = document.getElementById('cart-button')?.getBoundingClientRect()
    if (reduce || !from || !target) {
      addOne(id)
      return
    }
    setFlights((current) => [...current, { key: Date.now() + Math.random(), id, from: center(from), to: center(target) }])
  }

  const land = (flight: Flight) => {
    setFlights((current) => current.filter((f) => f.key !== flight.key))
    addOne(flight.id)
  }

  const closeCart = useCallback(() => setCartOpen(false), [])

  return (
    // "user" turns off transform and layout animations for people who prefer reduced motion
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[80] focus:rounded-full focus:bg-nori focus:px-5 focus:py-3 focus:font-bold focus:text-rice"
      >
        Перейти к содержанию
      </a>
      <Header cartCount={totals.count} onCartOpen={() => setCartOpen(true)} />
      <main id="main">
        <Hero />
        <Conveyor />
        <Menu cart={cart} onAdd={add} onQty={setQty} />
        <Delivery />
        <Reviews />
        <AndreyDiscount />
      </main>
      <Footer />
      <CartDrawer open={cartOpen} cart={cart} onClose={closeCart} onQty={setQty} onClear={() => setCart({})} />

      <AnimatePresence>
        {flights.map((flight) => {
          const image = content.dishes.find((item) => item.id === flight.id)?.image
          const peak = Math.min(flight.from.y, flight.to.y) - 120
          return (
            <motion.div
              key={flight.key}
              className="pointer-events-none fixed top-0 left-0 z-[70]"
              initial={{ x: flight.from.x, y: flight.from.y, scale: 1 }}
              animate={{
                x: [flight.from.x, (flight.from.x + flight.to.x) / 2, flight.to.x],
                y: [flight.from.y, peak, flight.to.y],
                scale: [1, 0.85, 0.25],
              }}
              transition={{ duration: motionTokens.duration.slow * 1.4, ease: motionTokens.easing.smooth, times: [0, 0.45, 1] }}
              onAnimationComplete={() => land(flight)}
            >
              <SushiArt src={image} className="size-28 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-xl" />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </MotionConfig>
  )
}
