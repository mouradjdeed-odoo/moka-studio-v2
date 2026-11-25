'use client'

import { Facebook } from 'lucide-react'
import { services, site } from '@/lib/site'
import { Logo } from '@/components/logo'
import { useI18n } from '@/lib/i18n/provider'

export function SiteFooter() {
  const { t } = useI18n()
  const f = t.footer

  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <div dir="ltr" className="w-fit">
            <Logo />
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">{f.tagline}</p>
        </div>

        <nav aria-label={f.services}>
          <h2 className="text-sm font-semibold text-white">{f.services}</h2>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-white/60">
            {services.map((s) => (
              <li key={s.id}>
                <a href="/#leistungen" className="hover:text-white" dir="ltr">
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <address className="not-italic">
          <h2 className="text-sm font-semibold text-white">{f.contact}</h2>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-white/60">
            <li>{site.name}</li>
            <li>{site.street}</li>
            <li>{site.city}</li>
            <li>
              <a href={site.phoneHref} className="hover:text-white" dir="ltr">
                {site.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="hover:text-white">
                {site.email}
              </a>
            </li>
            <li>
              {/* Plain link only (no Facebook plugin): no data goes to Meta until the visitor clicks. */}
              <a
                href={site.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-white"
              >
                <Facebook className="h-4 w-4" aria-hidden="true" />
                Facebook
              </a>
            </li>
          </ul>
        </address>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-white/50 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            © {new Date().getFullYear()} {site.name}. {f.rights}
          </p>
          <ul className="flex gap-6">
            <li>
              <a href="/impressum" className="hover:text-white">
                {f.imprint}
              </a>
            </li>
            <li>
              <a href="/datenschutz" className="hover:text-white">
                {f.privacy}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
