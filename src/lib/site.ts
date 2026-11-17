export const site = {
  name: 'MOKA Objektservice',
  /** Legal entity, for Impressum and Datenschutz. */
  legalName: 'Moka Service UG',
  managingDirector: 'Kamel Allam',
  phoneDisplay: '0163 6666614',
  phoneHref: 'tel:+491636666614',
  /** TODO: placeholder until the domain is decided (open decision 11). */
  email: 'info@moka-objektservice.de',
  street: 'Lietzenburger Straße 29',
  /** Make scenario "MOKA – Neue Anfrage" (see automation/README.md). */
  quoteWebhook: 'https://hook.eu1.make.com/8hl0vmgwqtdacmgqathaj58i9jbfk3sg',
  city: '10789 Berlin',
}

export const FEATURE_ROTATION_MS = 4000

type SubServiceConfig = {
  /** Stable id, also used as key for the detail texts. */
  id: string
  /** Position of the matching bullet in the dictionary `points` list. */
  index: number
  image: string
  /** Set to false to hide this sub-service everywhere without touching the layout. */
  enabled: boolean
  /** Scope values pre-selected in the quote form when requested from the detail dialog. */
  cleanScope?: readonly string[]
  buildScope?: readonly string[]
}

type ServiceConfig = {
  id: 'clean' | 'clear' | 'build' | 'verwaltung'
  name: string
  /** Set to false to hide the whole business unit (cards, form, footer). */
  enabled: boolean
  frames: readonly string[]
  video: string
  motion: 'a' | 'b' | 'c'
  /** Legal notice shown under the unit, key in `t.services.disclaimers`. */
  disclaimer?: 'build' | 'verwaltung'
  subServices: readonly SubServiceConfig[]
}

export const allServices: readonly ServiceConfig[] = [
  {
    id: 'clean',
    name: 'MOKA Clean',
    enabled: true,
    frames: ['/images/clean.jpg', '/images/clean-2.jpg'],
    video: '/videos/clean.mp4',
    motion: 'a',
    subServices: [
      { id: 'muell', index: 0, image: '/images/features/clean-bins.jpg', enabled: true, cleanScope: ['muell'] },
      { id: 'treppenhaus', index: 1, image: '/images/features/clean-stairs.jpg', enabled: true, cleanScope: ['treppenhaus'] },
      { id: 'hausmeister', index: 2, image: '/images/features/clean-winter.jpg', enabled: true, cleanScope: ['hausmeister', 'winter'] },
      { id: 'garten', index: 3, image: '/images/features/clean-garden.jpg', enabled: true, cleanScope: ['garten'] },
    ],
  },
  {
    id: 'clear',
    name: 'MOKA Clear',
    enabled: true,
    frames: ['/images/clear.jpg', '/images/clear-2.jpg'],
    video: '/videos/clear.mp4',
    motion: 'b',
    subServices: [
      { id: 'aufloesung', index: 0, image: '/images/features/clear-apartment.jpg', enabled: true },
      { id: 'raeumung', index: 1, image: '/images/features/clear-basement.jpg', enabled: true },
      { id: 'entsorgung', index: 2, image: '/images/features/clear-disposal.jpg', enabled: true },
    ],
  },
  {
    id: 'build',
    name: 'MOKA Build',
    enabled: true,
    frames: ['/images/build.jpg', '/images/build-2.jpg'],
    video: '/videos/build.mp4',
    motion: 'c',
    disclaimer: 'build',
    subServices: [
      { id: 'renovierung', index: 0, image: '/images/features/build-paint.jpg', enabled: true, buildScope: ['renovierung'] },
      { id: 'trockenbau', index: 1, image: '/images/features/build-drywall.jpg', enabled: true, buildScope: ['trockenbau'] },
      { id: 'sanierung', index: 2, image: '/images/features/build-repair.jpg', enabled: true, buildScope: ['sanierung'] },
      { id: 'glasfaser', index: 3, image: '/images/features/build-fiber.jpg', enabled: true, buildScope: ['glasfaser'] },
    ],
  },
  {
    id: 'verwaltung',
    name: 'MOKA Verwaltung',
    enabled: true,
    frames: ['/images/verwaltung.jpg', '/images/verwaltung-2.jpg'],
    video: '/videos/verwaltung.mp4',
    motion: 'b',
    disclaimer: 'verwaltung',
    subServices: [
      { id: 'mietverwaltung', index: 0, image: '/images/features/verwaltung-rental.jpg', enabled: true },
      { id: 'weg', index: 1, image: '/images/features/verwaltung-meeting.jpg', enabled: true },
      { id: 'betreuung', index: 2, image: '/images/features/verwaltung-technical.jpg', enabled: true },
    ],
  },
]

/** Enabled business units with only their enabled sub-services. */
export const services = allServices
  .filter((s) => s.enabled)
  .map((s) => ({ ...s, subServices: s.subServices.filter((sub) => sub.enabled) }))

export type Service = (typeof services)[number]
export type SubService = SubServiceConfig

export const heroFrames = ['/images/hero.jpg', '/images/hero-2.jpg'] as const
export const heroVideo = '/videos/hero.mp4'

export type ServiceId = ServiceConfig['id']

export const SELECT_SERVICE_EVENT = 'moka:select-service'

/** Payload of SELECT_SERVICE_EVENT: adds a unit (and optional scopes) to the quote form. */
export type SelectServiceDetail = {
  service: ServiceId
  cleanScope?: readonly string[] | undefined
  buildScope?: readonly string[] | undefined
}

export function requestService(detail: SelectServiceDetail) {
  window.dispatchEvent(new CustomEvent<SelectServiceDetail>(SELECT_SERVICE_EVENT, { detail }))
  document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' })
}
