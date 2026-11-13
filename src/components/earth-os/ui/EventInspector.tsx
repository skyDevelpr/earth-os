'use client'

import { useEarthOsStore } from '@/stores/earth-os'
import type { UnifiedEvent, EarthquakeEvent, FireDetectionEvent, GeographicPoi } from '@/types/earth-os'
import { findCorrelations } from '@/services/earth-os/correlation'
import { useWeather, usePlanetaryNews } from '@/hooks/earth-os/useEarthData'
import { useMemo } from 'react'
import { getPoiBadge } from '@/services/earth-os/poi.service'

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toUTCString().replace(' GMT', ' UTC')
  } catch {
    return isoString
  }
}

function MagnitudeDisplay({ mag }: { mag: number }) {
  const color = mag >= 7 ? 'var(--eos-red)' : mag >= 5 ? 'var(--eos-orange)' : 'var(--eos-green)'
  const glow = mag >= 7 ? 'var(--eos-red-glow)' : mag >= 5 ? 'rgba(255, 159, 10, 0.2)' : 'rgba(52, 199, 89, 0.2)'
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: 3,
      background: `linear-gradient(135deg, ${color}22 0%, ${color}0d 100%)`,
      border: `1px solid ${color}4d`,
      boxShadow: `0 2px 12px ${glow}`,
      borderRadius: 'var(--eos-radius-md)',
      padding: '6px 12px',
    }}>
      <span style={{ fontSize: 26, fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {mag.toFixed(1)}
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--eos-text-secondary)' }}>Mw</span>
    </div>
  )
}

function EarthquakeInspector({ event }: { event: EarthquakeEvent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <MagnitudeDisplay mag={event.magnitude} />
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--eos-text-tertiary)' }}>Magnitude</div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--eos-text-secondary)' }}>{event.magnitudeType ?? 'Moment magnitude'}</div>
        </div>
      </div>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="eos-card">
          <div className="eos-card-header">Depth</div>
          <div className="eos-metric">
            <span className="eos-metric-value">{event.depth.toFixed(1)}</span>
            <span className="eos-metric-unit">km</span>
          </div>
        </div>
        <div className="eos-card">
          <div className="eos-card-header">Network</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--eos-text-primary)', marginTop: 2 }}>
            {event.net?.toUpperCase() ?? 'N/A'}
          </div>
        </div>
        {event.felt != null && (
          <div className="eos-card">
            <div className="eos-card-header">Felt Reports</div>
            <div className="eos-metric">
              <span className="eos-metric-value">{event.felt.toLocaleString()}</span>
            </div>
          </div>
        )}
        {event.tsunami && (
          <div className="eos-card" style={{ borderColor: 'rgba(255,69,58,0.4)', background: 'rgba(255,69,58,0.08)' }}>
            <div className="eos-card-header" style={{ color: 'var(--eos-red)' }}>⚠ Advisory</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--eos-red)' }}>Tsunami alert issued</div>
          </div>
        )}
      </div>

      {/* Coordinates */}
      <div className="eos-card">
        <div className="eos-card-header">Epicentre Coordinates</div>
        <div style={{ fontSize: 11.5, color: 'var(--eos-text-secondary)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--eos-font-mono)' }}>
          {event.coordinates.latitude.toFixed(4)}°{event.coordinates.latitude >= 0 ? 'N' : 'S'},&nbsp;
          {Math.abs(event.coordinates.longitude).toFixed(4)}°{event.coordinates.longitude >= 0 ? 'E' : 'W'}
        </div>
      </div>

      {/* Timestamp */}
      <div className="eos-card">
        <div className="eos-card-header">Observation Timestamp</div>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--eos-text-secondary)' }}>
          {formatTime(event.observationTime)}
        </div>
      </div>

      {/* Source attribution */}
      {event.sourceUrl && (
        <div style={{ padding: '8px 2px', borderTop: '1px solid var(--eos-border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, fontWeight: 500, color: 'var(--eos-cyan)', textDecoration: 'none' }}
          >
            USGS Event Page ↗
          </a>
        </div>
      )}
    </div>
  )
}

