import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC = ['/login', '/api/auth/register', '/api/auth/login']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next()
  if (pathname.startsWith('/generated/') || pathname.startsWith('/_next/') || pathname === '/manifest.json') {
    return NextResponse.next()
  }

  const token = req.cookies.get('note_auth')?.value
  if (!token) return NextResponse.redirect(new URL('/login', req.url))
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.redirect(new URL('/login', req.url))
  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png|.*\\.svg).*)'] }
