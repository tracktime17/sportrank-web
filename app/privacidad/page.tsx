import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacidad — NextRace',
  description: 'Cómo NextRace usa tus datos.',
}

export default function PrivacyPage() {
  return (
    <div className="wrap section view-enter" style={{ paddingTop: 44, maxWidth: 720 }}>
      <div className="page-head" style={{ paddingBottom: 0 }}>
        <h1 style={{ fontSize: '1.9rem' }}>Privacidad</h1>
        <p>Última actualización: julio 2026</p>
      </div>

      <div className="legal-body">
        <h2>Qué datos usamos</h2>
        <p>
          <b>Tus respuestas del quiz de match</b> (deporte, distancia, clima ideal, etc.) se guardan solo en tu
          navegador (localStorage), nunca en un servidor. Si borras los datos de navegación de tu navegador, se
          pierden. Lo mismo con tus <b>favoritos</b> y tu <b>comparador</b> de carreras.
        </p>
        <p>
          Si te suscribes a la lista de espera de <b>NextRace PRO</b>, guardamos tu <b>correo electrónico</b> en
          nuestra base de datos para avisarte cuando esté disponible. Es el único dato personal que efectivamente
          almacenamos en un servidor.
        </p>

        <h2>Qué NO hacemos</h2>
        <p>
          No vendemos ni compartimos tu correo con terceros. Nadie fuera del equipo de NextRace puede leer la lista
          de espera — está protegida a nivel de base de datos para que solo se puedan agregar correos nuevos, no
          consultar los existentes.
        </p>

        <h2>Analítica</h2>
        <p>
          Usamos Vercel Analytics para entender cuánta gente visita el sitio. Es agregado y anónimo — no usa
          cookies ni identifica visitantes individuales.
        </p>

        <h2>Tus derechos</h2>
        <p>
          Puedes pedirnos que borremos tu correo de la lista de espera en cualquier momento, escribiendo a{' '}
          <a href="mailto:antonialorenza@gmail.com">antonialorenza@gmail.com</a>.
        </p>
      </div>
    </div>
  )
}
