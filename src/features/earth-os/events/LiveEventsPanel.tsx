'use client'

import { useState, useMemo } from 'react'
import { useEarthOsStore } from '@/stores/earth-os'
import { useEarthquakes, useEonetEvents } from '@/hooks/earth-os/useEarthData'
import { GLOBAL_POIS } from '@/services/earth-os/poi-data'
import { getPoiBadge } from '@/services/earth-os/poi.service'
import type { GeographicPoi } from '@/types/earth-os'

type ViewMode = 'hazards' | 'pois'

export default function LiveEventsPage() {
  const {
    earthquakes,
    eonetEvents,
    setSelectedEvent,
    setSelectedPoi,
    flyTo,
    eventTimeRange,
    setEventTimeRange,
    minMagnitude,
    setMinMagnitude,
    activeCategories,
    toggleCategory,
  } = useEarthOsStore()

  const [viewMode, setViewMode] = useState<ViewMode>('hazards')
  const [poiFilter, setPoiFilter] = useState<string>('all')
  const [poiSearch, setPoiSearch] = useState<string>('')

  const { isLoading: eqLoading, isError: eqError } = useEarthquakes(eventTimeRange, minMagnitude)
  const { isLoading: eoLoading, isError: eoError } = useEonetEvents(
    eventTimeRange === 'hour' ? 1 : eventTimeRange === 'day' ? 1 : eventTimeRange === 'week' ? 7 : 30
  )

  const categoryStats = [
    { id: 'earthquakes', label: 'Earthquakes', icon: '🔴', count: earthquakes.length },
    { id: 'wildfires', label: 'Wildfires', icon: '🔥', count: eonetEvents.filter(e => e.category === 'wildfires').length },
    { id: 'volcanoes', label: 'Volcanoes', icon: '🌋', count: eonetEvents.filter(e => e.category === 'volcanoes').length },
    { id: 'severeStorms', label: 'Severe Storms', icon: '🌪', count: eonetEvents.filter(e => e.category === 'severeStorms').length },
    { id: 'floods', label: 'Floods', icon: '🌊', count: eonetEvents.filter(e => e.category === 'floods').length },
    { id: 'seaIce', label: 'Sea/Lake Ice', icon: '🧊', count: eonetEvents.filter(e => e.category === 'seaIce').length },
  ]

  // Filtered POIs
  const filteredPois = useMemo(() => {
    let list = GLOBAL_POIS
    if (poiFilter === 'geography') {
      list = list.filter(p => p.group === 'geography')
    } else if (poiFilter === 'infrastructure') {
      list = list.filter(p => p.group === 'infrastructure')
    } else if (poiFilter === 'places') {
      list = list.filter(p => p.group === 'places')
    }

    if (poiSearch.trim()) {
      const q = poiSearch.toLowerCase().trim()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      )
    }

    return list
  }, [poiFilter, poiSearch])

  return (
    <div className="eos-floating-panel">
      {/* Header */}
      <div className="eos-panel-header">
        <div>
          <div className="eos-panel-title">
            {viewMode === 'hazards' ? 'Live Planetary Events' : 'Points of Interest Engine'}
          </div>
          <div className="eos-panel-subtitle">
            {viewMode === 'hazards'
              ? 'Real-time natural monitoring via USGS & NASA EONET'
              : 'Permanent landmarks, infrastructure & natural geography'}
          </div>
        </div>
      </div>

      {/* Primary Switcher: Live Hazards | Points of Interest */}
      <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid var(--eos-border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
        <div className="eos-segmented-control">
          <button
            className={`eos-segmented-btn ${viewMode === 'hazards' ? 'active' : ''}`}
            onClick={() => setViewMode('hazards')}
          >
            ⚡ Live Hazards
          </button>
          <button
            className={`eos-segmented-btn ${viewMode === 'pois' ? 'active' : ''}`}
            onClick={() => setViewMode('pois')}
          >
            🌐 Points of Interest ({GLOBAL_POIS.length})
          </button>
        </div>
      </div>

      {/* ─── MODE A: LIVE HAZARDS ────────────────────────────────────────── */}
      {viewMode === 'hazards' && (
        <>
          {/* Category stats grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            padding: '12px 14px 10px',
            borderBottom: '1px solid var(--eos-border-subtle)',
            background: 'rgba(255, 255, 255, 0.01)',
            flexShrink: 0,
          }}>
            {categoryStats.map(cat => {
              const isActive = activeCategories.has(cat.id)
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--eos-radius-sm)',
                    border: '1px solid',
                    cursor: 'pointer',
                    borderColor: isActive ? 'rgba(0, 212, 255, 0.45)' : 'var(--eos-border-subtle)',
                    background: isActive ? 'rgba(0, 212, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    boxShadow: isActive ? '0 0 12px rgba(0, 212, 255, 0.15)' : 'none',
                    textAlign: 'left',
                    transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div style={{ fontSize: 16, marginBottom: 4, lineHeight: 1 }}>{cat.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--eos-text-primary)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                    {cat.count}
                  </div>
                  <div style={{ fontSize: 9.5, fontWeight: 500, color: 'var(--eos-text-tertiary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cat.label}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Filters & Segmented Time Control */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--eos-border-subtle)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="eos-segmented-control">
              {(['hour', 'day', 'week', 'month'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setEventTimeRange(r)}
                  className={`eos-segmented-btn ${eventTimeRange === r ? 'active' : ''}`}
                >
                  {r === 'hour' ? '1 Hour' : r === 'day' ? '24 Hours' : r === 'week' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--eos-text-secondary)', whiteSpace: 'nowrap' }}>
                Min Magnitude:
              </span>
              <input
                type="range"
                min={0} max={8} step={0.5}
                value={minMagnitude}
                onChange={e => setMinMagnitude(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--eos-cyan)' }}
              />
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--eos-cyan)',
                minWidth: 32,
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
                background: 'rgba(0, 212, 255, 0.1)',
                padding: '2px 6px',
                borderRadius: 6,
              }}>
                M{minMagnitude.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Loading / Error States */}
          {(eqLoading || eoLoading) && (
            <div style={{ padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid var(--eos-border-subtle)', fontSize: 11.5, color: 'var(--eos-text-secondary)' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--eos-cyan)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              Retrieving telemetry feeds…
            </div>
          )}

          {(eqError || eoError) && (
            <div style={{ padding: '8px 14px', fontSize: 11, color: 'var(--eos-orange)', background: 'rgba(255, 159, 10, 0.08)', borderBottom: '1px solid var(--eos-border-subtle)' }}>
              ⚠ Network latency detected. Displaying verified local cache.
            </div>
          )}

          {/* Events list */}
          <div className="eos-scrollable" style={{ flex: 1, overflowY: 'auto' }}>
            {/* Significant earthquakes */}
            {activeCategories.has('earthquakes') && earthquakes.filter(e => e.magnitude >= minMagnitude).length > 0 && (
              <div>
                <div style={{
                  padding: '8px 14px 6px',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--eos-text-tertiary)',
                  borderBottom: '1px solid var(--eos-border-subtle)',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--md-sys-color-surface-container-high)',
                  zIndex: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span>Earthquakes (USGS)</span>
                  <span>{earthquakes.filter(e => e.magnitude >= minMagnitude).length}</span>
                </div>

                {earthquakes
                  .filter(e => e.magnitude >= minMagnitude)
                  .sort((a, b) => b.magnitude - a.magnitude)
                  .slice(0, 40)
                  .map(eq => {
                    const color = eq.magnitude >= 7 ? 'var(--eos-red)' : eq.magnitude >= 5 ? 'var(--eos-orange)' : 'var(--eos-yellow)'
                    return (
                      <button
                        key={eq.id}
                        onClick={() => {
                          setSelectedEvent(eq)
                          flyTo({ center: [eq.coordinates.longitude, eq.coordinates.latitude], zoom: 6, bearing: 0, pitch: 0 })
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          padding: '9px 14px',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 150ms ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `${color}18`,
                          border: `1px solid ${color}40`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
                            {eq.magnitude.toFixed(1)}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: 'var(--eos-text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {eq.description ?? eq.title}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--eos-text-tertiary)', marginTop: 2 }}>
                            Depth {eq.depth.toFixed(0)} km · {new Date(eq.observationTime).toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })} UTC
                          </div>
                        </div>
                      </button>
                    )
                  })}
              </div>
            )}

            {/* EONET Events */}
            {['wildfires', 'severeStorms', 'volcanoes', 'floods', 'seaIce'].map(catId => {
              if (!activeCategories.has(catId)) return null
              const events = eonetEvents.filter(e => e.category === catId)
              if (events.length === 0) return null

              return (
                <div key={catId}>
                  <div style={{
                    padding: '8px 14px 6px',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--eos-text-tertiary)',
                    borderBottom: '1px solid var(--eos-border-subtle)',
                    position: 'sticky',
                    top: 0,
                    background: 'var(--md-sys-color-surface-container-high)',
                    zIndex: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                    <span>{catId}</span>
                    <span>{events.length}</span>
                  </div>

                  {events.map(evt => (
                    <button
                      key={evt.id}
                      onClick={() => {
                        setSelectedEvent(evt)
                        flyTo({ center: [evt.coordinates.longitude, evt.coordinates.latitude], zoom: 6, bearing: 0, pitch: 0 })
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '9px 14px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 150ms ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: 'var(--eos-text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {evt.title}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--eos-text-tertiary)', marginTop: 2 }}>
                          {new Date(evt.observationTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 9.5,
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: 9999,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--eos-border-subtle)',
                        color: 'var(--eos-text-secondary)',
                        flexShrink: 0,
                      }}>
                        {evt.status}
                      </span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ─── MODE B: POINTS OF INTEREST ENGINE ─────────────────────────── */}
      {viewMode === 'pois' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* Group pills */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--eos-border-subtle)', display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[
              { id: 'all', label: 'All POIs' },
              { id: 'geography', label: 'Geography' },
              { id: 'infrastructure', label: 'Infrastructure' },
              { id: 'places', label: 'Places & Cities' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPoiFilter(tab.id)}
                className="eos-glass-pill"
                style={{
                  padding: '4px 9px',
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: poiFilter === tab.id ? 'var(--eos-cyan)' : 'var(--eos-text-secondary)',
                  borderColor: poiFilter === tab.id ? 'rgba(0,212,255,0.4)' : 'transparent',
                  background: poiFilter === tab.id ? 'rgba(0,212,255,0.1)' : undefined,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Filter Search */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--eos-border-subtle)' }}>
            <input
              type="text"
              placeholder="Filter landmarks, spaceports, peaks…"
              value={poiSearch}
              onChange={e => setPoiSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 'var(--eos-radius-sm)',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--eos-border-subtle)',
                color: 'var(--eos-text-primary)',
                fontSize: 11,
              }}
            />
          </div>

          {/* POI List */}
          <div className="eos-scrollable" style={{ flex: 1, overflowY: 'auto' }}>
            {filteredPois.map((poi: GeographicPoi) => {
              const badge = getPoiBadge(poi.category)
              return (
                <button
                  key={poi.id}
                  onClick={() => {
                    setSelectedPoi(poi)
                    flyTo({
                      center: [poi.coordinates.longitude, poi.coordinates.latitude],
                      zoom: 7,
                      bearing: 0,
                      pitch: 35,
                    })
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '9px 14px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${badge.color}18`,
                    border: `1px solid ${badge.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                  }}>
                    {badge.emoji}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--eos-text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {poi.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--eos-text-tertiary)', marginTop: 2 }}>
                      {poi.country} • {badge.label}
                    </div>
                  </div>

                  <span style={{
                    fontSize: 10,
                    color: 'var(--eos-cyan)',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    Explore →
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
