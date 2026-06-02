import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyNoteSession, fetchNoteProfile } from '@/lib/noteApi'
import { encryptSecret, sha256Token } from '@/lib/secrets'

export async function POST(req: NextRequest) {
  const { token, cookie } = await req.json().catch(() => ({}))
  if (!token || !cookie) {
    return NextResponse.json({ error: 'token と cookie は必須です' }, { status: 400 })
  }

  const syncToken = await prisma.cookieSyncToken.findUnique({
    where: { tokenHash: sha256Token(String(token)) },
  })
  if (!syncToken || syncToken.usedAt || syncToken.expiresAt < new Date()) {
    return NextResponse.json({ error: 'token が無効、または期限切れです' }, { status: 401 })
  }

  const account = await prisma.noteAccount.findUnique({ where: { id: syncToken.accountId } })
  if (!account || account.userId !== syncToken.userId) {
    return NextResponse.json({ error: 'アカウントが見つかりません' }, { status: 404 })
  }

  const sessionCookie = String(cookie).trim()
  const ok = await verifyNoteSession(sessionCookie)
  if (!ok) {
    return NextResponse.json({ error: 'Cookie が note.com で受け付けられませんでした' }, { status: 400 })
  }

  const profile = await fetchNoteProfile(sessionCookie).catch(() => null)
  await prisma.$transaction([
    prisma.noteAccount.update({
      where: { id: account.id },
      data: {
        sessionToken: encryptSecret(sessionCookie),
        tokenExpiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        ...(profile ? {
          urlname: profile.urlname,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
        } : {}),
      },
    }),
    prisma.cookieSyncToken.update({
      where: { id: syncToken.id },
      data: { usedAt: new Date() },
    }),
  ])

  await prisma.cookieSyncToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { usedAt: { not: null } },
      ],
    },
  })

  return NextResponse.json({ ok: true })
}
