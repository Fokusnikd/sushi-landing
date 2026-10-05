import { menu } from '../data'

// Item id → quantity
export type Cart = Record<string, number>

export const FREE_DELIVERY_FROM = 1500
export const DELIVERY_FEE = 199

export function cartLines(cart: Cart) {
  return menu.filter((item) => (cart[item.id] ?? 0) > 0).map((item) => ({ item, qty: cart[item.id] }))
}

export function cartTotals(cart: Cart) {
  const lines = cartLines(cart)
  const count = lines.reduce((sum, line) => sum + line.qty, 0)
  const subtotal = lines.reduce((sum, line) => sum + line.qty * line.item.price, 0)
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE
  return { count, subtotal, delivery, total: subtotal + delivery, leftToFree: Math.max(0, FREE_DELIVERY_FROM - subtotal) }
}

export function withQty(cart: Cart, id: string, qty: number): Cart {
  const next = { ...cart }
  if (qty <= 0) delete next[id]
  else next[id] = qty
  return next
}
