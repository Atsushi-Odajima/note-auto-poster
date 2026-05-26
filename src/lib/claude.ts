import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ArticleOutline {
  title: string
  hook: string           // 冒頭キャッチコピー
  sections: {
    heading: string
    content: string
    imagePrompt?: string  // 挿入画像のDALL-Eプロンプト
  }[]
  conclusion: string
  hashtags: string[]
  topImagePrompt: string  // タイトル画像のDALL-Eプロンプト
  seoScore: number        // 推定SEOスコア (1-100)
  estimatedReadTime: number  // 分
}

export async function generateArticleIdeas(
  category: string,
  style: string,
  tone: string,
  targetAudience: string | null,
  keywords: string | null,
  count: number = 5
): Promise<{ titles: string[]; reasons: string[] }> {
  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `あなたはnote.comのバズるコンテンツ専門家です。

カテゴリ: ${category}
スタイル: ${style}
トーン: ${tone}
想定読者: ${targetAudience ?? '一般'}
キーワード: ${keywords ?? 'なし'}

このカテゴリでバズりやすい記事タイトルを${count}個提案してください。
注目を集める数字・具体性・感情訴求を意識してください。

必ず以下のJSON形式で返してください:
{
  "titles": ["タイトル1", "タイトル2", ...],
  "reasons": ["理由1", "理由2", ...]
}`
    }]
  })

  const text = res.content[0].type === 'text' ? res.content[0].text : ''
  const json = text.match(/\{[\s\S]*\}/)
  if (!json) throw new Error('AIの応答をパースできませんでした')
  return JSON.parse(json[0])
}

export async function generateArticle(
  title: string,
  category: string,
  style: string,
  tone: string,
  targetAudience: string | null,
  keywords: string | null
): Promise<ArticleOutline> {
  const styleGuide: Record<string, string> = {
    informative: '情報提供型: 具体的データや事例を多用し、読者が即実践できる情報を提供',
    story: 'ストーリー型: 体験談・ナラティブで感情移入させ、教訓へ誘導',
    list: 'リスト型: 見出し番号付きで「〇選」「〇つの方法」形式、スキャンしやすい構成',
    interview: 'インタビュー/Q&A型: 読者の疑問に答える対話形式',
    how_to: 'ハウツー型: ステップバイステップで初心者でもわかる手順解説',
  }

  const toneGuide: Record<string, string> = {
    professional: 'プロフェッショナル: 信頼感・権威性重視',
    casual: 'カジュアル: 親しみやすく話し言葉風',
    emotional: '感情訴求: 共感・危機感・ワクワク感を強く打ち出す',
    academic: 'アカデミック: 論理的・客観的・データ重視',
  }

  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `あなたはnote.comで月間100万PVを達成するプロのライターです。

【記事情報】
タイトル: ${title}
カテゴリ: ${category}
スタイル: ${styleGuide[style] ?? style}
トーン: ${toneGuide[tone] ?? tone}
想定読者: ${targetAudience ?? '一般'}
キーワード: ${keywords ?? 'なし'}

【要件】
- 2000〜3000字程度の記事を作成
- SEOを意識したH2/H3見出し構成
- 読者が最後まで読みたくなる構成
- 各セクションに1つ挿入画像のAIイメージプロンプト(英語)を考える
- ハッシュタグを5〜10個
- タイトル画像用のDALL-E 3プロンプト(英語)を考える

必ず以下のJSON形式で返してください:
{
  "title": "最終タイトル",
  "hook": "読者を引き込む冒頭100字",
  "sections": [
    {
      "heading": "H2見出し",
      "content": "本文(マークダウン可)",
      "imagePrompt": "DALL-E 3 English prompt for section illustration"
    }
  ],
  "conclusion": "まとめ・CTA",
  "hashtags": ["#ハッシュタグ1", "#ハッシュタグ2"],
  "topImagePrompt": "DALL-E 3 English prompt for eye-catching title image",
  "seoScore": 85,
  "estimatedReadTime": 8
}`
    }]
  })

  const text = res.content[0].type === 'text' ? res.content[0].text : ''
  const json = text.match(/\{[\s\S]*\}/)
  if (!json) throw new Error('AIの応答をパースできませんでした')
  return JSON.parse(json[0])
}

export function outlineToMarkdown(outline: ArticleOutline): string {
  const lines: string[] = []
  lines.push(outline.hook)
  lines.push('')
  for (const sec of outline.sections) {
    lines.push(`## ${sec.heading}`)
    lines.push('')
    lines.push(sec.content)
    lines.push('')
  }
  lines.push('## まとめ')
  lines.push('')
  lines.push(outline.conclusion)
  lines.push('')
  lines.push(outline.hashtags.join(' '))
  return lines.join('\n')
}
