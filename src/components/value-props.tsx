'use client'

import { FileCheck2, Timer, UserRound } from 'lucide-react'
import { useI18n } from '@/lib/i18n/provider'

const icons = [UserRound, FileCheck2, Timer]

export function ValueProps() {
  const { t } = useI18n()

  return (
    <>
      <section id="vorteile" className="scroll-mt-20 bg-ink py-20 text-ink-foreground md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-gold">{t.values.eyebrow}</p>
            <h2 className="mt-3 text-balance text-3xl font-bold text-white sm:text-4xl">{t.values.title}</h2>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 md:grid-cols-3">
            {t.values.items.map((v, i) => {
              const Icon = icons[i] ?? UserRound
              return (
                <article key={v.title} className="flex flex-col bg-ink p-8">
                  <span className="flex size-12 items-center justify-center rounded-md bg-accent/15 text-accent">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-xl font-bold text-white">{v.title}</h3>
                  <p className="mt-3 flex-1 leading-relaxed text-white/70">{v.text}</p>
                  <span className="mt-6 w-fit rounded-full border border-gold/40 px-3 py-1 text-xs font-medium text-gold">
                    {v.tag}
                  </span>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="ablauf" className="scroll-mt-20 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">{t.process.eyebrow}</p>
            <h2 className="mt-3 text-balance text-3xl font-bold text-primary sm:text-4xl">{t.process.title}</h2>
          </div>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.process.steps.map((s, i) => (
              <li key={s.title} className="relative border-t-2 border-border pt-6">
                <span className="absolute -top-0.5 start-0 h-0.5 w-12 bg-accent" aria-hidden="true" />
                <span className="font-mono text-sm text-muted-foreground">
                  {t.process.stepLabel} 0{i + 1}
                </span>
                <h3 className="mt-2 text-lg font-bold text-primary">{s.title}</h3>
                <p className="mt-2 text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  )
}
