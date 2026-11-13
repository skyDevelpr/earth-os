'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useProviderHealth } from '@/hooks/earth-os/useEarthData'

const PROVIDER_LABELS: Record<string, string> = {
  usgs: 'USGS',
  eonet: 'EONET',
  firms: 'FIRMS',
  openaq: 'OpenAQ',
  openmeteo: 'Open-Meteo',
  gibs: 'GIBS',
  donki: 'DONKI',
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: '#10b981',
    degraded: '#f59e0b',
    unconfigured: '#6b7280',
    down: '#ef4444',
    unknown: '#6b7280',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: colors[status] ?? colors.unknown,
        boxShadow: status === 'healthy' ? `0 0 5px ${colors.healthy}` : undefined,
      }}
    />
  )
}

export function DataSourceStatus() {
  const { data, isLoading } = useProviderHealth()
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleManualSync = async () => {
    setIsRefreshing(true)
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: ['earthquakes'] }),
      queryClient.invalidateQueries({ queryKey: ['eonet'] }),
      queryClient.invalidateQueries({ queryKey: ['fires'] }),
      queryClient.invalidateQueries({ queryKey: ['planetary-news'] }),
      queryClient.invalidateQueries({ queryKey: ['provider-health'] }),
    ])
    setTimeout(() => setIsRefreshing(false), 600)
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-1.5 eos-utc-clock">
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#4a5568',
          }}
        />
        <span style={{ color: 'var(--eos-text-muted)', fontSize: 11 }}>Connecting…</span>
      </div>
    )
  }

  const providers: Array<{ provider: string; status: string }> = data.providers ?? []
  const healthyCount = providers.filter(p => p.status === 'healthy').length
  const totalCount = providers.length

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        title={providers.map(p => `${PROVIDER_LABELS[p.provider] ?? p.provider}: ${p.status}`).join('\n')}
      >
        {providers.slice(0, 4).map(p => (
          <div key={p.provider} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <StatusDot status={p.status} />
            <span style={{ fontSize: 10, color: 'var(--eos-text-muted)', fontWeight: 500 }}>
              {PROVIDER_LABELS[p.provider] ?? p.provider}
            </span>
          </div>
        ))}
      </div>

      {/* Manual Live Data Refresher Pill */}
      <button
        onClick={handleManualSync}
        disabled={isRefreshing}
        title="Sync live observational feeds from USGS, NASA and GDELT"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 7px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--eos-border-subtle)',
          borderRadius: 9999,
          color: 'var(--eos-text-secondary)',
          fontSize: 9.5,
          fontWeight: 600,
          cursor: isRefreshing ? 'wait' : 'pointer',
          transition: 'all 180ms ease',
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            animation: isRefreshing ? 'spin 700ms linear infinite' : 'none',
          }}
        >
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19" />
        </svg>
        <span>{isRefreshing ? 'Syncing…' : 'Sync'}</span>
      </button>
    </div>
  )
}
