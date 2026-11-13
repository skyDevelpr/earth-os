import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateUsEpaAqi,
  calculateIndiaCpcbAqi,
  calculateEuropeanEaqi,
  calculateMultiStandardAqi,
} from '../src/services/earth-os/aqi.service.ts'
import {
  validateCoordinates,
  validateWeatherData,
  validatePollutantData,
  validateEarthquakeEvent,
  PHYSICAL_BOUNDS,
} from '../src/services/earth-os/data-quality.service.ts'
import { evaluateFreshness } from '../src/services/earth-os/freshness.service.ts'

// ─── 1. US EPA AQI Calculation Tests ─────────────────────────────────────────

test('US EPA AQI: PM2.5 calculation conforms to 40 CFR Part 58 breakpoints', () => {
  // Test Good: 0.0 - 12.0 μg/m³ -> AQI 0 - 50
  const good = calculateUsEpaAqi({ pm25: 8.0 })
  assert.equal(good.category, 'Good')
  assert.ok(good.aqiValue >= 0 && good.aqiValue <= 50)
  assert.equal(good.governingPollutant, 'PM2.5')

  // Test Moderate: 12.1 - 35.4 μg/m³ -> AQI 51 - 100
  const mod = calculateUsEpaAqi({ pm25: 24.0 })
  assert.equal(mod.category, 'Moderate')
  assert.ok(mod.aqiValue >= 51 && mod.aqiValue <= 100)

  // Test Unhealthy for Sensitive Groups: 35.5 - 55.4 μg/m³ -> AQI 101 - 150
  const usg = calculateUsEpaAqi({ pm25: 45.0 })
  assert.equal(usg.category, 'Unhealthy for Sensitive Groups')
  assert.ok(usg.aqiValue >= 101 && usg.aqiValue <= 150)

  // Test Unhealthy: 55.5 - 125.4 μg/m³ -> AQI 151 - 200
  const unh = calculateUsEpaAqi({ pm25: 80.0 })
  assert.equal(unh.category, 'Unhealthy')
  assert.ok(unh.aqiValue >= 151 && unh.aqiValue <= 200)

  // Test Hazardous: > 225.5 μg/m³ -> AQI > 300
  const haz = calculateUsEpaAqi({ pm25: 350.0 })
  assert.equal(haz.category, 'Hazardous')
  assert.ok(haz.aqiValue >= 300)
})

test('US EPA AQI: Selects highest sub-index as governing pollutant', () => {
  // PM2.5 = 10 (Good, AQI ~42), Ozone = 120 μg/m³ (~61 ppb, Moderate, AQI ~75)
  const multi = calculateUsEpaAqi({ pm25: 10.0, o3: 120.0 })
  assert.equal(multi.governingPollutant, 'O3')
  assert.equal(multi.category, 'Moderate')
})

// ─── 2. India CPCB NAQI Calculation Tests ────────────────────────────────────

test('India CPCB NAQI: Evaluates 6-category scale (IIT Kanpur / CPCB standard)', () => {
  // Good (0-50): PM2.5 <= 30
  const good = calculateIndiaCpcbAqi({ pm25: 25.0 })
  assert.equal(good.category, 'Good')
  assert.ok(good.aqiValue <= 50)

  // Satisfactory (51-100): PM2.5 31-60
  const sat = calculateIndiaCpcbAqi({ pm25: 45.0 })
  assert.equal(sat.category, 'Satisfactory')
  assert.ok(sat.aqiValue > 50 && sat.aqiValue <= 100)

  // Moderately Polluted (101-200): PM2.5 61-90
  const mod = calculateIndiaCpcbAqi({ pm25: 80.0 })
  assert.equal(mod.category, 'Moderate')
  assert.ok(mod.aqiValue > 100 && mod.aqiValue <= 200)

  // Poor (201-300): PM2.5 91-120
  const poor = calculateIndiaCpcbAqi({ pm25: 110.0 })
  assert.equal(poor.category, 'Poor')
  assert.ok(poor.aqiValue > 200 && poor.aqiValue <= 300)

  // Very Poor (301-400): PM2.5 121-250
  const vpoor = calculateIndiaCpcbAqi({ pm25: 180.0 })
  assert.equal(vpoor.category, 'Very Poor')
  assert.ok(vpoor.aqiValue > 300 && vpoor.aqiValue <= 400)

  // Severe (401-500): PM2.5 > 250
  const severe = calculateIndiaCpcbAqi({ pm25: 320.0 })
  assert.equal(severe.category, 'Severe')
  assert.ok(severe.aqiValue > 400)
})

// ─── 3. European EAQI Tests ──────────────────────────────────────────────────

