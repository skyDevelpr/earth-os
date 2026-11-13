'use client'

import { useEffect, useRef, useMemo } from 'react'
import type { Map as MapType, GeoJSONSource, RasterTileSource } from 'maplibre-gl'
import { useEarthOsStore } from '@/stores/earth-os'
import type { EarthquakeEvent, FireDetectionEvent, UnifiedEvent, GeographicPoi, LiveFlight } from '@/types/earth-os'
import { getPoisGeoJson, getPoiBadge } from '@/services/earth-os/poi.service'
import { resolveFlightRoute } from '@/services/earth-os/flight-routes'

// Authoritative High-Resolution Basemap Ensemble (Esri World Imagery, Dark Canvas, NASA BlueMarble & Terrain)
const BASEMAP_STYLE: any = {
  version: 8,
  name: 'Earth OS Multi-Mode Planetary Basemap',
  sources: {
    esri_dark: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Esri, HERE, Garmin, © OpenStreetMap contributors',
      maxzoom: 16,
    },
    nasa_bathymetry: {
      type: 'raster',
      tiles: [
        'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
      ],
      tileSize: 256,
      attribution: 'NASA GIBS Earthdata',
      maxzoom: 8,
    },
    esri_satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Source: Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USDA FSA, USGS, Aerogrid, IGN, IGP, and the GIS User Community',
      maxzoom: 19,
    },
    esri_boundaries: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Esri, Garmin, © OpenStreetMap',
      maxzoom: 19,
    },
    esri_transportation: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Esri, HERE, Garmin',
      maxzoom: 19,
    },
    esri_terrain: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Esri, USGS',
      maxzoom: 13,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#05070d' },
    },
    // Globe / Dark Base
    {
      id: 'nasa-ocean-basemap',
      type: 'raster',
      source: 'nasa_bathymetry',
      layout: { visibility: 'none' },
      paint: { 'raster-opacity': 0.8 },
    },
    {
      id: 'esri-dark-basemap',
      type: 'raster',
      source: 'esri_dark',
      layout: { visibility: 'none' },
      paint: { 'raster-opacity': 0.85 },
    },
    // Satellite Base (Default Active)
    {
      id: 'esri-satellite-basemap',
      type: 'raster',
      source: 'esri_satellite',
      layout: { visibility: 'visible' },
      paint: { 'raster-opacity': 1.0 },
    },
    // Terrain Base
    {
      id: 'esri-terrain-basemap',
      type: 'raster',
      source: 'esri_terrain',
      layout: { visibility: 'none' },
      paint: { 'raster-opacity': 0.95 },
    },
    // Hybrid Overlays
    {
      id: 'esri-transportation-overlay',
      type: 'raster',
      source: 'esri_transportation',
      layout: { visibility: 'none' },
      paint: { 'raster-opacity': 0.85 },
    },
    {
      id: 'esri-boundaries-overlay',
      type: 'raster',
      source: 'esri_boundaries',
      layout: { visibility: 'none' },
      paint: { 'raster-opacity': 0.95 },
    },
  ],
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
}

function categoryToColor(category: string): string {
  const colors: Record<string, string> = {
    wildfires: '#f97316',
    severeStorms: '#8b5cf6',
    volcanoes: '#ef4444',
    floods: '#3b82f6',
    earthquakes: '#f59e0b',
    seaIce: '#93c5fd',
    snow: '#e2e8f0',
    dustHaze: '#a78bfa',
    temperatureExtremes: '#fb923c',
    fireHotspot: '#f97316',
    other: '#6b7280',
  }
  return colors[category] ?? '#6b7280'
}

function getCategoryIconName(category: string): string {
  const map: Record<string, string> = {
    wildfires: 'icon-wildfires',
    severeStorms: 'icon-severeStorms',
    volcanoes: 'icon-volcanoes',
    floods: 'icon-floods',
    seaIce: 'icon-seaIce',
    dustHaze: 'icon-dustHaze',
    fireHotspot: 'icon-fire',
    snow: 'icon-snow',
    tempExtremes: 'icon-tempExtremes',
    temperatureExtremes: 'icon-tempExtremes',
    drought: 'icon-drought',
    earthquakes: 'icon-earthquake',
  }
  return map[category] ?? 'icon-other'
}

function getTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  } catch {
    return 'Recent'
  }
}

const MAP_ICONS: Array<{ id: string; emoji: string; bg: string; border: string }> = [
  // Natural Hazard Icons
  { id: 'icon-earthquake', emoji: '⚡', bg: '#ef4444', border: '#ffffff' },
  { id: 'icon-earthquake-major', emoji: '💥', bg: '#dc2626', border: '#ffd60a' },
  { id: 'icon-wildfires', emoji: '🔥', bg: '#ea580c', border: '#fef08a' },
  { id: 'icon-fire', emoji: '🔥', bg: '#ea580c', border: '#fef08a' },
  { id: 'icon-severeStorms', emoji: '🌀', bg: '#7c3aed', border: '#ddd6fe' },
  { id: 'icon-volcanoes', emoji: '🌋', bg: '#b91c1c', border: '#fecaca' },
  { id: 'icon-floods', emoji: '🌊', bg: '#1d4ed8', border: '#bfdbfe' },
  { id: 'icon-seaIce', emoji: '🧊', bg: '#0284c7', border: '#ffffff' },
  { id: 'icon-dustHaze', emoji: '🌫️', bg: '#7c3aed', border: '#f3e8ff' },
  { id: 'icon-snow', emoji: '❄️', bg: '#0284c7', border: '#ffffff' },
  { id: 'icon-tempExtremes', emoji: '🌡️', bg: '#ea580c', border: '#fed7aa' },
  { id: 'icon-drought', emoji: '☀️', bg: '#d97706', border: '#fef08a' },
  { id: 'icon-other', emoji: '⚠️', bg: '#475569', border: '#f1f5f9' },

  // Permanent Geographic Points of Interest (POIs)
  { id: 'icon-poi-mountain', emoji: '⛰️', bg: '#0284c7', border: '#bae6fd' },
  { id: 'icon-poi-volcano', emoji: '🌋', bg: '#b91c1c', border: '#fecdd3' },
  { id: 'icon-poi-water', emoji: '💧', bg: '#1d4ed8', border: '#bfdbfe' },
  { id: 'icon-poi-waterfall', emoji: '🌊', bg: '#0891b2', border: '#cffafe' },
  { id: 'icon-poi-park', emoji: '🌲', bg: '#15803d', border: '#bbf7d0' },
  { id: 'icon-poi-desert', emoji: '🏜️', bg: '#b45309', border: '#fef3c7' },
  { id: 'icon-poi-glacier', emoji: '🧊', bg: '#0284c7', border: '#ffffff' },
  { id: 'icon-poi-reef', emoji: '🪸', bg: '#0f766e', border: '#a7f3d0' },
  { id: 'icon-poi-capital', emoji: '🏛️', bg: '#be185d', border: '#fbcfe8' },
  { id: 'icon-poi-city', emoji: '🏙️', bg: '#7e22ce', border: '#e9d5ff' },
  { id: 'icon-poi-airport', emoji: '✈️', bg: '#0369a1', border: '#e0f2fe' },
  { id: 'icon-poi-seaport', emoji: '🚢', bg: '#0f766e', border: '#ccfbf1' },
  { id: 'icon-poi-spaceport', emoji: '🚀', bg: '#6b21a8', border: '#f3e8ff' },
  { id: 'icon-poi-dam', emoji: '⚡', bg: '#a16207', border: '#fef08a' },
  { id: 'icon-poi-power', emoji: '⚡', bg: '#c2410c', border: '#fed7aa' },
  { id: 'icon-poi-observatory', emoji: '🔭', bg: '#4338ca', border: '#c7d2fe' },
  { id: 'icon-poi-science', emoji: '🔬', bg: '#4f46e5', border: '#e0e7ff' },
  { id: 'icon-poi-unesco', emoji: '🏛️', bg: '#a16207', border: '#fef9c3' },
  { id: 'icon-poi-landmark', emoji: '🗿', bg: '#9a3412', border: '#ffedd5' },
]

function createIconImage(emoji: string, bg: string, border: string, size = 72): ImageData | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.clearRect(0, 0, size, size)

  // Outer dark contrast backing (depth and basemap separation)
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(5, 7, 13, 0.94)'
  ctx.fill()

  // Inner colorful badge with vibrant gradient
  const grad = ctx.createLinearGradient(0, 4, 0, size - 4)
  grad.addColorStop(0, border)
  grad.addColorStop(0.3, bg)
  grad.addColorStop(1, 'rgba(10, 15, 26, 0.85)')

  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()

  // Crisp high-contrast glowing border
  ctx.lineWidth = 3
  ctx.strokeStyle = border
  ctx.stroke()

  // Outer subtle ambient glow
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2)
  ctx.lineWidth = 1.5
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.stroke()

  // Centered Emoji Symbol with WHITE fill and deep shadow
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 1

  ctx.font = 'bold 30px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, size / 2, size / 2 + 1)

  return ctx.getImageData(0, 0, size, size)
}

