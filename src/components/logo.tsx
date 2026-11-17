import { useId } from 'react'

/** MOKA mark: gold building rooflines with a key line, silver wordmark. */
export function LogoMark({ className }: { className?: string | undefined }) {
  const id = useId()
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--gold)" />
          <stop offset="0.55" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--bronze)" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${id}-gold)`} strokeWidth="2.4" strokeLinejoin="miter" strokeLinecap="square">
        {/* tower with antenna */}
        <path d="M26 2v6M20 40V14l6-6 7 4v28" />
        {/* house roofline */}
        <path d="M9 40V24l11-9 11 9v16" />
        {/* side building */}
        <path d="M33 18l8 4v18M37 26v14" />
        {/* door and windows */}
        <path d="M17 40v-8h6v8" />
        <path d="M18.5 22.5h3v3h-3z" strokeWidth="1.6" />
        {/* chimney */}
        <path d="M5 40V28h4" />
        {/* key line */}
        <path d="M2 45h44" strokeWidth="2" />
      </g>
    </svg>
  )
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="size-10 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="font-heading text-xl font-bold tracking-wide text-silver-gradient">MOKA</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Objektservice</span>
        <span className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.45em] text-gold/70">Berlin</span>
      </span>
    </span>
  )
}
