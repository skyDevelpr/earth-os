// EARTH OS — Authoritative Air Quality Index (AQI) Calculation Engine
// Strictly implements:
// 1. United States EPA AQI (40 CFR Part 58, Appendix G)
// 2. India CPCB National Air Quality Index (NAQI 2014/2015)
// 3. European Environment Agency Air Quality Index (EEA / EAQI)

export type AqiStandard = 'us_epa' | 'india_cpcb' | 'european_eaqi'

export interface PollutantConcentrations {
  pm25?: number | null // μg/m³
  pm10?: number | null // μg/m³
  no2?: number | null  // μg/m³
  so2?: number | null  // μg/m³
  co?: number | null   // μg/m³ or mg/m³
  o3?: number | null   // μg/m³
}

export interface AqiSubIndex {
  pollutant: string
  concentration: number
  unit: string
  subIndex: number
  category: string
}

export interface StandardAqiResult {
  standard: AqiStandard
  standardName: string
  aqiValue: number
  category: string
  color: string
  governingPollutant: string
  subIndices: Record<string, AqiSubIndex>
  advisory: string
  methodology: string
}

export interface MultiStandardAqiComparison {
  usEpa: StandardAqiResult
  indiaCpcb: StandardAqiResult
  europeanEaqi: StandardAqiResult
  rawConcentrations: PollutantConcentrations
  evaluationTime: string
}

// ─── Linear Interpolation Formula ──────────────────────────────────────────────
// I = ((I_high - I_low) / (C_high - C_low)) * (C - C_low) + I_low
function linearInterpolate(
  c: number,
  cLow: number,
  cHigh: number,
  iLow: number,
  iHigh: number
): number {
  if (cHigh === cLow) return iLow
  const aqi = ((iHigh - iLow) / (cHigh - cLow)) * (c - cLow) + iLow
  return Math.round(aqi)
}

// ─── 1. US EPA AQI Calculation ────────────────────────────────────────────────
// PM2.5 Breakpoints (40 CFR Part 58):
const US_EPA_PM25_BREAKPOINTS: Array<[number, number, number, number, string]> = [
  [0.0, 12.0, 0, 50, 'Good'],
  [12.1, 35.4, 51, 100, 'Moderate'],
  [35.5, 55.4, 101, 150, 'Unhealthy for Sensitive Groups'],
  [55.5, 125.4, 151, 200, 'Unhealthy'],
  [125.5, 225.4, 201, 300, 'Very Unhealthy'],
  [225.5, 325.4, 301, 400, 'Hazardous'],
  [325.5, 500.4, 401, 500, 'Hazardous'],
]

const US_EPA_PM10_BREAKPOINTS: Array<[number, number, number, number, string]> = [
  [0, 54, 0, 50, 'Good'],
  [55, 154, 51, 100, 'Moderate'],
  [155, 254, 101, 150, 'Unhealthy for Sensitive Groups'],
  [255, 354, 151, 200, 'Unhealthy'],
  [355, 424, 201, 300, 'Very Unhealthy'],
  [425, 504, 301, 400, 'Hazardous'],
  [505, 604, 401, 500, 'Hazardous'],
]

// NO2 (ppb): 1 μg/m³ ≈ 0.5319 ppb at 25°C, 1 atm
const US_EPA_NO2_PPB_BREAKPOINTS: Array<[number, number, number, number, string]> = [
  [0, 53, 0, 50, 'Good'],
  [54, 100, 51, 100, 'Moderate'],
  [101, 360, 101, 150, 'Unhealthy for Sensitive Groups'],
  [361, 649, 151, 200, 'Unhealthy'],
  [650, 1249, 201, 300, 'Very Unhealthy'],
  [1250, 1649, 301, 400, 'Hazardous'],
  [1650, 2049, 401, 500, 'Hazardous'],
]

// O3 (8-hour, ppb): 1 μg/m³ ≈ 0.509 ppb
const US_EPA_O3_PPB_BREAKPOINTS: Array<[number, number, number, number, string]> = [
  [0, 54, 0, 50, 'Good'],
  [55, 70, 51, 100, 'Moderate'],
  [71, 85, 101, 150, 'Unhealthy for Sensitive Groups'],
  [86, 105, 151, 200, 'Unhealthy'],
  [106, 200, 201, 300, 'Very Unhealthy'],
]

