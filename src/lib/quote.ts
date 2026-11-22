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
/** MOKA Build: desired timeframe, asked for every Build request. */
export const buildDeadlines = ['asap', 'two_weeks', 'month', 'flexible'] as const
/** Renovation works, each priced automatically. */
export const renoWorks = ['paint', 'wallpaper', 'floor', 'doors'] as const
export type RenoWork = (typeof renoWorks)[number]
export const wallConditions = ['good', 'normal', 'poor'] as const
/** MOKA Verwaltung: kinds of management, priced per unit and month. */
export const mgmtTypes = ['miet', 'weg', 'sev', 'technik'] as const
export type MgmtType = (typeof mgmtTypes)[number]
/** Yes / no / don't know (fibre questions). */
export const triOptions = ['yes', 'no', 'unknown'] as const
export const serviceTypes = ['recurring', 'onetime'] as const
/** How full a place is, asked per place for MOKA Clear (drives the volume estimate). */
export const fillLevels = ['low', 'normal', 'full'] as const
export type FillLevel = (typeof fillLevels)[number]

/** MOKA Clear: what happens to the items. */
export const clearModes = ['dispose', 'move', 'mixed'] as const
export type ClearMode = (typeof clearModes)[number]
/** Places to clear or move, each with its own area and fill level. */
export const clearPlaces = ['living', 'keller', 'attic', 'garage', 'office'] as const
export type ClearPlace = (typeof clearPlaces)[number]
export const placeArea = { living: 'livingArea', keller: 'kellerArea', attic: 'atticArea', garage: 'garageArea', office: 'officeArea' } as const
export const placeFill = { living: 'livingFill', keller: 'kellerFill', attic: 'atticFill', garage: 'garageFill', office: 'officeFill' } as const
/** Share of the items to dispose of when part is moved and part disposed. */
export const disposeShares = ['0.25', '0.5', '0.75'] as const
export const clearExtras = ['montage', 'packing', 'haltverbotOld', 'haltverbotNew', 'heavy', 'hazardous', 'noParking'] as const
export type ClearExtra = (typeof clearExtras)[number]
/** Extras offered per mode: moving extras cost extra, the others only inform the managers. */
export const clearExtrasFor = (mode: string): readonly ClearExtra[] =>
  mode === 'move'
    ? ['montage', 'packing', 'haltverbotOld', 'haltverbotNew', 'heavy']
    : mode === 'mixed'
      ? ['montage', 'packing', 'haltverbotOld', 'haltverbotNew', 'heavy', 'hazardous']
      : mode === 'dispose'
        ? ['heavy', 'hazardous', 'noParking']
        : []

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
  /** Asked for MOKA Build and Verwaltung; for Clean and Clear it follows from the chosen services. */
  serviceType: string
  units: string
  area: string
  floor: string
  elevator: string
  /** MOKA Clear move: approximate km between the old and the new address. */
  distance: string
  /** MOKA Clear: one of `clearModes`. */
  clearMode: string
  /** Comma-separated ClearPlace values. */
  clearAreas: string
  livingArea: string
  livingFill: string
  rooms: string
  kellerArea: string
  kellerFill: string
  atticArea: string
  atticFill: string
  garageArea: string
  garageFill: string
  officeArea: string
  officeFill: string
  /** One of `disposeShares`, only for mode "mixed". */
  disposeShare: string
  newAddress: string
  newFloor: string
  newElevator: string
  /** Comma-separated ClearExtra values. */
  clearExtras: string
  /** MOKA Build: one of `buildDeadlines`. */
  buildDeadline: string
  /** Comma-separated RenoWork values (scope "renovierung"). */
  renoWorks: string
  renoArea: string
  renoRooms: string
  wallCondition: string
  floorArea: string
  /** Number of doors and radiators to paint. */
  doors: string
  /** Fibre (scope "glasfaser"). */
  fiberUnits: string
  fiberStoreys: string
  fiberEntrances: string
  fiberConnection: string
  fiberDucts: string
  /** MOKA Verwaltung: comma-separated MgmtType values. */
  mgmtTypes: string
  mgmtFlats: string
  mgmtCommercial: string
  mgmtParking: string
  /** Desired start date (YYYY-MM-DD). */
  mgmtStart: string
  /** "yes" when another manager is replaced (information for the managers only). */
  mgmtSwitch: string
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
  | 'clearMode'
  | 'clearAreas'
  | 'livingArea'
  | 'livingFill'
  | 'rooms'
  | 'kellerArea'
  | 'kellerFill'
  | 'atticArea'
  | 'atticFill'
  | 'garageArea'
  | 'garageFill'
  | 'officeArea'
  | 'officeFill'
  | 'disposeShare'
  | 'newAddress'
  | 'newFloor'
  | 'newElevator'
  | 'clearExtras'
  | 'buildDeadline'
  | 'renoWorks'
  | 'renoArea'
  | 'renoRooms'
  | 'wallCondition'
  | 'floorArea'
  | 'doors'
  | 'fiberUnits'
  | 'fiberStoreys'
  | 'fiberEntrances'
  | 'fiberConnection'
  | 'fiberDucts'
  | 'mgmtTypes'
  | 'mgmtFlats'
  | 'mgmtCommercial'
  | 'mgmtParking'
  | 'mgmtStart'
  | 'mgmtSwitch'
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
  clearMode: 1,
  clearAreas: 1,
  livingArea: 1,
  livingFill: 1,
  rooms: 1,
  kellerArea: 1,
  kellerFill: 1,
  atticArea: 1,
  atticFill: 1,
  garageArea: 1,
  garageFill: 1,
  officeArea: 1,
  officeFill: 1,
  disposeShare: 1,
  newAddress: 1,
  newFloor: 1,
  newElevator: 1,
  clearExtras: 1,
  buildDeadline: 1,
  renoWorks: 1,
  renoArea: 1,
  renoRooms: 1,
  wallCondition: 1,
  floorArea: 1,
  doors: 1,
  fiberUnits: 1,
  fiberStoreys: 1,
  fiberEntrances: 1,
  fiberConnection: 1,
  fiberDucts: 1,
  mgmtTypes: 1,
  mgmtFlats: 1,
  mgmtCommercial: 1,
  mgmtParking: 1,
  mgmtStart: 1,
  mgmtSwitch: 1,
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

