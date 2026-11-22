import { services } from '@/lib/site'

/** First question about the property: the whole building or one unit inside it. */
export const objectScopes = ['building', 'unit'] as const
export type ObjectScope = (typeof objectScopes)[number]
export const objectTypesByScope = {
  building: ['mfh', 'efh', 'gewerbeobjekt'],
  unit: ['wohnung', 'gewerbe'],
} as const satisfies Record<ObjectScope, readonly string[]>
export const objectTypes = [...objectTypesByScope.building, ...objectTypesByScope.unit] as const
export type ObjectType = (typeof objectTypes)[number]

export const cleanScopes = [
  'muell',
  'treppenhaus',
  'hausmeister',
  'winter',
  'garten',
  'innen',
  'endreinigung',
  'fenster',
  'sonder',
] as const
export type CleanScope = (typeof cleanScopes)[number]

/**
 * MOKA Clean services offered per property type. Building services (stairwell, bins, caretaker,
 * winter, garden) belong to the owner of the building; a single unit only gets interior work.
 */
const cleanScopesByObject: Record<ObjectType, readonly CleanScope[]> = {
  mfh: ['muell', 'treppenhaus', 'hausmeister', 'winter', 'garten', 'fenster', 'sonder'],
  gewerbeobjekt: ['muell', 'treppenhaus', 'hausmeister', 'winter', 'garten', 'fenster', 'sonder'],
  efh: ['muell', 'hausmeister', 'winter', 'garten', 'innen', 'endreinigung', 'fenster', 'sonder'],
  wohnung: ['innen', 'endreinigung', 'fenster', 'sonder'],
  gewerbe: ['innen', 'endreinigung', 'fenster', 'sonder'],
}
export const cleanScopesFor = (objectType: string): readonly CleanScope[] =>
  cleanScopesByObject[objectType as ObjectType] ?? []

export const stairFrequencies = ['twice_weekly', 'weekly', 'biweekly'] as const
export const interiorFrequencies = ['daily', 'three_weekly', 'weekly', 'biweekly'] as const
export const windowFrequencies = ['once', 'quarterly', 'monthly'] as const
export type StairFrequency = (typeof stairFrequencies)[number]
export type InteriorFrequency = (typeof interiorFrequencies)[number]
export type WindowFrequency = (typeof windowFrequencies)[number]

export const buildScopes = ['renovierung', 'trockenbau', 'sanierung', 'glasfaser'] as const
export type BuildScope = (typeof buildScopes)[number]
export const serviceTypes = ['recurring', 'onetime'] as const
/** How full the property is, only asked for MOKA Clear (drives the volume estimate). */
export const fillLevels = ['low', 'normal', 'full'] as const
export type FillLevel = (typeof fillLevels)[number]

export type QuoteData = {
  /** Comma-separated business unit ids, at least one required. */
  service: string
  /** One of `objectScopes`. */
  objectScope: string
  /** One of `objectTypesByScope[objectScope]`. */
  objectType: string
  /** Comma-separated CleanScope values, only used for MOKA Clean. */
  cleanScope: string
  /** Comma-separated BuildScope values, only used for MOKA Build. */
  buildScope: string
  /** Asked for MOKA Clear, Build and Verwaltung; for Clean it follows from the chosen services. */
  serviceType: string
  units: string
  area: string
  floor: string
  elevator: string
  distance: string
  /** One of `fillLevels`, only used for MOKA Clear. */
  fillLevel: string
  /** MOKA Clean details, each only asked when the matching service is chosen. */
  stairwells: string
  storeys: string
  stairFrequency: string
  bins: string
  /** Metres of pavement and paths to clear in winter. */
  sidewalk: string
  gardenArea: string
  /** Area for interior and final cleaning. */
  interiorArea: string
  interiorFrequency: string
  windows: string
  /** Large glass surfaces such as shop windows, optional. */
  glassArea: string
  windowFrequency: string
  name: string
  company: string
  address: string
  /** Optional invoice address; the property address is used when empty. */
  billingAddress: string
  email: string
  phone: string
  notes: string
  privacy: boolean
}

export type FileMeta = { size: number; type: string }

export type QuoteErrorCode =
  | 'service'
  | 'objectScope'
  | 'objectType'
  | 'cleanScope'
  | 'buildScope'
  | 'serviceType'
  | 'units'
  | 'area'
  | 'floor'
  | 'elevator'
  | 'distance'
  | 'fillLevel'
  | 'stairwells'
  | 'storeys'
  | 'stairFrequency'
  | 'bins'
  | 'sidewalk'
  | 'gardenArea'
  | 'interiorArea'
  | 'interiorFrequency'
  | 'windows'
  | 'glassArea'
  | 'windowFrequency'
  | 'name'
  | 'company'
  | 'address'
  | 'billingAddress'
  | 'email'
  | 'phone'
  | 'notes'
  | 'files'
  | 'fileSize'
  | 'fileType'
  | 'filesTotal'
  | 'privacy'

