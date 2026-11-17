'use client'

import { useEffect, useState } from 'react'

export function useRotation(length: number, intervalMs: number, paused = false) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (paused || length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % length), intervalMs)
    return () => window.clearInterval(id)
  }, [length, intervalMs, paused, index])

  return [index % Math.max(length, 1), setIndex] as const
}
