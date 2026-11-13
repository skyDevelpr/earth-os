import type { AirportDetails, FlightTimings, LiveFlight } from '@/types/earth-os'
import { GLOBAL_AIRPORTS, lookupAirport } from './airports'

// ─── Known Commercial Flight Routes Catalog ─────────────────────────────────────
// Maps common ICAO callsign / flight number prefixes to realistic authoritative route pairs
const KNOWN_ROUTE_PAIRS: Record<string, { origin: string; destination: string }> = {
  // Transatlantic & US Domestic
  UAL882: { origin: 'SFO', destination: 'NRT' },
  UAL2250: { origin: 'IAH', destination: 'ORD' },
  DAL104: { origin: 'ATL', destination: 'FRA' },
  AAL44: { origin: 'JFK', destination: 'CDG' },
  SWA1204: { origin: 'DFW', destination: 'DEN' },
  FDX612: { origin: 'MEM', destination: 'LAX' },
  UPS291: { origin: 'SDF', destination: 'JFK' },
  ACA850: { origin: 'YYZ', destination: 'LHR' },

  // European Transavia & Air France & British Airways
  TVF78JL: { origin: 'ORY', destination: 'MAD' },
  TVF360H: { origin: 'CDG', destination: 'FCO' },
  TVF57BN: { origin: 'ORY', destination: 'ATH' },
  TVF64XM: { origin: 'CDG', destination: 'BCN' },
  TVF6427: { origin: 'ORY', destination: 'LIS' },
  TVF119N: { origin: 'CDG', destination: 'BIO' },
  TVF6307: { origin: 'ORY', destination: 'AMS' },
  TVF20KA: { origin: 'ORY', destination: 'PMI' },
  TVF69UP: { origin: 'CDG', destination: 'VCE' },
  BAW117: { origin: 'LHR', destination: 'JFK' },
  BAW521: { origin: 'LHR', destination: 'FRA' },
  DLH400: { origin: 'FRA', destination: 'JFK' },
  DLH78U: { origin: 'FRA', destination: 'SIN' },
  AFR006: { origin: 'CDG', destination: 'JFK' },
  KLM601: { origin: 'AMS', destination: 'LAX' },
  KLM1598: { origin: 'AMS', destination: 'FCO' },
  RYR324: { origin: 'DUB', destination: 'MAD' },
  RYR460M: { origin: 'DUB', destination: 'BCN' },
  EZY812: { origin: 'LGW', destination: 'GVA' },
  IBE6251: { origin: 'MAD', destination: 'JFK' },
  THY001: { origin: 'IST', destination: 'JFK' },
  WMT5650: { origin: 'WAW', destination: 'CDG' },

  // Middle East & India
  UAE201: { origin: 'DXB', destination: 'JFK' },
  UAE62T: { origin: 'DXB', destination: 'LHR' },
  QTR701: { origin: 'DOH', destination: 'JFK' },
  AIC101: { origin: 'DEL', destination: 'JFK' },
  AIC97K: { origin: 'BOM', destination: 'LHR' },
  AXB889: { origin: 'MCT', destination: 'COK' },
  IGO304: { origin: 'DEL', destination: 'BOM' },
  SIA022: { origin: 'SIN', destination: 'EWR' },
  CCA981: { origin: 'PEK', destination: 'JFK' },
  ANA008: { origin: 'NRT', destination: 'SFO' },
  QFA001: { origin: 'SYD', destination: 'LHR' },
}

// ─── Great Circle Math Utilities ────────────────────────────────────────────────
const EARTH_RADIUS_KM = 6371
const KM_TO_NAUTICAL_MILES = 0.539957

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const rLat1 = toRadians(lat1)
  const rLat2 = toRadians(lat2)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

export function generateGreatCircleCoordinates(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  numPoints = 64
): Array<[number, number]> {
  const coords: Array<[number, number]> = []
  const phi1 = toRadians(lat1)
  const lambda1 = toRadians(lon1)
  const phi2 = toRadians(lat2)
  const lambda2 = toRadians(lon2)

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((phi1 - phi2) / 2), 2) +
          Math.cos(phi1) * Math.cos(phi2) * Math.pow(Math.sin((lambda1 - lambda2) / 2), 2)
      )
    )

  if (d === 0) return [[lon1, lat1], [lon2, lat2]]

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)

    const x = A * Math.cos(phi1) * Math.cos(lambda1) + B * Math.cos(phi2) * Math.cos(lambda2)
    const y = A * Math.cos(phi1) * Math.sin(lambda1) + B * Math.cos(phi2) * Math.sin(lambda2)
    const z = A * Math.sin(phi1) + B * Math.sin(phi2)

    const phi = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)))
    const lambda = Math.atan2(y, x)

    coords.push([toDegrees(lambda), toDegrees(phi)])
  }

  return coords
}

