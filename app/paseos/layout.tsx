import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Huella — Paseo Verificado',
  description: 'Prototipo: verifica que el paseo de tu perro realmente ocurrió, con ruta GPS, duración y fotos de inicio/término.',
}

export default function PaseosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="paseo-app">
      <nav className="paseo-topnav">
        <div className="wrap paseo-topnav-row">
          <Link href="/paseos" className="paseo-logo">
            <span className="paseo-logo-mark">🐾</span> Huella
          </Link>
          <div className="paseo-topnav-links">
            <Link href="/paseos/nuevo" className="btn btn-primary btn-sm">
              Crear paseo
            </Link>
          </div>
        </div>
      </nav>
      <main>{children}</main>
      <footer className="paseo-footer">
        <div className="wrap">Huella — prototipo de paseo verificado, construido dentro de sportrank-web.</div>
      </footer>
    </div>
  )
}