function createAircraftIconImage(): ImageData | null {
  if (typeof document === 'undefined') return null
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.clearRect(0, 0, size, size)

  // Sleek Flightradar24-style golden yellow jet pointing North (0 degrees)
  ctx.save()
  ctx.translate(size / 2, size / 2)

  // Bold drop shadow for map depth
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 2

  // Golden yellow Flightradar24-style fuselage & wings
  ctx.fillStyle = '#ffcc00'
  ctx.strokeStyle = '#05070d'
  ctx.lineWidth = 2.4
  ctx.lineJoin = 'round'

  ctx.beginPath()
  // Nose
  ctx.moveTo(0, -22)
  ctx.lineTo(3, -12)
  ctx.lineTo(4, -4)
  // Right wing
  ctx.lineTo(24, 7)
  ctx.lineTo(22, 11)
  ctx.lineTo(4.5, 6)
  // Right fuselage
  ctx.lineTo(3.5, 15)
  // Right tail
  ctx.lineTo(11, 21)
  ctx.lineTo(9, 23)
  ctx.lineTo(0, 19)
  // Left tail
  ctx.lineTo(-9, 23)
  ctx.lineTo(-11, 21)
  ctx.lineTo(-3.5, 15)
  // Left fuselage
  ctx.lineTo(-4.5, 6)
  // Left wing
  ctx.lineTo(-22, 11)
  ctx.lineTo(-24, 7)
  ctx.lineTo(-4, -4)
  ctx.lineTo(-3, -12)
  ctx.closePath()

  ctx.fill()
  ctx.stroke()

  // Crisp cockpit accent dot
  ctx.beginPath()
  ctx.arc(0, -11, 1.8, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  ctx.restore()

  return ctx.getImageData(0, 0, size, size)
}

function createAircraftSelectedIconImage(): ImageData | null {
  if (typeof document === 'undefined') return null
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.clearRect(0, 0, size, size)

  // Glowing selection circle
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, 28, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0, 240, 255, 0.25)'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#00f0ff'
  ctx.stroke()

  ctx.save()
  ctx.translate(size / 2, size / 2)

  ctx.shadowColor = 'rgba(0, 240, 255, 0.8)'
  ctx.shadowBlur = 8

  // Vibrant cyan selected jet
  ctx.fillStyle = '#00f0ff'
  ctx.strokeStyle = '#030712'
  ctx.lineWidth = 2.4
  ctx.lineJoin = 'round'

  ctx.beginPath()
  // Nose
  ctx.moveTo(0, -22)
  ctx.lineTo(3, -12)
  ctx.lineTo(4, -4)
  // Right wing
  ctx.lineTo(24, 7)
  ctx.lineTo(22, 11)
  ctx.lineTo(4.5, 6)
  // Right fuselage
  ctx.lineTo(3.5, 15)
  // Right tail
  ctx.lineTo(11, 21)
  ctx.lineTo(9, 23)
  ctx.lineTo(0, 19)
  // Left tail
  ctx.lineTo(-9, 23)
  ctx.lineTo(-11, 21)
  ctx.lineTo(-3.5, 15)
  // Left fuselage
  ctx.lineTo(-4.5, 6)
  // Left wing
  ctx.lineTo(-22, 11)
  ctx.lineTo(-24, 7)
  ctx.lineTo(-4, -4)
  ctx.lineTo(-3, -12)
  ctx.closePath()

  ctx.fill()
  ctx.stroke()

  // Cockpit dot
  ctx.beginPath()
  ctx.arc(0, -11, 2, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  ctx.restore()

  return ctx.getImageData(0, 0, size, size)
}

function registerMapIcons(map: MapType) {
  MAP_ICONS.forEach(({ id, emoji, bg, border }) => {
    if (map.hasImage(id)) return
    const imgData = createIconImage(emoji, bg, border)
    if (imgData) {
      map.addImage(id, imgData, { pixelRatio: 2 })
    }
  })

  if (!map.hasImage('aircraft-icon')) {
    const planeData = createAircraftIconImage()
    if (planeData) {
      map.addImage('aircraft-icon', planeData, { pixelRatio: 2 })
    }
  }

  if (!map.hasImage('aircraft-icon-selected')) {
    const selectedPlaneData = createAircraftSelectedIconImage()
    if (selectedPlaneData) {
      map.addImage('aircraft-icon-selected', selectedPlaneData, { pixelRatio: 2 })
    }
  }
}

function buildEarthquakeGeoJson(events: EarthquakeEvent[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = events
    .filter(e => e.coordinates?.longitude != null && e.coordinates?.latitude != null)
    .map(e => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [e.coordinates.longitude, e.coordinates.latitude],
      },
      properties: {
        id: e.id,
        magnitude: e.magnitude,
        magFormatted: e.magnitude >= 1.0 ? `M${e.magnitude.toFixed(1)}` : '',
        depth: e.depth,
        place: e.description ?? e.title,
        time: e.observationTime,
        alert: e.alert ?? null,
        tsunami: e.tsunami ? 1 : 0,
        eventData: JSON.stringify(e),
      },
    }))
  return { type: 'FeatureCollection', features }
}

function buildEonetGeoJson(events: UnifiedEvent[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = events
    .filter(e => e.coordinates?.longitude != null && e.coordinates?.latitude != null)
    .map(e => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [e.coordinates.longitude, e.coordinates.latitude],
      },
      properties: {
        id: e.id,
        title: e.title,
        shortTitle: e.title.length > 28 ? `${e.title.slice(0, 26)}…` : e.title,
        category: e.category,
        categoryColor: categoryToColor(e.category),
        iconName: getCategoryIconName(e.category),
        eventData: JSON.stringify(e),
      },
    }))
  return { type: 'FeatureCollection', features }
}

function buildFireGeoJson(hotspots: FireDetectionEvent[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = hotspots
    .filter(h => h.coordinates?.longitude != null && h.coordinates?.latitude != null)
    .map(h => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [h.coordinates.longitude, h.coordinates.latitude],
      },
      properties: {
        id: h.id,
        satellite: h.satellite,
        sensor: h.sensor,
        frp: h.fireRadiativePower ?? 0,
        confidence: h.confidenceLevel,
        eventData: JSON.stringify(h),
      },
    }))
  return { type: 'FeatureCollection', features }
}

function createFlashCardHtml(event: UnifiedEvent): string {
  const isEq = event.category === 'earthquakes'
  const isFire = event.category === 'fireHotspot'
  const timeAgo = getTimeAgo(event.observationTime)

  let badgeText = ''
  let badgeColor = 'var(--eos-cyan)'
  let metricsHtml = ''
  let quickNews = ''
  let locationLabel = ''

  if (isEq) {
    const eq = event as EarthquakeEvent
    const mag = eq.magnitude ?? 0
    badgeColor = mag >= 7 ? '#ff453a' : mag >= 5.5 ? '#ff9f0a' : '#34c759'
    badgeText = `M ${mag.toFixed(1)} Earthquake`
    quickNews = eq.description ?? eq.title
    locationLabel = eq.description ? eq.description.replace(/^[\d\s]+km\s+[NESWnesw]+\s+of\s+/, '') : eq.title
    metricsHtml = `
      <span class="eos-fc-metric">Depth: <strong>${eq.depth != null ? eq.depth.toFixed(0) : '--'} km</strong></span>
      ${eq.felt != null ? `<span class="eos-fc-metric">Felt: <strong>${eq.felt.toLocaleString()}</strong></span>` : ''}
      ${eq.tsunami ? `<span class="eos-fc-metric" style="color:#ff453a; font-weight:700">⚠ Tsunami Alert</span>` : ''}
      ${eq.alert && eq.alert !== 'green' ? `<span class="eos-fc-metric" style="color:${badgeColor}; font-weight:700">PAGER ${eq.alert.toUpperCase()}</span>` : ''}
    `
  } else if (isFire) {
    const fire = event as FireDetectionEvent
    badgeColor = '#ff9f0a'
    badgeText = 'Thermal Anomaly'
    quickNews = `Infrared thermal signature detected by ${fire.satellite ?? 'VIIRS'} (${fire.sensor ?? 'sensor'})`
    locationLabel = `${fire.coordinates.latitude.toFixed(3)}°, ${fire.coordinates.longitude.toFixed(3)}°`
    metricsHtml = `
      ${fire.fireRadiativePower != null ? `<span class="eos-fc-metric">FRP: <strong>${fire.fireRadiativePower.toFixed(1)} MW</strong></span>` : ''}
      <span class="eos-fc-metric">Conf: <strong>${fire.confidenceLevel ?? 'nominal'}</strong></span>
    `
  } else {
    const categoryLabels: Record<string, string> = {
      severeStorms: 'Severe Storm',
      volcanoes: 'Volcano Eruption',
      floods: 'Flood Alert',
      seaIce: 'Sea Ice Dynamic',
      wildfires: 'Wildfire',
    }
    badgeText = categoryLabels[event.category] ?? 'Natural Event'
    badgeColor = categoryToColor(event.category)
    quickNews = event.title
    locationLabel = `${event.coordinates.latitude.toFixed(3)}°, ${event.coordinates.longitude.toFixed(3)}°`
    metricsHtml = `
      <span class="eos-fc-metric">Source: <strong>${event.provider.toUpperCase()}</strong></span>
      <span class="eos-fc-metric">Status: <strong>${event.status ?? 'active'}</strong></span>
    `
  }

  const coords = `${event.coordinates.latitude.toFixed(3)}°${event.coordinates.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(event.coordinates.longitude).toFixed(3)}°${event.coordinates.longitude >= 0 ? 'E' : 'W'}`

  return `
    <div class="eos-flashcard">
      <div class="eos-flashcard-header">
        <span class="eos-flashcard-badge" style="border-color: ${badgeColor}66; background: ${badgeColor}20; color: ${badgeColor}">
          ● ${badgeText}
        </span>
        <span class="eos-flashcard-time">${timeAgo}</span>
      </div>
      <div class="eos-flashcard-body">
        <div class="eos-flashcard-title">${quickNews}</div>
        <div class="eos-flashcard-location">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.75; flex-shrink:0;">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span style="font-weight: 500">${locationLabel || coords}</span>
        </div>
        <div style="font-size: 10px; color: var(--eos-text-tertiary); margin-bottom: 8px; font-variant-numeric: tabular-nums;">
          ${coords}
        </div>
        ${metricsHtml ? `<div class="eos-flashcard-metrics">${metricsHtml}</div>` : ''}
      </div>
      <div class="eos-flashcard-footer">
        <span>Click marker to inspect</span>
        <span class="eos-flashcard-action">3D Orbit ↗</span>
      </div>
    </div>
  `
}

