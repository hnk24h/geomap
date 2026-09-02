'use client'

import { useEffect, useState } from 'react'

type Feature = { properties: { Name?: string }; geometry: { type: string; coordinates: number[][][] | number[][][][] } }
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase().replace(/[^a-z0-9]/g, '')
const aliases: Record<string, string> = { 'can-tho': 'canthocity', 'da-nang': 'danangcity' }

function toPath(feature: Feature) {
  const polygons = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates as number[][][][] : [feature.geometry.coordinates as number[][][]]
  const ring = polygons.map(polygon => polygon[0]).sort((a, b) => b.length - a.length)[0]
  const xs = ring.map(point => point[0]); const ys = ring.map(point => point[1]); const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys)
  const scale = Math.min(74 / Math.max(.001, maxX - minX), 74 / Math.max(.001, maxY - minY)); const offsetX = 50 - (minX + maxX) / 2 * scale; const offsetY = 50 + (minY + maxY) / 2 * scale
  return ring.map((point, index) => `${index ? 'L' : 'M'}${point[0] * scale + offsetX} ${-point[1] * scale + offsetY}`).join(' ') + 'Z'
}

export default function ProvincePieceShape({ slug, color }: { slug: string; color: string }) {
  const [path, setPath] = useState<string | null>(null)
  useEffect(() => { fetch('/data/vietnam-provinces.geojson').then(r => r.json()).then(data => { const expected = aliases[slug] || normalize(slug); const feature = data.features.find((item: Feature) => normalize(item.properties.Name || '') === expected); if (feature) setPath(toPath(feature)) }).catch(() => undefined) }, [slug])
  return <svg viewBox="0 0 100 100" className="province-piece-shape" aria-hidden="true">{path ? <path d={path} fill={color} stroke="#fffefa" strokeWidth="3" strokeLinejoin="round"/> : <path d="M22 12L77 20 86 57 61 88 19 74 11 40Z" fill={color}/>}</svg>
}
