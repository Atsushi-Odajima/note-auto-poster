import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'fallback-secret-for-dev-only'
)

const CORS = {
  'Access-Control-Allow-Origin': 'https://note.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400, headers: CORS })
  }

  let userId: string
  try {
    const { payload } = await jwtVerify(token, SECRET)
    if (payload.scope !== 'bookmarklet' || !payload.userId) {
      return NextResponse.json({ error: 'invalid token scope' }, { status: 401, headers: CORS })
    }
    userId = String(payload.userId)
  } catch {
    return NextResponse.json({ error: 'token expired or invalid' }, { status: 401, headers: CORS })
  }

  // Oldest READY article belonging to this user
  const article = await prisma.article.findFirst({
    where: {
      status: 'READY',
      theme: { userId },
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, title: true, body: true },
  })

  if (!article) {
    return NextResponse.json({ error: 'no articles in queue' }, { status: 404, headers: CORS })
  }

  // Move to POSTING so it isn't picked up twice if the user taps again
  await prisma.article.update({
    where: { id: article.id },
    data: { status: 'POSTING' },
  })

  return NextResponse.json(article, { headers: CORS })
}
