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
          <svg className="logo-mark" width="24" height="24" viewBox="0 0 28 28" aria-hidden="true">
            <defs>
              <linearGradient id="logo-mark-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#4db2ff" />
                <stop offset="1" stopColor="#1a6fd6" />
              </linearGradient>
            </defs>
            <rect width="28" height="28" rx="8" fill="url(#logo-mark-grad)" />
            <path d="M10 8l5 6-5 6" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M15.5 8l5 6-5 6"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          NextRace
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
