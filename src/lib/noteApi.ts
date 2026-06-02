/**
 * note.com unofficial API wrapper
 * note.com のWeb APIを使用した自動投稿
 */

const BASE = 'https://note.com'
const API  = 'https://note.com/api'

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

export interface NoteSession {
  sessionCookie: string
  urlname: string
  displayName: string
  avatarUrl?: string
}

export interface NotePostResult {
  success: boolean
  articleId?: string
  noteUrl?: string
  error?: string
}

/**
 * note.com にメール/パスワードでログインしてセッションクッキーを取得
 *
 * 2ステップ:
 *   1) GET /login で `_note_session_v5` などの初期 Cookie を取得
 *   2) その Cookie を載せて POST /api/v1/sessions
 */
export async function loginToNote(email: string, password: string): Promise<NoteSession> {
  // 1. 初期 Cookie 取得
  const initRes = await fetch(`${BASE}/login`, {
    method: 'GET',
    headers: { 'User-Agent': UA, 'Accept': 'text/html' },
    redirect: 'manual',
  })
  const initCookieHeader = buildCookieHeader(getSetCookies(initRes))

  // 2. セッション POST
  const res = await fetch(`${API}/v1/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': UA,
      'Referer': `${BASE}/login`,
      'Origin': BASE,
      'X-Requested-With': 'XMLHttpRequest',
      ...(initCookieHeader ? { 'Cookie': initCookieHeader } : {}),
    },
    body: JSON.stringify({ login: email, password }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 300)}` : ''}`)
  }

  // 認証後の Cookie を初期 Cookie とマージ
  const loginCookies = getSetCookies(res)
  const mergedCookieHeader = mergeCookieHeaders(initCookieHeader, buildCookieHeader(loginCookies))

  const data: any = await res.json().catch(() => ({}))
  const user = data?.data?.user ?? data?.user ?? {}

  return {
    sessionCookie: mergedCookieHeader,
    urlname: user.urlname ?? user.nickname ?? email.split('@')[0],
    displayName: user.nickname ?? user.urlname ?? email.split('@')[0],
    avatarUrl: user.userProfileImagePath,
  }
}

/**
 * 記事をテキストノートとして投稿（下書き→公開）
 */
export async function postArticleToNote(
  sessionCookie: string,
  title: string,
  body: string,
  publish: boolean = true
): Promise<NotePostResult> {
  // 1. 下書きとして作成
  const createRes = await fetch(`${API}/v2/text_notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
      'User-Agent': UA,
      'Referer': `${BASE}/n/new`,
      'Origin': BASE,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({
      name: title,
      body,
      status: 'draft',
      publish_at: null,
    }),
  })

  if (!createRes.ok) {
    const err = await createRes.text().catch(() => createRes.statusText)
    return { success: false, error: `記事作成失敗 (${createRes.status}): ${err}` }
  }

  const createData = await createRes.json()
  const noteId: string = createData?.data?.id ?? createData?.id
  const urlname: string = createData?.data?.user?.urlname

  if (!noteId) {
    return { success: false, error: '記事IDが取得できませんでした' }
  }

  if (!publish) {
    return {
      success: true,
      articleId: noteId,
      noteUrl: urlname ? `${BASE}/${urlname}/n/${noteId}` : undefined,
    }
  }

  // 2. 公開する
  const publishRes = await fetch(`${API}/v2/text_notes/${noteId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
      'User-Agent': UA,
      'Referer': `${BASE}/n/${noteId}/edit`,
      'Origin': BASE,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({ status: 'public' }),
  })

  if (!publishRes.ok) {
    const err = await publishRes.text().catch(() => publishRes.statusText)
    return { success: false, error: `公開失敗 (${publishRes.status}): ${err}` }
  }

  return {
    success: true,
    articleId: noteId,
    noteUrl: urlname ? `${BASE}/${urlname}/n/${noteId}` : `${BASE}/n/${noteId}`,
  }
}

/**
 * セッションの有効性を確認
 */
export async function verifyNoteSession(sessionCookie: string): Promise<boolean> {
  try {
    const res = await fetch(`${API}/v1/me`, {
      headers: {
        'Cookie': sessionCookie,
        'User-Agent': UA,
        'Accept': 'application/json',
        'Referer': BASE,
      },
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * 与えられたセッション Cookie から note.com のユーザープロフィールを取得
 */
export async function fetchNoteProfile(sessionCookie: string): Promise<{ urlname: string; displayName: string; avatarUrl?: string } | null> {
  try {
    const res = await fetch(`${API}/v1/me`, {
      headers: {
        'Cookie': sessionCookie,
        'User-Agent': UA,
        'Accept': 'application/json',
        'Referer': BASE,
      },
    })
    if (!res.ok) return null
    const data: any = await res.json()
    const user = data?.data?.user ?? data?.user ?? data?.data ?? data
    if (!user) return null
    return {
      urlname: user.urlname ?? user.nickname ?? '',
      displayName: user.nickname ?? user.urlname ?? '',
      avatarUrl: user.userProfileImagePath ?? user.profile_image_path,
    }
  } catch {
    return null
  }
}

// ─── helpers ──────────────────────────────────────────────────────

function getSetCookies(res: Response): string[] {
  // Node fetch: getSetCookie() を優先、なければ get('set-cookie') を split
  const hdrs = res.headers as any
  if (typeof hdrs.getSetCookie === 'function') {
    const list: string[] = hdrs.getSetCookie()
    return list ?? []
  }
  const raw = res.headers.get('set-cookie') ?? ''
  if (!raw) return []
  // 値内のカンマと Set-Cookie 区切りのカンマを区別
  return raw.split(/,(?=[^ ;]+=)/)
}

function buildCookieHeader(setCookies: string[]): string {
  const pairs: string[] = []
  for (const sc of setCookies) {
    const head = sc.split(';')[0].trim()
    if (head) pairs.push(head)
  }
  return pairs.join('; ')
}

function mergeCookieHeaders(a: string, b: string): string {
  if (!a) return b
  if (!b) return a
  // 後勝ち (b が新しい)
  const map = new Map<string, string>()
  for (const part of [...a.split('; '), ...b.split('; ')]) {
    const i = part.indexOf('=')
    if (i < 0) continue
    map.set(part.slice(0, i), part.slice(i + 1))
  }
  return Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
}
