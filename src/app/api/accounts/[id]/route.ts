import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const account = await prisma.noteAccount.findUnique({ where: { id } })
  if (!account || account.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { passwordHash, ...safe } = account
  return NextResponse.json(safe)
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const account = await prisma.noteAccount.findUnique({ where: { id } })
  if (!account || account.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (typeof body.category === 'string' || body.category === null) data.category = body.category
  if (typeof body.displayName === 'string') data.displayName = body.displayName
  const updated = await prisma.noteAccount.update({ where: { id }, data })
  const { passwordHash, ...safe } = updated
  return NextResponse.json(safe)
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const account = await prisma.noteAccount.findUnique({ where: { id } })
  if (!account || account.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.noteAccount.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
