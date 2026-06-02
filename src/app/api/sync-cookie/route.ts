import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import { verifyNoteSession, fetchNoteProfile } from '@/lib/noteApi'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'fallback-secret-for-dev-only'
)

export async function POST(req: NextRequest) {
  const { token, cookie } = await req.json().catch(() => ({}))
  if (!token || !cookie) {
    return NextResponse.json({ error: 'token と cookie は必須です' }, { status: 400 })
  }

  let payload: { scope?: string; accountId?: string; userId?: string }
  try {
    const result = await jwtVerify(token, SECRET)
    payload = result.payload as typeof payload
  } catch {
    return NextResponse.json({ error: 'token が無効、または期限切れです' }, { status: 401 })
  }
  if (payload.scope !== 'cookie-sync' || !payload.accountId || !payload.userId) {
    return NextResponse.json({ error: 'token の用途が不正です' }, { status: 401 })
  }

  const account = await prisma.noteAccount.findUnique({ where: { id: payload.accountId } })
  if (!account || account.userId !== payload.userId) {
    return NextResponse.json({ error: 'アカウントが見つかりません' }, { status: 404 })
  }

  const sessionCookie = String(cookie).trim()
  const ok = await verifyNoteSession(sessionCookie)
  if (!ok) {
    return NextResponse.json({ error: 'Cookie が note.com で受け付けられませんでした' }, { status: 400 })
  }

  const profile = await fetchNoteProfile(sessionCookie).catch(() => null)
  await prisma.noteAccount.update({
    where: { id: account.id },
    data: {
      sessionToken: sessionCookie,
      tokenExpiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      ...(profile ? {
        urlname: profile.urlname,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      } : {}),
    },
  })

  return NextResponse.json({ ok: true })
}
