import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

const LOCAL_AREA_TYPES = ['DISTRICT', 'WARD', 'CITY'] as const
type LocalAreaType = (typeof LOCAL_AREA_TYPES)[number]
const isLocalAreaType = (value: unknown): value is LocalAreaType =>
  typeof value === 'string' && LOCAL_AREA_TYPES.includes(value as LocalAreaType)

const parseFloatField = (value: unknown) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const provinceIdParam = searchParams.get('provinceId')
  const levelTypeParam = searchParams.get('levelType')
  const provinceId = provinceIdParam ? Number(provinceIdParam) : null
  const levelType = isLocalAreaType(levelTypeParam) ? levelTypeParam : null

  const districts = await prisma.district.findMany({
    where: {
      ...(Number.isInteger(provinceId) ? { provinceId: provinceId as number } : {}),
      ...(levelType ? { levelType } : {}),
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(districts)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const provinceId = Number(body.provinceId)
    const lat = parseFloatField(body.lat)
    const lng = parseFloatField(body.lng)
    const levelType = isLocalAreaType(body.levelType) ? body.levelType : 'DISTRICT'

    if (!Number.isInteger(provinceId)) {
      return NextResponse.json({ error: 'provinceId is required.' }, { status: 400 })
    }

    if (!body.slug || !body.name || !body.subtitle || !body.fact || !body.color || lat === null || lng === null) {
      return NextResponse.json({ error: 'Missing required district fields.' }, { status: 400 })
    }

    const created = await prisma.district.create({
      data: {
        provinceId,
        slug: String(body.slug),
        name: String(body.name),
        subtitle: String(body.subtitle),
        fact: String(body.fact),
        color: String(body.color),
        levelType,
        lat,
        lng,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create district.', detail: String(error) }, { status: 500 })
  }
}