export type QuoteField = keyof QuoteData | 'files'
export type QuoteErrors = Partial<Record<QuoteField, QuoteErrorCode>>

export const MAX_FILES = 5
export const MAX_FILE_SIZE = 5 * 1024 * 1024
/** Photos may be larger: they are shrunk in the browser before sending (see quote-submit.ts). */
export const MAX_IMAGE_SIZE = 20 * 1024 * 1024
export const maxSizeFor = (type: string) => (type.startsWith('image/') ? MAX_IMAGE_SIZE : MAX_FILE_SIZE)

const serviceIds = services.map((s) => s.id) as string[]

export const fieldStep: Record<QuoteField, number> = {
  service: 0,
  objectScope: 0,
  objectType: 0,
  cleanScope: 0,
  buildScope: 0,
  serviceType: 1,
  units: 1,
  area: 1,
  floor: 1,
  elevator: 1,
  distance: 1,
  fillLevel: 1,
  stairwells: 1,
  storeys: 1,
  stairFrequency: 1,
  bins: 1,
  sidewalk: 1,
  gardenArea: 1,
  interiorArea: 1,
  interiorFrequency: 1,
  windows: 1,
  glassArea: 1,
  windowFrequency: 1,
  name: 2,
  company: 2,
  address: 2,
  billingAddress: 2,
  email: 2,
  phone: 2,
  notes: 2,
  files: 2,
  privacy: 2,
}

/** `service` holds a comma-separated list of business unit ids (multi-select). */
export const parseServices = (value: string) => {
  const picked = value.split(',')
  return serviceIds.filter((id) => picked.includes(id))
}
const hasService = (value: string, id: string) => parseServices(value).includes(id)

export const needsDistance = (service: string) => hasService(service, 'clear')
export const needsFillLevel = (service: string) => hasService(service, 'clear')
export const needsCleanScope = (service: string) => hasService(service, 'clean')
export const needsBuildScope = (service: string) => hasService(service, 'build')
/** Job type, area, floor and elevator are asked for every unit except MOKA Clean. */
export const needsGeneral = (service: string) =>
  hasService(service, 'clear') || hasService(service, 'build') || hasService(service, 'verwaltung')

const parseList =
  <T extends string>(allowed: readonly T[]) =>
  (value: string) =>
    value.split(',').filter((v): v is T => (allowed as readonly string[]).includes(v))

export const parseCleanScope = parseList(cleanScopes)
export const parseBuildScope = parseList(buildScopes)

export const isObjectTypeOf = (scope: string, type: string) =>
  (objectTypesByScope[scope as ObjectScope] as readonly string[] | undefined)?.includes(type) ?? false

/** The chosen Clean services that are offered for the chosen property type. */
export const activeCleanScope = (d: Pick<QuoteData, 'service' | 'objectType' | 'cleanScope'>): CleanScope[] => {
  if (!needsCleanScope(d.service)) return []
  const allowed = cleanScopesFor(d.objectType)
  return parseCleanScope(d.cleanScope).filter((c) => allowed.includes(c))
}

/** Number of units: for Clear, Build and Verwaltung, and for the caretaker of a whole building. */
export const needsUnits = (d: Pick<QuoteData, 'service' | 'objectType' | 'cleanScope'>) =>
  needsGeneral(d.service) || (activeCleanScope(d).includes('hausmeister') && d.objectType !== 'efh')

const RECURRING_CLEAN: readonly CleanScope[] = ['muell', 'treppenhaus', 'hausmeister', 'winter', 'garten', 'innen']

/** Job type sent to Odoo: chosen by the customer, or derived from the Clean services. */
export function effectiveServiceType(d: QuoteData) {
  if (needsGeneral(d.service)) return d.serviceType
  const scope = activeCleanScope(d)
  const recurring =
    scope.some((c) => RECURRING_CLEAN.includes(c)) || (scope.includes('fenster') && d.windowFrequency !== 'once')
  return recurring ? 'recurring' : 'onetime'
}

/** The data as sent: only Clean services valid for the property, derived job type and units. */
export function toPayload(d: QuoteData): QuoteData {
  return {
    ...d,
    cleanScope: activeCleanScope(d).join(','),
    serviceType: effectiveServiceType(d),
    units: needsUnits(d) ? d.units : '1',
  }
}

