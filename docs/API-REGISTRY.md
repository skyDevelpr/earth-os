# EARTH OS — API Registry

> Generated: 2026-11-09 | Status: PHASE 0 — Research Complete

## 1. NASA EONET (Earth Observatory Natural Event Tracker)

| Field | Value |
|-------|-------|
| Base URL | `https://eonet.gsfc.nasa.gov/api/v3` |
| Version | v3 |
| Auth | None required (open) |
| Rate Limit | Undocumented; treat as 60 req/min |
| License | Public Domain / NASA Open Data |
| Update Frequency | Near real-time (varies by event type) |
| Attribution | NASA EONET |

### Endpoints Used
- `GET /events` — Active events, paginated
- `GET /events?status=open&limit=50` — Open events only
- `GET /events?status=closed&days=30` — Historical events
- `GET /events/{id}` — Single event detail
- `GET /categories` — All categories
- `GET /sources` — All data sources
- GeoJSON output via `?format=geojson`

### Coverage
- Wildfires, Severe Storms, Volcanoes, Sea and Lake Ice, Earthquakes (supplement to USGS), Drought, Dust and Haze, Flood, Landslides, Manmade, Snow, Temperature Extremes, Water Color

### Notes
- Events include geometry with date-stamped coordinates
- Some events have multiple geometry entries (track over time)
- Source references link to official provider records

---

## 2. NASA FIRMS (Fire Information for Resource Management System)

| Field | Value |
|-------|-------|
| Base URL | `https://firms.modaps.eosdis.nasa.gov/api/` |
| Auth | MAP_KEY (free registration at firms.modaps.eosdis.nasa.gov) |
| Rate Limit | 500 transactions/key (varies) |
| License | NASA FIRMS Terms — educational/non-commercial free |
| Update Frequency | VIIRS: ~3-4 times/day; MODIS: 2 times/day |
| Attribution | NASA FIRMS, VIIRS/MODIS sensors |

### Endpoints Used
- `GET /area/csv/{MAP_KEY}/{product}/{area}/{day_range}` — Area fire data
- `GET /country/csv/{MAP_KEY}/{product}/{country}/{day_range}` — Country data
- `GET /area/geojson/{MAP_KEY}/{product}/{area}/{day_range}` — GeoJSON format

### Products
- `VIIRS_SNPP_NRT` — Suomi NPP VIIRS Near Real-Time
- `VIIRS_NOAA20_NRT` — NOAA-20 VIIRS Near Real-Time
- `MODIS_NRT` — MODIS Near Real-Time

### Key Fields
- `latitude`, `longitude` — Detection location
- `acq_date`, `acq_time` — Acquisition timestamp
- `satellite` — Sensor platform
- `confidence` — Detection confidence (n/l/h for VIIRS, 0-100 for MODIS)
- `frp` — Fire Radiative Power (MW)
- `bright_ti4`, `bright_ti5` — Brightness temperatures

### CRITICAL NOTE
> Hotspots are satellite thermal anomaly DETECTIONS — NOT confirmed wildfires.
> Must be labeled as "Satellite fire detection" or "Thermal anomaly" in UI.

---

## 3. USGS Earthquake Catalog

| Field | Value |
|-------|-------|
| Base URL | `https://earthquake.usgs.gov/earthquakes/feed/v1.0` |
| Auth | None required |
| Rate Limit | Soft limit; avoid >12 requests/minute |
| License | Public Domain |
| Update Frequency | Real-time (minutes for significant events) |
| Attribution | USGS Earthquake Hazards Program |

### Endpoints Used (GeoJSON Feeds)
- `GET /summary/all_hour.geojson` — All M0+ past hour
- `GET /summary/all_day.geojson` — All M0+ past day
- `GET /summary/all_week.geojson` — All M0+ past 7 days
- `GET /summary/all_month.geojson` — All M0+ past 30 days
- `GET /summary/significant_week.geojson` — Significant past week
- `GET /summary/significant_month.geojson` — Significant past month
- `GET /summary/4.5_week.geojson` — M4.5+ past week
- `GET /detail/{id}.geojson` — Single event detail

### Key Fields
- `mag` — Magnitude
- `place` — Human-readable location
- `time` — Origin time (epoch ms)
- `updated` — Last update (epoch ms)
- `url` — USGS event page
- `detail` — Detail endpoint URL
- `felt` — Reports from public
- `alert` — PAGER alert level (green/yellow/orange/red)
- `tsunami` — Tsunami flag (0/1)
- `sig` — Significance score
- `net` — Contributing network
- `ids` — All event IDs

### Detail Event Fields
- Full focal mechanism
- Phase arrivals
- Impact data
- ShakeMap availability

---

## 4. NASA GIBS (Global Imagery Browse Services)

| Field | Value |
|-------|-------|
| Base URL (WMTS) | `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/{layer}/default/{time}/{matrix}/{z}/{y}/{x}.{format}` |
| Auth | None required |
| Rate Limit | Generous; production use encouraged |
| License | Public Domain / NASA Open Data |
| Update Frequency | Varies by product (daily/weekly/monthly) |
| Attribution | NASA GIBS, Earthdata |

