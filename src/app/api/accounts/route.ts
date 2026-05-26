import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { loginToNote } from '@/lib/noteApi'

export async function GET() {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const accounts = await prisma.noteAccount.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(accounts)
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'メールとパスワードは必須です' }, { status: 400 })

  // note.com でのログインを試みる
  let urlname: string | undefined
  let displayName: string | undefined
  let avatarUrl: string | undefined
  let sessionToken: string | undefined
  let tokenExpiry: Date | undefined

  try {
    const session = await loginToNote(email, password)
    urlname = session.urlname
    displayName = session.displayName
    avatarUrl = session.avatarUrl
    sessionToken = session.sessionCookie
    tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  } catch (e) {
    console.warn('note.com login failed (saved without session):', e)
  }

  const passwordHash = await hash(password, 10)
  const account = await prisma.noteAccount.create({
    data: {
      userId: auth.userId,
      email,
      passwordHash,
      urlname,
      displayName,
      avatarUrl,
      sessionToken,
      tokenExpiry,
    },
  })
  return NextResponse.json(account)
}
