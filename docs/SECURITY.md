# EARTH OS — Security & Data Integrity Policy

> Version: 1.0 | Phase: Foundation & Production Readiness

## 1. Zero Secret Leakage via Frontend
- **Zero VITE_ / NEXT_PUBLIC_ Secrets:** No API keys or tokens are prefixed with `NEXT_PUBLIC_`.
- **Server-Side API Proxy Gateways:** All external queries to NASA FIRMS (`FIRMS_MAP_KEY`), OpenAQ (`OPENAQ_API_KEY`), and NASA DONKI (`NASA_API_KEY`) route through Next.js server Route Handlers located under `/api/earth-os/*`.
- Keys exist solely within `.env.local` and runtime environment variables.

---

## 2. SSRF Protection & Hostname Whitelisting
- Server-side route handlers prohibit user-arbitrary URLs.
- Outbound requests are pinned to explicit API hostnames:
  - `earthquake.usgs.gov`
  - `eonet.gsfc.nasa.gov`
  - `firms.modaps.eosdis.nasa.gov`
  - `api.openaq.org`
  - `api.open-meteo.com`
  - `gibs.earthdata.nasa.gov`
  - `nominatim.openstreetmap.org`

---

## 3. Strict Input Validation (Zod & Coordinate Bounds)
- All parameters (coordinates, date ranges, query strings, limits) are validated via strict Zod schemas before being passed to external services.
- Geographic bounds enforcement:
  - Latitude strictly between `-90.0` and `+90.0`
  - Longitude strictly between `-180.0` and `+180.0`
- Query strings capped at max 200 characters to prevent buffer and memory denial-of-service.

---

## 4. Rate Limiting, Timeouts & Circuit Breakers
- All outgoing fetches utilize `AbortSignal.timeout(8000..12000)` to prevent worker thread exhaustion.
- HTTP `Cache-Control` headers (e.g. `public, max-age=120, stale-while-revalidate=60`) prevent duplicate redundant outbound queries under high concurrent client load.
- If upstream providers return 429 or 5xx, the proxy serves cached data labeled with `freshness: "cached"` rather than failing silently.

---

## 5. Non-Fabrication of Planetary Observations
- Earth OS enforces absolute integrity:
  - No synthetic earthquake, fire, or weather records are ever created.
  - Thermal anomalies are marked explicitly as satellite detections, not confirmed ground wildfires.
  - If a data provider is unconfigured or unreachable, the system displays honest degraded status with instructions on configuring keys.
