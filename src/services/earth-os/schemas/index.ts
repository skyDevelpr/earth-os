import { z } from 'zod'

// ─── USGS Earthquake GeoJSON Schema ──────────────────────────────────────────

export const UsgsFeaturePropertiesSchema = z.object({
  mag: z.number().nullable(),
  place: z.string().nullable(),
  time: z.number(),
  updated: z.number().nullable(),
  tz: z.number().nullable().optional(),
  url: z.string().url().nullable(),
  detail: z.string().url().nullable().optional(),
  felt: z.number().nullable().optional(),
  cdi: z.number().nullable().optional(),
  mmi: z.number().nullable().optional(),
  alert: z.enum(['green', 'yellow', 'orange', 'red']).nullable().optional(),
  status: z.string().nullable().optional(),
  tsunami: z.number().nullable().optional(),
  sig: z.number().nullable().optional(),
  net: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  ids: z.string().nullable().optional(),
  sources: z.string().nullable().optional(),
  types: z.string().nullable().optional(),
  nst: z.number().nullable().optional(),
  dmin: z.number().nullable().optional(),
  rms: z.number().nullable().optional(),
  gap: z.number().nullable().optional(),
  magType: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
})

export const UsgsFeatureSchema = z.object({
  type: z.literal('Feature'),
  properties: UsgsFeaturePropertiesSchema,
  id: z.string(),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number(), z.number()]),
  }).nullable(),
})

export const UsgsGeoJsonSchema = z.object({
  type: z.literal('FeatureCollection'),
  metadata: z.object({
    generated: z.number(),
    url: z.string(),
    title: z.string(),
    status: z.number(),
    api: z.string(),
    count: z.number(),
  }),
  features: z.array(UsgsFeatureSchema),
  bbox: z.array(z.number()).optional(),
})

export type UsgsGeoJson = z.infer<typeof UsgsGeoJsonSchema>
export type UsgsFeature = z.infer<typeof UsgsFeatureSchema>

// ─── NASA EONET Schema ────────────────────────────────────────────────────────

export const EonetSourceSchema = z.object({
  id: z.string(),
  url: z.string().url().optional().nullable(),
})

export const EonetCategorySchema = z.object({
  id: z.string(),
  title: z.string(),
})

export const EonetGeometrySchema = z.object({
  date: z.string(),
  type: z.string(),
  coordinates: z.union([
    z.tuple([z.number(), z.number()]),
    z.array(z.number()),
    z.array(z.array(z.number())),
  ]),
  magnitudeValue: z.number().nullable().optional(),
  magnitudeUnit: z.string().nullable().optional(),
})

export const EonetEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  link: z.string().url().optional(),
  closed: z.string().nullable().optional(),
  categories: z.array(EonetCategorySchema),
  sources: z.array(EonetSourceSchema),
  geometry: z.array(EonetGeometrySchema),
})

export const EonetResponseSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  link: z.string().optional(),
  events: z.array(EonetEventSchema),
})

export type EonetEvent = z.infer<typeof EonetEventSchema>
export type EonetGeometry = z.infer<typeof EonetGeometrySchema>
export type EonetResponse = z.infer<typeof EonetResponseSchema>

// ─── NASA FIRMS Schema ────────────────────────────────────────────────────────

export const FirmsHotspotSchema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  bright_ti4: z.coerce.number().optional(),
  bright_ti5: z.coerce.number().optional(),
  scan: z.coerce.number().optional(),
  track: z.coerce.number().optional(),
  acq_date: z.string(),
  acq_time: z.string(),
  satellite: z.string(),
  instrument: z.string().optional(),
  confidence: z.union([z.string(), z.number()]),
  version: z.string().optional(),
  bright_t31: z.coerce.number().optional(),
  frp: z.coerce.number().optional(),
  daynight: z.enum(['D', 'N']).optional(),
  type: z.coerce.number().optional(),
})

