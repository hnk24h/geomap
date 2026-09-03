import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

const parseFloatField = (value: unknown) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const parseStringList = (value: unknown) =>
  Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : []

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const countryIdParam = searchParams.get('countryId')
  const countryId = countryIdParam ? Number(countryIdParam) : null

  const provinces = await prisma.province.findMany({
    where: Number.isInteger(countryId) ? { countryId: countryId as number } : undefined,
    orderBy: { name: 'asc' },
    include: { _count: { select: { districts: true } }, country: true },
  })
  return NextResponse.json(provinces)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const countryId = Number(body.countryId)
    const lat = parseFloatField(body.lat)
    const lng = parseFloatField(body.lng)

    if (!Number.isInteger(countryId)) {
      return NextResponse.json({ error: 'countryId is required.' }, { status: 400 })
    }

    if (!body.slug || !body.name || !body.subtitle || !body.fact || !body.color || lat === null || lng === null) {
      return NextResponse.json({ error: 'Missing required province fields.' }, { status: 400 })
    }

    const created = await prisma.province.create({
      data: {
        countryId,
        slug: String(body.slug),
        name: String(body.name),
        subtitle: String(body.subtitle),
        fact: String(body.fact),
        color: String(body.color),
        coverImageUrl: body.coverImageUrl ? String(body.coverImageUrl) : null,
        attractions: parseStringList(body.attractions),
        notablePeople: parseStringList(body.notablePeople),
        lat,
        lng,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create province.', detail: String(error) }, { status: 500 })
  }
}
