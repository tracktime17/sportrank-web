'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { usePaseoStore } from '@/lib/paseos/store'

const DURATIONS = [15, 30, 45, 60]

export default function NuevoPaseoPage() {
  const router = useRouter()
  const { createBooking } = usePaseoStore()

  const [dogName, setDogName] = useState('')
  const [dogBreed, setDogBreed] = useState('')
  const [walkerName, setWalkerName] = useState('')
  const [scheduledAt, setScheduledAt] = useState(() => new Date().toISOString().slice(0, 16))
  const [expectedMinutes, setExpectedMinutes] = useState(30)
  const [priceClp, setPriceClp] = useState('8000')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!dogName.trim() || !walkerName.trim()) return
    const id = createBooking({
      dogName: dogName.trim(),
      dogBreed: dogBreed.trim() || null,
      walkerName: walkerName.trim(),
      scheduledAt: new Date(scheduledAt).toISOString(),
      expectedMinutes,
      priceClp: priceClp ? Number(priceClp) : null,
    })
    router.push(`/paseos/${id}`)
  }

  return (
    <div className="wrap view-enter" style={{ paddingTop: 44, maxWidth: 560 }}>
      <div className="page-head">
        <div className="eyebrow">Nuevo paseo</div>
        <h1>Agenda un paseo</h1>
        <p>Estos datos definen lo acordado — el reporte de verificación los compara contra lo que ocurrió en la práctica.</p>
      </div>

      <form className="paseo-form" onSubmit={handleSubmit}>
        <label className="paseo-field">
          <span>Nombre del perro</span>
          <input value={dogName} onChange={(e) => setDogName(e.target.value)} placeholder="Toby" required />
        </label>

        <label className="paseo-field">
          <span>Raza (opcional)</span>
          <input value={dogBreed} onChange={(e) => setDogBreed(e.target.value)} placeholder="Golden Retriever" />
        </label>

        <label className="paseo-field">
          <span>Nombre del paseador</span>
          <input value={walkerName} onChange={(e) => setWalkerName(e.target.value)} placeholder="Camila R." required />
        </label>

        <label className="paseo-field">
          <span>Fecha y hora acordada</span>
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
        </label>

        <label className="paseo-field">
          <span>Duración acordada</span>
          <div className="paseo-duration-row">
            {DURATIONS.map((m) => (
              <button
                key={m}
                type="button"
                className={`paseo-duration-opt ${expectedMinutes === m ? 'active' : ''}`}
                onClick={() => setExpectedMinutes(m)}
              >
                {m} min
              </button>
            ))}
          </div>
        </label>

        <label className="paseo-field">
          <span>Precio acordado (CLP, opcional)</span>
          <input type="number" min={0} value={priceClp} onChange={(e) => setPriceClp(e.target.value)} placeholder="8000" />
        </label>

        <button type="submit" className="btn btn-primary" style={{ marginTop: 8, justifyContent: 'center' }}>
          Crear paseo
        </button>
      </form>
    </div>
  )
}
