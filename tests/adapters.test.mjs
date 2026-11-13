import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeUsgsFeature } from '../src/services/earth-os/adapters/usgs.adapter.ts'
import { normalizeEonetEvent } from '../src/services/earth-os/adapters/eonet.adapter.ts'
import { normalizeFirmsHotspot } from '../src/services/earth-os/adapters/firms.adapter.ts'

test('USGS Adapter normalizes standard earthquake feature correctly', () => {
  const mockFeature = {
    type: 'Feature',
    id: 'us7000test',
    geometry: {
      type: 'Point',
      coordinates: [139.75, 35.68, 10.5]
    },
    properties: {
      mag: 5.8,
      place: '12km E of Tokyo, Japan',
      time: 1700000000000,
      updated: 1700000500000,
      url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000test',
      alert: 'yellow',
      tsunami: 0,
      magType: 'mww',
      sig: 620,
      net: 'us'
    }
  }

  const normalized = normalizeUsgsFeature(mockFeature, new Date().toISOString(), 'live')

  assert.ok(normalized)
  assert.equal(normalized.id, 'usgs:us7000test')
  assert.equal(normalized.magnitude, 5.8)
  assert.equal(normalized.depth, 10.5)
  assert.equal(normalized.coordinates.longitude, 139.75)
  assert.equal(normalized.coordinates.latitude, 35.68)
  assert.equal(normalized.severity, 'moderate')
  assert.equal(normalized.alert, 'yellow')
  assert.equal(normalized.tsunami, false)
})

test('EONET Adapter normalizes multi-geometry hazard events', () => {
  const mockEvent = {
    id: 'EONET_6000',
    title: 'Severe Storm Cyclone Alpha',
    description: 'Tropical cyclone tracking northwards',
    categories: [{ id: 'severeStorms', title: 'Severe Storms' }],
    sources: [{ id: 'JTWC', url: 'https://www.metoc.navy.mil/jtwc/' }],
    geometry: [
      { date: '2026-11-01T12:00:00Z', type: 'Point', coordinates: [80.0, 15.0] },
      { date: '2026-11-02T12:00:00Z', type: 'Point', coordinates: [82.5, 17.2] } // Latest
    ]
  }

  const normalized = normalizeEonetEvent(mockEvent, new Date().toISOString(), 'live')

  assert.ok(normalized)
  assert.equal(normalized.id, 'eonet:EONET_6000')
  assert.equal(normalized.category, 'severeStorms')
  // Must select the most recent geometry coordinates
  assert.equal(normalized.coordinates.longitude, 82.5)
  assert.equal(normalized.coordinates.latitude, 17.2)
  assert.equal(normalized.status, 'open')
})

test('FIRMS Adapter preserves thermal anomaly detection caveats', () => {
  const mockHotspot = {
    latitude: -14.235,
    longitude: -51.925,
    acq_date: '2026-11-09',
    acq_time: '1430',
    satellite: 'NPP',
    confidence: 'h',
    frp: 85.4
  }

  const normalized = normalizeFirmsHotspot(mockHotspot, new Date().toISOString(), 'live')

  assert.ok(normalized)
  assert.equal(normalized.category, 'fireHotspot')
  assert.equal(normalized.detectionType, 'thermal_anomaly')
  assert.equal(normalized.confidenceLevel, 'high')
  assert.equal(normalized.fireRadiativePower, 85.4)
  assert.ok(normalized.description?.toLowerCase().includes('thermal anomaly'))
})
