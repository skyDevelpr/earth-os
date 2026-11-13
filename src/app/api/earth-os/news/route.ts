// Route Handler: /api/earth-os/news
// Live global natural disaster, seismic, and climate news feed
// Integrates GDELT Project Doc 2.0 API & verified scientific bulletins

import type { NextRequest } from 'next/server'
import { fetchPlanetaryNews } from '@/services/earth-os/adapters/news.adapter'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const query = searchParams.get('q') || undefined
  const category = searchParams.get('category') || undefined
  const location = searchParams.get('location') || undefined
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : 25

  try {
    const articles = await fetchPlanetaryNews({
      query,
      category,
      location,
      limit,
    })

    return Response.json(
      {
        articles,
        count: articles.length,
        provider: 'gdelt',
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=180, s-maxage=300', // Cache 3-5 min
        },
      }
    )
  } catch (err: any) {
    console.error('[/api/earth-os/news] Error fetching news:', err)
    return Response.json(
      {
        articles: [],
        error: err?.message || 'Failed to fetch planetary news',
        fetchedAt: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
