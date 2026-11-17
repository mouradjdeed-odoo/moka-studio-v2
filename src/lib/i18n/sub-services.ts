import type { Lang } from './dictionaries'

export const audiences = ['hausverwaltung', 'weg', 'gewerbe', 'privat'] as const
export type Audience = (typeof audiences)[number]

type SubServiceText = {
  /** Full scope of work, one item per line. */
  scope: string[]
  audience: Record<Audience, string>
}

type SubServiceDict = {
  labels: {
    details: string
    scope: string
    audience: string
    cta: string
    close: string
    audiences: Record<Audience, string>
  }
  disclaimers: { build: string; verwaltung: string }
  items: Record<string, SubServiceText>
}

const de: SubServiceDict = {
  labels: {
    details: 'Details ansehen',
    scope: 'Leistungsumfang',
    audience: 'Für wen?',
    cta: 'Diese Leistung anfragen',
    close: 'Schließen',
    audiences: { hausverwaltung: 'Hausverwaltungen', weg: 'WEGs', gewerbe: 'Gewerbe', privat: 'Privat' },
  },
  disclaimers: {
    verwaltung:
      'Rechtlicher Hinweis: Die Miet- und WEG-Verwaltung erfolgt ausschließlich durch Verwalter mit Erlaubnis nach § 34c GewO bzw. durch zertifizierte Partnerunternehmen (zertifizierter Verwalter nach § 26a WEG).',
    build:
      'Rechtlicher Hinweis: Zulassungspflichtige Handwerksleistungen werden durch in die Handwerksrolle eingetragene Meisterbetriebe bzw. qualifizierte Partnerunternehmen ausgeführt (Handwerkskammer Berlin).',
  },
  items: {
    muell: {
      scope: ['Reinigung und Desinfektion von Mülltonnen vor Ort', 'Pflege und Reinigung von Müllplätzen und -häusern', 'Bereitstellung der Tonnen zur Abholung', 'Dokumentierter Rhythmus wöchentlich bis monatlich'],
      audience: { hausverwaltung: 'Fester Turnus für alle verwalteten Objekte.', weg: 'Saubere Gemeinschaftsflächen, umlagefähig.', gewerbe: 'Hygiene für Gastronomie- und Gewerbestandorte.', privat: 'Einzelreinigung für Haus und Grundstück.' },
    },
    treppenhaus: {
      scope: ['Treppenhaus-, Flur- und Eingangsreinigung', 'Unterhaltsreinigung von Gemeinschaftsflächen', 'Glas-, Geländer- und Briefkastenreinigung', 'Leistungsnachweis per Reinigungsprotokoll'],
      audience: { hausverwaltung: 'Einheitlicher Standard über alle Objekte.', weg: 'Transparente Kosten für die Betriebskosten.', gewerbe: 'Gepflegte Eingangs- und Bürobereiche.', privat: 'Für Mehrfamilienhäuser in Privatbesitz.' },
    },
    hausmeister: {
      scope: ['Regelmäßige Objektkontrolle und Kleinreparaturen', 'Betreuung der Haustechnik und Zählerstände', 'Winterdienst: Schneeräumung und Streuen', 'Erfüllung der Räum- und Streupflicht inkl. Dokumentation'],
      audience: { hausverwaltung: 'Verlässlicher Ansprechpartner vor Ort.', weg: 'Verkehrssicherungspflicht abgesichert.', gewerbe: 'Sichere Zugänge für Kunden und Personal.', privat: 'Winterdienst für Eigenheim und Grundstück.' },
    },
    garten: {
      scope: ['Rasenmähen, Hecken- und Strauchschnitt', 'Laubbeseitigung und Beetpflege', 'Grünflächenpflege im Jahresvertrag', 'Entsorgung des Grünschnitts'],
      audience: { hausverwaltung: 'Gepflegte Außenanlagen im Jahresturnus.', weg: 'Werterhalt der Gemeinschaftsgärten.', gewerbe: 'Repräsentative Außenflächen.', privat: 'Gartenpflege nach Bedarf.' },
    },
    aufloesung: {
      scope: ['Komplette Wohnungs- und Haushaltsauflösung', 'Besenreine Übergabe', 'Diskrete Abwicklung, auch bei Nachlässen', 'Wertanrechnung verwertbarer Gegenstände'],
      audience: { hausverwaltung: 'Schnelle Räumung bei Mieterwechsel.', weg: 'Räumung von Gemeinschaftsräumen.', gewerbe: 'Auflösung von Büros und Praxen.', privat: 'Nachlass- und Umzugsräumungen.' },
    },
    raeumung: {
      scope: ['Keller-, Dachboden- und Garagenräumung', 'Räumung von Gewerbe- und Lagerflächen', 'Demontage von Möbeln und Einbauten', 'Terminierung nach Ihren Fristen'],
      audience: { hausverwaltung: 'Freigabe von Kellern und Fluren.', weg: 'Entrümpelung gemeinsamer Flächen.', gewerbe: 'Fristgerechte Flächenrückgabe.', privat: 'Platz schaffen in Keller und Dachboden.' },
    },
    entsorgung: {
      scope: ['Fachgerechte Trennung und Entsorgung', 'Entsorgungsnachweise auf Wunsch', 'Sperrmüll, Elektroschrott und Altholz', 'Transport mit eigenen Fahrzeugen'],
      audience: { hausverwaltung: 'Beseitigung von Sperrmüll im Objekt.', weg: 'Nachweise für die Gemeinschaft.', gewerbe: 'Dokumentierte Entsorgung für Ihr Unternehmen.', privat: 'Bequeme Abholung von zu Hause.' },
    },
    renovierung: {
      scope: ['Maler- und Tapezierarbeiten', 'Verlegung von Bodenbelägen', 'Renovierung bei Mieterwechsel', 'Abstimmung von Farben und Materialien'],
      audience: { hausverwaltung: 'Schnelle Neuvermietung nach Auszug.', weg: 'Treppenhaus- und Fassadenanstriche.', gewerbe: 'Renovierung im laufenden Betrieb.', privat: 'Frischer Anstrich für Ihr Zuhause.' },
    },
    trockenbau: {
      scope: ['Ständerwände und Raumaufteilung', 'Abgehängte Decken', 'Schall- und Brandschutzverkleidungen', 'Innenausbau aus einer Hand'],
      audience: { hausverwaltung: 'Grundrissanpassungen in Bestandswohnungen.', weg: 'Ausbau von Dach- und Gemeinschaftsräumen.', gewerbe: 'Flexible Büro- und Ladenflächen.', privat: 'Neue Räume ohne große Baustelle.' },
    },
    sanierung: {
      scope: ['Instandhaltung und Schadensbeseitigung', 'Bad- und Wohnungssanierung', 'Modernisierungsmaßnahmen', 'Koordination aller beteiligten Gewerke'],
      audience: { hausverwaltung: 'Ein Ansprechpartner für alle Gewerke.', weg: 'Umsetzung beschlossener Maßnahmen.', gewerbe: 'Werterhalt Ihrer Gewerbeimmobilie.', privat: 'Sanierung von Eigentumswohnung und Haus.' },
    },
    glasfaser: {
      scope: ['Glasfaser-Hausanschluss und Inhouse-Verkabelung', 'Kabelwege, Kernbohrungen und Durchbrüche', 'Netzwerk- und Infrastrukturarbeiten', 'Abstimmung mit Netzbetreibern'],
      audience: { hausverwaltung: 'Glasfaserausbau im gesamten Bestand.', weg: 'Zukunftssichere Ausstattung der Anlage.', gewerbe: 'Schnelles Netz für Ihren Standort.', privat: 'Anschluss für Ihr Eigenheim.' },
    },
    mietverwaltung: {
      scope: ['Vermietung, Mieterwechsel und Wohnungsübergaben', 'Mietbuchhaltung und Mahnwesen', 'Erstellung der Betriebskostenabrechnung', 'Laufende Mieterkommunikation'],
      audience: { hausverwaltung: 'Übernahme ganzer Verwaltungsbestände.', weg: 'Sondereigentumsverwaltung für Eigentümer.', gewerbe: 'Verwaltung gemischt genutzter Objekte.', privat: 'Entlastung für private Vermieter.' },
    },
    weg: {
      scope: ['Vorbereitung und Leitung der Eigentümerversammlung', 'Umsetzung der Beschlüsse', 'Wirtschaftsplan und Jahresabrechnung', 'Verwaltung der Erhaltungsrücklage'],
      audience: { hausverwaltung: 'Partner für die WEG-Betreuung.', weg: 'Professionelle Verwaltung Ihrer Gemeinschaft.', gewerbe: 'Teileigentum in gemischten Anlagen.', privat: 'Für Eigentümer kleiner Gemeinschaften.' },
    },
    betreuung: {
      scope: ['Kaufmännische Betreuung und Berichtswesen', 'Technische Objektbegehungen', 'Instandhaltungsplanung', 'Vergabe und Kontrolle von Dienstleistern'],
      audience: { hausverwaltung: 'Unterstützung bei technischen Fragen.', weg: 'Planbare Instandhaltung.', gewerbe: 'Betreuung von Gewerbeimmobilien.', privat: 'Rundum-Betreuung Ihrer Immobilie.' },
    },
  },
}

