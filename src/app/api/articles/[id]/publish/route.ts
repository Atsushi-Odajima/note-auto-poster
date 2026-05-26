import type { RouteContext } from 'next/dist/server/route-modules/app-route/interfaces'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { postArticleToNote } from '@/lib/noteApi'
import { compare } from 'bcryptjs'
import { loginToNote } from '@/lib/noteApi'

export async function POST(req: NextRequest, ctx: RouteContext<'/api/articles/[id]/publish'>) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const { accountId, scheduledAt } = await req.json().catch(() => ({}))

  const article = await prisma.article.findUnique({
    where: { id },
    include: { theme: true },
  })
  if (!article || article.theme?.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // 予約投稿
  if (scheduledAt) {
    const updated = await prisma.article.update({
      where: { id },
      data: { status: 'SCHEDULED', scheduledAt: new Date(scheduledAt), accountId: accountId ?? null },
    })
    return NextResponse.json({ ok: true, article: updated })
  }

  // 即時投稿
  if (!accountId) return NextResponse.json({ error: 'アカウントIDが必要です' }, { status: 400 })

  const account = await prisma.noteAccount.findUnique({ where: { id: accountId } })
  if (!account || account.userId !== auth.userId) return NextResponse.json({ error: 'アカウントが見つかりません' }, { status: 404 })

  await prisma.article.update({ where: { id }, data: { status: 'POSTING' } })

  try {
    // セッション確認・更新
    let sessionToken = account.sessionToken ?? ''
    if (!sessionToken || (account.tokenExpiry && account.tokenExpiry < new Date())) {
      // 再ログイン
      const { createDecipheriv, randomBytes } = await import('crypto')
      // パスワードはbcryptハッシュから取り出せないので、平文パスワードが必要
      // 今回はセッションが切れた場合はエラー
      return NextResponse.json({ error: 'セッションが期限切れです。アカウントを再登録してください' }, { status: 401 })
    }

    const result = await postArticleToNote(sessionToken, article.title, article.body, true)

    if (!result.success) {
      await prisma.article.update({ where: { id }, data: { status: 'FAILED' } })
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    await prisma.article.update({
      where: { id },
      data: {
        status: 'POSTED',
        noteArticleId: result.articleId,
        noteUrl: result.noteUrl,
        postedAt: new Date(),
        accountId,
      },
    })

    return NextResponse.json({ ok: true, noteUrl: result.noteUrl })
  } catch (err) {
    await prisma.article.update({ where: { id }, data: { status: 'FAILED' } })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
