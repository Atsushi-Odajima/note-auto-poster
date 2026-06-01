'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'エラーが発生しました'); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="w-full max-w-sm px-4">
      {/* Logo */}
      <div className="text-center mb-8">
        <img src="/logo.svg" alt="Kuro Note" className="w-full max-w-xs mx-auto" />
        <p className="text-gray-500 text-sm mt-2">noteを自動で運用</p>
      </div>

      <form onSubmit={submit} className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">メールアドレス</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">パスワード</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors" />
        </div>
        {error && <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-all disabled:opacity-50">
          {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '新規登録'}
        </button>
        <p className="text-center text-xs text-gray-500">
          {mode === 'login' ? 'アカウントをお持ちでない方：' : 'すでにアカウントをお持ちの方：'}
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-green-400 hover:text-green-300 ml-1 transition-colors">
            {mode === 'login' ? '新規登録' : 'ログイン'}
          </button>
        </p>
      </form>
    </div>
  )
}
