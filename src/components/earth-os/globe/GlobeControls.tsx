'use client'

import { useState, useEffect } from 'react'
import { useEarthOsStore } from '@/stores/earth-os'
import { MapLayerControlCentre } from '@/components/earth-os/ui/MapLayerControlCentre'

function GlobeControlBtn({
  onClick,
  title,
  children,
  active,
  disabled,
  'aria-label': ariaLabel,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
  'aria-label': string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`eos-control-btn ${active ? 'active' : ''}`}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}

export function GlobeControls() {
  const {
    flyTo,
    layerControlOpen,
    setLayerControlOpen,
    visualizationMode,
    setVisualizationMode,
    userLocation,
    setUserLocation,
    userLocationStatus,
    setUserLocationStatus,
    userLocationError,
  } = useEarthOsStore()

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => {
      setToastMessage(null)
    }, 4500)
    return () => clearTimeout(timer)
  }, [toastMessage])

  const resetCamera = () => {
    flyTo({ center: [0, 20], zoom: 1.5, bearing: 0, pitch: 0 })
  }

  const toggleHeatmapMode = () => {
    setVisualizationMode(visualizationMode === 'heatmap' ? 'markers' : 'heatmap')
  }

  const handleGetCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setUserLocationStatus('error', 'Geolocation is not supported by your browser.')
      setToastMessage('Geolocation is not supported by your browser.')
      return
    }

    setUserLocationStatus('requesting')
    setToastMessage('Retrieving GPS planetary coordinates…')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        const accuracy = Math.round(pos.coords.accuracy || 20)

        // Validate bounds
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          setUserLocationStatus('error', 'Received invalid geographic coordinates.')
          setToastMessage('Received invalid geographic coordinates.')
          return
        }

        setUserLocation({ coords: [lon, lat], accuracy })
        setToastMessage(`Located: ${lat.toFixed(3)}°, ${lon.toFixed(3)}° (±${accuracy}m)`)

        // Smoothly fly to user location
        flyTo({
          center: [lon, lat],
          zoom: 13,
          bearing: 0,
          pitch: 25,
        })
      },
      (err) => {
        let msg = 'Could not retrieve your location.'
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access in your browser settings.'
          setUserLocationStatus('denied', msg)
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Current location is currently unavailable.'
          setUserLocationStatus('error', msg)
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Please try again.'
          setUserLocationStatus('error', msg)
        } else {
          setUserLocationStatus('error', msg)
        }
        setToastMessage(msg)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    )
  }

  return (
    <>
      {/* Floating Status Toast */}
      {toastMessage && (
        <div className="eos-location-toast">
          {userLocationStatus === 'requesting' ? (
            <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--eos-cyan)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          ) : userLocationStatus === 'located' ? (
            <span style={{ color: 'var(--eos-cyan)', fontSize: 13 }}>📍</span>
          ) : (
            <span style={{ color: 'var(--eos-red)', fontSize: 13 }}>⚠️</span>
          )}
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--eos-text-tertiary)', cursor: 'pointer', marginLeft: 4 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Pill Stack — Apple Maps style */}
      <div className="eos-globe-controls">
        <div className="eos-control-group">
          {/* Default Compass / Reset Globe View */}
          <GlobeControlBtn
            onClick={resetCamera}
            title="Reset Camera (Default Globe View)"
            aria-label="Reset camera to default view"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </GlobeControlBtn>

          {/* Google Maps-Style Current Location Button */}
          <GlobeControlBtn
            onClick={handleGetCurrentLocation}
            title="Find My Location (GPS)"
            aria-label="Find current user location"
            active={userLocationStatus === 'located'}
          >
            {userLocationStatus === 'requesting' ? (
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--eos-cyan)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="7" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
              </svg>
            )}
          </GlobeControlBtn>

          {/* Quick Heatmap / Marker toggle */}
          <GlobeControlBtn
            onClick={toggleHeatmapMode}
            title={visualizationMode === 'heatmap' ? 'Switch to Marker Pins' : 'Switch to Planetary Density Heatmap'}
            aria-label="Toggle Heatmap"
            active={visualizationMode === 'heatmap'}
          >
            <span style={{ fontSize: 13 }} aria-hidden="true">🔥</span>
          </GlobeControlBtn>

          {/* Map Layer Control Centre Drawer Trigger */}
          <GlobeControlBtn
            onClick={() => setLayerControlOpen(!layerControlOpen)}
            title="Map Layer & Visualization Selector"
            aria-label="Toggle Map Layer Control Centre"
            active={layerControlOpen}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </GlobeControlBtn>
        </div>
      </div>

      {/* Map Layer Control Centre Drawer Popover */}
      {layerControlOpen && (
        <div
          style={{
            position: 'absolute',
            right: 68,
            bottom: 24,
            zIndex: 40,
          }}
        >
          <MapLayerControlCentre onClose={() => setLayerControlOpen(false)} />
        </div>
      )}
    </>
  )
}
