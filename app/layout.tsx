import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import Link from 'next/link'
import { TopNav } from '@/components/nav/TopNav'
import { BottomNav } from '@/components/nav/BottomNav'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
})

const TITLE = 'NextRace — Encuentra el evento perfecto para ti'
const DESCRIPTION =
  'Motor de compatibilidad deportiva para running, triatlón y ciclismo en Chile. Primero el deporte, luego distancia, terreno, clima y exigencia — nunca comparados entre sí.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: 'NextRace',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <TopNav />
        {children}
        <footer className="wrap">
          <div>NextRace — Running · Triatlón · Ciclismo</div>
          <div className="footer-right">
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/paseos">🐾 Huella (prototipo)</Link>
            <span>Datos reales, Chile · Beta</span>
          </div>
        </footer>
        <BottomNav />
        {process.env.NEXT_PUBLIC_CF_BEACON_TOKEN && (
          <Script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN })}
          />
        )}
      </body>
    </html>
  )
}
