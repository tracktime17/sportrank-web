'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HomeIcon, SearchIcon, CompareIcon, HeartIcon } from '@/components/ui/Icons'
import { useFavorites } from '@/lib/store/useFavorites'
import { useCompare } from '@/lib/store/useCompare'

const LINKS = [
  { href: '/', label: 'Descubrir', Icon: HomeIcon },
  { href: '/explorar', label: 'Explorar', Icon: SearchIcon },
  { href: '/comparar', label: 'Comparar', Icon: CompareIcon },
  { href: '/favoritos', label: 'Favoritos', Icon: HeartIcon },
]

export function BottomNav() {
  const pathname = usePathname()
  const { count: favCount, hydrated: favHydrated } = useFavorites()
  const { count: compareCount, hydrated: compareHydrated } = useCompare()

  if (pathname?.startsWith('/paseos')) return null

  return (
    <nav className="bottomnav">
      <div className="row">
        {LINKS.map(({ href, label, Icon }) => {
          const active = pathname === href
          const badgeCount = href === '/comparar' ? compareCount : href === '/favoritos' ? favCount : 0
          const showBadge = (href === '/comparar' ? compareHydrated : href === '/favoritos' ? favHydrated : false) && badgeCount > 0
          return (
            <Link key={href} href={href} className={active ? 'active' : ''} style={{ position: 'relative' }}>
              <Icon />
              {label}
              {showBadge && <span className="bn-badge">{badgeCount}</span>}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
