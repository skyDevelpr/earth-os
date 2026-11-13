# EARTH OS — Architecture Document

> Version: 0.1 | Phase: 0 — Research & Planning

## Stack Overview

This project uses **Next.js 16.2.6** (App Router) with **React 19**, mounted as a sub-route `/earth-os` within an existing Next.js application. The existing site at `/` is preserved untouched.

## Runtime & Framework

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 16.2.6 (App Router) | Existing project constraint |
| Language | TypeScript 5 | Type safety, IDE support |
| UI | React 19 | Server Components, Actions |
| Styling | Tailwind CSS v4 | Utility-first, existing config |
| State | Zustand | Lightweight, fine-grained |
| Data Fetching | TanStack Query v5 | Caching, deduplication, stale-while-revalidate |
| Validation | Zod | Runtime schema validation |

## Globe Engine

| Component | Technology |
|-----------|-----------|
| Primary Globe | MapLibre GL JS 4.x |
| Projection | Globe projection (`projection: 'globe'`) |
| Basemap | CARTO Dark Matter tiles (free, no key required) |
| Point Layers | deck.gl + MapLibre integration |
| Geographic Calcs | Turf.js |
| Custom Effects | Three.js (atmosphere only, after base works) |

## API Architecture

All external API calls are proxied through **Next.js Route Handlers** (`/app/api/earth-os/`).

### Why Server-Side Proxy
1. API keys never reach the browser
2. CORS avoidance
3. Response caching via `Cache-Control` headers
4. Rate limit management centralized
5. Circuit breaker pattern implementable

### Route Structure
```
app/api/earth-os/
  earthquakes/route.ts       → USGS proxy
  events/route.ts            → NASA EONET proxy
  fires/route.ts             → NASA FIRMS proxy
  atmosphere/route.ts        → Open-Meteo + OpenAQ proxy
  satellite/route.ts         → GIBS metadata proxy
  space-weather/route.ts     → NASA DONKI proxy
  search/route.ts            → Geocoding proxy
  health/route.ts            → Provider health check
```

## Data Flow

```
Browser → Next.js Route Handler → External API
                ↓
         Validate (Zod)
                ↓
         Normalize (Adapter)
                ↓
         Cache (HTTP headers + in-memory)
                ↓
         Return unified response
```

## Caching Strategy

| Data Type | TTL | Strategy |
|-----------|-----|---------|
| Earthquake feeds | 2 min | stale-while-revalidate |
| EONET events | 5 min | stale-while-revalidate |
| FIRMS fire data | 10 min | Cache-Control max-age |
| Air quality | 15 min | stale-while-revalidate |
| Weather forecast | 30 min | Cache-Control max-age |
| GIBS imagery | 1 hour | Cache-Control max-age |
| World Bank data | 24 hours | Long-lived cache |

## Security Architecture

- All API keys in `.env.local` only (server-side)
- `NEXT_PUBLIC_` prefix NEVER used for secrets
- Input validation on all Route Handler parameters
- Output sanitization before rendering
- CSP headers configured in `next.config.ts`
- CORS restricted to same-origin in Route Handlers

## Module Map

```
/earth-os
├── layout.tsx              — Earth OS shell (sidebar, topbar, panels)
├── page.tsx               — Default view (Explorer module)
├── loading.tsx            — Loading skeleton
│
├── explorer/
│   └── page.tsx           — Module A: Earth Explorer
├── events/
│   └── page.tsx           — Module B: Live Events
├── satellite/
│   └── page.tsx           — Module C: Satellite Observatory
├── atmosphere/
│   └── page.tsx           — Module D: Atmosphere Intelligence
├── history/
│   └── page.tsx           — Module E: Earth Time Machine
├── analytics/
│   └── page.tsx           — Module F: Planet Analytics
└── intelligence/
    └── page.tsx           — Module G: Earth Intelligence
```

## Performance Targets

| Metric | Target | Method |
|--------|--------|--------|
| LCP | ≤ 2.5s | Static shell, deferred globe load |
| Globe FPS | 60fps target | GPU compositing, LOD |
| Bundle size | < 300KB initial | Code splitting, dynamic imports |
| Memory | No leak after 1hr | MapLibre cleanup, proper useEffect cleanup |

## Component Architecture

### Globe Component (Critical Path)
- Wrapped in `dynamic(() => import(...), { ssr: false })` — WebGL requires client
- Stable ref prevents re-instantiation on re-render
- Source updates use `map.getSource(id).setData()` not map recreation
- Resize observer handles layout changes

### State Architecture
```
earthOsStore (Zustand)
├── activeModule: ModuleId
├── selectedEvent: UnifiedEvent | null
├── globeState: { center, zoom, bearing, pitch }
├── activeLayers: LayerId[]
├── dateRange: { from, to }
├── timelineDate: Date
└── uiState: { inspectorOpen, timelineOpen, fullscreen }
```

## File Structure
```
src/
  app/
    earth-os/              — Route group for all Earth OS pages
    api/earth-os/          — Server-side API proxy routes
  features/earth-os/       — Feature-specific components
  services/earth-os/       — API adapters, schemas, normalizers
  stores/earth-os/         — Zustand stores
  hooks/earth-os/          — Custom hooks
  types/earth-os/          — TypeScript types
  components/earth-os/     — Shared UI components
    globe/                 — Globe-specific components
    ui/                    — Earth OS design system components
```