export type FirmsHotspot = z.infer<typeof FirmsHotspotSchema>

// ─── OpenAQ v3 Schema ─────────────────────────────────────────────────────────

export const OpenAqCoordinatesSchema = z.object({
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
})

export const OpenAqSensorSchema = z.object({
  id: z.number(),
  name: z.string(),
  parameter: z.object({
    id: z.number(),
    name: z.string(),
    units: z.string(),
    displayName: z.string().optional(),
  }),
})

export const OpenAqLocationSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  locality: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  country: z.object({
    id: z.number(),
    code: z.string(),
    name: z.string(),
  }).nullable().optional(),
  coordinates: OpenAqCoordinatesSchema.nullable(),
  sensors: z.array(OpenAqSensorSchema).optional(),
  datetimeFirst: z.object({ utc: z.string() }).nullable().optional(),
  datetimeLast: z.object({ utc: z.string() }).nullable().optional(),
})

export const OpenAqResponseSchema = z.object({
  meta: z.object({
    name: z.string().optional(),
    website: z.string().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
    found: z.number().optional(),
  }).optional(),
  results: z.array(OpenAqLocationSchema),
})

export type OpenAqLocation = z.infer<typeof OpenAqLocationSchema>
export type OpenAqResponse = z.infer<typeof OpenAqResponseSchema>

// ─── Open-Meteo Schema ────────────────────────────────────────────────────────

export const OpenMeteoForecastSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtime_ms: z.number().optional(),
  utc_offset_seconds: z.number().optional().default(0),
  timezone: z.string().optional().default('UTC'),
  timezone_abbreviation: z.string().optional().default('UTC'),
  elevation: z.number().optional(),
  hourly_units: z.record(z.string(), z.string()).optional(),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(z.number().nullable()).optional(),
    apparent_temperature: z.array(z.number().nullable()).optional(),
    relative_humidity_2m: z.array(z.number().nullable()).optional(),
    wind_speed_10m: z.array(z.number().nullable()).optional(),
    wind_gusts_10m: z.array(z.number().nullable()).optional(),
    wind_direction_10m: z.array(z.number().nullable()).optional(),
    precipitation: z.array(z.number().nullable()).optional(),
    precipitation_probability: z.array(z.number().nullable()).optional(),
    cloud_cover: z.array(z.number().nullable()).optional(),
    surface_pressure: z.array(z.number().nullable()).optional(),
    weather_code: z.array(z.number().nullable()).optional(),
    uv_index: z.array(z.number().nullable()).optional(),
    visibility: z.array(z.number().nullable()).optional(),
  }).optional(),
  current_units: z.record(z.string(), z.string()).optional(),
  current: z.object({
    time: z.string().optional(),
    temperature_2m: z.number().nullable().optional(),
    apparent_temperature: z.number().nullable().optional(),
    relative_humidity_2m: z.number().nullable().optional(),
    wind_speed_10m: z.number().nullable().optional(),
    wind_gusts_10m: z.number().nullable().optional(),
    wind_direction_10m: z.number().nullable().optional(),
    precipitation: z.number().nullable().optional(),
    precipitation_probability: z.number().nullable().optional(),
    cloud_cover: z.number().nullable().optional(),
    surface_pressure: z.number().nullable().optional(),
    weather_code: z.number().nullable().optional(),
    uv_index: z.number().nullable().optional(),
    visibility: z.number().nullable().optional(),
  }).optional(),
  daily_units: z.record(z.string(), z.string()).optional(),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number().nullable()).optional(),
    temperature_2m_max: z.array(z.number().nullable()).optional(),
    temperature_2m_min: z.array(z.number().nullable()).optional(),
    precipitation_probability_max: z.array(z.number().nullable()).optional(),
    uv_index_max: z.array(z.number().nullable()).optional(),
  }).optional(),
})

export type OpenMeteoForecast = z.infer<typeof OpenMeteoForecastSchema>
