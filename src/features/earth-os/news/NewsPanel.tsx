'use client'

import { useState } from 'react'
import { useEarthOsStore } from '@/stores/earth-os'
import { usePlanetaryNews } from '@/hooks/earth-os/useEarthData'
import type { PlanetaryNewsItem } from '@/services/earth-os/adapters/news.adapter'

export function NewsPanel() {
  const { flyTo } = useEarthOsStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: articles = [], isLoading, isError } = usePlanetaryNews({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    query: searchQuery.trim() || undefined,
    limit: 25,
  })

  const categories = [
    { id: 'all', label: 'All News', icon: '🌐' },
    { id: 'earthquakes', label: 'Earthquakes', icon: '🔴' },
    { id: 'wildfires', label: 'Wildfires', icon: '🔥' },
    { id: 'severeStorms', label: 'Storms', icon: '🌪' },
    { id: 'volcanoes', label: 'Volcanoes', icon: '🌋' },
    { id: 'floods', label: 'Floods', icon: '🌊' },
    { id: 'climate', label: 'Climate & Air', icon: '🌿' },
  ]

  const handleFlyTo = (coords: [number, number]) => {
    flyTo({
      center: coords,
      zoom: 6,
      bearing: 0,
      pitch: 0,
    })
  }

  return (
    <div className="eos-floating-panel">
      {/* Header */}
      <div className="eos-panel-header">
        <div>
          <div className="eos-panel-title">Live Planetary News</div>
          <div className="eos-panel-subtitle">
            Global real-time disaster reporting via GDELT & official bulletins
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid var(--eos-border-subtle)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Search input */}
        <input
          type="search"
          placeholder="Filter news by country, event or keyword…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="eos-search-input"
          style={{ padding: '6px 12px', fontSize: 11.5 }}
        />

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }} className="eos-scrollable">
          {categories.map((cat) => {
            const active = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 9999,
                  fontSize: 10.5,
                  fontWeight: 500,
                  border: '1px solid',
                  borderColor: active ? 'rgba(0, 212, 255, 0.45)' : 'var(--eos-border-subtle)',
                  background: active ? 'rgba(0, 212, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  color: active ? 'var(--eos-cyan)' : 'var(--eos-text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 150ms ease',
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Loading / Error States */}
      {isLoading && (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--eos-text-secondary)', fontSize: 11.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--eos-cyan)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          Aggregating global telemetry & news dispatches…
        </div>
      )}

      {isError && (
        <div style={{ padding: '10px 14px', fontSize: 11, color: 'var(--eos-orange)', background: 'rgba(255, 159, 10, 0.08)', borderBottom: '1px solid var(--eos-border-subtle)' }}>
          ⚠ Network latency. Showing verified scientific bulletins.
        </div>
      )}

      {/* Articles List */}
      <div className="eos-scrollable" style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {articles.length === 0 && !isLoading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--eos-text-tertiary)', fontSize: 11.5 }}>
            No recent reports matching query. Check back shortly.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {articles.map((item: PlanetaryNewsItem) => {
              const timeStr = new Date(item.publishedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
              })

              return (
                <div
                  key={item.id}
                  className="eos-card"
                  style={{
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {/* Card top */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: 'var(--eos-cyan)',
                          background: 'rgba(0, 212, 255, 0.1)',
                          padding: '1px 6px',
                          borderRadius: 4,
                        }}
                      >
                        {item.publisher}
                      </span>
                      {item.location && (
                        <span style={{ fontSize: 10, color: 'var(--eos-text-tertiary)' }}>
                          📍 {item.location}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 9.5, color: 'var(--eos-text-tertiary)' }}>
                      {timeStr} UTC
                    </span>
                  </div>

                  {/* Headline */}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--eos-text-primary)',
                      lineHeight: 1.35,
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--eos-cyan)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--eos-text-primary)')}
                  >
                    {item.title}
                  </a>

                  {item.snippet && (
                    <div style={{ fontSize: 10.5, color: 'var(--eos-text-secondary)', lineHeight: 1.4 }}>
                      {item.snippet}
                    </div>
                  )}

                  {/* Card bottom actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    {item.coordinates ? (
                      <button
                        onClick={() => handleFlyTo(item.coordinates!)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          background: 'none',
                          border: 'none',
                          color: 'var(--eos-cyan)',
                          fontSize: 10.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <span>🌍 Orbit Region</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: 9.5, color: 'var(--eos-text-tertiary)' }}>
                        Topical planetary reporting
                      </span>
                    )}

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 10.5,
                        color: 'var(--eos-text-secondary)',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      Article Link ↗
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Attribution & Integrity Guardrail */}
        <div style={{
          marginTop: 14,
          padding: '10px 12px',
          borderRadius: 'var(--eos-radius-sm)',
          border: '1px solid var(--eos-border-subtle)',
          background: 'rgba(255, 255, 255, 0.02)',
          fontSize: 10,
          color: 'var(--eos-text-tertiary)',
          lineHeight: 1.45,
        }}>
          <strong style={{ color: 'var(--eos-text-secondary)' }}>Verification Policy:</strong> News items are retrieved via the GDELT Global Knowledge Graph and official scientific agencies. Relationships are attributed by geographical and temporal matching; no causal correlations are fabricated.
        </div>
      </div>
    </div>
  )
}