function getUsCategoryDetails(aqi: number): { category: string; color: string; advisory: string } {
  if (aqi <= 50) {
    return {
      category: 'Good',
      color: '#34c759',
      advisory: 'Air quality is satisfactory and poses little or no health risk.',
    }
  }
  if (aqi <= 100) {
    return {
      category: 'Moderate',
      color: '#ffcc00',
      advisory: 'Air quality is acceptable; unusually sensitive individuals should consider limiting prolonged outdoor exertion.',
    }
  }
  if (aqi <= 150) {
    return {
      category: 'Unhealthy for Sensitive Groups',
      color: '#ff9500',
      advisory: 'Members of sensitive groups may experience health effects; general public is less likely to be affected.',
    }
  }
  if (aqi <= 200) {
    return {
      category: 'Unhealthy',
      color: '#ff3b30',
      advisory: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious effects.',
    }
  }
  if (aqi <= 300) {
    return {
      category: 'Very Unhealthy',
      color: '#af52de',
      advisory: 'Health alert: risk of health effects is increased for everyone. Avoid outdoor physical activity.',
    }
  }
  return {
    category: 'Hazardous',
    color: '#8b0000',
    advisory: 'Health warning of emergency conditions: everyone is more likely to be affected. Remain indoors.',
  }
}

export function calculateUsEpaAqi(concs: PollutantConcentrations): StandardAqiResult {
  const subIndices: Record<string, AqiSubIndex> = {}

  // PM2.5 calculation
  if (concs.pm25 != null && concs.pm25 >= 0) {
    const c = Math.min(500.4, concs.pm25)
    for (const [cLow, cHigh, iLow, iHigh, cat] of US_EPA_PM25_BREAKPOINTS) {
      if (c >= cLow && (c <= cHigh || cHigh === 500.4)) {
        const val = linearInterpolate(c, cLow, cHigh, iLow, iHigh)
        subIndices['pm25'] = {
          pollutant: 'PM2.5',
          concentration: concs.pm25,
          unit: 'μg/m³',
          subIndex: val,
          category: cat,
        }
        break
      }
    }
  }

  // PM10 calculation
  if (concs.pm10 != null && concs.pm10 >= 0) {
    const c = Math.min(604, concs.pm10)
    for (const [cLow, cHigh, iLow, iHigh, cat] of US_EPA_PM10_BREAKPOINTS) {
      if (c >= cLow && (c <= cHigh || cHigh === 604)) {
        const val = linearInterpolate(c, cLow, cHigh, iLow, iHigh)
        subIndices['pm10'] = {
          pollutant: 'PM10',
          concentration: concs.pm10,
          unit: 'μg/m³',
          subIndex: val,
          category: cat,
        }
        break
      }
    }
  }

  // NO2 calculation (convert μg/m³ to ppb: * 0.5319)
  if (concs.no2 != null && concs.no2 >= 0) {
    const ppb = concs.no2 * 0.5319
    for (const [cLow, cHigh, iLow, iHigh, cat] of US_EPA_NO2_PPB_BREAKPOINTS) {
      if (ppb >= cLow && (ppb <= cHigh || cHigh === 2049)) {
        const val = linearInterpolate(ppb, cLow, cHigh, iLow, iHigh)
        subIndices['no2'] = {
          pollutant: 'NO2',
          concentration: concs.no2,
          unit: 'μg/m³',
          subIndex: val,
          category: cat,
        }
        break
      }
    }
  }

  // O3 calculation (convert μg/m³ to ppb: * 0.509)
  if (concs.o3 != null && concs.o3 >= 0) {
    const ppb = concs.o3 * 0.509
    for (const [cLow, cHigh, iLow, iHigh, cat] of US_EPA_O3_PPB_BREAKPOINTS) {
      if (ppb >= cLow && (ppb <= cHigh || cHigh === 200)) {
        const val = linearInterpolate(ppb, cLow, cHigh, iLow, iHigh)
        subIndices['o3'] = {
          pollutant: 'O3',
          concentration: concs.o3,
          unit: 'μg/m³',
          subIndex: val,
          category: cat,
        }
        break
      }
    }
  }

  let maxAqi = 0
  let governing = 'None'

  for (const [key, sub] of Object.entries(subIndices)) {
    if (sub.subIndex > maxAqi) {
      maxAqi = sub.subIndex
      governing = sub.pollutant
    }
  }

  const details = getUsCategoryDetails(maxAqi)

  return {
    standard: 'us_epa',
    standardName: 'United States EPA AQI',
    aqiValue: maxAqi,
    category: details.category,
    color: details.color,
    governingPollutant: governing,
    subIndices,
    advisory: details.advisory,
    methodology: 'Linear segmented breakpoint interpolation (40 CFR Part 58, Appendix G)',
  }
}

