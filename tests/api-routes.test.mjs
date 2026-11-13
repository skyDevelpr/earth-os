import test from 'node:test'
import assert from 'node:assert/strict'

// Test route handler schemas & data parsing
import { UsgsGeoJsonSchema, EonetResponseSchema, OpenMeteoForecastSchema } from '../src/services/earth-os/schemas/index.ts'

test('USGS GeoJSON schema parses valid earthquake payload', () => {
  const sample = {
    type: 'FeatureCollection',
    metadata: {
      generated: 1700000000000,
      url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
      title: 'USGS All Earthquakes, Past Hour',
      status: 200,
      api: '1.10.3',
      count: 1
    },
    features: [
      {
        type: 'Feature',
        id: 'ci40123456',
        properties: {
          mag: 3.2,
          place: '10km NW of The Geysers, CA',
          time: 1700000000000,
          updated: 1700000100000,
          url: 'https://earthquake.usgs.gov/earthquakes/eventpage/ci40123456'
        },
        geometry: {
          type: 'Point',
          coordinates: [-122.8, 38.8, 2.5]
        }
      }
    ]
  }

  const parsed = UsgsGeoJsonSchema.safeParse(sample)
  assert.equal(parsed.success, true)
  if (parsed.success) {
    assert.equal(parsed.data.features.length, 1)
    assert.equal(parsed.data.features[0].properties.mag, 3.2)
  }
})

test('Open-Meteo schema parses NWP weather forecast format', () => {
  const sample = {
    latitude: 52.52,
    longitude: 13.41,
    generationtime_ms: 0.12,
    utc_offset_seconds: 0,
    timezone: 'UTC',
    timezone_abbreviation: 'UTC',
    current: {
      time: '2026-11-09T12:00',
      temperature_2m: 14.2,
      relative_humidity_2m: 65,
      wind_speed_10m: 12.5,
      wind_direction_10m: 230,
      precipitation: 0.0,
      cloud_cover: 45,
      surface_pressure: 1013.2,
      weather_code: 2
    }
  }

  const parsed = OpenMeteoForecastSchema.safeParse(sample)
  assert.equal(parsed.success, true)
  if (parsed.success) {
    assert.equal(parsed.data.current?.temperature_2m, 14.2)
    assert.equal(parsed.data.current?.surface_pressure, 1013.2)
  }
})
