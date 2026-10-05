import { motion, useReducedMotion } from 'motion/react'
import { deliveryFacts } from '../data'
import { motionTokens } from '../lib/motion'
import { Icon } from './Icon'
import { Container, Reveal, SectionHeading } from './ui'

export function Delivery() {
  return (
    <section id="delivery" className="overflow-hidden bg-nori py-16 text-rice lg:py-24" aria-labelledby="delivery-title">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <SectionHeading
            light
            id="delivery-title"
            eyebrow="Доставка"
            title="Привезём за 45 минут"
            intro="Не успели — следующий ролл за наш счёт. Это не маркетинг: мы просто не держим заказы в очереди."
          />
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {deliveryFacts.map((fact, index) => (
              <li key={fact.title}>
                <Reveal delay={index * motionTokens.stagger}>
                  <span className="grid size-10 place-items-center rounded-full bg-salmon text-nori">
                    <Icon name="check" className="size-5" />
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold">{fact.title}</h3>
                  <p className="mt-1 text-rice/70">{fact.text}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>

        <ClockRing />
      </Container>

      <Road />
    </section>
  )
}

// 45 minutes drawn as three quarters of a clock face
function ClockRing() {
  return (
    <div className="relative mx-auto grid size-64 place-items-center sm:size-72">
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx="100" cy="100" r="86" fill="none" stroke="rgba(251,246,238,0.1)" strokeWidth="16" />
        <motion.circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke="#ff8a5c"
          strokeWidth="16"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 0.75 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: motionTokens.duration.crawl * 1.4, ease: motionTokens.easing.smooth }}
        />
      </svg>
      <p className="text-center">
        <span className="block font-display text-7xl font-extrabold leading-none">45</span>
        <span className="mt-1 block font-bold text-rice/70">минут</span>
      </p>
    </div>
  )
}

const wheelSpin = { duration: motionTokens.loop.wheel, repeat: Infinity, ease: 'linear' } as const

// One of the robot's wheels; the notch on the hub makes the rotation visible
function Wheel({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 88)`}>
      <motion.g animate={{ rotate: 360 }} transition={wheelSpin}>
        <circle r="12" fill="#121815" />
        <circle r="6.5" fill="#3b4540" />
        <rect x="-1.2" y="-10.5" width="2.4" height="5" rx="1" fill="#5d6862" />
      </motion.g>
    </g>
  )
}

// Six-wheeled delivery robot riding across the bottom of the section
function Road() {
  const reduce = useReducedMotion()

  return (
    <div className="relative mt-14 h-28 border-b-2 border-dashed border-rice/20 sm:h-36" aria-hidden="true">
      <motion.div
        className="absolute inset-y-0 left-0 w-full"
        initial={{ x: reduce ? '8%' : '-15%' }}
        animate={reduce ? undefined : { x: ['-15%', '100%'] }}
        transition={{ duration: motionTokens.loop.ride, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 140 104" className="absolute bottom-0 left-0 w-36 overflow-visible sm:w-48">
          <path d="M-14 56 H-2 M-10 68 H0" stroke="#fbf6ee" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />

          <motion.g
            animate={{ y: [0, -1.5, 0] }}
            transition={{ duration: motionTokens.loop.bob, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Mast with a safety flag */}
            <line x1="96" y1="22" x2="96" y2="1" stroke="#fbf6ee" strokeWidth="2" strokeLinecap="round" />
            <motion.path
              d="M96 1 h13 v9 h-13 z"
              fill="#ff8a5c"
              style={{ originX: 0, originY: 0.5 }}
              animate={{ skewY: [0, -10, 0, 8, 0] }}
              transition={{ duration: motionTokens.loop.bob * 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Lidar and the camera head */}
            <rect x="88" y="15" width="16" height="11" rx="3" fill="#2b3530" />
            <rect x="88" y="18.5" width="16" height="3.5" fill="#5fc4e6" />
            <rect x="78" y="24" width="32" height="13" rx="5" fill="#1a201c" />
            <circle cx="103" cy="30.5" r="2.4" fill="#3a443e" />
            <circle cx="86" cy="30.5" r="1.8" fill="#3a443e" />

            {/* Cargo box: light side, dark front with a light strip */}
            <rect x="8" y="34" width="112" height="47" rx="14" fill="#fbf6ee" />
            <path d="M94 34 H106 A14 14 0 0 1 120 48 V67 A14 14 0 0 1 106 81 H94 Z" fill="#1a201c" />
            <rect x="110" y="45" width="4.5" height="24" rx="2.25" fill="#e9fbff" />
            <path d="M20 40.5 H90" stroke="#ff8a5c" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M14 47 H92" stroke="#e5d9c6" strokeWidth="1.5" />

            {/* Brand on the side */}
            <g transform="translate(26 63)">
              <circle r="9.5" fill="#1f2b24" />
              <circle r="7" fill="#fffaf2" />
              <circle r="3.4" fill="#ff8a5c" />
            </g>
            <text x="40" y="66" fontFamily="Rubik, sans-serif" fontWeight="800" fontSize="9" fill="#1f2b24">
              Андрюша
            </text>
          </motion.g>

          <Wheel x={28} />
          <Wheel x={62} />
          <Wheel x={96} />
        </svg>
      </motion.div>
    </div>
  )
}
