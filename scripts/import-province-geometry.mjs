import fs from 'node:fs/promises'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const aliases = {
  'can-tho': 'canthocity',
  'da-nang': 'danangcity',
}

const palette = ['#F2B950', '#83C7B8', '#ED8068', '#AB8ED7', '#F3C25F', '#72B8D5', '#6BB0A2', '#F09979']

const toSlug = (value) =>
  String(value || '')
    .replace(/\scity$/i, '')
    .replace(/\s+-\s+/g, ' ')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const pickColor = (slug) => {
  let hash = 0
  for (let index = 0; index < slug.length; index += 1) hash = (hash * 31 + slug.charCodeAt(index)) >>> 0
  return palette[hash % palette.length]
}

const toMultiPolygonCoordinates = (geometry) => {
  if (!geometry) return []
  if (geometry.type === 'Polygon') return [geometry.coordinates]
  if (geometry.type === 'MultiPolygon') return geometry.coordinates
  return []
}

const mergeGeometry = (features) => {
  const allCoordinates = []
  for (const feature of features) {
    for (const polygon of toMultiPolygonCoordinates(feature.geometry)) allCoordinates.push(polygon)
  }

  if (allCoordinates.length === 0) return null
  if (allCoordinates.length === 1) return { type: 'Polygon', coordinates: allCoordinates[0] }
  return { type: 'MultiPolygon', coordinates: allCoordinates }
}

const computeCenter = (geometry) => {
  const polygons = toMultiPolygonCoordinates(geometry)
  let count = 0
  let lngSum = 0
  let latSum = 0

  for (const polygon of polygons) {
    const ring = polygon?.[0] || []
    for (const point of ring) {
      lngSum += point[0]
      latSum += point[1]
      count += 1
    }
  }

  if (!count) return { lat: 0, lng: 0 }
  return { lat: latSum / count, lng: lngSum / count }
}

async function main() {
  const filePath = new URL('../public/data/vietnam-provinces.geojson', import.meta.url)
  const raw = await fs.readFile(filePath, 'utf8')
  const geo = JSON.parse(raw)

  const country = await prisma.country.findUnique({
    where: { slug: 'vietnam' },
    include: { provinces: true },
  })

  if (!country) {
    throw new Error('Country vietnam not found. Run seed first.')
  }

  const groupedByName = new Map()
  for (const feature of geo.features || []) {
    const key = normalize(feature?.properties?.Name)
    if (!key) continue
    if (!groupedByName.has(key)) groupedByName.set(key, [])
    groupedByName.get(key).push(feature)
  }

  let imported = 0

  for (const features of groupedByName.values()) {
    const displayName = String(features[0]?.properties?.Name || '').trim()
    const geometry = mergeGeometry(features)
    if (!displayName || !geometry) continue

    const slug = toSlug(displayName)
    const center = computeCenter(geometry)

    const existing = country.provinces.find((province) => {
      const aliasesName = aliases[province.slug] || ''
      return normalize(province.name) === normalize(displayName) || normalize(province.slug) === normalize(slug) || (aliasesName && normalize(aliasesName) === normalize(displayName))
    })

    const baseData = {
      slug,
      name: displayName,
      subtitle: existing?.subtitle || 'Vietnam',
      fact: existing?.fact || `${displayName} is an administrative unit of Vietnam.`,
      color: existing?.color || pickColor(slug),
      lat: center.lat,
      lng: center.lng,
      geometry,
      countryId: country.id,
    }

    await prisma.province.upsert({
      where: { countryId_slug: { countryId: country.id, slug } },
      update: baseData,
      create: baseData,
    })

    imported += 1
  }

  const total = await prisma.province.count({ where: { countryId: country.id } })
  console.log('Imported/updated provinces from GeoJSON:', imported)
  console.log('Total provinces in DB for vietnam:', total)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
