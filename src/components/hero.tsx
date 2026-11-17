'use client'

import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { MotionMedia } from '@/components/motion-media'
import { heroFrames, heroVideo } from '@/lib/site'
import { useI18n } from '@/lib/i18n/provider'

export function Hero() {
  const { t } = useI18n()
  const h = t.hero

  return (
    <section id="top" className="relative overflow-hidden bg-ink text-ink-foreground">
      <MotionMedia
        frames={heroFrames}
        video={heroVideo}
        alt=""
        variant="a"
        priority
        className="absolute inset-0 opacity-25"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-ink rtl:bg-gradient-to-l via-ink/90 to-ink/60"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px]"
      />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-28">
        <div className="flex flex-col justify-center lg:col-span-6">
          <p className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            {h.badge}
          </p>
          <h1 className="text-balance text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
            <span dir="ltr">{h.titleLead}</span> <span className="text-accent">{h.titleAccent}</span>{' '}
            {h.titleTail}
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/70">{h.subtitle}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#kontakt"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-6 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              {h.ctaPrimary}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </a>
            <a
              href="#leistungen"
              className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 px-6 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              {h.ctaSecondary}
            </a>
          </div>

          <ul className="mt-8 flex flex-col gap-2 text-sm text-white/70 sm:flex-row sm:gap-6">
            {h.bullets.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-gold" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative lg:col-span-6">
          <div className="relative overflow-hidden rounded-xl border border-white/10">
            <MotionMedia
              frames={heroFrames}
              video={heroVideo}
              alt={h.imageAlt}
              variant="b"
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="aspect-[4/3] lg:aspect-[5/4]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" aria-hidden="true" />
            <p className="absolute start-4 top-4 inline-flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
              <span className="pulse-dot size-2 rounded-full bg-accent" aria-hidden="true" />
              {h.live}
            </p>
          </div>
          <dl className="relative -mt-10 mx-4 grid grid-cols-3 divide-x divide-border rounded-lg bg-background text-foreground shadow-xl rtl:divide-x-reverse sm:mx-8">
            {h.stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center px-2 py-4 text-center">
                <dt className="order-2 text-xs text-muted-foreground">{s.label}</dt>
                <dd className="order-1 font-heading text-2xl font-bold text-primary" dir="ltr">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
