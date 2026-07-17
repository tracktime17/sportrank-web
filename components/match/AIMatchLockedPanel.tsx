'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Status = 'idle' | 'loading' | 'success' | 'duplicate' | 'error'

const PREVIEW_TURNS = [
  { from: 'bot' as const, text: '¿Qué tipo de carrera te haría decir "wow, esto es justo lo que quería"?' },
  { from: 'user' as const, text: 'Algo cerca del mar, que no sea multitudinario…' },
  { from: 'bot' as const, text: 'Encontré 3 que calzan con tu historial 🔥' },
]

const BENEFITS = [
  'Te entiende en tus palabras, no en tiles — aprende de cada respuesta, no de un cuestionario fijo.',
  'Compara contra tu propio historial: qué corriste, qué evitaste, qué realmente te gustó.',
  'Alerta el segundo que abren inscripciones de tu match — antes que se llenen los cupos.',
]

// Un conteo bajo (1, 2, 3 personas) se ve débil, no genera confianza — mejor
// dejar el mensaje aspiracional genérico hasta que el número real sea
// digno de mostrarse. Nunca se infla el número, solo se elige cuándo mostrarlo.
const MIN_COUNT_TO_SHOW = 10

export function AIMatchLockedPanel() {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadCount() {
      try {
        const { data } = await createClient().rpc('ai_waitlist_count')
        if (!cancelled && typeof data === 'number') setWaitlistCount(data)
      } catch {
        // el cliente de Supabase no está disponible (p.ej. env vars faltantes) — se queda con el copy genérico
      }
    }
    loadCount()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'loading') return
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'match_console_tab' }),
      })
      if (!res.ok) {
        setStatus('error')
        return
      }
      const { duplicate } = await res.json()
      setStatus(duplicate ? 'duplicate' : 'success')
      setWaitlistCount((n) => (n === null ? null : n + 1))
    } catch {
      setStatus('error')
    }
  }

  const done = status === 'success' || status === 'duplicate'

  return (
    <div className="ai-panel">
      <div className="ai-panel-preview" aria-hidden="true">
        {PREVIEW_TURNS.map((t, i) => (
          <div className={`ai-fake-bubble ${t.from}`} key={i}>
            {t.text}
          </div>
        ))}
      </div>

      <div className="ai-panel-lock">
        <div className="ai-panel-icon">🔒</div>
        <div className="ai-panel-eyebrow">Para quienes toman en serio su próxima carrera</div>
        <h4>NextRace PRO</h4>
        <p className="ai-panel-lead">El match básico te da un score. PRO te dice qué hacer con él.</p>

        <ul className="ai-panel-benefits">
          {BENEFITS.map((b) => (
            <li key={b}>
              <span className="ai-panel-check">✓</span> {b}
            </li>
          ))}
        </ul>

        {done ? (
          <div className="ai-panel-done">
            {status === 'success' ? '✓ Listo, aseguraste tu lugar — te avisamos apenas esté disponible.' : '✓ Ya estabas en la lista — te avisaremos apenas esté disponible.'}
          </div>
        ) : showForm ? (
          <form className="ai-panel-form" onSubmit={handleSubmit}>
            <input
              type="email"
              required
              autoFocus
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
            />
            <button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Confirmando…' : 'Confirmar mi lugar'}
            </button>
          </form>
        ) : (
          <button type="button" className="ai-panel-cta" onClick={() => setShowForm(true)}>
            Quiero acceso anticipado
          </button>
        )}

        {status === 'error' && <p className="ai-panel-error">Algo falló, inténtalo de nuevo en un momento.</p>}

        {!done && (
          <p className="ai-panel-founder">
            {waitlistCount !== null && waitlistCount >= MIN_COUNT_TO_SHOW
              ? `🔥 ${waitlistCount} triatletas ya se anotaron para tener acceso anticipado.`
              : 'Los primeros en sumarse acceden antes y a mejor precio cuando lancemos.'}
          </p>
        )}
      </div>
    </div>
  )
}
