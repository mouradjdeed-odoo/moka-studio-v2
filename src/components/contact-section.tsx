'use client'

import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { QuoteForm } from '@/components/quote-form'
import { site } from '@/lib/site'
import { useI18n } from '@/lib/i18n/provider'

export function ContactSection() {
  const { t } = useI18n()
  const c = t.contact

  const items = [
    { icon: Phone, label: c.phone, value: site.phoneDisplay, href: site.phoneHref, ltr: true },
    { icon: Mail, label: c.email, value: site.email, href: `mailto:${site.email}`, ltr: true },
    { icon: Clock, label: c.hours, value: c.hoursValue },
    { icon: MapPin, label: c.location, value: `${site.street}, ${site.city}` },
  ]

  return (
    <section id="kontakt" className="scroll-mt-16 bg-secondary py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">{c.eyebrow}</p>
          <h2 className="mt-3 text-balance text-3xl font-bold text-primary sm:text-4xl">{c.title}</h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{c.intro}</p>

          <ul className="mt-8 flex flex-col gap-5">
            {items.map((item) => (
              <li key={item.label} className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  {item.href ? (
                    <a
                      href={item.href}
                      dir={item.ltr ? 'ltr' : undefined}
                      className="font-semibold text-primary hover:underline"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="font-semibold text-primary">{item.value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-8">
          <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-10">
            <QuoteForm />
          </div>
        </div>
      </div>
    </section>
  )
}
