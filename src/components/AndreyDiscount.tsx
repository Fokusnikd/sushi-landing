import { buttonPrimary, Container } from './ui'

export function AndreyDiscount() {
  return (
    <section className="py-8 sm:py-12" aria-labelledby="andrey-discount-title">
      <Container>
        <div className="flex flex-col gap-8 rounded-3xl bg-nori p-6 text-rice sm:p-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-salmon">Бонус за имя</p>
            <h2 id="andrey-discount-title" className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-5xl">
              Андреям скидка 5%
            </h2>
            <p className="mt-4 text-lg text-rice/80">Андрей, Андрюша или Andrew — для вас суши ещё приятнее.</p>
            <a href="#menu" className={`${buttonPrimary} mt-6`}>Выбрать суши</a>
          </div>
          <span aria-hidden="true" className="shrink-0 self-start rounded-3xl bg-salmon px-8 py-6 font-display text-7xl font-extrabold text-nori md:-rotate-6 md:self-center lg:text-8xl">
            −5%
          </span>
        </div>
      </Container>
    </section>
  )
}
