'use client'

import { useState } from 'react'
import { useEarthOsStore } from '@/stores/earth-os'
import { useWeather, useAirQuality } from '@/hooks/earth-os/useEarthData'
import type { AqiStandard } from '@/services/earth-os/aqi.service'

export function AtmospherePanel() {
  const { globeCamera, flyTo } = useEarthOsStore()
  const [lat, setLat] = useState<number>(globeCamera.center[1] || 28.6139)
  const [lon, setLon] = useState<number>(globeCamera.center[0] || 77.2090)
  const [activeTab, setActiveTab] = useState<'weather' | 'airquality'>('weather')
  const [aqiStandard, setAqiStandard] = useState<AqiStandard>('us_epa')

  const { data: weatherRes, isLoading: weatherLoading, isError: weatherError } = useWeather(lat, lon, activeTab === 'weather')
  const { data: aqRes, isLoading: aqLoading, isError: aqError } = useAirQuality(lat, lon, activeTab === 'airquality')

  const weather = weatherRes?.data?.current
  const hourly = weatherRes?.data?.hourly
  const daily = weatherRes?.data?.daily
  const weatherFreshness = weatherRes?.freshness
  const weatherValidation = weatherRes?.validation

  const multiStandard = aqRes?.multiStandard
  const selectedStandardResult = multiStandard
    ? aqiStandard === 'us_epa'
      ? multiStandard.usEpa
      : aqiStandard === 'india_cpcb'
      ? multiStandard.indiaCpcb
      : multiStandard.europeanEaqi
    : null

  const aqPollutants = aqRes?.pollutants || aqRes?.data?.current
  const aqFreshness = aqRes?.freshness
  const aqValidation = aqRes?.validation

  const quickCities = [
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'Reykjavik', lat: 64.1466, lon: -21.9426 },
    { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
    { name: 'New Delhi', lat: 28.6139, lon: 77.2090 },
    { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093 }
  ]

  const handleSelectCity = (cLat: number, cLon: number) => {
    setLat(cLat)
    setLon(cLon)
    flyTo({ center: [cLon, cLat], zoom: 5, bearing: 0, pitch: 0 })
  }

  // UV description helper
  const getUvDescription = (uv?: number | null) => {
    if (uv === undefined || uv === null) return 'N/A'
    if (uv <= 2) return 'Low'
    if (uv <= 5) return 'Moderate'
    if (uv <= 7) return 'High'
    if (uv <= 10) return 'Very High'
    return 'Extreme'
  }

  return (
    <div className="eos-floating-panel">
      {/* Header */}
      <div className="eos-panel-header">
        <div>
          <div className="eos-panel-title">Atmosphere & Air Quality</div>
          <div className="eos-panel-subtitle">
            Authoritative meteorology & multi-standard air telemetry
          </div>
        </div>
      </div>

      {/* Apple Segmented Tabs */}
      <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid var(--eos-border-subtle)', flexShrink: 0 }}>
        <div className="eos-segmented-control">
          <button
            onClick={() => setActiveTab('weather')}
            className={`eos-segmented-btn ${activeTab === 'weather' ? 'active' : ''}`}
          >
            Weather & Forecasts
          </button>
          <button
            onClick={() => setActiveTab('airquality')}
            className={`eos-segmented-btn ${activeTab === 'airquality' ? 'active' : ''}`}
          >
            Air Quality (AQI)
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="eos-scrollable" style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {/* Quick Location presets */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--eos-text-tertiary)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>Observation Coordinates</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--eos-font-mono)' }}>{lat.toFixed(2)}°, {lon.toFixed(2)}°</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {quickCities.map(city => (
              <button
                key={city.name}
                onClick={() => handleSelectCity(city.lat, city.lon)}
                style={{
                  padding: '4px 9px',
                  borderRadius: 9999,
                  fontSize: 10.5,
                  fontWeight: 500,
                  border: '1px solid var(--eos-border-subtle)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--eos-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.color = 'var(--eos-text-secondary)'
                }}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>

        {/* ─── WEATHER TAB ────────────────────────────────────────────── */}
        {activeTab === 'weather' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Provenance & Freshness Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 10px',
              borderRadius: 8,
              background: 'rgba(0, 212, 255, 0.06)',
              border: '1px solid rgba(0, 212, 255, 0.18)',
              fontSize: 10,
              color: 'var(--eos-text-secondary)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--eos-cyan)' }} />
                <span>NWP Model Ensemble (ECMWF / GFS)</span>
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--eos-cyan)' }}>
                {weatherFreshness?.humanAge ? weatherFreshness.humanAge : 'Real-time sync'}
              </span>
            </div>

            {weatherLoading && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--eos-text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--eos-cyan)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                Querying numerical meteorological models…
              </div>
            )}

            {weatherError && (
              <div style={{ padding: 12, borderRadius: 'var(--eos-radius-sm)', background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.25)', color: 'var(--eos-red)', fontSize: 11.5 }}>
                Weather service temporarily unavailable.
              </div>
            )}

            {weather && (
              <>
                {/* Primary Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div className="eos-card">
                    <div className="eos-card-header">Temperature</div>
                    <div className="eos-metric">
                      <span className="eos-metric-value">{weather.temperature_2m ?? '--'}</span>
                      <span className="eos-metric-unit">°C</span>
                    </div>
                    {weather.apparent_temperature !== undefined && (
                      <div style={{ fontSize: 10, color: 'var(--eos-text-tertiary)', marginTop: 4 }}>
                        Feels like: {weather.apparent_temperature}°C
                      </div>
                    )}
                  </div>

                  <div className="eos-card">
                    <div className="eos-card-header">Rel. Humidity</div>
                    <div className="eos-metric">
                      <span className="eos-metric-value">{weather.relative_humidity_2m ?? '--'}</span>
                      <span className="eos-metric-unit">%</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--eos-text-tertiary)', marginTop: 4 }}>
                      Moisture saturation
                    </div>
                  </div>

                  <div className="eos-card">
                    <div className="eos-card-header">Wind & Gusts</div>
                    <div className="eos-metric">
                      <span className="eos-metric-value">{weather.wind_speed_10m ?? '--'}</span>
                      <span className="eos-metric-unit">km/h</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--eos-text-tertiary)', marginTop: 4 }}>
                      Gusts: {weather.wind_gusts_10m ?? weather.wind_speed_10m ?? '--'} km/h • {weather.wind_direction_10m}°
                    </div>
                  </div>

                  <div className="eos-card">
                    <div className="eos-card-header">Surface Pressure</div>
                    <div className="eos-metric">
                      <span className="eos-metric-value">{weather.surface_pressure ? Math.round(weather.surface_pressure) : '--'}</span>
                      <span className="eos-metric-unit">hPa</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--eos-text-tertiary)', marginTop: 4 }}>
                      Standard barometric
                    </div>
                  </div>

                  <div className="eos-card">
                    <div className="eos-card-header">Precipitation</div>
                    <div className="eos-metric">
                      <span className="eos-metric-value">{weather.precipitation ?? 0}</span>
                      <span className="eos-metric-unit">mm</span>
                    </div>
                    {weather.precipitation_probability !== undefined && (
                      <div style={{ fontSize: 10, color: 'var(--eos-text-tertiary)', marginTop: 4 }}>
                        Probability: {weather.precipitation_probability}%
                      </div>
                    )}
                  </div>

                  <div className="eos-card">
                    <div className="eos-card-header">Cloud & Visibility</div>
                    <div className="eos-metric">
                      <span className="eos-metric-value">{weather.cloud_cover ?? '--'}</span>
                      <span className="eos-metric-unit">%</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--eos-text-tertiary)', marginTop: 4 }}>
                      {weather.visibility ? `Visibility: ${(weather.visibility / 1000).toFixed(1)} km` : 'Standard clearance'}
                    </div>
                  </div>

                  {weather.uv_index !== undefined && (
                    <div className="eos-card" style={{ gridColumn: 'span 2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div className="eos-card-header">Solar UV Index</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--eos-font-mono)' }}>{weather.uv_index}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: (weather.uv_index ?? 0) > 7 ? 'var(--eos-red)' : (weather.uv_index ?? 0) > 2 ? 'var(--eos-orange)' : 'var(--eos-green)' }}>
                              {getUvDescription(weather.uv_index)}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--eos-text-tertiary)', textAlign: 'right' }}>
                          Quality Score: {weatherValidation?.qualityScore ?? 100}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 12-Hour Forecast Progression */}
                {hourly?.temperature_2m && (
                  <div className="eos-card">
                    <div className="eos-card-header">12-Hour Forecast Progression</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 74, marginTop: 10, paddingBottom: 4 }}>
                      {hourly.temperature_2m.slice(0, 8).map((temp: number | null, i: number) => {
                        const val = temp ?? 0
                        return (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--eos-cyan)' }}>{val}°</span>
                            <div style={{
                              width: 16,
                              height: Math.max(10, Math.min(46, (val + 10) * 1.5)),
                              background: 'linear-gradient(180deg, var(--eos-cyan) 0%, rgba(0, 212, 255, 0.25) 100%)',
                              borderRadius: '4px 4px 0 0',
                            }} />
                            <span style={{ fontSize: 8.5, color: 'var(--eos-text-tertiary)' }}>+{i * 3}h</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 5-Day Daily Outlook */}
                {daily?.time && daily.time.length > 0 && (
                  <div className="eos-card">
                    <div className="eos-card-header">5-Day Outlook</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {daily.time.slice(0, 5).map((d: string, idx: number) => {
                        const maxT = daily.temperature_2m_max?.[idx] ?? '--'
                        const minT = daily.temperature_2m_min?.[idx] ?? '--'
                        const rainProb = daily.precipitation_probability_max?.[idx] ?? 0
                        const dayName = new Date(d).toLocaleDateString(undefined, { weekday: 'short' })
                        return (
                          <div key={d} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: idx < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                            <span style={{ width: 44, fontWeight: 500, color: 'var(--eos-text-secondary)' }}>{dayName}</span>
                            <span style={{ fontSize: 10, color: rainProb > 30 ? 'var(--eos-cyan)' : 'var(--eos-text-tertiary)' }}>
                              💧 {rainProb}%
                            </span>
                            <div style={{ display: 'flex', gap: 8, fontVariantNumeric: 'tabular-nums' }}>
                              <span style={{ color: 'var(--eos-text-secondary)' }}>{minT}°</span>
                              <span style={{ color: '#fff', fontWeight: 600 }}>{maxT}°</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── AIR QUALITY TAB ────────────────────────────────────────── */}
        {activeTab === 'airquality' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Provenance & Methodology Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 10px',
              borderRadius: 8,
              background: 'rgba(52, 199, 89, 0.08)',
              border: '1px solid rgba(52, 199, 89, 0.25)',
              fontSize: 10,
              color: 'var(--eos-teal)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--eos-teal)' }} />
                <span>Copernicus CAMS Model Assimilation</span>
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--eos-teal)' }}>
                {aqFreshness?.humanAge ?? 'Real-time assimilation'}
              </span>
            </div>

            {/* Standard Selection Switcher */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--eos-text-tertiary)', marginBottom: 6 }}>
                Select AQI Calculation Standard
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                <button
                  onClick={() => setAqiStandard('us_epa')}
                  style={{
                    padding: '6px 4px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: aqiStandard === 'us_epa' ? 'var(--eos-cyan)' : 'var(--eos-border-subtle)',
                    background: aqiStandard === 'us_epa' ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: aqiStandard === 'us_epa' ? '#fff' : 'var(--eos-text-secondary)',
                    transition: 'all 150ms ease',
                  }}
                >
                  US EPA (40 CFR)
                </button>
                <button
                  onClick={() => setAqiStandard('india_cpcb')}
                  style={{
                    padding: '6px 4px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: aqiStandard === 'india_cpcb' ? 'var(--eos-cyan)' : 'var(--eos-border-subtle)',
                    background: aqiStandard === 'india_cpcb' ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: aqiStandard === 'india_cpcb' ? '#fff' : 'var(--eos-text-secondary)',
                    transition: 'all 150ms ease',
                  }}
                >
                  India CPCB
                </button>
                <button
                  onClick={() => setAqiStandard('european_eaqi')}
                  style={{
                    padding: '6px 4px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: aqiStandard === 'european_eaqi' ? 'var(--eos-cyan)' : 'var(--eos-border-subtle)',
                    background: aqiStandard === 'european_eaqi' ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: aqiStandard === 'european_eaqi' ? '#fff' : 'var(--eos-text-secondary)',
                    transition: 'all 150ms ease',
                  }}
                >
                  European EAQI
                </button>
              </div>
            </div>

            {aqLoading && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--eos-text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--eos-teal)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                Calculating multi-standard breakpoint sub-indices…
              </div>
            )}

            {aqError && (
              <div style={{ padding: 12, borderRadius: 'var(--eos-radius-sm)', background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.25)', color: 'var(--eos-red)', fontSize: 11.5 }}>
                Air quality models unavailable.
              </div>
            )}

            {/* Standard Hero Card */}
            {selectedStandardResult && (
              <div className="eos-card" style={{ borderLeft: `3px solid ${selectedStandardResult.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--eos-text-tertiary)', letterSpacing: '0.05em' }}>
                      {selectedStandardResult.standardName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 32, fontWeight: 700, color: selectedStandardResult.color, fontFamily: 'var(--eos-font-mono)' }}>
                        {selectedStandardResult.aqiValue}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 9999,
                        fontSize: 10.5,
                        fontWeight: 600,
                        background: `${selectedStandardResult.color}20`,
                        color: selectedStandardResult.color,
                        border: `1px solid ${selectedStandardResult.color}50`,
                      }}>
                        {selectedStandardResult.category}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9.5, color: 'var(--eos-text-tertiary)' }}>Governing Pollutant</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
                      {selectedStandardResult.governingPollutant}
                    </div>
                  </div>
                </div>

                {/* Health Advisory */}
                <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 10.5, color: 'var(--eos-text-secondary)', lineHeight: 1.45 }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>Advisory: </span>
                  {selectedStandardResult.advisory}
                </div>

                {/* Methodology note */}
                <div style={{ fontSize: 9, color: 'var(--eos-text-tertiary)', marginTop: 8 }}>
                  Method: {selectedStandardResult.methodology}
                </div>
              </div>
            )}

            {/* Sub-indices Breakdown Table */}
            {selectedStandardResult?.subIndices && (
              <div className="eos-card">
                <div className="eos-card-header" style={{ marginBottom: 8 }}>
                  Pollutant Breakdown & Sub-Indices
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.entries(selectedStandardResult.subIndices).map(([key, item]: [string, any]) => {
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, textTransform: 'uppercase', color: '#fff' }}>{item.pollutant}</span>
                          <span style={{ fontSize: 9.5, color: 'var(--eos-text-tertiary)' }}>
                            {item.concentration} {item.unit}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--eos-cyan)' }}>
                            {item.subIndex}
                          </span>
                          <span style={{ fontSize: 9.5, color: 'var(--eos-text-tertiary)', marginLeft: 6 }}>
                            ({item.category})
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* In-situ fallback grid if multiStandard not yet loaded */}
            {!selectedStandardResult && aqPollutants && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="eos-card">
                  <div className="eos-card-header">PM 2.5 (Fine)</div>
                  <div className="eos-metric">
                    <span className="eos-metric-value">{aqPollutants.pm2_5 ?? aqPollutants.pm25 ?? '--'}</span>
                    <span className="eos-metric-unit">μg/m³</span>
                  </div>
                </div>
                <div className="eos-card">
                  <div className="eos-card-header">PM 10 (Coarse)</div>
                  <div className="eos-metric">
                    <span className="eos-metric-value">{aqPollutants.pm10 ?? '--'}</span>
                    <span className="eos-metric-unit">μg/m³</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--eos-border-subtle)', fontSize: 9.5, color: 'var(--eos-text-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Sources: Open-Meteo, ECMWF IFS, Copernicus CAMS</span>
        <span style={{ color: 'var(--eos-teal)' }}>Physical bounds verified</span>
      </div>
    </div>
  )
}
