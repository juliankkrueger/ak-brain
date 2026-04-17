import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-brand-dark/70">{label}</label>
      )}
      <input
        className={`w-full px-4 py-2.5 rounded-lg border text-brand-dark bg-white
          border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue
          placeholder:text-gray-400 transition-all duration-150
          disabled:bg-gray-50 disabled:text-gray-400
          ${error ? 'border-red-400 focus:ring-red-200' : ''}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
