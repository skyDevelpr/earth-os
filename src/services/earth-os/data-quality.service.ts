// EARTH OS — Data Quality & Physical Parameter Validation Engine
// Ensures all incoming telemetry, model outputs, and observations adhere to
// geophysical reality, physical limits, coordinate validity, and outlier constraints.

export interface ValidationIssue {
  field: string
  value: unknown
  severity: 'WARNING' | 'ERROR'
  message: string
  expectedRange?: [number, number]
}

export interface ValidationResult<T> {
  isValid: boolean
  hasWarnings: boolean
  issues: ValidationIssue[]
  sanitized: T
  qualityScore: number // 0 to 100
}

// ─── Physical Boundaries ────────────────────────────────────────────────────────
export const PHYSICAL_BOUNDS = {
  latitude: { min: -90, max: 90, unit: '°' },
  longitude: { min: -180, max: 180, unit: '°' },
  temperature: { min: -95, max: 65, unit: '°C' }, // Record low -89.2°C (Vostok), record high 56.7°C (Death Valley)
  apparentTemperature: { min: -105, max: 75, unit: '°C' },
  humidity: { min: 0, max: 100, unit: '%' },
  surfacePressure: { min: 850, max: 1085, unit: 'hPa' }, // Record high 1084.8 hPa (Tosontsengel)
  windSpeed: { min: 0, max: 450, unit: 'km/h' }, // Record non-tornadic gust 408 km/h (Barrow Island)
  windGusts: { min: 0, max: 500, unit: 'km/h' },
  windDirection: { min: 0, max: 360, unit: '°' },
  precipitation: { min: 0, max: 500, unit: 'mm' }, // 24h world record ~1825mm, hourly max ~300-400mm
  precipitationProbability: { min: 0, max: 100, unit: '%' },
  cloudCover: { min: 0, max: 100, unit: '%' },
  visibility: { min: 0, max: 100000, unit: 'm' }, // 0 to 100km
  uvIndex: { min: 0, max: 25, unit: 'UV index' }, // Highest recorded ~20-25 high altitude tropics
  pm25: { min: 0, max: 1000, unit: 'μg/m³' },
  pm10: { min: 0, max: 2000, unit: 'μg/m³' },
  no2: { min: 0, max: 1000, unit: 'μg/m³' },
  so2: { min: 0, max: 2000, unit: 'μg/m³' },
  co: { min: 0, max: 100000, unit: 'μg/m³' }, // or 100 mg/m³
  o3: { min: 0, max: 1000, unit: 'μg/m³' },
  earthquakeMagnitude: { min: -1.0, max: 10.0, unit: 'Mw' }, // Theoretical max ~10.0
  earthquakeDepth: { min: -5.0, max: 800.0, unit: 'km' }, // Deepest subduction zone quakes ~750km
  wildfireFrp: { min: 0, max: 50000, unit: 'MW' }, // Mega-fire complexes can exceed 5000-10000MW
  wildfireBrightness: { min: 200, max: 550, unit: 'K' }, // Sensor saturation around 500K
}

// ─── Coordinate Validator ───────────────────────────────────────────────────────
export function validateCoordinates(lat: number, lon: number): ValidationResult<{ lat: number; lon: number }> {
  const issues: ValidationIssue[] = []

  if (typeof lat !== 'number' || isNaN(lat)) {
    issues.push({ field: 'latitude', value: lat, severity: 'ERROR', message: 'Latitude must be a valid number' })
  } else if (lat < -90 || lat > 90) {
    issues.push({
      field: 'latitude',
      value: lat,
      severity: 'ERROR',
      message: `Latitude ${lat}° is out of valid bounds [-90, 90]`,
      expectedRange: [-90, 90],
    })
  }

  if (typeof lon !== 'number' || isNaN(lon)) {
    issues.push({ field: 'longitude', value: lon, severity: 'ERROR', message: 'Longitude must be a valid number' })
  } else if (lon < -180 || lon > 180) {
    // Normalizable longitude? e.g. lon = 190 -> -170
    if (lon >= -360 && lon <= 360) {
      issues.push({
        field: 'longitude',
        value: lon,
        severity: 'WARNING',
        message: `Longitude ${lon}° exceeds [-180, 180] and was normalized`,
        expectedRange: [-180, 180],
      })
    } else {
      issues.push({
        field: 'longitude',
        value: lon,
        severity: 'ERROR',
        message: `Longitude ${lon}° is severely out of geographic range`,
        expectedRange: [-180, 180],
      })
    }
  }

  // Normalize longitude into [-180, 180]
  let normalizedLon = typeof lon === 'number' && !isNaN(lon) ? lon : 0
  if (normalizedLon > 180) normalizedLon = ((normalizedLon + 180) % 360) - 180
  if (normalizedLon < -180) normalizedLon = ((normalizedLon - 180) % 360) + 180

  const clampedLat = typeof lat === 'number' && !isNaN(lat) ? Math.max(-90, Math.min(90, lat)) : 0
  const hasErrors = issues.some(i => i.severity === 'ERROR')

  return {
    isValid: !hasErrors,
    hasWarnings: issues.some(i => i.severity === 'WARNING'),
    issues,
    sanitized: { lat: clampedLat, lon: normalizedLon },
    qualityScore: hasErrors ? 0 : issues.length > 0 ? 80 : 100,
  }
}