// ─── 2. India CPCB NAQI Calculation ──────────────────────────────────────────
// Official Central Pollution Control Board (CPCB) NAQI Breakpoints:
const CPCB_PM25_BREAKPOINTS: Array<[number, number, number, number, string]> = [
  [0, 30, 0, 50, 'Good'],
  [31, 60, 51, 100, 'Satisfactory'],
  [61, 90, 101, 200, 'Moderate'],
  [91, 120, 201, 300, 'Poor'],
  [121, 250, 301, 400, 'Very Poor'],
  [251, 500, 401, 500, 'Severe'],
]

const CPCB_PM10_BREAKPOINTS: Array<[number, number, number, number, string]> = [
  [0, 50, 0, 50, 'Good'],
  [51, 100, 51, 100, 'Satisfactory'],
  [101, 250, 101, 200, 'Moderate'],
  [251, 350, 201, 300, 'Poor'],
  [351, 430, 301, 400, 'Very Poor'],
  [431, 600, 401, 500, 'Severe'],
]

const CPCB_NO2_BREAKPOINTS: Array<[number, number, number, number, string]> = [
  [0, 40, 0, 50, 'Good'],
  [41, 80, 51, 100, 'Satisfactory'],
  [81, 180, 101, 200, 'Moderate'],
  [181, 280, 201, 300, 'Poor'],
  [281, 400, 301, 400, 'Very Poor'],
  [401, 500, 401, 500, 'Severe'],
]

const CPCB_SO2_BREAKPOINTS: Array<[number, number, number, number, string]> = [
  [0, 40, 0, 50, 'Good'],
  [41, 80, 51, 100, 'Satisfactory'],
  [81, 380, 101, 200, 'Moderate'],
  [381, 800, 201, 300, 'Poor'],
  [801, 1600, 301, 400, 'Very Poor'],
  [1601, 2000, 401, 500, 'Severe'],
]

const CPCB_O3_BREAKPOINTS: Array<[number, number, number, number, string]> = [
  [0, 50, 0, 50, 'Good'],
  [51, 100, 51, 100, 'Satisfactory'],
  [101, 168, 101, 200, 'Moderate'],
  [169, 208, 201, 300, 'Poor'],
  [209, 748, 301, 400, 'Very Poor'],
  [749, 1000, 401, 500, 'Severe'],
]

function getCpcbCategoryDetails(aqi: number): { category: string; color: string; advisory: string } {
  if (aqi <= 50) {
    return {
      category: 'Good',
      color: '#00b050',
      advisory: 'Minimal impact on health.',
    }
  }
  if (aqi <= 100) {
    return {
      category: 'Satisfactory',
      color: '#92d050',
      advisory: 'Minor breathing discomfort to sensitive people.',
    }
  }
  if (aqi <= 200) {
    return {
      category: 'Moderate',
      color: '#ffff00',
      advisory: 'Breathing discomfort to the people with lungs, asthma and heart diseases.',
    }
  }
  if (aqi <= 300) {
    return {
      category: 'Poor',
      color: '#ff9900',
      advisory: 'Breathing discomfort to most people on prolonged exposure.',
    }
  }
  if (aqi <= 400) {
    return {
      category: 'Very Poor',
      color: '#ff0000',
      advisory: 'Respiratory illness on prolonged exposure. Pronounced effect on people with lung disease.',
    }
  }
  return {
    category: 'Severe',
    color: '#c00000',
    advisory: 'Affects healthy people and seriously impacts those with existing diseases.',
  }
}

