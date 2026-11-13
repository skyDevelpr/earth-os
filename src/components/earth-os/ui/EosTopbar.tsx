'use client'

import { useEarthOsStore } from '@/stores/earth-os'
import { UtcClock } from './UtcClock'
import { DataSourceStatus } from './DataSourceStatus'
import { useEffect, useRef, useState, useMemo } from 'react'
import { useGeocode } from '@/hooks/earth-os/useEarthData'
import type { UnifiedEvent, EarthquakeEvent } from '@/types/earth-os'
import { searchPois, getPoiBadge } from '@/services/earth-os/poi.service'

function SearchBar() {
  const {
    searchOpen,
    setSearchOpen,
    flyTo,
    earthquakes,
    eonetEvents,
    setSelectedEvent,
    setSelectedPoi,
    setInspectorOpen,
  } = useEarthOsStore()
  const [inputValue, setInputValue] = useState('')
  const [debounced, setDebounced] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [setSearchOpen])

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(inputValue), 280)
    return () => clearTimeout(timer)
  }, [inputValue])

  // Coordinate Parser
  const parsedCoords = useMemo((): [number, number] | null => {
    const trimmed = inputValue.trim()
    const coordRegex = /^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/
    const match = trimmed.match(coordRegex)
    if (match) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [lng, lat]
      }
    }
    return null
  }, [inputValue])

  // In-memory active natural hazard & event matching
  const matchingEvents = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    if (q.length < 2) return []

    const results: Array<{ event: UnifiedEvent | EarthquakeEvent; badge: string; color: string }> = []

    // 1. Earthquakes matching
    const magMatch = q.match(/^m([0-9](?:\.[0-9])?)$/)
    const minMag = magMatch ? parseFloat(magMatch[1]) : null

    for (const eq of earthquakes) {
      if (results.length >= 4) break
      const titleMatch = eq.title.toLowerCase().includes(q) || (eq.description && eq.description.toLowerCase().includes(q))
      const magHit = minMag !== null && eq.magnitude >= minMag
      if (titleMatch || magHit) {
        results.push({
          event: eq,
          badge: `M${eq.magnitude.toFixed(1)}`,
          color: eq.magnitude >= 5.5 ? 'var(--eos-red)' : eq.magnitude >= 4.0 ? 'var(--eos-orange)' : 'var(--eos-cyan)',
        })
      }
    }

    // 2. NASA EONET events matching
    for (const ev of eonetEvents) {
      if (results.length >= 6) break
      if (ev.title.toLowerCase().includes(q) || ev.category.toLowerCase().includes(q)) {
        results.push({
          event: ev,
          badge: ev.category.slice(0, 8),
          color: 'var(--eos-purple)',
        })
      }
    }

    return results
  }, [debounced, earthquakes, eonetEvents])

  // Permanent Geographic Points of Interest matching
  const matchingPois = useMemo(() => {
    if (debounced.trim().length < 2) return []
    return searchPois(debounced).slice(0, 5)
  }, [debounced])

  // Geocoding query
  const { data: geocodeData } = useGeocode(debounced)
  const geocodeResults = geocodeData?.data?.features ?? []

  const hasAnyResults = parsedCoords !== null || matchingEvents.length > 0 || matchingPois.length > 0 || geocodeResults.length > 0

  return (
    <div className="eos-search-wrapper">
      <span className="eos-search-icon" aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="7" cy="7" r="5" />
          <path d="M11 11l4 4" />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="search"
        className="eos-search-input"
        placeholder="Search planet, events (e.g. M5, Japan), coordinates… (⌘K)"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onFocus={() => setSearchOpen(true)}
        aria-label="Search locations and events"
      />

      {/* Results dropdown */}
      {searchOpen && hasAnyResults && (
        <div className="eos-search-dropdown eos-scrollable">
          {/* Coordinates Section */}
          {parsedCoords && (
            <div>
              <div style={{
                padding: '6px 12px 4px',
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--eos-cyan)',
                borderBottom: '1px solid var(--eos-border-subtle)',
              }}>
                Target Coordinates
              </div>
              <button
                className="eos-search-item"
                onClick={() => {
                  flyTo({
                    center: parsedCoords,
                    zoom: 7,
                    bearing: 0,
                    pitch: 25,
                  })
                  setSearchOpen(false)
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--eos-text-primary)' }}>
                  📍 Jump to [{parsedCoords[1].toFixed(4)}°, {parsedCoords[0].toFixed(4)}°]
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--eos-text-tertiary)', marginTop: 1 }}>
                  Global WGS84 Geodetic Point
                </div>
              </button>
            </div>
          )}

          {/* Active Natural Events Section */}
          {matchingEvents.length > 0 && (
            <div>
              <div style={{
                padding: '6px 12px 4px',
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--eos-orange)',
                borderBottom: '1px solid var(--eos-border-subtle)',
              }}>
                Active Natural Events
              </div>
              {matchingEvents.map(({ event, badge, color }, i) => (
                <button
                  key={i}
                  className="eos-search-item"
                  onClick={() => {
                    setSelectedEvent(event)
                    setInspectorOpen(true)
                    flyTo({
                      center: [event.coordinates.longitude, event.coordinates.latitude],
                      zoom: 6.5,
                      bearing: 0,
                      pitch: 35,
                    })
                    setInputValue(event.title)
                    setSearchOpen(false)
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                >
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: 'var(--eos-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--eos-text-tertiary)', marginTop: 1 }}>
                      {new Date(event.observationTime).toLocaleDateString()} • {event.category}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.06)',
                      color,
                      border: '1px solid currentColor',
                      flexShrink: 0,
                    }}
                  >
                    {badge}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Permanent Geographic Points of Interest Section */}
          {matchingPois.length > 0 && (
            <div>
              <div style={{
                padding: '6px 12px 4px',
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--eos-cyan)',
                borderBottom: '1px solid var(--eos-border-subtle)',
              }}>
                Points of Interest
              </div>
              {matchingPois.map(poi => {
                const badge = getPoiBadge(poi.category)
                return (
                  <button
                    key={poi.id}
                    className="eos-search-item"
                    onClick={() => {
                      setSelectedPoi(poi)
                      setInspectorOpen(true)
                      flyTo({
                        center: [poi.coordinates.longitude, poi.coordinates.latitude],
                        zoom: 7,
                        bearing: 0,
                        pitch: 35,
                      })
                      setInputValue(poi.name)
                      setSearchOpen(false)
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                  >
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, color: 'var(--eos-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {poi.name}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--eos-text-tertiary)', marginTop: 1 }}>
                        {poi.country} • {badge.label}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: `${badge.color}20`,
                        color: badge.color,
                        border: `1px solid ${badge.color}40`,
                        flexShrink: 0,
                      }}
                    >
                      {badge.emoji} {badge.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Geocoded Places Section */}
          {geocodeResults.length > 0 && (
            <div>
              <div style={{
                padding: '6px 12px 4px',
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--eos-text-tertiary)',
                borderBottom: '1px solid var(--eos-border-subtle)',
              }}>
                Geographic Places
              </div>
              {geocodeResults.slice(0, 5).map((feature: any, i: number) => {
                const props = feature.properties?.geocoding ?? {}
                const label = props.label ?? props.name ?? 'Unknown'
                const coords = feature.geometry?.coordinates
                if (!coords) return null
                return (
                  <button
                    key={i}
                    className="eos-search-item"
                    onClick={() => {
                      flyTo({
                        center: [coords[0], coords[1]],
                        zoom: 6,
                        bearing: 0,
                        pitch: 0,
                      })
                      setInputValue(label)
                      setSearchOpen(false)
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--eos-text-primary)' }}>{props.name ?? label}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--eos-text-tertiary)', marginTop: 1 }}>
                      {props.country ?? ''}{props.state ? `, ${props.state}` : ''}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function EosTopbar() {
  const {
    setSidebarCollapsed,
    sidebarCollapsed,
    isFullscreen,
    setFullscreen,
    themeMode,
    setThemeMode,
  } = useEarthOsStore()

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setFullscreen(false)
    }
  }

  return (
    <header className="eos-topbar" role="banner">
      <div className="eos-topbar-content">
        {/* Brand / Menu Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="eos-brand-pill"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          <div className="eos-logo-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <span className="eos-logo">
            EARTH<span style={{ color: 'var(--eos-cyan)', fontWeight: 800 }}>OS</span>
          </span>
          <span className="eos-logo-badge">PRO</span>
        </button>

        {/* Center Spotlight Search */}
        <SearchBar />

        {/* Flexible spacer */}
        <div style={{ flex: 1 }} />

        {/* Right Status Capsule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Appearance Toggle */}
          <div className="eos-theme-switcher" title="Toggle Light / Dark Appearance">
            <button
              onClick={() => setThemeMode('dark')}
              className={`eos-theme-btn ${themeMode === 'dark' ? 'active' : ''}`}
              title="Dark Mode"
              aria-label="Dark mode"
            >
              🌙
            </button>
            <button
              onClick={() => setThemeMode('light')}
              className={`eos-theme-btn ${themeMode === 'light' ? 'active' : ''}`}
              title="Light Mode"
              aria-label="Light mode"
            >
              ☀️
            </button>
          </div>

          <div className="eos-topbar-island">
            <UtcClock />
            <div style={{ width: 1, height: 14, background: 'var(--eos-border-subtle)' }} />
            <DataSourceStatus />
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={handleFullscreen}
            className="eos-glass-pill"
            style={{
              width: 32,
              height: 32,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--eos-text-secondary)',
              cursor: 'pointer',
            }}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
