'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { GeoPlace } from '../lib/geo'

type MapViewProps = {
  center: [number, number]
  zoom: number
  places: GeoPlace[]
  selected?: string
  placed?: string[]
  onPlace?: (slug: string) => void
  onDrop?: (lat: number, lng: number) => void
  focusView?: boolean
  draggingSlug?: string | null
  isCorrectDropTarget?: boolean
  onDragPosition?: (lat: number, lng: number) => void
}

/** Uses Leaflet directly so React Strict Mode can reliably destroy its map instance. */
export default function MapView({ center, zoom, places, selected, placed = [], onPlace, onDrop, focusView = false, draggingSlug, isCorrectDropTarget = false, onDragPosition }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const boundaryLayerRef = useRef<L.GeoJSON | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || mapRef.current) return

    // React development remounts can leave Leaflet's private stamp on the DOM node.
    if ((container as HTMLDivElement & { _leaflet_id?: number })._leaflet_id) {
      container.replaceChildren()
      delete (container as HTMLDivElement & { _leaflet_id?: number })._leaflet_id
    }

    const map = L.map(container, { center, zoom, zoomControl: false, scrollWheelZoom: true })
    tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [center, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    tileLayerRef.current?.setOpacity(focusView ? .16 : 1)
    boundaryLayerRef.current?.remove()
    fetch('/data/vietnam-provinces.geojson').then(response => response.json()).then((data) => {
      if (!mapRef.current) return
      const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase().replace(/[^a-z0-9]/g, '')
      const aliases: Record<string, string> = { 'can-tho': 'canthocity', 'da-nang': 'danangcity' }
      boundaryLayerRef.current = L.geoJSON(data, {
        style: (feature) => {
          const name = normalize(String(feature?.properties?.Name || ''))
          const place = places.find(item => (aliases[item.slug] || normalize(item.slug)) === name)
          const isPlaced = Boolean(place && placed.includes(place.slug))
          const isMagneticTarget = Boolean(place && place.slug === draggingSlug && isCorrectDropTarget)
          const isHintTarget = Boolean(place && place.slug === selected)
          return { color: isPlaced || isMagneticTarget || isHintTarget ? place!.color : focusView ? '#355e62' : '#548078', weight: isMagneticTarget ? 4 : isHintTarget || isPlaced ? 3 : focusView ? 1.8 : 1.1, fillColor: isPlaced || isMagneticTarget || isHintTarget ? place!.color : focusView ? '#b7cbc4' : '#b6c9c2', fillOpacity: isPlaced ? .92 : isMagneticTarget ? .63 : isHintTarget ? .48 : focusView ? .96 : .16, className: isMagneticTarget ? 'magnetic-province' : isHintTarget ? 'hint-province' : isPlaced ? 'placed-province' : '' }
        },
        onEachFeature: (feature, layer) => {
          const name = normalize(String(feature.properties?.Name || ''))
          const place = places.find(item => (aliases[item.slug] || normalize(item.slug)) === name)
          if (place) layer.on('click', () => onPlace?.(place.slug))
        },
      }).addTo(map)
      boundaryLayerRef.current.bringToBack()
      tileLayerRef.current?.bringToBack()
    }).catch(() => undefined)
    return () => { boundaryLayerRef.current?.remove(); boundaryLayerRef.current = null }
  }, [focusView, places, placed, selected, draggingSlug, isCorrectDropTarget, onPlace])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const pointFromEvent = (event: DragEvent) => {
      const map = mapRef.current
      if (!map) return null
      const rect = container.getBoundingClientRect()
      return map.containerPointToLatLng([event.clientX - rect.left, event.clientY - rect.top])
    }
    const allowDrop = (event: DragEvent) => { event.preventDefault(); const position = pointFromEvent(event); if (position) onDragPosition?.(position.lat, position.lng) }
    const drop = (event: DragEvent) => {
      event.preventDefault()
      const position = pointFromEvent(event)
      if (!position) return
      onDrop?.(position.lat, position.lng)
    }
    container.addEventListener('dragover', allowDrop)
    container.addEventListener('drop', drop)
    return () => { container.removeEventListener('dragover', allowDrop); container.removeEventListener('drop', drop) }
  }, [onDrop, onDragPosition])

  return <div ref={containerRef} className="leaflet-map" aria-label="Interactive OpenStreetMap map" />
}