const en: SubServiceDict = {
  labels: {
    details: 'View details',
    scope: 'Scope of work',
    audience: 'Who is it for?',
    cta: 'Request this service',
    close: 'Close',
    audiences: { hausverwaltung: 'Property managers', weg: 'Owner associations', gewerbe: 'Commercial', privat: 'Private' },
  },
  disclaimers: {
    verwaltung:
      'Legal notice: Rental and owner-association management is carried out exclusively by managers licensed under § 34c GewO or by certified partner companies (certified manager under § 26a WEG).',
    build:
      'Legal notice: Licensed trade work is carried out by master businesses registered with the Chamber of Crafts (Handwerkskammer Berlin) or by qualified partner companies.',
  },
  items: {
    muell: { scope: ['On-site cleaning and disinfection of bins', 'Care and cleaning of bin areas', 'Placing bins out for collection', 'Documented schedule, weekly to monthly'], audience: { hausverwaltung: 'Fixed schedule for all managed buildings.', weg: 'Clean shared areas, chargeable as service costs.', gewerbe: 'Hygiene for restaurants and businesses.', privat: 'One-off cleaning for house and plot.' } },
    treppenhaus: { scope: ['Stairwell, hallway and entrance cleaning', 'Regular cleaning of shared areas', 'Glass, railing and mailbox cleaning', 'Proof of work via cleaning log'], audience: { hausverwaltung: 'One standard across all buildings.', weg: 'Transparent service costs.', gewerbe: 'Well-kept entrances and offices.', privat: 'For privately owned apartment buildings.' } },
    hausmeister: { scope: ['Regular inspections and small repairs', 'Building systems and meter readings', 'Winter service: snow clearing and gritting', 'Documented compliance with clearing duties'], audience: { hausverwaltung: 'A reliable contact on site.', weg: 'Safety obligations covered.', gewerbe: 'Safe access for customers and staff.', privat: 'Winter service for your home.' } },
    garten: { scope: ['Lawn mowing, hedge and shrub trimming', 'Leaf removal and bed care', 'Annual green-space contracts', 'Disposal of green waste'], audience: { hausverwaltung: 'Well-kept grounds all year.', weg: 'Preserve shared gardens.', gewerbe: 'Representative outdoor areas.', privat: 'Garden care as needed.' } },
    aufloesung: { scope: ['Complete apartment and household clearance', 'Broom-clean handover', 'Discreet handling, including estates', 'Credit for items of value'], audience: { hausverwaltung: 'Fast clearance between tenants.', weg: 'Clearing shared rooms.', gewerbe: 'Office and practice clearance.', privat: 'Estate and moving clearances.' } },
    raeumung: { scope: ['Basement, attic and garage clearance', 'Commercial and storage space clearance', 'Dismantling furniture and fittings', 'Scheduled to your deadlines'], audience: { hausverwaltung: 'Free up basements and hallways.', weg: 'Clear shared spaces.', gewerbe: 'On-time handover of premises.', privat: 'Make room in basement and attic.' } },
    entsorgung: { scope: ['Proper sorting and disposal', 'Disposal certificates on request', 'Bulky waste, e-waste and wood', 'Transport with our own vehicles'], audience: { hausverwaltung: 'Removing bulky waste on site.', weg: 'Records for the association.', gewerbe: 'Documented disposal for your company.', privat: 'Convenient pickup from home.' } },
    renovierung: { scope: ['Painting and wallpapering', 'Floor laying', 'Renovation between tenants', 'Advice on colours and materials'], audience: { hausverwaltung: 'Quick re-letting after move-out.', weg: 'Stairwell and facade painting.', gewerbe: 'Renovation during operation.', privat: 'A fresh look for your home.' } },
    trockenbau: { scope: ['Stud walls and room layout', 'Suspended ceilings', 'Sound and fire protection cladding', 'Interior fit-out from one source'], audience: { hausverwaltung: 'Layout changes in existing units.', weg: 'Converting attics and shared rooms.', gewerbe: 'Flexible office and retail space.', privat: 'New rooms without a big site.' } },
    sanierung: { scope: ['Maintenance and damage repair', 'Bathroom and apartment refurbishment', 'Modernisation measures', 'Coordination of all trades'], audience: { hausverwaltung: 'One contact for all trades.', weg: 'Carrying out agreed measures.', gewerbe: 'Preserve your commercial property.', privat: 'Refurbish apartment or house.' } },
    glasfaser: { scope: ['Fibre house connection and in-house cabling', 'Cable routes, core drilling and openings', 'Network and infrastructure work', 'Coordination with network operators'], audience: { hausverwaltung: 'Fibre roll-out across your portfolio.', weg: 'Future-proof building equipment.', gewerbe: 'Fast internet for your site.', privat: 'Connection for your home.' } },
    mietverwaltung: { scope: ['Letting, tenant changes and handovers', 'Rent accounting and reminders', 'Annual service-charge statements', 'Ongoing tenant communication'], audience: { hausverwaltung: 'Taking over entire portfolios.', weg: 'Unit management for owners.', gewerbe: 'Mixed-use properties.', privat: 'Relief for private landlords.' } },
    weg: { scope: ['Preparing and chairing owner meetings', 'Implementing resolutions', 'Budget and annual statement', 'Managing the maintenance reserve'], audience: { hausverwaltung: 'Partner for association management.', weg: 'Professional management of your association.', gewerbe: 'Commercial units in mixed buildings.', privat: 'For owners of small associations.' } },
    betreuung: { scope: ['Commercial support and reporting', 'Technical building inspections', 'Maintenance planning', 'Awarding and checking contractors'], audience: { hausverwaltung: 'Support on technical questions.', weg: 'Plannable maintenance.', gewerbe: 'Care for commercial property.', privat: 'All-round care for your property.' } },
  },
}

const ar: SubServiceDict = {
  ...en,
  labels: {
    details: 'عرض التفاصيل',
    scope: 'نطاق العمل',
    audience: 'لمن هذه الخدمة؟',
    cta: 'اطلب هذه الخدمة',
    close: 'إغلاق',
    audiences: { hausverwaltung: 'شركات إدارة العقارات', weg: 'اتحادات الملاك', gewerbe: 'الشركات', privat: 'الأفراد' },
  },
  disclaimers: {
    verwaltung:
      'تنبيه قانوني: تتم إدارة الإيجارات واتحادات الملاك حصرياً من قبل مديرين حاصلين على ترخيص وفق المادة 34c من قانون تنظيم المهن (GewO) أو من قبل شركاء معتمدين.',
    build:
      'تنبيه قانوني: تُنفَّذ الأعمال الحرفية المرخّصة من قبل شركات مسجلة لدى غرفة الحرف في برلين (Handwerkskammer) أو من قبل شركاء مؤهلين.',
  },
}

export const subServiceDictionaries: Record<Lang, SubServiceDict> = { de, en, ar }