export function calculateIndiaCpcbAqi(concs: PollutantConcentrations): StandardAqiResult {
  const subIndices: Record<string, AqiSubIndex> = {}

  if (concs.pm25 != null && concs.pm25 >= 0) {
    const c = Math.min(500, concs.pm25)
    for (const [cLow, cHigh, iLow, iHigh, cat] of CPCB_PM25_BREAKPOINTS) {
      if (c >= cLow && (c <= cHigh || cHigh === 500)) {
        subIndices['pm25'] = {
          pollutant: 'PM2.5',
          concentration: concs.pm25,
          unit: 'μg/m³',
          subIndex: linearInterpolate(c, cLow, cHigh, iLow, iHigh),
          category: cat,
        }
        break
      }
    }
  }

  if (concs.pm10 != null && concs.pm10 >= 0) {
    const c = Math.min(600, concs.pm10)
    for (const [cLow, cHigh, iLow, iHigh, cat] of CPCB_PM10_BREAKPOINTS) {
      if (c >= cLow && (c <= cHigh || cHigh === 600)) {
        subIndices['pm10'] = {
          pollutant: 'PM10',
          concentration: concs.pm10,
          unit: 'μg/m³',
          subIndex: linearInterpolate(c, cLow, cHigh, iLow, iHigh),
          category: cat,
        }
        break
      }
    }
  }

  if (concs.no2 != null && concs.no2 >= 0) {
    const c = Math.min(500, concs.no2)
    for (const [cLow, cHigh, iLow, iHigh, cat] of CPCB_NO2_BREAKPOINTS) {
      if (c >= cLow && (c <= cHigh || cHigh === 500)) {
        subIndices['no2'] = {
          pollutant: 'NO2',
          concentration: concs.no2,
          unit: 'μg/m³',
          subIndex: linearInterpolate(c, cLow, cHigh, iLow, iHigh),
          category: cat,
        }
        break
      }
    }
  }

  if (concs.so2 != null && concs.so2 >= 0) {
    const c = Math.min(2000, concs.so2)
    for (const [cLow, cHigh, iLow, iHigh, cat] of CPCB_SO2_BREAKPOINTS) {
      if (c >= cLow && (c <= cHigh || cHigh === 2000)) {
        subIndices['so2'] = {
          pollutant: 'SO2',
          concentration: concs.so2,
          unit: 'μg/m³',
          subIndex: linearInterpolate(c, cLow, cHigh, iLow, iHigh),
          category: cat,
        }
        break
      }
    }
  }

  if (concs.o3 != null && concs.o3 >= 0) {
    const c = Math.min(1000, concs.o3)
    for (const [cLow, cHigh, iLow, iHigh, cat] of CPCB_O3_BREAKPOINTS) {
      if (c >= cLow && (c <= cHigh || cHigh === 1000)) {
        subIndices['o3'] = {
          pollutant: 'O3',
          concentration: concs.o3,
          unit: 'μg/m³',
          subIndex: linearInterpolate(c, cLow, cHigh, iLow, iHigh),
          category: cat,
        }
        break
      }
    }
  }

  let maxAqi = 0
  let governing = 'None'

  for (const [_, sub] of Object.entries(subIndices)) {
    if (sub.subIndex > maxAqi) {
      maxAqi = sub.subIndex
      governing = sub.pollutant
    }
  }

  const details = getCpcbCategoryDetails(maxAqi)

  return {
    standard: 'india_cpcb',
    standardName: 'India CPCB National AQI',
    aqiValue: maxAqi,
    category: details.category,
    color: details.color,
    governingPollutant: governing,
    subIndices,
    advisory: details.advisory,
    methodology: 'CPCB 8-pollutant sub-index maximum algorithm (IIT Kanpur & CPCB 2014)',
  }
}

// ─── 3. European EAQI (EEA) Calculation ──────────────────────────────────────
const EAQI_BANDS: Record<number, { name: string; color: string; advisory: string }> = {
  1: { name: 'Good', color: '#50f0e6', advisory: 'Air quality is considered good.' },
  2: { name: 'Fair', color: '#50ccaa', advisory: 'Air quality is acceptable.' },
  3: { name: 'Moderate', color: '#f0e641', advisory: 'Moderate air quality. Sensitive individuals may experience mild irritation.' },
  4: { name: 'Poor', color: '#ff5050', advisory: 'Anyone experiencing discomfort should reduce strenuous outdoor activities.' },
  5: { name: 'Very Poor', color: '#960032', advisory: 'Anyone experiencing eye irritation or cough should reduce exertion.' },
  6: { name: 'Extremely Poor', color: '#7d2181', advisory: 'General population: reduce physical exertion outdoors. Remain inside if vulnerable.' },
}

