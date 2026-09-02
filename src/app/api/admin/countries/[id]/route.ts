import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

const parseFloatField = (value: unknown) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const countryId = Number(id)
    if (!Number.isInteger(countryId)) {
      return NextResponse.json({ error: 'Invalid country id.' }, { status: 400 })
    }

    const body = await request.json()
    const data: {
      slug?: string
      name?: string
      subtitle?: string
      fact?: string
      color?: string
      unlockBatchSize?: number
      lat?: number
      lng?: number
    } = {}

    if (body.slug !== undefined) data.slug = String(body.slug)
    if (body.name !== undefined) data.name = String(body.name)
    if (body.subtitle !== undefined) data.subtitle = String(body.subtitle)
    if (body.fact !== undefined) data.fact = String(body.fact)
    if (body.color !== undefined) data.color = String(body.color)
    if (body.unlockBatchSize !== undefined) {
      const unlockBatchSize = Number(body.unlockBatchSize)
      if (!Number.isInteger(unlockBatchSize) || unlockBatchSize <= 0) {
        return NextResponse.json({ error: 'Invalid unlockBatchSize.' }, { status: 400 })
      }
      data.unlockBatchSize = unlockBatchSize
    }

    if (body.lat !== undefined) {
      const lat = parseFloatField(body.lat)
      if (lat === null) return NextResponse.json({ error: 'Invalid latitude.' }, { status: 400 })
      data.lat = lat
    }

    if (body.lng !== undefined) {
      const lng = parseFloatField(body.lng)
      if (lng === null) return NextResponse.json({ error: 'Invalid longitude.' }, { status: 400 })
      data.lng = lng
    }

    const updated = await prisma.country.update({ where: { id: countryId }, data })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update country.', detail: String(error) }, { status: 500 })
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const countryId = Number(id)
    if (!Number.isInteger(countryId)) {
      return NextResponse.json({ error: 'Invalid country id.' }, { status: 400 })
    }

    await prisma.country.delete({ where: { id: countryId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete country.', detail: String(error) }, { status: 500 })
  }
}
