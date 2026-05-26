import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const themeId = searchParams.get('themeId')

  const where: Record<string, unknown> = { theme: { userId: auth.userId } }
  if (status) where.status = status
  if (themeId) where.themeId = themeId

  const articles = await prisma.article.findMany({
    where,
    include: { theme: true, account: true, images: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(articles)
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { themeId, title, body } = await req.json()
  if (!themeId || !title) return NextResponse.json({ error: 'テーマIDとタイトルは必須です' }, { status: 400 })
  const theme = await prisma.theme.findUnique({ where: { id: themeId } })
  if (!theme || theme.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const article = await prisma.article.create({
    data: { themeId, title, body: body ?? '', status: 'DRAFT' },
    include: { theme: true, account: true, images: true },
  })
  return NextResponse.json(article)
}
