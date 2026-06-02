import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sha256Token } from '@/lib/secrets'

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const account = await prisma.noteAccount.findUnique({ where: { id } })
  if (!account || account.userId !== auth.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const token = randomBytes(32).toString('base64url')
  await prisma.cookieSyncToken.create({
    data: {
      tokenHash: sha256Token(token),
      userId: auth.userId,
      accountId: id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  })

  return NextResponse.json({ token, expiresInSeconds: 3600 })
}
