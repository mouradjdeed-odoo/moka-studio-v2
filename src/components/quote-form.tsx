'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import {
  AppWindow,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Brush,
  Building,
  Building2,
  Camera,
  Car,
  CalendarCheck,
  Cable,
  Check,
  CheckCircle2,
  DoorOpen,
  Hammer,
  LayoutGrid,
  Home,
  Hotel,
  KeyRound,
  Layers,
  Leaf,
  Loader2,
  Paintbrush,
  Paperclip,
  Repeat,
  ScrollText,
  Send,
  Snowflake,
  Split,
  Sparkles,
  SprayCan,
  Trash2,
  Triangle,
  Truck,
  Warehouse,
  Wrench,
  X,
} from 'lucide-react'
import { submitQuote } from '@/lib/quote-submit'
import { SELECT_SERVICE_EVENT, services, type SelectServiceDetail, type ServiceId } from '@/lib/site'
import {
  activeCleanScope,
  buildScopes,
  cleanScopesFor,
  fieldStep,
  interiorFrequencies,
  isObjectTypeOf,
  needsBuildScope,
  needsCleanScope,
  needsClear,
  needsFloor,
  activeBuildScope,
  buildDeadlines,
  parseRenoWorks,
  renoWorks,
  triOptions,
  wallConditions,
  type RenoWork,
  needsMove,
  activeClearExtras,
  clearExtrasFor,
  clearModes,
  clearPlaces,
  disposeShares,
  parseClearAreas,
  placeArea,
  placeFill,
  type ClearMode,
  type ClearPlace,
  needsGeneral,
  needsUnits,
  fillLevels,
  type FillLevel,
  objectScopes,
  objectTypesByScope,
  type ObjectScope,
  type ObjectType,
  parseBuildScope,
  parseCleanScope,
  parseServices,
  serviceTypes,
  stairFrequencies,
  validateStep,
  windowFrequencies,
  type BuildScope,
  type CleanScope,
  type QuoteData,
  type QuoteErrors,
} from '@/lib/quote'
import { useI18n } from '@/lib/i18n/provider'
import { format } from '@/lib/i18n/dictionaries'
import { cn } from '@/lib/utils'

const serviceIcons: Record<ServiceId, typeof Sparkles> = {
  clean: Sparkles,
  clear: Truck,
  build: Hammer,
  verwaltung: Building2,
}
const objectScopeIcons: Record<ObjectScope, typeof Sparkles> = { building: Building, unit: DoorOpen }
const objectIcons: Record<ObjectType, typeof Sparkles> = {
  mfh: Building2,
  efh: Home,
  gewerbeobjekt: Building,
  wohnung: Hotel,
  gewerbe: Briefcase,
}
const cleanScopeIcons: Record<CleanScope, typeof Sparkles> = {
  treppenhaus: Sparkles,
  muell: Trash2,
  hausmeister: KeyRound,
  winter: Snowflake,
  garten: Leaf,
  innen: SprayCan,
  endreinigung: KeyRound,
  fenster: AppWindow,
  sonder: Brush,
}
const renoWorkIcons: Record<RenoWork, typeof Sparkles> = {
  paint: Paintbrush,
  wallpaper: ScrollText,
  floor: LayoutGrid,
  doors: DoorOpen,
}
const clearModeIcons: Record<ClearMode, typeof Sparkles> = { dispose: Trash2, move: Truck, mixed: Split }
const clearPlaceIcons: Record<ClearPlace, typeof Sparkles> = {
  living: Home,
  keller: Warehouse,
  attic: Triangle,
  garage: Car,
  office: Briefcase,
}
const buildScopeIcons: Record<BuildScope, typeof Sparkles> = {
  renovierung: Paintbrush,
  trockenbau: Layers,
  sanierung: Wrench,
  glasfaser: Cable,
}

const emptyData: QuoteData = {
  service: '',
  objectScope: '',
  objectType: '',
  cleanScope: '',
  buildScope: '',
  serviceType: '',
  units: '',
  company: '',
  address: '',
  billingAddress: '',
  area: '',
  floor: '',
  elevator: '',
  distance: '',
  clearMode: '',
  clearAreas: '',
  livingArea: '',
  livingFill: '',
  rooms: '',
  kellerArea: '',
  kellerFill: '',
  atticArea: '',
  atticFill: '',
  garageArea: '',
  garageFill: '',
  officeArea: '',
  officeFill: '',
  disposeShare: '',
  newAddress: '',
  newFloor: '',
  newElevator: '',
  clearExtras: '',
  buildDeadline: '',
  renoWorks: '',
  renoArea: '',
  renoRooms: '',
  wallCondition: '',
  floorArea: '',
  doors: '',
  fiberUnits: '',
  fiberStoreys: '',
  fiberEntrances: '',
  fiberConnection: '',
  fiberDucts: '',
  stairwells: '',
  storeys: '',
  stairFrequency: '',
  bins: '',
  sidewalk: '',
  gardenArea: '',
  interiorArea: '',
  interiorFrequency: '',
  windows: '',
  glassArea: '',
  windowFrequency: '',
  name: '',
  email: '',
  phone: '',
  notes: '',
  privacy: false,
}

const inputClass =
  'w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground/70 transition-colors focus-visible:border-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/25 aria-invalid:border-destructive'

function FieldError({ id, message }: { id: string; message?: string | undefined }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1.5 text-sm text-destructive">
      {message}
    </p>
  )
}

