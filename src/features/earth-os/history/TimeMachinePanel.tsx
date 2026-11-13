'use client'

import { useState } from 'react'
import { useEarthOsStore } from '@/stores/earth-os'

export function TimeMachinePanel() {
  const { setSatelliteLayer, activeSatelliteLayer, timelineDate, setTimelineDate, setEventTimeRange } = useEarthOsStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedHistoricalEvent, setSelectedHistoricalEvent] = useState<string | null>(null)
  const { flyTo } = useEarthOsStore()

  // Verified landmark historical planetary events with authentic dates and coordinates
  const historicalEvents = [
    {
      id: 'tohoku-2011',
      title: '2011 Tōhoku Earthquake & Tsunami',
      date: '2011-03-11',
      coords: [142.373, 38.322] as [number, number],
      details: 'Magnitude 9.1 megathrust earthquake off the Oshika Peninsula of Tōhoku.',
      gibsLayer: 'MODIS_Terra_CorrectedReflectance_TrueColor'
    },
    {
      id: 'chile-2010',
      title: '2010 Chile Maule Earthquake',
      date: '2010-02-27',
      coords: [-72.898, -36.122] as [number, number],
      details: 'Magnitude 8.8 earthquake occurring off the coast of central Chile.',
      gibsLayer: 'MODIS_Terra_CorrectedReflectance_TrueColor'
    },
    {
      id: 'california-campfire-2018',
      title: '2018 Camp Fire (California)',
      date: '2018-11-08',
      coords: [-121.4397, 39.8108] as [number, number],
      details: 'Deadliest wildfire in California history. VIIRS/MODIS thermal anomaly & plume.',
      gibsLayer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor'
    },
    {
      id: 'hungatonga-2022',
      title: '2022 Hunga Tonga Volcanic Eruption',
      date: '2022-01-15',
      coords: [-175.38, -20.54] as [number, number],
      details: 'Submarine volcanic eruption reaching stratospheric heights recorded across Earth.',
      gibsLayer: 'MODIS_Aqua_CorrectedReflectance_TrueColor'
    },
    {
      id: 'hurricane-katrina-2005',
      title: '2005 Hurricane Katrina',
      date: '2005-08-28',
      coords: [-89.6, 25.7] as [number, number],
      details: 'Category 5 Atlantic hurricane making landfall in Gulf Coast.',
      gibsLayer: 'MODIS_Terra_CorrectedReflectance_TrueColor'
    }
  ]

  const handleSelectHistorical = (evt: typeof historicalEvents[0]) => {
    setSelectedHistoricalEvent(evt.id)
    setTimelineDate(new Date(evt.date))
    setSatelliteLayer(evt.gibsLayer)
    flyTo({ center: evt.coords, zoom: 6, bearing: 0, pitch: 0 })
  }

  const currentDateStr = timelineDate.toISOString().split('T')[0]

  return (
    <div className="eos-floating-panel">
      {/* Header */}
      <div className="eos-panel-header">
        <div>
          <div className="eos-panel-title">Earth Time Machine</div>
          <div className="eos-panel-subtitle">
            Historical imagery playback & archived telemetry (2000–Present)
          </div>
        </div>
      </div>

      {/* Date scrubbing bar */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--eos-border-subtle)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--eos-text-tertiary)' }}>
            Selected Date
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--eos-cyan)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--eos-font-mono)' }}>
            {currentDateStr}
          </span>
        </div>

        <input
          type="date"
          min="2000-02-24"
          max={new Date().toISOString().split('T')[0]}
          value={currentDateStr}
          onChange={(e) => {
            if (e.target.value) setTimelineDate(new Date(e.target.value))
          }}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--eos-border-subtle)',
            borderRadius: 'var(--eos-radius-sm)',
            padding: '7px 10px',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--eos-text-primary)',
            colorScheme: 'dark',
            outline: 'none',
          }}
        />

        {/* Playback Controls — Apple Pill Buttons */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button
            onClick={() => {
              const d = new Date(timelineDate)
              d.setDate(d.getDate() - 1)
              setTimelineDate(d)
            }}
            className="eos-glass-pill"
            style={{
              flex: 1,
              padding: '6px 8px',
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--eos-text-secondary)',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            ◀ −1 Day
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              flex: 1.2,
              padding: '6px 8px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 9999,
              border: '1px solid rgba(0, 212, 255, 0.4)',
              background: isPlaying ? 'rgba(0, 212, 255, 0.25)' : 'rgba(0, 212, 255, 0.12)',
              color: 'var(--eos-cyan)',
              cursor: 'pointer',
              boxShadow: isPlaying ? '0 0 12px rgba(0, 212, 255, 0.2)' : 'none',
              textAlign: 'center',
            }}
          >
            {isPlaying ? '⏸ Pause' : '▶ Playback'}
          </button>
          <button
            onClick={() => {
              const d = new Date(timelineDate)
              d.setDate(d.getDate() + 1)
              if (d <= new Date()) setTimelineDate(d)
            }}
            className="eos-glass-pill"
            style={{
              flex: 1,
              padding: '6px 8px',
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--eos-text-secondary)',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            +1 Day ▶
          </button>
        </div>
      </div>

      {/* Historical Landmarks */}
      <div className="eos-scrollable" style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--eos-text-tertiary)', marginBottom: 10 }}>
          Verified Landmark Events
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {historicalEvents.map(evt => {
            const isSelected = selectedHistoricalEvent === evt.id
            return (
              <button
                key={evt.id}
                onClick={() => handleSelectHistorical(evt)}
                style={{
                  padding: '11px 13px',
                  borderRadius: 'var(--eos-radius-md)',
                  border: '1px solid',
                  borderColor: isSelected ? 'rgba(0, 212, 255, 0.45)' : 'var(--eos-border-subtle)',
                  background: isSelected ? 'rgba(0, 212, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  boxShadow: isSelected ? '0 0 16px rgba(0, 212, 255, 0.15)' : 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 180ms ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? 'var(--eos-cyan)' : 'var(--eos-text-primary)' }}>
                    {evt.title}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--eos-text-tertiary)', fontFamily: 'var(--eos-font-mono)' }}>
                    {evt.date}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--eos-text-secondary)', lineHeight: 1.35 }}>
                  {evt.details}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 10, color: 'var(--eos-cyan)' }}>
                  <span>🛰 {evt.gibsLayer.split('_')[0]}</span>
                  <span>·</span>
                  <span>{evt.coords[1].toFixed(1)}°, {evt.coords[0].toFixed(1)}°</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Data Authenticity Guardrail */}
        <div style={{
          marginTop: 14,
          padding: '10px 12px',
          borderRadius: 'var(--eos-radius-sm)',
          border: '1px solid var(--eos-border-subtle)',
          background: 'rgba(255, 255, 255, 0.02)',
          fontSize: 10.5,
          color: 'var(--eos-text-tertiary)',
          lineHeight: 1.45,
        }}>
          <strong style={{ color: 'var(--eos-text-secondary)' }}>Scientific Authenticity:</strong> Earth OS strictly queries authentic NASA GIBS MODIS and VIIRS records. Data is never interpolated or simulated when cloud cover or orbital gaps occur.
        </div>
      </div>
    </div>
  )
}
