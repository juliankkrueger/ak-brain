interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: number
}

import React from 'react'

export function KPICard({ title, value, subtitle, icon, trend }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-serif text-brand-blue">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="w-11 h-11 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue">
            {icon}
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-gray-400">vs. letzter Monat</span>
        </div>
      )}
    </div>
  )
}