function createPoiFlashCardHtml(poi: GeographicPoi): string {
  const badge = getPoiBadge(poi.category)
  let metricLine = ''
  if (poi.metadata?.elevation) metricLine = `Elevation: <strong>${poi.metadata.elevation.toLocaleString()} m</strong>`
  else if (poi.metadata?.population) metricLine = `Pop: <strong>${(poi.metadata.population / 1000000).toFixed(1)}M</strong>`
  else if (poi.metadata?.capacity) metricLine = `Capacity: <strong>${poi.metadata.capacity}</strong>`
  else if (poi.metadata?.iataCode) metricLine = `IATA: <strong>${poi.metadata.iataCode}</strong>`
  else if (poi.metadata?.unescoYear) metricLine = `UNESCO Inscribed: <strong>Year ${poi.metadata.unescoYear}</strong>`

  const coords = `${poi.coordinates.latitude.toFixed(3)}°${poi.coordinates.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(poi.coordinates.longitude).toFixed(3)}°${poi.coordinates.longitude >= 0 ? 'E' : 'W'}`

  return `
    <div class="eos-flashcard">
      <div class="eos-flashcard-header">
        <span class="eos-flashcard-badge" style="border-color: ${badge.color}66; background: ${badge.color}20; color: ${badge.color}">
          ${badge.emoji} ${badge.label}
        </span>
        <span class="eos-flashcard-time">${poi.country}</span>
      </div>
      <div class="eos-flashcard-body">
        <div class="eos-flashcard-title">${poi.name}</div>
        <div class="eos-flashcard-location" style="margin-top: 4px; margin-bottom: 4px;">
          <span style="font-size: 11px; color: var(--eos-text-secondary); line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${poi.description}
          </span>
        </div>
        <div style="font-size: 10px; color: var(--eos-text-tertiary); margin-bottom: 6px; font-variant-numeric: tabular-nums;">
          ${coords}
        </div>
        ${metricLine ? `<div class="eos-flashcard-metrics"><span class="eos-fc-metric">${metricLine}</span></div>` : ''}
      </div>
      <div class="eos-flashcard-footer">
        <span>Click marker to inspect</span>
        <span class="eos-flashcard-action">3D Explore ↗</span>
      </div>
    </div>
  `
}

function buildFlightsGeoJson(
  flights: LiveFlight[],
  options?: {
    airlineFilter?: string
    altitudeFilter?: string
    typeFilter?: string
    searchQuery?: string
  }
): GeoJSON.FeatureCollection {
  let list = flights.filter(f => f.longitude != null && f.latitude != null)

  const { airlineFilter, altitudeFilter, typeFilter, searchQuery } = options || {}

  if (airlineFilter && airlineFilter !== 'all') {
    const af = airlineFilter.toLowerCase()
    list = list.filter(f =>
      (f.airlineCode && f.airlineCode.toLowerCase() === af) ||
      (f.airline && f.airline.toLowerCase().includes(af))
    )
  }

  if (altitudeFilter && altitudeFilter !== 'all') {
    if (altitudeFilter === 'high') {
      list = list.filter(f => (f.altitudeFeet ?? 0) >= 30000)
    } else if (altitudeFilter === 'mid') {
      list = list.filter(f => (f.altitudeFeet ?? 0) >= 10000 && (f.altitudeFeet ?? 0) < 30000)
    } else if (altitudeFilter === 'low') {
      list = list.filter(f => (f.altitudeFeet ?? 0) > 0 && (f.altitudeFeet ?? 0) < 10000)
    } else if (altitudeFilter === 'ground') {
      list = list.filter(f => f.onGround || (f.altitudeFeet ?? 0) <= 0)
    }
  }

  if (typeFilter && typeFilter !== 'all') {
    if (typeFilter === 'heavy') {
      list = list.filter(f => (f.aircraftType || '').toLowerCase().includes('wide-body') || (f.aircraftType || '').toLowerCase().includes('heavy'))
    } else if (typeFilter === 'medium') {
      list = list.filter(f => (f.aircraftType || '').toLowerCase().includes('narrow-body') || (f.aircraftType || '').toLowerCase().includes('commercial'))
    } else if (typeFilter === 'turboprop') {
      list = list.filter(f => (f.aircraftType || '').toLowerCase().includes('turboprop') || (f.aircraftType || '').toLowerCase().includes('regional'))
    } else if (typeFilter === 'general') {
      list = list.filter(f => (f.aircraftType || '').toLowerCase().includes('general') || (f.aircraftType || '').toLowerCase().includes('private'))
    }
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim()
    list = list.filter(f =>
      (f.callsign || '').toLowerCase().includes(q) ||
      (f.flightNumber || '').toLowerCase().includes(q) ||
      (f.airline || '').toLowerCase().includes(q) ||
      (f.originCountry || '').toLowerCase().includes(q) ||
      (f.icao24 || '').toLowerCase().includes(q)
    )
  }

  const nowSec = Math.floor(Date.now() / 1000)
  const features: GeoJSON.Feature[] = list.map(f => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [f.longitude, f.latitude],
    },
    properties: {
      id: f.icao24,
      callsign: f.callsign || f.flightNumber || 'UNKNOWN',
      airline: f.airline || 'Unknown Airline',
      airlineCode: f.airlineCode || '',
      aircraftType: f.aircraftType || '',
      originCountry: f.originCountry || '',
      altitudeFeet: f.altitudeFeet,
      groundSpeedKnots: f.groundSpeedKnots,
      heading: f.heading ?? 0,
      confirmedHeading: f.heading ?? 0,
      confirmedLat: f.latitude,
      confirmedLon: f.longitude,
      confirmedTime: f.lastPositionUpdate || nowSec,
      verticalRateFpm: f.verticalRateFpm,
      onGround: f.onGround ? 1 : 0,
      squawk: f.squawk || '',
      flightData: JSON.stringify(f),
    },
  }))
  return { type: 'FeatureCollection', features }
}

function buildFlightTrailGeoJson(trail: Array<[number, number]>): GeoJSON.FeatureCollection {
  if (!trail || trail.length < 2) return { type: 'FeatureCollection', features: [] }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: trail,
        },
        properties: {},
      },
    ],
  }
}

