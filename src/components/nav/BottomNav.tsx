'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, List, BarChart2, Settings2, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/lancamentos', label: 'Lançamentos', icon: List },
  { href: '/entradas', label: 'Entradas', icon: Wallet },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2 },
  { href: '/cadastros', label: 'Cadastros', icon: Settings2 },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border md:hidden">
      <div className="flex">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span className={cn('font-medium', active ? 'opacity-100' : 'opacity-60')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
