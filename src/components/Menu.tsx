import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { categories, menu } from '../data'
import type { CategoryId, MenuItem } from '../data'
import type { Cart } from '../lib/cart'
import { motionTokens, springs } from '../lib/motion'
import { Icon } from './Icon'
import { SushiArt } from './Sushi'
import { Container, SectionHeading } from './ui'

const rub = new Intl.NumberFormat('ru-RU')

type Props = {
  cart: Cart
  onAdd: (id: string, from: DOMRect | null) => void
  onQty: (id: string, qty: number) => void
}

export function Menu({ cart, onAdd, onQty }: Props) {
  const [category, setCategory] = useState<CategoryId>('rolls')
  const items = menu.filter((item) => item.category === category)

  return (
    <section id="menu" className="py-16 lg:py-24" aria-labelledby="menu-title">
      <Container>
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            id="menu-title"
            eyebrow="Меню"
            title="Что сегодня заказывает Андрюша"
            intro="Режем роллы после заказа, а не утром. Поэтому рис мягкий, а нори хрустит."
          />
          <div
            className="flex max-w-full shrink-0 gap-1 self-start overflow-x-auto rounded-full bg-white p-1.5 shadow-sm [scrollbar-width:none] lg:self-end [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Категории меню"
          >
            {categories.map((c) => {
              const active = c.id === category
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(c.id)}
                  className={`relative shrink-0 rounded-full px-3 py-2 font-display text-sm font-bold whitespace-nowrap transition-colors sm:px-4 sm:text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salmon-deep ${
                    active ? 'text-rice' : 'text-nori-soft hover:text-nori'
                  }`}
                >
                  {active && (
                    <motion.span layoutId="menu-pill" className="absolute inset-0 rounded-full bg-nori" transition={springs.snappy} />
                  )}
                  <span className="relative">{c.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <motion.ul layout className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((item) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={springs.gentle}
              >
                <MenuCard item={item} qty={cart[item.id] ?? 0} onAdd={onAdd} onQty={onQty} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </Container>
    </section>
  )
}

function MenuCard({ item, qty, onAdd, onQty }: { item: MenuItem; qty: number } & Omit<Props, 'cart'>) {
  const artRef = useRef<HTMLDivElement>(null)

  return (
    <article className="flex h-full flex-col rounded-3xl bg-white p-4 shadow-[0_1px_0_rgba(31,43,36,0.06)] ring-1 ring-nori/5">
      <div className="relative grid h-48 place-items-center overflow-hidden rounded-2xl bg-rice-deep">
        {item.tag && (
          <span className="absolute top-3 left-3 rounded-full bg-nori px-2.5 py-1 text-xs font-bold text-rice">{item.tag}</span>
        )}
        <motion.div ref={artRef} whileHover={{ rotate: 8, scale: 1.06 }} transition={springs.bouncy}>
          <SushiArt kind={item.kind} className="size-56" />
        </motion.div>
      </div>
      <div className="flex flex-1 flex-col px-1 pt-4">
        <h3 className="font-display text-xl font-extrabold">{item.name}</h3>
        <p className="mt-1 text-nori-soft">{item.description}</p>
        <p className="mt-1 text-sm text-nori-soft">{item.meta}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <p className="font-display text-2xl font-extrabold">{rub.format(item.price)}&nbsp;₽</p>
          <AnimatePresence mode="wait" initial={false}>
            {qty === 0 ? (
              <motion.button
                key="add"
                type="button"
                onClick={() => onAdd(item.id, artRef.current?.getBoundingClientRect() ?? null)}
                aria-label={`Добавить «${item.name}» в корзину`}
                className="flex items-center gap-1.5 rounded-full bg-salmon-deep px-4 py-2.5 font-display font-bold text-white transition-colors hover:bg-salmon-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salmon-deep"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: motionTokens.scale.press }}
                transition={springs.snappy}
              >
                <Icon name="plus" className="size-4" />В корзину
              </motion.button>
            ) : (
              <motion.div
                key="qty"
                className="flex items-center gap-1 rounded-full bg-nori p-1 text-rice"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={springs.snappy}
              >
                <button
                  type="button"
                  onClick={() => onQty(item.id, qty - 1)}
                  aria-label={`Убрать одну порцию «${item.name}»`}
                  className="grid size-9 place-items-center rounded-full transition hover:bg-white/10"
                >
                  <Icon name="minus" className="size-4" />
                </button>
                <span className="w-6 text-center font-display font-bold tabular-nums" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => onAdd(item.id, artRef.current?.getBoundingClientRect() ?? null)}
                  aria-label={`Добавить ещё «${item.name}»`}
                  className="grid size-9 place-items-center rounded-full transition hover:bg-white/10"
                >
                  <Icon name="plus" className="size-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </article>
  )
}
