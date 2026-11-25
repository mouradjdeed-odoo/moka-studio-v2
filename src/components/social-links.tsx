import { Instagram, Linkedin, Youtube } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { socialLinks, type SocialNetwork } from '@/lib/site'

/** Filled "f" mark, drawn for this site (no third-party icon licence needed). */
function FacebookF(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.5h2.6l.45-3H13.5V8.6c0-.86.3-1.45 1.55-1.45h1.6V4.48A21 21 0 0 0 14.3 4.35c-2.33 0-3.8 1.42-3.8 4.02v2.13H8v3h2.5V21h3Z" />
    </svg>
  )
}

const ICONS: Record<SocialNetwork, { Icon: ComponentType<SVGProps<SVGSVGElement>>; color: string }> = {
  facebook: { Icon: FacebookF, color: '#1877F2' },
  instagram: { Icon: Instagram, color: '#E1306C' },
  linkedin: { Icon: Linkedin, color: '#0A66C2' },
  youtube: { Icon: Youtube, color: '#FF0000' },
}

/**
 * Round social media buttons. Plain links only (no plugins or tracking):
 * nothing is sent to the networks until the visitor clicks.
 * Networks appear only when they have a URL in `socialLinks` (src/lib/site.ts).
 */
export function SocialLinks({ className = '' }: { className?: string }) {
  if (socialLinks.length === 0) return null
  return (
    <ul className={`flex flex-wrap gap-3 ${className}`}>
      {socialLinks.map(({ network, label, url }) => {
        const { Icon, color } = ICONS[network]
        return (
          <li key={network}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{ color }}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