function Label({ htmlFor, children, optional }: { htmlFor?: string | undefined; children: React.ReactNode; optional?: string | undefined }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline gap-2 text-sm font-medium text-foreground">
      {children}
      {optional ? (
        <span className="text-xs font-normal text-muted-foreground">({optional})</span>
      ) : (
        <span className="text-destructive" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
}

function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  icon: Icon,
  title,
  subtitle,
  invalid,
}: {
  name: string
  value: string
  checked: boolean
  onChange: (v: string) => void
  icon: typeof Sparkles
  title: string
  subtitle?: string | undefined
  invalid?: boolean | undefined
}) {
  return (
    <label
      className={cn(
        'relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-accent/30',
        checked ? 'border-accent bg-accent/5 shadow-sm' : 'border-border bg-background hover:border-accent/50',
        invalid && !checked && 'border-destructive/60',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-md transition-colors',
          checked ? 'bg-accent text-accent-foreground' : 'bg-secondary text-primary',
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="font-semibold text-primary">{title}</span>
        {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
      </span>
      {checked && (
        <span className="absolute end-3 top-3 flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Check className="size-3" aria-hidden="true" />
        </span>
      )}
    </label>
  )
}

function UnitInput({
  id,
  value,
  onChange,
  unit,
  invalid,
  describedBy,
  min,
  max,
  step,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  unit?: string | undefined
  invalid?: boolean | undefined
  describedBy?: string | undefined
  min: number
  max: number
  step?: number | undefined
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={cn(inputClass, unit && 'pe-12')}
        dir="ltr"
      />
      {unit && (
        <span className="pointer-events-none absolute inset-y-0 end-3.5 flex items-center text-sm text-muted-foreground">
          {unit}
        </span>
      )}
    </div>
  )
}

/** Compact single-choice buttons, e.g. for a cleaning frequency. */
function PillGroup<T extends string>({
  name,
  legend,
  options,
  labels,
  value,
  onChange,
  error,
}: {
  name: string
  legend: string
  options: readonly T[]
  labels: Record<T, string>
  value: string
  onChange: (v: T) => void
  error?: string | undefined
}) {
  return (
    <fieldset className="sm:col-span-2" aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="mb-3 text-sm font-medium text-foreground">
        {legend} <span className="text-destructive">*</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label
            key={opt}
            className={cn(
              'flex cursor-pointer items-center justify-center rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-accent/30',
              value === opt
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-border bg-background text-primary hover:border-accent/50',
              error && value !== opt && 'border-destructive/60',
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="sr-only"
            />
            {labels[opt]}
          </label>
        ))}
      </div>
      <FieldError id={`${name}-error`} message={error} />
    </fieldset>
  )
}

/** Labelled number input with an optional hint and unit. */
function NumberField({
  id,
  label,
  value,
  onChange,
  unit,
  hint,
  error,
  optional,
  min,
  max,
  step,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  unit?: string | undefined
  hint?: string | undefined
  error?: string | undefined
  optional?: string | undefined
  min: number
  max: number
  step?: number | undefined
}) {
  return (
    <div>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <UnitInput
        id={id}
        value={value}
        onChange={onChange}
        unit={unit}
        min={min}
        max={max}
        step={step}
        invalid={!!error}
        describedBy={[error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

function ScopeGroup<T extends string>({
  name,
  legend,
  hint,
  options,
  selected,
  onChange,
  icons,
  labels,
  error,
}: {
  name: 'service' | 'cleanScope' | 'buildScope' | 'clearAreas' | 'renoWorks'
  legend: string
  hint: string
  options: readonly T[]
  selected: T[]
  onChange: (value: string) => void
  icons: Record<T, typeof Sparkles>
  labels: Record<T, { title: string; subtitle: string }>
  error?: string | undefined
}) {
  return (
    <fieldset
      className="animate-in fade-in slide-in-from-top-1 duration-300"
      aria-describedby={[error ? `${name}-error` : null, `${name}-hint`].filter(Boolean).join(' ')}
    >
      <legend className="mb-1 text-sm font-medium text-foreground">
        {legend} <span className="text-destructive">*</span>
      </legend>
      <p id={`${name}-hint`} className="mb-3 text-xs text-muted-foreground">
        {hint}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const checked = selected.includes(option)
          const Icon: typeof Sparkles = icons[option]
          const toggle = () =>
            onChange((checked ? selected.filter((v) => v !== option) : [...selected, option]).join(','))
          return (
            <label
              key={option}
              className={cn(
                'relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-accent/30',
                checked ? 'border-accent bg-accent/5 shadow-sm' : 'border-border bg-background hover:border-accent/50',
                error && !checked && 'border-destructive/60',
              )}
            >
              <input type="checkbox" name={name} value={option} checked={checked} onChange={toggle} className="sr-only" />
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-md transition-colors',
                  checked ? 'bg-accent text-accent-foreground' : 'bg-secondary text-primary',
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col pe-6">
                <span className="font-semibold text-primary">{labels[option].title}</span>
                <span className="text-sm text-muted-foreground">{labels[option].subtitle}</span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'absolute end-3 top-3 flex size-5 items-center justify-center rounded border transition-colors',
                  checked ? 'border-accent bg-accent text-accent-foreground' : 'border-input bg-background',
                )}
              >
                {checked && <Check className="size-3" />}
              </span>
            </label>
          )
        })}
      </div>
      <FieldError id={`${name}-error`} message={error} />
    </fieldset>
  )
}

export function QuoteForm() {
  const { t } = useI18n()
  const f = t.form
  const [step, setStep] = useState(0)
  const [data, setData] = useState<QuoteData>(emptyData)
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<QuoteErrors>({})
  const [formError, setFormError] = useState(false)
  const [reference, setReference] = useState('')
  const honeypotRef = useRef<HTMLInputElement>(null)
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const totalSteps = f.steps.length

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<SelectServiceDetail>).detail
      const merge = (current: string, extra: readonly string[] = []) =>
        Array.from(new Set([...current.split(',').filter(Boolean), ...extra])).join(',')
      setDone(false)
      setStep(0)
      setErrors({})
      setData((d) => ({
        ...d,
        service: merge(d.service, [detail.service]),
        cleanScope: merge(d.cleanScope, detail.cleanScope),
        buildScope: merge(d.buildScope, detail.buildScope),
      }))
    }
    window.addEventListener(SELECT_SERVICE_EVENT, handler)
    return () => window.removeEventListener(SELECT_SERVICE_EVENT, handler)
  }, [])

  const update = <K extends keyof QuoteData>(key: K, value: QuoteData[K]) => {
    setData((d) => ({ ...d, [key]: value }))
    setErrors((e) => {
      if (!e[key]) return e
      const { [key]: _removed, ...rest } = e
      return rest
    })
  }

  const err = (key: keyof QuoteErrors) => (errors[key] ? f.errors[errors[key]!] : undefined)
  const described = (key: keyof QuoteErrors, hint?: string) =>
    [errors[key] ? `${key}-error` : null, hint].filter(Boolean).join(' ') || undefined

  const goTo = (next: number) => {
    setStep(next)
    setFormError(false)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  const handleNext = () => {
    const stepErrors = validateStep(step, data, files)
    setErrors(stepErrors)
    if (Object.keys(stepErrors).length > 0) {
      setFormError(true)
      return
    }
    goTo(step + 1)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (step < totalSteps - 1) return handleNext()

    const stepErrors = validateStep(step, data, files)
    setErrors(stepErrors)
    if (Object.keys(stepErrors).length > 0) {
      setFormError(true)
      return
    }

    startTransition(async () => {
      const result = await submitQuote(data, files, honeypotRef.current?.value ?? '')
      if (result.ok) {
        setReference(result.ref)
        setDone(true)
        return
      }
      if (result.reason === 'tooLarge') {
        setErrors({ files: 'filesTotal' })
        setStep(fieldStep.files)
      }
      setFormError(true)
    })
  }

  const addFiles = (list: FileList | null) => {
    if (!list) return
    // Copy now: `list` is the input's live FileList, which is emptied when the value is reset below.
    const picked = Array.from(list)
    setFiles((prev) => [...prev, ...picked])
    setErrors(({ files: _removed, ...rest }) => rest)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const reset = () => {
    setData(emptyData)
    setFiles([])
    setErrors({})
    setDone(false)
    setStep(0)
  }

  if (done) {
    const serviceName = services.filter((s) => parseServices(data.service).includes(s.id)).map((s) => s.name).join(', ')
    const clean = activeCleanScope(data)
    const general = needsGeneral(data.service)
    const has = (c: CleanScope) => clean.includes(c)
    const pick = <K extends string>(labels: Record<K, string>, key: string) => labels[key as K] ?? ''
    const fillLabels = Object.fromEntries(fillLevels.map((l) => [l, f.fillLevels[l].title])) as Record<FillLevel, string>
    const summary = [
      ...(reference ? [[f.reference, reference]] : []),
      [f.service, serviceName],
      ...(clean.length ? [[f.cleanScope, clean.map((c) => f.cleanScopes[c].title).join(', ')]] : []),
      ...(needsBuildScope(data.service)
        ? [[f.buildScope, parseBuildScope(data.buildScope).map((c) => f.buildScopes[c].title).join(', ')]]
        : []),
      [f.objectType, pick(f.objectTypes, data.objectType)],
      ...(general ? [[f.serviceType, f.serviceTypes[data.serviceType as keyof typeof f.serviceTypes]?.title]] : []),
      ...(needsUnits(data) ? [[f.units, data.units]] : []),
      [f.address, data.address],
      ...(data.billingAddress.trim() ? [[f.billingAddress, data.billingAddress]] : []),
      ...(data.company.trim() ? [[f.company, data.company]] : []),
      ...(general ? [[f.area, `${data.area} ${f.areaUnit}`]] : []),
      ...(needsFloor(data.service)
        ? [
            [f.floor, data.floor],
            [f.elevator, data.elevator === 'yes' ? f.yes : f.no],
          ]
        : []),
      ...(needsClear(data.service)
        ? [
            [f.clearMode, pick(Object.fromEntries(clearModes.map((m) => [m, f.clearModes[m].title])), data.clearMode)],
            ...parseClearAreas(data.clearAreas).map((place) => [
              f.clearPlaces[place].title,
              `${data[placeArea[place]]} ${f.areaUnit}, ${pick(fillLabels, data[placeFill[place]])}` +
                (place === 'living' ? `, ${data.rooms} ${f.rooms}` : ''),
            ]),
            ...(data.clearMode === 'mixed' ? [[f.disposeShare, pick(f.disposeShares, data.disposeShare)]] : []),
            ...(needsMove(data)
              ? [
                  [f.newAddress, data.newAddress],
                  [f.newFloor, data.newFloor],
                  [f.newElevator, data.newElevator === 'yes' ? f.yes : f.no],
                  [f.distance, `${data.distance} ${f.distanceUnit}`],
                ]
              : []),
            ...(activeClearExtras(data).length
              ? [[f.clearExtras, activeClearExtras(data).map((x) => f.clearExtraLabels[x]).join(', ')]]
              : []),
          ]
        : []),
      ...(activeBuildScope(data).length
        ? [
            [f.buildDeadline, pick(f.buildDeadlines, data.buildDeadline)],
            ...(activeBuildScope(data).includes('renovierung')
              ? [
                  [f.renoWorks, parseRenoWorks(data.renoWorks).map((w) => f.renoWorkLabels[w].title).join(', ')],
                  [f.renoArea, `${data.renoArea} ${f.areaUnit}, ${data.renoRooms} ${f.renoRooms}`],
                  ...(data.wallCondition ? [[f.wallCondition, pick(f.wallConditions, data.wallCondition)]] : []),
                  ...(parseRenoWorks(data.renoWorks).includes('floor') ? [[f.floorArea, `${data.floorArea} ${f.areaUnit}`]] : []),
                  ...(parseRenoWorks(data.renoWorks).includes('doors') ? [[f.doors, data.doors]] : []),
                ]
              : []),
            ...(activeBuildScope(data).includes('glasfaser')
              ? [
                  [f.fiberUnits, data.fiberUnits],
                  [f.fiberStoreys, `${data.fiberStoreys} / ${data.fiberEntrances}`],
                  [f.fiberConnection, pick(f.triOptions, data.fiberConnection)],
                  [f.fiberDucts, pick(f.triOptions, data.fiberDucts)],
                ]
              : []),
          ]
        : []),
      ...(has('treppenhaus')
        ? [
            [f.stairwells, data.stairwells],
            [f.storeys, data.storeys],
            [f.stairFrequency, pick(f.stairFrequencies, data.stairFrequency)],
          ]
        : []),
      ...(has('muell') ? [[f.bins, data.bins]] : []),
      ...(has('winter') ? [[f.sidewalk, `${data.sidewalk} ${f.meterUnit}`]] : []),
      ...(has('garten') ? [[f.gardenArea, `${data.gardenArea} ${f.areaUnit}`]] : []),
      ...(has('innen') || has('endreinigung') ? [[f.interiorArea, `${data.interiorArea} ${f.areaUnit}`]] : []),
      ...(has('innen') ? [[f.interiorFrequency, pick(f.interiorFrequencies, data.interiorFrequency)]] : []),
      ...(has('fenster')
        ? [
            [f.windows, data.windows],
            ...(data.glassArea.trim() ? [[f.glassArea, `${data.glassArea} ${f.areaUnit}`]] : []),
            [f.windowFrequency, pick(f.windowFrequencies, data.windowFrequency)],
          ]
        : []),
    ]
    return (
      <div role="status" className="flex flex-col items-center py-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <span className="flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </span>
        <h3 className="mt-6 text-2xl font-bold text-primary">{f.successTitle}</h3>
        <p className="mt-2 max-w-md text-pretty text-muted-foreground">{f.successText}</p>
        <div className="mt-8 w-full max-w-md rounded-lg border bg-secondary/60 p-5 text-start">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">{f.summary}</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {summary.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium text-primary">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-8 text-sm font-semibold text-primary underline underline-offset-4 hover:text-accent"
        >
          {f.newRequest}
        </button>
      </div>
    )
  }

  const serviceOptions = services.map((s) => s.id)
  const serviceLabels = Object.fromEntries(
    services.map((s) => [s.id, { title: s.name, subtitle: t.services.items[s.id].tagline }]),
  ) as Record<ServiceId, { title: string; subtitle: string }>
  const cleanNow = activeCleanScope(data)
  const clearAreasNow = parseClearAreas(data.clearAreas)
  const buildNow = activeBuildScope(data)
  const renoNow = parseRenoWorks(data.renoWorks)
  const fillLabels = Object.fromEntries(fillLevels.map((l) => [l, f.fillLevels[l].title])) as Record<FillLevel, string>
  const progress = ((step + 1) / totalSteps) * 100
  const stepTitle = [f.step1Title, f.step2Title, f.step3Title][step]

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-primary">{f.steps[step]}</span>
          <span className="text-muted-foreground">
            {format(f.progress, { current: step + 1, total: totalSteps })}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-valuenow={step + 1}
          aria-valuetext={format(f.progress, { current: step + 1, total: totalSteps })}
          className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="mt-4 hidden grid-cols-3 gap-2 sm:grid">
          {f.steps.map((label, i) => (
            <li
              key={label}
              className={cn(
                'flex items-center gap-2 text-xs font-medium',
                i <= step ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px]',
                  i < step && 'border-accent bg-accent text-accent-foreground',
                  i === step && 'border-accent text-accent',
                )}
              >
                {i < step ? <Check className="size-3" aria-hidden="true" /> : i + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
      </div>

      <div key={step} className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h3 ref={headingRef} tabIndex={-1} className="text-xl font-bold text-primary outline-none">
          {stepTitle}
        </h3>

        {step === 0 && (
          <div className="mt-6 flex flex-col gap-6">
            <ScopeGroup
              name="service"
              legend={f.service}
              hint={f.cleanScopeHint}
              options={serviceOptions}
              selected={parseServices(data.service) as ServiceId[]}
              onChange={(v) => update('service', v)}
              icons={serviceIcons}
              labels={serviceLabels}
              error={err('service')}
            />

            <fieldset aria-describedby={[described('objectScope'), 'objectScope-hint'].filter(Boolean).join(' ')}>
              <legend className="mb-1 text-sm font-medium text-foreground">
                {f.objectScope} <span className="text-destructive">*</span>
              </legend>
              <p id="objectScope-hint" className="mb-3 text-xs text-muted-foreground">
                {f.objectScopeHint}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {objectScopes.map((o) => (
                  <ChoiceCard
                    key={o}
                    name="objectScope"
                    value={o}
                    checked={data.objectScope === o}
                    onChange={(v) => {
                      update('objectScope', v)
                      if (!isObjectTypeOf(v, data.objectType)) update('objectType', '')
                    }}
                    icon={objectScopeIcons[o]}
                    title={f.objectScopes[o].title}
                    subtitle={f.objectScopes[o].subtitle}
                    invalid={!!errors.objectScope}
                  />
                ))}
              </div>
              <FieldError id="objectScope-error" message={err('objectScope')} />
            </fieldset>

            {data.objectScope && (
              <fieldset className="animate-in fade-in duration-300" aria-describedby={described('objectType')}>
                <legend className="mb-3 text-sm font-medium text-foreground">
                  {f.objectType} <span className="text-destructive">*</span>
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {objectTypesByScope[data.objectScope as ObjectScope].map((o) => (
                    <ChoiceCard
                      key={o}
                      name="objectType"
                      value={o}
                      checked={data.objectType === o}
                      onChange={(v) => update('objectType', v)}
                      icon={objectIcons[o]}
                      title={f.objectTypes[o]}
                      invalid={!!errors.objectType}
                    />
                  ))}
                </div>
                <FieldError id="objectType-error" message={err('objectType')} />
              </fieldset>
            )}

            {needsCleanScope(data.service) && isObjectTypeOf(data.objectScope, data.objectType) && (
              <ScopeGroup
                name="cleanScope"
                legend={f.cleanScope}
                hint={f.cleanScopeHint}
                options={cleanScopesFor(data.objectType)}
                selected={activeCleanScope(data)}
                onChange={(v) => {
                  // Keep choices hidden for this property type, in case the customer switches back.
                  const offered = cleanScopesFor(data.objectType)
                  const hidden = parseCleanScope(data.cleanScope).filter((c) => !offered.includes(c))
                  update('cleanScope', [...hidden, ...v.split(',').filter(Boolean)].join(','))
                }}
                icons={cleanScopeIcons}
                labels={f.cleanScopes}
                error={err('cleanScope')}
              />
            )}

            {needsBuildScope(data.service) && (
              <ScopeGroup
                name="buildScope"
                legend={f.buildScope}
                hint={f.cleanScopeHint}
                options={buildScopes}
                selected={parseBuildScope(data.buildScope)}
                onChange={(v) => update('buildScope', v)}
                icons={buildScopeIcons}
                labels={f.buildScopes}
                error={err('buildScope')}
              />
            )}
          </div>
        )}

        {step === 1 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <p className="rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-primary sm:col-span-2">
              {f.estimateNote}
            </p>

            {needsGeneral(data.service) && (
              <fieldset
                className="sm:col-span-2"
                aria-describedby={described('serviceType', parseServices(data.service).length > 1 ? 'serviceType-hint' : undefined)}
              >
                <legend className="mb-3 text-sm font-medium text-foreground">
                  {f.serviceType} <span className="text-destructive">*</span>
                </legend>
                {parseServices(data.service).length > 1 && (
                  <p id="serviceType-hint" className="-mt-1.5 mb-3 text-xs text-muted-foreground">
                    {f.serviceTypeHintMixed}
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  {serviceTypes.map((type) => (
                    <ChoiceCard
                      key={type}
                      name="serviceType"
                      value={type}
                      checked={data.serviceType === type}
                      onChange={(v) => update('serviceType', v)}
                      icon={type === 'recurring' ? Repeat : CalendarCheck}
                      title={f.serviceTypes[type].title}
                      subtitle={f.serviceTypes[type].subtitle}
                      invalid={!!errors.serviceType}
                    />
                  ))}
                </div>
                <FieldError id="serviceType-error" message={err('serviceType')} />
              </fieldset>
            )}

            {needsUnits(data) && (
              <div className="sm:col-span-2 sm:max-w-xs">
                <NumberField
                  id="units"
                  label={f.units}
                  value={data.units}
                  onChange={(v) => update('units', v)}
                  min={1}
                  max={9999}
                  step={1}
                  hint={f.unitsHint}
                  error={err('units')}
                />
              </div>
            )}

            {needsGeneral(data.service) && (
              <NumberField
                id="area"
                label={f.area}
                value={data.area}
                onChange={(v) => update('area', v)}
                unit={f.areaUnit}
                min={1}
                max={100000}
                error={err('area')}
              />
            )}

            {needsFloor(data.service) && (
              <>
                <NumberField
                  id="floor"
                  label={f.floor}
                  value={data.floor}
                  onChange={(v) => update('floor', v)}
                  min={-2}
                  max={99}
                  step={1}
                  hint={needsMove(data) ? `${f.floorHint} · ${f.floorMoveHint}` : f.floorHint}
                  error={err('floor')}
                />
                <PillGroup
                  name="elevator"
                  legend={f.elevator}
                  options={['yes', 'no'] as const}
                  labels={{ yes: f.yes, no: f.no }}
                  value={data.elevator}
                  onChange={(v) => update('elevator', v)}
                  error={err('elevator')}
                />
              </>
            )}

            {needsClear(data.service) && (
              <div className="grid gap-5 border-t pt-5 sm:col-span-2 sm:grid-cols-2 animate-in fade-in duration-300">
                <h4 className="text-base font-semibold text-primary sm:col-span-2">{f.clearDetails}</h4>
                <fieldset className="sm:col-span-2" aria-describedby={described('clearMode')}>
                  <legend className="mb-3 text-sm font-medium text-foreground">
                    {f.clearMode} <span className="text-destructive">*</span>
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {clearModes.map((mode) => (
                      <ChoiceCard
                        key={mode}
                        name="clearMode"
                        value={mode}
                        checked={data.clearMode === mode}
                        onChange={(v) => update('clearMode', v)}
                        icon={clearModeIcons[mode]}
                        title={f.clearModes[mode].title}
                        subtitle={f.clearModes[mode].subtitle}
                        invalid={!!errors.clearMode}
                      />
                    ))}
                  </div>
                  <FieldError id="clearMode-error" message={err('clearMode')} />
                </fieldset>

                <div className="sm:col-span-2">
                  <ScopeGroup
                    name="clearAreas"
                    legend={f.clearAreas}
                    hint={f.cleanScopeHint}
                    options={clearPlaces}
                    selected={clearAreasNow}
                    onChange={(v) => update('clearAreas', v)}
                    icons={clearPlaceIcons}
                    labels={f.clearPlaces}
                    error={err('clearAreas')}
                  />
                </div>

                {clearAreasNow.map((place) => (
                  <div key={place} className="grid gap-4 rounded-lg border bg-secondary/30 p-4 sm:col-span-2 sm:grid-cols-2">
                    <p className="font-semibold text-primary sm:col-span-2">{f.clearPlaces[place].title}</p>
                    <NumberField
                      id={placeArea[place]}
                      label={f.placeArea}
                      value={data[placeArea[place]]}
                      onChange={(v) => update(placeArea[place], v)}
                      unit={f.areaUnit}
                      min={1}
                      max={100000}
                      hint={f.approxHint}
                      error={err(placeArea[place])}
                    />
                    {place === 'living' && (
                      <NumberField
                        id="rooms"
                        label={f.rooms}
                        value={data.rooms}
                        onChange={(v) => update('rooms', v)}
                        min={1}
                        max={50}
                        step={1}
                        error={err('rooms')}
                      />
                    )}
                    <PillGroup
                      name={placeFill[place]}
                      legend={f.placeFill}
                      options={fillLevels}
                      labels={fillLabels}
                      value={data[placeFill[place]]}
                      onChange={(v) => update(placeFill[place], v)}
                      error={err(placeFill[place])}
                    />
                  </div>
                ))}

                {data.clearMode === 'mixed' && (
                  <PillGroup
                    name="disposeShare"
                    legend={f.disposeShare}
                    options={disposeShares}
                    labels={f.disposeShares}
                    value={data.disposeShare}
                    onChange={(v) => update('disposeShare', v)}
                    error={err('disposeShare')}
                  />
                )}

                {needsMove(data) && (
                  <>
                    <div className="sm:col-span-2">
                      <Label htmlFor="newAddress">{f.newAddress}</Label>
                      <input
                        id="newAddress"
                        value={data.newAddress}
                        onChange={(e) => update('newAddress', e.target.value)}
                        autoComplete="off"
                        placeholder={f.addressPlaceholder}
                        maxLength={200}
                        aria-invalid={!!errors.newAddress}
                        aria-describedby={described('newAddress')}
                        className={inputClass}
                      />
                      <FieldError id="newAddress-error" message={err('newAddress')} />
                    </div>
                    <NumberField
                      id="newFloor"
                      label={f.newFloor}
                      value={data.newFloor}
                      onChange={(v) => update('newFloor', v)}
                      min={-2}
                      max={99}
                      step={1}
                      hint={f.floorHint}
                      error={err('newFloor')}
                    />
                    <NumberField
                      id="distance"
                      label={f.distance}
                      value={data.distance}
                      onChange={(v) => update('distance', v)}
                      unit={f.distanceUnit}
                      min={0}
                      max={1000}
                      hint={f.distanceHint}
                      error={err('distance')}
                    />
                    <PillGroup
                      name="newElevator"
                      legend={f.newElevator}
                      options={['yes', 'no'] as const}
                      labels={{ yes: f.yes, no: f.no }}
                      value={data.newElevator}
                      onChange={(v) => update('newElevator', v)}
                      error={err('newElevator')}
                    />
                  </>
                )}

                {clearExtrasFor(data.clearMode).length > 0 && (
                  <fieldset className="sm:col-span-2">
                    <legend className="mb-3 flex items-baseline gap-2 text-sm font-medium text-foreground">
                      {f.clearExtras}
                      <span className="text-xs font-normal text-muted-foreground">({f.optional})</span>
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {clearExtrasFor(data.clearMode).map((extra) => {
                        const picked = activeClearExtras(data)
                        const checked = picked.includes(extra)
                        return (
                          <label key={extra} className="flex items-start gap-3 text-sm text-primary">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                update(
                                  'clearExtras',
                                  (checked ? picked.filter((x) => x !== extra) : [...picked, extra]).join(','),
                                )
                              }
                              className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                            />
                            {f.clearExtraLabels[extra]}
                          </label>
                        )
                      })}
                    </div>
                  </fieldset>
                )}

                <p className="flex items-start gap-2 text-sm text-muted-foreground sm:col-span-2">
                  <Camera className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {f.photoHint}
                </p>
              </div>
            )}

            {buildNow.length > 0 && (
              <div className="grid gap-5 border-t pt-5 sm:col-span-2 sm:grid-cols-2 animate-in fade-in duration-300">
                <h4 className="text-base font-semibold text-primary sm:col-span-2">{f.buildDetails}</h4>
                <PillGroup
                  name="buildDeadline"
                  legend={f.buildDeadline}
                  options={buildDeadlines}
                  labels={f.buildDeadlines}
                  value={data.buildDeadline}
                  onChange={(v) => update('buildDeadline', v)}
                  error={err('buildDeadline')}
                />
                {buildNow.includes('renovierung') && (
                  <>
                    <div className="sm:col-span-2">
                      <ScopeGroup
                        name="renoWorks"
                        legend={f.renoWorks}
                        hint={f.cleanScopeHint}
                        options={renoWorks}
                        selected={renoNow}
                        onChange={(v) => update('renoWorks', v)}
                        icons={renoWorkIcons}
                        labels={f.renoWorkLabels}
                        error={err('renoWorks')}
                      />
                    </div>
                    <NumberField
                      id="renoArea"
                      label={f.renoArea}
                      value={data.renoArea}
                      onChange={(v) => update('renoArea', v)}
                      unit={f.areaUnit}
                      min={1}
                      max={10000}
                      hint={f.approxHint}
                      error={err('renoArea')}
                    />
                    <NumberField
                      id="renoRooms"
                      label={f.renoRooms}
                      value={data.renoRooms}
                      onChange={(v) => update('renoRooms', v)}
                      min={1}
                      max={50}
                      step={1}
                      error={err('renoRooms')}
                    />
                    {(renoNow.includes('paint') || renoNow.includes('wallpaper')) && (
                      <PillGroup
                        name="wallCondition"
                        legend={f.wallCondition}
                        options={wallConditions}
                        labels={f.wallConditions}
                        value={data.wallCondition}
                        onChange={(v) => update('wallCondition', v)}
                        error={err('wallCondition')}
                      />
                    )}
                    {renoNow.includes('floor') && (
                      <NumberField
                        id="floorArea"
                        label={f.floorArea}
                        value={data.floorArea}
                        onChange={(v) => update('floorArea', v)}
                        unit={f.areaUnit}
                        min={1}
                        max={10000}
                        hint={f.approxHint}
                        error={err('floorArea')}
                      />
                    )}
                    {renoNow.includes('doors') && (
                      <NumberField
                        id="doors"
                        label={f.doors}
                        value={data.doors}
                        onChange={(v) => update('doors', v)}
                        min={1}
                        max={200}
                        step={1}
                        error={err('doors')}
                      />
                    )}
                  </>
                )}
                {buildNow.includes('glasfaser') && (
                  <>
                    <NumberField
                      id="fiberUnits"
                      label={f.fiberUnits}
                      value={data.fiberUnits}
                      onChange={(v) => update('fiberUnits', v)}
                      min={1}
                      max={9999}
                      step={1}
                      error={err('fiberUnits')}
                    />
                    <NumberField
                      id="fiberStoreys"
                      label={f.fiberStoreys}
                      value={data.fiberStoreys}
                      onChange={(v) => update('fiberStoreys', v)}
                      min={1}
                      max={99}
                      step={1}
                      error={err('fiberStoreys')}
                    />
                    <NumberField
                      id="fiberEntrances"
                      label={f.fiberEntrances}
                      value={data.fiberEntrances}
                      onChange={(v) => update('fiberEntrances', v)}
                      min={1}
                      max={99}
                      step={1}
                      error={err('fiberEntrances')}
                    />
                    <PillGroup
                      name="fiberConnection"
                      legend={f.fiberConnection}
                      options={triOptions}
                      labels={f.triOptions}
                      value={data.fiberConnection}
                      onChange={(v) => update('fiberConnection', v)}
                      error={err('fiberConnection')}
                    />
                    <PillGroup
                      name="fiberDucts"
                      legend={f.fiberDucts}
                      options={triOptions}
                      labels={f.triOptions}
                      value={data.fiberDucts}
                      onChange={(v) => update('fiberDucts', v)}
                      error={err('fiberDucts')}
                    />
                  </>
                )}
                {buildNow.includes('sanierung') && (
                  <p className="flex items-start gap-2 text-sm text-muted-foreground sm:col-span-2">
                    <Camera className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {f.sanierungHint}
                  </p>
                )}
              </div>
            )}

            {cleanNow.length > 0 && (
              <div className="grid gap-5 border-t pt-5 sm:col-span-2 sm:grid-cols-2 animate-in fade-in duration-300">
                <h4 className="text-base font-semibold text-primary sm:col-span-2">{f.cleanDetails}</h4>
                {cleanNow.includes('treppenhaus') && (
                  <>
                    <NumberField
                      id="stairwells"
                      label={f.stairwells}
                      value={data.stairwells}
                      onChange={(v) => update('stairwells', v)}
                      min={1}
                      max={99}
                      step={1}
                      error={err('stairwells')}
                    />
                    <NumberField
                      id="storeys"
                      label={f.storeys}
                      value={data.storeys}
                      onChange={(v) => update('storeys', v)}
                      min={1}
                      max={99}
                      step={1}
                      hint={f.storeysHint}
                      error={err('storeys')}
                    />
                    <PillGroup
                      name="stairFrequency"
                      legend={f.stairFrequency}
                      options={stairFrequencies}
                      labels={f.stairFrequencies}
                      value={data.stairFrequency}
                      onChange={(v) => update('stairFrequency', v)}
                      error={err('stairFrequency')}
                    />
                  </>
                )}
                {cleanNow.includes('muell') && (
                  <NumberField
                    id="bins"
                    label={f.bins}
                    value={data.bins}
                    onChange={(v) => update('bins', v)}
                    min={1}
                    max={999}
                    step={1}
                    error={err('bins')}
                  />
                )}
                {cleanNow.includes('winter') && (
                  <NumberField
                    id="sidewalk"
                    label={f.sidewalk}
                    value={data.sidewalk}
                    onChange={(v) => update('sidewalk', v)}
                    unit={f.meterUnit}
                    min={1}
                    max={10000}
                    hint={f.sidewalkHint}
                    error={err('sidewalk')}
                  />
                )}
                {cleanNow.includes('garten') && (
                  <NumberField
                    id="gardenArea"
                    label={f.gardenArea}
                    value={data.gardenArea}
                    onChange={(v) => update('gardenArea', v)}
                    unit={f.areaUnit}
                    min={1}
                    max={1000000}
                    hint={f.gardenAreaHint}
                    error={err('gardenArea')}
                  />
                )}
                {(cleanNow.includes('innen') || cleanNow.includes('endreinigung')) && (
                  <NumberField
                    id="interiorArea"
                    label={f.interiorArea}
                    value={data.interiorArea}
                    onChange={(v) => update('interiorArea', v)}
                    unit={f.areaUnit}
                    min={1}
                    max={100000}
                    hint={f.interiorAreaHint}
                    error={err('interiorArea')}
                  />
                )}
                {cleanNow.includes('innen') && (
                  <PillGroup
                    name="interiorFrequency"
                    legend={f.interiorFrequency}
                    options={interiorFrequencies}
                    labels={f.interiorFrequencies}
                    value={data.interiorFrequency}
                    onChange={(v) => update('interiorFrequency', v)}
                    error={err('interiorFrequency')}
                  />
                )}
                {cleanNow.includes('fenster') && (
                  <>
                    <NumberField
                      id="windows"
                      label={f.windows}
                      value={data.windows}
                      onChange={(v) => update('windows', v)}
                      min={0}
                      max={9999}
                      step={1}
                      hint={f.windowsHint}
                      error={err('windows')}
                    />
                    <NumberField
                      id="glassArea"
                      label={f.glassArea}
                      value={data.glassArea}
                      onChange={(v) => update('glassArea', v)}
                      unit={f.areaUnit}
                      min={0}
                      max={100000}
                      hint={f.approxHint}
                      optional={f.optional}
                      error={err('glassArea')}
                    />
                    <PillGroup
                      name="windowFrequency"
                      legend={f.windowFrequency}
                      options={windowFrequencies}
                      labels={f.windowFrequencies}
                      value={data.windowFrequency}
                      onChange={(v) => update('windowFrequency', v)}
                      error={err('windowFrequency')}
                    />
                  </>
                )}
                {cleanNow.includes('sonder') && (
                  <p className="text-sm text-muted-foreground sm:col-span-2">{f.sonderNote}</p>
                )}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">{f.name}</Label>
              <input
                id="name"
                value={data.name}
                onChange={(e) => update('name', e.target.value)}
                autoComplete="name"
                aria-invalid={!!errors.name}
                aria-describedby={described('name')}
                className={inputClass}
              />
              <FieldError id="name-error" message={err('name')} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="company" optional={f.optional}>
                {f.company}
              </Label>
              <input
                id="company"
                value={data.company}
                onChange={(e) => update('company', e.target.value)}
                autoComplete="organization"
                maxLength={150}
                aria-invalid={!!errors.company}
                aria-describedby={described('company')}
                className={inputClass}
              />
              <FieldError id="company-error" message={err('company')} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="address">{f.address}</Label>
              <input
                id="address"
                value={data.address}
                onChange={(e) => update('address', e.target.value)}
                autoComplete="street-address"
                placeholder={f.addressPlaceholder}
                maxLength={200}
                aria-invalid={!!errors.address}
                aria-describedby={described('address')}
                className={inputClass}
              />
              <FieldError id="address-error" message={err('address')} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="billingAddress" optional={f.optional}>
                {f.billingAddress}
              </Label>
              <input
                id="billingAddress"
                value={data.billingAddress}
                onChange={(e) => update('billingAddress', e.target.value)}
                autoComplete="billing street-address"
                placeholder={f.billingAddressPlaceholder}
                maxLength={200}
                aria-invalid={!!errors.billingAddress}
                aria-describedby={described('billingAddress', 'billingAddress-hint')}
                className={inputClass}
              />
              <p id="billingAddress-hint" className="mt-1.5 text-xs text-muted-foreground">
                {f.billingAddressHint}
              </p>
              <FieldError id="billingAddress-error" message={err('billingAddress')} />
            </div>

            <div>
              <Label htmlFor="email">{f.email}</Label>
              <input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => update('email', e.target.value)}
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={described('email')}
                className={inputClass}
                dir="ltr"
              />
              <FieldError id="email-error" message={err('email')} />
            </div>

            <div>
              <Label htmlFor="phone" optional={f.optional}>
                {f.phone}
              </Label>
              <input
                id="phone"
                type="tel"
                value={data.phone}
                onChange={(e) => update('phone', e.target.value)}
                autoComplete="tel"
                aria-invalid={!!errors.phone}
                aria-describedby={described('phone')}
                className={inputClass}
                dir="ltr"
              />
              <FieldError id="phone-error" message={err('phone')} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="notes">{f.notes}</Label>
              <textarea
                id="notes"
                rows={4}
                value={data.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder={f.notesPlaceholder}
                aria-invalid={!!errors.notes}
                aria-describedby={described('notes')}
                className={cn(inputClass, 'resize-y')}
              />
              <FieldError id="notes-error" message={err('notes')} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="files" optional={f.optional}>
                {f.attachments}
              </Label>
              <div
                className={cn(
                  'flex flex-col items-start gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center',
                  errors.files ? 'border-destructive' : 'border-input',
                )}
              >
                <input
                  ref={fileInputRef}
                  id="files"
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) => addFiles(e.target.files)}
                  aria-describedby={described('files', 'files-hint')}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-semibold text-primary transition-colors hover:border-accent hover:text-accent"
                >
                  <Paperclip className="size-4" aria-hidden="true" />
                  {f.attachmentsButton}
                </button>
                <p id="files-hint" className="text-xs text-muted-foreground">
                  {f.attachmentsHint}
                </p>
              </div>
              {files.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {files.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="inline-flex max-w-full items-center gap-2 rounded-full bg-secondary py-1 ps-3 pe-1 text-sm text-primary"
                    >
                      <span className="truncate" dir="ltr">
                        {file.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground" dir="ltr">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-background"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                        <span className="sr-only">{format(f.remove, { name: file.name })}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <FieldError id="files-error" message={err('files')} />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-start gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={data.privacy}
                  onChange={(e) => update('privacy', e.target.checked)}
                  aria-invalid={!!errors.privacy}
                  aria-describedby={described('privacy')}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                />
                <span>
                  {f.privacyBefore}
                  <a href="#datenschutz" className="font-medium text-primary underline underline-offset-2">
                    {f.privacyLink}
                  </a>
                  {f.privacyAfter}
                </span>
              </label>
              <FieldError id="privacy-error" message={err('privacy')} />
            </div>
          </div>
        )}
      </div>

      {/* Honeypot against spam bots: hidden from people and assistive tech, bots fill it in. */}
      {/* sr-only clips it in place; a far negative offset would widen right-to-left (Arabic) pages. */}
      <div aria-hidden="true" className="sr-only">
        <label>
          Website
          <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {formError && (
        <p role="alert" className="mt-6 text-sm font-medium text-destructive">
          {Object.keys(errors).length > 0 ? f.formError : f.errors.generic}
        </p>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-input px-5 font-semibold text-primary transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            {f.back}
          </button>
        ) : (
          <span className="hidden sm:block" />
        )}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-6 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-60"
        >
          {step < totalSteps - 1 ? (
            <>
              {f.next}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </>
          ) : pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {f.sending}
            </>
          ) : (
            <>
              <Send className="size-4 rtl:-scale-x-100" aria-hidden="true" />
              {f.submit}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