function createFlightFlashCardHtml(flight: LiveFlight): string {
  const altText = flight.altitudeFeet != null ? `${flight.altitudeFeet.toLocaleString()} ft` : 'Surface'
  const spdText = flight.groundSpeedKnots != null ? `${flight.groundSpeedKnots} kts` : 'Stationary'
  const hdgText = flight.heading != null ? `${flight.heading}°` : 'N/A'
  const vsiText = flight.verticalRateFpm != null
    ? (flight.verticalRateFpm > 100 ? `+${flight.verticalRateFpm} fpm (Climbing ↑)` : flight.verticalRateFpm < -100 ? `${flight.verticalRateFpm} fpm (Descending ↓)` : 'Level Flight')
    : 'Level'

  return `
    <div class="eos-flashcard">
      <div class="eos-flashcard-header">
        <span class="eos-flashcard-badge" style="border-color: #00d4ff66; background: rgba(0,212,255,0.15); color: #00d4ff">
          ✈ ${flight.onGround ? 'Surface' : 'Airborne Aircraft'}
        </span>
        <span class="eos-flashcard-time">${flight.positionSource || 'ADS-B'}</span>
      </div>
      <div class="eos-flashcard-body">
        <div class="eos-flashcard-title" style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 2px;">
          <span style="font-weight:700; color:var(--eos-text-primary); font-size:13px;">${flight.callsign}</span>
          ${flight.airlineCode ? `<span style="font-size:10px; color:var(--eos-cyan); font-weight:700;">${flight.airlineCode}</span>` : ''}
        </div>
        <div style="font-size:11px; color:var(--eos-text-secondary); margin-bottom:6px; font-weight:500;">
          ${flight.airline} · ${flight.originCountry}
        </div>
        <div class="eos-flashcard-metrics" style="display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:10px;">
          <span class="eos-fc-metric">Alt: <strong>${altText}</strong></span>
          <span class="eos-fc-metric">Spd: <strong>${spdText}</strong></span>
          <span class="eos-fc-metric">Hdg: <strong>${hdgText}</strong></span>
          <span class="eos-fc-metric">VSI: <strong>${vsiText}</strong></span>
        </div>
        <div class="eos-flashcard-location" style="margin-top:6px; display:flex; justify-content:space-between; align-items:center;">
          <span>${flight.latitude.toFixed(3)}°, ${flight.longitude.toFixed(3)}°</span>
          <span style="color:var(--eos-cyan); font-weight:600; font-size:10px;">Click to Inspect ↗</span>
        </div>
      </div>
    </div>
  `
}

function applyMapModeToMap(map: any, mode: string) {
  if (!map || !map.isStyleLoaded()) return

  const isGlobe = mode === 'globe'
  const isSatellite = mode === 'satellite'
  const isHybrid = mode === 'hybrid'
  const isTerrain = mode === 'terrain'

  // Globe / Dark Base
  if (map.getLayer('nasa-ocean-basemap')) {
    map.setLayoutProperty('nasa-ocean-basemap', 'visibility', isGlobe ? 'visible' : 'none')
  }
  if (map.getLayer('esri-dark-basemap')) {
    map.setLayoutProperty('esri-dark-basemap', 'visibility', isGlobe ? 'visible' : 'none')
  }

  // Satellite Base
  if (map.getLayer('esri-satellite-basemap')) {
    map.setLayoutProperty('esri-satellite-basemap', 'visibility', (isSatellite || isHybrid) ? 'visible' : 'none')
  }

  // Terrain Base
  if (map.getLayer('esri-terrain-basemap')) {
    map.setLayoutProperty('esri-terrain-basemap', 'visibility', isTerrain ? 'visible' : 'none')
  }

  // Hybrid Overlays
  if (map.getLayer('esri-boundaries-overlay')) {
    map.setLayoutProperty('esri-boundaries-overlay', 'visibility', (isHybrid || isTerrain) ? 'visible' : 'none')
  }
  if (map.getLayer('esri-transportation-overlay')) {
    map.setLayoutProperty('esri-transportation-overlay', 'visibility', isHybrid ? 'visible' : 'none')
  }
}

interface GlobeProps {
  earthquakes: EarthquakeEvent[]
  eonetEvents: UnifiedEvent[]
  fireHotspots: FireDetectionEvent[]
}

