'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Status = 'idle' | 'loading' | 'success' | 'duplicate' | 'error'

export function AIWaitlistCTA() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'loading' || status === 'success' || status === 'duplicate') return
    setStatus('loading')
    try {
      const supabase = createClient()
      const { error } = await supabase.from('ai_waitlist').insert({ email, source: 'match_console' })
      if (!error) {
        setStatus('success')
        return
      }
      setStatus(error.code === '23505' ? 'duplicate' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="ai-waitlist">
      <div className="ai-waitlist-badge">✨ Próximamente</div>
      <h3>Match con IA</h3>
      <p>
        Estamos construyendo una versión que conversa de verdad contigo — entiende tu historial, tus dudas y tus objetivos en
        lenguaje natural para recomendarte tu carrera ideal. Todavía no existe: hoy el match que ves arriba usa nuestro
        algoritmo real, no un modelo de IA.
      </p>
      {status === 'success' || status === 'duplicate' ? (
        <div className="ai-waitlist-done">
          {status === 'success' ? '✓ Listo, te avisamos apenas esté disponible.' : '✓ Ya estabas en la lista — te avisaremos apenas esté disponible.'}
        </div>
      ) : (
        <form className="ai-waitlist-form" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading'}
          />
          <button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Anotando…' : 'Avísame'}
          </button>
        </form>
      )}
      {status === 'error' && <p className="ai-waitlist-error">Algo falló, inténtalo de nuevo en un momento.</p>}
    </div>
  )
}
