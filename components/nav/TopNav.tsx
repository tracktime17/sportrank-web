'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useFavorites } from '@/lib/store/useFavorites'
import { useCompare } from '@/lib/store/useCompare'

const LINKS = [
  { href: '/', label: 'Descubrir' },
  { href: '/explorar', label: 'Explorar' },
  { href: '/comparar', label: 'Comparar' },
  { href: '/favoritos', label: 'Favoritos' },
]

export function TopNav() {
  const pathname = usePathname()
  const { count: favCount, hydrated: favHydrated } = useFavorites()
  const { count: compareCount, hydrated: compareHydrated } = useCompare()

  return (
    <nav className="topnav">
      <div className="wrap">
        <Link href="/" className="logo">
          <span className="dot" />
          SportRank
        </Link>
        <div className="navlinks">
          {LINKS.map((link) => {
            const active = pathname === link.href
            const badgeCount = link.href === '/comparar' ? compareCount : link.href === '/favoritos' ? favCount : null
            const showBadge = link.href === '/comparar' ? compareHydrated : link.href === '/favoritos' ? favHydrated : false
            return (
              <Link key={link.href} href={link.href} className={active ? 'active' : ''}>
                {link.label}
                {showBadge && badgeCount !== null && <span className="badge">{badgeCount}</span>}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
