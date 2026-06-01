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

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData)
  }, [])

  if (!data) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-400 text-sm">読み込み中...</div>
    </div>
  )

  const stats = [
    { label: 'アカウント', value: data.accounts, icon: '👤', href: '/accounts', color: 'from-green-500/20 to-teal-500/20' },
    { label: 'テーマ', value: data.themes, icon: '🗂️', href: '/themes', color: 'from-teal-500/20 to-cyan-500/20' },
    { label: '投稿済み', value: data.postedArticles, icon: '✅', href: '/articles?status=POSTED', color: 'from-green-500/20 to-emerald-500/20' },
    { label: '予約中', value: data.scheduledArticles, icon: '⏰', href: '/queue', color: 'from-yellow-500/20 to-orange-500/20' },
  ]

  return (
    <div className="px-4 sm:px-6 pt-6 pb-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">管理画面</h1>
        <p className="text-gray-400 text-sm mt-1">noteの自動投稿を管理</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <Link key={s.label} href={s.href}
            className={`bg-gradient-to-br ${s.color} rounded-xl border border-gray-800 p-4 hover:border-gray-600 transition-colors`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <Link href="/themes/new"
          className="bg-gray-900 border border-gray-800 hover:border-green-500/50 rounded-xl p-4 flex items-center gap-3 transition-colors group">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-xl">🗂️</div>
          <div>
            <div className="text-sm font-medium group-hover:text-green-400 transition-colors">新しいテーマ作成</div>
            <div className="text-xs text-gray-500 mt-0.5">カテゴリと方針を設定</div>
          </div>
        </Link>
        <Link href="/articles/new"
          className="bg-gray-900 border border-gray-800 hover:border-teal-500/50 rounded-xl p-4 flex items-center gap-3 transition-colors group">
          <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center text-xl">✍️</div>
          <div>
            <div className="text-sm font-medium group-hover:text-teal-400 transition-colors">記事をAI生成</div>
            <div className="text-xs text-gray-500 mt-0.5">Claudeが自動で記事作成</div>
          </div>
        </Link>
        <Link href="/accounts/new"
          className="bg-gray-900 border border-gray-800 hover:border-cyan-500/50 rounded-xl p-4 flex items-center gap-3 transition-colors group">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center text-xl">👤</div>
          <div>
            <div className="text-sm font-medium group-hover:text-cyan-400 transition-colors">アカウント追加</div>
            <div className="text-xs text-gray-500 mt-0.5">note.comアカウントを連携</div>
          </div>
        </Link>
      </div>

      {/* Recent Articles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">最近の記事</h2>
          <Link href="/articles" className="text-xs text-green-400 hover:text-green-300 transition-colors">すべて見る →</Link>
        </div>
        {data.recentArticles.length === 0
          ? (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-gray-400 text-sm">まだ記事がありません</p>
              <p className="text-gray-500 text-xs mt-1">テーマを作成してAI記事を生成しましょう</p>
            </div>
          )
          : (
            <div className="space-y-2">
              {data.recentArticles.map((article: any) => {
                const st = STATUS_LABELS[article.status] ?? STATUS_LABELS.DRAFT
                return (
                  <Link key={article.id} href={`/articles/${article.id}`}
                    className="flex items-center gap-3 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 p-4 transition-colors">
                    {article.topImageUrl
                      ? <img src={article.topImageUrl} alt="" className="w-12 h-8 object-cover rounded-lg flex-shrink-0" />
                      : <div className="w-12 h-8 bg-green-500/20 rounded-lg flex-shrink-0 flex items-center justify-center text-sm">📝</div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">{article.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {article.theme?.title} • {new Date(article.createdAt).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
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
