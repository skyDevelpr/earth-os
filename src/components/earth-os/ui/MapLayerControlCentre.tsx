'use client'

import { useState } from 'react'
import { useEarthOsStore } from '@/stores/earth-os'
import type { LayerId } from '@/types/earth-os'
import { GLOBAL_POIS } from '@/services/earth-os/poi-data'
import { getLayerForCategory } from '@/services/earth-os/poi.service'

interface LayerDef {
  id: LayerId
  label: string
  icon: string
  color: string
  description: string
  count?: number
}

interface LayerGroupDef {
  id: string
  title: string
  icon: string
  layers: LayerDef[]
}

export function MapLayerControlCentre({ onClose }: { onClose?: () => void }) {
  const {
    activeLayers,
    toggleLayer,
    setLayerVisible,
    visualizationMode,
    setVisualizationMode,
    earthquakes,
    eonetEvents,
    fireHotspots,
    mapMode,
    setMapMode,
  } = useEarthOsStore()

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    events: true,
    geography: true,
    infrastructure: false,
    places: true,
    scientific: false,
  })

  // Dynamic counts for POIs per layer
  const getPoiCount = (layerId: LayerId) => {
    return GLOBAL_POIS.filter(p => getLayerForCategory(p.category) === layerId).length
  }

  const groups: LayerGroupDef[] = [
    {
      id: 'events',
      title: 'Natural Events (Live)',
      icon: '⚡',
      layers: [
        {
          id: 'earthquakes',
          label: 'Earthquakes',
          icon: '🔴',
          color: 'var(--eos-red)',
          description: 'USGS global seismic hypocenters with Mw magnitude scaling',
          count: earthquakes.length,
        },
        {
          id: 'eonetEvents',
          label: 'Severe Storms & Volcanoes',
          icon: '🌪',
          color: 'var(--eos-purple)',
          description: 'NASA EONET tracked cyclones, volcanic unrest, and floods',
          count: eonetEvents.length,
        },
        {
          id: 'fireHotspots',
          label: 'Wildfire Detections',
          icon: '🔥',
          color: 'var(--eos-orange)',
          description: 'NASA FIRMS VIIRS & MODIS satellite thermal anomalies',
          count: fireHotspots.length,
        },
      ],
    },
    {
      id: 'geography',
      title: 'Natural Geography',
      icon: '🏔️',
      layers: [
        {
          id: 'poi_mountains',
          label: 'Mountains & Volcanoes',
          icon: '⛰️',
          color: '#38bdf8',
          description: 'Iconic world peaks, summits & permanent volcanic centers',
          count: getPoiCount('poi_mountains'),
        },
        {
          id: 'poi_water',
          label: 'Lakes, Rivers & Waterfalls',
          icon: '💧',
          color: '#60a5fa',
          description: 'Caspian Sea, Baikal, Amazon, Nile, Victoria & Angel Falls',
          count: getPoiCount('poi_water'),
        },
        {
          id: 'poi_nature',
          label: 'Deserts, Glaciers & Reefs',
          icon: '🪸',
          color: '#34d399',
          description: 'Sahara, Atacama, Great Barrier Reef, Perito Moreno Glacier',
          count: getPoiCount('poi_nature'),
        },
      ],
    },
    {
      id: 'infrastructure',
      title: 'Global Infrastructure',
      icon: '🏗️',
      layers: [
        {
          id: 'poi_aviation',
          label: 'Major Global Airports',
          icon: '✈️',
          color: '#38bdf8',
          description: 'World busiest hubs: ATL, DXB, LHR, HND, SIN',
          count: getPoiCount('poi_aviation'),
        },
        {
          id: 'poi_maritime',
          label: 'Deepwater Seaports',
          icon: '🚢',
          color: '#2dd4bf',
          description: 'Global maritime freight gateways: Shanghai, Singapore, Rotterdam',
          count: getPoiCount('poi_maritime'),
        },
        {
          id: 'poi_space',
          label: 'Spaceports & Orbital Pads',
          icon: '🚀',
          color: '#c084fc',
          description: 'KSC Cape Canaveral, Baikonur, Kourou, Boca Chica Starbase',
          count: getPoiCount('poi_space'),
        },
        {
          id: 'poi_energy',
          label: 'Dams & Power Stations',
          icon: '⚡',
          color: '#f59e0b',
          description: 'Three Gorges, Itaipu, Hoover Dam, Zaporizhzhia Nuclear',
          count: getPoiCount('poi_energy'),
        },
        {
          id: 'poi_science',
          label: 'Observatories & Polar Bases',
          icon: '🔭',
          color: '#818cf8',
          description: 'Mauna Kea, ALMA, CERN, Amundsen-Scott South Pole, Svalbard',
          count: getPoiCount('poi_science'),
        },
      ],
    },
    {
      id: 'places',
      title: 'Human Geography & Heritage',
      icon: '🏛️',
      layers: [
        {
          id: 'poi_cities',
          label: 'Capitals & Megacities',
          icon: '🏙️',
          color: '#f472b6',
          description: 'Tokyo, NYC, London, Delhi, Paris, Cairo, São Paulo',
          count: getPoiCount('poi_cities'),
        },
        {
          id: 'poi_heritage',
          label: 'UNESCO World Heritage',
          icon: '🏛️',
          color: '#facc15',
          description: 'Pyramids of Giza, Great Wall, Machu Picchu, Taj Mahal, Petra',
          count: getPoiCount('poi_heritage'),
        },
      ],
    },
    {
      id: 'scientific',
      title: 'Scientific Observations',
      icon: '🛰️',
      layers: [
        {
          id: 'satellite_trueColor',
          label: 'NASA GIBS Satellite Layer',
          icon: '🌍',
          color: 'var(--eos-cyan)',
          description: 'Terra / MODIS True-Colour Daily Global Satellite Mosaic',
        },
        {
          id: 'airQuality',
          label: 'Atmospheric Air Quality',
          icon: '💨',
          color: '#60a5fa',
          description: 'PM2.5, PM10 & European CAQI Atmospheric Pollution',
        },
        {
          id: 'countryBorders',
          label: 'Geopolitical Boundaries',
          icon: '🌐',
          color: '#94a3b8',
          description: 'International sovereign boundaries and maritime limits',
        },
      ],
    },
  ]

  const toggleGroupCollapse = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const toggleAllInGroup = (group: LayerGroupDef) => {
    const allActive = group.layers.every(l => activeLayers.has(l.id))
    group.layers.forEach(l => {
      setLayerVisible(l.id, !allActive)
    })
  }

  return (
    <div
      className="eos-layer-control-centre"
      style={{
        width: 330,
        maxHeight: 'calc(100vh - 120px)',
        background: 'var(--eos-surface-panel)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--eos-surface-panel-border)',
        borderRadius: 'var(--eos-radius-sheet)',
        boxShadow: 'var(--eos-shadow-sheet)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'eos-panel-slide-in 0.3s var(--eos-ease)',
        zIndex: 50,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--eos-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--eos-text-primary)' }}>
            Map Layer Control Centre
          </span>
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: 9999,
              background: 'rgba(0, 212, 255, 0.15)',
              color: 'var(--eos-cyan)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
            }}
          >
            {activeLayers.size} active
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="eos-glass-pill"
            style={{ width: 24, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Close layer control"
          >
            ✕
          </button>
        )}
      </div>

      {/* Google Maps-Style Basemap Selector */}
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--eos-border-subtle)' }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--eos-text-tertiary)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span>Map Base Mode</span>
          <span style={{ color: 'var(--eos-cyan)' }}>{mapMode.toUpperCase()}</span>
        </div>
        <div className="eos-map-mode-grid">
          {[
            { id: 'globe', label: 'Globe', icon: '🌍', desc: 'Dark Earth Canvas' },
            { id: 'satellite', label: 'Satellite', icon: '🛰️', desc: 'High-Res Orbital Imagery' },
            { id: 'hybrid', label: 'Hybrid', icon: '🗺️', desc: 'Satellite + Roads & Labels' },
            { id: 'terrain', label: 'Terrain', icon: '⛰️', desc: 'Topographic Shaded Relief' },
          ].map(m => (
            <div
              key={m.id}
              className={`eos-map-mode-card ${mapMode === m.id ? 'active' : ''}`}
              onClick={() => setMapMode(m.id as any)}
              title={m.desc}
            >
              <div className="eos-map-mode-thumb">
                {m.icon}
              </div>
              <span className="eos-map-mode-label">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Visualization Mode Switcher: Markers | Clusters | Heatmap */}
      <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid var(--eos-border-subtle)' }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--eos-text-tertiary)', marginBottom: 5 }}>
          Event Visualization Mode
        </div>
        <div className="eos-segmented-control">
          <button
            className={`eos-segmented-btn ${visualizationMode === 'markers' ? 'active' : ''}`}
            onClick={() => setVisualizationMode('markers')}
            title="Individual icons and pins for every event and location"
          >
            📍 Markers
          </button>
          <button
            className={`eos-segmented-btn ${visualizationMode === 'clusters' ? 'active' : ''}`}
            onClick={() => setVisualizationMode('clusters')}
            title="Density clusters grouped by proximity"
          >
            ⊚ Clusters
          </button>
          <button
            className={`eos-segmented-btn ${visualizationMode === 'heatmap' ? 'active' : ''}`}
            onClick={() => setVisualizationMode('heatmap')}
            title="Thermal and seismic density gradient heatmap"
          >
            🔥 Heatmap
          </button>
        </div>
      </div>

      {/* Layer Groups Accordion */}
      <div className="eos-scrollable" style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 12px' }}>
        {groups.map(group => {
          const isExpanded = expandedGroups[group.id] ?? true
          const groupActiveCount = group.layers.filter(l => activeLayers.has(l.id)).length

          return (
            <div
              key={group.id}
              style={{
                marginBottom: 8,
                borderRadius: 'var(--eos-radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--eos-border-subtle)',
                overflow: 'hidden',
              }}
            >
              {/* Group Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => toggleGroupCollapse(group.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13 }} aria-hidden="true">{group.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--eos-text-primary)' }}>
                    {group.title}
                  </span>
                  <span style={{ fontSize: 9.5, color: 'var(--eos-text-tertiary)' }}>
                    ({groupActiveCount}/{group.layers.length})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleAllInGroup(group)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 9.5,
                      fontWeight: 600,
                      color: 'var(--eos-cyan)',
                      cursor: 'pointer',
                      padding: '2px 4px',
                    }}
                  >
                    {groupActiveCount === group.layers.length ? 'None' : 'All'}
                  </button>
                  <span style={{ fontSize: 9.5, color: 'var(--eos-text-tertiary)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 180ms ease' }}>
                    ▼
                  </span>
                </div>
              </div>

              {/* Group Content */}
              {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 6px' }}>
                  {group.layers.map(layer => {
                    const active = activeLayers.has(layer.id)
                    return (
                      <label
                        key={layer.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                          padding: '6px 8px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          background: active ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                          transition: 'background 120ms ease',
                          marginBottom: 2,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleLayer(layer.id)}
                          style={{
                            accentColor: layer.color,
                            cursor: 'pointer',
                            marginTop: 2,
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span style={{ fontSize: 12 }}>{layer.icon}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: active ? 'var(--eos-text-primary)' : 'var(--eos-text-secondary)' }}>
                                {layer.label}
                              </span>
                            </div>

                            {layer.count != null && (
                              <span
                                style={{
                                  fontSize: 9.5,
                                  fontWeight: 600,
                                  color: active ? 'var(--eos-text-primary)' : 'var(--eos-text-muted)',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                {layer.count}
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: 9.5, color: 'var(--eos-text-tertiary)', lineHeight: 1.3, marginTop: 2 }}>
                            {layer.description}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
