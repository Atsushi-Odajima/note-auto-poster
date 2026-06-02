'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCategory } from '@/lib/categories'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(setAccounts)
  }, [])

  return (
    <div className="px-4 sm:px-6 pt-6 pb-6 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">アカウント管理</h1>
          <p className="text-gray-400 text-sm mt-1">note.comアカウントを管理</p>
        </div>
        <Link href="/accounts/new"
          className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0">
          + アカウント追加
        </Link>
      </div>

      {accounts.length === 0
        ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">👤</div>
            <p className="text-gray-400 text-sm">アカウントがありません</p>
            <p className="text-gray-500 text-xs mt-1">「アカウント追加」からnote.comアカウントを追加してください</p>
          </div>
        )
        : (
          <div className="space-y-3">
            {accounts.map((acc: any) => {
              const cat = getCategory(acc.category)
              return (
                <Link key={acc.id} href={`/accounts/${acc.id}`}
                  className="block bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors">
                  <div className="flex items-center gap-4">
                    {acc.avatarUrl
                      ? <img src={acc.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      : <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-lg flex-shrink-0">👤</div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{acc.displayName ?? acc.urlname ?? acc.email}</div>
                      {acc.urlname && <div className="text-xs text-gray-400 truncate">@{acc.urlname}</div>}
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{acc.email}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${acc.sessionToken ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {acc.sessionToken ? '✅ 連携済み' : '⚠️ 未連携'}
                        </span>
                        {cat
                          ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">{cat.emoji} {cat.short}</span>
                          : <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">カテゴリ未設定</span>
                        }
                      </div>
                    </div>
                    <span className="text-gray-600 text-lg flex-shrink-0">›</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )
      }
    </div>
  )
}
