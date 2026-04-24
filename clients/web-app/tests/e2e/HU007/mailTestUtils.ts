import { expect, type APIRequestContext } from '@playwright/test'

type ConfirmResponse = {
  status: string
  booking_id: string
  confirmation_preview?: Record<string, unknown> | null
  email_notification?: Record<string, unknown> | null
}

export type MailMessage = {
  id: string
  subject: string
  to: string[]
  html: string
  text: string
  createdAt: number
}

export type Hu007Env = {
  bookingApiUrl: string
  mailApiUrl: string
  batchBookingId: string
  recipientEmail: string
}

function env(name: string): string {
  const value = process.env[name]
  return typeof value === 'string' ? value.trim() : ''
}

export function resolveHu007Env(batchVarName = 'E2E_HU007_BATCH_BOOKING_ID'): Hu007Env | null {
  const bookingApiUrl = env('E2E_BOOKING_API_URL')
  const mailApiUrl = env('E2E_MAIL_API_URL')
  const batchBookingId = env(batchVarName)
  const recipientEmail = env('E2E_HU007_RECIPIENT_EMAIL')

  if (!bookingApiUrl || !mailApiUrl || !batchBookingId || !recipientEmail) {
    return null
  }

  return { bookingApiUrl, mailApiUrl, batchBookingId, recipientEmail }
}

export async function triggerBatchConfirm(
  request: APIRequestContext,
  envVars: Hu007Env,
): Promise<ConfirmResponse> {
  const response = await request.post(
    `${envVars.bookingApiUrl.replace(/\/$/, '')}/api/v1/bookings/${envVars.batchBookingId}/confirm`,
  )
  if (!response.ok() && response.status() !== 409) {
    expect(response.ok()).toBeTruthy()
  }
  return (await response.json()) as ConfirmResponse
}

export async function waitForBookingMail(
  request: APIRequestContext,
  envVars: Hu007Env,
  bookingId: string,
  timeoutMs = 30_000,
): Promise<MailMessage> {
  const startedAt = Date.now()
  const deadline = startedAt + timeoutMs

  while (Date.now() < deadline) {
    const messages = await listMessages(request, envVars.mailApiUrl)
    const startedMs = startedAt
    const sorted = [...messages].sort((a, b) => b.createdAt - a.createdAt)
    const match = sorted.find(m => {
      const combined = `${m.subject}\n${m.text}\n${m.html}`
      const matchesRecipient = m.to.some(to =>
        to.toLowerCase().includes(envVars.recipientEmail.toLowerCase()),
      )
      const matchesSubject = m.subject.toLowerCase().includes('confirmación de reserva')
      const containsBooking = combined.includes(bookingId)
      const isRecent = m.createdAt >= startedMs - 5_000
      return matchesRecipient && matchesSubject && (containsBooking || isRecent)
    })

    if (match) {
      return match
    }

    await new Promise(resolve => setTimeout(resolve, 1_500))
  }

  throw new Error(
    `No booking confirmation email found for booking_id=${bookingId} and recipient=${envVars.recipientEmail}`,
  )
}

async function listMessages(
  request: APIRequestContext,
  mailApiUrl: string,
): Promise<MailMessage[]> {
  const normalizedBase = mailApiUrl.replace(/\/$/, '')

  const v1 = await request.get(`${normalizedBase}/api/v1/messages`)
  if (v1.ok()) {
    const data = (await v1.json()) as unknown
    return normalizeV1Messages(request, normalizedBase, data)
  }

  const v2 = await request.get(`${normalizedBase}/api/v2/messages`)
  if (v2.ok()) {
    const data = (await v2.json()) as unknown
    return normalizeV2Messages(data)
  }

  throw new Error(`Inbox API not reachable at ${normalizedBase}`)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

async function normalizeV1Messages(
  request: APIRequestContext,
  baseUrl: string,
  payload: unknown,
): Promise<MailMessage[]> {
  const root = asRecord(payload)
  const values = root?.messages
  if (!Array.isArray(values)) return []

  const out: MailMessage[] = []
  for (const item of values) {
    const row = asRecord(item)
    if (!row) continue
    const id = String(row.ID ?? row.id ?? '')
    const createdRaw = String(row.Created ?? row.created ?? '')
    const createdAt = Date.parse(createdRaw)
    if (!id) continue

    const detailRes = await request.get(`${baseUrl}/api/v1/message/${id}`)
    if (!detailRes.ok()) continue
    const detail = asRecord((await detailRes.json()) as unknown)
    if (!detail) continue

    const subject = String(detail.Subject ?? '')
    const html = String(detail.HTML ?? '')
    const text = String(detail.Text ?? '')
    const to = normalizeAddressList(detail.To)

    out.push({
      id,
      subject,
      html,
      text,
      to,
      createdAt: Number.isNaN(createdAt) ? Date.now() : createdAt,
    })
  }
  return out
}

function normalizeV2Messages(payload: unknown): MailMessage[] {
  const root = asRecord(payload)
  const values = root?.items
  if (!Array.isArray(values)) return []

  return values
    .map(item => {
      const row = asRecord(item)
      if (!row) return null
      const content = asRecord(row.Content)
      const headers = asRecord(content?.Headers)
      const subject = firstHeader(headers, 'Subject')
      const to = splitEmailList(firstHeader(headers, 'To'))
      const body = String(content?.Body ?? '')
      const id = String(row.ID ?? row.id ?? '')
      const createdRaw = String(row.Created ?? row.created ?? '')
      const createdAt = Date.parse(createdRaw)
      if (!id) return null
      return {
        id,
        subject,
        to,
        html: body,
        text: body,
        createdAt: Number.isNaN(createdAt) ? Date.now() : createdAt,
      } satisfies MailMessage
    })
    .filter((m): m is MailMessage => m !== null)
}

function firstHeader(headers: Record<string, unknown> | null, key: string): string {
  const value = headers?.[key]
  if (Array.isArray(value) && value.length > 0) return String(value[0] ?? '')
  if (typeof value === 'string') return value
  return ''
}

function normalizeAddressList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const emails: string[] = []
  for (const item of value) {
    const row = asRecord(item)
    if (!row) continue
    const mailbox = asRecord(row.Mailbox)
    const address = String(mailbox?.Address ?? '')
    if (address) emails.push(address)
  }
  return emails
}

function splitEmailList(value: string): string[] {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}
