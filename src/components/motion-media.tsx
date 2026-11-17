import { MotionVideo } from '@/components/motion-video'
import { cn } from '@/lib/utils'

type Variant = 'a' | 'b' | 'c'

type MotionMediaProps = {
  /** One or two scene frames; two frames crossfade like a looping video clip. */
  frames: readonly string[]
  alt: string
  /** Optional muted looping clip (e.g. /videos/clean.mp4); the first frame stays as poster and fallback. */
  video?: string
  variant?: Variant
  priority?: boolean
  sizes?: string
  className?: string
}

const nextVariant: Record<Variant, Variant> = { a: 'b', b: 'c', c: 'a' }

export function MotionMedia({
  frames,
  alt,
  video,
  variant = 'a',
  priority,
  sizes = '100vw',
  className,
}: MotionMediaProps) {
  const scenes = frames.slice(0, 2)
  const looping = scenes.length > 1

  return (
    <div className={cn('relative isolate overflow-hidden bg-ink', className)}>
      {scenes.map((src, i) => (
        <div
          key={src}
          className={cn('absolute inset-0', looping && (i === 0 ? 'motion-scene-1' : 'motion-scene-2'))}
        >
          <img
            src={src}
            alt={i === 0 ? alt : ''}
            className={cn('absolute inset-0 size-full object-cover will-change-transform', `motion-drift-${i === 0 ? variant : nextVariant[variant]}`)}
          />
        </div>
      ))}
      {video && <MotionVideo src={video} />}
      <div aria-hidden="true" className="motion-light pointer-events-none absolute -inset-1/4" />
      <div aria-hidden="true" className="motion-sheen pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="motion-grain pointer-events-none absolute -inset-1/2" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.35))]"
      />
    </div>
  )
}
