import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'fallback-secret-for-dev-only'
)

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const account = await prisma.noteAccount.findUnique({ where: { id } })
  if (!account || account.userId !== auth.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const token = await new SignJWT({ scope: 'cookie-sync', accountId: id, userId: auth.userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(SECRET)

  return NextResponse.json({ token, expiresInSeconds: 3600 })
}
