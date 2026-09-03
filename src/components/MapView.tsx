'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { FeatureCollection, GeoJsonObject } from 'geojson'
import type { GeoPlace, GeoSubdivision } from '../lib/geo'

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
  isNearDropTarget?: boolean
  onDragPosition?: (lat: number, lng: number) => void
  focusSlug?: string
  subdivisions?: GeoSubdivision[]
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const aliases: Record<string, string> = {
  'can-tho': 'canthocity',
  'da-nang': 'danangcity',
}

let provinceGeoJsonCache: FeatureCollection | null = null
let provinceGeoJsonRequest: Promise<FeatureCollection> | null = null

const loadProvinceGeoJson = () => {
  if (provinceGeoJsonCache) return Promise.resolve(provinceGeoJsonCache)

  if (!provinceGeoJsonRequest) {
    provinceGeoJsonRequest = fetch('/api/geo/countries/vietnam/provinces')
      .then((response) => response.json() as Promise<FeatureCollection>)
      .then((data) => {
        provinceGeoJsonCache = data
        return data
      })
      .finally(() => {
        provinceGeoJsonRequest = null
      })
  }

  return provinceGeoJsonRequest
}

/** Uses Leaflet directly so React Strict Mode can reliably destroy its map instance. */
export default function MapView({
  center,
  zoom,
  places,
  selected,
  placed = [],
  onPlace,
  onDrop,
  focusView = false,
  draggingSlug,
  isCorrectDropTarget = false,
  isNearDropTarget = false,
  onDragPosition,
  focusSlug,
  subdivisions = [],
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const provinceLayerRef = useRef<L.GeoJSON | null>(null)
  const subdivisionsLayerRef = useRef<L.FeatureGroup | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const autoFocusedProvinceRef = useRef<string | null>(null)
  const onPlaceRef = useRef(onPlace)
  const gameplayStateRef = useRef({ places, placed, selected, draggingSlug, isCorrectDropTarget, isNearDropTarget, focusView, focusSlug })

  onPlaceRef.current = onPlace
  gameplayStateRef.current = { places, placed, selected, draggingSlug, isCorrectDropTarget, isNearDropTarget, focusView, focusSlug }

  const provinceStyle = (feature?: GeoJSON.Feature) => {
    const state = gameplayStateRef.current
    const featureSlug = String(feature?.properties?.slug || '')
    const name = normalize(String(feature?.properties?.Name || ''))
    const place = state.places.find((item) => item.slug === featureSlug || (aliases[item.slug] || normalize(item.slug)) === name)
    const isPlaced = Boolean(place && state.placed.includes(place.slug))
    const isMagneticTarget = Boolean(place && place.slug === state.draggingSlug && state.isCorrectDropTarget)
    const isNearTarget = Boolean(place && place.slug === state.draggingSlug && state.isNearDropTarget && !state.isCorrectDropTarget)
    const isHintTarget = Boolean(place && place.slug === state.selected)
    const focusedSlug = state.focusSlug ? normalize(aliases[state.focusSlug] || state.focusSlug) : null
    const isFocused = Boolean(focusedSlug && name === focusedSlug)

    if (focusedSlug) {
      return isFocused
        ? { color: '#214b58', weight: state.focusView ? 3.2 : 2.6, fillColor: place?.color || '#9dcfc2', fillOpacity: state.focusView ? 0.82 : 0.36, className: 'focused-province' }
        : { color: '#7f9e9b', weight: 0.9, fillColor: '#d6e5e0', fillOpacity: state.focusView ? 0.03 : 0.1, className: 'non-focused-province' }
    }

    return {
      color: isPlaced || isMagneticTarget || isNearTarget || isHintTarget ? place!.color : state.focusView ? '#355e62' : '#548078',
      weight: isMagneticTarget ? 4.6 : isNearTarget ? 3.8 : isHintTarget ? 3.2 : isPlaced ? 3.4 : state.focusView ? 1.8 : 1.1,
      fillColor: isPlaced || isMagneticTarget || isNearTarget || isHintTarget ? place!.color : state.focusView ? '#b7cbc4' : '#b6c9c2',
      fillOpacity: isPlaced ? 0.88 : isMagneticTarget ? 0.68 : isNearTarget ? 0.28 : isHintTarget ? 0.48 : state.focusView ? 0.96 : 0.16,
      dashArray: isNearTarget ? '8 5' : undefined,
      className: isMagneticTarget ? 'magnetic-province' : isNearTarget ? 'near-target-province' : isHintTarget ? 'hint-province' : isPlaced ? 'placed-province' : '',
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container || mapRef.current) return

    // React development remounts can leave Leaflet's private stamp on the DOM node.
    if ((container as HTMLDivElement & { _leaflet_id?: number })._leaflet_id) {
      container.replaceChildren()
      delete (container as HTMLDivElement & { _leaflet_id?: number })._leaflet_id
    }

    const map = L.map(container, {
      center,
      zoom,
      zoomControl: false,
      scrollWheelZoom: true,
    })

    tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

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

    tileLayerRef.current?.setOpacity(focusView ? 0.16 : 1)
    provinceLayerRef.current?.remove()
    subdivisionsLayerRef.current?.remove()

    const focusedSlug = focusSlug ? normalize(aliases[focusSlug] || focusSlug) : null

    const drawLayers = (data: FeatureCollection) => {
        if (!mapRef.current) return

        let focusedBounds: L.LatLngBounds | null = null

        provinceLayerRef.current = L.geoJSON(data as GeoJsonObject, {
          style: provinceStyle,
          onEachFeature: (feature, layer) => {
            const featureSlug = String(feature?.properties?.slug || '')
            const name = normalize(String(feature.properties?.Name || ''))
            const place = places.find((item) => item.slug === featureSlug || (aliases[item.slug] || normalize(item.slug)) === name)

            if (focusedSlug && name === focusedSlug && 'getBounds' in (layer as object)) {
              focusedBounds = (layer as L.Polygon).getBounds()
            }

            layer.on('click', () => {
              const currentPlace = gameplayStateRef.current.places.find(
                (item) => item.slug === featureSlug || (aliases[item.slug] || normalize(item.slug)) === name,
              )
              if (currentPlace) onPlaceRef.current?.(currentPlace.slug)
            })
          },
        }).addTo(map)

        provinceLayerRef.current.bringToBack()
        tileLayerRef.current?.bringToBack()

        if (focusView && focusedBounds && autoFocusedProvinceRef.current !== focusedSlug) {
          map.fitBounds(focusedBounds, {
            padding: [20, 20],
            maxZoom: 11,
            animate: false,
          })
          autoFocusedProvinceRef.current = focusedSlug
        }

        if (!focusedSlug) autoFocusedProvinceRef.current = null

        if (subdivisions.length > 0) {
          const layerGroup = L.featureGroup()

          subdivisions.forEach((division) => {
            const polygon = L.polygon(division.coordinates, {
              color: '#173f4a',
              weight: focusView ? 2.2 : 1.8,
              fillOpacity: 0,
              opacity: 0.95,
              dashArray: focusView ? '0' : '5 3',
              className: 'district-divider',
            })
            polygon.addTo(layerGroup)
          })

          layerGroup.addTo(map)
          layerGroup.bringToFront()
          subdivisionsLayerRef.current = layerGroup
        }
    }

    if (provinceGeoJsonCache) {
      drawLayers(provinceGeoJsonCache)
    } else {
      void loadProvinceGeoJson()
        .then((data) => drawLayers(data))
        .catch(() => undefined)
    }

    return () => {
      provinceLayerRef.current?.remove()
      provinceLayerRef.current = null
      subdivisionsLayerRef.current?.remove()
      subdivisionsLayerRef.current = null
    }
  }, [])

  useEffect(() => {
    tileLayerRef.current?.setOpacity(focusView ? 0.16 : 1)
    provinceLayerRef.current?.setStyle(provinceStyle)
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const pointFromEvent = (event: DragEvent) => {
      const map = mapRef.current
      if (!map) return null
      const rect = container.getBoundingClientRect()
      return map.containerPointToLatLng([event.clientX - rect.left, event.clientY - rect.top])
    }

    const allowDrop = (event: DragEvent) => {
      event.preventDefault()
      const position = pointFromEvent(event)
      if (position) onDragPosition?.(position.lat, position.lng)
    }

    const drop = (event: DragEvent) => {
      event.preventDefault()
      const position = pointFromEvent(event)
      if (!position) return
      onDrop?.(position.lat, position.lng)
    }

    container.addEventListener('dragover', allowDrop)
    container.addEventListener('drop', drop)

    return () => {
      container.removeEventListener('dragover', allowDrop)
      container.removeEventListener('drop', drop)
    }
  }, [onDrop, onDragPosition])

  return <div ref={containerRef} className="leaflet-map" aria-label="Interactive OpenStreetMap map" />
}