### Key Endpoints
- Capabilities: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml`
- GetMap WMS: `https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi`

### Key Layers (Verified Available)
- `MODIS_Terra_CorrectedReflectance_TrueColor` — True color (daily since 2000-02-24)
- `MODIS_Aqua_CorrectedReflectance_TrueColor` — True color Aqua (daily since 2002-07-04)
- `VIIRS_SNPP_CorrectedReflectance_TrueColor` — VIIRS true color (daily since 2015-11-24)
- `MODIS_Terra_Land_Surface_Temp_Day` — Land temperature
- `MODIS_Terra_NDVI_8Day` — Vegetation index (8-day composite)
- `GHRSST_L4_G1SST_Sea_Surface_Temperature` — Ocean SST
- `MODIS_Terra_Aerosol` — Aerosol Optical Depth
- `Coastlines_15m` — Vector coastlines overlay
- `Reference_Labels_15m` — Place name labels
- `Reference_Features_15m` — Country borders

### Formats
- JPEG for imagery layers (lossy, smaller)
- PNG for overlays and masked layers

### Date Format
- `{time}` = `YYYY-MM-DD` for daily layers, `YYYY-MM-DD` for the most recent day of a composite

---

## 5. OpenAQ

| Field | Value |
|-------|-------|
| Base URL | `https://api.openaq.org/v3` |
| Auth | API Key in `X-API-Key` header (free registration) |
| Rate Limit | 60 req/min, 2000 req/hr (general use) |
| License | CC BY 4.0 |
| Update Frequency | Near real-time (varies by station) |
| Attribution | OpenAQ, individual station operators |

### Endpoints Used
- `GET /locations` — Air quality monitoring stations
- `GET /locations/{id}` — Station detail
- `GET /locations/{id}/measurements` — Station measurements
- `GET /measurements` — Global measurements with filters
- `GET /parameters` — Available pollutant parameters
- `GET /countries` — Countries with data

### Key Parameters (pollutants)
- `pm25` — Fine particulate matter
- `pm10` — Coarse particulate matter
- `no2` — Nitrogen dioxide
- `so2` — Sulfur dioxide
- `co` — Carbon monoxide
- `o3` — Ozone
- `bc` — Black carbon

### Response Structure
- `results[]` with `id`, `name`, `coordinates`, `sensors[]`
- Each measurement: `value`, `unit`, `parameter`, `datetime`

### Rate-Limit Headers
- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 6. Open-Meteo

| Field | Value |
|-------|-------|
| Base URL | `https://api.open-meteo.com/v1/forecast` |
| Historical | `https://archive-api.open-meteo.com/v1/archive` |
| Auth | None for free non-commercial use |
| Rate Limit | 10,000 requests/day for free tier |
| License | Non-commercial free; commercial requires subscription |
| Update Frequency | Hourly model runs |
| Attribution | Open-Meteo, underlying model source (ERA5, ICON, GFS, etc.) |

### Endpoints
- `GET /forecast?latitude={lat}&longitude={lon}&hourly={vars}` — Forecast
- `GET /archive?latitude={lat}&longitude={lon}&start_date=X&end_date=Y&hourly={vars}` — Historical

### Key Variables
- `temperature_2m` — 2m air temperature (°C)
- `relative_humidity_2m` — Relative humidity (%)
- `wind_speed_10m` — Wind speed at 10m (km/h)
- `wind_direction_10m` — Wind direction (degrees)
- `precipitation` — Precipitation (mm)
- `cloud_cover` — Total cloud cover (%)
- `surface_pressure` — Surface pressure (hPa)
- `weather_code` — WMO weather code

### Note
- Data is model-derived, NOT station observations
- Must be labeled "Forecast model data" or "NWP model output" in UI

---

## 7. NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information)

| Field | Value |
|-------|-------|
| Base URL | `https://api.nasa.gov/DONKI/` |
| Auth | NASA API key (free: api.nasa.gov) |
| Rate Limit | 1000 req/hr with key; 30 req/hr demo key |
| License | NASA Open Data |
| Update Frequency | Real-time as events are cataloged |
| Attribution | NASA CCMC |

### Endpoints Used
- `GET /FLR?startDate=X&endDate=Y&api_key=X` — Solar Flares
- `GET /CME?startDate=X&endDate=Y&api_key=X` — Coronal Mass Ejections
- `GET /GST?startDate=X&endDate=Y&api_key=X` — Geomagnetic Storms

---

## 8. World Bank Open Data

| Field | Value |
|-------|-------|
| Base URL | `https://api.worldbank.org/v2/` |
| Auth | None required |
| Rate Limit | Undocumented; keep to <60 req/min |
| License | CC BY 4.0 |
| Update Frequency | Annual (most indicators) |
| Attribution | World Bank |

### Endpoints Used
- `GET /country/{country}/indicator/{indicator}` — Country indicator time series
- `GET /country/all/indicator/{indicator}` — All countries indicator

### Key Indicators
- `EN.ATM.CO2E.KT` — CO2 emissions (kt)
- `AG.LND.FRST.ZS` — Forest area (% of land area)
- `SP.POP.TOTL` — Population
- `EG.ELC.ACCS.ZS` — Access to electricity (% population)

---

## Basemap / Tile Provider

| Field | Value |
|-------|-------|
| Provider | Stadia Maps (Stamen design tiles) |
| Styles | `alidade_smooth_dark`, `stamen_toner` |
| Attribution | © Stadia Maps, © Stamen Design, © OpenMapTiles, © OpenStreetMap |
| Auth | Free API key (10K tiles/month on free tier) |
| Notes | Alternative: CartoDB Basemaps (free, no key required for many styles) |

### CartoDB Free Tiles (No Key Required)
- `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`
- Attribution: © OpenStreetMap contributors, © CARTO

---

## Fallback Strategy

| Primary | Fallback | Notes |
|---------|----------|-------|
| USGS Real-time | Cached last-known | Label with cache age |
| NASA EONET | Cached last-known | Label with cache age |
| NASA FIRMS | Graceful degradation | Show notice, disable layer |
| GIBS imagery | Static placeholder | Show "imagery unavailable for date" |
| OpenAQ | Cached station data | Label as cached |
| Open-Meteo | Cached forecast | Show forecast age |

---

*Document version: 0.1 — PHASE 0 Research*
