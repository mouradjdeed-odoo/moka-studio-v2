import { site } from '@/lib/site'

/**
 * Official MOKA logo, cut out from the brand artwork on a transparent background.
 * Made for dark surfaces (header, footer). `compact` shows emblem, wordmark and gold line
 * without the "Objektservice Berlin" lines, which would be unreadable at header size.
 */
export function Logo({ compact = false, className }: { compact?: boolean; className?: string | undefined }) {
  const src = compact ? '/brand/moka-logo-header' : '/brand/moka-logo'
  const [w, h] = compact ? [917, 439] : [917, 586]
  return (
    <picture>
      <source srcSet={`${src}.webp`} type="image/webp" />
      <img
        src={`${src}.png`}
        width={w}
        height={h}
        alt={`${site.name} Berlin`}
        className={className ?? (compact ? 'h-14 w-auto sm:h-16' : 'h-28 w-auto')}
        decoding="async"
      />
    </picture>
  )
}
