import type { RouteContext } from 'next/dist/server/route-modules/app-route/interfaces'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, ctx: RouteContext<'/api/articles/[id]'>) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const article = await prisma.article.findUnique({
    where: { id },
    include: { theme: true, account: true, images: { orderBy: { position: 'asc' } } },
  })
  if (!article || article.theme?.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(article)
}

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/articles/[id]'>) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const article = await prisma.article.findUnique({ where: { id }, include: { theme: true } })
  if (!article || article.theme?.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const updated = await prisma.article.update({
    where: { id },
    data: body,
    include: { theme: true, account: true, images: true },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/articles/[id]'>) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const article = await prisma.article.findUnique({ where: { id }, include: { theme: true } })
  if (!article || article.theme?.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.article.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
