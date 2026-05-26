'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT:      { label: '下書き',   color: 'bg-gray-700 text-gray-300' },
  GENERATING: { label: 'AI生成中', color: 'bg-blue-500/20 text-blue-400 animate-pulse' },
  READY:      { label: '準備完了', color: 'bg-green-500/20 text-green-400' },
  SCHEDULED:  { label: '予約済み', color: 'bg-yellow-500/20 text-yellow-400' },
  POSTED:     { label: '投稿済み', color: 'bg-teal-500/20 text-teal-400' },
  FAILED:     { label: '失敗',     color: 'bg-red-500/20 text-red-400' },
}

export default function ThemeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [theme, setTheme] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [genCount, setGenCount] = useState(3)

  useEffect(() => {
    fetch(`/api/themes/${id}`).then(r => r.json()).then(data => {
      if (data.error) router.push('/themes')
      else setTheme(data)
    })
  }, [id, router])

  async function generateArticles() {
    if (!confirm(`このテーマで${genCount}記事をAI生成しますか？`)) return
    setGenerating(true)
    const res = await fetch('/api/articles/bulk-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeId: id, count: genCount }),
    })
    const data = await res.json()
    if (res.ok) {
      setTheme((t: any) => ({ ...t, articles: [...data.articles, ...(t.articles ?? [])] }))
    }
    setGenerating(false)
  }

  if (!theme) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-400 text-sm">読み込み中...</div>
    </div>
  )

  const cat = CATEGORIES.find(c => c.id === theme.category)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/themes" className="text-gray-400 hover:text-white text-sm transition-colors">テーマ</Link>
        <span className="text-gray-600">/</span>
        <span className="text-sm">{theme.title}</span>
      </div>

      {/* Theme Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            {cat?.emoji ?? '🗂️'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{theme.title}</h1>
            <p className="text-sm text-green-400 mt-0.5">{cat?.label ?? theme.category}</p>
            {theme.description && <p className="text-sm text-gray-400 mt-2">{theme.description}</p>}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
              <span>🎨 {theme.style}</span>
              <span>🗣️ {theme.tone}</span>
              {theme.targetAudience && <span>👥 {theme.targetAudience}</span>}
              <span>📅 週{theme.postsPerWeek}投稿</span>
            </div>
            {theme.keywords && (
              <div className="flex flex-wrap gap-1 mt-2">
                {theme.keywords.split(',').map((kw: string) => (
                  <span key={kw.trim()} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{kw.trim()}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generate Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-sm mb-3">AI記事一括生成</h2>
        <p className="text-xs text-gray-400 mb-4">Claudeがこのテーマに合ったバズりやすいタイトルを提案し、記事を自動生成します。</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">生成数:</label>
            <select value={genCount} onChange={e => setGenCount(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none">
              {[1, 3, 5, 10].map(n => <option key={n} value={n}>{n}記事</option>)}
            </select>
          </div>
          <button onClick={generateArticles} disabled={generating}
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all">
            {generating ? '⚙️ AI生成中...' : '🤖 AI記事生成'}
          </button>
          <Link href={`/articles/new?themeId=${id}`}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            + 手動作成
          </Link>
        </div>
      </div>

      {/* Articles */}
      <div>
        <h2 className="font-semibold text-sm mb-3">記事一覧 ({theme.articles?.length ?? 0})</h2>
        {(!theme.articles || theme.articles.length === 0)
          ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-gray-400 text-sm">まだ記事がありません</p>
            </div>
          )
          : (
            <div className="space-y-2">
              {theme.articles.map((article: any) => {
                const st = STATUS_LABELS[article.status] ?? STATUS_LABELS.DRAFT
                return (
                  <Link key={article.id} href={`/articles/${article.id}`}
                    className="flex items-center gap-3 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors">
                    {article.topImageUrl
                      ? <img src={article.topImageUrl} alt="" className="w-16 h-10 object-cover rounded-lg flex-shrink-0" />
                      : <div className="w-16 h-10 bg-green-500/10 rounded-lg flex-shrink-0 flex items-center justify-center text-lg">📝</div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium line-clamp-1">{article.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(article.createdAt).toLocaleDateString('ja-JP')}
                        {article.scheduledAt && <span className="ml-2">⏰ {new Date(article.scheduledAt).toLocaleString('ja-JP')}</span>}
                        {article.status === 'POSTED' && <span className="ml-2">👁️ {article.views} ❤️ {article.likes}</span>}
                      </div>
                    </div>
                    <span className="text-gray-500 text-sm">→</span>
                  </Link>
                )
              })}
            </div>
          )
        }
      </div>
    </div>
  )
}
