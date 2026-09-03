import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

const parseFloatField = (value: unknown) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const parseStringList = (value: unknown) =>
  Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : []

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const provinceId = Number(id)
    if (!Number.isInteger(provinceId)) {
      return NextResponse.json({ error: 'Invalid province id.' }, { status: 400 })
    }

    const body = await request.json()
    const data: {
      countryId?: number
      slug?: string
      name?: string
      subtitle?: string
      fact?: string
      color?: string
      coverImageUrl?: string | null
      attractions?: string[]
      notablePeople?: string[]
      lat?: number
      lng?: number
    } = {}

    if (body.countryId !== undefined) {
      const countryId = Number(body.countryId)
      if (!Number.isInteger(countryId)) return NextResponse.json({ error: 'Invalid countryId.' }, { status: 400 })
      data.countryId = countryId
    }

    if (body.slug !== undefined) data.slug = String(body.slug)
    if (body.name !== undefined) data.name = String(body.name)
    if (body.subtitle !== undefined) data.subtitle = String(body.subtitle)
    if (body.fact !== undefined) data.fact = String(body.fact)
    if (body.color !== undefined) data.color = String(body.color)
    if (body.coverImageUrl !== undefined) data.coverImageUrl = body.coverImageUrl ? String(body.coverImageUrl) : null
    if (body.attractions !== undefined) data.attractions = parseStringList(body.attractions)
    if (body.notablePeople !== undefined) data.notablePeople = parseStringList(body.notablePeople)

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

    const updated = await prisma.province.update({ where: { id: provinceId }, data })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update province.', detail: String(error) }, { status: 500 })
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const provinceId = Number(id)
    if (!Number.isInteger(provinceId)) {
      return NextResponse.json({ error: 'Invalid province id.' }, { status: 400 })
    }

    await prisma.province.delete({ where: { id: provinceId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete province.', detail: String(error) }, { status: 500 })
  }
}
