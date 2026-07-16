import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { email, source } = await request.json()

  if (typeof email !== 'string' || !email.includes('@')) {
    return Response.json({ error: 'invalid_email' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from('ai_waitlist').insert({ email, source: typeof source === 'string' ? source : null })

  if (error && error.code !== '23505') {
    return Response.json({ error: 'insert_failed' }, { status: 500 })
  }

  const duplicate = error?.code === '23505'

  if (!duplicate && process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL ?? 'NextRace <onboarding@resend.dev>',
          to: email,
          subject: 'Aseguraste tu lugar en NextRace PRO',
          html: '<p>¡Gracias por sumarte! Aseguraste tu lugar como fundador de NextRace PRO — te avisamos apenas esté disponible.</p>',
        }),
      })
    } catch {
      // el correo es un extra: si falla, no bloqueamos el registro en la lista
    }
  }

  return Response.json({ duplicate })
}
