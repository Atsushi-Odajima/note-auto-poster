'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewAccountPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'エラー'); setSaving(false); return }
    router.push('/accounts')
  }

  return (
    <div className="px-4 sm:px-6 pt-6 pb-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">アカウント追加</h1>
      <p className="text-gray-400 text-sm mb-6">note.comアカウントを連携します。ログイン情報から自動でセッションを取得します。</p>

      <form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">メールアドレス</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="note.com に登録しているメール"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">パスワード</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
        </div>
        {error && <p className="text-red-400 text-xs bg-red-500/10 rounded px-3 py-2">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving}
            className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors">
            {saving ? '連携中...' : '連携する'}
          </button>
          <button type="button" onClick={() => router.push('/accounts')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            キャンセル
          </button>
        </div>
      </form>
    </div>
  )
}
