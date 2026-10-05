import type { SushiKind } from './components/Sushi'

// Code-side data only: texts, prices and photos the client edits live in content.json
export const navItems = [
  { label: 'Меню', href: '#menu' },
  { label: 'Доставка', href: '#delivery' },
  { label: 'Отзывы', href: '#reviews' },
  { label: 'Контакты', href: '#contacts' },
]

export const conveyor: SushiKind[] = ['philadelphia', 'nigiri-salmon', 'maki-cucumber', 'gunkan', 'california', 'baked-salmon', 'nigiri-tuna', 'andryusha', 'maki-salmon']