// ─── Weather Telemetry Validator ────────────────────────────────────────────────
export interface RawWeatherData {
  temperature?: number | null
  apparentTemperature?: number | null
  relativeHumidity?: number | null
  surfacePressure?: number | null
  windSpeed?: number | null
  windGusts?: number | null
  windDirection?: number | null
  precipitation?: number | null
  precipitationProbability?: number | null
  cloudCover?: number | null
  visibility?: number | null
  uvIndex?: number | null
  weatherCode?: number | null
}

export function validateWeatherData(data: RawWeatherData): ValidationResult<RawWeatherData> {
  const issues: ValidationIssue[] = []
  const sanitized: RawWeatherData = { ...data }

  const checkNumeric = (
    field: keyof RawWeatherData,
    bounds: { min: number; max: number; unit: string },
    clamp = true
  ) => {
    const val = data[field]
    if (val === undefined || val === null) return
    if (typeof val !== 'number' || isNaN(val)) {
      issues.push({
        field: String(field),
        value: val,
        severity: 'ERROR',
        message: `${String(field)} is not a valid number`,
      })
      sanitized[field] = null as any
      return
    }

    if (val < bounds.min || val > bounds.max) {
      issues.push({
        field: String(field),
        value: val,
        severity: 'WARNING',
        message: `${String(field)} value ${val} ${bounds.unit} is outside physical envelope [${bounds.min}, ${bounds.max}]`,
        expectedRange: [bounds.min, bounds.max],
      })
      if (clamp) {
        sanitized[field] = Math.max(bounds.min, Math.min(bounds.max, val)) as any
      }
    }
  }

  checkNumeric('temperature', PHYSICAL_BOUNDS.temperature)
  checkNumeric('apparentTemperature', PHYSICAL_BOUNDS.apparentTemperature)
  checkNumeric('relativeHumidity', PHYSICAL_BOUNDS.humidity)
  checkNumeric('surfacePressure', PHYSICAL_BOUNDS.surfacePressure)
  checkNumeric('windSpeed', PHYSICAL_BOUNDS.windSpeed)
  checkNumeric('windGusts', PHYSICAL_BOUNDS.windGusts)
  checkNumeric('windDirection', PHYSICAL_BOUNDS.windDirection)
  checkNumeric('precipitation', PHYSICAL_BOUNDS.precipitation)
  checkNumeric('precipitationProbability', PHYSICAL_BOUNDS.precipitationProbability)
  checkNumeric('cloudCover', PHYSICAL_BOUNDS.cloudCover)
  checkNumeric('visibility', PHYSICAL_BOUNDS.visibility)
  checkNumeric('uvIndex', PHYSICAL_BOUNDS.uvIndex)

  // Physical cross-checks
  if (
    typeof sanitized.windGusts === 'number' &&
    typeof sanitized.windSpeed === 'number' &&
    sanitized.windGusts < sanitized.windSpeed
  ) {
    issues.push({
      field: 'windGusts',
      value: sanitized.windGusts,
      severity: 'WARNING',
      message: `Wind gust (${sanitized.windGusts} km/h) cannot physically be less than sustained wind speed (${sanitized.windSpeed} km/h). Setting gust to wind speed.`,
    })
    sanitized.windGusts = sanitized.windSpeed
  }

  const errors = issues.filter(i => i.severity === 'ERROR').length
  const warnings = issues.filter(i => i.severity === 'WARNING').length
  const qualityScore = Math.max(0, 100 - (errors * 35 + warnings * 10))

  return {
    isValid: errors === 0,
    hasWarnings: warnings > 0,
    issues,
    sanitized,
    qualityScore,
  }
}

// ─── Pollutant Telemetry Validator ──────────────────────────────────────────────
export interface RawPollutantData {
  pm25?: number | null
  pm10?: number | null
  no2?: number | null
  so2?: number | null
  co?: number | null
  o3?: number | null
}

