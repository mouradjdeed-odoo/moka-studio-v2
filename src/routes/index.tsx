import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { Services } from "@/components/services";
import { ValueProps } from "@/components/value-props";
import { ContactSection } from "@/components/contact-section";
import { SiteFooter } from "@/components/site-footer";

const title = "MOKA Objektservice Berlin – Alles rund um Ihre Immobilie. Aus einer Hand.";
const description =
  "Gebäudereinigung, Hausmeisterservice, Entrümpelung, Renovierung und Hausverwaltung in Berlin. Ihr zentraler Ansprechpartner für Hausverwaltungen, Eigentümer und Gewerbekunden.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: "Objektservice Berlin, Gebäudereinigung Berlin, Hausmeisterservice Berlin, Entrümpelung Berlin, Hausverwaltung Berlin, WEG-Verwaltung" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Services />
        <ValueProps />
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}
