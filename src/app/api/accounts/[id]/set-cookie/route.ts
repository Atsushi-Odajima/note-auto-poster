import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyNoteSession, fetchNoteProfile } from '@/lib/noteApi'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const account = await prisma.noteAccount.findUnique({ where: { id } })
  if (!account || account.userId !== auth.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const { cookie } = await req.json().catch(() => ({}))
  if (!cookie || typeof cookie !== 'string') {
    return NextResponse.json({ error: 'Cookie を入力してください' }, { status: 400 })
  }

  const sessionCookie = cookie.trim()
  const ok = await verifyNoteSession(sessionCookie)
  if (!ok) {
    return NextResponse.json({ error: 'この Cookie では note.com にアクセスできません。Cookie の値（_note_session_v5 など）が正しいか、有効期限が切れていないか確認してください。' }, { status: 400 })
  }

  const profile = await fetchNoteProfile(sessionCookie).catch(() => null)

  const updated = await prisma.noteAccount.update({
    where: { id },
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
  const { passwordHash, ...safe } = updated
  return NextResponse.json({ ok: true, account: safe })
}
