'use client'

import { useState } from 'react'
import { useEarthOsStore } from '@/stores/earth-os'

// NASA GIBS verified layers
const GIBS_LAYERS = [
  {
    id: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    title: 'True Color (Terra/MODIS)',
    description: 'Natural color satellite imagery from Terra satellite',
    category: 'trueColor',
    format: 'jpg',
    startDate: '2000-02-24',
    resolution: '250m',
    hasTime: true,
  },
  {
    id: 'MODIS_Aqua_CorrectedReflectance_TrueColor',
    title: 'True Color (Aqua/MODIS)',
    description: 'Natural color imagery from Aqua satellite',
    category: 'trueColor',
    format: 'jpg',
    startDate: '2002-07-04',
    resolution: '250m',
    hasTime: true,
  },
  {
    id: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
    title: 'True Color (VIIRS)',
    description: 'High-resolution true color from VIIRS sensor',
    category: 'trueColor',
    format: 'jpg',
    startDate: '2015-11-24',
    resolution: '375m',
    hasTime: true,
  },
  {
    id: 'MODIS_Terra_Land_Surface_Temp_Day',
    title: 'Land Surface Temperature',
    description: 'Daytime land surface temperature',
    category: 'landSurface',
    format: 'png',
    startDate: '2000-03-05',
    resolution: '1km',
    hasTime: true,
  },
  {
    id: 'MODIS_Terra_NDVI_8Day',
    title: 'Vegetation Index (NDVI)',
    description: '8-day composite vegetation index',
    category: 'vegetation',
    format: 'png',
    startDate: '2000-02-18',
    resolution: '250m',
    hasTime: true,
  },
  {
    id: 'MODIS_Terra_Aerosol',
    title: 'Aerosol Optical Depth',
    description: 'Atmospheric aerosol measurements',
    category: 'atmosphere',
    format: 'png',
    startDate: '2000-03-05',
    resolution: '10km',
    hasTime: true,
  },
]

const CATEGORY_LABELS: Record<string, string> = {
  trueColor: '🌍 True Color',
  landSurface: '🌡 Land Surface',
  vegetation: '🌿 Vegetation',
  atmosphere: '🌬 Atmosphere',
  ocean: '🌊 Ocean',
}

export function SatellitePanel() {
  const { setSatelliteLayer, activeSatelliteLayer, satelliteOpacity, setSatelliteOpacity } = useEarthOsStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [imageDate, setImageDate] = useState(new Date().toISOString().split('T')[0])

  const categories = ['all', ...Array.from(new Set(GIBS_LAYERS.map(l => l.category)))]
  const filteredLayers = selectedCategory === 'all'
    ? GIBS_LAYERS
    : GIBS_LAYERS.filter(l => l.category === selectedCategory)

  // Calculate max date (yesterday for MODIS, today for VIIRS)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const maxDate = yesterday.toISOString().split('T')[0]

  return (
    <div className="eos-floating-panel">
      {/* Header */}
      <div className="eos-panel-header">
        <div>
          <div className="eos-panel-title">Satellite Observatory</div>
          <div className="eos-panel-subtitle">
            NASA GIBS — Global Imagery Browse Services
          </div>
        </div>
      </div>

      {/* Date selector */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--eos-border-subtle)', flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--eos-text-tertiary)', marginBottom: 6 }}>
          Observation Imagery Date
        </div>
        <input
          type="date"
          value={imageDate}
          max={maxDate}
          min="2000-01-01"
          onChange={e => setImageDate(e.target.value)}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--eos-border-subtle)',
            borderRadius: 'var(--eos-radius-sm)',
            padding: '7px 10px',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--eos-text-primary)',
            colorScheme: 'dark',
            width: '100%',
            outline: 'none',
          }}
        />
        <div style={{ fontSize: 10, color: 'var(--eos-text-tertiary)', marginTop: 4 }}>
          Telemetry composite availability: yesterday to 2000
        </div>
      </div>

      {/* Opacity control */}
      {activeSatelliteLayer && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--eos-border-subtle)', flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--eos-text-tertiary)', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>Layer Transparency</span>
            <span style={{ color: 'var(--eos-cyan)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(satelliteOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={satelliteOpacity}
            onChange={e => setSatelliteOpacity(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--eos-cyan)' }}
          />
        </div>
      )}

      {/* Category filter */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--eos-border-subtle)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '4px 9px',
                fontSize: 10.5,
                fontWeight: 500,
                borderRadius: 9999,
                border: '1px solid',
                cursor: 'pointer',
                borderColor: selectedCategory === cat ? 'rgba(0,212,255,0.45)' : 'var(--eos-border-subtle)',
                background: selectedCategory === cat ? 'rgba(0,212,255,0.12)' : 'rgba(255, 255, 255, 0.04)',
                color: selectedCategory === cat ? 'var(--eos-cyan)' : 'var(--eos-text-secondary)',
                textTransform: 'capitalize',
                transition: 'all 150ms ease',
              }}
            >
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]?.split(' ')[1] ?? cat}
            </button>
          ))}
        </div>
      </div>

      {/* Layer list */}
      <div className="eos-scrollable" style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {filteredLayers.map(layer => {
          const isActive = activeSatelliteLayer === layer.id
          const inDateRange = !layer.startDate || imageDate >= layer.startDate

          return (
            <button
              key={layer.id}
              onClick={() => {
                if (!inDateRange) return
                setSatelliteLayer(isActive ? null : layer.id)
              }}
              disabled={!inDateRange}
              style={{
                display: 'block',
                width: '100%',
                padding: '11px 13px',
                marginBottom: 8,
                borderRadius: 'var(--eos-radius-md)',
                border: '1px solid',
                cursor: inDateRange ? 'pointer' : 'not-allowed',
                textAlign: 'left',
                borderColor: isActive ? 'rgba(0, 212, 255, 0.45)' : 'var(--eos-border-subtle)',
                background: isActive ? 'rgba(0, 212, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                boxShadow: isActive ? '0 0 16px rgba(0, 212, 255, 0.15)' : 'none',
                opacity: inDateRange ? 1 : 0.4,
                transition: 'all 180ms ease',
              }}
              title={inDateRange ? undefined : `Available from ${layer.startDate}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                <span style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: isActive ? 'var(--eos-cyan)' : 'var(--eos-text-primary)',
                  lineHeight: 1.3,
                }}>
                  {layer.title}
                </span>
                {isActive && (
                  <span style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 9999,
                    background: 'rgba(0,212,255,0.18)',
                    color: 'var(--eos-cyan)',
                    border: '1px solid rgba(0,212,255,0.35)',
                    flexShrink: 0,
                  }}>
                    ACTIVE
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--eos-text-secondary)', marginBottom: 6, lineHeight: 1.35 }}>
                {layer.description}
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--eos-text-tertiary)' }}>
                <span>Spatial Res: {layer.resolution}</span>
                <span>·</span>
                <span>Since {layer.startDate}</span>
              </div>
              {!inDateRange && (
                <div style={{ fontSize: 10, color: 'var(--eos-orange)', marginTop: 4 }}>
                  ⚠ Not available for selected date
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Attribution */}
      <div style={{
        padding: '8px 14px',
        borderTop: '1px solid var(--eos-border-subtle)',
        fontSize: 9.5,
        color: 'var(--eos-text-tertiary)',
        flexShrink: 0,
      }}>
        Imagery: NASA GIBS (gibs.earthdata.nasa.gov) · Open public access
      </div>
    </div>
  )
}
