import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateArticleIdeas, generateArticle, outlineToMarkdown } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { themeId, count = 3 } = await req.json()
  const theme = await prisma.theme.findUnique({ where: { id: themeId } })
  if (!theme || theme.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // 1. タイトルアイデアを生成
  const ideas = await generateArticleIdeas(
    theme.category,
    theme.style,
    theme.tone,
    theme.targetAudience,
    theme.keywords,
    count
  )

  // 2. 各タイトルの記事を生成（GENERATING状態で先に作成）
  const created = await Promise.all(
    ideas.titles.slice(0, count).map(title =>
      prisma.article.create({
        data: { themeId, title, status: 'GENERATING', body: '' },
        include: { theme: true, account: true, images: true },
      })
    )
  )

  // 3. バックグラウンドで記事本文生成（レスポンス後に非同期処理）
  Promise.all(
    created.map(async (article) => {
      try {
        const outline = await generateArticle(
          article.title,
          theme.category,
          theme.style,
          theme.tone,
          theme.targetAudience,
          theme.keywords
        )
        const body = outlineToMarkdown(outline)
        await prisma.article.update({
          where: { id: article.id },
          data: {
            title: outline.title || article.title,
            body,
            topImagePrompt: outline.topImagePrompt,
            status: 'READY',
          },
        })
      } catch (err) {
        console.error('Article generation failed:', err)
        await prisma.article.update({
          where: { id: article.id },
          data: { status: 'FAILED' },
        })
      }
    })
  ).catch(console.error)

  return NextResponse.json({ articles: created })
}
