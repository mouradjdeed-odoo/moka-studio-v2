'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type MotionVideoProps = {
  src: string
  className?: string
}

/**
 * Muted looping clip layered over the CSS motion frames. It stays invisible until playback
 * actually starts, so a missing file, a failed load or reduced-motion users keep the motion fallback.
 */
export function MotionVideo({ src, className }: MotionVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'loading' | 'playing' | 'failed'>('loading')

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      if (reduceMotion.matches) video.pause()
      else video.play().catch(() => {})
    }
    sync()
    reduceMotion.addEventListener('change', sync)
    return () => reduceMotion.removeEventListener('change', sync)
  }, [])

  if (status === 'failed') return null

  return (
    <video
      ref={ref}
      className={cn(
        'absolute inset-0 size-full object-cover transition-opacity duration-1000',
        status === 'playing' ? 'opacity-100' : 'opacity-0',
        className,
      )}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setStatus('playing')}
      onError={() => setStatus('failed')}
    >
      <source src={src} type="video/mp4" onError={() => setStatus('failed')} />
    </video>
  )
}
