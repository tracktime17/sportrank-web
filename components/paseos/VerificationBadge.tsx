import type { VerificationStatus } from '@/lib/paseos/types'

const COPY: Record<VerificationStatus, { label: string; className: string }> = {
  verificado: { label: '✓ Paseo verificado', className: 'paseo-badge paseo-badge-ok' },
  revisar: { label: '⚠ Revisar paseo', className: 'paseo-badge paseo-badge-warn' },
  no_verificado: { label: '✕ No verificado', className: 'paseo-badge paseo-badge-bad' },
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const copy = COPY[status]
  return <span className={copy.className}>{copy.label}</span>
}
