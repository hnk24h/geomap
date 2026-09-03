import { NextResponse } from 'next/server'
import { prisma } from '../../../../../../lib/prisma'

const toPositiveInt = (value: string | null, fallback: number) => {
  const numeric = Number(value)
  return Number.isInteger(numeric) && numeric > 0 ? numeric : fallback
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const { searchParams } = new URL(request.url)

  const offset = toPositiveInt(searchParams.get('offset'), 0)
  const limit = toPositiveInt(searchParams.get('limit'), 10)

  const country = await prisma.country.findUnique({
    where: { slug },
    select: { id: true, unlockBatchSize: true, _count: { select: { provinces: true } } },
  })

  if (!country) {
    return NextResponse.json({ error: 'Country not found.' }, { status: 404 })
  }

  const items = await prisma.province.findMany({
    where: { countryId: country.id },
    orderBy: { name: 'asc' },
    skip: offset,
    take: limit,
    select: {
      slug: true,
      name: true,
      subtitle: true,
      fact: true,
      lat: true,
      lng: true,
      color: true,
      coverImageUrl: true,
      attractions: true,
      notablePeople: true,
    },
  })

  return NextResponse.json({
    items,
    total: country._count.provinces,
    unlockBatchSize: country.unlockBatchSize,
    offset,
    limit,
  })
}
