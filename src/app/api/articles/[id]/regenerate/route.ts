import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateArticle, outlineToMarkdown } from '@/lib/claude'

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params

  const article = await prisma.article.findUnique({
    where: { id },
    include: { theme: true },
  })
  if (!article || article.theme?.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.article.update({ where: { id }, data: { status: 'GENERATING' } })

  const theme = article.theme!
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
    const updated = await prisma.article.update({
      where: { id },
      data: {
        title: outline.title || article.title,
        body,
        topImagePrompt: outline.topImagePrompt,
        status: 'READY',
      },
      include: { theme: true, account: true, images: true },
    })
    return NextResponse.json(updated)
  } catch (err) {
    await prisma.article.update({ where: { id }, data: { status: 'FAILED' } })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
