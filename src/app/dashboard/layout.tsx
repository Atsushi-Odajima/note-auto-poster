import { Sidebar, BottomNav } from '@/components/nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-60 pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  )
}
