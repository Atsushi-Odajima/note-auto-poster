'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT:      { label: '下書き',   color: 'bg-gray-700 text-gray-300' },
  GENERATING: { label: 'AI生成中', color: 'bg-blue-500/20 text-blue-400' },
  READY:      { label: '準備完了', color: 'bg-green-500/20 text-green-400' },
  SCHEDULED:  { label: '予約済み', color: 'bg-yellow-500/20 text-yellow-400' },
  POSTING:    { label: '投稿中',   color: 'bg-blue-500/20 text-blue-400' },
  POSTED:     { label: '投稿済み', color: 'bg-teal-500/20 text-teal-400' },
  FAILED:     { label: '失敗',     color: 'bg-red-500/20 text-red-400' },
}

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [article, setArticle] = useState<any>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [generatingImages, setGeneratingImages] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/articles/${id}`).then(r => r.json()).then(data => {
      if (data.error) { router.push('/articles'); return }
      setArticle(data)
      setTitle(data.title)
      setBody(data.body)
    })
  }, [id, router])

  useEffect(() => {
    load()
    fetch('/api/accounts').then(r => r.json()).then(setAccounts)
  }, [load])

  // Auto-refresh while generating
  useEffect(() => {
    if (article?.status === 'GENERATING') {
      const t = setTimeout(load, 3000)
      return () => clearTimeout(t)
    }
  }, [article?.status, load])

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/articles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    })
    const data = await res.json()
    if (res.ok) { setArticle(data); setEditing(false) }
    setSaving(false)
  }

  async function generateImages(type: string) {
    setGeneratingImages(true)
    const res = await fetch(`/api/articles/${id}/generate-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
    const data = await res.json()
    if (res.ok) setArticle((a: any) => ({ ...a, topImageUrl: data.article?.topImageUrl ?? a.topImageUrl, images: data.article?.images ?? a.images }))
    setGeneratingImages(false)
  }

  async function regenerate() {
    if (!confirm('記事をAIで再生成しますか？現在の内容は上書きされます。')) return
    setRegenerating(true)
    const res = await fetch(`/api/articles/${id}/regenerate`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) { setArticle(data); setTitle(data.title); setBody(data.body) }
    setRegenerating(false)
  }

  async function publish() {
    if (!selectedAccount) { alert('投稿するアカウントを選択してください'); return }
    setPublishing(true)
    const body_data: Record<string, unknown> = { accountId: selectedAccount }
    if (scheduledAt) body_data.scheduledAt = scheduledAt
    const res = await fetch(`/api/articles/${id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body_data),
    })
    const data = await res.json()
    if (res.ok) {
      setShowPublishModal(false)
      load()
      if (data.noteUrl) window.open(data.noteUrl, '_blank')
    } else {
      alert('投稿エラー: ' + data.error)
    }
    setPublishing(false)
  }

  if (!article) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-400 text-sm">読み込み中...</div>
    </div>
  )

  const st = STATUS_LABELS[article.status] ?? STATUS_LABELS.DRAFT
  const isGenerating = article.status === 'GENERATING'
  const wordCount = article.body?.replace(/[#\s]/g, '').length ?? 0

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <Link href="/articles" className="text-gray-400 hover:text-white transition-colors">記事</Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-300 line-clamp-1">{article.title}</span>
      </div>

      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${st.color} ${isGenerating ? 'animate-pulse' : ''}`}>
                {isGenerating ? '⚙️ ' : ''}{st.label}
              </span>
              <span className="text-xs text-gray-500">{article.theme?.title}</span>
              <span className="text-xs text-gray-500">📝 {wordCount}文字</span>
            </div>
            {editing
              ? <input value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full text-xl font-bold bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500" />
              : <h1 className="text-xl font-bold">{article.title}</h1>
            }
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {!isGenerating && (
              <>
                {editing
                  ? <>
                      <button onClick={save} disabled={saving}
                        className="bg-green-500 hover:bg-green-400 text-white px-3 py-1.5 rounded-lg text-xs disabled:opacity-50 transition-colors">
                        {saving ? '保存中...' : '💾 保存'}
                      </button>
                      <button onClick={() => { setEditing(false); setTitle(article.title); setBody(article.body) }}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs transition-colors">
                        キャンセル
                      </button>
                    </>
                  : <button onClick={() => setEditing(true)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs transition-colors">
                      ✏️ 編集
                    </button>
                }
                <button onClick={regenerate} disabled={regenerating}
                  className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50">
                  {regenerating ? '生成中...' : '🤖 再生成'}
                </button>
                {['READY', 'DRAFT'].includes(article.status) && (
                  <button onClick={() => setShowPublishModal(true)}
                    className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-all">
                    🚀 投稿
                  </button>
                )}
                {article.noteUrl && (
                  <a href={article.noteUrl} target="_blank" rel="noopener noreferrer"
                    className="bg-teal-500/20 hover:bg-teal-500/40 text-teal-400 px-3 py-1.5 rounded-lg text-xs transition-colors">
                    🔗 noteで見る
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Top Image */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">🖼️ タイトル画像</h2>
              <button onClick={() => generateImages('top')} disabled={generatingImages || !article.topImagePrompt}
                className="bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 px-3 py-1 rounded-lg text-xs transition-colors disabled:opacity-40">
                {generatingImages ? '生成中...' : '✨ DALL-E生成'}
              </button>
            </div>
            {article.topImageUrl
              ? <img src={article.topImageUrl} alt="Top" className="w-full rounded-lg object-cover max-h-48" />
              : <div className="bg-gray-800 rounded-lg h-32 flex items-center justify-center text-gray-500 text-sm">
                  {article.topImagePrompt ? '画像を生成してください' : '記事生成後に画像プロンプトが設定されます'}
                </div>
            }
            {article.topImagePrompt && (
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                Prompt: {article.topImagePrompt}
              </p>
            )}
          </div>

          {/* Body */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">📄 記事本文</h2>
            </div>
            {isGenerating
              ? (
                <div className="bg-gray-800 rounded-lg p-6 text-center">
                  <div className="text-2xl mb-2 animate-bounce">⚙️</div>
                  <p className="text-gray-400 text-sm">AIが記事を生成中...</p>
                  <p className="text-gray-500 text-xs mt-1">3秒ごとに自動更新</p>
                </div>
              )
              : editing
                ? <textarea value={body} onChange={e => setBody(e.target.value)}
                    rows={20}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-green-500 resize-none" />
                : article.body
                  ? <div className="prose prose-invert prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed">{article.body}</pre>
                    </div>
                  : <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-500 text-sm">本文がありません</div>
            }
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Section Images */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">🎨 差込画像</h2>
              <button onClick={() => generateImages('sections')} disabled={generatingImages || isGenerating}
                className="bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 px-2 py-1 rounded text-xs transition-colors disabled:opacity-40">
                {generatingImages ? '...' : '✨ 生成'}
              </button>
            </div>
            {article.images?.length > 0
              ? (
                <div className="space-y-2">
                  {article.images.map((img: any) => (
                    <div key={img.id}>
                      <img src={img.url} alt="" className="w-full rounded object-cover max-h-28" />
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">{img.prompt}</p>
                    </div>
                  ))}
                </div>
              )
              : <div className="text-center text-gray-500 text-xs py-4">差込画像なし</div>
            }
          </div>

          {/* All Images Button */}
          {!isGenerating && article.topImagePrompt && (
            <button onClick={() => generateImages('all')} disabled={generatingImages}
              className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 py-2.5 rounded-lg text-xs border border-purple-500/20 transition-colors disabled:opacity-40">
              ✨ タイトル＋差込画像を全て生成
            </button>
          )}

          {/* Stats */}
          {article.status === 'POSTED' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h2 className="text-sm font-semibold mb-3">📊 パフォーマンス</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">👁️ 閲覧</span><span>{article.views.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">❤️ スキ</span><span>{article.likes.toLocaleString()}</span></div>
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-xs text-gray-500 space-y-1.5">
            <div className="flex justify-between"><span>作成</span><span>{new Date(article.createdAt).toLocaleDateString('ja-JP')}</span></div>
            {article.postedAt && <div className="flex justify-between"><span>投稿</span><span>{new Date(article.postedAt).toLocaleDateString('ja-JP')}</span></div>}
            {article.account && <div className="flex justify-between"><span>アカウント</span><span>@{article.account.urlname ?? article.account.email}</span></div>}
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-bold text-lg mb-4">🚀 noteに投稿</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">投稿アカウント *</label>
                <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
                  <option value="">アカウントを選択...</option>
                  {accounts.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.displayName ?? acc.email}{acc.sessionToken ? ' ✅' : ' ⚠️'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">予約投稿 (任意)</label>
                <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
                <p className="text-xs text-gray-500 mt-1">空欄の場合は今すぐ投稿</p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={publish} disabled={publishing || !selectedAccount}
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-all">
                {publishing ? '投稿中...' : scheduledAt ? '⏰ 予約投稿' : '🚀 今すぐ投稿'}
              </button>
              <button onClick={() => setShowPublishModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg text-sm transition-colors">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
