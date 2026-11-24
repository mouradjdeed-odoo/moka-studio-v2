import { createFileRoute } from '@tanstack/react-router'
import { LegalPage, Section } from '@/components/legal-page'
import { site } from '@/lib/site'

export const Route = createFileRoute('/impressum')({
  head: () => ({
    meta: [
      { title: 'Impressum – MOKA Objektservice' },
      { name: 'description', content: `Impressum der ${site.legalName}, ${site.street}, ${site.city}.` },
    ],
  }),
  component: Impressum,
})

function Impressum() {
  return (
    <LegalPage title="Impressum">
      <Section title="Angaben gemäß § 5 DDG">
        <p>
          {site.legalName}
          <br />
          {site.street}
          <br />
          {site.city}
        </p>
        <p>
          <strong>Vertreten durch den Geschäftsführer:</strong> {site.managingDirector}
        </p>
      </Section>

      <Section title="Kontakt">
        <p>
          Telefon:{' '}
          <a href={site.phoneHref} className="underline underline-offset-2" dir="ltr">
            {site.phoneDisplay}
          </a>
          <br />
          E-Mail:{' '}
          <a href={`mailto:${site.email}`} className="underline underline-offset-2">
            {site.email}
          </a>
        </p>
      </Section>

      <Section title="Registereintrag">
        <p>
          Registergericht: {site.registerCourt}
          <br />
          Registernummer: {site.registerNumber}
        </p>
      </Section>

      <Section title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
        <p>
          {site.managingDirector}, {site.street}, {site.city}
        </p>
      </Section>

      <Section title="Verbraucherstreitbeilegung">
        <p>
          Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </Section>

      <Section title="Hinweis zu Handwerks- und Verwaltungsleistungen">
        <p>
          Zulassungspflichtige Handwerksleistungen werden durch in die Handwerksrolle eingetragene Meisterbetriebe
          bzw. qualifizierte Partnerunternehmen ausgeführt. Die Miet- und WEG-Verwaltung erfolgt ausschließlich durch
          Verwalter mit Erlaubnis nach § 34c GewO bzw. durch zertifizierte Partnerunternehmen.
        </p>
      </Section>
    </LegalPage>
  )
}
