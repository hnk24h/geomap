import { NextResponse } from 'next/server'
import type { GeoJsonObject } from 'geojson'
import { prisma } from '../../../../../../lib/prisma'

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params

  const country = await prisma.country.findUnique({
    where: { slug },
    include: {
      provinces: {
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!country) {
    return NextResponse.json({ error: 'Country not found.' }, { status: 404 })
  }

  const featureCollection = {
    type: 'FeatureCollection',
    features: country.provinces
      .filter((province) => province.geometry)
      .map((province) => ({
        type: 'Feature',
        properties: {
          slug: province.slug,
          Name: province.name,
          color: province.color,
        },
        geometry: province.geometry as unknown as GeoJsonObject,
      })),
  }

  return NextResponse.json(featureCollection, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
