import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { loginToNote } from '@/lib/noteApi'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const account = await prisma.noteAccount.findUnique({ where: { id } })
  if (!account || account.userId !== auth.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const { password } = await req.json().catch(() => ({}))
  if (!password) return NextResponse.json({ error: 'パスワードを入力してください' }, { status: 400 })

  try {
    const session = await loginToNote(account.email, password)
    const updated = await prisma.noteAccount.update({
      where: { id },
      data: {
        urlname: session.urlname,
        displayName: session.displayName,
        avatarUrl: session.avatarUrl,
        sessionToken: session.sessionCookie,
        tokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        passwordHash: await hash(password, 10),
      },
    })
    const { passwordHash, ...safe } = updated
    return NextResponse.json({ ok: true, account: safe })
  } catch (e) {
    return NextResponse.json({ error: `note.com ログイン失敗: ${String(e)}` }, { status: 400 })
  }
}
