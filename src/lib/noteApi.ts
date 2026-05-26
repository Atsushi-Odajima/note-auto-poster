/**
 * note.com unofficial API wrapper
 * note.com のWeb APIを使用した自動投稿
 */

const BASE = 'https://note.com'
const API  = 'https://note.com/api'

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
 */
export async function loginToNote(email: string, password: string): Promise<NoteSession> {
  const res = await fetch(`${API}/v1/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': `${BASE}/login`,
      'Origin': BASE,
    },
    body: JSON.stringify({ login: email, password }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`note.com ログイン失敗: ${err}`)
  }

  const setCookie = res.headers.get('set-cookie') ?? ''
  const cookieToken = extractSessionCookie(setCookie)

  const data = await res.json()
  const user = data?.data?.user ?? data?.user ?? {}

  return {
    sessionCookie: cookieToken,
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
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })
    return res.ok
  } catch {
    return false
  }
}

function extractSessionCookie(setCookieHeader: string): string {
  // 複数のSet-Cookieを ; で結合してリクエスト用クッキー文字列を生成
  const cookies: string[] = []
  const parts = setCookieHeader.split(/,(?=[^ ])/)
  for (const part of parts) {
    const nameVal = part.split(';')[0].trim()
    if (nameVal) cookies.push(nameVal)
  }
  return cookies.join('; ')
}
