'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: '予約済み', color: 'bg-yellow-500/20 text-yellow-400' },
  POSTING:   { label: '投稿中',   color: 'bg-blue-500/20 text-blue-400 animate-pulse' },
  POSTED:    { label: '投稿済み', color: 'bg-teal-500/20 text-teal-400' },
  FAILED:    { label: '失敗',     color: 'bg-red-500/20 text-red-400' },
}

const FILTER_OPTIONS = [
  ['', '全て'],
  ['SCHEDULED', '予約済み'],
  ['POSTED', '投稿済み'],
  ['FAILED', '失敗'],
]

export default function QueuePage() {
  const [articles, setArticles] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [publishing, setPublishing] = useState<string | null>(null)

  useEffect(() => {
    const url = filter ? `/api/queue?status=${filter}` : '/api/queue'
    fetch(url).then(r => r.json()).then(setArticles)
  }, [filter])

  async function publishNow(id: string, accountId: string) {
    if (!confirm('今すぐnoteに投稿しますか？')) return
    setPublishing(id)
    const res = await fetch(`/api/articles/${id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    })
    const data = await res.json()
    if (res.ok) {
      setArticles(a => a.map(art => art.id === id ? { ...art, status: 'POSTED' } : art))
      if (data.noteUrl) window.open(data.noteUrl, '_blank')
    } else {
      alert('投稿失敗: ' + data.error)
    }
    setPublishing(null)
  }

  async function cancelSchedule(id: string) {
    if (!confirm('予約をキャンセルしますか？')) return
    await fetch(`/api/articles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'READY', scheduledAt: null }),
    })
    setArticles(a => a.filter(x => x.id !== id))
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">投稿キュー</h1>
        <p className="text-gray-400 text-sm mt-1">スケジュール済みの記事投稿を管理</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTER_OPTIONS.map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${filter === val ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {articles.length === 0
        ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-gray-400 text-sm">キューにアイテムがありません</p>
            <p className="text-gray-500 text-xs mt-1">記事詳細ページから予約投稿を設定してください</p>
          </div>
        )
        : (
          <div className="space-y-3">
            {articles.map((article: any) => {
              const st = STATUS_LABELS[article.status] ?? { label: article.status, color: 'bg-gray-700 text-gray-300' }
              return (
                <div key={article.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    {article.topImageUrl
                      ? <img src={article.topImageUrl} alt="" className="w-14 h-9 object-cover rounded-lg flex-shrink-0" />
                      : <div className="w-14 h-9 bg-green-500/10 rounded-lg flex-shrink-0 flex items-center justify-center text-base">📝</div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/articles/${article.id}`}
                          className="font-medium text-sm hover:text-green-400 transition-colors line-clamp-1">
                          {article.title}
                        </Link>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                        <span>{article.theme?.title}</span>
                        {article.account && <span>@{article.account.urlname ?? article.account.email}</span>}
                        {article.scheduledAt && <span>⏰ {new Date(article.scheduledAt).toLocaleString('ja-JP')}</span>}
                        {article.postedAt && <span>✅ {new Date(article.postedAt).toLocaleString('ja-JP')}</span>}
                      </div>
                      {article.status === 'POSTED' && (
                        <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                          <span>👁️ {article.views.toLocaleString()}</span>
                          <span>❤️ {article.likes.toLocaleString()}</span>
                          {article.noteUrl && (
                            <a href={article.noteUrl} target="_blank" rel="noopener noreferrer"
                              className="text-teal-400 hover:text-teal-300 transition-colors">
                              🔗 note
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {article.status === 'SCHEDULED' && article.account && (
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => publishNow(article.id, article.account.id)}
                          disabled={publishing === article.id}
                          className="bg-green-500/20 hover:bg-green-500/40 text-green-400 px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50">
                          {publishing === article.id ? '投稿中...' : '今すぐ投稿'}
                        </button>
                        <button onClick={() => cancelSchedule(article.id)}
                          className="bg-gray-700 hover:bg-gray-600 text-gray-400 px-2 py-1.5 rounded-lg text-xs transition-colors">
                          ✕
                        </button>
                      </div>
                    )}
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