export const needsClear = (service: string) => hasService(service, 'clear')
export const needsCleanScope = (service: string) => hasService(service, 'clean')
export const needsBuildScope = (service: string) => hasService(service, 'build')
export const needsVerwaltung = (service: string) => hasService(service, 'verwaltung')
export const parseMgmtTypes = (value: string) => value.split(',').filter((v): v is MgmtType => (mgmtTypes as readonly string[]).includes(v))
/** Floor and elevator of the property: for Clear, Build and Verwaltung. */
export const needsFloor = (service: string) => needsClear(service) || needsBuildScope(service)
/** Build scopes chosen (only when MOKA Build is selected). */
export const activeBuildScope = (d: Pick<QuoteData, 'service' | 'buildScope'>): BuildScope[] =>
  needsBuildScope(d.service) ? parseBuildScope(d.buildScope) : []
export const parseRenoWorks = (value: string) => value.split(',').filter((v): v is RenoWork => (renoWorks as readonly string[]).includes(v))
/** Moving to a new address (MOKA Clear "move" or "mixed"). */
export const needsMove = (d: Pick<QuoteData, 'service' | 'clearMode'>) =>
  needsClear(d.service) && (d.clearMode === 'move' || d.clearMode === 'mixed')

const parseList =
  <T extends string>(allowed: readonly T[]) =>
  (value: string) =>
    value.split(',').filter((v): v is T => (allowed as readonly string[]).includes(v))

export const parseCleanScope = parseList(cleanScopes)
export const parseBuildScope = parseList(buildScopes)
export const parseClearAreas = parseList(clearPlaces)
export const parseClearExtras = parseList(clearExtras)
/** Clear extras offered for the chosen mode. */
export const activeClearExtras = (d: Pick<QuoteData, 'clearMode' | 'clearExtras'>) =>
  parseClearExtras(d.clearExtras).filter((x) => clearExtrasFor(d.clearMode).includes(x))

export const isObjectTypeOf = (scope: string, type: string) =>
  (objectTypesByScope[scope as ObjectScope] as readonly string[] | undefined)?.includes(type) ?? false

/** The chosen Clean services that are offered for the chosen property type. */
export const activeCleanScope = (d: Pick<QuoteData, 'service' | 'objectType' | 'cleanScope'>): CleanScope[] => {
  if (!needsCleanScope(d.service)) return []
  const allowed = cleanScopesFor(d.objectType)
  return parseCleanScope(d.cleanScope).filter((c) => allowed.includes(c))
}

/** Number of units: for the caretaker of a whole building. */
export const needsUnits = (d: Pick<QuoteData, 'service' | 'objectType' | 'cleanScope'>) =>
  activeCleanScope(d).includes('hausmeister') && d.objectType !== 'efh'

const RECURRING_CLEAN: readonly CleanScope[] = ['muell', 'treppenhaus', 'hausmeister', 'winter', 'garten', 'innen']

