'use client'

import { useState, useMemo, useEffect } from 'react'
import { useEarthOsStore } from '@/stores/earth-os'
import type { LiveFlight } from '@/types/earth-os'

const POPULAR_AIRLINES = [
  { code: 'all', label: 'All Airlines' },
  { code: 'UAL', label: 'United Airlines (UAL)' },
  { code: 'DAL', label: 'Delta Air Lines (DAL)' },
  { code: 'AAL', label: 'American Airlines (AAL)' },
  { code: 'SWA', label: 'Southwest Airlines (SWA)' },
  { code: 'DLH', label: 'Lufthansa (DLH)' },
  { code: 'BAW', label: 'British Airways (BAW)' },
  { code: 'AFR', label: 'Air France (AFR)' },
  { code: 'UAE', label: 'Emirates (UAE)' },
  { code: 'QTR', label: 'Qatar Airways (QTR)' },
  { code: 'AIC', label: 'Air India (AIC)' },
  { code: 'AXB', label: 'Air India Express (AXB)' },
  { code: 'RYR', label: 'Ryanair (RYR)' },
  { code: 'SIA', label: 'Singapore Airlines (SIA)' },
  { code: 'ANA', label: 'All Nippon Airways (ANA)' },
  { code: 'KLM', label: 'KLM Royal Dutch (KLM)' },
  { code: 'THY', label: 'Turkish Airlines (THY)' },
  { code: 'FDX', label: 'FedEx Express (FDX)' },
  { code: 'UPS', label: 'UPS Airlines (UPS)' },
]

const ALTITUDE_BANDS: Array<{ id: 'all' | 'high' | 'mid' | 'low' | 'ground'; label: string; desc: string }> = [
  { id: 'all', label: 'All Alt', desc: 'All altitudes' },
  { id: 'high', label: 'High (>30k ft)', desc: 'High Cruise' },
  { id: 'mid', label: 'Mid (10k–30k)', desc: 'Climb / Descent' },
  { id: 'low', label: 'Low (<10k ft)', desc: 'Approach / Dep' },
  { id: 'ground', label: 'Ground', desc: 'Taxi / Gate' },
]

const AIRCRAFT_TYPES: Array<{ id: 'all' | 'heavy' | 'medium' | 'turboprop' | 'general'; label: string }> = [
  { id: 'all', label: 'All Aircraft Types' },
  { id: 'heavy', label: 'Heavy / Wide-Body (A350/B777/B787)' },
  { id: 'medium', label: 'Medium / Narrow-Body (A320/B737)' },
  { id: 'turboprop', label: 'Turboprop / Regional Jet' },
  { id: 'general', label: 'General / Private Aviation' },
]