test('European EAQI: Categorizes into 6 discrete European bands', () => {
  const good = calculateEuropeanEaqi({ pm25: 5.0 })
  assert.equal(good.category, 'Good')
  assert.equal(good.aqiValue, 1)

  const veryPoor = calculateEuropeanEaqi({ pm25: 60.0 })
  assert.equal(veryPoor.category, 'Very Poor')
  assert.equal(veryPoor.aqiValue, 5)
})

test('Multi-Standard Comparator produces mathematically distinct indices', () => {
  const raw = { pm25: 42.0, pm10: 85.0, no2: 25.0 }
  const comparison = calculateMultiStandardAqi(raw)

  assert.ok(comparison.usEpa)
  assert.ok(comparison.indiaCpcb)
  assert.ok(comparison.europeanEaqi)

  // Because breakpoints differ across US EPA and India CPCB, calculated AQI values differ:
  assert.notEqual(comparison.usEpa.aqiValue, comparison.indiaCpcb.aqiValue)
})

// ─── 4. Data Quality & Bounds Validation Tests ───────────────────────────────

test('Coordinate Validator handles edge coordinates and normalizes wrap-around', () => {
  // Normal coordinate
  const valid = validateCoordinates(35.6895, 139.6917)
  assert.equal(valid.isValid, true)
  assert.equal(valid.sanitized.lat, 35.6895)
  assert.equal(valid.sanitized.lon, 139.6917)

  // Out of range latitude (> 90) -> clamped with error
  const invalidLat = validateCoordinates(95.0, 10.0)
  assert.equal(invalidLat.isValid, false)
  assert.equal(invalidLat.sanitized.lat, 90.0)

  // Longitude wrap-around (+190 -> -170)
  const wrappedLon = validateCoordinates(0, 190.0)
  assert.equal(wrappedLon.sanitized.lon, -170.0)
})

test('Weather Validator detects physical anomalies and enforces cross-checks', () => {
  const result = validateWeatherData({
    temperature: 24.5,
    windSpeed: 45.0,
    windGusts: 20.0, // Physical impossibility: gust < sustained wind speed!
    relativeHumidity: 120.0, // Invalid: humidity > 100%
  })

  // Should have warnings and sanitize values
  assert.ok(result.hasWarnings)
  // Wind gust corrected to at least match sustained wind speed
  assert.ok(result.sanitized.windGusts >= result.sanitized.windSpeed)
  // Relative humidity clamped to 100%
  assert.equal(result.sanitized.relativeHumidity, 100)
})

test('Pollutant Validator corrects zero-drift and clamps subset physically', () => {
  const result = validatePollutantData({
    pm25: 65.0,
    pm10: 40.0, // Physical anomaly: PM2.5 cannot exceed PM10!
    no2: -2.5,   // Sensor zero-drift negative baseline
  })

  assert.ok(result.hasWarnings)
  assert.equal(result.sanitized.no2, 0) // zero-drift clamped to 0
  assert.ok(result.sanitized.pm25 <= result.sanitized.pm10) // PM2.5 clamped to PM10
})

test('Earthquake Validator enforces focal depth and magnitude envelope', () => {
  const result = validateEarthquakeEvent({
    latitude: 38.297,
    longitude: 142.372,
    magnitude: 9.1,
    depth: 29.0,
  })

  assert.equal(result.isValid, true)
  assert.equal(result.qualityScore, 100)
})

// ─── 5. Freshness & Provenance Evaluation Tests ──────────────────────────────

test('Freshness Engine accurately computes age and classifies provenance tiers', () => {
  const now = new Date()
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString()
  const freshMeta = evaluateFreshness(fiveMinAgo, 'usgs-earthquakes')

  assert.equal(freshMeta.freshnessStatus, 'REAL_TIME')
  assert.equal(freshMeta.provenance.provenance, 'SEISMIC_NETWORK')
  assert.equal(freshMeta.provenance.isInSitu, true)

  const twoHoursAgo = new Date(now.getTime() - 2.5 * 3600 * 1000).toISOString()
  const recentMeta = evaluateFreshness(twoHoursAgo, 'open-meteo-weather')
  assert.equal(recentMeta.freshnessStatus, 'RECENT')
  assert.equal(recentMeta.provenance.provenance, 'NWP_FORECAST')
  assert.equal(recentMeta.provenance.isInSitu, false)

  const futureTime = new Date(now.getTime() + 6 * 3600 * 1000).toISOString()
  const forecastMeta = evaluateFreshness(futureTime, 'open-meteo-weather')
  assert.equal(forecastMeta.freshnessStatus, 'FORECAST')
  assert.equal(forecastMeta.isForecast, true)
})
