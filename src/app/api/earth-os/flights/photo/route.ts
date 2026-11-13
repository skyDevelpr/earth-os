import { NextResponse } from 'next/server'

interface PhotoCacheEntry {
  timestamp: number
  photo: {
    url: string
    photographer: string
    link: string
    source: string
    aircraftModel?: string
  } | null
}

const photoCache = new Map<string, PhotoCacheEntry>()
const PHOTO_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reg = (searchParams.get('reg') || '').trim()
  const hex = (searchParams.get('hex') || '').trim().toLowerCase()

  if (!reg && !hex) {
    return NextResponse.json({ success: false, error: 'Registration or Hex required' }, { status: 400 })
  }

  const cacheKey = reg ? `reg_${reg.toUpperCase()}` : `hex_${hex}`
  const cached = photoCache.get(cacheKey)
  const now = Date.now()

  if (cached && now - cached.timestamp < PHOTO_CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      cached: true,
      photo: cached.photo,
    })
  }

  const userAgent = 'EarthOS-Aviation-Intelligence/1.0 (+https://earth-os.dev/contact)'

  try {
    let photoData: any = null

    // 1. Priority 1: Match by Registration
    if (reg) {
      try {
        const cleanReg = encodeURIComponent(reg.toUpperCase())
        const regRes = await fetch(`https://api.planespotters.net/pub/photos/reg/${cleanReg}`, {
          headers: { 'User-Agent': userAgent, Accept: 'application/json' },
          next: { revalidate: 86400 },
        })

        if (regRes.ok) {
          const json = await regRes.json()
          if (json.photos && json.photos.length > 0) {
            photoData = json.photos[0]
          }
        }
      } catch (err) {
        console.warn(`[Planespotters] Registration lookup failed for ${reg}:`, err)
      }
    }

    // 2. Priority 2: Match by ICAO 24-bit Hex address
    if (!photoData && hex) {
      try {
        const hexRes = await fetch(`https://api.planespotters.net/pub/photos/hex/${hex}`, {
          headers: { 'User-Agent': userAgent, Accept: 'application/json' },
          next: { revalidate: 86400 },
        })

        if (hexRes.ok) {
          const json = await hexRes.json()
          if (json.photos && json.photos.length > 0) {
            photoData = json.photos[0]
          }
        }
      } catch (err) {
        console.warn(`[Planespotters] Hex lookup failed for ${hex}:`, err)
      }
    }

    if (photoData) {
      const resultPhoto = {
        url: photoData.thumbnail_large?.src || photoData.thumbnail?.src || '',
        photographer: photoData.photographer || 'Planespotters Contributor',
        link: photoData.link || 'https://www.planespotters.net',
        source: 'Planespotters.net',
        aircraftModel: photoData.link ? decodeURIComponent(photoData.link.split('/')[5] || '').replace(/-/g, ' ') : undefined,
      }

      photoCache.set(cacheKey, { timestamp: now, photo: resultPhoto })

      return NextResponse.json({
        success: true,
        photo: resultPhoto,
      })
    }

    // No photo found for this specific registration/hex
    photoCache.set(cacheKey, { timestamp: now, photo: null })
    return NextResponse.json({
      success: true,
      photo: null,
      message: 'No photograph registered for this aircraft.',
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      photo: null,
    })
  }
}
