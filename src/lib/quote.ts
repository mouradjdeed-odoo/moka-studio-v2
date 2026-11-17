import { services } from '@/lib/site'

export const objectTypes = ['wohnung', 'haus', 'gewerbe'] as const
export const cleanScopes = ['muell', 'treppenhaus', 'hausmeister', 'winter', 'garten'] as const
export type CleanScope = (typeof cleanScopes)[number]
export const buildScopes = ['renovierung', 'trockenbau', 'sanierung', 'glasfaser'] as const
export type BuildScope = (typeof buildScopes)[number]
export const serviceTypes = ['recurring', 'onetime'] as const

export type QuoteData = {
  /** Comma-separated business unit ids, at least one required. */
  service: string
  objectType: string
  /** Comma-separated CleanScope values, only used for MOKA Clean. */
  cleanScope: string
  /** Comma-separated BuildScope values, only used for MOKA Build. */
  buildScope: string
  serviceType: string
  units: string
  area: string
  floor: string
  elevator: string
  distance: string
  name: string
  company: string
  address: string
  email: string
  phone: string
  notes: string
  privacy: boolean
}

export type FileMeta = { size: number; type: string }

export type QuoteErrorCode =
  | 'service'
  | 'objectType'
  | 'cleanScope'
  | 'buildScope'
  | 'serviceType'
  | 'units'
  | 'area'
  | 'floor'
  | 'elevator'
  | 'distance'
  | 'name'
  | 'company'
  | 'address'
  | 'email'
  | 'phone'
  | 'notes'
  | 'files'
  | 'fileSize'
  | 'fileType'
  | 'privacy'

export type QuoteField = keyof QuoteData | 'files'
export type QuoteErrors = Partial<Record<QuoteField, QuoteErrorCode>>

export const MAX_FILES = 5
export const MAX_FILE_SIZE = 5 * 1024 * 1024

const serviceIds = services.map((s) => s.id) as string[]

export const fieldStep: Record<QuoteField, number> = {
  service: 0,
  objectType: 0,
  cleanScope: 0,
  buildScope: 0,
  serviceType: 1,
  units: 1,
  area: 1,
  floor: 1,
  elevator: 1,
  distance: 1,
  name: 2,
  company: 2,
  address: 2,
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
export const needsCleanScope = (service: string) => hasService(service, 'clean')
export const needsBuildScope = (service: string) => hasService(service, 'build')

const parseList =
  <T extends string>(allowed: readonly T[]) =>
  (value: string) =>
    value.split(',').filter((v): v is T => (allowed as readonly string[]).includes(v))

export const parseCleanScope = parseList(cleanScopes)
export const parseBuildScope = parseList(buildScopes)

function inRange(value: string, min: number, max: number, integer = false) {
  if (value.trim() === '') return false
  const n = Number(value)
  return Number.isFinite(n) && n >= min && n <= max && (!integer || Number.isInteger(n))
}

export function validateStep(step: number, d: QuoteData, files: FileMeta[]): QuoteErrors {
  const e: QuoteErrors = {}
  if (step === 0) {
    if (parseServices(d.service).length === 0) e.service = 'service'
    if (!(objectTypes as readonly string[]).includes(d.objectType)) e.objectType = 'objectType'
    if (needsCleanScope(d.service) && parseCleanScope(d.cleanScope).length === 0) e.cleanScope = 'cleanScope'
    if (needsBuildScope(d.service) && parseBuildScope(d.buildScope).length === 0) e.buildScope = 'buildScope'
  }
  if (step === 1) {
    if (!(serviceTypes as readonly string[]).includes(d.serviceType)) e.serviceType = 'serviceType'
    if (!inRange(d.units, 1, 9999, true)) e.units = 'units'
    if (!inRange(d.area, 1, 100000)) e.area = 'area'
    if (!inRange(d.floor, -2, 99, true)) e.floor = 'floor'
    if (d.elevator !== 'yes' && d.elevator !== 'no') e.elevator = 'elevator'
    if (needsDistance(d.service) && !inRange(d.distance, 0, 1000)) e.distance = 'distance'
  }
  if (step === 2) {
    const name = d.name.trim()
    if (name.length < 2 || name.length > 100) e.name = 'name'
    if (d.company.trim().length > 150) e.company = 'company'
    const address = d.address.trim()
    if (address.length < 5 || address.length > 200) e.address = 'address'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim()) || d.email.length > 200) e.email = 'email'
    if (d.phone.trim() && !/^[+()\d\s/-]{6,30}$/.test(d.phone.trim())) e.phone = 'phone'
    const notes = d.notes.trim()
    if (notes.length < 10 || notes.length > 3000) e.notes = 'notes'
    if (files.length > MAX_FILES) e.files = 'files'
    else if (files.some((f) => f.size > MAX_FILE_SIZE)) e.files = 'fileSize'
    else if (files.some((f) => !f.type.startsWith('image/') && f.type !== 'application/pdf')) e.files = 'fileType'
    if (!d.privacy) e.privacy = 'privacy'
  }
  return e
}

export function validateAll(d: QuoteData, files: FileMeta[]): QuoteErrors {
  return { ...validateStep(0, d, files), ...validateStep(1, d, files), ...validateStep(2, d, files) }
}
