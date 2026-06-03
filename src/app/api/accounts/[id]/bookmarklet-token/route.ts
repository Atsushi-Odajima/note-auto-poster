import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'fallback-secret-for-dev-only'
)

function bookmarkletCode(token: string, baseUrl: string): string {
  // Minified inline bookmarklet. Runs in note.com origin.
  const code = `(async()=>{const T='${token}';const B='${baseUrl}';const d=document.createElement('div');d.style.cssText='position:fixed;bottom:20px;right:20px;background:#000;color:#fff;padding:16px 20px;border-radius:8px;z-index:99999;font:14px sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.3);max-width:90vw';d.textContent='⏳ Kuro Note: 記事取得中...';document.body.appendChild(d);const log=s=>d.textContent='⏳ Kuro Note: '+s;const done=s=>{d.textContent=s;setTimeout(()=>d.remove(),8000)};try{const r1=await fetch(B+'/api/bookmarklet/articles/next?token='+T);if(r1.status===404){done('ℹ️ 公開待ちの記事はありません');return}if(!r1.ok)throw new Error('Kuro Note: '+r1.status);const a=await r1.json();log('「'+a.title+'」を投稿中...');const c=document.querySelector('meta[name=csrf-token]')?.content||'';const h={'Content-Type':'application/json','X-CSRF-Token':c,'X-Requested-With':'XMLHttpRequest'};const r2=await fetch('/api/v2/text_notes',{method:'POST',headers:h,credentials:'include',body:JSON.stringify({name:a.title,body:a.body,status:'draft'})});if(!r2.ok)throw new Error('note作成: '+r2.status);const nd=await r2.json();const nid=nd?.data?.id||nd?.id;if(!nid)throw new Error('note ID 取得失敗');const r3=await fetch('/api/v2/text_notes/'+nid,{method:'PATCH',headers:h,credentials:'include',body:JSON.stringify({status:'public'})});if(!r3.ok)throw new Error('note公開: '+r3.status);const un=nd?.data?.user?.urlname||'';const url=un?'https://note.com/'+un+'/n/'+nid:'https://note.com/n/'+nid;await fetch(B+'/api/bookmarklet/articles/'+a.id+'/posted?token='+T,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({noteUrl:url,noteId:nid})});done('✅ 投稿完了: '+url)}catch(e){done('❌ '+e.message)}})();`
  return 'javascript:' + code
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const account = await prisma.noteAccount.findUnique({ where: { id } })
  if (!account || account.userId !== auth.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const token = await new SignJWT({ scope: 'bookmarklet', userId: auth.userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('90d')
    .sign(SECRET)

  // Build base URL from request
  const proto = process.env.VERCEL ? 'https' : 'http'
  const host = process.env.VERCEL_URL ?? 'localhost:3000'
  const baseUrl = `${proto}://${host}`

  return NextResponse.json({
    token,
    bookmarklet: bookmarkletCode(token, baseUrl),
    expiresInDays: 90,
  })
}
