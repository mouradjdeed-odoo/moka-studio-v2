import { Scale } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Disclaimer({ text, className }: { text: string; className?: string | undefined }) {
  return (
    <p
      role="note"
      className={cn('flex gap-3 rounded-md border border-accent/30 bg-accent/5 p-4 text-xs leading-relaxed text-muted-foreground', className)}
    >
      <Scale className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
      <span>{text}</span>
    </p>
  )
}

