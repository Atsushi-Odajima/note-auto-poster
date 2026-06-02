import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'crypto'

const PREFIX = 'enc:v1:'

function encryptionKey(): Buffer {
  const raw = process.env.COOKIE_ENCRYPTION_KEY
  if (raw) {
    const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64')
    if (key.length === 32) return key
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('COOKIE_ENCRYPTION_KEY must be a 32-byte base64 or 64-char hex key in production')
  }

  return createHash('sha256')
    .update(process.env.JWT_SECRET ?? 'dev-cookie-encryption-key')
    .digest()
}

export function encryptSecret(value: string): string {
  if (!value) return value
  if (value.startsWith(PREFIX)) return value

  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [
    PREFIX.slice(0, -1),
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join(':')
}

export function decryptSecret(value: string | null | undefined): string {
  if (!value) return ''
  if (!value.startsWith(PREFIX)) return value

  const [, , ivText, tagText, encryptedText] = value.split(':')
  if (!ivText || !tagText || !encryptedText) throw new Error('Invalid encrypted secret format')

  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivText, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

export function sha256Token(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function constantTimeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function safeAccount<T extends { passwordHash?: string; sessionToken?: string | null }>(account: T) {
  const { passwordHash, sessionToken, ...rest } = account
  return { ...rest, sessionToken: Boolean(sessionToken) }
}
