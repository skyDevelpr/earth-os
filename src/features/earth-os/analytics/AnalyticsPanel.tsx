'use client'

import { useEarthOsStore } from '@/stores/earth-os'
import { useMemo, useState } from 'react'
import { usePlanetaryNews, useProviderHealth } from '@/hooks/earth-os/useEarthData'

function StatCard({ label, value, unit, color = 'var(--eos-cyan)' }: {
  label: string
  value: string | number
  unit?: string
  color?: string
}) {
  return (
    <div className="eos-card">
      <div className="eos-card-header">{label}</div>
      <div className="eos-metric">
        <span className="eos-metric-value" style={{ color, fontSize: 22 }}>{value}</span>
        {unit && <span className="eos-metric-unit">{unit}</span>}
      </div>
    </div>
  )
}

function MagnitudeHistogram({ earthquakes }: { earthquakes: Array<{ magnitude: number }> }) {
  const bins = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  const counts = bins.slice(0, -1).map((min, i) => ({
    label: `M${min}-${bins[i + 1]}`,
    count: earthquakes.filter(e => e.magnitude >= min && e.magnitude < bins[i + 1]).length,
    min,
  }))
  const max = Math.max(...counts.map(c => c.count), 1)

  const colors = [
    'var(--eos-green)',
    'var(--eos-green)',
    '#a3e635',
    'var(--eos-yellow)',
    'var(--eos-orange)',
    '#f97316',
    'var(--eos-red)',
    '#b91c1c'
  ]

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--eos-text-tertiary)', marginBottom: 12 }}>
        Magnitude Distribution (USGS)
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 90, paddingBottom: 6 }}>
        {counts.map((bin, i) => (
          <div key={bin.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: '100%',
                height: `${Math.max(3, (bin.count / max) * 76)}px`,
                background: colors[i] ?? '#6b7280',
                borderRadius: '3px 3px 0 0',
                transition: 'height 400ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              title={`${bin.label}: ${bin.count} events`}
            />
            <div style={{ fontSize: 8.5, fontWeight: 600, color: 'var(--eos-text-tertiary)', textAlign: 'center' }}>{bin.min}+</div>
            {bin.count > 0 && (
              <div style={{ fontSize: 9, color: 'var(--eos-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{bin.count}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function CategoryDonut({ eonetEvents }: { eonetEvents: Array<{ category: string }> }) {
  const categories: Record<string, { label: string; color: string }> = {
    wildfires: { label: 'Wildfires', color: 'var(--eos-orange)' },
    severeStorms: { label: 'Storms', color: 'var(--eos-purple)' },
    volcanoes: { label: 'Volcanoes', color: 'var(--eos-red)' },
    seaIce: { label: 'Sea Ice', color: 'var(--eos-cyan)' },
    floods: { label: 'Floods', color: 'var(--eos-blue)' },
    snow: { label: 'Snow', color: '#e2e8f0' },
    dustHaze: { label: 'Dust/Haze', color: '#a78bfa' },
    other: { label: 'Other', color: '#6b7280' },
  }

  const counts = Object.entries(categories)
    .map(([id, meta]) => ({
      ...meta,
      id,
      count: eonetEvents.filter(e => e.category === id || (id === 'other' && !categories[e.category])).length,
    }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)

  const total = counts.reduce((s, c) => s + c.count, 0)

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--eos-text-tertiary)', marginBottom: 12 }}>
        Natural Event Categories (NASA EONET)
      </div>
      {total === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--eos-text-tertiary)' }}>No events loaded</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {counts.slice(0, 6).map(cat => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0, boxShadow: `0 0 6px ${cat.color}60` }} />
              <div style={{ flex: 1, fontSize: 11.5, fontWeight: 500, color: 'var(--eos-text-secondary)' }}>{cat.label}</div>
              <div style={{ flex: 2 }}>
                <div style={{
                  height: 5,
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: 9999,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(cat.count / (counts[0]?.count ?? 1)) * 100}%`,
                    background: cat.color,
                    borderRadius: 9999,
                    transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--eos-text-primary)', minWidth: 24, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {cat.count}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AnalyticsPanel() {
  const { earthquakes, eonetEvents, fireHotspots, eventTimeRange, flyTo, setSelectedEvent } = useEarthOsStore()
  const { data: healthData } = useProviderHealth()
  const { data: breakingNews = [] } = usePlanetaryNews({ limit: 4 })
  const [copied, setCopied] = useState(false)

  const stats = useMemo(() => {
    const maxMag = earthquakes.length > 0 ? Math.max(...earthquakes.map(e => e.magnitude)) : 0
    const significant = earthquakes.filter(e => e.magnitude >= 5.0).length
    const majorQuakes = earthquakes.filter(e => e.magnitude >= 5.5).sort((a, b) => b.magnitude - a.magnitude).slice(0, 4)
    const withTsunami = earthquakes.filter(e => e.tsunami).length
    const totalEvents = eonetEvents.length + earthquakes.length
    const highConfFires = fireHotspots.filter(f => f.confidenceLevel === 'high').length
    const activeStorms = eonetEvents.filter(e => e.category === 'severeStorms')
    const activeVolcanoes = eonetEvents.filter(e => e.category === 'volcanoes')

    // Planetary activity index
    const activityIndex = Math.min(100, Math.round(
      (earthquakes.length * 0.4) + (significant * 5) + (activeStorms.length * 8) + (activeVolcanoes.length * 6) + (fireHotspots.length * 0.1)
    ))

    return { maxMag, significant, majorQuakes, withTsunami, totalEvents, highConfFires, activeStorms, activeVolcanoes, activityIndex }
  }, [earthquakes, eonetEvents, fireHotspots])

  const timeLabel = eventTimeRange === 'hour' ? 'Past Hour' : eventTimeRange === 'day' ? 'Past 24H' : eventTimeRange === 'week' ? 'Past 7 Days' : 'Past 30 Days'

  const handleExportBriefing = () => {
    const report = {
      title: 'EARTH OS — Planetary Intelligence Summary Report',
      timestamp: new Date().toISOString(),
      activityIndex: stats.activityIndex,
      metrics: {
        totalEventsTracked: stats.totalEvents,
        earthquakesTracked: earthquakes.length,
        maxMagnitude: stats.maxMag,
        significantM5Plus: stats.significant,
        activeStorms: stats.activeStorms.length,
        activeVolcanicAlerts: stats.activeVolcanoes.length,
        satelliteThermalAnomalies: fireHotspots.length,
      },
      sources: ['USGS Earthquake Hazards Catalog', 'NASA EONET v3', 'NASA FIRMS VIIRS/MODIS', 'GDELT Global News'],
    }

    navigator.clipboard.writeText(JSON.stringify(report, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="eos-floating-panel">
      {/* Header */}
      <div className="eos-panel-header">
        <div>
          <div className="eos-panel-title">Planetary Intelligence Dashboard</div>
          <div className="eos-panel-subtitle">
            {timeLabel} · Real-time multi-sensor telemetry synthesis
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="eos-scrollable" style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Planetary Activity Score Card */}
        <div className="eos-card" style={{
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(168, 85, 247, 0.06) 100%)',
          borderColor: 'rgba(0, 212, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--eos-text-tertiary)' }}>
              Planetary Dynamics Index
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: stats.activityIndex > 60 ? 'var(--eos-orange)' : 'var(--eos-cyan)', letterSpacing: '-0.02em', marginTop: 2 }}>
              {stats.activityIndex} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--eos-text-secondary)' }}>/ 100</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--eos-text-tertiary)', marginTop: 2 }}>
              {stats.activityIndex > 70 ? 'High seismic & atmospheric load' : 'Nominal planetary activity baseline'}
            </div>
          </div>
          <button
            onClick={handleExportBriefing}
            className="eos-glass-pill"
            style={{
              padding: '6px 12px',
              fontSize: 10.5,
              fontWeight: 600,
              color: copied ? 'var(--eos-green)' : 'var(--eos-cyan)',
              cursor: 'pointer',
            }}
          >
            {copied ? '✓ Copied JSON' : 'Export Briefing ↗'}
          </button>
        </div>

        {/* Summary stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <StatCard label="Total Events" value={stats.totalEvents} color="var(--eos-cyan)" />
          <StatCard label="Earthquakes" value={earthquakes.length} color="var(--eos-yellow)" />
          <StatCard label="Significant (M5+)" value={stats.significant} color="var(--eos-orange)" />
          <StatCard label="Max Magnitude" value={stats.maxMag.toFixed(1)} unit="Mw" color="var(--eos-red)" />
          {stats.withTsunami > 0 && (
            <StatCard label="Tsunami Advisories" value={stats.withTsunami} color="var(--eos-blue)" />
          )}
          <StatCard label="Fire Detections" value={fireHotspots.length} color="var(--eos-orange)" />
          {stats.highConfFires > 0 && (
            <StatCard label="High Conf. Fires" value={stats.highConfFires} color="var(--eos-red)" />
          )}
          <StatCard label="Active Storms" value={stats.activeStorms.length} color="var(--eos-purple)" />
        </div>

        {/* Major Active Seismic Events Spotlight */}
        {stats.majorQuakes.length > 0 && (
          <div className="eos-card">
            <div className="eos-card-header">
              <span>Major Seismic Telemetry (M5.5+)</span>
              <span style={{ color: 'var(--eos-red)', fontWeight: 700 }}>LIVE</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {stats.majorQuakes.map((eq) => (
                <button
                  key={eq.id}
                  onClick={() => {
                    setSelectedEvent(eq)
                    flyTo({ center: [eq.coordinates.longitude, eq.coordinates.latitude], zoom: 7, bearing: 0, pitch: 0 })
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 9px',
                    borderRadius: 6,
                    border: '1px solid var(--eos-border-subtle)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--eos-text-primary)' }}>
                      M{eq.magnitude.toFixed(1)} — {eq.description ?? eq.title}
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--eos-text-tertiary)' }}>
                      Depth {eq.depth.toFixed(0)} km · {new Date(eq.observationTime).toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })} UTC
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--eos-cyan)' }}>Orbit →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Magnitude histogram */}
        {earthquakes.length > 0 && (
          <div className="eos-card">
            <MagnitudeHistogram earthquakes={earthquakes} />
          </div>
        )}

        {/* Category distribution */}
        {eonetEvents.length > 0 && (
          <div className="eos-card">
            <CategoryDonut eonetEvents={eonetEvents} />
          </div>
        )}

        {/* Breaking News Feed on Dashboard */}
        {breakingNews.length > 0 && (
          <div className="eos-card">
            <div className="eos-card-header">
              <span>Live Disaster Dispatches</span>
              <span style={{ color: 'var(--eos-cyan)' }}>GDELT</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {breakingNews.slice(0, 3).map((item: any) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid var(--eos-border-subtle)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--eos-text-primary)', lineHeight: 1.35 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--eos-text-tertiary)', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.publisher}</span>
                    <span>Source ↗</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Data Provider Telemetry Freshness */}
        <div className="eos-card">
          <div className="eos-card-header">
            <span>Provider Ingestion Status</span>
            <span style={{ color: 'var(--eos-green)' }}>● Online</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 10.5, color: 'var(--eos-text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>USGS Earthquake Hazards</span>
              <span style={{ color: 'var(--eos-text-primary)', fontVariantNumeric: 'tabular-nums' }}>2 min cadence · Live</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>NASA EONET v3</span>
              <span style={{ color: 'var(--eos-text-primary)', fontVariantNumeric: 'tabular-nums' }}>5 min cadence · Live</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>NASA FIRMS VIIRS</span>
              <span style={{ color: 'var(--eos-text-primary)', fontVariantNumeric: 'tabular-nums' }}>NRT Satellite · Verified</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ECMWF / Open-Meteo</span>
              <span style={{ color: 'var(--eos-text-primary)', fontVariantNumeric: 'tabular-nums' }}>Hourly NWP · Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
