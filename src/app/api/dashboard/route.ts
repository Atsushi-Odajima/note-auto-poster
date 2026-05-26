import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [accounts, themes, articles] = await Promise.all([
    prisma.noteAccount.count({ where: { userId: auth.userId } }),
    prisma.theme.count({ where: { userId: auth.userId } }),
    prisma.article.findMany({
      where: { theme: { userId: auth.userId } },
      include: { theme: true, account: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ])

  const totalArticles = await prisma.article.count({ where: { theme: { userId: auth.userId } } })
  const postedArticles = await prisma.article.count({ where: { theme: { userId: auth.userId }, status: 'POSTED' } })
  const scheduledArticles = await prisma.article.count({ where: { theme: { userId: auth.userId }, status: 'SCHEDULED' } })

  return NextResponse.json({ accounts, themes, totalArticles, postedArticles, scheduledArticles, recentArticles: articles })
}
