import { content, telHref } from '../content'
import { navItems } from '../data'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import { Container, Logo, Reveal } from './ui'

export function Footer() {
  const { shop } = content
  const contacts: { icon: IconName; label: string; value: string; href?: string }[] = [
    { icon: 'phone', label: 'Телефон', value: shop.phone, href: telHref(shop.phone) },
    { icon: 'clock', label: 'Часы работы', value: shop.hours },
    { icon: 'mapPin', label: 'Зона доставки', value: shop.zone },
  ]

  return (
    <>
      <section id="contacts" className="pb-16 lg:pb-24" aria-labelledby="contacts-title">
        <Container>
          <Reveal className="rounded-[2rem] bg-salmon p-6 sm:p-10">
            <h2 id="contacts-title" className="font-display text-3xl font-extrabold sm:text-4xl">
              {shop.contactsTitle}
            </h2>
            <ul className="mt-8 grid gap-5 sm:grid-cols-3">
              {contacts.map((item) => (
                <li key={item.label} className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-nori text-rice">
                    <Icon name={item.icon} className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold opacity-75">{item.label}</span>
                    {item.href ? (
                      <a href={item.href} className="font-display text-lg font-bold underline-offset-4 hover:underline">
                        {item.value}
                      </a>
                    ) : (
                      <span className="font-bold">{item.value}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      <footer className="bg-nori py-10 text-rice">
        <Container className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
          <Logo light />
          <nav aria-label="Навигация в подвале" className="md:justify-self-end">
            <ul className="flex flex-wrap gap-x-6 gap-y-3 font-bold text-rice/75">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="hover:text-rice">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-sm text-rice/60 md:col-span-2">
            © 2026 «{shop.name}». Демо-проект для портфолио: ресторан вымышленный, цены и отзывы придуманы, заказы никуда не
            отправляются.{' '}
            <a href={`${import.meta.env.BASE_URL}admin/`} className="font-bold text-rice underline underline-offset-4">
              Попробуйте админку: поменяйте цены и тексты сами
            </a>
          </p>
        </Container>
      </footer>
    </>
  )
}
