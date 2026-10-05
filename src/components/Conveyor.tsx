import type { CSSProperties } from 'react'
import { conveyor } from '../data'
import { SushiArt } from './Sushi'

// Kaiten-style belt: colour-coded plates ride past endlessly
const rims = ['#4f86c6', '#e05a47', '#e9c46a', '#5f7f45', '#a678c9']

export function Conveyor() {
  const plates = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-6 pr-6" aria-hidden={hidden || undefined}>
      {conveyor.map((kind, index) => (
        <li
          key={kind}
          className="grid size-28 shrink-0 place-items-center rounded-full bg-rice-deep ring-[6px] ring-inset"
          style={{ '--tw-ring-color': rims[index % rims.length] } as CSSProperties}
        >
          <SushiArt kind={kind} className="size-24 rounded-full" />
        </li>
      ))}
    </ul>
  )

  return (
    <div className="relative overflow-hidden bg-nori py-5" role="presentation">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-2 bg-[#2c3a32]" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_46px,rgba(255,255,255,0.05)_46px_48px)]"
      />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2 bg-[#2c3a32]" />
      <div className="relative flex w-max motion-safe:animate-conveyor">
        {plates(false)}
        {plates(true)}
      </div>
    </div>
  )
}
