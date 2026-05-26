'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function NewArticleForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [themes, setThemes] = useState<any[]>([])
  const [themeId, setThemeId] = useState(params.get('themeId') ?? '')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/themes').then(r => r.json()).then(setThemes)
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!themeId) { alert('テーマを選択してください'); return }
    setSaving(true)
    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeId, title, body }),
    })
    const data = await res.json()
    if (res.ok) router.push(`/articles/${data.id}`)
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">記事を手動作成</h1>
      <form onSubmit={create} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">テーマ *</label>
          <select value={themeId} onChange={e => setThemeId(e.target.value)} required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
            <option value="">テーマを選択...</option>
            {themes.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">タイトル *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">本文 (マークダウン)</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={12}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-green-500 resize-none" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-green-500 hover:bg-green-400 text-white px-5 py-2.5 rounded-lg text-sm disabled:opacity-50 transition-colors">
            {saving ? '作成中...' : '作成'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg text-sm transition-colors">
            キャンセル
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NewArticlePage() {
  return <Suspense><NewArticleForm /></Suspense>
}
