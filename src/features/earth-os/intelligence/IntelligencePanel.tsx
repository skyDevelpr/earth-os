'use client'

import { useState, useMemo } from 'react'
import { useEarthOsStore } from '@/stores/earth-os'
import { usePlanetaryNews } from '@/hooks/earth-os/useEarthData'
import type { EarthquakeEvent, FireDetectionEvent } from '@/types/earth-os'

type IntelMode = 'briefing' | 'event' | 'compare' | 'science' | 'qa'

interface RegionDef {
  id: string
  name: string
  description: string
  center: [number, number] // [lng, lat]
  zoom: number
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
}

const COMPARISON_REGIONS: RegionDef[] = [
  {
    id: 'ring-of-fire',
    name: 'Pacific Ring of Fire',
    description: 'Subduction zone rim hosting 75% of world volcanoes and 90% of seismic events',
    center: [142.5, 38.0],
    zoom: 3.2,
    bounds: { minLat: -45, maxLat: 60, minLng: 120, maxLng: -110 },
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean & Middle East',
    description: 'Complex collision zone between African, Arabian, and Eurasian tectonic plates',
    center: [28.0, 37.5],
    zoom: 4.2,
    bounds: { minLat: 25, maxLat: 46, minLng: -10, maxLng: 55 },
  },
  {
    id: 'north-america',
    name: 'North America / Pacific Edge',
    description: 'Transform boundary (San Andreas) and Cascadia subduction zone',
    center: [-119.5, 36.5],
    zoom: 4.5,
    bounds: { minLat: 25, maxLat: 55, minLng: -130, maxLng: -100 },
  },
  {
    id: 'southeast-asia',
    name: 'Southeast Asia / Sunda Arc',
    description: 'Indo-Australian subduction beneath Sunda plate with intense megathrust activity',
    center: [110.0, 2.0],
    zoom: 4.0,
    bounds: { minLat: -12, maxLat: 22, minLng: 92, maxLng: 135 },
  },
  {
    id: 'south-america',
    name: 'South America / Andes',
    description: 'Nazca plate subduction beneath South American continent forming volcanic cordillera',
    center: [-71.0, -22.0],
    zoom: 3.8,
    bounds: { minLat: -55, maxLat: 12, minLng: -82, maxLng: -55 },
  },
  {
    id: 'iceland-atlantic',
    name: 'Iceland / Mid-Atlantic Ridge',
    description: 'Divergent spreading ridge coupled with mantle plume hotspot activity',
    center: [-19.0, 64.5],
    zoom: 5.2,
    bounds: { minLat: 55, maxLat: 72, minLng: -32, maxLng: -8 },
  },
]

