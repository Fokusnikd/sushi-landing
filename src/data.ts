import type { SushiKind } from './components/Sushi'

// Fictional restaurant: every name, price and review on this page is demo content.
export const shop = {
  name: 'Суши для Андрюши',
  phone: '+7 (495) 000-00-00',
  phoneHref: 'tel:+74950000000',
  zone: 'Доставляем по Москве в пределах МКАД',
  hours: 'Ежедневно с 11:00 до 23:00',
}

export const navItems = [
  { label: 'Меню', href: '#menu' },
  { label: 'Доставка', href: '#delivery' },
  { label: 'Отзывы', href: '#reviews' },
  { label: 'Контакты', href: '#contacts' },
]

export type CategoryId = 'rolls' | 'baked' | 'sushi' | 'sets'

export const categories: { id: CategoryId; label: string }[] = [
  { id: 'rolls', label: 'Роллы' },
  { id: 'baked', label: 'Запечённые' },
  { id: 'sushi', label: 'Суши' },
  { id: 'sets', label: 'Сеты' },
]

export type MenuItem = {
  id: string
  category: CategoryId
  kind: SushiKind
  name: string
  description: string
  meta: string
  price: number
  tag?: string
}

export const menu: MenuItem[] = [
  { id: 'philadelphia', category: 'rolls', kind: 'philadelphia', name: 'Филадельфия', description: 'Лосось, сливочный сыр, огурец', meta: '8 шт · 260 г', price: 590, tag: 'Хит' },
  { id: 'andryusha', category: 'rolls', kind: 'andryusha', name: 'Ролл «Андрюша»', description: 'Угорь, лосось, сливочный сыр, соус унаги', meta: '8 шт · 280 г', price: 690, tag: 'Фирменный' },
  { id: 'california', category: 'rolls', kind: 'california', name: 'Калифорния', description: 'Краб, авокадо, икра тобико', meta: '8 шт · 240 г', price: 520 },
  { id: 'maki-salmon', category: 'rolls', kind: 'maki-salmon', name: 'Маки с лососем', description: 'Лосось, рис, нори', meta: '6 шт · 140 г', price: 290 },
  { id: 'maki-cucumber', category: 'rolls', kind: 'maki-cucumber', name: 'Маки с огурцом', description: 'Огурец, кунжут, рис, нори', meta: '6 шт · 120 г', price: 190, tag: 'Без рыбы' },
  { id: 'baked-salmon', category: 'baked', kind: 'baked-salmon', name: 'Запечённый с лососем', description: 'Лосось, сыр, сырный соус', meta: '8 шт · 270 г', price: 520, tag: 'Хит' },
  { id: 'baked-crab', category: 'baked', kind: 'baked-crab', name: 'Запечённый с крабом', description: 'Краб, огурец, спайси-соус', meta: '8 шт · 260 г', price: 480, tag: 'Острый' },
  { id: 'baked-eel', category: 'baked', kind: 'baked-eel', name: 'Запечённый с угрём', description: 'Угорь, сливочный сыр, унаги', meta: '8 шт · 270 г', price: 560 },
  { id: 'nigiri-salmon', category: 'sushi', kind: 'nigiri-salmon', name: 'Нигири с лососем', description: 'Охлаждённый лосось на рисе', meta: '2 шт · 70 г', price: 220 },
  { id: 'nigiri-tuna', category: 'sushi', kind: 'nigiri-tuna', name: 'Нигири с тунцом', description: 'Тунец на рисе', meta: '2 шт · 70 г', price: 260 },
  { id: 'gunkan', category: 'sushi', kind: 'gunkan', name: 'Гункан с икрой', description: 'Икра лосося в нори', meta: '2 шт · 80 г', price: 280 },
  { id: 'set-andryusha', category: 'sets', kind: 'set-small', name: 'Сет «Для Андрюши»', description: 'Филадельфия, Калифорния, маки с лососем', meta: '22 шт · 640 г', price: 1290, tag: 'Выгодно' },
  { id: 'set-party', category: 'sets', kind: 'set-big', name: 'Сет «Большая компания»', description: '5 роллов и 6 нигири на всю компанию', meta: '48 шт · 1 500 г', price: 3290 },
]

export const conveyor: SushiKind[] = ['philadelphia', 'nigiri-salmon', 'maki-cucumber', 'gunkan', 'california', 'baked-salmon', 'nigiri-tuna', 'andryusha', 'maki-salmon']

export const deliveryFacts = [
  { title: 'Бесплатно от 1 500 ₽', text: 'Если меньше — доставка 199 ₽.' },
  { title: 'Курьер позвонит заранее', text: 'За 10 минут до приезда, чтобы вы успели накрыть на стол.' },
  { title: 'Картой или наличными', text: 'Курьер привезёт терминал, сдачу тоже найдём.' },
  { title: 'Палочки и имбирь в подарок', text: 'Соевый соус, имбирь и васаби — к каждому заказу.' },
]

export const reviews = [
  {
    name: 'Андрюша, 7 лет',
    text: 'Папа заказал себе «Филадельфию», а съел её я. Теперь это мои суши.',
    rotate: -2,
  },
  {
    name: 'Андрей, разработчик',
    text: 'Суши не люблю, но заказал ради эксперимента. Гипотеза: вдруг понравятся? Итог: сет съеден, нужны повторные тесты.',
    rotate: -1,
  },
  {
    name: 'Andrew',
    text: 'Came for the name, stayed for the salmon. Fresh rolls, quick delivery — my Friday night plans are sorted.',
    rotate: 1.5,
  },
]
