import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const account = await prisma.noteAccount.findUnique({ where: { id } })
  if (!account || account.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.noteAccount.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
