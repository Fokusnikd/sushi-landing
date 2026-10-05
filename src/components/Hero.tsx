import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import type { ReactNode } from 'react'
import { content } from '../content'
import { motionTokens, pressable } from '../lib/motion'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import { SushiArt } from './Sushi'
import type { SushiKind } from './Sushi'
import { Container, buttonGhost, buttonPrimary } from './ui'

// Icons stay in code; the three facts' texts come from content
const factIcons: IconName[] = ['clock', 'bag', 'star']

export function Hero() {
  const { hero } = content
  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-10 sm:pt-32 lg:pt-36 lg:pb-16">
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-40 size-[36rem] rounded-full bg-ginger/40 blur-3xl" />
      <Container className="relative grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <motion.p
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold shadow-sm"
            initial={{ opacity: 0, y: motionTokens.distance.sm }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }}
          >
            <span className="size-2 rounded-full bg-wasabi" />
            {hero.badge}
          </motion.p>

          <motion.h1
            className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.05] sm:text-6xl lg:text-[3.5rem]"
            initial={{ opacity: 0, y: motionTokens.distance.lg }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth }}
          >
            {hero.titleStart}{' '}
            <span className="relative inline-block text-salmon-deep">
              {hero.titleAccent}
              <svg
                aria-hidden="true"
                viewBox="0 0 160 14"
                preserveAspectRatio="none"
                className="absolute -bottom-2 left-0 h-[0.3em] w-full overflow-visible"
              >
                <motion.path
                  d="M3 9 C 40 2, 100 2, 157 8"
                  fill="none"
                  stroke="#ff8a5c"
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth, delay: 0.5 }}
                />
              </svg>
            </span>{' '}
            {hero.titleEnd}
          </motion.h1>

          <motion.p
            className="mt-6 max-w-xl text-lg text-nori-soft"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: motionTokens.duration.slow, delay: 0.3 }}
          >
            {hero.text}
          </motion.p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <motion.a href="#menu" className={buttonPrimary} {...pressable}>
              {hero.primaryButton}
              <Icon name="arrowRight" className="size-5" />
            </motion.a>
            <motion.a href="#delivery" className={buttonGhost} {...pressable}>
              {hero.secondaryButton}
            </motion.a>
          </div>

          <ul className="mt-10 grid max-w-lg grid-cols-3 gap-3">
            {hero.facts.map((fact, index) => (
              <li key={index} className="rounded-2xl bg-white p-3 shadow-sm sm:p-4">
                <Icon name={factIcons[index % factIcons.length]} className="size-5 text-salmon-deep" />
                <p className="mt-2 font-display text-base font-extrabold whitespace-nowrap sm:text-lg">{fact.title}</p>
                <p className="text-sm text-nori-soft">{fact.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </Container>
    </section>
  )
}

// Satellite dishes around the main set. depth scales the pointer parallax; position is in % of the square.
const satellites: { kind: SushiKind; className: string; depth: number; delay: number }[] = [
  { kind: 'philadelphia', className: 'top-[1%] right-[3%] w-[31%]', depth: 1.4, delay: 0.3 },
  { kind: 'california', className: 'bottom-[0%] left-[4%] w-[29%]', depth: 1.1, delay: 0.42 },
  { kind: 'nigiri-salmon', className: 'top-[40%] -left-[3%] w-[22%]', depth: 0.8, delay: 0.54 },
]

// Photo composition: the board set in a large circle, smaller dishes floating around it.
function HeroVisual() {
  const reduce = useReducedMotion()
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const x = useSpring(pointerX, { stiffness: 80, damping: 18 })
  const y = useSpring(pointerY, { stiffness: 80, damping: 18 })

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none"
      onPointerMove={(event) => {
        if (reduce || event.pointerType === 'touch') return
        const box = event.currentTarget.getBoundingClientRect()
        pointerX.set((event.clientX - box.left) / box.width - 0.5)
        pointerY.set((event.clientY - box.top) / box.height - 0.5)
      }}
      onPointerLeave={() => {
        pointerX.set(0)
        pointerY.set(0)
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-[2%] rounded-full bg-[radial-gradient(ellipse_at_center,#ead5bd_0%,#f2e3d3_40%,transparent_72%)]"
      />

      <motion.div
        className="absolute inset-[13%]"
        initial={reduce ? false : { opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth, delay: 0.12 }}
      >
        <Parallax x={x} y={y} depth={0.5} className="size-full">
          <div className="size-full overflow-hidden rounded-full bg-rice-deep shadow-[0_40px_80px_-40px_rgba(31,43,36,0.55)] ring-8 ring-white">
            <img
              src={`${import.meta.env.BASE_URL}sushi/set-big.webp`}
              alt="Большой сет: роллы Филадельфия, Калифорния, запечённые роллы и нигири на деревянной доске"
              width={720}
              height={720}
              fetchPriority="high"
              decoding="async"
              draggable={false}
              className="size-full scale-[1.22] object-cover"
            />
          </div>
        </Parallax>
      </motion.div>

      {satellites.map((dish, i) => (
        <motion.div
          key={dish.kind}
          className={`absolute aspect-square ${dish.className}`}
          initial={reduce ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth, delay: dish.delay }}
        >
          <Parallax x={x} y={y} depth={dish.depth} className="size-full">
            <motion.div
              className="size-full"
              animate={reduce ? undefined : { y: [0, -motionTokens.distance.md, 0], rotate: [0, i % 2 ? -3 : 3, 0] }}
              transition={{ duration: motionTokens.loop.float + i * 0.7, ease: 'easeInOut', repeat: Infinity }}
            >
              <div className="size-full overflow-hidden rounded-full bg-rice-deep shadow-[0_24px_40px_-20px_rgba(31,43,36,0.5)] ring-4 ring-white">
                <SushiArt kind={dish.kind} className="size-full scale-[1.35] object-cover" />
              </div>
            </motion.div>
          </Parallax>
        </motion.div>
      ))}

      <FloatingBadge className="top-[8%] left-0" delay={0.35}>
        <Icon name="clock" className="size-4 text-salmon-deep" />
        {content.hero.badgeTop}
      </FloatingBadge>
      <FloatingBadge className="right-0 bottom-[10%]" delay={0.5}>
        <Icon name="star" className="size-4 text-sesame" />
        {content.hero.badgeBottom}
      </FloatingBadge>
    </div>
  )
}

function FloatingBadge({ children, className, delay }: { children: ReactNode; className: string; delay: number }) {
  return (
    <motion.span
      className={`absolute flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-bold shadow-[0_14px_30px_-14px_rgba(31,43,36,0.45)] ${className}`}
      initial={{ opacity: 0, y: motionTokens.distance.sm }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth, delay }}
    >
      {children}
    </motion.span>
  )
}

// Shifts its content against the pointer; deeper layers move more.
function Parallax({ x, y, depth, className, children }: { x: MotionValue<number>; y: MotionValue<number>; depth: number; className: string; children: ReactNode }) {
  const shiftX = useTransform(x, (v) => v * -28 * depth)
  const shiftY = useTransform(y, (v) => v * -28 * depth)
  return (
    <motion.div className={className} style={{ x: shiftX, y: shiftY }}>
      {children}
    </motion.div>
  )
}