export function Globe({ earthquakes, eonetEvents, fireHotspots }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapType | null>(null)
  const popupRef = useRef<any>(null)
  const hudRef = useRef<HTMLDivElement>(null)
  const hudCoordsRef = useRef<HTMLSpanElement>(null)
  const hudEventsRef = useRef<HTMLSpanElement>(null)

  const earthquakesRef = useRef(earthquakes)
  const eonetEventsRef = useRef(eonetEvents)
  const fireHotspotsRef = useRef(fireHotspots)

  const {
    setGlobeReady,
    setSelectedEvent,
    setSelectedPoi,
    activeLayers,
    visualizationMode,
    flyToTarget,
    clearFlyTo,
    activeSatelliteLayer,
    satelliteOpacity,
    mapMode,
    userLocation,
    activeModule,
    flights,
    flightTrackingActive,
    flightMarkersVisible,
    flightShowTrails,
    flightAirlineFilter,
    flightAltitudeFilter,
    flightAircraftTypeFilter,
    flightSearchQuery,
    setMapBounds,
    selectedFlight,
    setSelectedFlight,
    flightTrailMap,
  } = useEarthOsStore()

  const activeLayersRef = useRef(activeLayers)
  const activeModuleRef = useRef(activeModule)
  const flightGeoJsonRef = useRef<GeoJSON.FeatureCollection | null>(null)
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    activeModuleRef.current = activeModule
  }, [activeModule])

  useEffect(() => {
    earthquakesRef.current = earthquakes
  }, [earthquakes])

  useEffect(() => {
    eonetEventsRef.current = eonetEvents
  }, [eonetEvents])

  useEffect(() => {
    fireHotspotsRef.current = fireHotspots
  }, [fireHotspots])

  useEffect(() => {
    activeLayersRef.current = activeLayers
  }, [activeLayers])

  // ─── Initialize Map ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let mounted = true

    async function initMap() {
      const ml = await import('maplibre-gl')

      if (!mounted || !containerRef.current) return

      // Configure MapLibre Web Worker URL explicitly for Next.js to prevent 404 Worker loading errors
      const workerUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/maplibre-gl-worker.mjs`
        : '/maplibre-gl-worker.mjs'

      if (typeof (ml as any).setWorkerUrl === 'function') {
        ;(ml as any).setWorkerUrl(workerUrl)
      }
      if ((ml as any).config) {
        ;(ml as any).config.WORKER_URL = workerUrl
      }

      const mapOptions: any = {
        container: containerRef.current,
        style: BASEMAP_STYLE,
        center: [0, 20],
        zoom: 1.5,
        minZoom: 1.0,
        maxZoom: 19,
        bearing: 0,
        pitch: 0,
        maxPitch: 60,
        minPitch: 0,
        renderWorldCopies: true,
        dragRotate: true,
        fadeDuration: 0,
        attributionControl: {
          compact: true,
          customAttribution: 'Data: USGS · NASA GIBS · NASA EONET · NASA FIRMS · Esri · OpenStreetMap',
        },
      }

      // Try setting globe projection if available in MapLibre version
      try {
        mapOptions.projection = { type: 'globe' }
      } catch {}

      const map = new ml.Map(mapOptions)
      mapRef.current = map
      if (typeof window !== 'undefined') {
        ;(window as any).__EOS_MAP__ = map
        ;(window as any).__EOS_STORE__ = useEarthOsStore
      }

      // Graceful error logging (prevents transient tile drops from interrupting render)
      map.on('error', (e) => {
        if (e?.error?.message?.includes('404') || e?.error?.message?.includes('Failed to fetch')) {
          return
        }
      })

      // Handle any dynamically missing icon by generating it on the fly
      map.on('styleimagemissing', (e) => {
        if (e.id === 'aircraft-icon') {
          const planeData = createAircraftIconImage()
          if (planeData && !map.hasImage(e.id)) {
            map.addImage(e.id, planeData, { pixelRatio: 2 })
          }
          return
        }

        if (e.id === 'aircraft-icon-selected') {
          const selectedPlaneData = createAircraftSelectedIconImage()
          if (selectedPlaneData && !map.hasImage(e.id)) {
            map.addImage(e.id, selectedPlaneData, { pixelRatio: 2 })
          }
          return
        }

        const iconDef = MAP_ICONS.find(d => d.id === e.id)
        if (iconDef) {
          const imgData = createIconImage(iconDef.emoji, iconDef.bg, iconDef.border)
          if (imgData && !map.hasImage(e.id)) {
            map.addImage(e.id, imgData, { pixelRatio: 2 })
          }
        } else {
          const imgData = createIconImage('📍', '#64748b', '#ffffff')
          if (imgData && !map.hasImage(e.id)) {
            map.addImage(e.id, imgData, { pixelRatio: 2 })
          }
        }
      })

      map.on('load', () => {
        if (!mounted) return

        // ─── Register High-DPI Visual Map Icons ───────────────────────────
        registerMapIcons(map)

        // ─── Apply Initial Map Mode (Globe / Satellite / Hybrid / Terrain) ─
        applyMapModeToMap(map, useEarthOsStore.getState().mapMode)

        // ─── Add atmosphere/fog effect if supported ──────────────────────
        if (typeof (map as any).setFog === 'function') {
          (map as any).setFog({
            color: 'rgb(10, 15, 30)',
            'high-color': 'rgb(0, 50, 120)',
            'horizon-blend': 0.1,
            'space-color': 'rgb(5, 7, 13)',
            'star-intensity': 0.6,
          })
        }

        // ─── Earthquake source & layers ───────────────────────────────────
        map.addSource('earthquakes', {
          type: 'geojson',
          data: buildEarthquakeGeoJson(earthquakesRef.current),
          cluster: true,
          clusterMaxZoom: 6,
          clusterRadius: 40,
        })

        // Earthquake Heatmap
        map.addLayer({
          id: 'earthquake-heatmap',
          type: 'heatmap',
          source: 'earthquakes',
          maxzoom: 8,
          layout: { visibility: 'none' },
          paint: {
            'heatmap-weight': [
              'interpolate', ['linear'], ['get', 'magnitude'],
              1, 0.1,
              5, 0.5,
              7, 1.0,
            ],
            'heatmap-intensity': [
              'interpolate', ['linear'], ['zoom'],
              0, 1,
              8, 2.5,
            ],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.2, 'rgba(234,179,8,0.3)',
              0.5, 'rgba(249,115,22,0.6)',
              0.8, 'rgba(239,68,68,0.85)',
              1, 'rgba(185,28,28,0.95)',
            ],
            'heatmap-radius': [
              'interpolate', ['linear'], ['zoom'],
              0, 16,
              8, 35,
            ],
            'heatmap-opacity': 0.85,
          },
        })

        // Cluster circles
        map.addLayer({
          id: 'earthquake-clusters',
          type: 'circle',
          source: 'earthquakes',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#f59e0b', 10,
              '#f97316', 50,
              '#ef4444',
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              12, 10, 16, 50, 20,
            ],
            'circle-opacity': 0.85,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#ffffff',
          },
        })

        // Cluster count labels
        map.addLayer({
          id: 'earthquake-cluster-count',
          type: 'symbol',
          source: 'earthquakes',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 11,
            'text-font': ['Noto Sans Regular'],
          },
          paint: {
            'text-color': '#fff',
          },
        })

        // Individual earthquake backdrop glowing pulse
        map.addLayer({
          id: 'earthquake-points',
          type: 'circle',
          source: 'earthquakes',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              0, ['interpolate', ['linear'], ['get', 'magnitude'], 1, 5, 9, 14],
              8, ['interpolate', ['linear'], ['get', 'magnitude'], 1, 9, 9, 26],
            ],
            'circle-color': [
              'interpolate', ['linear'], ['get', 'magnitude'],
              1, '#10b981',
              3, '#84cc16',
              4, '#eab308',
              5, '#f59e0b',
              6, '#f97316',
              7, '#ef4444',
            ],
            'circle-opacity': 0.35,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.6,
          },
        })

        // Dedicated Earthquake Visual Icon layer
        map.addLayer({
          id: 'earthquake-icons',
          type: 'symbol',
          source: 'earthquakes',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': [
              'step',
              ['get', 'magnitude'],
              'icon-earthquake',
              6.0, 'icon-earthquake-major',
            ],
            'icon-size': [
              'interpolate', ['linear'], ['zoom'],
              0, 0.75,
              4, 0.95,
              8, 1.25,
            ],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          },
        })

        // Individual earthquake magnitude labels on the map
        map.addLayer({
          id: 'earthquake-labels',
          type: 'symbol',
          source: 'earthquakes',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'text-field': ['get', 'magFormatted'],
            'text-size': [
              'interpolate', ['linear'], ['zoom'],
              1, 8.5,
              4, 10,
              8, 12,
            ],
            'text-font': ['Noto Sans Regular'],
            'text-offset': [0, 1.3],
            'text-anchor': 'top',
            'text-allow-overlap': false,
            'text-optional': true,
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': 'rgba(0, 0, 0, 0.95)',
            'text-halo-width': 1.5,
          },
        })

        // ─── EONET Events source & layers ──────────────────────────────────
        map.addSource('eonet-events', {
          type: 'geojson',
          data: buildEonetGeoJson(eonetEventsRef.current),
        })

        map.addLayer({
          id: 'eonet-points',
          type: 'circle',
          source: 'eonet-events',
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              0, 6,
              8, 14,
            ],
            'circle-color': ['get', 'categoryColor'],
            'circle-opacity': 0.35,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.6,
          },
        })

        // Visible EONET category icons (Storms 🌀, Volcanoes 🌋, Wildfires 🔥, Floods 🌊, Sea Ice 🧊)
        map.addLayer({
          id: 'eonet-icons',
          type: 'symbol',
          source: 'eonet-events',
          layout: {
            'icon-image': ['get', 'iconName'],
            'icon-size': [
              'interpolate', ['linear'], ['zoom'],
              0, 0.7,
              4, 0.88,
              8, 1.2,
            ],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          },
        })

        // EONET event label text
        map.addLayer({
          id: 'eonet-labels',
          type: 'symbol',
          source: 'eonet-events',
          minzoom: 2,
          layout: {
            'text-field': ['get', 'shortTitle'],
            'text-size': [
              'interpolate', ['linear'], ['zoom'],
              2, 9,
              6, 11,
              10, 13,
            ],
            'text-font': ['Noto Sans Regular'],
            'text-offset': [0, 1.35],
            'text-anchor': 'top',
            'text-max-width': 12,
            'text-optional': true,
            'text-allow-overlap': false,
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': 'rgba(0, 0, 0, 0.95)',
            'text-halo-width': 1.6,
          },
        })

        // ─── Fire hotspot source & layers ──────────────────────────────────
        map.addSource('fire-hotspots', {
          type: 'geojson',
          data: buildFireGeoJson(fireHotspotsRef.current),
        })

        map.addLayer({
          id: 'fire-heatmap',
          type: 'heatmap',
          source: 'fire-hotspots',
          maxzoom: 8,
          paint: {
            'heatmap-weight': [
              'interpolate', ['linear'], ['get', 'frp'],
              0, 0.3,
              500, 1,
            ],
            'heatmap-intensity': [
              'interpolate', ['linear'], ['zoom'],
              0, 1, 8, 2,
            ],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(249,115,22,0)',
              0.3, 'rgba(249,115,22,0.4)',
              0.6, 'rgba(239,68,68,0.6)',
              1, 'rgba(239,68,68,0.9)',
            ],
            'heatmap-radius': 20,
            'heatmap-opacity': 0.75,
          },
        })

        map.addLayer({
          id: 'fire-points',
          type: 'circle',
          source: 'fire-hotspots',
          minzoom: 4,
          paint: {
            'circle-radius': 5,
            'circle-color': '#f97316',
            'circle-opacity': 0.8,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#ffd60a',
          },
        })

        // Visible Fire 🔥 Icons on the map (available at all zoom levels)
        map.addLayer({
          id: 'fire-icons',
          type: 'symbol',
          source: 'fire-hotspots',
          layout: {
            'icon-image': 'icon-fire',
            'icon-size': [
              'interpolate', ['linear'], ['zoom'],
              0, 0.65,
              3, 0.8,
              6, 1.05,
              9, 1.3,
            ],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          },
        })

        // ─── Permanent Points of Interest (POIs) source & layers ───────────
        map.addSource('globe-pois', {
          type: 'geojson',
          data: getPoisGeoJson(activeLayersRef.current),
        })

        // POI Icons layer
        map.addLayer({
          id: 'poi-icons',
          type: 'symbol',
          source: 'globe-pois',
          layout: {
            'icon-image': ['get', 'iconName'],
            'icon-size': [
              'interpolate', ['linear'], ['zoom'],
              0, 0.72,
              3, 0.88,
              7, 1.15,
              12, 1.4,
            ],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          },
        })

        // POI Labels layer
        map.addLayer({
          id: 'poi-labels',
          type: 'symbol',
          source: 'globe-pois',
          minzoom: 2,
          layout: {
            'text-field': ['get', 'shortName'],
            'text-size': [
              'interpolate', ['linear'], ['zoom'],
              2, 9,
              5, 10.5,
              8, 12,
            ],
            'text-font': ['Noto Sans Regular'],
            'text-offset': [0, 1.3],
            'text-anchor': 'top',
            'text-max-width': 10,
            'text-optional': true,
            'text-allow-overlap': false,
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': 'rgba(5, 7, 13, 0.95)',
            'text-halo-width': 1.6,
          },
        })

        // ─── Satellite imagery layer ──────────────────────────────────────
        map.addSource('gibs-imagery', {
          type: 'raster',
          tiles: [],
          tileSize: 256,
        })

        map.addLayer({
          id: 'gibs-layer',
          type: 'raster',
          source: 'gibs-imagery',
          layout: { visibility: 'none' },
          paint: { 'raster-opacity': 0.8 },
        })

        // ─── Interactive Hover Flash Card Popup ───────────────────────────
        const popup = new ml.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'eos-map-flashcard',
          offset: 14,
          maxWidth: '320px',
        })
        popupRef.current = popup

        const eventLayers = [
          'earthquake-points',
          'earthquake-icons',
          'earthquake-labels',
          'eonet-points',
          'eonet-icons',
          'fire-points',
          'fire-icons',
        ]

        let hoveredEventId: string | null = null
        eventLayers.forEach(layerId => {
          map.on('mousemove', layerId, (e) => {
            if (!e.features?.length) return
            map.getCanvas().style.cursor = 'pointer'

            const feature = e.features[0]
            const props = feature.properties ?? {}
            if (!props.eventData) return

            try {
              const event: UnifiedEvent = JSON.parse(props.eventData)
              if (!event.coordinates || event.id === hoveredEventId) return
              hoveredEventId = event.id

              const html = createFlashCardHtml(event)
              popup
                .setLngLat([event.coordinates.longitude, event.coordinates.latitude])
                .setHTML(html)
                .addTo(map)
            } catch (err) {}
          })

          map.on('mouseleave', layerId, () => {
            map.getCanvas().style.cursor = ''
            hoveredEventId = null
            popup.remove()
          })

          map.on('click', layerId, (e) => {
            popup.remove()
            if (!e.features?.length) return
            const feature = e.features[0]
            const props = feature.properties ?? {}
            if (!props.eventData) return

            try {
              const event: UnifiedEvent = JSON.parse(props.eventData)
              if (event.id) {
                setSelectedEvent(event)
                map.flyTo({
                  center: [event.coordinates.longitude, event.coordinates.latitude],
                  zoom: Math.max(map.getZoom(), 6),
                  duration: 1000,
                })
              }
            } catch (err) {}
          })
        })

        // ─── POI Layer Interactive Hover & Click ───────────────────────────
        let hoveredPoiId: string | null = null
        const poiInteractiveLayers = ['poi-icons', 'poi-labels']
        poiInteractiveLayers.forEach(layerId => {
          map.on('mousemove', layerId, (e) => {
            if (!e.features?.length) return
            map.getCanvas().style.cursor = 'pointer'

            const feature = e.features[0]
            const props = feature.properties ?? {}
            if (!props.poiData) return

            try {
              const poi: GeographicPoi = JSON.parse(props.poiData)
              if (poi.id === hoveredPoiId) return
              hoveredPoiId = poi.id

              const html = createPoiFlashCardHtml(poi)
              popup
                .setLngLat([poi.coordinates.longitude, poi.coordinates.latitude])
                .setHTML(html)
                .addTo(map)
            } catch (err) {}
          })

          map.on('mouseleave', layerId, () => {
            map.getCanvas().style.cursor = ''
            hoveredPoiId = null
            popup.remove()
          })

          map.on('click', layerId, (e) => {
            popup.remove()
            if (!e.features?.length) return
            const feature = e.features[0]
            const props = feature.properties ?? {}
            if (!props.poiData) return

            try {
              const poi: GeographicPoi = JSON.parse(props.poiData)
              setSelectedPoi(poi)
              map.flyTo({
                center: [poi.coordinates.longitude, poi.coordinates.latitude],
                zoom: Math.max(map.getZoom(), 6.5),
                pitch: 35,
                duration: 1200,
              })
            } catch (err) {}
          })
        })

        // ─── User Geolocation Real-Time Marker ────────────────────────────
        map.addSource('user-location', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        })

        // Outer pulse/accuracy radius
        map.addLayer({
          id: 'user-location-accuracy',
          type: 'circle',
          source: 'user-location',
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              1, 6,
              6, 16,
              12, 45,
              16, 95,
            ],
            'circle-color': '#007aff',
            'circle-opacity': 0.16,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#007aff',
            'circle-stroke-opacity': 0.5,
          },
        })

        // Inner crisp Apple Blue location dot
        map.addLayer({
          id: 'user-location-dot',
          type: 'circle',
          source: 'user-location',
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              1, 6,
              8, 8,
              14, 10,
            ],
            'circle-color': '#007aff',
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
          },
        })

        // ─── Live Flight Tracking ADS-B Source & Layers ───────────────────
        map.addSource('live-flights', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterMaxZoom: 4,
          clusterRadius: 36,
        })

        map.addSource('live-flights-trails', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })

        // Selected flight trail
        map.addLayer({
          id: 'live-flights-trail-line',
          type: 'line',
          source: 'live-flights-trails',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            visibility: 'none',
          },
          paint: {
            'line-color': '#00d4ff',
            'line-width': 2.8,
            'line-opacity': 0.9,
            'line-dasharray': [2, 1],
          },
        })

        // Selected flight great circle route and airport pins
        map.addSource('selected-flight-route', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })

        map.addLayer({
          id: 'selected-flight-route-line',
          type: 'line',
          source: 'selected-flight-route',
          filter: ['==', ['get', 'kind'], 'route'],
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            visibility: 'none',
          },
          paint: {
            'line-color': '#00f0ff',
            'line-width': 3.2,
            'line-dasharray': [2, 2],
            'line-opacity': 0.95,
          },
        })

        map.addLayer({
          id: 'selected-flight-airport-pins',
          type: 'circle',
          source: 'selected-flight-route',
          filter: ['!=', ['get', 'kind'], 'route'],
          layout: {
            visibility: 'none',
          },
          paint: {
            'circle-color': [
              'case',
              ['==', ['get', 'kind'], 'origin'],
              '#10b981',
              '#ffcc00',
            ],
            'circle-radius': 7,
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
          },
        })

        map.addLayer({
          id: 'selected-flight-airport-labels',
          type: 'symbol',
          source: 'selected-flight-route',
          filter: ['!=', ['get', 'kind'], 'route'],
          layout: {
            'text-field': ['get', 'title'],
            'text-size': 12,
            'text-offset': [0, 1.4],
            'text-anchor': 'top',
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            visibility: 'none',
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': 'rgba(10, 15, 26, 0.95)',
            'text-halo-width': 2.4,
          },
        })

        // Clustered aircraft circles at low zoom (global view)
        map.addLayer({
          id: 'live-flights-clusters',
          type: 'circle',
          source: 'live-flights',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#f59e0b',
              25, '#d97706',
              100, '#b45309',
              500, '#dc2626',
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              16,
              25, 20,
              100, 25,
              500, 32,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.92,
          },
          layout: {
            visibility: 'none',
          },
        })

        // Cluster count labels
        map.addLayer({
          id: 'live-flights-cluster-count',
          type: 'symbol',
          source: 'live-flights',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 11.5,
            visibility: 'none',
          },
          paint: {
            'text-color': '#ffffff',
          },
        })

        // Click to expand cluster
        map.on('click', 'live-flights-clusters', (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['live-flights-clusters'] })
          const clusterId = features[0]?.properties?.cluster_id
          const source = map.getSource('live-flights') as any
          if (source && clusterId != null) {
            source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
              if (err) return
              const coords = (features[0].geometry as any).coordinates
              map.easeTo({ center: coords, zoom: Math.min(zoom + 0.5, 9), duration: 600 })
            })
          }
        })

        map.on('mouseenter', 'live-flights-clusters', () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', 'live-flights-clusters', () => {
          map.getCanvas().style.cursor = ''
        })

        // Unclustered aircraft heading-oriented symbols
        map.addLayer({
          id: 'live-flights-symbols',
          type: 'symbol',
          source: 'live-flights',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': 'aircraft-icon',
            'icon-rotate': ['get', 'heading'],
            'icon-rotation-alignment': 'map',
            'icon-pitch-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-size': [
              'interpolate', ['linear'], ['zoom'],
              1, 0.7,
              3, 0.85,
              6, 1.0,
              9, 1.25,
              13, 1.6,
            ],
            visibility: 'none',
          },
        })

        // Aircraft Callsigns labels at zoom >= 5.5
        map.addLayer({
          id: 'live-flights-labels',
          type: 'symbol',
          source: 'live-flights',
          filter: ['!', ['has', 'point_count']],
          minzoom: 5.5,
          layout: {
            'text-field': ['get', 'callsign'],
            'text-size': 10,
            'text-offset': [0, 1.5],
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            visibility: 'none',
          },
          paint: {
            'text-color': '#ffcc00',
            'text-halo-color': 'rgba(10, 15, 26, 0.95)',
            'text-halo-width': 2.0,
          },
        })

        // Interactive hover and click for live flights
        let hoveredFlightId: string | null = null
        map.on('mousemove', 'live-flights-symbols', (e) => {
          if (!e.features?.length) return
          map.getCanvas().style.cursor = 'pointer'

          const feature = e.features[0]
          const props = feature.properties ?? {}
          if (!props.flightData) return

          try {
            const flight: LiveFlight = JSON.parse(props.flightData)
            if (flight.icao24 === hoveredFlightId) return
            hoveredFlightId = flight.icao24

            const html = createFlightFlashCardHtml(flight)
            popup
              .setLngLat([flight.longitude, flight.latitude])
              .setHTML(html)
              .addTo(map)
          } catch (err) {}
        })

        map.on('mouseleave', 'live-flights-symbols', () => {
          map.getCanvas().style.cursor = ''
          hoveredFlightId = null
          popup.remove()
        })

        map.on('click', 'live-flights-symbols', (e) => {
          popup.remove()
          if (!e.features?.length) return
          const feature = e.features[0]
          const props = feature.properties ?? {}
          if (!props.flightData) return

          try {
            const flight: LiveFlight = JSON.parse(props.flightData)
            setSelectedFlight(flight)
            map.flyTo({
              center: [flight.longitude, flight.latitude],
              zoom: Math.max(map.getZoom(), 7.5),
              pitch: 35,
              bearing: flight.heading || 0,
              duration: 1000,
            })
          } catch (err) {}
        })

        // Track planetary cursor location with direct DOM updates (Zero React re-renders)
        let lastHudUpdate = 0

        map.on('mousemove', (e) => {
          if (map.isMoving() || map.isZooming()) return
          const now = performance.now()
          if (now - lastHudUpdate < 60) return
          lastHudUpdate = now

          const lat = e.lngLat.lat
          const lng = e.lngLat.lng

          if (hudCoordsRef.current) {
            hudCoordsRef.current.textContent = `${lat >= 0 ? lat.toFixed(3) + '°N' : Math.abs(lat).toFixed(3) + '°S'}, ${lng >= 0 ? lng.toFixed(3) + '°E' : Math.abs(lng).toFixed(3) + '°W'}`
          }

          if (hudEventsRef.current) {
            let count = 0
            earthquakesRef.current.forEach((eq) => {
              if (Math.abs(eq.coordinates.latitude - lat) < 4.5 && Math.abs(eq.coordinates.longitude - lng) < 4.5) count++
            })
            eonetEventsRef.current.forEach((ev) => {
              if (Math.abs(ev.coordinates.latitude - lat) < 4.5 && Math.abs(ev.coordinates.longitude - lng) < 4.5) count++
            })
            if (count > 0) {
              hudEventsRef.current.textContent = `⚡ ${count} Active Event${count > 1 ? 's' : ''} in Region`
              hudEventsRef.current.style.display = 'inline-flex'
            } else {
              hudEventsRef.current.style.display = 'none'
            }
          }

          if (hudRef.current && hudRef.current.style.display !== 'flex') {
            hudRef.current.style.display = 'flex'
          }
        })

        map.on('mouseout', () => {
          if (hudRef.current) {
            hudRef.current.style.display = 'none'
          }
        })

        map.on('movestart', () => {
          if (hudRef.current) {
            hudRef.current.style.display = 'none'
          }
        })

        // Viewport bounds updating for live queries (e.g. flights)
        const updateBounds = () => {
          if (!map) return
          const b = map.getBounds()
          setMapBounds({
            north: b.getNorth(),
            south: b.getSouth(),
            west: b.getWest(),
            east: b.getEast(),
          })
        }

        map.on('moveend', () => {
          if (activeModuleRef.current === 'flights') {
            updateBounds()
          }
        })

        updateBounds()

        setGlobeReady(true)
      })
    }

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.resize()
        }
      })
      resizeObserver.observe(containerRef.current)
    }

    initMap().catch(err => {
      console.error('[Globe] Init error:', err)
    })

    return () => {
      mounted = false
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [setGlobeReady, setSelectedEvent, setSelectedPoi])

  // ─── Update Earthquake Data ──────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const source = map.getSource('earthquakes') as GeoJSONSource | undefined
    if (!source) return

    source.setData(buildEarthquakeGeoJson(earthquakes))
  }, [earthquakes])

  // ─── Update EONET Data ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const source = map.getSource('eonet-events') as GeoJSONSource | undefined
    if (!source) return

    source.setData(buildEonetGeoJson(eonetEvents))
  }, [eonetEvents])

  // ─── Update Fire Data ─────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const source = map.getSource('fire-hotspots') as GeoJSONSource | undefined
    if (!source) return

    source.setData(buildFireGeoJson(fireHotspots))
  }, [fireHotspots])

  // ─── Update POI Data on Layer Change ──────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const source = map.getSource('globe-pois') as GeoJSONSource | undefined
    if (!source) return

    source.setData(getPoisGeoJson(activeLayers))
  }, [activeLayers])

  // ─── Layer Visibility & Visualization Mode ───────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    // Base event layer mappings
    const eqVisible = activeLayers.has('earthquakes')
    const firesVisible = activeLayers.has('fireHotspots')
    const eonetVisible = activeLayers.has('eonetEvents')

    // Handle Visualization Mode: 'markers' | 'clusters' | 'heatmap'
    if (visualizationMode === 'heatmap') {
      if (map.getLayer('earthquake-heatmap')) {
        map.setLayoutProperty('earthquake-heatmap', 'visibility', eqVisible ? 'visible' : 'none')
      }
      if (map.getLayer('fire-heatmap')) {
        map.setLayoutProperty('fire-heatmap', 'visibility', firesVisible ? 'visible' : 'none')
      }
      if (map.getLayer('earthquake-clusters')) {
        map.setLayoutProperty('earthquake-clusters', 'visibility', 'none')
      }
      if (map.getLayer('earthquake-cluster-count')) {
        map.setLayoutProperty('earthquake-cluster-count', 'visibility', 'none')
      }
      if (map.getLayer('earthquake-points')) {
        map.setLayoutProperty('earthquake-points', 'visibility', 'none')
      }
      if (map.getLayer('earthquake-icons')) {
        map.setLayoutProperty('earthquake-icons', 'visibility', 'none')
      }
      if (map.getLayer('earthquake-labels')) {
        map.setLayoutProperty('earthquake-labels', 'visibility', 'none')
      }
    } else if (visualizationMode === 'clusters') {
      if (map.getLayer('earthquake-heatmap')) {
        map.setLayoutProperty('earthquake-heatmap', 'visibility', 'none')
      }
      if (map.getLayer('fire-heatmap')) {
        map.setLayoutProperty('fire-heatmap', 'visibility', 'none')
      }
      if (map.getLayer('earthquake-clusters')) {
        map.setLayoutProperty('earthquake-clusters', 'visibility', eqVisible ? 'visible' : 'none')
      }
      if (map.getLayer('earthquake-cluster-count')) {
        map.setLayoutProperty('earthquake-cluster-count', 'visibility', eqVisible ? 'visible' : 'none')
      }
      if (map.getLayer('earthquake-points')) {
        map.setLayoutProperty('earthquake-points', 'visibility', eqVisible ? 'visible' : 'none')
      }
      if (map.getLayer('earthquake-icons')) {
        map.setLayoutProperty('earthquake-icons', 'visibility', eqVisible ? 'visible' : 'none')
      }
      if (map.getLayer('earthquake-labels')) {
        map.setLayoutProperty('earthquake-labels', 'visibility', eqVisible ? 'visible' : 'none')
      }
    } else {
      // 'markers' mode
      if (map.getLayer('earthquake-heatmap')) {
        map.setLayoutProperty('earthquake-heatmap', 'visibility', 'none')
      }
      if (map.getLayer('fire-heatmap')) {
        map.setLayoutProperty('fire-heatmap', 'visibility', 'none')
      }
      if (map.getLayer('earthquake-clusters')) {
        map.setLayoutProperty('earthquake-clusters', 'visibility', 'none')
      }
      if (map.getLayer('earthquake-cluster-count')) {
        map.setLayoutProperty('earthquake-cluster-count', 'visibility', 'none')
      }
      if (map.getLayer('earthquake-points')) {
        map.setLayoutProperty('earthquake-points', 'visibility', eqVisible ? 'visible' : 'none')
      }
      if (map.getLayer('earthquake-icons')) {
        map.setLayoutProperty('earthquake-icons', 'visibility', eqVisible ? 'visible' : 'none')
      }
      if (map.getLayer('earthquake-labels')) {
        map.setLayoutProperty('earthquake-labels', 'visibility', eqVisible ? 'visible' : 'none')
      }
    }

    // EONET & Fire point visibility
    if (map.getLayer('eonet-points')) {
      map.setLayoutProperty('eonet-points', 'visibility', eonetVisible ? 'visible' : 'none')
    }
    if (map.getLayer('eonet-icons')) {
      map.setLayoutProperty('eonet-icons', 'visibility', eonetVisible ? 'visible' : 'none')
    }
    if (map.getLayer('eonet-labels')) {
      map.setLayoutProperty('eonet-labels', 'visibility', eonetVisible ? 'visible' : 'none')
    }
    if (map.getLayer('fire-points')) {
      map.setLayoutProperty('fire-points', 'visibility', firesVisible ? 'visible' : 'none')
    }
    if (map.getLayer('fire-icons')) {
      map.setLayoutProperty('fire-icons', 'visibility', firesVisible ? 'visible' : 'none')
    }
  }, [activeLayers, visualizationMode])

  // ─── Satellite Imagery Layer ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    if (!activeSatelliteLayer) {
      if (map.getLayer('gibs-layer')) {
        map.setLayoutProperty('gibs-layer', 'visibility', 'none')
      }
      return
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]
    const gibsTiles = [
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${activeSatelliteLayer}/default/${dateStr}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    ]

    const source = map.getSource('gibs-imagery') as RasterTileSource | undefined
    if (source) {
      map.removeLayer('gibs-layer')
      map.removeSource('gibs-imagery')

      map.addSource('gibs-imagery', {
        type: 'raster',
        tiles: gibsTiles,
        tileSize: 256,
        attribution: 'Imagery: NASA GIBS (gibs.earthdata.nasa.gov)',
      })

      map.addLayer({
        id: 'gibs-layer',
        type: 'raster',
        source: 'gibs-imagery',
        paint: { 'raster-opacity': satelliteOpacity },
      }, 'earthquake-clusters')
    }
  }, [activeSatelliteLayer, satelliteOpacity])

  // ─── Base Map Mode (Globe / Satellite / Hybrid / Terrain) ───────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    applyMapModeToMap(map, mapMode)
  }, [mapMode])

  // ─── User Geolocation Real-Time Marker Update ───────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const source = map.getSource('user-location') as GeoJSONSource | undefined
    if (!source) return

    if (!userLocation) {
      source.setData({
        type: 'FeatureCollection',
        features: [],
      })
      return
    }

    source.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: userLocation.coords,
          },
          properties: {
            accuracy: userLocation.accuracy,
          },
        },
      ],
    })
  }, [userLocation])

  // ─── Update Live Flights Data ───────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const source = map.getSource('live-flights') as GeoJSONSource | undefined
    if (!source) return

    const isVisible = activeModule === 'flights' && flightTrackingActive && flightMarkersVisible

    const flightLayers = [
      'live-flights-symbols',
      'live-flights-clusters',
      'live-flights-cluster-count',
      'live-flights-labels',
    ]

    if (isVisible && flights.length > 0) {
      const geoJson = buildFlightsGeoJson(flights, {
        airlineFilter: flightAirlineFilter,
        altitudeFilter: flightAltitudeFilter,
        typeFilter: flightAircraftTypeFilter,
        searchQuery: flightSearchQuery,
      })
      flightGeoJsonRef.current = geoJson
      source.setData(geoJson)

      flightLayers.forEach(id => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, 'visibility', 'visible')
        }
      })
    } else {
      flightGeoJsonRef.current = null
      source.setData({ type: 'FeatureCollection', features: [] })
      flightLayers.forEach(id => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, 'visibility', 'none')
        }
      })
    }
  }, [
    flights,
    activeModule,
    flightTrackingActive,
    flightMarkersVisible,
    flightAirlineFilter,
    flightAltitudeFilter,
    flightAircraftTypeFilter,
    flightSearchQuery,
  ])

  // ─── 60 FPS Continuous Aircraft Dead-Reckoning & Position Interpolation ─
  useEffect(() => {
    const isTracking = activeModule === 'flights' && flightTrackingActive && flightMarkersVisible
    if (!isTracking) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      return
    }

    let frameCount = 0
    let lastFpsReport = performance.now()
    let lastSourceUpdateTime = performance.now()

    const animate = (timestamp: number) => {
      // Measure and expose true 60 FPS rendering rate
      frameCount++
      if (timestamp - lastFpsReport >= 1000) {
        const fps = Math.round((frameCount * 1000) / (timestamp - lastFpsReport))
        frameCount = 0
        lastFpsReport = timestamp
        if (typeof window !== 'undefined') {
          ;(window as any).__EOS_FPS__ = fps
        }
      }

      const map = mapRef.current
      const geoJson = flightGeoJsonRef.current

      // Update positions smoothly on the map
      if (map && map.isStyleLoaded() && geoJson && geoJson.features.length > 0) {
        const source = map.getSource('live-flights') as GeoJSONSource | undefined
        // Throttle source.setData to ~30-50 FPS so Web Worker stays responsive without message queue delay
        if (source && timestamp - lastSourceUpdateTime >= 24) {
          lastSourceUpdateTime = timestamp
          const nowSec = Date.now() / 1000
          const MAX_EXTRAPOLATE_SEC = 35 // Stale cutoff horizon: freeze aircraft if no update after 35s

          let hasUpdated = false
          const features = geoJson.features

          for (let i = 0; i < features.length; i++) {
            const feat = features[i]
            const p = feat.properties as any
            if (!p || p.onGround || !p.groundSpeedKnots || p.groundSpeedKnots < 30) {
              continue
            }

            const dt = nowSec - (p.confirmedTime || nowSec)
            if (dt <= 0) continue

            // Stop dead reckoning if observation is older than 35s (prevent flying off indefinitely)
            if (dt > MAX_EXTRAPOLATE_SEC) {
              p.isStale = true
              continue
            }

            p.isStale = false

            // Precise spherical geographic dead-reckoning along heading
            const speedMs = p.groundSpeedKnots * 0.514444
            const distMeters = speedMs * dt
            const headingRad = ((p.confirmedHeading || 0) * Math.PI) / 180

            const baseLat = p.confirmedLat
            const baseLon = p.confirmedLon

            const dLat = (distMeters * Math.cos(headingRad)) / 111139
            const latRad = (baseLat * Math.PI) / 180
            const dLon = (distMeters * Math.sin(headingRad)) / (111139 * Math.cos(latRad))

            const coords = (feat.geometry as GeoJSON.Point).coordinates
            if (coords) {
              coords[0] = baseLon + dLon
              coords[1] = baseLat + dLat
              hasUpdated = true
            }
          }

          if (hasUpdated) {
            source.setData(geoJson)
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [activeModule, flightTrackingActive, flightMarkersVisible])

  // ─── Update Selected Flight Trail & Geodesic Route Arc ──────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    // Update icon image dynamically for selected flight
    if (map.getLayer('live-flights-symbols')) {
      const selectedId = selectedFlight?.icao24 || ''
      map.setLayoutProperty('live-flights-symbols', 'icon-image', [
        'case',
        ['==', ['get', 'id'], selectedId],
        'aircraft-icon-selected',
        'aircraft-icon',
      ])
    }

    const trailSource = map.getSource('live-flights-trails') as GeoJSONSource | undefined
    const routeSource = map.getSource('selected-flight-route') as GeoJSONSource | undefined

    const routeLayerIds = [
      'selected-flight-route-line',
      'selected-flight-airport-pins',
      'selected-flight-airport-labels',
    ]

    if (activeModule === 'flights' && selectedFlight) {
      // 1. Trail
      if (trailSource && flightShowTrails) {
        const trail = flightTrailMap[selectedFlight.icao24] || []
        trailSource.setData(buildFlightTrailGeoJson(trail))
        if (map.getLayer('live-flights-trail-line')) {
          map.setLayoutProperty('live-flights-trail-line', 'visibility', 'visible')
        }
      }

      // 2. Geodesic Route & Airport Pins
      if (routeSource) {
        const routeMetrics = resolveFlightRoute(selectedFlight)
        if (routeMetrics && routeMetrics.routeCoordinates.length > 1) {
          const routeFeatures: GeoJSON.Feature[] = [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: routeMetrics.routeCoordinates,
              },
              properties: { kind: 'route' },
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [routeMetrics.origin.longitude, routeMetrics.origin.latitude],
              },
              properties: {
                kind: 'origin',
                title: `🛫 ${routeMetrics.origin.iata} · ${routeMetrics.origin.city}`,
              },
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [routeMetrics.destination.longitude, routeMetrics.destination.latitude],
              },
              properties: {
                kind: 'destination',
                title: `🛬 ${routeMetrics.destination.iata} · ${routeMetrics.destination.city}`,
              },
            },
          ]
          routeSource.setData({ type: 'FeatureCollection', features: routeFeatures })
          routeLayerIds.forEach(id => {
            if (map.getLayer(id)) {
              map.setLayoutProperty(id, 'visibility', 'visible')
            }
          })
        } else {
          routeSource.setData({ type: 'FeatureCollection', features: [] })
          routeLayerIds.forEach(id => {
            if (map.getLayer(id)) {
              map.setLayoutProperty(id, 'visibility', 'none')
            }
          })
        }
      }
    } else {
      // Clear trail
      if (trailSource) {
        trailSource.setData({ type: 'FeatureCollection', features: [] })
        if (map.getLayer('live-flights-trail-line')) {
          map.setLayoutProperty('live-flights-trail-line', 'visibility', 'none')
        }
      }
      // Clear route
      if (routeSource) {
        routeSource.setData({ type: 'FeatureCollection', features: [] })
        routeLayerIds.forEach(id => {
          if (map.getLayer(id)) {
            map.setLayoutProperty(id, 'visibility', 'none')
          }
        })
      }
    }
  }, [selectedFlight, flightTrailMap, flightShowTrails, activeModule])

  // ─── Fly-to Target ───────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !flyToTarget) return

    map.flyTo({
      center: flyToTarget.center,
      zoom: flyToTarget.zoom,
      bearing: flyToTarget.bearing,
      pitch: flyToTarget.pitch,
      duration: 1500,
      essential: true,
    })

    clearFlyTo()
  }, [flyToTarget, clearFlyTo])

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100%', background: '#05070d' }}
      aria-label="Interactive 3D Earth globe"
      role="application"
    >
      {/* Precision Cursor Telemetry HUD — Pure DOM driven for 60 FPS buttery-smooth performance */}
      <div ref={hudRef} className="eos-cursor-telemetry-hud" style={{ display: 'none' }}>
        <span className="eos-hud-pulse" />
        <span ref={hudCoordsRef} style={{ fontFamily: 'var(--eos-font-mono)' }} />
        <span ref={hudEventsRef} style={{ color: 'var(--eos-cyan)', fontWeight: 600, display: 'none', marginLeft: 8 }} />
      </div>
    </div>
  )
}
