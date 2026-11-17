'use client'

import { useState } from 'react'
import { ArrowRight, Check, Hammer, Building2, Info, Sparkles, Truck } from 'lucide-react'
import { FeatureSlides } from '@/components/feature-slides'
import { useRotation } from '@/hooks/use-rotation'
import { FEATURE_ROTATION_MS, requestService, services, type Service, type ServiceId, type SubService } from '@/lib/site'
import { SubServiceDialog } from '@/components/sub-service-dialog'
import { Disclaimer } from '@/components/disclaimer'
import { subServiceDictionaries } from '@/lib/i18n/sub-services'
import { useI18n } from '@/lib/i18n/provider'
import { format } from '@/lib/i18n/dictionaries'
import { cn } from '@/lib/utils'

const icons: Record<ServiceId, typeof Sparkles> = {
  clean: Sparkles,
  clear: Truck,
  build: Hammer,
  verwaltung: Building2,
}

export function Services() {
  const { t } = useI18n()
  const [active, setActive] = useState<ServiceId | undefined>(services[0]?.id)
  const current = services.find((s) => s.id === active) ?? services[0]
  if (!current) return null

  return (
    <section id="leistungen" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">{t.services.eyebrow}</p>
            <h2 className="mt-3 text-balance text-3xl font-bold text-primary sm:text-4xl">{t.services.title}</h2>
          </div>
          <p className="max-w-md text-pretty text-muted-foreground">{t.services.intro}</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="tablist" aria-label={t.services.tablist}>
          {services.map((s, i) => (
            <ServiceCard
              key={s.id}
              service={s}
              order={i + 1}
              isActive={s.id === active}
              onSelect={() => setActive(s.id)}
            />
          ))}
        </div>

        <ServicePanel key={current.id} service={current} />
      </div>
    </section>
  )
}

function ServiceCard({
  service,
  order,
  isActive,
  onSelect,
}: {
  service: Service
  order: number
  isActive: boolean
  onSelect: () => void
}) {
  const { t } = useI18n()
  const text = t.services.items[service.id]
  const [hovered, setHovered] = useState(false)
  const subs = service.subServices
  const [feature] = useRotation(subs.length, FEATURE_ROTATION_MS, hovered)
  const Icon = icons[service.id]

  return (
    <button
      type="button"
      role="tab"
      id={`tab-${service.id}`}
      aria-selected={isActive}
      aria-controls="service-panel"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'group relative flex min-h-80 flex-col overflow-hidden rounded-lg border text-start transition-all',
        isActive ? 'border-accent shadow-xl ring-2 ring-accent/40' : 'border-border hover:shadow-lg',
      )}
    >
      <FeatureSlides
        images={subs.map((sub) => sub.image)}
        alts={[]}
        active={feature}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        className="absolute inset-0"
      />
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 bg-gradient-to-t transition-opacity',
          isActive ? 'from-ink via-ink/85 to-ink/30' : 'from-ink via-ink/75 to-ink/20',
        )}
      />
      <div className="relative flex flex-1 flex-col p-6 text-white">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'flex size-11 items-center justify-center rounded-md backdrop-blur',
              isActive ? 'bg-accent text-accent-foreground' : 'bg-white/15 text-white',
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <span className="font-mono text-xs text-gold" dir="ltr">
            0{order}
          </span>
        </div>
        <div className="mt-auto pt-10">
          <p className="text-sm font-medium text-gold">{text.tagline}</p>
          <h3 className="mt-1 text-xl font-bold" dir="ltr">
            {service.name}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-white/80">{text.description}</p>
          <p className="mt-4 min-h-10 text-xs font-medium text-white/90" aria-hidden="true">
            {subs[feature] ? text.points[subs[feature].index] : null}
          </p>
          <ProgressDots count={subs.length} active={feature} className="mt-3" />
        </div>
      </div>
    </button>
  )
}

function ServicePanel({ service }: { service: Service }) {
  const { t } = useI18n()
  const text = t.services.items[service.id]
  const { lang } = useI18n()
  const sd = subServiceDictionaries[lang]
  const subs = service.subServices
  const points = subs.map((sub) => text.points[sub.index] ?? sub.id)
  const [paused, setPaused] = useState(false)
  const [open, setOpen] = useState<SubService | null>(null)
  const [feature, setFeature] = useRotation(subs.length, FEATURE_ROTATION_MS, paused || open !== null)

  return (
    <div
      id="service-panel"
      role="tabpanel"
      aria-labelledby={`tab-${service.id}`}
      className="mt-6 grid overflow-hidden rounded-lg border bg-secondary animate-in fade-in duration-500 md:grid-cols-2"
    >
      <div className="relative aspect-[16/10] md:aspect-auto md:min-h-96">
        <FeatureSlides
          images={subs.map((sub) => sub.image)}
          alts={points.map((p) => `${service.name} – ${p}`)}
          active={feature}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="absolute inset-0"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent p-5 pt-12 text-white">
          <p className="text-sm font-semibold" aria-live="polite">
            {points[feature]}
          </p>
          <ProgressDots count={subs.length} active={feature} className="mt-3" />
        </div>
      </div>
      <div className="flex flex-col justify-center p-8 md:p-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">{text.tagline}</p>
        <h3 className="mt-2 text-2xl font-bold text-primary sm:text-3xl" dir="ltr">
          {service.name}
        </h3>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{text.description}</p>
        <ul
          className="mt-6 flex flex-col gap-1.5"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {subs.map((sub, i) => {
            const p = points[i]
            const isActive = i === feature
            return (
              <li key={sub.id}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onMouseEnter={() => setFeature(i)}
                  onFocus={() => setFeature(i)}
                  onClick={() => setOpen(sub)}
                  aria-haspopup="dialog"
                  aria-label={`${p} – ${sd.labels.details}`}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-md px-3 py-2 text-start transition-colors',
                    isActive ? 'bg-accent/10 text-primary' : 'text-foreground hover:bg-accent/5',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full transition-colors',
                      isActive ? 'bg-accent text-accent-foreground' : 'bg-accent/15 text-accent',
                    )}
                  >
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className={cn('flex-1', isActive && 'font-semibold')}>{p}</span>
                  <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
        {service.disclaimer && <Disclaimer text={sd.disclaimers[service.disclaimer]} className="mt-6" />}
        <a
          href="#kontakt"
          onClick={(e) => {
            e.preventDefault()
            requestService({ service: service.id })
          }}
          className="mt-8 inline-flex w-fit items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
        >
          {format(t.services.request, { name: service.name })}
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </a>
      </div>
      <SubServiceDialog
        service={service}
        sub={open}
        title={open ? (text.points[open.index] ?? open.id) : ''}
        onClose={() => setOpen(null)}
      />
    </div>
  )
}

function ProgressDots({ count, active, className }: { count: number; active: number; className?: string }) {
  return (
    <div className={cn('flex gap-1.5', className)} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn('h-1 rounded-full transition-all duration-300', i === active ? 'w-6 bg-gold' : 'w-2 bg-white/40')}
        />
      ))}
    </div>
  )
}
