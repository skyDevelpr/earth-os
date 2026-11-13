# EARTH OS — Production Deployment Guide

## 1. Environment Setup
To deploy EARTH OS into production:
1. Configure `.env.local` or host environment variables:
   ```bash
   FIRMS_MAP_KEY=<your_nasa_firms_key>
   OPENAQ_API_KEY=<your_openaq_v3_key>
   NASA_API_KEY=<your_nasa_api_key_or_DEMO_KEY>
   ```
2. Open data feeds (USGS Earthquakes, NASA EONET v3, NASA GIBS Imagery, Open-Meteo Weather, OpenStreetMap Nominatim) work out of the box with zero credentials.

---

## 2. Production Build & Static Assets
```bash
# Build the production bundle
npm run build

# Start the Next.js production server
npm run start -p 3000
```

---

## 3. Platform Deployment Options

### A. Vercel / Next.js Native
1. Connect Git repository to Vercel.
2. Add environment secrets in Project Settings -> Environment Variables.
3. Edge network will cache Route Handler responses according to `Cache-Control` max-age headers.

### B. Cloudflare Pages / Workers
1. Use `@cloudflare/next-on-pages` or standalone Next.js container deployment.
2. Route handlers execute on V8 isolate edge runtime.
3. Public assets and map tiles served globally via Cloudflare CDN.

### C. Docker Container
A multi-stage Dockerfile can be utilized:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 4. Health Check Endpoint
Monitor operational health across all 7 planetary data providers via:
`GET /api/earth-os/health`

Returns HTTP 200 with JSON payload:
```json
{
  "status": "healthy",
  "providers": [
    { "provider": "usgs", "status": "healthy", "configured": true },
    { "provider": "eonet", "status": "healthy", "configured": true },
    { "provider": "firms", "status": "healthy", "configured": true },
    { "provider": "openmeteo", "status": "healthy", "configured": true },
    { "provider": "gibs", "status": "healthy", "configured": true }
  ]
}
```
