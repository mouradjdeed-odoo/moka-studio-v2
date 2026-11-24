import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/logo'
import { SiteFooter } from '@/components/site-footer'

/** Layout for the German legal pages (Impressum, Datenschutz): simple header, readable text, site footer. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div lang="de" dir="ltr">
      <header className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <a href="/" aria-label="Zur Startseite" className="w-fit">
            <Logo />
          </a>
          <a href="/" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Zur Startseite
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold text-primary sm:text-4xl">{title}</h1>
        <div className="legal mt-8 flex flex-col gap-8 text-base leading-relaxed text-foreground">{children}</div>
      </main>
      <SiteFooter />
    </div>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-primary">{title}</h2>
      {children}
    </section>
  )
}
