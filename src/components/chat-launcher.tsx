'use client'

import { MessageCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { site } from '@/lib/site'
import { useI18n } from '@/lib/i18n/provider'

type State = 'idle' | 'card' | 'loading' | 'loaded'

/** Keys the Odoo chat keeps in this site's localStorage (guest token, open window, redirect state). */
const ODOO_KEY = /^(EXPIRABLE_STORAGE_im_livechat|mail\.ChatHub|presence\.)/

function hasOldChat() {
  try {
    return Object.keys(localStorage).some((k) => k.startsWith('EXPIRABLE_STORAGE_im_livechat_guest_token'))
  } catch {
    return false
  }
}

function forgetOldChat() {
  try {
    Object.keys(localStorage)
      .filter((k) => ODOO_KEY.test(k))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    /* storage blocked: Odoo then starts a new chat anyway */
  }
}

/**
 * Two-click website chat: nothing from Odoo is loaded until the visitor clicks "Chat starten".
 * Then the Odoo Live Chat scripts are added and the Odoo chat window takes over
 * (channel and chatbot are set up by automation/odoo/livechat_setup.py).
 *
 * "Zurück zum Hauptmenü" in the chatbot links to /?chat=neu: the old chat is forgotten and a new one starts.
 */
export function ChatLauncher() {
  const { t, dir } = useI18n()
  const c = t.chat
  const [state, setState] = useState<State>('idle')
  const [oldChat, setOldChat] = useState(false)

  function start(fresh: boolean) {
    if (fresh) forgetOldChat()
    setState('loading')
    const add = (src: string, onload?: () => void) => {
      const s = document.createElement('script')
      s.src = src
      s.defer = true
      if (onload) s.onload = onload
      s.onerror = () => setState('card')
      document.body.appendChild(s)
    }
    add(`${site.chatServer}/im_livechat/loader/${site.chatChannel}`)
    add(`${site.chatServer}/im_livechat/assets_embed.js`, () => setState('loaded'))
  }

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('chat') === 'neu') {
      // The visitor chose "Zurück zum Hauptmenü" inside the chat, so the chat was already consented to.
      url.searchParams.delete('chat')
      window.history.replaceState(null, '', url.pathname + url.search + url.hash)
      start(true)
      return
    }
    setOldChat(hasOldChat())
  }, [])

  if (state === 'loaded') return null

  const primary =
    'mt-4 w-full rounded-full bg-[#C9971A] px-4 py-2.5 font-semibold text-white transition hover:bg-[#b5861a] disabled:opacity-70'
  const secondary =
    'mt-2 w-full rounded-full border border-neutral-300 px-4 py-2.5 font-semibold text-neutral-800 transition hover:bg-neutral-100 disabled:opacity-70'

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3" dir="ltr">
      {state !== 'idle' && (
        <div
          role="dialog"
          aria-labelledby="chat-card-title"
          className="w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl bg-white p-5 text-sm text-neutral-800 shadow-2xl ring-1 ring-black/5"
          dir={dir}
        >
          <div className="flex items-start justify-between gap-3">
            <h2 id="chat-card-title" className="text-base font-semibold text-neutral-900">
              {c.title}
            </h2>
            <button
              type="button"
              onClick={() => setState('idle')}
              aria-label={c.close}
              className="-m-1 rounded-full p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 leading-relaxed text-neutral-600">{c.text}</p>
          {c.note && <p className="mt-2 leading-relaxed text-neutral-600">{c.note}</p>}
          <a href="/datenschutz" className="mt-2 inline-block text-neutral-600 underline underline-offset-2">
            {c.privacy}
          </a>
          {state === 'loading' ? (
            <button type="button" disabled className={primary}>
              {c.loading}
            </button>
          ) : oldChat ? (
            <>
              <button type="button" onClick={() => start(false)} className={primary}>
                {c.resume}
              </button>
              <button type="button" onClick={() => start(true)} className={secondary}>
                {c.restart}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => start(true)} className={primary}>
              {c.start}
            </button>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setState(state === 'idle' ? 'card' : 'idle')}
        aria-label={c.open}
        aria-expanded={state !== 'idle'}
        title={c.open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C9971A] text-white shadow-lg transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9971A]"
      >
        <MessageCircle className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  )
}
