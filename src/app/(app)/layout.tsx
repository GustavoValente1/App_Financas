import { Sidebar } from '@/components/nav/Sidebar'
import { BottomNav } from '@/components/nav/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-56 pb-20 md:pb-0">
        <div className="max-w-lg mx-auto px-4 py-5 md:px-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
