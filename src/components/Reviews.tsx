import { motion } from 'motion/react'
import { content } from '../content'
import { motionTokens, springs } from '../lib/motion'
import { Icon } from './Icon'
import { Container, Reveal, SectionHeading } from './ui'

// Cards lean a little, each its own way
const tilt = [-2, -1, 1.5]

export function Reviews() {
  const { eyebrow, title, items } = content.reviewsSection
  return (
    <section id="reviews" className="py-16 lg:py-24" aria-labelledby="reviews-title">
      <Container>
        <SectionHeading id="reviews-title" eyebrow={eyebrow} title={title} />
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((review, index) => (
            <li key={index}>
              <Reveal delay={index * motionTokens.stagger * 1.5}>
                <motion.figure
                  className="h-full rounded-3xl bg-white p-6 shadow-[0_18px_40px_-24px_rgba(31,43,36,0.35)]"
                  style={{ rotate: tilt[index % tilt.length] }}
                  whileHover={{ rotate: 0, y: -motionTokens.distance.sm }}
                  transition={springs.gentle}
                >
                  <span className="flex gap-0.5 text-sesame" role="img" aria-label="Оценка 5 из 5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Icon key={i} name="star" className="size-5" />
                    ))}
                  </span>
                  <blockquote className="mt-4 text-lg leading-relaxed">«{review.text}»</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-salmon font-display font-extrabold text-nori">
                      {review.name[0]}
                    </span>
                    <span className="font-bold">{review.name}</span>
                  </figcaption>
                </motion.figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