function FireInspector({ event }: { event: FireDetectionEvent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="eos-card">
          <div className="eos-card-header">Fire Radiative Power</div>
          <div className="eos-metric">
            <span className="eos-metric-value">
              {event.fireRadiativePower != null ? event.fireRadiativePower.toFixed(1) : 'N/A'}
            </span>
            {event.fireRadiativePower != null && <span className="eos-metric-unit">MW</span>}
          </div>
        </div>
        <div className="eos-card">
          <div className="eos-card-header">Confidence</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--eos-orange)', textTransform: 'capitalize', marginTop: 2 }}>
            {event.confidenceLevel ?? 'Nominal'}
          </div>
        </div>
        <div className="eos-card">
          <div className="eos-card-header">Satellite</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--eos-text-primary)', marginTop: 2 }}>
            {event.satellite}
          </div>
        </div>
        <div className="eos-card">
          <div className="eos-card-header">Sensor Instrument</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--eos-text-primary)', marginTop: 2 }}>
            {event.sensor}
          </div>
        </div>
      </div>

      <div className="eos-card">
        <div className="eos-card-header">Detection Coordinates</div>
        <div style={{ fontSize: 11.5, color: 'var(--eos-text-secondary)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--eos-font-mono)' }}>
          {event.coordinates.latitude.toFixed(5)}°{event.coordinates.latitude >= 0 ? 'N' : 'S'},&nbsp;
          {Math.abs(event.coordinates.longitude).toFixed(5)}°{event.coordinates.longitude >= 0 ? 'E' : 'W'}
        </div>
      </div>

      <div style={{ padding: '8px 2px', borderTop: '1px solid var(--eos-border-subtle)' }}>
        <div style={{ fontSize: 10.5, color: 'var(--eos-text-tertiary)' }}>
          Source: NASA FIRMS (Fire Information for Resource Management System)
        </div>
      </div>
    </div>
  )
}

