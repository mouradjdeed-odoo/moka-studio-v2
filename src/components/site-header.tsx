'use client'

import { useState } from 'react'
import { Menu, Phone, X } from 'lucide-react'
import { site } from '@/lib/site'
import { Logo } from '@/components/logo'
import { useI18n } from '@/lib/i18n/provider'
import { languages } from '@/lib/i18n/dictionaries'
import { cn } from '@/lib/utils'

function LanguageSwitch() {
  const { lang, setLang, t } = useI18n()
  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className="flex items-center rounded-md border border-white/15 p-0.5 text-xs font-medium"
    >
      {languages.map((l) => {
        const active = l.code === lang
        return (
          <button
            key={l.code}
            type="button"
            lang={l.code}
            onClick={() => setLang(l.code)}
            aria-pressed={active}
            title={l.name}
            className={cn(
              'rounded px-2.5 py-1 transition-colors',
              active ? 'bg-accent text-accent-foreground' : 'text-white/60 hover:bg-white/10 hover:text-white',
            )}
          >
            {l.label}
            <span className="sr-only"> – {l.name}</span>
          </button>
        )
      })}
    </div>
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const { t } = useI18n()

  const nav = [
    { href: '#leistungen', label: t.nav.services },
    { href: '#vorteile', label: t.nav.benefits },
    { href: '#ablauf', label: t.nav.process },
    { href: '#kontakt', label: t.nav.contact },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/95 text-ink-foreground backdrop-blur supports-[backdrop-filter]:bg-ink/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <a href="#top" aria-label={t.nav.home} dir="ltr">
          <Logo />
        </a>

        <nav aria-label={t.nav.mainNav} className="hidden lg:block">
          <ul className="flex items-center gap-8 text-sm text-white/75">
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="transition-colors hover:text-white">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <LanguageSwitch />
          <a
            href={site.phoneHref}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            <Phone className="size-4" aria-hidden="true" />
            <span dir="ltr">{site.phoneDisplay}</span>
          </a>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <a
            href={site.phoneHref}
            className="inline-flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground"
          >
            <Phone className="size-4" aria-hidden="true" />
            <span className="sr-only">
              {t.nav.call}: {site.phoneDisplay}
            </span>
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="inline-flex size-10 items-center justify-center rounded-md border border-white/15"
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            <span className="sr-only">{open ? t.nav.closeMenu : t.nav.openMenu}</span>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label={t.nav.mobileNav} className="border-t border-white/10 lg:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col px-4 py-4 sm:px-6">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base text-white/85 hover:text-white"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="pt-3">
              <LanguageSwitch />
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
