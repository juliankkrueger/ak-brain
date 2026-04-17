import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary: 'bg-brand-cream text-brand-dark hover:bg-[#d4c89a] border border-brand-cream',
  secondary: 'bg-brand-blue text-white hover:bg-[#0e2f5a] border border-brand-blue',
  ghost: 'bg-transparent text-brand-blue hover:bg-brand-blue/10 border border-brand-blue/30',
  danger: 'bg-red-600 text-white hover:bg-red-700 border border-red-600',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`font-sans font-medium rounded-lg transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-brand-blue/40
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Lädt...
        </span>
      ) : children}
    </button>
  )
}
