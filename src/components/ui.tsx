import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { motionTokens, springs } from '../lib/motion'

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full font-display font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4'

export const buttonPrimary = `${buttonBase} bg-salmon-deep px-7 py-4 text-white hover:bg-salmon-dark focus-visible:outline-salmon-deep`

export const buttonGhost = `${buttonBase} border-2 border-nori/15 px-7 py-4 text-nori hover:border-nori/40 focus-visible:outline-nori`

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  light = false,
}: {
  id: string
  eyebrow: string
  title: string
  intro?: string
  light?: boolean
}) {
  return (
    <div className="max-w-2xl">
      <p className={`font-display text-sm font-bold uppercase tracking-[0.18em] ${light ? 'text-salmon' : 'text-salmon-deep'}`}>
        {eyebrow}
      </p>
      <h2 id={id} className="mt-3 font-display text-[2rem] font-extrabold leading-tight sm:text-5xl">
        {title}
      </h2>
      {intro && <p className={`mt-4 text-lg ${light ? 'text-rice/75' : 'text-nori-soft'}`}>{intro}</p>}
    </div>
  )
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-10" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill={light ? '#fbf6ee' : '#1f2b24'} />
        <circle cx="16" cy="16" r="11.5" fill={light ? '#1f2b24' : '#fffaf2'} />
        <circle cx="16" cy="16" r="5.5" fill="#ff8a5c" />
        <circle cx="14.6" cy="14.6" r="2.4" fill="#ffc2a6" />
      </svg>
      <span className="font-display text-lg font-extrabold leading-none">
        Суши для <span className={light ? 'text-salmon' : 'text-salmon-deep'}>Андрюши</span>
      </span>
    </span>
  )
}

// Fades content up once it scrolls into view
export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: motionTokens.distance.lg }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        y: { ...springs.gentle, delay },
        opacity: { duration: motionTokens.duration.normal, delay },
      }}
    >
      {children}
    </motion.div>
  )
}
