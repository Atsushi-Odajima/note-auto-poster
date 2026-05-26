'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard', icon: '📊', label: 'ダッシュボード' },
  { href: '/accounts',  icon: '👤', label: 'アカウント' },
  { href: '/themes',    icon: '🗂️',  label: 'テーマ' },
  { href: '/articles',  icon: '✍️',  label: '記事' },
  { href: '/queue',     icon: '📅', label: 'キュー' },
]

export function Sidebar() {
  const path = usePathname()
  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-gray-950 border-r border-gray-800 fixed left-0 top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
          note Auto
        </span>
        <p className="text-xs text-gray-500 mt-0.5">自動投稿アプリ</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              path.startsWith(l.href)
                ? 'bg-green-500/20 text-green-400 font-medium'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}>
            <span className="text-base">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-800">
        <form action="/api/auth/logout" method="POST">
          <button className="w-full text-left text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1.5 rounded">
            ログアウト
          </button>
        </form>
      </div>
    </aside>
  )
}

export function BottomNav() {
  const path = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 flex z-50">
      {links.map(l => (
        <Link key={l.href} href={l.href}
          className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
            path.startsWith(l.href) ? 'text-green-400' : 'text-gray-500'
          }`}>
          <span className="text-lg">{l.icon}</span>
          <span className="mt-0.5 text-[10px]">{l.label}</span>
        </Link>
      ))}
    </nav>
  )
}
