import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const themes = await prisma.theme.findMany({
    where: { userId: auth.userId },
    include: { _count: { select: { articles: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(themes)
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { title, category, description, style, tone, targetAudience, keywords, postsPerWeek } = body
  if (!title || !category) return NextResponse.json({ error: 'タイトルとカテゴリは必須です' }, { status: 400 })
  const theme = await prisma.theme.create({
    data: {
      userId: auth.userId,
      title,
      category,
      description,
      style: style ?? 'informative',
      tone: tone ?? 'professional',
      targetAudience,
      keywords,
      postsPerWeek: postsPerWeek ?? 3,
    },
  })
  return NextResponse.json(theme)
}
