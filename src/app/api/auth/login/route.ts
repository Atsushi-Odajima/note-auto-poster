import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, cookieName } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await compare(password, user.password))) {
    return NextResponse.json({ error: 'メールまたはパスワードが違います' }, { status: 401 })
  }
  const token = await signToken(user.id)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookieName(), token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
  return res
}