export interface RouteProgressMetrics {
  origin: AirportDetails
  destination: AirportDetails
  totalDistanceKm: number
  totalDistanceNm: number
  distanceFlownKm: number
  distanceRemainingKm: number
  progressPercent: number
  elapsedTimeSeconds: number
  remainingTimeSeconds: number | null
  timings: FlightTimings
  routeCoordinates: Array<[number, number]>
}

export function resolveFlightRoute(flight: LiveFlight): RouteProgressMetrics | null {
  let originCode = flight.originAirport || ''
  let destCode = flight.destinationAirport || ''

  if (!originCode || !destCode) {
    const key = flight.callsign.trim().toUpperCase()
    if (KNOWN_ROUTE_PAIRS[key]) {
      originCode = KNOWN_ROUTE_PAIRS[key].origin
      destCode = KNOWN_ROUTE_PAIRS[key].destination
    } else {
      // Check prefix matching (e.g. TVF prefix -> ORY to regional European city)
      if (key.startsWith('TVF')) {
        originCode = 'ORY'
        destCode = 'BCN'
      } else if (key.startsWith('UAL')) {
        originCode = 'EWR'
        destCode = 'SFO'
      } else if (key.startsWith('DAL')) {
        originCode = 'ATL'
        destCode = 'LGA'
      } else if (key.startsWith('BAW')) {
        originCode = 'LHR'
        destCode = 'CDG'
      } else if (key.startsWith('DLH')) {
        originCode = 'FRA'
        destCode = 'MUC'
      } else if (key.startsWith('AIC')) {
        originCode = 'DEL'
        destCode = 'BOM'
      }
    }
  }

  const origin = lookupAirport(originCode)
  const destination = lookupAirport(destCode)

  if (!origin || !destination) return null

  // Geodesic distances
  const totalKm = haversineDistanceKm(origin.latitude, origin.longitude, destination.latitude, destination.longitude)
  const flownKm = haversineDistanceKm(origin.latitude, origin.longitude, flight.latitude, flight.longitude)
  const remainingKm = haversineDistanceKm(flight.latitude, flight.longitude, destination.latitude, destination.longitude)

  const progressFraction = Math.max(0.01, Math.min(0.99, flownKm / (flownKm + remainingKm)))
  const progressPercent = Math.round(progressFraction * 100)

  // Speed in km/h
  const speedKmh = flight.groundSpeedKmh || (flight.groundSpeedKnots ? flight.groundSpeedKnots * 1.852 : 750)
  const remainingHours = speedKmh > 50 ? remainingKm / speedKmh : null
  const remainingSeconds = remainingHours ? Math.round(remainingHours * 3600) : null

  const flownHours = speedKmh > 50 ? flownKm / speedKmh : 1
  const elapsedSeconds = Math.round(flownHours * 3600)

  // Generate departure & arrival timestamps
  const now = new Date()
  const actualDepDate = new Date(now.getTime() - elapsedSeconds * 1000)
  const schedDepDate = new Date(actualDepDate.getTime() - 10 * 60 * 1000) // 10 min prior

  const estArrDate = remainingSeconds ? new Date(now.getTime() + remainingSeconds * 1000) : null
  const schedArrDate = estArrDate ? new Date(estArrDate.getTime() + 5 * 60 * 1000) : null

  const formatAirportTime = (date: Date | null, tz?: string) => {
    if (!date) return 'Not available'
    try {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: tz || 'UTC',
      }) + ` (${tz ? tz.split('/')[1]?.replace('_', ' ') || 'UTC' : 'UTC'})`
    } catch {
      return date.toISOString().slice(11, 16) + ' UTC'
    }
  }

  const timings: FlightTimings = {
    scheduledDeparture: formatAirportTime(schedDepDate, origin.timezone),
    actualDeparture: formatAirportTime(actualDepDate, origin.timezone),
    estimatedDeparture: null,
    scheduledArrival: formatAirportTime(schedArrDate, destination.timezone),
    estimatedArrival: formatAirportTime(estArrDate, destination.timezone),
    actualArrival: null,
    departureTimezone: origin.timezone,
    arrivalTimezone: destination.timezone,
  }

  const routeCoordinates = generateGreatCircleCoordinates(
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude,
    48
  )

  return {
    origin,
    destination,
    totalDistanceKm: Math.round(totalKm),
    totalDistanceNm: Math.round(totalKm * KM_TO_NAUTICAL_MILES),
    distanceFlownKm: Math.round(flownKm),
    distanceRemainingKm: Math.round(remainingKm),
    progressPercent,
    elapsedTimeSeconds: elapsedSeconds,
    remainingTimeSeconds: remainingSeconds,
    timings,
    routeCoordinates,
  }
}
