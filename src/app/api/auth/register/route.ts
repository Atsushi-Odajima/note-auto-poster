import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, cookieName } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'メールとパスワードは必須です' }, { status: 400 })
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return NextResponse.json({ error: 'すでに登録済みのメールです' }, { status: 409 })
  const user = await prisma.user.create({ data: { email, password: await hash(password, 12) } })
  const token = await signToken(user.id)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookieName(), token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
  return res
}
