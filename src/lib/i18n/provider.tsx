'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { dictionaries, languages, type Dictionary, type Lang } from './dictionaries'

type I18nContextValue = {
  lang: Lang
  dir: 'ltr' | 'rtl'
  t: Dictionary
  setLang: (lang: Lang) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('de')
  const dir = languages.find((l) => l.code === lang)!.dir

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const value = useMemo(() => ({ lang, dir, t: dictionaries[lang], setLang }), [lang, dir])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
