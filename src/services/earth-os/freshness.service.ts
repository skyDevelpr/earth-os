// EARTH OS — Data Freshness & Source Provenance Engine
// Clearly delineates:
// 1. Ground-station in-situ observations (OpenAQ, EPA AirNow, CPCB, WMO)
// 2. Numerical Weather Prediction (NWP) model forecasts (ECMWF, GFS, ICON)
// 3. Chemical Transport Models (Copernicus CAMS)
// 4. Orbital satellite observations (NASA FIRMS VIIRS/MODIS)
// 5. Seismic & Volcanic ground sensors (USGS ANSS, Smithsonian GVP)

export type DataProvenance =
  | 'GROUND_STATION'
  | 'NWP_FORECAST'
  | 'ATMOSPHERIC_MODEL'
  | 'SATELLITE_OBSERVATION'
  | 'SEISMIC_NETWORK'
  | 'VOLCANIC_OBSERVATORY'
  | 'HISTORICAL_REANALYSIS'

export type FreshnessStatus =
  | 'REAL_TIME'        // < 15 minutes
  | 'NEAR_REAL_TIME'   // 15 minutes to 2 hours
  | 'RECENT'           // 2 hours to 6 hours
  | 'DELAYED'          // 6 hours to 24 hours
  | 'FORECAST'         // Future projection
  | 'HISTORICAL'       // > 24 hours
  | 'STALE'            // Expected update missed > 48h

export interface ProvenanceMetadata {
  provenance: DataProvenance
  providerName: string
  modelOrNetwork?: string
  license: string
  referenceUrl: string
  disclaimer: string
  isInSitu: boolean // true = physically measured on the ground; false = simulated/remotely sensed
}

export interface FreshnessMetadata {
  observationTime: string // ISO timestamp
  fetchedAt: string       // ISO timestamp
  ageSeconds: number
  freshnessStatus: FreshnessStatus
  humanAge: string
  updateCadence: string  // e.g. "Hourly", "Every 15 min", "Per seismic trigger"
  isForecast: boolean
  provenance: ProvenanceMetadata
}

// ─── Known Provider Provenances ────────────────────────────────────────────────
export const KNOWN_PROVIDERS: Record<string, ProvenanceMetadata> = {
  'open-meteo-weather': {
    provenance: 'NWP_FORECAST',
    providerName: 'Open-Meteo NWP Ensemble',
    modelOrNetwork: 'ECMWF IFS / NOAA GFS / DWD ICON (Best Match)',
    license: 'Non-Commercial / Creative Commons BY 4.0',
    referenceUrl: 'https://open-meteo.com/',
    disclaimer: 'High-resolution numerical model forecast blended with satellite and radar assimilation.',
    isInSitu: false,
  },
  'open-meteo-cams': {
    provenance: 'ATMOSPHERIC_MODEL',
    providerName: 'Copernicus Atmosphere Monitoring Service (CAMS)',
    modelOrNetwork: 'CAMS Global Atmospheric Composition & Aerosol Model',
    license: 'Copernicus Open Access / Open-Meteo CC BY 4.0',
    referenceUrl: 'https://atmosphere.copernicus.eu/',
    disclaimer: 'Regional & global atmospheric transport model assimilation. Not a point ground sensor.',
    isInSitu: false,
  },
  'usgs-earthquakes': {
    provenance: 'SEISMIC_NETWORK',
    providerName: 'United States Geological Survey (USGS)',
    modelOrNetwork: 'Advanced National Seismic System (ANSS) & Global Seismographic Network',
    license: 'Public Domain (US Government Work)',
    referenceUrl: 'https://earthquake.usgs.gov/',
    disclaimer: 'Real-time seismic waveforms triangulated by regional and global seismometer stations.',
    isInSitu: true,
  },
  'nasa-firms': {
    provenance: 'SATELLITE_OBSERVATION',
    providerName: 'NASA FIRMS / LANCE',
    modelOrNetwork: 'VIIRS (Suomi-NPP / NOAA-20/21) & MODIS (Terra/Aqua)',
    license: 'NASA Earth Science Open Data Policy',
    referenceUrl: 'https://firms.modaps.eosdis.nasa.gov/',
    disclaimer: 'Thermal anomaly detection via 375m/1km infrared channels. Indicates fire radiative power.',
    isInSitu: false,
  },
  'nasa-eonet': {
    provenance: 'VOLCANIC_OBSERVATORY',
    providerName: 'NASA Earth Observatory Natural Event Tracker (EONET)',
    modelOrNetwork: 'Smithsonian GVP / NOAA / NASA Multi-Agency Curation',
    license: 'Open Access',
    referenceUrl: 'https://eonet.gsfc.nasa.gov/',
    disclaimer: 'Curated natural events from global satellite and ground agency reports.',
    isInSitu: false,
  },
  'openaq-ground': {
    provenance: 'GROUND_STATION',
    providerName: 'OpenAQ Physical In-Situ Network',
    modelOrNetwork: 'Reference Grade & Certified Community Air Monitors',
    license: 'ODbL / CC-BY 4.0',
    referenceUrl: 'https://openaq.org/',
    disclaimer: 'Direct physical continuous ground measurement from fixed environmental monitoring stations.',
    isInSitu: true,
  },
  'cpcb-india': {
    provenance: 'GROUND_STATION',
    providerName: 'Central Pollution Control Board (CPCB India)',
    modelOrNetwork: 'National Air Quality Monitoring Programme (NAMP / CAAQMS)',
    license: 'Government of India Open Data',
    referenceUrl: 'https://cpcb.nic.in/',
    disclaimer: 'Continuous Ambient Air Quality Monitoring Station (CAAQMS) optical/beta-attenuation sensors.',
    isInSitu: true,
  },
}

