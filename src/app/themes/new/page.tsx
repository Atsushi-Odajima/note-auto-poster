'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, STYLES, TONES } from '@/lib/categories'

export default function NewThemePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', category: 'ai', description: '',
    style: 'informative', tone: 'professional',
    targetAudience: '', keywords: '', postsPerWeek: 3,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const res = await fetch('/api/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'エラー'); setSaving(false); return }
    router.push('/themes')
  }

  return (
    <div className="px-4 sm:px-6 pt-6 pb-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">新しいテーマ作成</h1>
      <p className="text-gray-400 text-sm mb-6">記事のカテゴリと方向性を設定します。</p>

      <form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">テーマ名 *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
            placeholder="例: AI活用術を毎日配信"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">カテゴリ *</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
            {CATEGORIES.map(cat => (
              <button key={cat.id} type="button"
                onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                  form.category === cat.id
                    ? 'border-green-500 bg-green-500/20 text-green-300'
                    : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                }`}>
                <span className="mr-1">{cat.emoji}</span>
                <span className="font-medium">{cat.label}</span>
                <div className="text-gray-500 mt-0.5 line-clamp-2 leading-tight">{cat.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">スタイル</label>
            <select value={form.style} onChange={e => setForm(f => ({ ...f, style: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
              {STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">トーン</label>
            <select value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
              {TONES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">想定読者</label>
            <input value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}
              placeholder="例: 20代会社員"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">週投稿数</label>
            <input type="number" min="1" max="30" value={form.postsPerWeek}
              onChange={e => setForm(f => ({ ...f, postsPerWeek: Number(e.target.value) }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">キーワード (カンマ区切り)</label>
          <input value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
            placeholder="例: ChatGPT, 自動化, 生産性"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">説明・補足</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2} placeholder="AIへの追加指示など..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none" />
        </div>

        {error && <p className="text-red-400 text-xs bg-red-500/10 rounded px-3 py-2">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving}
            className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors">
            {saving ? '作成中...' : 'テーマ作成'}
          </button>
          <button type="button" onClick={() => router.push('/themes')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            キャンセル
          </button>
        </div>
      </form>
    </div>
  )
}
