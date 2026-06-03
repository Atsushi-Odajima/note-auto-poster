import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'fallback-secret-for-dev-only'
)

const CORS = {
  'Access-Control-Allow-Origin': 'https://note.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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

  const { id } = await ctx.params
  const { noteUrl, noteId, failed, error } = await req.json().catch(() => ({}))

  const article = await prisma.article.findUnique({
    where: { id },
    include: { theme: true },
  })
  if (!article || article.theme.userId !== userId) {
    return NextResponse.json({ error: 'article not found' }, { status: 404, headers: CORS })
  }

  if (failed) {
    await prisma.article.update({
      where: { id },
      data: { status: 'FAILED' },
    })
    return NextResponse.json({ ok: true, status: 'FAILED', error }, { headers: CORS })
  }

  await prisma.article.update({
    where: { id },
    data: {
      status: 'POSTED',
      postedAt: new Date(),
      noteUrl: noteUrl ?? null,
      noteArticleId: noteId ?? null,
    },
  })

  return NextResponse.json({ ok: true, status: 'POSTED' }, { headers: CORS })
}
