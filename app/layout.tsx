import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
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
          <div>Datos reales, Chile · Beta</div>
        </footer>
        <BottomNav />
      </body>
    </html>
  )
}
