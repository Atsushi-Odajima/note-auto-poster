'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CATEGORIES, STYLES, TONES } from '@/lib/categories'

export default function ThemesPage() {
  const [themes, setThemes] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', category: 'ai', description: '',
    style: 'informative', tone: 'professional',
    targetAudience: '', keywords: '', postsPerWeek: 3
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/themes').then(r => r.json()).then(setThemes)
  }, [])

  async function createTheme(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setThemes(t => [{ ...data, _count: { articles: 0 } }, ...t])
      setShowForm(false)
      setForm({ title: '', category: 'ai', description: '', style: 'informative', tone: 'professional', targetAudience: '', keywords: '', postsPerWeek: 3 })
    }
    setSaving(false)
  }

  async function deleteTheme(id: string) {
    if (!confirm('このテーマを削除しますか？')) return
    await fetch(`/api/themes/${id}`, { method: 'DELETE' })
    setThemes(t => t.filter(x => x.id !== id))
  }

  const getCat = (id: string) => CATEGORIES.find(c => c.id === id)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">テーマ管理</h1>
          <p className="text-gray-400 text-sm mt-1">記事の方向性・カテゴリを設定</p>
        </div>
        <button onClick={() => setShowForm(f => !f)}
          className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + テーマ作成
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={createTheme} className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-sm">新しいテーマを作成</h2>

          <div>
            <label className="block text-xs text-gray-400 mb-1">テーマ名 *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
              placeholder="例: AI活用術を毎日配信"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">カテゴリ *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
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
            {/* Style */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">スタイル</label>
              <select value={form.style} onChange={e => setForm(f => ({ ...f, style: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
                {STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            {/* Tone */}
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

          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors">
              {saving ? '作成中...' : 'テーマ作成'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {themes.length === 0
        ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">🗂️</div>
            <p className="text-gray-400 text-sm">テーマがありません</p>
            <p className="text-gray-500 text-xs mt-1">「テーマ作成」から始めましょう</p>
          </div>
        )
        : (
          <div className="space-y-3">
            {themes.map((theme: any) => {
              const cat = getCat(theme.category)
              return (
                <div key={theme.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                      {cat?.emoji ?? '🗂️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/themes/${theme.id}`} className="font-medium text-sm hover:text-green-400 transition-colors">
                          {theme.title}
                        </Link>
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                          {cat?.label ?? theme.category}
                        </span>
                      </div>
                      {theme.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{theme.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>📝 {theme._count?.articles ?? 0}記事</span>
                        <span>📅 週{theme.postsPerWeek}投稿</span>
                        {theme.targetAudience && <span>👥 {theme.targetAudience}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Link href={`/themes/${theme.id}`}
                        className="bg-green-500/20 hover:bg-green-500/40 text-green-400 px-3 py-1.5 rounded-lg text-xs transition-colors">
                        詳細
                      </Link>
                      <button onClick={() => deleteTheme(theme.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors text-sm p-1.5">
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