function GenericInspector({ event }: { event: UnifiedEvent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {event.measurement != null && (
        <div className="eos-card">
          <div className="eos-card-header">Observed Metric</div>
          <div className="eos-metric">
            <span className="eos-metric-value">{event.measurement}</span>
            {event.measurementUnit && (
              <span className="eos-metric-unit">{event.measurementUnit}</span>
            )}
          </div>
        </div>
      )}

      <div className="eos-card">
        <div className="eos-card-header">Geographic Location</div>
        <div style={{ fontSize: 11, color: 'var(--eos-text-tertiary)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--eos-font-mono)' }}>
          {event.coordinates.latitude.toFixed(4)}°,&nbsp;
          {event.coordinates.longitude.toFixed(4)}°
        </div>
      </div>

      <div className="eos-card">
        <div className="eos-card-header">Observation Timestamp</div>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--eos-text-secondary)' }}>
          {formatTime(event.observationTime)}
        </div>
      </div>

      {event.sourceUrl && (
        <div style={{ padding: '8px 2px', borderTop: '1px solid var(--eos-border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, fontWeight: 500, color: 'var(--eos-cyan)', textDecoration: 'none' }}
          >
            Original Source ↗
          </a>
        </div>
      )}
    </div>
  )
}

// ─── POI Inspector Component ───────────────────────────────────────────────
function PoiInspectorView({
  poi,
  earthquakes,
  eonetEvents,
  onFlyTo,
}: {
  poi: GeographicPoi
  earthquakes: EarthquakeEvent[]
  eonetEvents: UnifiedEvent[]
  onFlyTo: (coords: [number, number]) => void
}) {
  const badge = getPoiBadge(poi.category)

  // Real-time weather at this POI
  const { data: weatherData } = useWeather(
    poi.coordinates.latitude,
    poi.coordinates.longitude,
    true
  )
  const currentAtmosphere = weatherData?.data?.current

  // Correlated news matching the landmark or city
  const searchKeywords = poi.name.split('(')[0].trim()
  const { data: relatedNews = [] } = usePlanetaryNews({
    query: searchKeywords,
    limit: 3,
  })

  // Detect any active natural events in vicinity (< 500 km)
  const nearbyEvents = useMemo(() => {
    const list: Array<{ title: string; type: string; distKm: number }> = []
    const lat1 = poi.coordinates.latitude
    const lon1 = poi.coordinates.longitude

    const calcDist = (lat2: number, lon2: number) => {
      const R = 6371
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLon = (lon2 - lon1) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }

    earthquakes.forEach(eq => {
      const d = calcDist(eq.coordinates.latitude, eq.coordinates.longitude)
      if (d <= 500) {
        list.push({ title: `M${eq.magnitude.toFixed(1)} ${eq.description || eq.title}`, type: 'Earthquake', distKm: Math.round(d) })
      }
    })

    eonetEvents.forEach(ev => {
      const d = calcDist(ev.coordinates.latitude, ev.coordinates.longitude)
      if (d <= 600) {
        list.push({ title: ev.title, type: ev.category, distKm: Math.round(d) })
      }
    })

    return list.slice(0, 3)
  }, [poi, earthquakes, eonetEvents])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Description Box */}
      <div className="eos-card" style={{ borderColor: 'var(--eos-border-highlight)' }}>
        <div className="eos-card-header" style={{ color: badge.color }}>
          {badge.emoji} {badge.label.toUpperCase()}
        </div>
        <p style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--eos-text-primary)', margin: '6px 0 0' }}>
          {poi.description}
        </p>
      </div>

      {/* Dynamic Key Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="eos-card">
          <div className="eos-card-header">Country / Region</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--eos-text-primary)', marginTop: 2 }}>
            {poi.country}
          </div>
        </div>

        {poi.metadata?.elevation != null && (
          <div className="eos-card">
            <div className="eos-card-header">Elevation</div>
            <div className="eos-metric">
              <span className="eos-metric-value">{poi.metadata.elevation.toLocaleString()}</span>
              <span className="eos-metric-unit">m</span>
            </div>
          </div>
        )}

        {poi.metadata?.population != null && (
          <div className="eos-card">
            <div className="eos-card-header">Metropolitan Pop.</div>
            <div className="eos-metric">
              <span className="eos-metric-value">{(poi.metadata.population / 1000000).toFixed(1)}</span>
              <span className="eos-metric-unit">M</span>
            </div>
          </div>
        )}

        {poi.metadata?.area != null && (
          <div className="eos-card">
            <div className="eos-card-header">Surface Area</div>
            <div className="eos-metric">
              <span className="eos-metric-value">{poi.metadata.area.toLocaleString()}</span>
              <span className="eos-metric-unit">km²</span>
            </div>
          </div>
        )}

        {poi.metadata?.length != null && (
          <div className="eos-card">
            <div className="eos-card-header">Total Length</div>
            <div className="eos-metric">
              <span className="eos-metric-value">{poi.metadata.length.toLocaleString()}</span>
              <span className="eos-metric-unit">km</span>
            </div>
          </div>
        )}

        {poi.metadata?.capacity != null && (
          <div className="eos-card">
            <div className="eos-card-header">Rated Capacity</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--eos-orange)', marginTop: 2 }}>
              {poi.metadata.capacity}
            </div>
          </div>
        )}

        {poi.metadata?.iataCode && (
          <div className="eos-card">
            <div className="eos-card-header">IATA Identifier</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--eos-cyan)', letterSpacing: '0.05em', marginTop: 2 }}>
              {poi.metadata.iataCode}
            </div>
          </div>
        )}

        {poi.metadata?.unescoYear && (
          <div className="eos-card">
            <div className="eos-card-header">UNESCO Inscription</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#facc15', marginTop: 2 }}>
              Year {poi.metadata.unescoYear}
            </div>
          </div>
        )}

        {poi.metadata?.operator && (
          <div className="eos-card" style={{ gridColumn: 'span 2' }}>
            <div className="eos-card-header">Operating Agency</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--eos-text-secondary)', marginTop: 2 }}>
              {poi.metadata.operator}
            </div>
          </div>
        )}
      </div>

      {/* Geodetic Coordinates */}
      <div className="eos-card">
        <div className="eos-card-header">Global Coordinates (WGS84)</div>
        <div style={{ fontSize: 11.5, color: 'var(--eos-text-secondary)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--eos-font-mono)' }}>
          {poi.coordinates.latitude >= 0 ? `${poi.coordinates.latitude.toFixed(4)}°N` : `${Math.abs(poi.coordinates.latitude).toFixed(4)}°S`},&nbsp;
          {poi.coordinates.longitude >= 0 ? `${poi.coordinates.longitude.toFixed(4)}°E` : `${Math.abs(poi.coordinates.longitude).toFixed(4)}°W`}
        </div>
      </div>

      {/* Real-time Atmospheric Conditions */}
      {currentAtmosphere && (
        <div className="eos-card">
          <div className="eos-card-header">
            <span>Atmospheric Context (Open-Meteo)</span>
            <span style={{ color: 'var(--eos-cyan)', fontSize: 9.5 }}>LIVE</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6, fontSize: 11 }}>
            <div>Temp: <strong style={{ color: 'var(--eos-text-primary)' }}>{currentAtmosphere.temperature_2m}°C</strong></div>
            <div>Wind: <strong style={{ color: 'var(--eos-text-primary)' }}>{currentAtmosphere.wind_speed_10m} km/h</strong></div>
            <div>Humidity: <strong style={{ color: 'var(--eos-text-primary)' }}>{currentAtmosphere.relative_humidity_2m}%</strong></div>
            <div>Pressure: <strong style={{ color: 'var(--eos-text-primary)' }}>{currentAtmosphere.surface_pressure} hPa</strong></div>
          </div>
        </div>
      )}

      {/* Natural Hazards in Vicinity */}
      {nearbyEvents.length > 0 && (
        <div className="eos-card">
          <div className="eos-card-header">
            <span>Natural Events in Vicinity (&lt;500km)</span>
            <span style={{ color: 'var(--eos-orange)', fontSize: 9.5 }}>RADAR</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
            {nearbyEvents.map((ev, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, padding: '4px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
                <span style={{ color: 'var(--eos-text-primary)', fontWeight: 500 }}>{ev.title}</span>
                <span style={{ color: 'var(--eos-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{ev.distKm} km away</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related News Dispatches */}
      {relatedNews.length > 0 && (
        <div className="eos-card">
          <div className="eos-card-header">
            <span>Regional Field Reporting</span>
            <span style={{ color: 'var(--eos-cyan)', fontSize: 9.5 }}>GDELT</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {relatedNews.map((news: any) => (
              <a
                key={news.id}
                href={news.url}
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
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--eos-text-primary)', lineHeight: 1.35, marginBottom: 2 }}>
                  {news.title}
                </div>
                <div style={{ fontSize: 9.5, color: 'var(--eos-text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{news.publisher}</span>
                  <span>Source ↗</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 3D Orbit & Source Footer */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={() => onFlyTo([poi.coordinates.longitude, poi.coordinates.latitude])}
          className="eos-glass-pill"
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 11.5,
            fontWeight: 600,
            color: 'var(--eos-cyan)',
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          🌍 3D Orbit View
        </button>

        {poi.metadata?.sourceUrl && (
          <a
            href={poi.metadata.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="eos-glass-pill"
            style={{
              padding: '8px 14px',
              fontSize: 11.5,
              fontWeight: 500,
              color: 'var(--eos-text-secondary)',
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            Reference ↗
          </a>
        )}
      </div>
    </div>
  )
}

const CATEGORY_ICONS: Record<string, string> = {
  earthquakes: '🔴',
  wildfires: '🔥',
  fireHotspot: '🔥',
  volcanoes: '🌋',
  severeStorms: '🌪',
  floods: '🌊',
  snow: '❄',
  seaIce: '🧊',
  dustHaze: '🌫',
  temperatureExtremes: '🌡',
  other: '⚠',
}

export function EventInspector() {
  const {
    selectedEvent,
    setSelectedEvent,
    selectedPoi,
    setSelectedPoi,
    inspectorOpen,
    setInspectorOpen,
    earthquakes,
    eonetEvents,
    fireHotspots,
    flyTo,
  } = useEarthOsStore()

  // 1. Calculate event correlations in real-time
  const correlation = useMemo(() => {
    if (!selectedEvent) return null
    return findCorrelations(selectedEvent, earthquakes, eonetEvents, fireHotspots)
  }, [selectedEvent, earthquakes, eonetEvents, fireHotspots])

  // 2. Fetch local atmospheric context at the epicenter / event coordinate
  const { data: weatherData } = useWeather(
    selectedEvent?.coordinates.latitude ?? NaN,
    selectedEvent?.coordinates.longitude ?? NaN,
    !!selectedEvent
  )
  const currentAtmosphere = weatherData?.data?.current

  // 3. Fetch correlated regional news
  const { data: relatedNews = [] } = usePlanetaryNews({
    location: selectedEvent?.description?.split(',')[1]?.trim() || selectedEvent?.title?.split('-')[1]?.trim(),
    category: selectedEvent?.category === 'earthquakes' ? 'earthquakes' : selectedEvent?.category === 'fireHotspot' ? 'wildfires' : 'all',
    limit: 3,
  })

  if ((!selectedEvent && !selectedPoi) || !inspectorOpen) return null

  // ─── POI Inspector Mode ──────────────────────────────────────────────────
  if (selectedPoi) {
    const badge = getPoiBadge(selectedPoi.category)
    return (
      <aside className="eos-inspector-container" aria-label="Point of interest details">
        <div className="eos-inspector">
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--eos-border-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            background: 'rgba(255, 255, 255, 0.02)',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden="true">{badge.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: 'var(--eos-text-primary)',
                lineHeight: 1.3,
                marginBottom: 4,
              }}>
                {selectedPoi.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span
                  className="eos-badge"
                  style={{
                    background: `${badge.color}20`,
                    color: badge.color,
                    border: `1px solid ${badge.color}50`,
                  }}
                >
                  {badge.label}
                </span>
                <span className="eos-badge" style={{ color: 'var(--eos-text-secondary)' }}>
                  {selectedPoi.country}
                </span>
              </div>
            </div>
            <button
              onClick={() => { setSelectedPoi(null); setInspectorOpen(false) }}
              className="eos-glass-pill"
              style={{
                width: 26,
                height: 26,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--eos-text-tertiary)',
                flexShrink: 0,
              }}
              aria-label="Close inspector"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="eos-scrollable" style={{ padding: 14, overflowY: 'auto', flex: 1 }}>
            <PoiInspectorView
              poi={selectedPoi}
              earthquakes={earthquakes}
              eonetEvents={eonetEvents}
              onFlyTo={(coords) => {
                flyTo({ center: coords, zoom: 7.5, bearing: 0, pitch: 35 })
              }}
            />
          </div>
        </div>
      </aside>
    )
  }

  // ─── Event Inspector Mode ────────────────────────────────────────────────
  if (!selectedEvent) return null

  const isEarthquake = selectedEvent.category === 'earthquakes'
  const isFire = selectedEvent.category === 'fireHotspot'
  const icon = CATEGORY_ICONS[selectedEvent.category] ?? '⚠'

  return (
    <aside className="eos-inspector-container" aria-label="Event details inspector">
      <div className="eos-inspector">
        {/* Inspector Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--eos-border-subtle)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          background: 'rgba(255, 255, 255, 0.02)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 20, lineHeight: 1 }} aria-hidden="true">{icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--eos-text-primary)',
              lineHeight: 1.35,
              marginBottom: 4,
            }}>
              {selectedEvent.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span
                className="eos-badge"
                style={{
                  background: 'rgba(0,212,255,0.08)',
                  color: 'var(--eos-cyan)',
                  border: '1px solid rgba(0,212,255,0.25)',
                }}
              >
                {selectedEvent.provider.toUpperCase()}
              </span>
              <span
                className={`eos-badge eos-badge-${selectedEvent.freshness === 'live' ? 'live' : 'cached'}`}
              >
                {selectedEvent.freshness === 'live' ? '● LIVE' : 'CACHED'}
              </span>
            </div>
          </div>
          <button
            onClick={() => { setSelectedEvent(null); setInspectorOpen(false) }}
            className="eos-glass-pill"
            style={{
              width: 26,
              height: 26,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--eos-text-tertiary)',
              flexShrink: 0,
            }}
            aria-label="Close inspector"
          >
            ✕
          </button>
        </div>

        {/* Inspector Content */}
        <div className="eos-scrollable" style={{ padding: 14, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isEarthquake ? (
            <EarthquakeInspector event={selectedEvent as EarthquakeEvent} />
          ) : isFire ? (
            <FireInspector event={selectedEvent as FireDetectionEvent} />
          ) : (
            <GenericInspector event={selectedEvent} />
          )}

          {/* ─── Epicenter Atmospheric Context ───────────────────────────── */}
          {currentAtmosphere && (
            <div className="eos-card">
              <div className="eos-card-header">
                <span>Epicenter Atmospheric Context</span>
                <span style={{ color: 'var(--eos-cyan)', fontSize: 9.5 }}>Open-Meteo</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4, fontSize: 11 }}>
                <div>Temp: <strong style={{ color: 'var(--eos-text-primary)' }}>{currentAtmosphere.temperature_2m}°C</strong></div>
                <div>Wind: <strong style={{ color: 'var(--eos-text-primary)' }}>{currentAtmosphere.wind_speed_10m} km/h</strong></div>
                <div>Humidity: <strong style={{ color: 'var(--eos-text-primary)' }}>{currentAtmosphere.relative_humidity_2m}%</strong></div>
                <div>Pressure: <strong style={{ color: 'var(--eos-text-primary)' }}>{currentAtmosphere.surface_pressure} hPa</strong></div>
              </div>
            </div>
          )}

          {/* ─── Spatial-Temporal Correlations ───────────────────────────── */}
          {correlation && (correlation.nearbyEarthquakes.length > 0 || correlation.nearbyVolcanoes.length > 0) && (
            <div className="eos-card">
              <div className="eos-card-header">
                <span>Spatial-Temporal Correlations</span>
                <span style={{ color: 'var(--eos-orange)', fontSize: 9.5 }}>HAZARD RADAR</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {correlation.nearbyEarthquakes.map((seq) => (
                  <div key={seq.event.id} style={{ fontSize: 10.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--eos-text-secondary)' }}>
                      M{seq.event.magnitude.toFixed(1)} ({seq.distanceKm} km)
                    </span>
                    <button
                      onClick={() => {
                        setSelectedEvent(seq.event)
                        flyTo({ center: [seq.event.coordinates.longitude, seq.event.coordinates.latitude], zoom: 7, bearing: 0, pitch: 0 })
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--eos-cyan)', fontSize: 10, cursor: 'pointer', padding: 0 }}
                    >
                      Orbit →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Correlated News Reporting ───────────────────────────────── */}
          {relatedNews.length > 0 && (
            <div className="eos-card">
              <div className="eos-card-header">
                <span>Correlated Field Reporting</span>
                <span style={{ color: 'var(--eos-cyan)', fontSize: 9.5 }}>GDELT</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {relatedNews.map((news: any) => (
                  <a
                    key={news.id}
                    href={news.url}
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
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--eos-text-primary)', lineHeight: 1.3, marginBottom: 2 }}>
                      {news.title}
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--eos-text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{news.publisher}</span>
                      <span>Source Link ↗</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