// ─── Freshness Evaluation ──────────────────────────────────────────────────────
export function evaluateFreshness(
  timestamp: string | number | Date,
  providerKey: keyof typeof KNOWN_PROVIDERS | string,
  updateCadence = 'Hourly'
): FreshnessMetadata {
  const now = Date.now()
  const obsDate = new Date(timestamp)
  const obsTime = obsDate.getTime()
  const ageMs = now - obsTime
  const ageSeconds = Math.round(ageMs / 1000)

  let status: FreshnessStatus
  let isForecast = false

  if (ageMs < -60000) {
    // Timestamp in the future (by more than 1 min)
    status = 'FORECAST'
    isForecast = true
  } else if (ageSeconds <= 900) {
    // <= 15 minutes
    status = 'REAL_TIME'
  } else if (ageSeconds <= 7200) {
    // <= 2 hours
    status = 'NEAR_REAL_TIME'
  } else if (ageSeconds <= 21600) {
    // <= 6 hours
    status = 'RECENT'
  } else if (ageSeconds <= 86400) {
    // <= 24 hours
    status = 'DELAYED'
  } else if (ageSeconds <= 172800) {
    // <= 48 hours
    status = 'HISTORICAL'
  } else {
    status = 'STALE'
  }

  // Generate human age string
  let humanAge: string
  if (isForecast) {
    const futureHours = Math.round(Math.abs(ageSeconds) / 3600)
    humanAge = futureHours === 0 ? 'Next hour forecast' : `+${futureHours}h forecast`
  } else if (ageSeconds < 60) {
    humanAge = 'Just now (<1m)'
  } else if (ageSeconds < 3600) {
    humanAge = `${Math.floor(ageSeconds / 60)}m ago`
  } else if (ageSeconds < 86400) {
    humanAge = `${Math.floor(ageSeconds / 3600)}h ago`
  } else {
    humanAge = `${Math.floor(ageSeconds / 86400)}d ago`
  }

  const provenance = KNOWN_PROVIDERS[providerKey] || {
    provenance: 'NWP_FORECAST' as DataProvenance,
    providerName: providerKey,
    license: 'Standard Open License',
    referenceUrl: '',
    disclaimer: 'Scientific planetary observation dataset.',
    isInSitu: false,
  }

  return {
    observationTime: isNaN(obsTime) ? new Date().toISOString() : obsDate.toISOString(),
    fetchedAt: new Date().toISOString(),
    ageSeconds,
    freshnessStatus: status,
    humanAge,
    updateCadence,
    isForecast,
    provenance,
  }
}
