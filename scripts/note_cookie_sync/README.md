# note.com Cookie 同期スクリプト

Kuro Note (Vercel デプロイ) は HTTP-only である `_note_session_v5` Cookie を必要としますが、Vercel 側で headless Chrome を動かしても note.com の bot 検出に高確率で弾かれます。

このスクリプトは **自宅 PC の通常の Chrome** で note.com にログインして Cookie を取得し、Kuro Note に POST します。Bot 検出を回避できるうえ、reCAPTCHA が出た場合も手動で解けます。

## セットアップ (一度だけ)

```bash
cd scripts/note_cookie_sync
python -m venv .venv
source .venv/bin/activate          # Windows なら .venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
```

Python 3.10 以上が必要です。

## 使い方 (毎回 / 30 日に 1 度)

### 1. iPhone でワンタイムトークンを発行

1. Kuro Note アプリで該当アカウントの **詳細画面** へ
2. **「🖥 PC スクリプト連携」** ボタンをタップ
3. **「ワンタイムトークン発行」** をタップ (1 時間有効)
4. 表示された **`sync URL`** と **`token`** を PC に送る (自分宛メール / Slack / メモ etc.)

### 2. PC でスクリプトを実行

```bash
python capture_and_sync.py \
  --sync-url "https://<your-app>.vercel.app/api/sync-cookie" \
  --token   "eyJhbGciOiJIUzI1NiI..." \
  --email   "note.com のメール"
```

実行すると Chrome が立ち上がり、note.com のログイン画面が表示されます。スクリプトが自動でメール・パスワードを入力するので、必要ならログインボタンを押す / reCAPTCHA を解くだけ。

ログインが完了すると Cookie を取得して Kuro Note に送信、ターミナルに ✅ が出ます。iPhone 側のアカウント詳細を再読み込みすれば「✅ 連携済み」になっています。

### オプション

| フラグ | 用途 |
|---|---|
| `--email <addr>` | メールを引数で渡す (省略時は対話入力) |
| `--no-password-prefill` | パスワード入力をブラウザでだけ行う (ターミナルで聞かない) |
| `--headless` | ヘッドレス起動。non-推奨 (note.com の bot 検出を喰らいやすい) |

## 自動化 (任意)

cron や Windows タスクスケジューラで 25 日に 1 度実行するように仕込めば、ほぼ「いつでも動く状態」を維持できます。

```cron
# 毎月 1 日 朝 9 時に同期 (要 sync-url, token のキャッシュ — token は使い捨てなので別方式が必要)
0 9 1 * * cd ~/kuro-note-sync && ./.venv/bin/python capture_and_sync.py --sync-url ... --token ... --email ... --no-password-prefill
```

> Note: token は 1 時間有効なワンタイムなので、フル自動化したい場合は別途「長期 API キー」エンドポイントを追加する必要があります。

## トラブルシュート

- **`Cookie が note.com で受け付けられませんでした`**: ログインが完了する前にスクリプトが終わった可能性。`--no-password-prefill` で手動ログインしてみる
- **`_note_session_v5 が含まれていません`**: note.com 側で別のセッション名に変わっているかも。issue で報告してください
- **タイムアウト**: デフォルトで 3 分待ちます。reCAPTCHA を含めて 3 分以内に終わらせてください
