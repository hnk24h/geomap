'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Crosshair, Eye, EyeOff, Landmark, Lightbulb, LockKeyhole, MapPin, RotateCcw, Sparkles, Star, Trophy, UsersRound } from 'lucide-react'
import type { GeoPlace, GeoSubdivision } from '../lib/geo'
import ProvincePieceShape from './ProvincePieceShape'

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <div className="map-loading">Loading geographic map...</div>,
})

type PuzzleBoardProps = {
  title: string
  subtitle: string
  center: [number, number]
  zoom: number
  pieces: GeoPlace[]
  batchSize?: number
  totalPieces?: number
  loadMorePath?: string
  regionContext?: GeoPlace
  parentHref: string
  provinceMode?: boolean
  focusSlug?: string
  subdivisions?: GeoSubdivision[]
}

export default function PuzzleBoard({
  title,
  subtitle,
  center,
  zoom,
  pieces,
  batchSize = 10,
  totalPieces,
  loadMorePath,
  regionContext,
  parentHref,
  provinceMode = false,
  focusSlug,
  subdivisions = [],
}: PuzzleBoardProps) {
  const safeBatchSize = Math.max(1, Math.floor(batchSize))
  const [loadedPieces, setLoadedPieces] = useState<GeoPlace[]>(pieces)
  const [selected, setSelected] = useState(pieces[0]?.slug || '')
  const [placed, setPlaced] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [hint, setHint] = useState(false)
  const [fact, setFact] = useState<GeoPlace | null>(null)
  const [focusView, setFocusView] = useState(true)
  const [dragging, setDragging] = useState<string | null>(null)
  const [magneticTarget, setMagneticTarget] = useState(false)
  const [nearTarget, setNearTarget] = useState(false)
  const [unlockedCount, setUnlockedCount] = useState(Math.min(safeBatchSize, pieces.length))
  const [isUnlocking, setIsUnlocking] = useState(false)

  const totalPieceCount = Math.max(totalPieces ?? pieces.length, loadedPieces.length)
  const unlockedPieces = loadedPieces.slice(0, unlockedCount)
  const selectedPlace =
    unlockedPieces.find((p) => p.slug === selected) ||
    unlockedPieces.find((p) => !placed.includes(p.slug)) ||
    unlockedPieces[0] ||
    loadedPieces[0]
  const isComplete = placed.length === totalPieceCount
  const stageStart = Math.max(0, unlockedCount - safeBatchSize)
  const stagePieces = loadedPieces.slice(stageStart, unlockedCount)
  const stagePlacedCount = stagePieces.filter((piece) => placed.includes(piece.slug)).length
  const currentStage = Math.floor(Math.max(unlockedCount - 1, 0) / safeBatchSize) + 1
  const missionCount = Math.ceil(totalPieceCount / safeBatchSize)
  const completedMissionCount = Math.floor(placed.length / safeBatchSize)
  const hasPlaceDetails = Boolean(selectedPlace?.coverImageUrl || selectedPlace?.attractions?.length || selectedPlace?.notablePeople?.length)
  const explorePlace = provinceMode && !hasPlaceDetails ? regionContext || selectedPlace : selectedPlace

  useEffect(() => {
    setLoadedPieces(pieces)
    setUnlockedCount(Math.min(safeBatchSize, pieces.length))
    setSelected(pieces[0]?.slug || '')
    setPlaced([])
    setScore(0)
    setHint(false)
    setFact(null)
    setDragging(null)
    setMagneticTarget(false)
    setNearTarget(false)
  }, [pieces, safeBatchSize])

  useEffect(() => {
    if (isComplete || isUnlocking) return
    if (stagePieces.length === 0 || stagePlacedCount < stagePieces.length) return

    const unlockNextStage = async () => {
      setIsUnlocking(true)
      try {
        const targetUnlockedCount = Math.min(unlockedCount + safeBatchSize, totalPieceCount)
        let nextLoaded = loadedPieces

        if (nextLoaded.length < targetUnlockedCount && loadMorePath) {
          const response = await fetch(
            `${loadMorePath}?offset=${nextLoaded.length}&limit=${Math.max(safeBatchSize, targetUnlockedCount - nextLoaded.length)}`,
            { cache: 'no-store' },
          )

          if (response.ok) {
            const payload = (await response.json()) as { items?: GeoPlace[] }
            const items = Array.isArray(payload.items) ? payload.items : []
            if (items.length > 0) {
              const existing = new Set(nextLoaded.map((piece) => piece.slug))
              const append = items.filter((item) => !existing.has(item.slug))
              if (append.length > 0) {
                nextLoaded = [...nextLoaded, ...append]
                setLoadedPieces(nextLoaded)
              }
            }
          }
        }

        const nextUnlockedCount = Math.min(targetUnlockedCount, nextLoaded.length)
        setUnlockedCount(nextUnlockedCount)

        const nextSelection = nextLoaded.slice(0, nextUnlockedCount).find((piece) => !placed.includes(piece.slug))
        if (nextSelection) setSelected(nextSelection.slug)
      } finally {
        setIsUnlocking(false)
      }
    }

    void unlockNextStage()
  }, [
    isComplete,
    isUnlocking,
    loadedPieces,
    loadMorePath,
    placed,
    safeBatchSize,
    stagePieces,
    stagePlacedCount,
    totalPieceCount,
    unlockedCount,
  ])

  useEffect(() => {
    if (!selectedPlace) return
    if (!unlockedPieces.some((piece) => piece.slug === selectedPlace.slug)) {
      setSelected(unlockedPieces[0]?.slug || '')
    }
  }, [selectedPlace, unlockedPieces])

  useEffect(() => {
    if (!fact) return
    const timer = setTimeout(() => setFact(null), 3600)
    return () => clearTimeout(timer)
  }, [fact])

  const place = (slug: string) => {
    if (slug !== selected || placed.includes(slug)) return
    const item = unlockedPieces.find((p) => p.slug === slug)
    if (!item) return

    const next = [...placed, slug]
    setPlaced(next)
    setScore((value) => value + (hint ? 80 : 100))
    setFact(item)
    setHint(false)

    const remaining = unlockedPieces.find((p) => !next.includes(p.slug))
    if (remaining) setSelected(remaining.slug)
  }

  const distanceToNearest = (lat: number, lng: number) =>
    unlockedPieces.reduce(
      (best, item) => {
        const distance = Math.hypot(item.lat - lat, item.lng - lng)
        return distance < best.distance ? { item, distance } : best
      },
      { item: unlockedPieces[0], distance: Infinity },
    )

  const dropPiece = (lat: number, lng: number) => {
    if (!unlockedPieces.length) return
    const nearest = distanceToNearest(lat, lng)
    if (nearest.item.slug === selected && nearest.distance < (provinceMode ? 0.055 : 0.72)) {
      place(selected)
    }
    setDragging(null)
    setMagneticTarget(false)
    setNearTarget(false)
  }

  const movePiece = (lat: number, lng: number) => {
    if (!unlockedPieces.length) return
    const nearest = distanceToNearest(lat, lng)
    const isSelectedTarget = nearest.item.slug === selected
    const magneticThreshold = provinceMode ? 0.085 : 1.05
    const nearThreshold = provinceMode ? 0.15 : 1.8

    setMagneticTarget(isSelectedTarget && nearest.distance < magneticThreshold)
    setNearTarget(isSelectedTarget && nearest.distance < nearThreshold)
  }

  const startDragging = (event: React.DragEvent<HTMLButtonElement>, piece: GeoPlace) => {
    event.dataTransfer.effectAllowed = 'move'
    setSelected(piece.slug)
    setDragging(piece.slug)

    const shape = event.currentTarget.querySelector('svg')?.cloneNode(true) as SVGSVGElement | null
    if (!shape) return

    const ghost = document.createElement('div')
    ghost.className = 'drag-piece-ghost'
    shape.setAttribute('width', '96')
    shape.setAttribute('height', '96')
    ghost.appendChild(shape)
    document.body.appendChild(ghost)
    event.dataTransfer.setDragImage(ghost, 48, 48)
    requestAnimationFrame(() => ghost.remove())
  }

  const reset = () => {
    setPlaced([])
    setScore(0)
    setSelected(pieces[0]?.slug || '')
    setUnlockedCount(Math.min(safeBatchSize, pieces.length))
    setHint(false)
    setFact(null)
    setDragging(null)
    setMagneticTarget(false)
    setNearTarget(false)
  }

  return (
    <main className="puzzle-page">
      <header className="puzzle-nav">
        <Link href={parentHref} className="icon-btn">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <span className="crumb">{provinceMode ? 'VIETNAM / PROVINCE' : 'WORLD / VIETNAM'}</span>
          <h1>{title}</h1>
        </div>
        <div className="top-score">
          <Star size={16} fill="currentColor" />
          {score} XP
        </div>
      </header>

      <section className="puzzle-layout">
        <aside className="game-hud" aria-label="Game progress">
          <div className="hud-missions">
            <div className="hud-missions-title">
              <Trophy size={15} />
              <span>MISSIONS</span>
              <b>{completedMissionCount}/{missionCount}</b>
            </div>

            <ol className="mission-list">
              {Array.from({ length: missionCount }, (_, index) => {
                const mission = index + 1
                const isCompleted = mission <= completedMissionCount
                const isActive = !isCompleted && mission === currentStage
                const isLocked = !isCompleted && !isActive
                const missionEnd = Math.min(mission * safeBatchSize, totalPieceCount)
                const missionStart = (mission - 1) * safeBatchSize + 1

                return (
                  <li key={mission} className={isCompleted ? 'is-completed' : isActive ? 'is-active' : 'is-locked'}>
                    <span className="mission-state">
                      {isCompleted ? <Check size={13} /> : isLocked ? <LockKeyhole size={12} /> : <Crosshair size={13} />}
                    </span>
                    <span className="mission-copy">
                      <b>Mission {String(mission).padStart(2, '0')}</b>
                      <small>{missionStart}-{missionEnd} regions</small>
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>

          <div className="hud-progress">
            <div className="hud-progress-label">
              <span>MAP PROGRESS</span>
              <b>{Math.round((placed.length / totalPieceCount) * 100)}%</b>
            </div>
            <div className="hud-progress-track">
              <i style={{ width: `${(placed.length / totalPieceCount) * 100}%` }} />
            </div>
            <small>{placed.length} / {totalPieceCount} placed</small>
          </div>

          <div className="hud-mission">
            <span className="hud-mission-icon">
              <Crosshair size={16} />
            </span>
            <span>CURRENT MISSION</span>
            <b>{isComplete ? 'Stage clear' : selectedPlace?.name || 'Loading...'}</b>
            {!provinceMode && <small>{unlockedCount} regions unlocked</small>}
          </div>
        </aside>

        <div className={'map-frame ' + (focusView ? 'focus-view' : '')}>
          <div className="map-caption">
            <span className="live-dot" /> LIVE GEOGRAPHY · OPENSTREETMAP
          </div>
          <button className="view-toggle" onClick={() => setFocusView((value) => !value)}>
            {focusView ? <EyeOff size={14} /> : <Eye size={14} />} {focusView ? 'Focus view' : 'Full map'}
          </button>

          <MapView
            center={center}
            zoom={zoom}
            places={unlockedPieces}
            selected={hint || Boolean(dragging) ? selected : undefined}
            placed={placed}
            onPlace={place}
            onDrop={dropPiece}
            onDragPosition={movePiece}
            focusView={focusView}
            draggingSlug={dragging}
            isCorrectDropTarget={magneticTarget}
            isNearDropTarget={nearTarget}
            focusSlug={focusSlug}
            subdivisions={subdivisions}
          />

          {dragging && (
            <div className={'drop-prompt ' + (magneticTarget ? 'magnetic' : '')}>
              {magneticTarget ? (
                <>
                  ✦ Snap into <b>{selectedPlace.name}</b>
                </>
              ) : (
                <>
                  Drop <b>{selectedPlace.name}</b> at its true location
                </>
              )}
            </div>
          )}

          {hint && (
            <div className="hint-overlay">
              Tap the glowing marker for <b>{selectedPlace.name}</b>
            </div>
          )}

          {fact && (
            <div className="fact-pop">
              <div>✓</div>
              <article>
                <b>{fact.name}</b>
                <span>{fact.subtitle}</span>
                <p>{fact.fact}</p>
              </article>
            </div>
          )}
        </div>

        <aside className="map-info">
          <section className="place-guide">
            <div className="place-guide-image" style={explorePlace?.coverImageUrl ? { backgroundImage: `url(${explorePlace.coverImageUrl})` } : undefined}>
              <span>{explorePlace?.coverImageUrl ? 'LOCAL HIGHLIGHT' : 'EXPLORE'}</span>
            </div>
            <div className="place-guide-title">
              <span>{provinceMode && explorePlace?.slug === regionContext?.slug ? 'PROVINCE GUIDE' : 'PLACE GUIDE'}</span>
              <h3>{explorePlace?.name || 'Loading...'}</h3>
              <p>{explorePlace?.fact || 'Pick a place to see details.'}</p>
            </div>

            <div className="place-guide-section">
              <span><Landmark size={13} /> PLACES TO VISIT</span>
              {explorePlace?.attractions?.length ? (
                <ul>{explorePlace.attractions.slice(0, 3).map((attraction) => <li key={attraction}>{attraction}</li>)}</ul>
              ) : (
                <p className="place-guide-empty">Details coming soon.</p>
              )}
            </div>

            <div className="place-guide-section">
              <span><UsersRound size={13} /> NOTABLE PEOPLE</span>
              {explorePlace?.notablePeople?.length ? (
                <ul>{explorePlace.notablePeople.slice(0, 3).map((person) => <li key={person}>{person}</li>)}</ul>
              ) : (
                <p className="place-guide-empty">Details coming soon.</p>
              )}
            </div>

            {!provinceMode && (
              <Link className="detail-link" href={`/country/vietnam/province/${selectedPlace?.slug || ''}`}>
                Open province map →
              </Link>
            )}
          </section>
        </aside>
      </section>

      <section className="piece-tray">
        <div className="find-copy">
          <span>FIND THIS PLACE</span>
          <b>{isComplete ? 'Map complete!' : selectedPlace?.name || 'Choose a place'}</b>
          <small>{isComplete ? 'Great geographical memory.' : selectedPlace?.subtitle || 'Stage in progress'}</small>
        </div>

        <div className="place-cards">
          {unlockedPieces
            .filter((piece) => !placed.includes(piece.slug))
            .map((piece) => (
              <button
                key={piece.slug}
                draggable
                className={
                  'place-card ' +
                  (selected === piece.slug ? 'is-selected ' : '') +
                  (dragging === piece.slug ? 'is-dragging' : '')
                }
                onDragStart={(event) => startDragging(event, piece)}
                onDragEnd={() => {
                  setDragging(null)
                  setMagneticTarget(false)
                  setNearTarget(false)
                }}
                onClick={() => setSelected(piece.slug)}
              >
                <ProvincePieceShape slug={piece.slug} color={piece.color} />
                <span>
                  <b>{piece.name}</b>
                  <small>{piece.subtitle}</small>
                </span>
              </button>
            ))}
        </div>

        <button className="hint-cta" onClick={() => setHint(true)} disabled={isComplete || !selectedPlace}>
          <Lightbulb size={17} /> Hint
          <br />
          <small>-20 XP</small>
        </button>

        {isComplete && (
          <button className="restart" onClick={reset}>
            <RotateCcw size={16} /> Again
          </button>
        )}
      </section>
    </main>
  )
}
