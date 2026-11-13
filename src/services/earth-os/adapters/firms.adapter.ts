// NASA FIRMS Adapter
// CRITICAL: These are satellite thermal anomaly DETECTIONS, NOT confirmed wildfires

import type { FireDetectionEvent, DataFreshness } from '@/types/earth-os'
import type { FirmsHotspot } from '../schemas'

function normalizeConfidence(
  raw: string | number,
  instrument: string
): { level: 'low' | 'nominal' | 'high'; numeric: number } {
  // VIIRS uses n/l/h
  if (typeof raw === 'string') {
    if (raw === 'h' || raw === 'high') return { level: 'high', numeric: 0.9 }
    if (raw === 'l' || raw === 'low') return { level: 'low', numeric: 0.3 }
    if (raw === 'n' || raw === 'nominal') return { level: 'nominal', numeric: 0.6 }
    // Try numeric string
    const n = parseInt(raw, 10)
    if (!isNaN(n)) return normalizeConfidence(n, instrument)
    return { level: 'nominal', numeric: 0.5 }
  }
  // MODIS uses 0-100
  if (raw >= 80) return { level: 'high', numeric: raw / 100 }
  if (raw >= 50) return { level: 'nominal', numeric: raw / 100 }
  return { level: 'low', numeric: raw / 100 }
}

function formatAcqTime(timeStr: string): string {
  // FIRMS time is HHMM
  const padded = timeStr.padStart(4, '0')
  return `${padded.slice(0, 2)}:${padded.slice(2)}` 
}

export function normalizeFirmsHotspot(
  hotspot: FirmsHotspot,
  fetchedAt: string,
  freshness: DataFreshness = 'live'
): FireDetectionEvent {
  const { latitude, longitude, acq_date, acq_time, satellite, confidence, frp } = hotspot
  
  const conf = normalizeConfidence(confidence, hotspot.instrument ?? satellite)
  const timeStr = formatAcqTime(acq_time)
  const observationTime = `${acq_date}T${timeStr}:00Z`

  // Determine sensor type
  let sensor: FireDetectionEvent['sensor'] = satellite
  if (satellite === 'N' || satellite === 'N20' || satellite.includes('NOAA')) {
    sensor = 'VIIRS_NOAA20'
  } else if (satellite === 'S' || satellite === 'NPP' || satellite.includes('SNPP') || satellite.includes('Suomi')) {
    sensor = 'VIIRS_SNPP'
  } else if (satellite === 'T' || satellite === 'A' || satellite.includes('Terra') || satellite.includes('Aqua') || satellite.includes('MODIS')) {
    sensor = 'MODIS'
  }

  const id = `firms:${satellite}:${latitude.toFixed(5)}:${longitude.toFixed(5)}:${acq_date}:${acq_time}`

  return {
    id,
    provider: 'firms',
    providerId: id,
    // CRITICAL LABEL: This is a thermal anomaly detection, not a confirmed wildfire
    category: 'fireHotspot',
    title: `Satellite Fire Detection — ${satellite}`,
    description: `Thermal anomaly detected by ${satellite} satellite. Confidence: ${conf.level}. This is a satellite detection, not a confirmed wildfire.`,
    geometry: { type: 'Point', coordinates: [longitude, latitude] },
    coordinates: { longitude, latitude },
    measurement: frp ?? undefined,
    measurementUnit: frp ? 'MW (Fire Radiative Power)' : undefined,
    observationTime,
    fetchedAt,
    confidence: conf.numeric,
    severity: conf.level === 'high' ? 'high' : conf.level === 'nominal' ? 'moderate' : 'low',
    status: 'open',
    freshness,
    // Fire detection specific
    sensor,
    satellite,
    acquisitionDate: acq_date,
    acquisitionTime: acq_time,
    fireRadiativePower: frp ?? undefined,
    brightnessTemp: hotspot.bright_ti4 ?? undefined,
    confidenceLevel: conf.level,
    detectionType: 'thermal_anomaly',
    providerData: { raw: hotspot },
  }
}
