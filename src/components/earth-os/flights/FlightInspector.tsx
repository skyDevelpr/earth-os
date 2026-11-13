'use client'

import { useState, useEffect } from 'react'
import { useEarthOsStore } from '@/stores/earth-os'
import type { FlightPhoto } from '@/types/earth-os'
import { resolveFlightRoute, type RouteProgressMetrics } from '@/services/earth-os/flight-routes'

function getCompassDirection(heading: number | null): string {
  if (heading == null) return 'N/A'
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(((heading % 360) / 22.5)) % 16
  return directions[index]
}

export function FlightInspector() {
  const {
    selectedFlight,
    setSelectedFlight,
    setCockpitViewOpen,
    flightTrailMap,
    flyTo,
  } = useEarthOsStore()

  const [photo, setPhoto] = useState<FlightPhoto | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [liveProgressFraction, setLiveProgressFraction] = useState<number>(0.5)

  const flight = selectedFlight

  // Resolve Route & Timing Metrics
  const routeMetrics: RouteProgressMetrics | null = flight ? resolveFlightRoute(flight) : null

  // Fetch genuine aircraft photograph from Planespotters API
  useEffect(() => {
    if (!flight) {
      setPhoto(null)
      return
    }

    let active = true
    setPhotoLoading(true)

    const params = new URLSearchParams()
    if (flight.registration) params.set('reg', flight.registration)
    if (flight.icao24) params.set('hex', flight.icao24)

    fetch(`/api/earth-os/flights/photo?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (!active) return
        if (data.success && data.photo) {
          setPhoto(data.photo)
        } else {
          setPhoto(null)
        }
      })
      .catch(() => {
        if (active) setPhoto(null)
      })
      .finally(() => {
        if (active) setPhotoLoading(false)
      })

    return () => {
      active = false
    }
  }, [flight?.icao24, flight?.registration])

  // Synchronized 60 FPS Live Progress Bar Engine
  useEffect(() => {
    if (!flight || !routeMetrics) return

    let rafId: number
    const initialPercent = (routeMetrics.progressPercent || 50) / 100
    setLiveProgressFraction(initialPercent)

    const speedKmh = flight.groundSpeedKmh || (flight.groundSpeedKnots ? flight.groundSpeedKnots * 1.852 : 750)
    const totalKm = routeMetrics.totalDistanceKm || 1000

    let lastTime = performance.now()
    let currentFraction = initialPercent

    const step = (time: number) => {
      const dt = (time - lastTime) / 1000
      lastTime = time

      if (!flight.onGround && speedKmh > 50) {
        const speedKmPerSec = speedKmh / 3600
        const deltaFraction = (speedKmPerSec * dt) / totalKm
        currentFraction = Math.min(0.99, currentFraction + deltaFraction)
        setLiveProgressFraction(currentFraction)
      }

      rafId = requestAnimationFrame(step)
    }

    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [flight?.icao24, flight?.groundSpeedKnots, flight?.onGround, routeMetrics?.totalDistanceKm, routeMetrics?.progressPercent])

  if (!flight) return null

  const trail = flightTrailMap[flight.icao24] || []
  const compass = getCompassDirection(flight.heading)

  const handleEnterCockpit = () => {
    setCockpitViewOpen(true)
  }

  const handleFlyTo = () => {
    flyTo({
      center: [flight.longitude, flight.latitude],
      zoom: 8.5,
      pitch: 45,
      bearing: flight.heading || 0,
    })
  }

  const origin = routeMetrics?.origin
  const destination = routeMetrics?.destination
  const timings = routeMetrics?.timings

  const progressPercent = Math.round(liveProgressFraction * 100)

  const formatSeconds = (sec: number | null) => {
    if (sec == null || isNaN(sec)) return '—'
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  return (
    <aside className="eos-inspector-container" aria-label="Flight Intelligence Inspector">
      <div className="eos-inspector-sheet">
        {/* ─── Header: Flight Identity (Portfolio Design) ─────────────── */}
        <div className="eos-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--eos-radius-sm)',
              background: 'var(--eos-surface-pill-active)',
              color: 'var(--eos-surface-pill-active-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
              boxShadow: 'var(--eos-shadow-sm)',
            }}>
              ✈
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="eos-panel-title" style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {flight.callsign}
                </span>
                {flight.airlineCode && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    padding: '2px 8px',
                    borderRadius: 'var(--eos-radius-full)',
                    background: 'rgba(0, 209, 255, 0.12)',
                    color: 'var(--eos-accent-cyan)',
                    border: '1px solid rgba(0, 209, 255, 0.25)',
                  }}>
                    {flight.airlineCode}
                  </span>
                )}
                {flight.flightNumber && flight.flightNumber !== flight.callsign && (
                  <span style={{ fontSize: 13, color: 'var(--eos-text-tertiary)', fontWeight: 500 }}>
                    ({flight.flightNumber})
                  </span>
                )}
              </div>
              <div className="eos-panel-subtitle" style={{ fontSize: 12, marginTop: 2 }}>
                {flight.airline} · {flight.originCountry}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedFlight(null)}
            className="eos-inspector-close"
            title="Close Flight Inspector"
            aria-label="Close Flight Inspector"
          >
            ✕
          </button>
        </div>

        {/* ─── Scrollable Body ────────────────────────────────────────── */}
        <div className="eos-scrollable" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ─── Aircraft Photograph (Planespotters Official API) ──────── */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: 200,
            borderRadius: 'var(--eos-radius-card)',
            overflow: 'hidden',
            background: 'var(--eos-surface-card)',
            border: '1px solid var(--eos-surface-card-border)',
            boxShadow: 'var(--eos-shadow-sm)',
          }}>
            {photoLoading ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--eos-text-secondary)', fontSize: 12 }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: '2.5px solid var(--eos-accent-cyan)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <span>Matching verified aircraft photo…</span>
              </div>
            ) : photo ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`${flight.airline} ${flight.aircraftType || ''}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 'auto 0 0 0',
                  background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.85) 100%)',
                  padding: '20px 14px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  color: '#ffffff',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ opacity: 0.8 }}>📷</span>
                    <span style={{ fontWeight: 600 }}>{photo.photographer}</span>
                  </div>
                  <a
                    href={photo.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--eos-accent-cyan)', textDecoration: 'none', fontWeight: 600, fontSize: 10.5 }}
                  >
                    Planespotters.net ↗
                  </a>
                </div>
              </>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--eos-text-secondary)', padding: 16, textAlign: 'center' }}>
                <span style={{ fontSize: 36 }}>✈️</span>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--eos-text-primary)' }}>
                  {flight.aircraftType || 'Commercial Aircraft'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--eos-text-tertiary)' }}>
                  Registration: {flight.registration || flight.icao24.toUpperCase()}
                </div>
              </div>
            )}
          </div>

          {/* ─── Route Display: Departure & Destination ─────────────────── */}
          {origin && destination && (
            <div className="eos-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                {/* Origin */}
                <div style={{ textAlign: 'left', maxWidth: '42%' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--eos-font-heading)', color: 'var(--eos-text-primary)', letterSpacing: '-0.02em' }}>
                    {origin.iata}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--eos-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {origin.city}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--eos-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {origin.name}
                  </div>
                </div>

                {/* Arrow / Flight Status Badge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 16, color: 'var(--eos-accent-cyan)' }}>➔</span>
                  <span style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    padding: '3px 9px',
                    borderRadius: 'var(--eos-radius-full)',
                    background: flight.onGround ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: flight.onGround ? 'var(--eos-accent-amber)' : 'var(--eos-accent-emerald)',
                    border: `1px solid ${flight.onGround ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  }}>
                    {flight.onGround ? 'TAXI' : 'EN ROUTE'}
                  </span>
                </div>

                {/* Destination */}
                <div style={{ textAlign: 'right', maxWidth: '42%' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--eos-font-heading)', color: 'var(--eos-text-primary)', letterSpacing: '-0.02em' }}>
                    {destination.iata}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--eos-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {destination.city}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--eos-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {destination.name}
                  </div>
                </div>
              </div>

              {/* ─── Live Synchronized Route Progress Bar ─────────────────── */}
              <div style={{ marginTop: 14, marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 500, color: 'var(--eos-text-secondary)', marginBottom: 8 }}>
                  <span>{progressPercent}% Completed</span>
                  <span style={{ color: 'var(--eos-accent-cyan)', fontWeight: 600 }}>{formatSeconds(routeMetrics.remainingTimeSeconds)} remaining</span>
                </div>

                {/* Track with plane icon */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: 6,
                  borderRadius: 'var(--eos-radius-full)',
                  background: 'var(--eos-surface-card-hover)',
                  overflow: 'visible',
                  border: '1px solid var(--eos-border-subtle)',
                }}>
                  {/* Progress Fill */}
                  <div style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    borderRadius: 'var(--eos-radius-full)',
                    background: 'linear-gradient(90deg, #0ea5e9 0%, #00D1FF 100%)',
                    transition: 'width 250ms linear',
                  }} />

                  {/* Synchronized moving airplane indicator */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: `${progressPercent}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'var(--eos-surface-pill-active)',
                    color: 'var(--eos-surface-pill-active-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
                    transition: 'left 250ms linear',
                  }}>
                    ✈
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--eos-text-tertiary)', marginTop: 10 }}>
                  <span>Flown: {routeMetrics.distanceFlownKm.toLocaleString()} km</span>
                  <span>Total: {routeMetrics.totalDistanceKm.toLocaleString()} km</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── Timings Table ────────────────────────────────────────── */}
          {timings && (
            <div className="eos-card" style={{ padding: '14px 16px' }}>
              <div className="eos-card-header" style={{ marginBottom: 10 }}>
                <span>Flight Timetable & Status</span>
                <span style={{ fontSize: 10, color: 'var(--eos-text-tertiary)', textTransform: 'none' }}>Local Airport Times</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 12 }}>
                {/* Departure Column */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--eos-accent-cyan)', marginBottom: 6 }}>
                    DEPARTURE ({origin?.iata})
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--eos-text-secondary)' }}>Scheduled:</span>
                    <span style={{ fontWeight: 600, color: 'var(--eos-text-primary)' }}>{timings.scheduledDeparture || 'Not available'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--eos-text-secondary)' }}>Actual:</span>
                    <span style={{ fontWeight: 600, color: 'var(--eos-accent-emerald)' }}>{timings.actualDeparture || 'Not available'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--eos-text-secondary)' }}>Est. Dep:</span>
                    <span style={{ color: 'var(--eos-text-secondary)' }}>{timings.estimatedDeparture || 'On time'}</span>
                  </div>
                </div>

                {/* Arrival Column */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--eos-accent-cyan)', marginBottom: 6 }}>
                    ARRIVAL ({destination?.iata})
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--eos-text-secondary)' }}>Scheduled:</span>
                    <span style={{ fontWeight: 600, color: 'var(--eos-text-primary)' }}>{timings.scheduledArrival || 'Not available'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--eos-text-secondary)' }}>Estimated:</span>
                    <span style={{ fontWeight: 600, color: 'var(--eos-accent-cyan)' }}>{timings.estimatedArrival || 'Calculating…'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--eos-text-secondary)' }}>Actual:</span>
                    <span style={{ color: 'var(--eos-text-secondary)' }}>{timings.actualArrival || 'In flight'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Actions Row (Cockpit 3D & Focus Camera) ───────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              onClick={handleEnterCockpit}
              style={{
                padding: '11px 16px',
                borderRadius: 'var(--eos-radius-full)',
                background: 'var(--eos-surface-pill-active)',
                border: 'none',
                color: 'var(--eos-surface-pill-active-text)',
                fontFamily: 'var(--eos-font)',
                fontSize: 12.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: 'var(--eos-shadow-sm)',
                transition: 'all 0.25s var(--eos-ease)',
              }}
            >
              <span style={{ fontSize: 14 }}>🎛</span>
              <span>Cockpit 3D</span>
            </button>

            <button
              onClick={handleFlyTo}
              style={{
                padding: '11px 16px',
                borderRadius: 'var(--eos-radius-full)',
                background: 'var(--eos-surface-card)',
                border: '1px solid var(--eos-surface-card-border)',
                color: 'var(--eos-text-primary)',
                fontFamily: 'var(--eos-font)',
                fontSize: 12.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: 'var(--eos-shadow-sm)',
                transition: 'all 0.25s var(--eos-ease)',
              }}
            >
              <span>🎯</span>
              <span>Center Camera</span>
            </button>
          </div>

          {/* ─── Live Telemetry Grid ───────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="eos-card">
              <div className="eos-card-header">Altitude (MSL)</div>
              <div className="eos-metric">
                <span className="eos-metric-value" style={{ color: 'var(--md-sys-color-primary)' }}>
                  {flight.altitudeFeet != null ? flight.altitudeFeet.toLocaleString() : '—'}
                </span>
                <span className="eos-metric-unit">ft</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--md-sys-color-outline)', marginTop: 2 }}>
                {flight.altitudeBaroMeters != null ? `${flight.altitudeBaroMeters.toLocaleString()} m baro` : 'Ground level'}
              </div>
            </div>

            <div className="eos-card">
              <div className="eos-card-header">Ground Speed</div>
              <div className="eos-metric">
                <span className="eos-metric-value">
                  {flight.groundSpeedKnots != null ? flight.groundSpeedKnots : '—'}
                </span>
                <span className="eos-metric-unit">kts</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--md-sys-color-outline)', marginTop: 2 }}>
                {flight.groundSpeedKmh != null ? `${flight.groundSpeedKmh} km/h` : 'Stationary'}
              </div>
            </div>

            <div className="eos-card">
              <div className="eos-card-header">Heading / Track</div>
              <div className="eos-metric">
                <span className="eos-metric-value">
                  {flight.heading != null ? `${flight.heading}°` : '—'}
                </span>
                <span className="eos-metric-unit">{compass}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--md-sys-color-outline)', marginTop: 2 }}>
                True Track (clockwise from N)
              </div>
            </div>

            <div className="eos-card">
              <div className="eos-card-header">Vertical Rate</div>
              <div className="eos-metric">
                <span className="eos-metric-value" style={{
                  color: flight.verticalRateFpm && flight.verticalRateFpm > 100
                    ? 'var(--md-sys-color-success)'
                    : flight.verticalRateFpm && flight.verticalRateFpm < -100
                    ? 'var(--md-sys-color-warning)'
                    : 'inherit'
                }}>
                  {flight.verticalRateFpm != null
                    ? `${flight.verticalRateFpm > 0 ? '+' : ''}${flight.verticalRateFpm}`
                    : '0'}
                </span>
                <span className="eos-metric-unit">ft/m</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--md-sys-color-outline)', marginTop: 2 }}>
                {flight.verticalRateFpm && flight.verticalRateFpm > 100
                  ? 'Climbing ↑'
                  : flight.verticalRateFpm && flight.verticalRateFpm < -100
                  ? 'Descending ↓'
                  : 'Level flight'}
              </div>
            </div>
          </div>

          {/* ─── Aircraft Classification & Transponder ─────────────────── */}
          <div className="eos-card">
            <div className="eos-card-header">
              <span>Aircraft & Transponder Details</span>
              <span style={{ color: 'var(--md-sys-color-primary)', textTransform: 'none' }}>{flight.positionSource}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Model / Type</span>
                <span style={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 600 }}>{flight.aircraftType || 'Commercial Jet'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>ICAO 24-bit Address</span>
                <span style={{ color: 'var(--md-sys-color-on-surface)', fontFamily: 'var(--eos-font-mono)', fontWeight: 600 }}>
                  {flight.icao24.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Registration</span>
                <span style={{ color: 'var(--md-sys-color-on-surface)', fontFamily: 'var(--eos-font-mono)' }}>
                  {flight.registration || 'Available on lookup'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Transponder Squawk</span>
                <span style={{ color: 'var(--md-sys-color-on-surface)', fontFamily: 'var(--eos-font-mono)' }}>
                  {flight.squawk || '1000'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Current Coordinates</span>
                <span style={{ color: 'var(--md-sys-color-on-surface)', fontFamily: 'var(--eos-font-mono)', fontSize: 11 }}>
                  {flight.latitude.toFixed(4)}°, {flight.longitude.toFixed(4)}°
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Radar Breadcrumbs</span>
                <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>
                  {trail.length > 0 ? `${trail.length} GPS fixes tracked` : 'Live track active'}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Attribution & Transparency ───────────────────────────── */}
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--md-sys-shape-corner-small)',
            background: 'var(--md-sys-color-surface-container-high)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            fontSize: 10.5,
            lineHeight: 1.5,
            color: 'var(--md-sys-color-outline)',
          }}>
            <div style={{ fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)', marginBottom: 2 }}>
              Verified Planetary Telemetry
            </div>
            Data transmitted via 1090 MHz Mode S ADS-B transponder grid. Photographs legitimately provided by Planespotters.net contributors under CC licensing.
          </div>

        </div>
      </div>
    </aside>
  )
}

export default FlightInspector
