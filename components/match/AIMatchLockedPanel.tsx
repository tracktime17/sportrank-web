'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Status = 'idle' | 'loading' | 'success' | 'duplicate' | 'error'

const PREVIEW_TURNS = [
  { from: 'bot' as const, text: '¿Qué tipo de carrera te haría decir "wow, esto es justo lo que quería"?' },
  { from: 'user' as const, text: 'Algo cerca del mar, que no sea multitudinario…' },
  { from: 'bot' as const, text: 'Encontré 3 que calzan con tu historial 🔥' },
]

export function AIMatchLockedPanel() {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'loading') return
    setStatus('loading')
    try {
      const supabase = createClient()
      const { error } = await supabase.from('ai_waitlist').insert({ email, source: 'match_console_tab' })
      if (!error) {
        setStatus('success')
        return
      }
      setStatus(error.code === '23505' ? 'duplicate' : 'error')
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
        <h4>Match con IA</h4>
        <p>Suscríbete para usar Encuentra tu match más personalizado — entiende tu historial y tus objetivos en tus propias palabras, no solo tiles.</p>

        {done ? (
          <div className="ai-panel-done">
            {status === 'success' ? '✓ Listo, te avisamos apenas esté disponible.' : '✓ Ya estabas suscrito — te avisaremos apenas esté disponible.'}
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
              {status === 'loading' ? 'Enviando…' : 'Confirmar'}
            </button>
          </form>
        ) : (
          <button type="button" className="ai-panel-cta" onClick={() => setShowForm(true)}>
            Suscribirse
          </button>
        )}

        {status === 'error' && <p className="ai-panel-error">Algo falló, inténtalo de nuevo en un momento.</p>}
      </div>
    </div>
  )
}
