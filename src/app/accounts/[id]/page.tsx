'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, getCategory } from '@/lib/categories'

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [account, setAccount] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [category, setCategory] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [reconnecting, setReconnecting] = useState(false)
  const [showReconnect, setShowReconnect] = useState(false)
  const [reconnectPassword, setReconnectPassword] = useState('')

  useEffect(() => {
    fetch(`/api/accounts/${id}`).then(r => r.json()).then(d => {
      setAccount(d)
      setCategory(d.category ?? null)
    })
  }, [id])

  async function save() {
    setSaving(true); setError('')
    const res = await fetch(`/api/accounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'エラー'); setSaving(false); return }
    setAccount(data)
    setEditing(false)
    setSaving(false)
  }

  async function reconnect(e: React.FormEvent) {
    e.preventDefault()
    setReconnecting(true); setError('')
    const res = await fetch(`/api/accounts/${id}/reconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: reconnectPassword }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'エラー'); setReconnecting(false); return }
    setAccount(data.account)
    setReconnectPassword('')
    setShowReconnect(false)
    setReconnecting(false)
  }

  async function remove() {
    if (!confirm('このアカウントを削除しますか？')) return
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    router.push('/accounts')
  }

  if (!account) return (
    <div className="px-4 sm:px-6 pt-6 pb-6 max-w-2xl mx-auto">
      <div className="text-gray-400 text-sm">読み込み中...</div>
    </div>
  )

  const cat = getCategory(account.category)

  return (
    <div className="px-4 sm:px-6 pt-6 pb-6 max-w-2xl mx-auto">
      <button onClick={() => router.push('/accounts')}
        className="text-gray-400 hover:text-white text-sm mb-4 transition-colors">
        ← アカウント一覧
      </button>

      <h1 className="text-2xl font-bold mb-1">アカウント詳細</h1>
      <p className="text-gray-400 text-sm mb-6">note.com 連携情報と投稿カテゴリ</p>

      {/* プロフィール */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          {account.avatarUrl
            ? <img src={account.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
            : <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center text-2xl flex-shrink-0">👤</div>
          }
          <div className="min-w-0">
            <div className="font-semibold text-base truncate">{account.displayName ?? account.urlname ?? '(未取得)'}</div>
            {account.urlname && <div className="text-sm text-gray-400 truncate">@{account.urlname}</div>}
          </div>
        </div>

        <div className="space-y-2.5 text-sm">
          <Row label="メール" value={account.email} />
          <Row label="note名" value={account.displayName ?? '—'} />
          <Row label="urlname" value={account.urlname ? `@${account.urlname}` : '—'} />
          <Row label="投稿カテゴリ" value={cat ? `${cat.emoji} ${cat.label}` : '未設定'} />
          <Row label="連携状態" value={
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${account.sessionToken ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {account.sessionToken ? '✅ 連携済み' : '⚠️ 未連携'}
            </span>
          } />
          <Row label="登録日" value={new Date(account.createdAt).toLocaleString('ja-JP')} />
        </div>

        <div className="flex flex-wrap gap-2 mt-5">
          <button onClick={() => setEditing(e => !e)}
            className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {editing ? 'キャンセル' : '編集'}
          </button>
          <button onClick={() => setShowReconnect(s => !s)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            {account.sessionToken ? '🔄 再連携' : '🔗 連携'}
          </button>
          <button onClick={remove}
            className="ml-auto text-red-400 hover:text-red-300 text-sm px-3 py-2 transition-colors">
            🗑 削除
          </button>
        </div>
      </div>

      {/* 編集フォーム */}
      {editing && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
          <h2 className="font-semibold text-sm mb-3">編集</h2>
          <label className="block text-xs text-gray-400 mb-2">投稿カテゴリ</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
            <button type="button" onClick={() => setCategory(null)}
              className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                category === null
                  ? 'border-green-500 bg-green-500/20 text-green-300'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
              }`}>
              <span className="font-medium">未設定</span>
            </button>
            {CATEGORIES.map(c => (
              <button key={c.id} type="button" onClick={() => setCategory(c.id)}
                className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                  category === c.id
                    ? 'border-green-500 bg-green-500/20 text-green-300'
                    : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                }`}>
                <span className="mr-1">{c.emoji}</span>
                <span className="font-medium">{c.short}</span>
                <div className="text-gray-500 mt-0.5 line-clamp-2 leading-tight">{c.label}</div>
              </button>
            ))}
          </div>
          {error && <p className="text-red-400 text-xs bg-red-500/10 rounded px-3 py-2 mt-3">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={save} disabled={saving}
              className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}

      {/* 連携/再連携フォーム */}
      {showReconnect && (
        <form onSubmit={reconnect} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">{account.sessionToken ? 'セッション再取得' : 'note.com に連携'}</h2>
          <p className="text-xs text-gray-500">
            note.com のパスワードを入力してください。セッショントークンを再取得します。
          </p>
          <div>
            <label className="block text-xs text-gray-400 mb-1">パスワード</label>
            <input type="password" value={reconnectPassword} onChange={e => setReconnectPassword(e.target.value)} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          </div>
          {error && <p className="text-red-400 text-xs bg-red-500/10 rounded px-3 py-2">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={reconnecting}
              className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors">
              {reconnecting ? '連携中...' : '連携実行'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-xs text-gray-500 w-24 flex-shrink-0 pt-0.5">{label}</div>
      <div className="text-sm text-gray-200 min-w-0 break-all">{value}</div>
    </div>
  )
}
