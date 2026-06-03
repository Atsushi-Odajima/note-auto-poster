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

  const [showCookie, setShowCookie] = useState(false)
  const [cookieValue, setCookieValue] = useState('')
  const [cookieSaving, setCookieSaving] = useState(false)

  const [showPCSync, setShowPCSync] = useState(false)
  const [captureToken, setCaptureToken] = useState<string | null>(null)
  const [tokenIssuing, setTokenIssuing] = useState(false)

  const [showBookmarklet, setShowBookmarklet] = useState(false)
  const [bookmarklet, setBookmarklet] = useState<{ code: string; days: number } | null>(null)
  const [bmIssuing, setBmIssuing] = useState(false)

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

  async function submitCookie(e: React.FormEvent) {
    e.preventDefault()
    setCookieSaving(true); setError('')
    const res = await fetch(`/api/accounts/${id}/set-cookie`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookie: cookieValue }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'エラー'); setCookieSaving(false); return }
    setAccount(data.account)
    setCookieValue('')
    setShowCookie(false)
    setCookieSaving(false)
  }

  async function issueCaptureToken() {
    setTokenIssuing(true); setError('')
    const res = await fetch(`/api/accounts/${id}/capture-token`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'エラー'); setTokenIssuing(false); return }
    setCaptureToken(data.token)
    setTokenIssuing(false)
  }

  async function issueBookmarklet() {
    setBmIssuing(true); setError('')
    const res = await fetch(`/api/accounts/${id}/bookmarklet-token`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'エラー'); setBmIssuing(false); return }
    setBookmarklet({ code: data.bookmarklet, days: data.expiresInDays })
    setBmIssuing(false)
  }

  async function remove() {
    if (!confirm('このアカウントを削除しますか？')) return
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    router.push('/accounts')
  }

  function copy(text: string) {
    try { navigator.clipboard.writeText(text) } catch {}
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
          <button onClick={() => { setShowBookmarklet(s => !s); setShowPCSync(false); setShowCookie(false); setShowReconnect(false) }}
            className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            📌 iPhone 完結投稿
          </button>
          <button onClick={() => { setShowPCSync(s => !s); setShowBookmarklet(false); setShowCookie(false); setShowReconnect(false) }}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            🖥 PC スクリプト連携
          </button>
          <button onClick={() => { setShowCookie(s => !s); setShowBookmarklet(false); setShowPCSync(false); setShowReconnect(false) }}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            🍪 Cookie を貼り付け
          </button>
          <button onClick={() => { setShowReconnect(s => !s); setShowBookmarklet(false); setShowPCSync(false); setShowCookie(false) }}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors">
            🔑 パスワードで連携
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

      {/* iPhone 完結 Bookmarklet (Phase 1) */}
      {showBookmarklet && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3 mb-4">
          <h2 className="font-semibold text-sm">📌 iPhone 完結投稿 (Bookmarklet 方式)</h2>
          <p className="text-xs text-gray-400">
            note.com 側のセッションを Safari がそのまま使うので、Cookie 保存が不要・無料・iPhone のみで完結します。
            記事は「公開キューに追加」したものから順に投稿されます (1 タップ = 1 記事)。
          </p>

          {!bookmarklet ? (
            <button onClick={issueBookmarklet} disabled={bmIssuing}
              className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors">
              {bmIssuing ? '生成中...' : 'Bookmarklet を生成 (90日有効)'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-gray-400 space-y-1.5">
                <p className="text-gray-300 font-semibold">📋 Safari への登録 (初回 1 回だけ)</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>下の <span className="text-gray-200 font-semibold">Bookmarklet コード</span> を <span className="text-green-400">「コピー」</span></li>
                  <li>Safari で <span className="font-mono text-gray-200">about:blank</span> など適当なページを開く</li>
                  <li>共有ボタン → <span className="text-gray-200">「ブックマークに追加」</span> → 名前を <span className="font-mono text-gray-200">📤 Kuro Note 投稿</span> 等にして保存</li>
                  <li>Safari 下部のブックマークアイコン → 編集 → 今作成したブックマークをタップ</li>
                  <li>URL 欄を全削除して、コピーした Bookmarklet コードを<span className="text-yellow-300">そのまま貼り付け</span> → 完了</li>
                  <li>そのブックマークを <span className="text-gray-200">「お気に入り」</span> に移動しておくと毎回 1 タップで呼べる</li>
                </ol>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Bookmarklet コード ({bookmarklet.days} 日有効)</label>
                <textarea readOnly value={bookmarklet.code} rows={5}
                  onClick={e => (e.target as HTMLTextAreaElement).select()}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-[10px] font-mono break-all resize-none" />
                <button onClick={() => copy(bookmarklet.code)}
                  className="mt-2 bg-green-500 hover:bg-green-400 text-white text-xs px-3 py-2 rounded-lg">
                  📋 コードを全文コピー
                </button>
              </div>

              <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-gray-400 space-y-1.5">
                <p className="text-gray-300 font-semibold">🚀 毎回の投稿フロー (登録後)</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Kuro Note で記事を生成 → 詳細画面で <span className="text-green-400">「✅ 公開キューに追加」</span></li>
                  <li>Safari で <span className="font-mono text-gray-200">note.com</span> を開く (ログイン済みの状態)</li>
                  <li>Safari のお気に入り → <span className="font-mono text-gray-200">📤 Kuro Note 投稿</span> をタップ</li>
                  <li>キューの先頭記事が note.com に自動投稿される (画面右下に進捗表示)</li>
                </ol>
              </div>

              <p className="text-xs text-yellow-400/80 bg-yellow-500/10 rounded px-3 py-2">
                ⚠️ Bookmarklet コードには本人専用の長期トークンが含まれます。他人に共有しないでください。漏れた場合は同じボタンから再発行 (古いものは無効に出来ないので、必要なら全パスワードリセット推奨)。
              </p>
            </div>
          )}

          {error && <p className="text-red-400 text-xs bg-red-500/10 rounded px-3 py-2 break-words">{error}</p>}
        </div>
      )}

      {/* PC スクリプト連携 (最推奨) */}
      {showPCSync && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3 mb-4">
          <h2 className="font-semibold text-sm">🖥 PC スクリプト連携（最推奨・スマホ完結に最も近い方法）</h2>
          <p className="text-xs text-gray-400">
            自宅 PC の <span className="font-mono text-gray-200">Chrome</span> で note.com にログインして
            Cookie を自動取得するスクリプトを使う方式です。下のトークンを PC に送れば、
            スマホでの操作は終わり。あとは PC でコマンド 1 行実行するだけ。
          </p>

          <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-gray-400 space-y-1">
            <p className="text-gray-300 font-semibold mb-1">📋 セットアップ (PC 側、1 回だけ)</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>リポジトリの <span className="font-mono text-gray-200">scripts/note_cookie_sync/</span> を取得</li>
              <li><span className="font-mono text-gray-200">pip install -r requirements.txt</span></li>
              <li><span className="font-mono text-gray-200">playwright install chromium</span></li>
            </ol>
          </div>

          {!captureToken ? (
            <button onClick={issueCaptureToken} disabled={tokenIssuing}
              className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors">
              {tokenIssuing ? '発行中...' : 'ワンタイムトークン発行 (1時間有効)'}
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">sync URL</label>
                <div className="flex gap-1">
                  <input readOnly value={typeof window !== 'undefined' ? `${window.location.origin}/api/sync-cookie` : ''}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono" />
                  <button onClick={() => copy(`${window.location.origin}/api/sync-cookie`)}
                    className="bg-gray-700 hover:bg-gray-600 px-3 rounded-lg text-xs">コピー</button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">token (1時間有効)</label>
                <div className="flex gap-1">
                  <input readOnly value={captureToken}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono" />
                  <button onClick={() => copy(captureToken)}
                    className="bg-gray-700 hover:bg-gray-600 px-3 rounded-lg text-xs">コピー</button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">PC で実行するコマンド</label>
                <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs font-mono text-gray-200 break-all whitespace-pre-wrap">
{`python capture_and_sync.py \\
  --sync-url "${typeof window !== 'undefined' ? window.location.origin : ''}/api/sync-cookie" \\
  --token "${captureToken}" \\
  --email "note.com のメール"`}
                </div>
                <button onClick={() => copy(`python capture_and_sync.py --sync-url "${window.location.origin}/api/sync-cookie" --token "${captureToken}" --email "note.com のメール"`)}
                  className="mt-2 bg-gray-700 hover:bg-gray-600 text-xs px-3 py-1.5 rounded-lg">コマンド全体をコピー</button>
              </div>
              <p className="text-xs text-gray-500">
                上の sync URL と token (or コマンド全体) を PC に送ってください (メール / Slack 自分宛 etc.)。
                PC で実行すると Chrome が開き、ログイン後に自動で Cookie が同期されます。
              </p>
            </div>
          )}

          {error && <p className="text-red-400 text-xs bg-red-500/10 rounded px-3 py-2 break-words">{error}</p>}
        </div>
      )}

      {/* Cookie 貼り付け（推奨） */}
      {showCookie && (
        <form onSubmit={submitCookie} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">🍪 Cookie で連携（推奨）</h2>
          <details className="text-xs text-gray-400 bg-gray-950 border border-gray-800 rounded-lg p-3">
            <summary className="cursor-pointer text-gray-300">取得手順を表示</summary>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-400">
              <li>PC ブラウザで <span className="text-gray-200">note.com</span> にログインする</li>
              <li>キーボードで <span className="font-mono text-gray-200">F12</span> を押して開発者ツールを開く</li>
              <li>「アプリケーション」→「Cookie」→「https://note.com」を選択</li>
              <li><span className="font-mono text-gray-200">_note_session_v5</span> という行の「値」をコピー</li>
              <li>下の欄に <span className="font-mono text-gray-200">_note_session_v5=コピーした値</span> の形で貼り付け</li>
            </ol>
            <p className="text-gray-500 mt-2">複数の Cookie を貼る場合は <span className="font-mono">名前=値; 名前=値</span> のようにセミコロン区切り。</p>
          </details>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Cookie</label>
            <textarea value={cookieValue} onChange={e => setCookieValue(e.target.value)} required
              rows={3} placeholder="_note_session_v5=xxxxx..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-green-500 resize-none" />
          </div>
          {error && <p className="text-red-400 text-xs bg-red-500/10 rounded px-3 py-2 break-words whitespace-pre-wrap">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={cookieSaving}
              className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors">
              {cookieSaving ? '検証中...' : '連携実行'}
            </button>
          </div>
        </form>
      )}

      {/* パスワード連携（非推奨フォールバック） */}
      {showReconnect && (
        <form onSubmit={reconnect} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">🔑 パスワードで連携</h2>
          <p className="text-xs text-yellow-400/80 bg-yellow-500/10 rounded px-3 py-2">
            ⚠️ note.com 側で公式パスワード API が廃止されており、この方法は <span className="font-semibold">404 で失敗する可能性が高い</span>です。失敗した場合は上の「🍪 Cookie で連携」をお使いください。
          </p>
          <div>
            <label className="block text-xs text-gray-400 mb-1">パスワード</label>
            <input type="password" value={reconnectPassword} onChange={e => setReconnectPassword(e.target.value)} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          </div>
          {error && <p className="text-red-400 text-xs bg-red-500/10 rounded px-3 py-2 break-words whitespace-pre-wrap">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={reconnecting}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors">
              {reconnecting ? '連携中...' : '試す'}
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
