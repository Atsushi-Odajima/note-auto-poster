import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {
    theme: { userId: auth.userId },
    status: status ?? { in: ['SCHEDULED', 'POSTING', 'POSTED', 'FAILED'] },
  }

  const articles = await prisma.article.findMany({
    where,
    include: { theme: true, account: true },
    orderBy: { scheduledAt: 'asc' },
  })
  return NextResponse.json(articles)
}
