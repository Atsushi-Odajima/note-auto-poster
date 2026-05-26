'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT:      { label: '下書き',   color: 'bg-gray-700 text-gray-300' },
  GENERATING: { label: 'AI生成中', color: 'bg-blue-500/20 text-blue-400 animate-pulse' },
  READY:      { label: '準備完了', color: 'bg-green-500/20 text-green-400' },
  SCHEDULED:  { label: '予約済み', color: 'bg-yellow-500/20 text-yellow-400' },
  POSTING:    { label: '投稿中',   color: 'bg-blue-500/20 text-blue-400 animate-pulse' },
  POSTED:     { label: '投稿済み', color: 'bg-teal-500/20 text-teal-400' },
  FAILED:     { label: '失敗',     color: 'bg-red-500/20 text-red-400' },
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const url = filter ? `/api/articles?status=${filter}` : '/api/articles'
    fetch(url).then(r => r.json()).then(setArticles)
  }, [filter])

  async function deleteArticle(id: string) {
    if (!confirm('この記事を削除しますか？')) return
    await fetch(`/api/articles/${id}`, { method: 'DELETE' })
    setArticles(a => a.filter(x => x.id !== id))
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">記事管理</h1>
          <p className="text-gray-400 text-sm mt-1">AI生成記事の確認・編集・投稿</p>
        </div>
        <Link href="/articles/new"
          className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + 手動作成
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[['', '全て'], ...Object.entries(STATUS_LABELS).map(([k, v]) => [k, v.label])].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${filter === val ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {articles.length === 0
        ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-400 text-sm">記事がありません</p>
            <p className="text-gray-500 text-xs mt-1">テーマページからAI記事を生成してください</p>
          </div>
        )
        : (
          <div className="space-y-3">
            {articles.map((article: any) => {
              const st = STATUS_LABELS[article.status] ?? STATUS_LABELS.DRAFT
              return (
                <div key={article.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    {article.topImageUrl
                      ? <img src={article.topImageUrl} alt="" className="w-16 h-10 object-cover rounded-lg flex-shrink-0" />
                      : <div className="w-16 h-10 bg-green-500/10 rounded-lg flex-shrink-0 flex items-center justify-center">📝</div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/articles/${article.id}`}
                          className="font-medium text-sm hover:text-green-400 transition-colors line-clamp-1">
                          {article.title}
                        </Link>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span>{article.theme?.title}</span>
                        <span>•</span>
                        <span>{new Date(article.createdAt).toLocaleDateString('ja-JP')}</span>
                        {article.images?.length > 0 && <span>🖼️ {article.images.length}枚</span>}
                        {article.status === 'POSTED' && (
                          <>
                            <span>👁️ {article.views}</span>
                            <span>❤️ {article.likes}</span>
                          </>
                        )}
                      </div>
                      {article.noteUrl && (
                        <a href={article.noteUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-teal-400 hover:text-teal-300 mt-1 inline-block transition-colors">
                          note.comで見る →
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Link href={`/articles/${article.id}`}
                        className="bg-green-500/20 hover:bg-green-500/40 text-green-400 px-3 py-1.5 rounded-lg text-xs transition-colors">
                        編集
                      </Link>
                      <button onClick={() => deleteArticle(article.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1.5">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}
