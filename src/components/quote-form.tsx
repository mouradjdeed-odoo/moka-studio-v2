'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  CalendarCheck,
  PackageOpen,
  Boxes,
  Package,
  Cable,
  Check,
  CheckCircle2,
  Hammer,
  Home,
  Hotel,
  KeyRound,
  Layers,
  Leaf,
  Loader2,
  Paintbrush,
  Paperclip,
  Repeat,
  Send,
  Snowflake,
  Sparkles,
  Trash2,
  Truck,
  Wrench,
  X,
} from 'lucide-react'
import { submitQuote } from '@/lib/quote-submit'
import { SELECT_SERVICE_EVENT, services, type SelectServiceDetail, type ServiceId } from '@/lib/site'
import {
  buildScopes,
  cleanScopes,
  fieldStep,
  needsBuildScope,
  needsCleanScope,
  needsDistance,
  needsFillLevel,
  fillLevels,
  type FillLevel,
  objectTypes,
  parseBuildScope,
  parseCleanScope,
  parseServices,
  serviceTypes,
  validateStep,
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
const objectIcons = { wohnung: Hotel, haus: Home, gewerbe: Briefcase } as const
const cleanScopeIcons: Record<CleanScope, typeof Sparkles> = {
  treppenhaus: Sparkles,
  muell: Trash2,
  hausmeister: KeyRound,
  winter: Snowflake,
  garten: Leaf,
}
const fillLevelIcons: Record<FillLevel, typeof Sparkles> = { low: PackageOpen, normal: Package, full: Boxes }
const buildScopeIcons: Record<BuildScope, typeof Sparkles> = {
  renovierung: Paintbrush,
  trockenbau: Layers,
  sanierung: Wrench,
  glasfaser: Cable,
}

const emptyData: QuoteData = {
  service: '',
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
  fillLevel: '',
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
  name: 'service' | 'cleanScope' | 'buildScope'
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
    const summary = [
      ...(reference ? [[f.reference, reference]] : []),
      [f.service, serviceName],
      ...(needsCleanScope(data.service)
        ? [[f.cleanScope, parseCleanScope(data.cleanScope).map((c) => f.cleanScopes[c].title).join(', ')]]
        : []),
      ...(needsBuildScope(data.service)
        ? [[f.buildScope, parseBuildScope(data.buildScope).map((c) => f.buildScopes[c].title).join(', ')]]
        : []),
      [f.objectType, f.objectTypes[data.objectType as keyof typeof f.objectTypes]],
      [f.serviceType, f.serviceTypes[data.serviceType as keyof typeof f.serviceTypes]?.title],
      [f.units, data.units],
      [f.address, data.address],
      ...(data.billingAddress.trim() ? [[f.billingAddress, data.billingAddress]] : []),
      ...(data.company.trim() ? [[f.company, data.company]] : []),
      [f.area, `${data.area} ${f.areaUnit}`],
      [f.floor, data.floor],
      [f.elevator, data.elevator === 'yes' ? f.yes : f.no],
      ...(needsDistance(data.service) ? [[f.distance, `${data.distance} ${f.distanceUnit}`]] : []),
      ...(needsFillLevel(data.service)
        ? [[f.fillLevel, f.fillLevels[data.fillLevel as FillLevel]?.title]]
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

            {needsCleanScope(data.service) && (
              <ScopeGroup
                name="cleanScope"
                legend={f.cleanScope}
                hint={f.cleanScopeHint}
                options={cleanScopes}
                selected={parseCleanScope(data.cleanScope)}
                onChange={(v) => update('cleanScope', v)}
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

            <fieldset aria-describedby={described('objectType')}>
              <legend className="mb-3 text-sm font-medium text-foreground">
                {f.objectType} <span className="text-destructive">*</span>
              </legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {objectTypes.map((o) => (
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
          </div>
        )}

        {step === 1 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <fieldset className="sm:col-span-2" aria-describedby={described('serviceType')}>
              <legend className="mb-3 text-sm font-medium text-foreground">
                {f.serviceType} <span className="text-destructive">*</span>
              </legend>
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

            <div className="sm:col-span-2">
              <Label htmlFor="units">{f.units}</Label>
              <div className="sm:max-w-xs">
                <UnitInput
                  id="units"
                  value={data.units}
                  onChange={(v) => update('units', v)}
                  min={1}
                  max={9999}
                  step={1}
                  invalid={!!errors.units}
                  describedBy={described('units', 'units-hint')}
                />
              </div>
              <p id="units-hint" className="mt-1.5 text-xs text-muted-foreground">
                {f.unitsHint}
              </p>
              <FieldError id="units-error" message={err('units')} />
            </div>

            <div>
              <Label htmlFor="area">{f.area}</Label>
              <UnitInput
                id="area"
                value={data.area}
                onChange={(v) => update('area', v)}
                unit={f.areaUnit}
                min={1}
                max={100000}
                invalid={!!errors.area}
                describedBy={described('area')}
              />
              <FieldError id="area-error" message={err('area')} />
            </div>

            <div>
              <Label htmlFor="floor">{f.floor}</Label>
              <UnitInput
                id="floor"
                value={data.floor}
                onChange={(v) => update('floor', v)}
                min={-2}
                max={99}
                step={1}
                invalid={!!errors.floor}
                describedBy={described('floor', 'floor-hint')}
              />
              <p id="floor-hint" className="mt-1.5 text-xs text-muted-foreground">
                {f.floorHint}
              </p>
              <FieldError id="floor-error" message={err('floor')} />
            </div>

            <fieldset className="sm:col-span-2" aria-describedby={described('elevator')}>
              <legend className="mb-3 text-sm font-medium text-foreground">
                {f.elevator} <span className="text-destructive">*</span>
              </legend>
              <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
                {(['yes', 'no'] as const).map((opt) => (
                  <label
                    key={opt}
                    className={cn(
                      'flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 font-semibold transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-accent/30',
                      data.elevator === opt
                        ? 'border-accent bg-accent text-accent-foreground'
                        : 'border-border bg-background text-primary hover:border-accent/50',
                      errors.elevator && 'border-destructive/60',
                    )}
                  >
                    <input
                      type="radio"
                      name="elevator"
                      value={opt}
                      checked={data.elevator === opt}
                      onChange={() => update('elevator', opt)}
                      className="sr-only"
                    />
                    {opt === 'yes' ? f.yes : f.no}
                  </label>
                ))}
              </div>
              <FieldError id="elevator-error" message={err('elevator')} />
            </fieldset>

            {needsDistance(data.service) && (
              <div className="sm:col-span-2 animate-in fade-in duration-300">
                <Label htmlFor="distance">{f.distance}</Label>
                <div className="sm:max-w-xs">
                  <UnitInput
                    id="distance"
                    value={data.distance}
                    onChange={(v) => update('distance', v)}
                    unit={f.distanceUnit}
                    min={0}
                    max={1000}
                    invalid={!!errors.distance}
                    describedBy={described('distance', 'distance-hint')}
                  />
                </div>
                <p id="distance-hint" className="mt-1.5 text-xs text-muted-foreground">
                  {f.distanceHint}
                </p>
                <FieldError id="distance-error" message={err('distance')} />
              </div>
            )}

            {needsFillLevel(data.service) && (
              <fieldset className="sm:col-span-2 animate-in fade-in duration-300" aria-describedby={described('fillLevel')}>
                <legend className="mb-3 text-sm font-medium text-foreground">
                  {f.fillLevel} <span className="text-destructive">*</span>
                </legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {fillLevels.map((level) => (
                    <ChoiceCard
                      key={level}
                      name="fillLevel"
                      value={level}
                      checked={data.fillLevel === level}
                      onChange={(v) => update('fillLevel', v)}
                      icon={fillLevelIcons[level]}
                      title={f.fillLevels[level].title}
                      subtitle={f.fillLevels[level].subtitle}
                      invalid={!!errors.fillLevel}
                    />
                  ))}
                </div>
                <FieldError id="fillLevel-error" message={err('fillLevel')} />
              </fieldset>
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
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
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
