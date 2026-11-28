import { createFileRoute } from '@tanstack/react-router'
import { LegalPage, Section } from '@/components/legal-page'
import { site } from '@/lib/site'

export const Route = createFileRoute('/datenschutz')({
  head: () => ({
    meta: [
      { title: 'Datenschutzerklärung – MOKA Objektservice' },
      { name: 'description', content: `Datenschutzerklärung der ${site.legalName}.` },
    ],
  }),
  component: Datenschutz,
})

// Text source: docs/legal/Datenschutz.md (keep both in sync).
function Datenschutz() {
  const mail = (
    <a href={`mailto:${site.email}`} className="underline underline-offset-2">
      {site.email}
    </a>
  )
  return (
    <LegalPage title="Datenschutzerklärung">
      <Section title="1. Verantwortlicher">
        <p>
          {site.legalName}, {site.street}, {site.city}
          <br />
          Geschäftsführer: {site.managingDirector} · Telefon: <span dir="ltr">{site.phoneDisplay}</span> · E-Mail: {mail}
          <br />
          Registergericht: {site.registerCourt}, {site.registerNumber}
        </p>
        <p>
          Ein Datenschutzbeauftragter ist nicht bestellt, da die gesetzlichen Voraussetzungen (§ 38 BDSG) nicht
          vorliegen. Bei Fragen zum Datenschutz wenden Sie sich an {mail}.
        </p>
      </Section>

      <Section title="2. Aufruf dieser Website">
        <p>
          <strong>Hosting:</strong> Die Website wird bei der IONOS SE, Elgendorfer Str. 57, 56410 Montabaur,
          Deutschland, gehostet. Beim Aufruf verarbeitet IONOS technisch notwendige Daten (IP-Adresse, Datum und
          Uhrzeit, aufgerufene Seite, Browser und Betriebssystem, Referrer) in Server-Logdateien, um die Website
          sicher bereitzustellen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem
          sicheren und stabilen Betrieb). Mit IONOS besteht ein Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO.
        </p>
        <p>
          <strong>Verschlüsselung:</strong> Die Website nutzt eine SSL/TLS-Verschlüsselung.
        </p>
        <p>
          <strong>Schriftarten:</strong> Alle Schriftarten sind lokal auf unserem Server eingebunden. Es wird keine
          Verbindung zu Google oder anderen Schriftanbietern aufgebaut.
        </p>
        <p>
          <strong>Cookies und Tracking:</strong> Diese Website setzt keine Cookies, speichert nichts in Ihrem Browser
          und verwendet keine Analyse- oder Tracking-Dienste. Eine Ausnahme gilt nur, wenn Sie selbst den Chat starten
          (siehe Abschnitt 6).
        </p>
      </Section>

      <Section title="3. Anfrageformular (Angebotsanfrage)">
        <p>
          <strong>Welche Daten:</strong> Name, Firma (optional), E-Mail, Telefon (optional), Objekt- und
          Rechnungsadresse, Angaben zum Objekt und zur gewünschten Leistung, Ihre Nachricht sowie hochgeladene Fotos
          oder PDF-Dateien.
        </p>
        <p>
          <strong>Zweck und Rechtsgrundlage:</strong> Bearbeitung Ihrer Anfrage, Erstellung eines Angebots und
          gegebenenfalls Durchführung des Auftrags (Art. 6 Abs. 1 lit. b DSGVO, vorvertragliche Maßnahmen und
          Vertragserfüllung).
        </p>
        <p>
          <strong>Übermittlung und Speicherung:</strong>
        </p>
        <ul className="ms-6 list-disc space-y-2">
          <li>
            Das Formular sendet Ihre Angaben verschlüsselt an den Automatisierungsdienst <strong>Make</strong> (Celonis
            Make s.r.o. / Celonis-Gruppe), Rechenzentrum in der EU (Region „eu1“). Make leitet die Daten nur weiter
            und speichert deren Inhalt nicht dauerhaft.
          </li>
          <li>
            Gespeichert werden die Daten in unserem Kundensystem <strong>Odoo</strong> (Odoo S.A., Chaussée de Namur
            40, 1367 Ramillies, Belgien), Rechenzentrum in Europa. Odoo erstellt Sicherungskopien auch in Kanada; für
            Kanada besteht ein Angemessenheitsbeschluss der EU-Kommission (Art. 45 DSGVO).
          </li>
          <li>
            Mit Make und Odoo bestehen Verträge zur Auftragsverarbeitung. Soweit Unterauftragnehmer außerhalb der EU
            eingesetzt werden, erfolgt dies auf Grundlage des EU-US Data Privacy Framework bzw. der
            EU-Standardvertragsklauseln.
          </li>
        </ul>
        <p>
          <strong>E-Mails:</strong> Wir senden Ihnen eine Eingangsbestätigung und später unser Angebot per E-Mail.
          Unsere E-Mail-Postfächer liegen bei IONOS (Deutschland).
        </p>
      </Section>

      <Section title="4. Angebote, elektronische Unterschrift und Verträge">
        <p>
          Angebote stellen wir Ihnen über ein Kundenportal in Odoo bereit. Wenn Sie ein Angebot oder einen Vertrag
          online unterschreiben, speichern wir Ihre Unterschrift, Name, Datum, Uhrzeit und IP-Adresse als Nachweis
          des Vertragsschlusses (Art. 6 Abs. 1 lit. b und lit. f DSGVO).
        </p>
      </Section>

      <Section title="5. Unsere Seiten auf Facebook und Instagram">
        <p>
          Wir betreiben Unternehmensseiten auf{' '}
          <a href={site.facebook} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            Facebook
          </a>{' '}
          und{' '}
          <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            Instagram
          </a>{' '}
          (Anbieter beider Dienste: Meta Platforms Ireland Limited, Merrion Road, Dublin 4, D04 X2K5, Irland). Auf
          dieser Website sind beide Dienste nur als einfache Links eingebunden: Beim Aufruf unserer Website werden keine
          Daten an Meta übertragen. Erst wenn Sie einen Link anklicken, gelangen Sie zu Facebook bzw. Instagram.
        </p>
        <p>
          Wenn Sie unsere Seiten dort besuchen, verarbeitet Meta Ihre Daten (zum Beispiel IP-Adresse, Geräte- und
          Nutzungsdaten, Cookies) nach eigenen Bedingungen, auch in den USA. Für die Seitenstatistiken („Insights“)
          sind wir mit Meta gemeinsam verantwortlich (Art. 26 DSGVO). Meta übernimmt nach der{' '}
          <a href="https://www.facebook.com/legal/terms/page_controller_addendum" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            Vereinbarung über die gemeinsame Verantwortlichkeit
          </a>{' '}
          die primäre Verantwortung für diese Verarbeitung und für die Erfüllung Ihrer Rechte; Sie können sich aber
          auch an uns wenden. Wir erhalten nur zusammengefasste Statistiken, die keinen Rückschluss auf einzelne
          Personen zulassen.
        </p>
        <p>
          Rechtsgrundlage ist unser berechtigtes Interesse, unser Unternehmen darzustellen und mit Interessenten in
          Kontakt zu treten (Art. 6 Abs. 1 lit. f DSGVO). Wenn Sie uns über Facebook oder Instagram schreiben,
          verarbeiten wir Ihre Nachricht, um sie zu beantworten (Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO). Weitere
          Informationen finden Sie in der{' '}
          <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            Datenschutzrichtlinie von Meta
          </a>{' '}
          und in der{' '}
          <a href="https://privacycenter.instagram.com/policy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            Datenschutzrichtlinie von Instagram
          </a>
          .
        </p>
      </Section>

      <Section title="6. Chat auf unserer Website">
        <p>
          Auf unserer Website können Sie über einen Chat mit uns Kontakt aufnehmen. Der Chat ist zunächst nur ein Button unserer Website: Erst wenn Sie ihn öffnen und auf „Chat starten“ klicken, wird der Chat-Dienst unseres Kundensystems Odoo (Odoo S.A., Chaussée de Namur 40, 1367 Ramillies, Belgien) geladen. Ab diesem Zeitpunkt werden Ihre IP-Adresse und technische Daten Ihres Browsers an Odoo übertragen, und Odoo speichert in Ihrem Browser eine Kennung (Cookie bzw. lokaler Speicher), damit die Unterhaltung erhalten bleibt. Diese Speicherung ist für den von Ihnen gewünschten Chat unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG).
        </p>
        <p>
          Im Chat antwortet zunächst ein automatischer Assistent mit vorgegebenen Texten; es wird keine künstliche Intelligenz eingesetzt. Verarbeitet werden Ihre Nachrichten und die Angaben, die Sie selbst machen (zum Beispiel E-Mail-Adresse und Telefonnummer). Wenn Sie uns Ihr Anliegen schildern, legen wir daraus eine Anfrage in unserem Kundensystem an. Zweck ist die Beantwortung Ihrer Fragen und die Bearbeitung Ihrer Anfrage (Art. 6 Abs. 1 lit. b DSGVO, vorvertragliche Maßnahmen, sowie lit. f DSGVO, berechtigtes Interesse an einer schnellen Kommunikation). Mit Odoo besteht ein Vertrag zur Auftragsverarbeitung (siehe Abschnitt 3).
        </p>
        <p>
          Chatverläufe löschen wir spätestens 180 Tage nach dem letzten Beitrag. Ist aus dem Chat eine Anfrage entstanden, gelten für diese die Fristen in Abschnitt 7.
        </p>
      </Section>

      <Section title="7. Speicherdauer">
        <ul className="ms-6 list-disc space-y-2">
          <li>
            Abgelehnte oder nicht zustande gekommene Anfragen löschen wir spätestens 180 Tage nach Abschluss
            automatisch, einschließlich der hochgeladenen Dateien.
          </li>
          <li>
            Daten zu Angeboten, Aufträgen und Rechnungen bewahren wir entsprechend den gesetzlichen
            Aufbewahrungsfristen auf (bis zu 10 Jahre nach § 147 AO und § 257 HGB) und löschen sie danach.
          </li>
        </ul>
      </Section>

      <Section title="8. Ihre Rechte">
        <p>
          Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der
          Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage
          berechtigter Interessen (Art. 21 DSGVO). Eine erteilte Einwilligung können Sie jederzeit für die Zukunft
          widerrufen.
        </p>
        <p>
          Sie können sich bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel bei der Berliner
          Beauftragten für Datenschutz und Informationsfreiheit, Alt-Moabit 59–61, 10555 Berlin.
        </p>
      </Section>

      <Section title="9. Pflicht zur Bereitstellung">
        <p>
          Für ein Angebot benötigen wir die als Pflichtfelder markierten Angaben. Ohne sie können wir Ihre Anfrage
          nicht bearbeiten.
        </p>
      </Section>

      <p className="text-sm text-muted-foreground">Stand: November 2026</p>
    </LegalPage>
  )
}
