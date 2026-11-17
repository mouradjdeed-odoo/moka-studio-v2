import { cn } from '@/lib/utils'

type FeatureSlidesProps = {
  images: readonly string[]
  alts: readonly string[]
  active: number
  sizes?: string
  className?: string
}

export function FeatureSlides({ images, alts, active, sizes = '100vw', className }: FeatureSlidesProps) {
  return (
    <div className={cn('relative isolate overflow-hidden bg-ink', className)}>
      {images.map((src, i) => {
        const isActive = i === active
        return (
          <div
            key={src}
            aria-hidden={!isActive}
            className={cn(
              'absolute inset-0 transition-opacity duration-500 ease-out',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
          >
            <img
              src={src}
              alt={isActive ? alts[i] ?? '' : ''}
              className={cn(
                'absolute inset-0 size-full object-cover transition-transform duration-[2800ms] ease-out',
                isActive ? 'scale-105' : 'scale-100',
              )}
            />
          </div>
        )
      })}
      <div aria-hidden="true" className="motion-sheen pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.35))]"
      />
    </div>
  )
}
