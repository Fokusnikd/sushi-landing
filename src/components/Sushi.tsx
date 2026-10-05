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

// Generated food photographs, exported as 720px WebP with warm cream backgrounds.
export function SushiArt({ kind, className = 'size-24' }: { kind: SushiKind; className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}sushi/${kind}.webp`}
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
