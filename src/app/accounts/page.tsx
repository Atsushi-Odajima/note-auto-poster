'use client'
import { useEffect, useState } from 'react'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(setAccounts)
  }, [])

  async function addAccount(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true); setError('')
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'エラー'); setAdding(false); return }
    setAccounts(a => [data, ...a])
    setEmail(''); setPassword(''); setShowForm(false); setAdding(false)
  }

  async function deleteAccount(id: string) {
    if (!confirm('このアカウントを削除しますか？')) return
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    setAccounts(a => a.filter(x => x.id !== id))
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">アカウント管理</h1>
          <p className="text-gray-400 text-sm mt-1">note.comアカウントを管理</p>
        </div>
        <button onClick={() => setShowForm(f => !f)}
          className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + アカウント追加
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={addAccount} className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5 space-y-3">
          <h2 className="text-sm font-semibold">note.comアカウントを追加</h2>
          <p className="text-xs text-gray-500">note.comのログイン情報を入力してください。自動でセッション取得します。</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">パスワード</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
            </div>
          </div>
          {error && <p className="text-red-400 text-xs bg-red-500/10 rounded px-3 py-2">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={adding}
              className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors">
              {adding ? '追加中...' : '追加'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* Account List */}
      {accounts.length === 0
        ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">👤</div>
            <p className="text-gray-400 text-sm">アカウントがありません</p>
            <p className="text-gray-500 text-xs mt-1">「アカウント追加」からnote.comアカウントを追加してください</p>
          </div>
        )
        : (
          <div className="space-y-3">
            {accounts.map((acc: any) => (
              <div key={acc.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                {acc.avatarUrl
                  ? <img src={acc.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  : <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-lg">👤</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{acc.displayName ?? acc.email}</div>
                  {acc.urlname && <div className="text-xs text-gray-400">@{acc.urlname}</div>}
                  <div className="text-xs text-gray-500 mt-0.5">{acc.email}</div>
                  <div className={`inline-flex items-center gap-1 text-xs mt-1 px-2 py-0.5 rounded-full ${acc.sessionToken ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {acc.sessionToken ? '✅ セッション有効' : '⚠️ 未連携'}
                  </div>
                </div>
                <button onClick={() => deleteAccount(acc.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors text-sm p-2">
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
