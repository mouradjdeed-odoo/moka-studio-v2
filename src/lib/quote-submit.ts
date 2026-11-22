import { site } from '@/lib/site'
import { toPayload, type QuoteData } from '@/lib/quote'

/**
 * Make webhooks accept about 5 MB per request. Attachments are sent base64-encoded
 * (+33 %), so the encoded files together must stay below this many raw bytes.
 */
export const MAX_TOTAL_UPLOAD = 3.4 * 1024 * 1024

/** Longest image side after compression; enough to judge a room or a damage photo. */
const MAX_IMAGE_SIDE = 1600
const JPEG_QUALITY = 0.8

export type EncodedFile = { name: string; type: string; data: string; size: number }

export type SubmitResult = { ok: true; ref: string } | { ok: false; reason: 'tooLarge' | 'network' }

const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

/** Shrinks photos to MAX_IMAGE_SIDE as JPEG; PDFs and images that fail to decode are sent unchanged. */
async function compress(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < 400 * 1024) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', JPEG_QUALITY))
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

export async function encodeFiles(files: File[]): Promise<EncodedFile[]> {
  return Promise.all(
    files.map(async (file) => {
      const blob = await compress(file)
      const renamed = blob !== file ? file.name.replace(/\.[^.]+$/, '') + '.jpg' : file.name
      return { name: renamed, type: blob.type || file.type, data: await toBase64(blob), size: blob.size }
    }),
  )
}

/**
 * Sends the request to the Make scenario "MOKA – Neue Anfrage", which creates the opportunity in Odoo.
 * The body is sent as text/plain so the browser does not need a CORS preflight.
 */
export async function submitQuote(data: QuoteData, files: File[], honeypot: string): Promise<SubmitResult> {
  const encoded = await encodeFiles(files)
  if (encoded.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL_UPLOAD) return { ok: false, reason: 'tooLarge' }
  const { privacy: _consent, ...fields } = toPayload(data)
  const payload = { ...fields, website: honeypot, files: encoded.map(({ name, type, data }) => ({ name, type, data })) }
  try {
    const response = await fetch(site.quoteWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(payload),
    })
    const result = (await response.json().catch(() => null)) as { ok?: boolean; ref?: string } | null
    return response.ok && result?.ok ? { ok: true, ref: result.ref ?? '' } : { ok: false, reason: 'network' }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
