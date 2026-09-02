import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

const parseFloatField = (value: unknown) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export async function GET() {
  const countries = await prisma.country.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { provinces: true } } },
  })

  return NextResponse.json(countries)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const lat = parseFloatField(body.lat)
    const lng = parseFloatField(body.lng)
    const unlockBatchSize = Number(body.unlockBatchSize)

    if (!body.slug || !body.name || !body.subtitle || !body.fact || !body.color || lat === null || lng === null) {
      return NextResponse.json({ error: 'Missing required country fields.' }, { status: 400 })
    }

    if (!Number.isInteger(unlockBatchSize) || unlockBatchSize <= 0) {
      return NextResponse.json({ error: 'unlockBatchSize must be a positive integer.' }, { status: 400 })
    }

    const created = await prisma.country.create({
      data: {
        slug: String(body.slug),
        name: String(body.name),
        subtitle: String(body.subtitle),
        fact: String(body.fact),
        color: String(body.color),
        unlockBatchSize,
        lat,
        lng,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create country.', detail: String(error) }, { status: 500 })
  }
}
