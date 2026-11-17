import { ArrowRight, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Disclaimer } from '@/components/disclaimer'
import { requestService, type Service, type SubService } from '@/lib/site'
import { useI18n } from '@/lib/i18n/provider'
import { audiences, subServiceDictionaries } from '@/lib/i18n/sub-services'

export function SubServiceDialog({
  service,
  sub,
  title,
  onClose,
}: {
  service: Service
  sub: SubService | null
  title: string
  onClose: () => void
}) {
  const { lang, dir } = useI18n()
  const sd = subServiceDictionaries[lang]
  const detail = sub ? sd.items[sub.id] : undefined

  return (
    <Dialog open={sub !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir={dir} className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {sub && (
          <>
            <div className="-mx-6 -mt-6 aspect-[16/7] overflow-hidden rounded-t-lg bg-ink">
              <img src={sub.image} alt="" className="size-full object-cover" />
            </div>
            <DialogHeader className="text-start">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent" dir="ltr">
                {service.name}
              </p>
              <DialogTitle className="text-2xl font-bold text-primary">{title}</DialogTitle>
              <DialogDescription>{sd.labels.scope}</DialogDescription>
            </DialogHeader>

            {detail && (
              <>
                <ul className="flex flex-col gap-2">
                  {detail.scope.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                        <Check className="size-3.5" aria-hidden="true" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <div>
                  <h3 className="text-sm font-semibold text-primary">{sd.labels.audience}</h3>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    {audiences.map((a) => (
                      <div key={a} className="rounded-md border border-border bg-secondary/60 p-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-accent">{sd.labels.audiences[a]}</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">{detail.audience[a]}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </>
            )}

            {service.disclaimer && <Disclaimer text={sd.disclaimers[service.disclaimer]} />}

            <button
              type="button"
              onClick={() => {
                onClose()
                requestService({ service: service.id, cleanScope: sub.cleanScope, buildScope: sub.buildScope })
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-5 py-3 font-semibold text-accent-foreground transition-colors hover:bg-gold sm:w-fit"
            >
              {sd.labels.cta}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