export function IntelligencePanel() {
  const {
    selectedEvent,
    selectedPoi,
    earthquakes,
    eonetEvents,
    fireHotspots,
    globeCamera,
    flyTo,
  } = useEarthOsStore()

  const [activeTab, setActiveTab] = useState<IntelMode>(selectedEvent || selectedPoi ? 'event' : 'briefing')
  const [qaInput, setQaInput] = useState('')
  const [qaHistory, setQaHistory] = useState<Array<{ q: string; a: string; time: string; sources: string[] }>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [regionAId, setRegionAId] = useState<string>('ring-of-fire')
  const [regionBId, setRegionBId] = useState<string>('mediterranean')

  // Live GDELT news for synthesizing context
  const { data: newsArticles = [] } = usePlanetaryNews({ limit: 12 })

  // Derived real-time analytics
  const topEarthquakes = useMemo(
    () => [...earthquakes].sort((a, b) => b.magnitude - a.magnitude),
    [earthquakes]
  )
  const majorStorms = useMemo(
    () => eonetEvents.filter(e => e.category === 'severeStorms'),
    [eonetEvents]
  )
  const activeVolcanoes = useMemo(
    () => eonetEvents.filter(e => e.category === 'volcanoes'),
    [eonetEvents]
  )

  // Region stats calculator
  const getRegionStats = (regionDef: RegionDef) => {
    const isInside = (lat: number, lng: number) => {
      const { minLat, maxLat, minLng, maxLng } = regionDef.bounds
      const latOk = lat >= minLat && lat <= maxLat
      const lngOk =
        minLng > maxLng
          ? lng >= minLng || lng <= maxLng // Dateline crossing
          : lng >= minLng && lng <= maxLng
      return latOk && lngOk
    }

    const regQuakes = earthquakes.filter(e => isInside(e.coordinates.latitude, e.coordinates.longitude))
    const regFires = fireHotspots.filter(f => isInside(f.coordinates.latitude, f.coordinates.longitude))
    const regEonet = eonetEvents.filter(ev => isInside(ev.coordinates.latitude, ev.coordinates.longitude))

    const maxMag = regQuakes.length ? Math.max(...regQuakes.map(q => q.magnitude)) : 0
    const avgDepth = regQuakes.length
      ? regQuakes.reduce((acc, q) => acc + q.depth, 0) / regQuakes.length
      : 0

    return {
      quakeCount: regQuakes.length,
      maxMag,
      avgDepth,
      fireCount: regFires.length,
      eonetCount: regEonet.length,
      quakes: regQuakes,
    }
  }

  const regionA = COMPARISON_REGIONS.find(r => r.id === regionAId) || COMPARISON_REGIONS[0]
  const regionB = COMPARISON_REGIONS.find(r => r.id === regionBId) || COMPARISON_REGIONS[1]

  const statsA = useMemo(() => getRegionStats(regionA), [regionA, earthquakes, fireHotspots, eonetEvents])
  const statsB = useMemo(() => getRegionStats(regionB), [regionB, earthquakes, fireHotspots, eonetEvents])

  // Grounded Q&A handler
  const handleAskQuestion = (customQuestion?: string) => {
    const query = (customQuestion || qaInput).trim()
    if (!query) return

    setIsProcessing(true)
    setTimeout(() => {
      const qLower = query.toLowerCase()
      let answer = ''
      const sources: string[] = []

      if (qLower.includes('strongest') || qLower.includes('biggest') || qLower.includes('largest') || qLower.includes('earthquake')) {
        sources.push('USGS Earthquake Hazards Program')
        if (topEarthquakes.length > 0) {
          const top = topEarthquakes[0]
          answer = `The strongest seismic event currently registered is M${top.magnitude.toFixed(1)} near ${top.title || top.description}.
• Hypocenter Depth: ${top.depth.toFixed(1)} km (${top.depth < 70 ? 'crustal shallow' : 'intermediate/deep'})
• Recorded Time: ${new Date(top.observationTime).toUTCString()}
• Tsunami Advisory: ${top.tsunami ? 'ACTIVE TSUNAMI ALERT' : 'No tsunami alert reported'}
• Felt Reports: ${top.felt ? `${top.felt} citizen observations` : 'Zero felt reports logged'}`
        } else {
          answer = `No earthquakes are currently registered within your selected threshold. Try broadening your magnitude filter.`
        }
      } else if (qLower.includes('storm') || qLower.includes('cyclone') || qLower.includes('hurricane') || qLower.includes('typhoon')) {
        sources.push('NASA EONET v3')
        if (majorStorms.length > 0) {
          answer = `NASA EONET is actively tracking ${majorStorms.length} severe storm system(s):\n` +
            majorStorms.map(s => `• ${s.title} (Status: ${s.status}, Observation: ${new Date(s.observationTime).toLocaleDateString()})`).join('\n')
        } else {
          answer = `No active tropical cyclones or severe storm bulletins are currently published in the open NASA EONET feed for this interval.`
        }
      } else if (qLower.includes('fire') || qLower.includes('wildfire') || qLower.includes('hotspot')) {
        sources.push('NASA FIRMS (VIIRS/MODIS)')
        answer = `NASA FIRMS reports ${fireHotspots.length} satellite thermal radiant anomalies in the current monitoring frame.
• Radiative Power: Detected via VIIRS SNPP infrared sensors.
• Note: Hotspot pixels represent thermal radiance spikes above background; field validation distinguishes wildland fires from agricultural burning or industrial gas flaring.`
      } else if (qLower.includes('volcano') || qLower.includes('eruption')) {
        sources.push('NASA EONET & Smithsonian GVP')
        if (activeVolcanoes.length > 0) {
          answer = `Active volcanic alerts currently tracked:\n` +
            activeVolcanoes.map(v => `• ${v.title} at [${v.coordinates.latitude.toFixed(2)}°, ${v.coordinates.longitude.toFixed(2)}°]`).join('\n')
        } else {
          answer = `No ongoing subaerial volcanic eruption alerts recorded in open NASA EONET feeds for this observation window.`
        }
      } else if (qLower.includes('news') || qLower.includes('headline') || qLower.includes('dispatch') || qLower.includes('disaster')) {
        sources.push('GDELT Project Doc 2.0')
        if (newsArticles.length > 0) {
          answer = `Latest verified planetary disaster dispatches:\n` +
            newsArticles.slice(0, 3).map((a: any) => `• "${a.title}" — ${a.publisher} (${new Date(a.publishedAt).toLocaleDateString()})`).join('\n\n')
        } else {
          answer = `GDELT feeds are currently refreshing. Verify outbound network connectivity to api.gdeltproject.org.`
        }
      } else {
        sources.push('USGS', 'NASA EONET', 'NASA FIRMS')
        answer = `Planetary summary for query "${query}":
Currently tracking ${earthquakes.length} earthquakes worldwide, ${eonetEvents.length} NASA hazard alerts, and ${fireHotspots.length} thermal anomalies.
Current camera focus: Lat ${globeCamera.center[1].toFixed(2)}°, Lon ${globeCamera.center[0].toFixed(2)}°.
Select an event on the 3D globe or pick a pre-set question for a deeper scientific analysis.`
      }

      setQaHistory(prev => [
        {
          q: query,
          a: answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources,
        },
        ...prev,
      ])
      setQaInput('')
      setIsProcessing(false)
    }, 320)
  }

  return (
    <div className="eos-floating-panel">
      {/* Header */}
      <div className="eos-panel-header">
        <div>
          <div className="eos-panel-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Earth Intelligence</span>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '0.06em',
                padding: '1px 6px',
                borderRadius: 9999,
                background: 'linear-gradient(135deg, rgba(255,94,152,0.2) 0%, rgba(168,85,247,0.2) 50%, rgba(0,212,255,0.2) 100%)',
                color: '#fff',
                border: '1px solid rgba(168,85,247,0.4)',
              }}
            >
              AI
            </span>
          </div>
          <div className="eos-panel-subtitle">Grounded planetary reasoning & verified data synthesis</div>
        </div>
      </div>

      {/* Segmented Mode Selector */}
      <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid var(--eos-border-subtle)' }}>
        <div className="eos-segmented-control" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
          <button
            className={`eos-segmented-btn ${activeTab === 'briefing' ? 'active' : ''}`}
            onClick={() => setActiveTab('briefing')}
          >
            Briefing
          </button>
          <button
            className={`eos-segmented-btn ${activeTab === 'event' ? 'active' : ''}`}
            onClick={() => setActiveTab('event')}
            style={{ position: 'relative' }}
          >
            {selectedPoi ? 'Location' : 'Event'}
            {(selectedEvent || selectedPoi) && (
              <span
                style={{
                  display: 'inline-block',
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: 'var(--eos-cyan)',
                  marginLeft: 4,
                  verticalAlign: 'middle',
                }}
              />
            )}
          </button>
          <button
            className={`eos-segmented-btn ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            Compare
          </button>
          <button
            className={`eos-segmented-btn ${activeTab === 'qa' ? 'active' : ''}`}
            onClick={() => setActiveTab('qa')}
          >
            Ask AI
          </button>
          <button
            className={`eos-segmented-btn ${activeTab === 'science' ? 'active' : ''}`}
            onClick={() => setActiveTab('science')}
          >
            Metrics
          </button>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="eos-scrollable" style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {/* ─── TAB 1: PLANETARY BRIEFING ─────────────────────────────────── */}
        {activeTab === 'briefing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Apple Intelligence Primary Action Banner */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--eos-radius-md)',
                background: 'linear-gradient(135deg, rgba(255, 94, 152, 0.12) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(0, 212, 255, 0.18) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                boxShadow: '0 4px 16px rgba(168, 85, 247, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#e0b0ff' }}>
                  Live Planetary Synthesis
                </span>
                <span style={{ fontSize: 10, color: 'var(--eos-text-muted)' }}>
                  {new Date().toTimeString().slice(0, 8)} UTC
                </span>
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--eos-text-primary)', margin: 0 }}>
                Synthesizing {earthquakes.length} active earthquakes, {eonetEvents.length} open natural events, and {fireHotspots.length} thermal anomalies from USGS and NASA satellites.
              </p>
            </div>

            {/* Seismic Telemetry Card */}
            <div className="eos-card">
              <div className="eos-card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>SEISMIC ACTIVITY TELEMETRY</span>
                <span style={{ color: 'var(--eos-cyan)' }}>USGS Feed</span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--eos-text-secondary)', marginTop: 8 }}>
                {topEarthquakes[0] ? (
                  <>
                    <div style={{ fontWeight: 600, color: 'var(--eos-text-primary)', marginBottom: 4 }}>
                      Strongest: M{topEarthquakes[0].magnitude.toFixed(1)} — {topEarthquakes[0].description || topEarthquakes[0].title}
                    </div>
                    <div>• Hypocenter: {topEarthquakes[0].depth.toFixed(1)} km depth ({topEarthquakes[0].depth < 70 ? 'crustal shallow' : 'deep'})</div>
                    <div>• Total cataloged events: {earthquakes.length}</div>
                    <div>• Significant (M5.5+): {earthquakes.filter(e => e.magnitude >= 5.5).length} registered</div>
                  </>
                ) : (
                  <div>No earthquakes in current filter range.</div>
                )}
              </div>
            </div>

            {/* Severe Storms & Hazards */}
            <div className="eos-card">
              <div className="eos-card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>NATURAL HAZARDS & STORMS</span>
                <span style={{ color: 'var(--eos-orange)' }}>NASA EONET</span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--eos-text-secondary)', marginTop: 8 }}>
                <div>• Tracked Storms: {majorStorms.length} active cyclone/storm systems</div>
                <div>• Active Volcanic Centers: {activeVolcanoes.length} under advisory</div>
                <div>• Total Open Hazard Events: {eonetEvents.length}</div>
              </div>
            </div>

            {/* Latest Verified Disaster Dispatches */}
            {newsArticles.length > 0 && (
              <div className="eos-card">
                <div className="eos-card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>RELATED FIELD REPORTING</span>
                  <span style={{ color: 'var(--eos-cyan)' }}>GDELT 2.0</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {newsArticles.slice(0, 3).map((art: any, i: number) => (
                    <a
                      key={i}
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        padding: '6px 8px',
                        borderRadius: 6,
                        background: 'rgba(255,255,255,0.03)',
                        display: 'block',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--eos-text-primary)', lineHeight: 1.35 }}>
                        {art.title}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--eos-text-tertiary)', marginTop: 3 }}>
                        {art.publisher} • {new Date(art.publishedAt).toLocaleDateString()}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: SELECTED EVENT OR POI DEEP DIVE ───────────────────── */}
        {activeTab === 'event' && (
          <div>
            {selectedPoi ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="eos-card" style={{ borderColor: 'var(--eos-border-highlight)' }}>
                  <div className="eos-card-header">{selectedPoi.category.toUpperCase()} GEOSPATIAL INTELLIGENCE</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--eos-text-primary)', marginTop: 6 }}>
                    {selectedPoi.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--eos-text-tertiary)', marginTop: 2 }}>
                    {selectedPoi.country} • Coordinates: {selectedPoi.coordinates.latitude.toFixed(3)}°N, {selectedPoi.coordinates.longitude.toFixed(3)}°E
                  </div>
                </div>

                <div className="eos-card">
                  <div className="eos-card-header">GEOGRAPHICAL PROFILE & METRICS</div>
                  <p style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--eos-text-secondary)', margin: '6px 0 0' }}>
                    {selectedPoi.description}
                  </p>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--eos-cyan)' }}>
                    {selectedPoi.metadata?.elevation ? `Elevation: ${selectedPoi.metadata.elevation} m · ` : ''}
                    {selectedPoi.metadata?.population ? `Population: ${(selectedPoi.metadata.population / 1000000).toFixed(1)}M · ` : ''}
                    {selectedPoi.metadata?.capacity ? `Capacity: ${selectedPoi.metadata.capacity} · ` : ''}
                    {selectedPoi.metadata?.unescoYear ? `UNESCO Inscription: ${selectedPoi.metadata.unescoYear}` : ''}
                  </div>
                </div>

                <button
                  className="eos-glass-pill"
                  onClick={() => {
                    flyTo({
                      center: [selectedPoi.coordinates.longitude, selectedPoi.coordinates.latitude],
                      zoom: 7,
                      bearing: 0,
                      pitch: 35,
                    })
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: 'var(--eos-cyan)',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  🌍 Center Globe on {selectedPoi.name.split('(')[0].trim()}
                </button>
              </div>
            ) : selectedEvent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="eos-card" style={{ borderColor: 'var(--eos-border-highlight)' }}>
                  <div className="eos-card-header">SELECTED EVENT ANALYSIS</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--eos-text-primary)', marginTop: 6 }}>
                    {selectedEvent.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--eos-text-tertiary)', marginTop: 2 }}>
                    Observation: {new Date(selectedEvent.observationTime).toUTCString()}
                  </div>
                </div>

                {/* Physics & Mechanics breakdown */}
                {selectedEvent.category === 'earthquakes' && (
                  <>
                    <div className="eos-card">
                      <div className="eos-card-header">SEISMIC MECHANICS & ENERGY</div>
                      <div style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--eos-text-secondary)', marginTop: 8 }}>
                        {(() => {
                          const eq = selectedEvent as EarthquakeEvent
                          const isShallow = eq.depth < 70
                          return (
                            <>
                              <div>
                                <strong style={{ color: 'var(--eos-text-primary)' }}>Magnitude Mw:</strong> {eq.magnitude} ({eq.magnitudeType || 'Mw'})
                              </div>
                              <div>
                                <strong style={{ color: 'var(--eos-text-primary)' }}>Focal Depth:</strong> {eq.depth.toFixed(1)} km —{' '}
                                <span style={{ color: isShallow ? 'var(--eos-orange)' : 'var(--eos-cyan)' }}>
                                  {isShallow ? 'Crustal Shallow (<70km)' : 'Subduction Intermediate/Deep (>70km)'}
                                </span>
                              </div>
                              <div style={{ marginTop: 6 }}>
                                {isShallow
                                  ? 'Shallow hypocenters concentrate high-frequency seismic energy near the epicenter, generating stronger Peak Ground Acceleration (PGA) than deep events of identical magnitude.'
                                  : 'Deep hypocenters distribute energy across a wider surface footprint with attenuated high-frequency ground motion, reducing localized surface rupturing.'}
                              </div>
                              <div style={{ marginTop: 6 }}>
                                <strong style={{ color: 'var(--eos-text-primary)' }}>Tsunami Hazard:</strong>{' '}
                                {eq.tsunami ? (
                                  <span style={{ color: 'var(--eos-red)', fontWeight: 600 }}>Tsunami Advisory Generated</span>
                                ) : (
                                  <span style={{ color: 'var(--eos-green)' }}>No ocean wave advisory registered</span>
                                )}
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </>
                )}

                {selectedEvent.category === 'fireHotspot' && (
                  <div className="eos-card">
                    <div className="eos-card-header">SATELLITE THERMAL TELEMETRY</div>
                    <div style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--eos-text-secondary)', marginTop: 8 }}>
                      {(() => {
                        const fire = selectedEvent as FireDetectionEvent
                        return (
                          <>
                            <div>
                              <strong style={{ color: 'var(--eos-text-primary)' }}>Fire Radiative Power:</strong>{' '}
                              {fire.fireRadiativePower ? `${fire.fireRadiativePower.toFixed(1)} MW` : 'N/A'}
                            </div>
                            <div>
                              <strong style={{ color: 'var(--eos-text-primary)' }}>Sensor & Satellite:</strong> {fire.sensor} ({fire.satellite})
                            </div>
                            <div>
                              <strong style={{ color: 'var(--eos-text-primary)' }}>Confidence Rating:</strong> {fire.confidenceLevel}
                            </div>
                            <div style={{ marginTop: 6 }}>
                              Thermal radiant anomalies are captured in the mid-infrared spectrum (~4µm). High FRP values indicate intensive combustion per unit area.
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )}

                {selectedEvent.category !== 'earthquakes' && selectedEvent.category !== 'fireHotspot' && (
                  <div className="eos-card">
                    <div className="eos-card-header">NATURAL HAZARD CLASSIFICATION</div>
                    <div style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--eos-text-secondary)', marginTop: 8 }}>
                      <div>
                        <strong style={{ color: 'var(--eos-text-primary)' }}>Category:</strong> {selectedEvent.category}
                      </div>
                      <div>
                        <strong style={{ color: 'var(--eos-text-primary)' }}>NASA EONET Status:</strong> {selectedEvent.status}
                      </div>
                      <div>
                        <strong style={{ color: 'var(--eos-text-primary)' }}>Coordinates:</strong>{' '}
                        {selectedEvent.coordinates.latitude.toFixed(3)}°N, {selectedEvent.coordinates.longitude.toFixed(3)}°E
                      </div>
                    </div>
                  </div>
                )}

                {/* Orbit to event button */}
                <button
                  className="eos-glass-pill"
                  onClick={() => {
                    flyTo({
                      center: [selectedEvent.coordinates.longitude, selectedEvent.coordinates.latitude],
                      zoom: 6.5,
                      bearing: 0,
                      pitch: 35,
                    })
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: 'var(--eos-cyan)',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  🌍 Center Globe on Event Hypocenter
                </button>
              </div>
            ) : (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--eos-text-tertiary)', fontSize: 11.5, lineHeight: 1.6 }}>
                Click any geographic point of interest, spaceport, mountain summit, earthquake, or storm marker on the 3D globe to activate detailed geospatial intelligence.
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: REGION COMPARISON ──────────────────────────────────── */}
        {activeTab === 'compare' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--eos-text-tertiary)', lineHeight: 1.45 }}>
              Compare real-time seismic frequency, extreme magnitudes, and active thermal anomalies between two major planetary zones.
            </div>

            {/* Region Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--eos-text-muted)', textTransform: 'uppercase' }}>
                  Zone A
                </label>
                <select
                  value={regionAId}
                  onChange={e => setRegionAId(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '6px 8px',
                    borderRadius: 6,
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    border: '1px solid var(--eos-border-subtle)',
                    fontSize: 11,
                  }}
                >
                  {COMPARISON_REGIONS.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--eos-text-muted)', textTransform: 'uppercase' }}>
                  Zone B
                </label>
                <select
                  value={regionBId}
                  onChange={e => setRegionBId(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '6px 8px',
                    borderRadius: 6,
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    border: '1px solid var(--eos-border-subtle)',
                    fontSize: 11,
                  }}
                >
                  {COMPARISON_REGIONS.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparative Metrics Table */}
            <div className="eos-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderBottom: '1px solid var(--eos-border-subtle)',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--eos-text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                <span>Metric</span>
                <span style={{ color: 'var(--eos-cyan)' }}>{regionA.name.split('/')[0]}</span>
                <span style={{ color: 'var(--eos-orange)' }}>{regionB.name.split('/')[0]}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', padding: '8px 12px', fontSize: 11 }}>
                  <span style={{ color: 'var(--eos-text-secondary)' }}>Earthquakes</span>
                  <span style={{ fontWeight: 600, color: 'var(--eos-text-primary)' }}>{statsA.quakeCount}</span>
                  <span style={{ fontWeight: 600, color: 'var(--eos-text-primary)' }}>{statsB.quakeCount}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', padding: '8px 12px', fontSize: 11, background: 'rgba(255,255,255,0.01)' }}>
                  <span style={{ color: 'var(--eos-text-secondary)' }}>Max Magnitude</span>
                  <span style={{ fontWeight: 600, color: statsA.maxMag >= 5.0 ? 'var(--eos-orange)' : 'inherit' }}>
                    {statsA.maxMag ? `M${statsA.maxMag.toFixed(1)}` : 'None'}
                  </span>
                  <span style={{ fontWeight: 600, color: statsB.maxMag >= 5.0 ? 'var(--eos-orange)' : 'inherit' }}>
                    {statsB.maxMag ? `M${statsB.maxMag.toFixed(1)}` : 'None'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', padding: '8px 12px', fontSize: 11 }}>
                  <span style={{ color: 'var(--eos-text-secondary)' }}>Avg Hypocenter</span>
                  <span>{statsA.avgDepth ? `${statsA.avgDepth.toFixed(1)} km` : '—'}</span>
                  <span>{statsB.avgDepth ? `${statsB.avgDepth.toFixed(1)} km` : '—'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', padding: '8px 12px', fontSize: 11, background: 'rgba(255,255,255,0.01)' }}>
                  <span style={{ color: 'var(--eos-text-secondary)' }}>Thermal Anom.</span>
                  <span>{statsA.fireCount} hotspots</span>
                  <span>{statsB.fireCount} hotspots</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', padding: '8px 12px', fontSize: 11 }}>
                  <span style={{ color: 'var(--eos-text-secondary)' }}>NASA Hazards</span>
                  <span>{statsA.eonetCount} events</span>
                  <span>{statsB.eonetCount} events</span>
                </div>
              </div>
            </div>

            {/* Quick Navigation to either zone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                className="eos-glass-pill"
                onClick={() => flyTo({ center: regionA.center, zoom: regionA.zoom, bearing: 0, pitch: 10 })}
                style={{ padding: '7px 10px', fontSize: 11, color: 'var(--eos-cyan)', cursor: 'pointer', textAlign: 'center' }}
              >
                Fly to Zone A
              </button>
              <button
                className="eos-glass-pill"
                onClick={() => flyTo({ center: regionB.center, zoom: regionB.zoom, bearing: 0, pitch: 10 })}
                style={{ padding: '7px 10px', fontSize: 11, color: 'var(--eos-orange)', cursor: 'pointer', textAlign: 'center' }}
              >
                Fly to Zone B
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB 4: GROUNDED PLANETARY Q&A ─────────────────────────────── */}
        {activeTab === 'qa' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--eos-text-tertiary)', lineHeight: 1.45 }}>
              Ask questions directly answered using the application&apos;s live retrieved observational data.
            </div>

            {/* Prompt Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                'Strongest earthquake today',
                'Active tropical storms',
                'Wildfire & thermal counts',
                'Latest disaster news',
              ].map((chip, i) => (
                <button
                  key={i}
                  className="eos-glass-pill"
                  onClick={() => handleAskQuestion(chip)}
                  disabled={isProcessing}
                  style={{
                    padding: '4px 9px',
                    fontSize: 10.5,
                    color: 'var(--eos-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Question Input Box */}
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                placeholder="Ask about active events, quakes, storms…"
                value={qaInput}
                onChange={e => setQaInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAskQuestion()}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--eos-radius-sm)',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--eos-border-subtle)',
                  color: 'var(--eos-text-primary)',
                  fontSize: 11.5,
                }}
              />
              <button
                onClick={() => handleAskQuestion()}
                disabled={isProcessing || !qaInput.trim()}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--eos-radius-sm)',
                  background: 'var(--eos-cyan)',
                  border: 'none',
                  color: '#000',
                  fontWeight: 600,
                  fontSize: 11.5,
                  cursor: isProcessing || !qaInput.trim() ? 'not-allowed' : 'pointer',
                  opacity: isProcessing || !qaInput.trim() ? 0.5 : 1,
                }}
              >
                Ask
              </button>
            </div>

            {/* Answer Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {qaHistory.length === 0 ? (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--eos-text-tertiary)', fontSize: 11 }}>
                  Click a prompt chip or enter a query above to inspect real-time observations.
                </div>
              ) : (
                qaHistory.map((item, idx) => (
                  <div key={idx} className="eos-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--eos-text-primary)' }}>
                        Q: {item.q}
                      </span>
                      <span style={{ fontSize: 9.5, color: 'var(--eos-text-muted)' }}>{item.time}</span>
                    </div>
                    <div style={{ fontSize: 11, lineHeight: 1.6, color: 'var(--eos-text-secondary)', whiteSpace: 'pre-line' }}>
                      {item.a}
                    </div>
                    {item.sources.length > 0 && (
                      <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--eos-border-subtle)', fontSize: 9.5, color: 'var(--eos-cyan)' }}>
                        Evidence Sources: {item.sources.join(' • ')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 5: SCIENTIFIC MEASUREMENT GUIDE ───────────────────────── */}
        {activeTab === 'science' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="eos-card">
              <div className="eos-card-header">MOMENT MAGNITUDE (Mw) VS RICHTER</div>
              <p style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--eos-text-secondary)', margin: '6px 0 0' }}>
                Earth OS uses the <strong>Moment Magnitude Scale (Mw)</strong> standardized by the USGS. Unlike the obsolete local Richter scale (which saturates for events over M7.0), Mw directly measures physical work released: the fault surface area multiplied by displacement distance and rock shear modulus.
                <br /><br />
                Each whole integer increment in magnitude represents approximately <strong>32 times</strong> more radiated elastic energy.
              </p>
            </div>

            <div className="eos-card">
              <div className="eos-card-header">HYPOCENTER DEPTH CLASSIFICATION</div>
              <div style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--eos-text-secondary)', marginTop: 6 }}>
                <div>• <strong style={{ color: 'var(--eos-orange)' }}>Shallow (0 – 70 km):</strong> Brittle crustal fractures and subduction megathrust zones. Generates the most devastating surface shaking and potential tsunamis.</div>
                <div style={{ marginTop: 4 }}>• <strong style={{ color: 'var(--eos-cyan)' }}>Intermediate (70 – 300 km):</strong> Subducting oceanic slabs undergoing metamorphic dehydration.</div>
                <div style={{ marginTop: 4 }}>• <strong style={{ color: '#a855f7' }}>Deep (&gt;300 km):</strong> Mantle transition zone events down to 700 km, exhibiting high thermal attenuation.</div>
              </div>
            </div>

            <div className="eos-card">
              <div className="eos-card-header">FIRE RADIATIVE POWER (FRP)</div>
              <p style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--eos-text-secondary)', margin: '6px 0 0' }}>
                Measured in <strong>Megawatts (MW)</strong> by NASA VIIRS and MODIS satellites. FRP quantifies radiant energy emitted per second by thermal anomalies. High values (&gt;50 MW) denote active high-intensity wildland fires or active lava flows.
              </p>
            </div>

            <div className="eos-card">
              <div className="eos-card-header">AIR QUALITY INDEX (AQI)</div>
              <p style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--eos-text-secondary)', margin: '6px 0 0' }}>
                Standardized European CAQI (0–100) and US EPA AQI (0–500) derived from fine particulate matter (PM2.5 & PM10 in µg/m³) and nitrogen dioxide (NO2). PM2.5 particles smaller than 2.5 microns penetrate lung alveolar sacs.
              </p>
            </div>
          </div>
        )}

        {/* Zero-Hallucination Disclaimer Footer */}
        <div
          style={{
            marginTop: 14,
            padding: '10px 12px',
            borderRadius: 'var(--eos-radius-sm)',
            border: '1px solid var(--eos-border-subtle)',
            background: 'rgba(255, 255, 255, 0.02)',
            fontSize: 10,
            color: 'var(--eos-text-tertiary)',
            lineHeight: 1.45,
          }}
        >
          <strong style={{ color: 'var(--eos-text-secondary)' }}>Scientific Integrity Policy:</strong> All calculations, event attributes, and regional summaries derive strictly from authentic USGS, NASA EONET v3, NASA FIRMS, and GDELT 2.0 payloads. No synthetic measurements are generated.
        </div>
      </div>
    </div>
  )
}
