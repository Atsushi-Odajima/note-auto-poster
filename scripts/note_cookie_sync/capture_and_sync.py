#!/usr/bin/env python3
"""
Kuro Note - note.com Cookie 同期

自宅 PC で起動 → 通常の Chrome で note.com にログイン → セッション Cookie を
取得して Kuro Note 側 (Vercel デプロイ) に同期する。

使い方:
    python capture_and_sync.py \
        --sync-url "https://<your-kuro-note>.vercel.app/api/sync-cookie" \
        --token   "<iPhone の Kuro Note で発行したワンタイムトークン>"

iPhone (Kuro Note) の操作:
    1. アカウント詳細 → 「🖥 PC スクリプト連携」セクション
    2. 「ワンタイムトークン発行」を押す
    3. 表示された sync-url と token を PC に送る (メール / Slack 自分宛など)

PC 操作:
    上の python コマンドを実行。Chrome ウィンドウが立ち上がるので、
    自動入力されるログイン情報を確認して、必要ならパスワード入力 / reCAPTCHA を解く。
    ログインが完了すると Cookie を抽出して Kuro Note に POST、ターミナルに ✅ が出る。

要件: Python 3.10+ / playwright (Chromium ブラウザ込み)
"""
from __future__ import annotations

import argparse
import asyncio
import getpass
import sys
from typing import Optional

import requests
from playwright.async_api import async_playwright, TimeoutError as PWTimeout


NOTE_LOGIN_URL = "https://note.com/login"


async def capture_cookies(
    email: str,
    password: Optional[str],
    headless: bool = False,
    login_timeout_ms: int = 180_000,
) -> str:
    """note.com で実 Chrome を起動してログインし、Cookie ヘッダ文字列を返す。"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=headless,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
            ],
        )
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 800},
            locale="ja-JP",
        )
        page = await context.new_page()

        print("📂 note.com にアクセス中...")
        await page.goto(NOTE_LOGIN_URL, wait_until="domcontentloaded")

        # 入力欄を埋める (UI が変わっても多少寛容になるよう複数セレクタを試す)
        print("🔑 メール入力欄を探しています...")
        for selector in [
            'input[name="login"]',
            'input[type="email"]',
            'input[autocomplete="username"]',
        ]:
            if await page.locator(selector).count():
                await page.locator(selector).first.fill(email)
                break

        if password:
            for selector in [
                'input[name="password"]',
                'input[type="password"]',
                'input[autocomplete="current-password"]',
            ]:
                if await page.locator(selector).count():
                    await page.locator(selector).first.fill(password)
                    break

        print(
            "👉 ブラウザでログインボタンを押してください "
            "(reCAPTCHA がある場合は手動で解いてください)"
        )
        try:
            # ログインページから抜けるのを待つ
            await page.wait_for_url(
                lambda url: "/login" not in url,
                timeout=login_timeout_ms,
            )
        except PWTimeout:
            print("⏱  タイムアウト: ログインが完了しませんでした", file=sys.stderr)
            await browser.close()
            sys.exit(1)

        print("🍪 Cookie を取得中...")
        cookies = await context.cookies(["https://note.com"])
        cookie_pairs = [f"{c['name']}={c['value']}" for c in cookies]
        cookie_header = "; ".join(cookie_pairs)

        await browser.close()

        if "_note_session" not in cookie_header:
            print(
                "⚠️  _note_session_v5 が含まれていません。"
                "本当に note.com にログインできたか確認してください。",
                file=sys.stderr,
            )

        return cookie_header


def push_to_kuro_note(sync_url: str, token: str, cookie: str) -> None:
    print("☁️  Kuro Note に Cookie を送信中...")
    res = requests.post(
        sync_url,
        json={"token": token, "cookie": cookie},
        timeout=30,
    )
    if res.ok:
        print("✅ 同期完了。iPhone 側のアカウント詳細で『連携済み』になっているはずです。")
    else:
        print(f"❌ 失敗 ({res.status_code}): {res.text}", file=sys.stderr)
        sys.exit(1)


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="note.com Cookie を取得して Kuro Note に同期する"
    )
    parser.add_argument(
        "--sync-url",
        required=True,
        help="Kuro Note の sync エンドポイント URL "
        "(例: https://<your-app>.vercel.app/api/sync-cookie)",
    )
    parser.add_argument(
        "--token",
        required=True,
        help="iPhone の Kuro Note で発行したワンタイムトークン (1 時間有効)",
    )
    parser.add_argument("--email", help="note.com のログインメール (省略時は対話入力)")
    parser.add_argument(
        "--no-password-prefill",
        action="store_true",
        help="パスワードはターミナルで聞かず、ブラウザで手入力する",
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        help="ヘッドレスで起動 (推奨されません: note.com に検出されやすい)",
    )
    args = parser.parse_args()

    email = args.email or input("note.com メール: ").strip()
    password = None if args.no_password_prefill else getpass.getpass("note.com パスワード: ")

    cookie = await capture_cookies(email, password, headless=args.headless)
    push_to_kuro_note(args.sync_url, args.token, cookie)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n中断しました", file=sys.stderr)
        sys.exit(130)
