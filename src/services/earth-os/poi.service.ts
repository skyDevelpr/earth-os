import { GLOBAL_POIS } from './poi-data'
import type { GeographicPoi, LayerId } from '@/types/earth-os'

export function getAllPois(): GeographicPoi[] {
  return GLOBAL_POIS
}

export function getPoiById(id: string): GeographicPoi | undefined {
  return GLOBAL_POIS.find(p => p.id === id)
}

export function searchPois(query: string): GeographicPoi[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return GLOBAL_POIS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.country.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  )
}

export function getLayerForCategory(category: string): LayerId {
  switch (category) {
    case 'mountain':
    case 'volcano':
      return 'poi_mountains'
    case 'lake':
    case 'river':
    case 'waterfall':
    case 'ocean':
      return 'poi_water'
    case 'park':
    case 'desert':
    case 'glacier':
    case 'reef':
      return 'poi_nature'
    case 'airport':
      return 'poi_aviation'
    case 'seaport':
      return 'poi_maritime'
    case 'spaceport':
      return 'poi_space'
    case 'dam':
    case 'power_station':
      return 'poi_energy'
    case 'observatory':
    case 'research_station':
      return 'poi_science'
    case 'capital':
    case 'megacity':
      return 'poi_cities'
    case 'unesco':
    case 'landmark':
      return 'poi_heritage'
    default:
      return 'poi_nature'
  }
}

export function getPoiIconName(category: string): string {
  switch (category) {
    case 'mountain':
      return 'icon-poi-mountain'
    case 'volcano':
      return 'icon-poi-volcano'
    case 'lake':
    case 'river':
    case 'ocean':
      return 'icon-poi-water'
    case 'waterfall':
      return 'icon-poi-waterfall'
    case 'park':
      return 'icon-poi-park'
    case 'desert':
      return 'icon-poi-desert'
    case 'glacier':
      return 'icon-poi-glacier'
    case 'reef':
      return 'icon-poi-reef'
    case 'capital':
      return 'icon-poi-capital'
    case 'megacity':
      return 'icon-poi-city'
    case 'airport':
      return 'icon-poi-airport'
    case 'seaport':
      return 'icon-poi-seaport'
    case 'spaceport':
      return 'icon-poi-spaceport'
    case 'dam':
      return 'icon-poi-dam'
    case 'power_station':
      return 'icon-poi-power'
    case 'observatory':
      return 'icon-poi-observatory'
    case 'research_station':
      return 'icon-poi-science'
    case 'unesco':
      return 'icon-poi-unesco'
    case 'landmark':
      return 'icon-poi-landmark'
    default:
      return 'icon-poi-landmark'
  }
}

export function getPoiBadge(category: string): { label: string; color: string; emoji: string } {
  switch (category) {
    case 'mountain':
      return { label: 'Mountain Peak', color: '#38bdf8', emoji: '⛰️' }
    case 'volcano':
      return { label: 'Volcanic Center', color: '#f87171', emoji: '🌋' }
    case 'lake':
      return { label: 'Inland Lake', color: '#60a5fa', emoji: '🌊' }
    case 'river':
      return { label: 'Major River', color: '#60a5fa', emoji: '💧' }
    case 'waterfall':
      return { label: 'Waterfall', color: '#93c5fd', emoji: '🌊' }
    case 'park':
      return { label: 'National Park', color: '#4ade80', emoji: '🌲' }
    case 'desert':
      return { label: 'Desert Biome', color: '#fbbf24', emoji: '🏜️' }
    case 'glacier':
      return { label: 'Glacial Ice Field', color: '#bae6fd', emoji: '🧊' }
    case 'reef':
      return { label: 'Coral Reef', color: '#34d399', emoji: '🪸' }
    case 'capital':
      return { label: 'World Capital', color: '#f472b6', emoji: '🏛️' }
    case 'megacity':
      return { label: 'Global Metropolis', color: '#c084fc', emoji: '🏙️' }
    case 'airport':
      return { label: 'International Airport', color: '#38bdf8', emoji: '✈️' }
    case 'seaport':
      return { label: 'Mega Seaport', color: '#2dd4bf', emoji: '🚢' }
    case 'spaceport':
      return { label: 'Orbital Spaceport', color: '#a855f7', emoji: '🚀' }
    case 'dam':
      return { label: 'Hydroelectric Dam', color: '#60a5fa', emoji: '⚡' }
    case 'power_station':
      return { label: 'Power Station', color: '#f59e0b', emoji: '⚡' }
    case 'observatory':
      return { label: 'Astronomical Observatory', color: '#818cf8', emoji: '🔭' }
    case 'research_station':
      return { label: 'Research Station', color: '#a78bfa', emoji: '🔬' }
    case 'unesco':
      return { label: 'UNESCO Heritage Site', color: '#facc15', emoji: '🏛️' }
    case 'landmark':
      return { label: 'Human Landmark', color: '#fb923c', emoji: '🗿' }
    default:
      return { label: 'Geographic Point', color: '#94a3b8', emoji: '📍' }
  }
}

export function getPoisGeoJson(activeLayers?: Set<LayerId>): GeoJSON.FeatureCollection {
  const pois = activeLayers
    ? GLOBAL_POIS.filter(p => activeLayers.has(getLayerForCategory(p.category)))
    : GLOBAL_POIS

  const features: GeoJSON.Feature[] = pois.map(poi => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [poi.coordinates.longitude, poi.coordinates.latitude],
    },
    properties: {
      id: poi.id,
      name: poi.name,
      shortName: poi.name.split('(')[0].trim(),
      category: poi.category,
      group: poi.group,
      country: poi.country,
      importance: poi.importance,
      minZoom: poi.minZoom,
      iconName: getPoiIconName(poi.category),
      badgeLabel: getPoiBadge(poi.category).label,
      badgeColor: getPoiBadge(poi.category).color,
      badgeEmoji: getPoiBadge(poi.category).emoji,
      elevation: poi.metadata?.elevation ?? null,
      population: poi.metadata?.population ?? null,
      poiData: JSON.stringify(poi),
    },
  }))

  return {
    type: 'FeatureCollection',
    features,
  }
}
