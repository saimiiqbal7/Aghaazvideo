'use client'

import type React from 'react'
import { useRef, useState } from 'react'
import type { Checkpoint } from '@/types'

const SPEEDS = [0.75, 1, 1.25, 1.5, 2]

function fmt(s: number): string {
  if (!s || isNaN(s)) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>
  currentTime: number
  duration: number
  isPlaying: boolean
  volume: number
  isMuted: boolean
  speed: number
  noteMarkers: Array<{ id: string; time: number; text: string }>
  checkpoints: Checkpoint[]
  answeredIds: Set<string>
  activeCheckpoint: Checkpoint | null
  quizResult: 'correct' | 'wrong' | null
  selectedIdx: number | null
  onAnswer: (idx: number) => void
  onContinue: () => void
  onSeek: (fraction: number) => void
  onTogglePlay: () => void
  onSeekRelative: (delta: number) => void
  onVolumeChange: (vol: number) => void
  onSpeedChange: (speed: number) => void
  onToggleMute: () => void
  onFullscreen: () => void
}

export default function VideoPlayer({
  videoRef,
  currentTime,
  duration,
  isPlaying,
  volume,
  isMuted,
  speed,
  noteMarkers,
  checkpoints,
  answeredIds,
  activeCheckpoint,
  quizResult,
  selectedIdx,
  onAnswer,
  onContinue,
  onSeek,
  onTogglePlay,
  onSeekRelative,
  onVolumeChange,
  onSpeedChange,
  onToggleMute,
  onFullscreen,
}: Props) {
  const [showControls, setShowControls] = useState(true)
  const [hoveredCheckpoint, setHoveredCheckpoint] = useState<string | null>(null)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 2500)
    }
  }

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed)
    onSpeedChange(SPEEDS[(idx + 1) % SPEEDS.length])
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  const getOptionStyle = (idx: number): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: '100%',
      padding: '11px 14px',
      borderRadius: 8,
      fontSize: 13,
      cursor: quizResult !== null ? 'default' : 'pointer',
      transition: 'all 0.2s',
      textAlign: 'left',
      marginBottom: 8,
      border: '0.5px solid var(--border-default)',
      background: 'var(--bg-surface)',
      color: 'var(--text-secondary)',
      fontFamily: 'inherit',
    }
    if (quizResult === null) return base
    if (idx === activeCheckpoint?.correctIndex) {
      return {
        ...base,
        background: 'rgba(34,197,94,0.15)',
        borderColor: 'rgba(34,197,94,0.4)',
        color: '#4ade80',
      }
    }
    if (idx === selectedIdx && quizResult === 'wrong') {
      return {
        ...base,
        background: 'var(--red-dim)',
        borderColor: 'var(--red)',
        color: 'var(--red)',
      }
    }
    return { ...base, opacity: 0.4 }
  }

  return (
    <div
      style={{ flex: 1, position: 'relative', background: '#000', overflow: 'hidden', minWidth: 0 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video */}
      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        playsInline
        onClick={onTogglePlay}
      />

      {/* Controls overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
          padding: '32px 16px 14px',
          opacity: showControls || !isPlaying ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: showControls || !isPlaying ? 'auto' : 'none',
        }}
      >
        {/* Timeline */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <div
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              onSeek((e.clientX - rect.left) / rect.width)
            }}
            style={{
              height: 6,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 3,
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            {/* Progress fill */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${progress}%`,
                background: 'var(--lime)',
                borderRadius: 3,
              }}
            />
            {/* Playhead */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${progress}%`,
                transform: 'translate(-50%, -50%)',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: 'var(--lime)',
                boxShadow: '0 0 8px var(--lime)',
              }}
            />
            {/* Checkpoint diamonds */}
            {checkpoints.map(cp => {
              const pos = duration ? (cp.timestamp / duration) * 100 : 0
              const done = answeredIds.has(cp.id)
              return (
                <div
                  key={cp.id}
                  onMouseEnter={() => setHoveredCheckpoint(cp.id)}
                  onMouseLeave={() => setHoveredCheckpoint(null)}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: `${pos}%`,
                    transform: 'translate(-50%, -50%) rotate(45deg)',
                    width: 8,
                    height: 8,
                    background: done ? 'var(--lime)' : 'transparent',
                    border: '1.5px solid var(--lime)',
                    cursor: 'pointer',
                    zIndex: 2,
                  }}
                >
                  {hoveredCheckpoint === cp.id && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 14,
                        left: '50%',
                        transform: 'translateX(-50%) rotate(-45deg)',
                        background: 'rgba(0,0,0,0.9)',
                        border: '0.5px solid var(--border-default)',
                        borderRadius: 6,
                        padding: '5px 9px',
                        fontSize: 11,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        maxWidth: 200,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                      }}
                    >
                      {cp.question}
                    </div>
                  )}
                </div>
              )
            })}

            {noteMarkers.map(note => {
              const pos = duration ? (note.time / duration) * 100 : 0
              return (
                <div
                  key={note.id}
                  title={note.text}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: `${pos}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: 10,
                    cursor: 'pointer',
                    zIndex: 3,
                    userSelect: 'none',
                    filter: 'drop-shadow(0 0 3px rgba(245,158,11,0.6))',
                  }}
                >
                  📝
                </div>
              )
            })}
          </div>
        </div>

        {/* Controls bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Skip back */}
            <button
              onClick={() => onSeekRelative(-10)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: 0,
                display: 'flex',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.5 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V7l-4-4 4-4V3z" />
                <text x="8" y="15" fontSize="7" fill="currentColor" fontFamily="sans-serif" fontWeight="bold">
                  10
                </text>
              </svg>
            </button>

            {/* Play/pause */}
            <button
              onClick={onTogglePlay}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'white',
                padding: 0,
                display: 'flex',
              }}
            >
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Skip forward */}
            <button
              onClick={() => onSeekRelative(10)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: 0,
                display: 'flex',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.5 3a9 9 0 1 1-9 9h2a7 7 0 1 0 7-7V7l4-4-4-4V3z" />
                <text x="8" y="15" fontSize="7" fill="currentColor" fontFamily="sans-serif" fontWeight="bold">
                  10
                </text>
              </svg>
            </button>

            {/* Time */}
            <span
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                fontVariantNumeric: 'tabular-nums',
                fontFamily: 'monospace',
              }}
            >
              {fmt(currentTime)} / {fmt(duration)}
            </span>
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Volume */}
            <div
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={onToggleMute}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: 0,
                  display: 'flex',
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  {isMuted || volume === 0 ? (
                    <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18L19 19.27 20.27 18 5.27 2.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  ) : (
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  )}
                </svg>
              </button>
              {showVolumeSlider && (
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={e => onVolumeChange(parseFloat(e.target.value))}
                  style={{ width: 70, accentColor: 'var(--lime)', cursor: 'pointer' }}
                />
              )}
            </div>

            {/* Speed */}
            <button
              onClick={cycleSpeed}
              style={{
                fontSize: 9,
                padding: '3px 8px',
                borderRadius: 4,
                background: 'var(--bg-elevated)',
                border: '0.5px solid var(--border-default)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              {speed}×
            </button>

            {/* Fullscreen */}
            <button
              onClick={onFullscreen}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: 0,
                display: 'flex',
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Checkpoint overlay */}
      {activeCheckpoint && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(8px)',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '0.5px solid var(--lime-border)',
              borderRadius: 16,
              padding: '28px 28px 24px',
              maxWidth: 420,
              width: '90%',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'var(--lime)',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              ⚡ Checkpoint
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: 'white',
                lineHeight: 1.4,
                marginBottom: 20,
              }}
            >
              {activeCheckpoint.question}
            </div>
            {activeCheckpoint.options.map((opt, idx) => (
              <button
                key={idx}
                disabled={quizResult !== null}
                onClick={() => onAnswer(idx)}
                style={getOptionStyle(idx)}
              >
                {opt}
              </button>
            ))}
            {quizResult !== null && (
              <button
                onClick={onContinue}
                style={{
                  marginTop: 12,
                  width: '100%',
                  background: quizResult === 'correct' ? 'var(--lime)' : 'var(--bg-surface)',
                  color: quizResult === 'correct' ? '#030e06' : 'var(--text-primary)',
                  border:
                    quizResult === 'correct' ? 'none' : '0.5px solid var(--border-strong)',
                  fontWeight: 700,
                  padding: '12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
              >
                {quizResult === 'correct' ? '▶ Continue Lesson' : 'Continue Lesson →'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

