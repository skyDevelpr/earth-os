# EARTH OS — Data Licensing & Attribution Registry

> Version: 1.0 | Phase: Foundation & Compliance

All planetary, seismic, meteorological, and satellite imagery sources in EARTH OS conform to their respective licensing agreements and public domain release terms.

---

## 1. USGS Earthquake Catalog
- **Provider:** United States Geological Survey (USGS), Earthquake Hazards Program
- **License:** U.S. Public Domain (USGS Open Data Policy)
- **Attribution Text:** `Data courtesy of the U.S. Geological Survey (USGS)`
- **Commercial Use:** Unrestricted public domain worldwide
- **Usage Boundaries:** Respectful polling rate limit (< 1 request / 5s per IP); cached via server proxy with 120s TTL.

---

## 2. NASA EONET (Earth Observatory Natural Event Tracker)
- **Provider:** National Aeronautics and Space Administration (NASA GSFC)
- **License:** NASA Open Data Policy / Public Domain
- **Attribution Text:** `NASA Earth Observatory Natural Event Tracker (EONET)`
- **Commercial Use:** Open
- **Usage Boundaries:** Server proxy cached with 300s TTL.

---

## 3. NASA FIRMS (Fire Information for Resource Management System)
- **Provider:** NASA EOSDIS / Land, Atmosphere Near real-time Capability for EOS (LANCE)
- **License:** Free access for academic, educational, and research use with MAP_KEY registration
- **Attribution Text:** `We acknowledge the use of data and imagery from LANCE FIRMS operated by NASA's Earth Science Data and Information System (ESDIS).`
- **Data Integrity Rule:** Hotspots are identified as **satellite thermal anomaly detections**, NOT confirmed ground wildfires.

---

## 4. NASA GIBS (Global Imagery Browse Services)
- **Provider:** NASA Earth Science Data and Information System (ESDIS) Project
- **License:** NASA Open Data / Public Domain
- **Attribution Text:** `Imagery courtesy of NASA's Earth Observing System Data and Information System (EOSDIS) Global Imagery Browse Services (GIBS).`
- **WMTS Endpoints:** TrueColor MODIS Terra/Aqua & VIIRS SNPP 250m/375m resolution tiles.

---

## 5. Open-Meteo
- **Provider:** Open-Meteo.com
- **License:** Non-Commercial Free Tier (Attribution Required - CC BY 4.0). Commercial use requires API subscription.
- **Attribution Text:** `Weather data by Open-Meteo.com under CC BY 4.0`
- **Architecture Note:** Encapsulated behind standard adapter interface to allow seamless plug-in replacement with commercial providers (e.g., ECMWF, Tomorrow.io).

---

## 6. OpenAQ
- **Provider:** OpenAQ Inc.
- **License:** Open Database License (ODbL) / CC BY 4.0
- **Attribution Text:** `Air quality observations aggregated by OpenAQ (openaq.org)`
- **API Key Policy:** Required for v3 gateway; keys stored strictly on backend server environment.

---

## 7. Base Maps & Vector Geometries
- **CARTO Dark Matter Tiles:** © OpenStreetMap contributors, © CARTO
- **OpenStreetMap Nominatim Geocoding:** © OpenStreetMap contributors (ODbL), User-Agent header identified.
