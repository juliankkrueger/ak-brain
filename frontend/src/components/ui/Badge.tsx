interface BadgeProps {
  label: string
  variant?: 'status' | 'package' | 'role'
  value: string
}

const statusColors: Record<string, string> = {
  onboarding: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-gray-100 text-gray-600',
  completed: 'bg-blue-100 text-blue-800',
}

const statusLabels: Record<string, string> = {
  onboarding: 'Onboarding',
  active: 'Aktiv',
  paused: 'Pausiert',
  completed: 'Abgeschlossen',
}

const packageColors: Record<string, string> = {
  schnellstart: 'bg-brand-cream/60 text-brand-dark',
  jahrespaket: 'bg-brand-blue/10 text-brand-blue',
  foerdermodell: 'bg-purple-100 text-purple-800',
  individual: 'bg-brand-beige/20 text-brand-beige',
}

const packageLabels: Record<string, string> = {
  schnellstart: 'Schnellstart',
  jahrespaket: 'Jahrespaket',
  foerdermodell: 'Fördermodell',
  individual: 'Individual',
}

const roleColors: Record<string, string> = {
  admin: 'bg-brand-blue text-white',
  sales: 'bg-green-100 text-green-800',
  consultant: 'bg-purple-100 text-purple-800',
  manager: 'bg-amber-100 text-amber-800',
  creative: 'bg-pink-100 text-pink-800',
}

export function Badge({ variant = 'status', value }: BadgeProps) {
  let colorClass = ''
  let displayLabel = value

  if (variant === 'status') {
    colorClass = statusColors[value] || 'bg-gray-100 text-gray-600'
    displayLabel = statusLabels[value] || value
  } else if (variant === 'package') {
    colorClass = packageColors[value] || 'bg-gray-100 text-gray-600'
    displayLabel = packageLabels[value] || value
  } else if (variant === 'role') {
    colorClass = roleColors[value] || 'bg-gray-100 text-gray-600'
    displayLabel = value.charAt(0).toUpperCase() + value.slice(1)
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {displayLabel}
    </span>
  )
}
