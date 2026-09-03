import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

const LOCAL_AREA_TYPES = ['DISTRICT', 'WARD', 'CITY'] as const
type LocalAreaType = (typeof LOCAL_AREA_TYPES)[number]
const isLocalAreaType = (value: unknown): value is LocalAreaType =>
  typeof value === 'string' && LOCAL_AREA_TYPES.includes(value as LocalAreaType)

const parseFloatField = (value: unknown) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const parseStringList = (value: unknown) =>
  Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : []

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const districtId = Number(id)
    if (!Number.isInteger(districtId)) {
      return NextResponse.json({ error: 'Invalid district id.' }, { status: 400 })
    }

    const body = await request.json()
    const data: {
      provinceId?: number
      slug?: string
      name?: string
      subtitle?: string
      fact?: string
      color?: string
      levelType?: LocalAreaType
      coverImageUrl?: string | null
      attractions?: string[]
      notablePeople?: string[]
      lat?: number
      lng?: number
    } = {}

    if (body.provinceId !== undefined) {
      const provinceId = Number(body.provinceId)
      if (!Number.isInteger(provinceId)) return NextResponse.json({ error: 'Invalid provinceId.' }, { status: 400 })
      data.provinceId = provinceId
    }
    if (body.slug !== undefined) data.slug = String(body.slug)
    if (body.name !== undefined) data.name = String(body.name)
    if (body.subtitle !== undefined) data.subtitle = String(body.subtitle)
    if (body.fact !== undefined) data.fact = String(body.fact)
    if (body.color !== undefined) data.color = String(body.color)
    if (body.coverImageUrl !== undefined) data.coverImageUrl = body.coverImageUrl ? String(body.coverImageUrl) : null
    if (body.attractions !== undefined) data.attractions = parseStringList(body.attractions)
    if (body.notablePeople !== undefined) data.notablePeople = parseStringList(body.notablePeople)
    if (body.levelType !== undefined) {
      if (!isLocalAreaType(body.levelType)) {
        return NextResponse.json({ error: 'Invalid levelType.' }, { status: 400 })
      }
      data.levelType = body.levelType
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

    const updated = await prisma.district.update({ where: { id: districtId }, data })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update district.', detail: String(error) }, { status: 500 })
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const districtId = Number(id)
    if (!Number.isInteger(districtId)) {
      return NextResponse.json({ error: 'Invalid district id.' }, { status: 400 })
    }

    await prisma.district.delete({ where: { id: districtId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete district.', detail: String(error) }, { status: 500 })
  }
}
