import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateTopImage, generateSectionImage } from '@/lib/imageGen'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const { type = 'all' } = await req.json().catch(() => ({}))

  const article = await prisma.article.findUnique({
    where: { id },
    include: { theme: true },
  })
  if (!article || article.theme?.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const results: { type: string; url: string }[] = []

  // TOP画像生成
  if ((type === 'all' || type === 'top') && article.topImagePrompt) {
    try {
      const url = await generateTopImage(article.topImagePrompt, id)
      await prisma.article.update({ where: { id }, data: { topImageUrl: url } })
      results.push({ type: 'top', url })
    } catch (err) {
      console.error('Top image generation failed:', err)
    }
  }

  // セクション画像生成（本文からプロンプトを抽出）
  if (type === 'all' || type === 'sections') {
    // 既存の画像を削除
    await prisma.articleImage.deleteMany({ where: { articleId: id } })

    const body = article.body
    // マークダウンの## 見出し + 内容からセクションを抽出
    const sectionMatches = body.matchAll(/## (.+)\n([\s\S]*?)(?=\n## |\n---|\z)/g)
    let position = 0

    for (const match of sectionMatches) {
      const content = match[2]
      // コンテンツから短いプロンプトを生成（実際にはより良いプロンプトが必要）
      const prompt = `Illustration for article section about: ${match[1]}. Professional blog image.`

      try {
        const url = await generateSectionImage(prompt, id, position)
        await prisma.articleImage.create({
          data: { articleId: id, url, prompt, position },
        })
        results.push({ type: `section_${position}`, url })
        position++
        if (position >= 3) break // 最大3セクション画像
      } catch (err) {
        console.error(`Section ${position} image generation failed:`, err)
        position++
      }
    }
  }

  const updated = await prisma.article.findUnique({
    where: { id },
    include: { images: { orderBy: { position: 'asc' } } },
  })

  return NextResponse.json({ results, article: updated })
}
