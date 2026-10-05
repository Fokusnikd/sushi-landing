import { assetUrl } from '../admin-kit/schema'
import defaults from './content.json'

// Everything the client edits in /admin lives in content.json; layout and animation stay in code
export type Content = typeof defaults
export type Dish = Content['dishes'][number]

// Live binding: main.tsx swaps in the saved content before the first render
export let content: Content = defaults

export function setContent(next: Content) {
  content = next
}

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`

// Content images are site-relative ("sushi/x.webp", "uploads/…") or data: URLs from the demo admin
export const asset = (src: string) => assetUrl(src, import.meta.env.BASE_URL)
