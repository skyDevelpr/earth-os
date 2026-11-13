'use client'

import { useEffect } from 'react'
import { EosTopbar } from '@/components/earth-os/ui/EosTopbar'
import { EosSidebar } from '@/components/earth-os/ui/EosSidebar'
import { EventInspector } from '@/components/earth-os/ui/EventInspector'
import { GlobeContainer } from '@/components/earth-os/globe/GlobeContainer'
import { GlobeControls } from '@/components/earth-os/globe/GlobeControls'
import { useEarthOsStore } from '@/stores/earth-os'
import { useEarthquakes, useEonetEvents, useFireHotspots } from '@/hooks/earth-os/useEarthData'
import { useLiveFlights } from '@/hooks/earth-os/useFlights'
import { SatellitePanel } from '@/features/earth-os/satellite/SatellitePanel'
import { AtmospherePanel } from '@/features/earth-os/atmosphere/AtmospherePanel'
import { TimeMachinePanel } from '@/features/earth-os/history/TimeMachinePanel'
import { AnalyticsPanel } from '@/features/earth-os/analytics/AnalyticsPanel'
import { IntelligencePanel } from '@/features/earth-os/intelligence/IntelligencePanel'
import { NewsPanel } from '@/features/earth-os/news/NewsPanel'
import LiveEventsPage from '@/features/earth-os/events/LiveEventsPanel'
import { LiveFlightsPanel } from '@/features/earth-os/flights/LiveFlightsPanel'
import { FlightInspector } from '@/components/earth-os/flights/FlightInspector'
import { CockpitView } from '@/components/earth-os/flights/CockpitView'

function DataLoader() {
  const { eventTimeRange, minMagnitude, setEarthquakes, setEonetEvents, setFireHotspots } = useEarthOsStore()

  // On-demand live flights tracking (only queries when activeModule === 'flights')
  useLiveFlights()

  const { data: earthquakeData } = useEarthquakes(eventTimeRange, minMagnitude)
  const { data: eonetData } = useEonetEvents(
    eventTimeRange === 'hour' ? 1 : eventTimeRange === 'day' ? 1 : eventTimeRange === 'week' ? 7 : 30
  )
  const { data: fireData } = useFireHotspots({
    days: 1,
    product: 'VIIRS_SNPP_NRT',
  })

  useEffect(() => {
    if (earthquakeData) setEarthquakes(earthquakeData)
  }, [earthquakeData, setEarthquakes])

  useEffect(() => {
    if (eonetData) setEonetEvents(eonetData)
  }, [eonetData, setEonetEvents])

  useEffect(() => {
    if (fireData) setFireHotspots(fireData)
  }, [fireData, setFireHotspots])

  return null
}

export default function EarthOsPage() {
  const {
    activeModule,
    sidebarCollapsed,
    selectedEvent,
    selectedPoi,
    selectedFlight,
    inspectorOpen,
    themeMode,
    mapMode,
  } = useEarthOsStore()

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isDark = themeMode === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : themeMode === 'dark'
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
      ;(window as any).__EOS_STORE__ = useEarthOsStore
    }
  }, [themeMode])

  return (
    <div
      data-theme={themeMode}
      data-map-mode={mapMode}
      className={`eos-root ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--eos-bg-canvas)',
      }}
    >
      {/* Load active background data */}
      <DataLoader />

      {/* 3D Earth Globe Canvas — True Fullscreen Centerpiece */}
      <main
        className="eos-globe-container"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          zIndex: 0,
        }}
        aria-label="Earth visualization"
      >
        <GlobeContainer />
      </main>

      {/* Material 3 Top Navigation App Bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, pointerEvents: 'none' }}>
        <EosTopbar />
      </div>

      {/* Material 3 Left Navigation Rail */}
      <EosSidebar />

      {/* Material 3 Module Surface Overlays */}
      <div style={{
        position: 'absolute',
        left: sidebarCollapsed ? 82 : 226,
        top: 'calc(var(--eos-topbar-height) + 12px)',
        bottom: 20,
        zIndex: 25,
        transition: 'left 240ms cubic-bezier(0.2, 0, 0, 1)',
        pointerEvents: 'none',
      }}>
        <div style={{ height: '100%', pointerEvents: 'auto' }}>
          {/* Explorer closes all panels completely for unobstructed planetary view */}
          {activeModule === 'events' && (
            <LiveEventsPage />
          )}

          {activeModule === 'flights' && (
            <LiveFlightsPanel />
          )}

          {activeModule === 'news' && (
            <NewsPanel />
          )}

          {activeModule === 'satellite' && (
            <SatellitePanel />
          )}

          {activeModule === 'atmosphere' && (
            <AtmospherePanel />
          )}

          {activeModule === 'history' && (
            <TimeMachinePanel />
          )}

          {activeModule === 'analytics' && (
            <AnalyticsPanel />
          )}

          {activeModule === 'intelligence' && (
            <IntelligencePanel />
          )}
        </div>
      </div>

      {/* Right Inspector Sheet (Selected Event / POI Details) */}
      <EventInspector />

      {/* Right Flight Inspector Sheet (Selected Aircraft Telemetry) */}
      <FlightInspector />

      {/* 3D Simulated Cockpit View (Telemetry-Driven Perspective) */}
      <CockpitView />

      {/* Material 3 Floating Action Stack (Globe Controls) */}
      <GlobeControls />

      {/* Seismic Intensity Legend — Portfolio Surface Card */}
      {(!inspectorOpen || (!selectedEvent && !selectedPoi && !selectedFlight)) && activeModule !== 'flights' && (
        <div
          style={{
            position: 'absolute',
            right: 18,
            top: 'calc(var(--eos-topbar-height) + 14px)',
            background: 'var(--eos-surface-panel)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--eos-surface-panel-border)',
            borderRadius: 'var(--eos-radius-card)',
            padding: '12px 18px',
            zIndex: 15,
            boxShadow: 'var(--eos-shadow-md)',
            pointerEvents: 'none',
          }}
        >
          <div style={{
            fontFamily: 'var(--eos-font)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--eos-text-tertiary)',
            marginBottom: 8,
          }}>
            Seismic Intensity
          </div>
          {[
            { label: 'M7.0+ Major / Extreme', color: 'var(--eos-accent-rose)' },
            { label: 'M6.0+ Strong', color: '#f97316' },
            { label: 'M5.0+ Moderate', color: 'var(--eos-accent-amber)' },
            { label: '< M5.0 Minor', color: 'var(--eos-accent-emerald)' },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 6px ${color}66`,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--eos-text-primary)' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Live Data Attribution Bar — Portfolio Pill */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 12,
          fontFamily: 'var(--eos-font)',
          fontSize: 11,
          fontWeight: 400,
          color: 'var(--eos-text-tertiary)',
          zIndex: 10,
          pointerEvents: 'none',
          textAlign: 'center',
          letterSpacing: '0.02em',
          background: 'var(--eos-surface-panel)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--eos-surface-panel-border)',
          boxShadow: 'var(--eos-shadow-sm)',
          padding: '5px 16px',
          borderRadius: 'var(--eos-radius-full)',
        }}
      >
        Earthquakes: USGS · Natural Events: NASA EONET v3 · Thermal Anomalies: NASA FIRMS · Atmosphere: Open-Meteo
      </div>
    </div>
  )
}