function inRange(value: string, min: number, max: number, integer = false) {
  if (value.trim() === '') return false
  const n = Number(value)
  return Number.isFinite(n) && n >= min && n <= max && (!integer || Number.isInteger(n))
}

const isOneOf = (allowed: readonly string[], value: string) => allowed.includes(value)

export function validateStep(step: number, d: QuoteData, files: FileMeta[]): QuoteErrors {
  const e: QuoteErrors = {}
  if (step === 0) {
    if (parseServices(d.service).length === 0) e.service = 'service'
    if (!isOneOf(objectScopes, d.objectScope)) e.objectScope = 'objectScope'
    else if (!isObjectTypeOf(d.objectScope, d.objectType)) e.objectType = 'objectType'
    if (needsCleanScope(d.service) && isObjectTypeOf(d.objectScope, d.objectType) && activeCleanScope(d).length === 0)
      e.cleanScope = 'cleanScope'
    if (needsBuildScope(d.service) && parseBuildScope(d.buildScope).length === 0) e.buildScope = 'buildScope'
  }
  if (step === 1) {
    if (needsGeneral(d.service)) {
      if (!isOneOf(serviceTypes, d.serviceType)) e.serviceType = 'serviceType'
      if (!inRange(d.area, 1, 100000)) e.area = 'area'
      if (!inRange(d.floor, -2, 99, true)) e.floor = 'floor'
      if (d.elevator !== 'yes' && d.elevator !== 'no') e.elevator = 'elevator'
    }
    if (needsUnits(d) && !inRange(d.units, 1, 9999, true)) e.units = 'units'
    if (needsDistance(d.service) && !inRange(d.distance, 0, 1000)) e.distance = 'distance'
    if (needsFillLevel(d.service) && !isOneOf(fillLevels, d.fillLevel)) e.fillLevel = 'fillLevel'

    const clean = activeCleanScope(d)
    if (clean.includes('treppenhaus')) {
      if (!inRange(d.stairwells, 1, 99, true)) e.stairwells = 'stairwells'
      if (!inRange(d.storeys, 1, 99, true)) e.storeys = 'storeys'
      if (!isOneOf(stairFrequencies, d.stairFrequency)) e.stairFrequency = 'stairFrequency'
    }
    if (clean.includes('muell') && !inRange(d.bins, 1, 999, true)) e.bins = 'bins'
    if (clean.includes('winter') && !inRange(d.sidewalk, 1, 10000)) e.sidewalk = 'sidewalk'
    if (clean.includes('garten') && !inRange(d.gardenArea, 1, 1000000)) e.gardenArea = 'gardenArea'
    if ((clean.includes('innen') || clean.includes('endreinigung')) && !inRange(d.interiorArea, 1, 100000))
      e.interiorArea = 'interiorArea'
    if (clean.includes('innen') && !isOneOf(interiorFrequencies, d.interiorFrequency))
      e.interiorFrequency = 'interiorFrequency'
    if (clean.includes('fenster')) {
      const glass = d.glassArea.trim()
      if (glass && !inRange(glass, 0, 100000)) e.glassArea = 'glassArea'
      if (!inRange(d.windows, 0, 9999, true) || (Number(d.windows) === 0 && !(Number(glass) > 0)))
        e.windows = 'windows'
      if (!isOneOf(windowFrequencies, d.windowFrequency)) e.windowFrequency = 'windowFrequency'
    }
  }
  if (step === 2) {
    const name = d.name.trim()
    if (name.length < 2 || name.length > 100) e.name = 'name'
    if (d.company.trim().length > 150) e.company = 'company'
    const address = d.address.trim()
    if (address.length < 5 || address.length > 200) e.address = 'address'
    const billing = d.billingAddress.trim()
    if (billing && (billing.length < 5 || billing.length > 200)) e.billingAddress = 'billingAddress'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim()) || d.email.length > 200) e.email = 'email'
    if (d.phone.trim() && !/^[+()\d\s/-]{6,30}$/.test(d.phone.trim())) e.phone = 'phone'
    const notes = d.notes.trim()
    if (notes.length < 10 || notes.length > 3000) e.notes = 'notes'
    if (files.length > MAX_FILES) e.files = 'files'
    else if (files.some((f) => f.size > maxSizeFor(f.type))) e.files = 'fileSize'
    else if (files.some((f) => !f.type.startsWith('image/') && f.type !== 'application/pdf')) e.files = 'fileType'
    if (!d.privacy) e.privacy = 'privacy'
  }
  return e
}

export function validateAll(d: QuoteData, files: FileMeta[]): QuoteErrors {
  return { ...validateStep(0, d, files), ...validateStep(1, d, files), ...validateStep(2, d, files) }
}
