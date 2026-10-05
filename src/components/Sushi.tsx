import { asset } from '../content'

export type SushiKind =
  | 'philadelphia'
  | 'california'
  | 'andryusha'
  | 'maki-salmon'
  | 'maki-cucumber'
  | 'baked-salmon'
  | 'baked-crab'
  | 'baked-eel'
  | 'nigiri-salmon'
  | 'nigiri-tuna'
  | 'gunkan'
  | 'set-small'
  | 'set-big'

// Food photographs, 720px WebP on a warm cream background. src (from content) wins over the built-in kind.
export function SushiArt({ kind, src, className = 'size-24' }: { kind?: SushiKind; src?: string; className?: string }) {
  return (
    <img
      src={src ? asset(src) : `${import.meta.env.BASE_URL}sushi/${kind ?? 'maki-salmon'}.webp`}
      alt=""
      width={720}
      height={720}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={className}
    />
  )
}
