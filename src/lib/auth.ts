import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

function jwtSecret(): Uint8Array {
  if (process.env.JWT_SECRET) return new TextEncoder().encode(process.env.JWT_SECRET)
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production')
  }
  return new TextEncoder().encode('fallback-secret-for-dev-only')
}

const SECRET = jwtSecret()
const COOKIE = 'note_auth'

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return { userId: payload.userId as string }
  } catch {
    return null
  }
}

export async function getAuthUser(): Promise<{ userId: string } | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export function cookieName() { return COOKIE }