export function LiveFlightsPanel() {
  const {
    flights,
    flightsLoading,
    flightsError,
    flightsLastUpdated,
    flightTrackingActive,
    setFlightTrackingActive,
    flightMarkersVisible,
    setFlightMarkersVisible,
    flightShowTrails,
    setFlightShowTrails,
    flightAirlineFilter,
    setFlightAirlineFilter,
    flightAltitudeFilter,
    setFlightAltitudeFilter,
    flightAircraftTypeFilter,
    setFlightAircraftTypeFilter,
    flightSearchQuery,
    setFlightSearchQuery,
    flightProviderInfo,
    selectedFlight,
    setSelectedFlight,
    flyTo,
    setCockpitViewOpen,
  } = useEarthOsStore()

  const [showFr24Modal, setShowFr24Modal] = useState(false)
  const [filterMode, setFilterMode] = useState<'all' | 'airborne' | 'climb' | 'descend'>('all')
  const [currentFps, setCurrentFps] = useState<number>(60)

  // Measure actual GPU/RAF render rate
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).__EOS_FPS__) {
        setCurrentFps((window as any).__EOS_FPS__)
      }
    }, 500)
    return () => clearInterval(timer)
  }, [])

  // Filtered flights displayed in the side list
  const filteredFlights = useMemo(() => {
    let list = flights

    // Filter mode pills
    if (filterMode === 'airborne') {
      list = list.filter(f => !f.onGround)
    } else if (filterMode === 'climb') {
      list = list.filter(f => f.verticalRateFpm != null && f.verticalRateFpm > 100)
    } else if (filterMode === 'descend') {
      list = list.filter(f => f.verticalRateFpm != null && f.verticalRateFpm < -100)
    }

    // Airline filter
    if (flightAirlineFilter && flightAirlineFilter !== 'all') {
      const code = flightAirlineFilter.toLowerCase()
      list = list.filter(f =>
        (f.airlineCode && f.airlineCode.toLowerCase() === code) ||
        (f.airline && f.airline.toLowerCase().includes(code))
      )
    }

    // Altitude filter
    if (flightAltitudeFilter && flightAltitudeFilter !== 'all') {
      if (flightAltitudeFilter === 'high') {
        list = list.filter(f => (f.altitudeFeet ?? 0) >= 30000)
      } else if (flightAltitudeFilter === 'mid') {
        list = list.filter(f => (f.altitudeFeet ?? 0) >= 10000 && (f.altitudeFeet ?? 0) < 30000)
      } else if (flightAltitudeFilter === 'low') {
        list = list.filter(f => (f.altitudeFeet ?? 0) > 0 && (f.altitudeFeet ?? 0) < 10000)
      } else if (flightAltitudeFilter === 'ground') {
        list = list.filter(f => f.onGround || (f.altitudeFeet ?? 0) <= 0)
      }
    }

    // Aircraft Type filter
    if (flightAircraftTypeFilter && flightAircraftTypeFilter !== 'all') {
      if (flightAircraftTypeFilter === 'heavy') {
        list = list.filter(f => (f.aircraftType || '').toLowerCase().includes('wide-body') || (f.aircraftType || '').toLowerCase().includes('heavy'))
      } else if (flightAircraftTypeFilter === 'medium') {
        list = list.filter(f => (f.aircraftType || '').toLowerCase().includes('narrow-body') || (f.aircraftType || '').toLowerCase().includes('commercial'))
      } else if (flightAircraftTypeFilter === 'turboprop') {
        list = list.filter(f => (f.aircraftType || '').toLowerCase().includes('turboprop') || (f.aircraftType || '').toLowerCase().includes('regional'))
      } else if (flightAircraftTypeFilter === 'general') {
        list = list.filter(f => (f.aircraftType || '').toLowerCase().includes('general') || (f.aircraftType || '').toLowerCase().includes('private'))
      }
    }

    // Search query
    if (flightSearchQuery && flightSearchQuery.trim()) {
      const q = flightSearchQuery.toLowerCase().trim()
      list = list.filter(f =>
        (f.callsign || '').toLowerCase().includes(q) ||
        (f.flightNumber || '').toLowerCase().includes(q) ||
        (f.airline || '').toLowerCase().includes(q) ||
        (f.originCountry || '').toLowerCase().includes(q) ||
        (f.icao24 || '').toLowerCase().includes(q)
      )
    }

    return list
  }, [
    flights,
    filterMode,
    flightAirlineFilter,
    flightAltitudeFilter,
    flightAircraftTypeFilter,
    flightSearchQuery,
  ])

  const airborneCount = flights.filter(f => !f.onGround).length
  const climbingCount = flights.filter(f => f.verticalRateFpm != null && f.verticalRateFpm > 100).length
  const descendingCount = flights.filter(f => f.verticalRateFpm != null && f.verticalRateFpm < -100).length

  const handleSelectFlight = (flight: LiveFlight) => {
    setSelectedFlight(flight)
    flyTo({
      center: [flight.longitude, flight.latitude],
      zoom: 7.5,
      bearing: flight.heading || 0,
      pitch: 35,
    })
  }

  const formatLastUpdated = (ts: number | null) => {
    if (!ts) return 'Updating…'
    const diffSec = Math.max(0, Math.round((Date.now() - ts) / 1000))
    if (diffSec < 5) return 'Live now (0s)'
    if (diffSec < 60) return `${diffSec}s ago`
    return `${Math.floor(diffSec / 60)}m ago`
  }

  return (
    <div className="eos-floating-panel" style={{ width: 360, display: 'flex', flexDirection: 'column' }}>
      {/* ─── Panel Header ────────────────────────────────────────────── */}
      <div className="eos-panel-header" style={{ padding: '12px 14px 10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 16 }} aria-hidden="true">✈️</span>
            <div className="eos-panel-title" style={{ fontSize: 14 }}>Live Global Flights</div>
          </div>
          <div className="eos-panel-subtitle" style={{ fontSize: 10.5, marginTop: 2 }}>
            {flightProviderInfo?.provider || 'ADS-B Transponder Network'} · {formatLastUpdated(flightsLastUpdated)}
          </div>
        </div>

        {/* Live Status & 60 FPS Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {flightTrackingActive && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 4,
              padding: '2px 5px',
              fontSize: 9.5,
              fontWeight: 700,
              color: 'var(--eos-teal)',
            }} title="Hardware GPU requestAnimationFrame render rate">
              {currentFps} FPS
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: flightTrackingActive ? 'rgba(255, 204, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${flightTrackingActive ? 'rgba(255, 204, 0, 0.35)' : 'var(--eos-border-subtle)'}`,
            padding: '3px 8px',
            borderRadius: 9999,
            fontSize: 10,
            fontWeight: 700,
            color: flightTrackingActive ? '#ffcc00' : 'var(--eos-text-tertiary)',
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: flightTrackingActive ? '#ffcc00' : 'var(--eos-text-tertiary)',
              boxShadow: flightTrackingActive ? '0 0 8px #ffcc00' : 'none',
              animation: (flightTrackingActive && flightsLoading) ? 'pulse 1.2s infinite' : 'none',
            }} />
            <span>{filteredFlights.length.toLocaleString()} Active</span>
          </div>
        </div>
      </div>

      {/* ─── Primary Controls Bar (Tracking, Visibility, Trails) ────── */}
      <div style={{
        padding: '8px 14px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderBottom: '1px solid var(--eos-border-subtle)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 6,
      }}>
        {/* Toggle 1: Live Tracking ON/OFF */}
        <button
          onClick={() => setFlightTrackingActive(!flightTrackingActive)}
          className={`eos-segmented-btn ${flightTrackingActive ? 'active' : ''}`}
          style={{
            padding: '5px 4px',
            fontSize: 10.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            borderColor: flightTrackingActive ? '#ffcc00' : undefined,
            color: flightTrackingActive ? '#ffcc00' : 'var(--eos-text-secondary)',
          }}
          title={flightTrackingActive ? 'Click to pause polling & clear markers' : 'Click to resume live tracking'}
        >
          <span>{flightTrackingActive ? '●' : '○'}</span>
          <span>Tracking {flightTrackingActive ? 'ON' : 'OFF'}</span>
        </button>

        {/* Toggle 2: Aircraft Visibility */}
        <button
          onClick={() => setFlightMarkersVisible(!flightMarkersVisible)}
          className={`eos-segmented-btn ${flightMarkersVisible ? 'active' : ''}`}
          style={{
            padding: '5px 4px',
            fontSize: 10.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
          title="Toggle aircraft visibility on map"
        >
          <span>{flightMarkersVisible ? '👁' : '🕶'}</span>
          <span>{flightMarkersVisible ? 'Visible' : 'Hidden'}</span>
        </button>

        {/* Toggle 3: Flight Trails */}
        <button
          onClick={() => setFlightShowTrails(!flightShowTrails)}
          className={`eos-segmented-btn ${flightShowTrails ? 'active' : ''}`}
          style={{
            padding: '5px 4px',
            fontSize: 10.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
          title="Toggle trajectory breadcrumb trails"
        >
          <span>〰</span>
          <span>Trails {flightShowTrails ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* ─── Provider & FR24 Notice ─────────────────────────────────── */}
      <div style={{
        padding: '6px 14px',
        fontSize: 10,
        background: flightProviderInfo?.fr24Configured ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 204, 0, 0.08)',
        borderBottom: '1px solid var(--eos-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: flightProviderInfo?.fr24Configured ? 'var(--eos-teal)' : '#ffcc00',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>{flightProviderInfo?.fr24Configured ? '⚡' : '📡'}</span>
          <span style={{ fontWeight: 600 }}>
            {flightProviderInfo?.fr24Configured ? 'Official Flightradar24 API Active' : 'ADS-B Transponder Stream Active'}
          </span>
        </div>
        <button
          onClick={() => setShowFr24Modal(!showFr24Modal)}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: 9.5,
            padding: 0,
            fontWeight: 600,
          }}
        >
          {showFr24Modal ? 'Close' : 'FR24 Setup'}
        </button>
      </div>

      {/* ─── FR24 Setup Modal / Card ───────────────────────────────── */}
      {showFr24Modal && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(0, 0, 0, 0.45)',
          borderBottom: '1px solid var(--eos-border-subtle)',
          fontSize: 10.5,
          color: 'var(--eos-text-secondary)',
          lineHeight: 1.45,
        }}>
          <div style={{ fontWeight: 700, color: 'var(--eos-text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>✈ Flightradar24 Official API Integration</span>
          </div>
          <p style={{ margin: '0 0 6px' }}>
            EARTH OS has built-in native support for the official Flightradar24 Live Flight Positions API (<code style={{ color: '#ffcc00' }}>/api/live/flight-positions/light</code>).
          </p>
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '6px 8px',
            borderRadius: 'var(--eos-radius-sm)',
            border: '1px solid var(--eos-border-subtle)',
            fontFamily: 'monospace',
            fontSize: 10,
            color: '#ffcc00',
            marginBottom: 6,
          }}>
            # In your .env.local:<br />
            FR24_API_TOKEN=your_fr24_api_subscription_token
          </div>
          <p style={{ margin: 0, fontSize: 9.5, color: 'var(--eos-text-tertiary)' }}>
            When token is omitted, EARTH OS automatically falls back to the open ADS-B transponder network with full globe coverage.
          </p>
        </div>
      )}

      {/* ─── Search Input ───────────────────────────────────────────── */}
      <div style={{ padding: '8px 14px 4px' }}>
        <input
          type="text"
          placeholder="Search callsign, airline, aircraft…"
          value={flightSearchQuery}
          onChange={(e) => setFlightSearchQuery(e.target.value)}
          className="eos-search-input"
          style={{
            width: '100%',
            height: 34,
            padding: '6px 12px',
            fontSize: 12,
            borderRadius: 'var(--eos-radius-full)',
            background: 'var(--eos-surface-card)',
            border: '1px solid var(--eos-surface-card-border)',
            color: 'var(--eos-text-primary)',
          }}
        />
      </div>

      {/* ─── Airline Dropdown ──────────────────────────────────────── */}
      <div style={{ padding: '4px 14px' }}>
        <select
          value={flightAirlineFilter}
          onChange={(e) => setFlightAirlineFilter(e.target.value)}
          style={{
            width: '100%',
            height: 30,
            padding: '0 10px',
            fontSize: 11,
            borderRadius: 'var(--eos-radius-card)',
            background: 'var(--eos-surface-card)',
            border: '1px solid var(--eos-surface-card-border)',
            color: 'var(--eos-text-primary)',
            cursor: 'pointer',
          }}
        >
          {POPULAR_AIRLINES.map(a => (
            <option key={a.code} value={a.code} style={{ background: 'var(--eos-bg-canvas)', color: 'var(--eos-text-primary)' }}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      {/* ─── Altitude Bands Segmented Control ──────────────────────── */}
      <div style={{ padding: '4px 14px' }}>
        <div className="eos-segmented-control" style={{ fontSize: 9.5 }}>
          {ALTITUDE_BANDS.map(alt => (
            <button
              key={alt.id}
              className={`eos-segmented-btn ${flightAltitudeFilter === alt.id ? 'active' : ''}`}
              onClick={() => setFlightAltitudeFilter(alt.id)}
              style={{ padding: '4px 4px', fontSize: 10 }}
              title={alt.desc}
            >
              {alt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Aircraft Type Dropdown ─────────────────────────────────── */}
      <div style={{ padding: '4px 14px 8px', borderBottom: '1px solid var(--eos-border-subtle)' }}>
        <select
          value={flightAircraftTypeFilter}
          onChange={(e) => setFlightAircraftTypeFilter(e.target.value as any)}
          style={{
            width: '100%',
            height: 30,
            padding: '0 10px',
            fontSize: 11,
            borderRadius: 'var(--eos-radius-card)',
            background: 'var(--eos-surface-card)',
            border: '1px solid var(--eos-surface-card-border)',
            color: 'var(--eos-text-primary)',
            cursor: 'pointer',
          }}
        >
          {AIRCRAFT_TYPES.map(t => (
            <option key={t.id} value={t.id} style={{ background: 'var(--eos-bg-canvas)', color: 'var(--eos-text-primary)' }}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* ─── Filter Mode Tabs ───────────────────────────────────────── */}
      <div style={{ padding: '6px 14px', borderBottom: '1px solid var(--eos-border-subtle)' }}>
        <div className="eos-segmented-control" style={{ fontSize: 10 }}>
          {[
            { id: 'all', label: `All (${flights.length})` },
            { id: 'airborne', label: `Airborne (${airborneCount})` },
            { id: 'climb', label: `Climb ↑ (${climbingCount})` },
            { id: 'descend', label: `Descend ↓ (${descendingCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              className={`eos-segmented-btn ${filterMode === tab.id ? 'active' : ''}`}
              onClick={() => setFilterMode(tab.id as any)}
              style={{ padding: '4px 6px', fontSize: 10 }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Flight List Scrollable Area ────────────────────────────── */}
      <div className="eos-scrollable" style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 14px', minHeight: 180 }}>
        {!flightTrackingActive ? (
          <div style={{ textAlign: 'center', padding: '36px 14px', color: 'var(--eos-text-tertiary)', fontSize: 12 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏸</div>
            Flight tracking is paused.<br />
            <span style={{ fontSize: 10.5 }}>Click &quot;Tracking OFF&quot; above to resume live feed.</span>
          </div>
        ) : flightsLoading && flights.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 14px', color: 'var(--eos-text-secondary)', fontSize: 12 }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '2px solid #ffcc00',
              borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 10px',
            }} />
            Connecting to ADS-B transponder network…
          </div>
        ) : flightsError && flights.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 14px', color: 'var(--eos-red)', fontSize: 12 }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>⚠️</div>
            {flightsError}
          </div>
        ) : filteredFlights.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 14px', color: 'var(--eos-text-tertiary)', fontSize: 12 }}>
            No aircraft matching current filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredFlights.slice(0, 120).map(flight => {
              const isSelected = selectedFlight?.icao24 === flight.icao24
              return (
                <div
                  key={flight.icao24}
                  onClick={() => handleSelectFlight(flight)}
                  className="eos-card"
                  style={{
                    padding: '8px 10px',
                    cursor: 'pointer',
                    borderColor: isSelected ? '#ffcc00' : undefined,
                    background: isSelected ? 'rgba(255, 204, 0, 0.1)' : undefined,
                    transition: 'all 150ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Golden rotated plane heading icon */}
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: 12,
                          transform: `rotate(${(flight.heading || 0) - 45}deg)`,
                          color: isSelected ? '#00f0ff' : '#ffcc00',
                          transition: 'transform 200ms ease',
                        }}
                        title={`Heading: ${flight.heading || 0}°`}
                        aria-hidden="true"
                      >
                        ✈
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--eos-text-primary)', letterSpacing: '0.02em' }}>
                        {flight.callsign}
                      </span>
                      {flight.airlineCode && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: 'rgba(255, 204, 0, 0.15)',
                          color: '#ffcc00',
                        }}>
                          {flight.airlineCode}
                        </span>
                      )}
                    </div>

                    {/* Altitude pill */}
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#ffcc00' }}>
                      {flight.altitudeFeet != null ? `${flight.altitudeFeet.toLocaleString()} ft` : 'Ground'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'var(--eos-text-tertiary)' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '58%' }}>
                      {flight.airline}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {flight.groundSpeedKnots != null && (
                        <span>{flight.groundSpeedKnots} kts</span>
                      )}
                      {flight.verticalRateFpm != null && Math.abs(flight.verticalRateFpm) > 100 && (
                        <span style={{ color: flight.verticalRateFpm > 0 ? 'var(--eos-teal)' : 'var(--eos-orange)', fontWeight: 600 }}>
                          {flight.verticalRateFpm > 0 ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── Attribution & Cockpit View Quick Action ────────────────── */}
      <div style={{
        padding: '8px 14px',
        borderTop: '1px solid var(--eos-border-subtle)',
        fontSize: 9.5,
        color: 'var(--eos-text-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>{flightProviderInfo?.attribution || 'The OpenSky Network · ADS-B'}</span>
        {selectedFlight && (
          <button
            onClick={() => setCockpitViewOpen(true)}
            style={{
              background: 'rgba(255, 204, 0, 0.15)',
              border: '1px solid rgba(255, 204, 0, 0.35)',
              borderRadius: 4,
              color: '#ffcc00',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 7px',
              cursor: 'pointer',
            }}
          >
            Cockpit 3D ↗
          </button>
        )}
      </div>
    </div>
  )
}

export default LiveFlightsPanel