/** Job type sent to Odoo: recurring for Verwaltung or recurring Clean services, else one-time. */
export function effectiveServiceType(d: QuoteData) {
  if (needsVerwaltung(d.service)) return 'recurring'
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
    clearAreas: needsClear(d.service) ? parseClearAreas(d.clearAreas).join(',') : '',
    clearExtras: needsClear(d.service) ? activeClearExtras(d).join(',') : '',
    renoWorks: activeBuildScope(d).includes('renovierung') ? parseRenoWorks(d.renoWorks).join(',') : '',
    mgmtTypes: needsVerwaltung(d.service) ? parseMgmtTypes(d.mgmtTypes).join(',') : '',
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
    if (needsVerwaltung(d.service)) {
      if (parseMgmtTypes(d.mgmtTypes).length === 0) e.mgmtTypes = 'mgmtTypes'
      if (!inRange(d.mgmtFlats, 0, 9999, true)) e.mgmtFlats = 'mgmtFlats'
      if (!inRange(d.mgmtCommercial, 0, 9999, true)) e.mgmtCommercial = 'mgmtCommercial'
      else if (!e.mgmtFlats && Number(d.mgmtFlats) + Number(d.mgmtCommercial) === 0) e.mgmtFlats = 'mgmtFlats'
      if (d.mgmtParking.trim() && !inRange(d.mgmtParking, 0, 9999, true)) e.mgmtParking = 'mgmtParking'
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d.mgmtStart)) e.mgmtStart = 'mgmtStart'
      if (d.mgmtSwitch !== 'yes' && d.mgmtSwitch !== 'no') e.mgmtSwitch = 'mgmtSwitch'
    }
    if (needsFloor(d.service)) {
      if (!inRange(d.floor, -2, 99, true)) e.floor = 'floor'
      if (d.elevator !== 'yes' && d.elevator !== 'no') e.elevator = 'elevator'
    }
    if (needsUnits(d) && !inRange(d.units, 1, 9999, true)) e.units = 'units'

    if (needsClear(d.service)) {
      if (!isOneOf(clearModes, d.clearMode)) e.clearMode = 'clearMode'
      const places = parseClearAreas(d.clearAreas)
      if (places.length === 0) e.clearAreas = 'clearAreas'
      for (const place of places) {
        if (!inRange(d[placeArea[place]], 1, 100000)) e[placeArea[place]] = placeArea[place]
        if (!isOneOf(fillLevels, d[placeFill[place]])) e[placeFill[place]] = placeFill[place]
      }
      if (places.includes('living') && !inRange(d.rooms, 1, 50, true)) e.rooms = 'rooms'
      if (d.clearMode === 'mixed' && !isOneOf(disposeShares, d.disposeShare)) e.disposeShare = 'disposeShare'
      if (needsMove(d)) {
        const to = d.newAddress.trim()
        if (to.length < 5 || to.length > 200) e.newAddress = 'newAddress'
        if (!inRange(d.newFloor, -2, 99, true)) e.newFloor = 'newFloor'
        if (d.newElevator !== 'yes' && d.newElevator !== 'no') e.newElevator = 'newElevator'
        if (!inRange(d.distance, 0, 1000)) e.distance = 'distance'
      }
    }

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
  if (step === 1 && needsBuildScope(d.service)) {
    const build = parseBuildScope(d.buildScope)
    if (!isOneOf(buildDeadlines, d.buildDeadline)) e.buildDeadline = 'buildDeadline'
    if (build.includes('renovierung')) {
      const works = parseRenoWorks(d.renoWorks)
      if (works.length === 0) e.renoWorks = 'renoWorks'
      if (!inRange(d.renoArea, 1, 10000)) e.renoArea = 'renoArea'
      if (!inRange(d.renoRooms, 1, 50, true)) e.renoRooms = 'renoRooms'
      if ((works.includes('paint') || works.includes('wallpaper')) && !isOneOf(wallConditions, d.wallCondition))
        e.wallCondition = 'wallCondition'
      if (works.includes('floor') && !inRange(d.floorArea, 1, 10000)) e.floorArea = 'floorArea'
      if (works.includes('doors') && !inRange(d.doors, 1, 200, true)) e.doors = 'doors'
    }
    if (build.includes('glasfaser')) {
      if (!inRange(d.fiberUnits, 1, 9999, true)) e.fiberUnits = 'fiberUnits'
      if (!inRange(d.fiberStoreys, 1, 99, true)) e.fiberStoreys = 'fiberStoreys'
      if (!inRange(d.fiberEntrances, 1, 99, true)) e.fiberEntrances = 'fiberEntrances'
      if (!isOneOf(triOptions, d.fiberConnection)) e.fiberConnection = 'fiberConnection'
      if (!isOneOf(triOptions, d.fiberDucts)) e.fiberDucts = 'fiberDucts'
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
