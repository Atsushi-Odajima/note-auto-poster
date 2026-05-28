import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const theme = await prisma.theme.findUnique({
    where: { id },
    include: { articles: { orderBy: { createdAt: 'desc' }, include: { account: true } } },
  })
  if (!theme || theme.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(theme)
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const theme = await prisma.theme.findUnique({ where: { id } })
  if (!theme || theme.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const updated = await prisma.theme.update({ where: { id }, data: body })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const theme = await prisma.theme.findUnique({ where: { id } })
  if (!theme || theme.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.theme.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