export function validatePollutantData(data: RawPollutantData): ValidationResult<RawPollutantData> {
  const issues: ValidationIssue[] = []
  const sanitized: RawPollutantData = { ...data }

  const checkPollutant = (
    field: keyof RawPollutantData,
    bounds: { min: number; max: number; unit: string }
  ) => {
    const val = data[field]
    if (val === undefined || val === null) return
    if (typeof val !== 'number' || isNaN(val)) {
      issues.push({
        field: String(field),
        value: val,
        severity: 'ERROR',
        message: `${String(field)} concentration is not a number`,
      })
      sanitized[field] = null
      return
    }

    if (val < 0) {
      // Small negative numbers sometimes appear as baseline instrument drift; clamp to 0
      issues.push({
        field: String(field),
        value: val,
        severity: 'WARNING',
        message: `Negative concentration ${val} ${bounds.unit} clamped to 0 (sensor zero-drift correction)`,
        expectedRange: [bounds.min, bounds.max],
      })
      sanitized[field] = 0
    } else if (val > bounds.max) {
      issues.push({
        field: String(field),
        value: val,
        severity: 'WARNING',
        message: `Extreme concentration ${val} ${bounds.unit} exceeds upper expected threshold ${bounds.max}`,
        expectedRange: [bounds.min, bounds.max],
      })
      sanitized[field] = bounds.max
    }
  }

  checkPollutant('pm25', PHYSICAL_BOUNDS.pm25)
  checkPollutant('pm10', PHYSICAL_BOUNDS.pm10)
  checkPollutant('no2', PHYSICAL_BOUNDS.no2)
  checkPollutant('so2', PHYSICAL_BOUNDS.so2)
  checkPollutant('co', PHYSICAL_BOUNDS.co)
  checkPollutant('o3', PHYSICAL_BOUNDS.o3)

  // Cross-check: PM2.5 cannot physically exceed PM10 (PM2.5 is a subset of PM10)
  if (
    typeof sanitized.pm25 === 'number' &&
    typeof sanitized.pm10 === 'number' &&
    sanitized.pm25 > sanitized.pm10 &&
    sanitized.pm10 > 0
  ) {
    issues.push({
      field: 'pm25',
      value: sanitized.pm25,
      severity: 'WARNING',
      message: `PM2.5 (${sanitized.pm25} μg/m³) cannot exceed PM10 (${sanitized.pm10} μg/m³). Inverting or clamping to PM10.`,
    })
    sanitized.pm25 = sanitized.pm10
  }

  const errors = issues.filter(i => i.severity === 'ERROR').length
  const warnings = issues.filter(i => i.severity === 'WARNING').length
  const qualityScore = Math.max(0, 100 - (errors * 30 + warnings * 10))

  return {
    isValid: errors === 0,
    hasWarnings: warnings > 0,
    issues,
    sanitized,
    qualityScore,
  }
}

// ─── Natural Hazard Event Validator ─────────────────────────────────────────────
export interface RawEarthquakeData {
  magnitude?: number | null
  depth?: number | null
  latitude?: number | null
  longitude?: number | null
  time?: number | string | null
}

export function validateEarthquakeEvent(data: RawEarthquakeData): ValidationResult<RawEarthquakeData> {
  const issues: ValidationIssue[] = []
  const sanitized: RawEarthquakeData = { ...data }

  const coordResult = validateCoordinates(data.latitude ?? NaN, data.longitude ?? NaN)
  issues.push(...coordResult.issues)
  sanitized.latitude = coordResult.sanitized.lat
  sanitized.longitude = coordResult.sanitized.lon

  if (typeof data.magnitude !== 'number' || isNaN(data.magnitude)) {
    issues.push({ field: 'magnitude', value: data.magnitude, severity: 'ERROR', message: 'Magnitude is required' })
  } else if (data.magnitude < PHYSICAL_BOUNDS.earthquakeMagnitude.min || data.magnitude > PHYSICAL_BOUNDS.earthquakeMagnitude.max) {
    issues.push({
      field: 'magnitude',
      value: data.magnitude,
      severity: 'WARNING',
      message: `Magnitude ${data.magnitude} outside expected range [-1, 10]`,
      expectedRange: [-1.0, 10.0],
    })
    sanitized.magnitude = Math.max(-1.0, Math.min(10.0, data.magnitude))
  }

  if (typeof data.depth === 'number' && !isNaN(data.depth)) {
    if (data.depth < PHYSICAL_BOUNDS.earthquakeDepth.min || data.depth > PHYSICAL_BOUNDS.earthquakeDepth.max) {
      issues.push({
        field: 'depth',
        value: data.depth,
        severity: 'WARNING',
        message: `Focal depth ${data.depth} km is outside realistic geological bounds [-5, 800] km`,
        expectedRange: [-5.0, 800.0],
      })
      sanitized.depth = Math.max(-5.0, Math.min(800.0, data.depth))
    }
  }

  const errors = issues.filter(i => i.severity === 'ERROR').length
  const qualityScore = Math.max(0, 100 - (errors * 40 + issues.length * 10))

  return {
    isValid: errors === 0,
    hasWarnings: issues.some(i => i.severity === 'WARNING'),
    issues,
    sanitized,
    qualityScore,
  }
}