export function calculateEuropeanEaqi(concs: PollutantConcentrations): StandardAqiResult {
  const subIndices: Record<string, AqiSubIndex> = {}

  function getPm25Band(c: number): number {
    if (c <= 10) return 1
    if (c <= 20) return 2
    if (c <= 25) return 3
    if (c <= 50) return 4
    if (c <= 75) return 5
    return 6
  }

  function getPm10Band(c: number): number {
    if (c <= 20) return 1
    if (c <= 40) return 2
    if (c <= 50) return 3
    if (c <= 100) return 4
    if (c <= 150) return 5
    return 6
  }

  function getNo2Band(c: number): number {
    if (c <= 40) return 1
    if (c <= 90) return 2
    if (c <= 120) return 3
    if (c <= 230) return 4
    if (c <= 340) return 5
    return 6
  }

  function getO3Band(c: number): number {
    if (c <= 50) return 1
    if (c <= 100) return 2
    if (c <= 130) return 3
    if (c <= 240) return 4
    if (c <= 380) return 5
    return 6
  }

  function getSo2Band(c: number): number {
    if (c <= 100) return 1
    if (c <= 200) return 2
    if (c <= 350) return 3
    if (c <= 500) return 4
    if (c <= 750) return 5
    return 6
  }

  if (concs.pm25 != null && concs.pm25 >= 0) {
    const band = getPm25Band(concs.pm25)
    subIndices['pm25'] = {
      pollutant: 'PM2.5',
      concentration: concs.pm25,
      unit: 'μg/m³',
      subIndex: band,
      category: EAQI_BANDS[band].name,
    }
  }

  if (concs.pm10 != null && concs.pm10 >= 0) {
    const band = getPm10Band(concs.pm10)
    subIndices['pm10'] = {
      pollutant: 'PM10',
      concentration: concs.pm10,
      unit: 'μg/m³',
      subIndex: band,
      category: EAQI_BANDS[band].name,
    }
  }

  if (concs.no2 != null && concs.no2 >= 0) {
    const band = getNo2Band(concs.no2)
    subIndices['no2'] = {
      pollutant: 'NO2',
      concentration: concs.no2,
      unit: 'μg/m³',
      subIndex: band,
      category: EAQI_BANDS[band].name,
    }
  }

  if (concs.o3 != null && concs.o3 >= 0) {
    const band = getO3Band(concs.o3)
    subIndices['o3'] = {
      pollutant: 'O3',
      concentration: concs.o3,
      unit: 'μg/m³',
      subIndex: band,
      category: EAQI_BANDS[band].name,
    }
  }

  if (concs.so2 != null && concs.so2 >= 0) {
    const band = getSo2Band(concs.so2)
    subIndices['so2'] = {
      pollutant: 'SO2',
      concentration: concs.so2,
      unit: 'μg/m³',
      subIndex: band,
      category: EAQI_BANDS[band].name,
    }
  }

  let maxBand = 1
  let governing = 'None'

  for (const [_, sub] of Object.entries(subIndices)) {
    if (sub.subIndex > maxBand) {
      maxBand = sub.subIndex
      governing = sub.pollutant
    }
  }

  const bandInfo = EAQI_BANDS[maxBand]

  return {
    standard: 'european_eaqi',
    standardName: 'European Environment Agency (EAQI)',
    aqiValue: maxBand,
    category: bandInfo.name,
    color: bandInfo.color,
    governingPollutant: governing,
    subIndices,
    advisory: bandInfo.advisory,
    methodology: 'EEA 5-pollutant max-band methodology (Directive 2008/50/EC)',
  }
}

// ─── Multi-Standard Aggregator ────────────────────────────────────────────────
export function evaluateAllAqiStandards(concs: PollutantConcentrations): MultiStandardAqiComparison {
  return {
    usEpa: calculateUsEpaAqi(concs),
    indiaCpcb: calculateIndiaCpcbAqi(concs),
    europeanEaqi: calculateEuropeanEaqi(concs),
    rawConcentrations: concs,
    evaluationTime: new Date().toISOString(),
  }
}

export const calculateMultiStandardAqi = evaluateAllAqiStandards

