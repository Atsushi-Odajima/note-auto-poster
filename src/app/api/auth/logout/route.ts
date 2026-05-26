import { NextResponse } from 'next/server'
import { cookieName } from '@/lib/auth'

export async function POST() {
  const res = NextResponse.redirect('http://localhost:3000/login')
  res.cookies.delete(cookieName())
  return res
}
