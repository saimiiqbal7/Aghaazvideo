'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { CHECKPOINTS, HLS_URL, LESSON_TITLE } from '@/lib/lessonData'
import type { Checkpoint, BlitzMessage } from '@/types'
import VideoPlayer from '@/components/VideoPlayer'
import NotesPanel from '@/components/NotesPanel'
import BlitzPanel from '@/components/BlitzPanel'

export default function Page() {
  // ── Video state ──────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<any>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [speed, setSpeedState] = useState(1)

  // ── Panel state ───────────────────────────────────────────────
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [isBlitzOpen, setIsBlitzOpen] = useState(false)

  // ── Notes state ───────────────────────────────────────────────
  const [noteMarkers, setNoteMarkers] = useState<
    Array<{ id: string; time: number; text: string }>
  >([])

  // ── Checkpoint state ─────────────────────────────────────────
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null)
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set())
  const [quizResult, setQuizResult] = useState<'correct' | 'wrong' | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const isPlayingRef = useRef(false)

  // ── Blitz state ───────────────────────────────────────────────
  const [blitzMessages, setBlitzMessages] = useState<BlitzMessage[]>([
    {
      id: 'welcome',
      role: 'blitz',
      content:
        "Salam! I'm Blitz ⚡ Watch the lesson and answer the checkpoints when they pop up. You can also ask me anything about what you just watched.",
    },
  ])
  const [isBlitzLoading, setIsBlitzLoading] = useState(false)

  const makeMsgId = () =>
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

  const addSystemMsg = useCallback((content: string) => {
    setBlitzMessages(prev => [...prev, { id: makeMsgId(), role: 'system', content }])
  }, [])

  const addBlitzMsg = useCallback((content: string) => {
    setBlitzMessages(prev => [...prev, { id: makeMsgId(), role: 'blitz', content }])
  }, [])

  const callBlitz = useCallback(
    async (prompt: string) => {
      setIsBlitzLoading(true)
      try {
        const res = await fetch('/api/blitz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: prompt }),
        })
        const data = await res.json()
        addBlitzMsg(data.message)
      } catch {
        addBlitzMsg('Koi baat nahi — try again in a moment!')
      }
      setIsBlitzLoading(false)
    },
    [addBlitzMsg],
  )

  const handleSaveNote = useCallback(
    (text: string) => {
      const marker = {
        id: `note-${Date.now()}`,
        time: currentTime,
        text: text.slice(0, 60),
      }
      setNoteMarkers(prev => [...prev, marker])
    },
    [currentTime],
  )

  // ── HLS setup ────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    ;(async () => {
      const { default: Hls } = await import('hls.js')
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true })
        hls.loadSource(HLS_URL)
        hls.attachMedia(video)
        hlsRef.current = hls
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = HLS_URL
      }
    })()

    const onMeta = () => setDuration(video.duration)
    const onTime = () => setCurrentTime(video.currentTime)
    const onPlay = () => {
      setIsPlaying(true)
      isPlayingRef.current = true
    }
    const onPause = () => {
      setIsPlaying(false)
      isPlayingRef.current = false
    }
    const onVolume = () => {
      setVolumeState(video.volume)
      setIsMuted(video.muted)
    }

    video.addEventListener('loadedmetadata', onMeta)
    video.addEventListener('timeupdate', onTime)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('volumechange', onVolume)

    return () => {
      video.removeEventListener('loadedmetadata', onMeta)
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('volumechange', onVolume)
      hlsRef.current?.destroy()
    }
  }, [])

  // ── Auto-pause when tab is hidden ────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        const v = videoRef.current
        if (v && !v.paused) {
          v.pause()
          addSystemMsg('⏸ Paused because you switched tabs')
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [addSystemMsg])

  // ── Checkpoint trigger ───────────────────────────────────────
  useEffect(() => {
    if (activeCheckpoint || !isPlayingRef.current) return
    const hit = CHECKPOINTS.find(cp => !answeredIds.has(cp.id) && currentTime >= cp.timestamp)
    if (hit) {
      videoRef.current?.pause()
      setActiveCheckpoint(hit)
      addSystemMsg(`📋 Checkpoint — ${hit.question.slice(0, 40)}...`)
    }
  }, [currentTime, answeredIds, activeCheckpoint, addSystemMsg])

  // ── Checkpoint answer ────────────────────────────────────────
  const handleAnswer = useCallback(
    async (idx: number) => {
      if (!activeCheckpoint || quizResult !== null) return
      const correct = idx === activeCheckpoint.correctIndex
      setSelectedIdx(idx)
      setQuizResult(correct ? 'correct' : 'wrong')
      setAnsweredIds(prev => new Set(prev).add(activeCheckpoint.id))

      if (correct) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#BFFF00', '#ffffff', '#00ff88'],
        })
        callBlitz(
          `The student just got this question right: "${activeCheckpoint.question}". Their answer: "${activeCheckpoint.options[idx]}". Give a short 1-2 sentence celebration. Be genuine and warm.`,
        )
      } else {
        setIsBlitzOpen(true)
        callBlitz(
          `The student answered incorrectly. Question: "${activeCheckpoint.question}". They chose: "${activeCheckpoint.options[idx]}". Correct answer: "${activeCheckpoint.options[activeCheckpoint.correctIndex]}". Explain why in 2-3 sentences and encourage them.`,
        )
      }
    },
    [activeCheckpoint, quizResult, callBlitz],
  )

  const handleContinue = useCallback(() => {
    setActiveCheckpoint(null)
    setQuizResult(null)
    setSelectedIdx(null)
    videoRef.current?.play()
    addSystemMsg('▶ Resumed')
  }, [addSystemMsg])

  // ── Blitz send ───────────────────────────────────────────────
  const handleBlitzSend = useCallback(
    async (message: string) => {
      setBlitzMessages(prev => [...prev, { id: makeMsgId(), role: 'user', content: message }])
      callBlitz(
        `Student is watching a lesson called "Behind the Scenes at Aghaaz" and asks: "${message}"`,
      )
    },
    [callBlitz],
  )

  // ── Video controls ───────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.paused ? v.play() : v.pause()
  }, [])

  const seekTo = useCallback((fraction: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = fraction * v.duration
  }, [])

  const seekRelative = useCallback((delta: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.max(0, Math.min(v.currentTime + delta, v.duration))
  }, [])

  const setVolume = useCallback((vol: number) => {
    const v = videoRef.current
    if (!v) return
    v.volume = Math.max(0, Math.min(vol, 1))
  }, [])

  const setSpeed = useCallback((s: number) => {
    const v = videoRef.current
    if (!v) return
    v.playbackRate = s
    setSpeedState(s)
  }, [])

  const toggleMute = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
  }, [])

  const toggleFullscreen = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      v.requestFullscreen()
    }
  }, [])

  // ── Keyboard shortcuts ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const tag = target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target.contentEditable === 'true') return
      if (e.key === ' ') {
        e.preventDefault()
        togglePlay()
      }
      if (e.key === 'ArrowLeft') seekRelative(-10)
      if (e.key === 'ArrowRight') seekRelative(10)
      if (e.key === 'ArrowUp') setVolume(volume + 0.1)
      if (e.key === 'ArrowDown') setVolume(volume - 0.1)
      if (e.key === 'm' || e.key === 'M') toggleMute()
      if (e.key === 'f' || e.key === 'F') toggleFullscreen()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay, seekRelative, setVolume, volume, toggleMute, toggleFullscreen])

  // ── Render ───────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--bg-base)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          minHeight: 0,
        }}
      >
        <NotesPanel
          isOpen={isNotesOpen}
          onToggle={() => setIsNotesOpen(o => !o)}
          currentTime={currentTime}
          noteMarkers={noteMarkers}
          onSaveNote={handleSaveNote}
        />

        <VideoPlayer
          videoRef={videoRef}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          volume={volume}
          isMuted={isMuted}
          speed={speed}
          noteMarkers={noteMarkers}
          checkpoints={CHECKPOINTS}
          answeredIds={answeredIds}
          activeCheckpoint={activeCheckpoint}
          quizResult={quizResult}
          selectedIdx={selectedIdx}
          onAnswer={handleAnswer}
          onContinue={handleContinue}
          onSeek={seekTo}
          onTogglePlay={togglePlay}
          onSeekRelative={seekRelative}
          onVolumeChange={setVolume}
          onSpeedChange={setSpeed}
          onToggleMute={toggleMute}
          onFullscreen={toggleFullscreen}
        />

        <BlitzPanel
          isOpen={isBlitzOpen}
          onToggle={() => setIsBlitzOpen(o => !o)}
          messages={blitzMessages}
          isLoading={isBlitzLoading}
          onSend={handleBlitzSend}
          lessonTitle={LESSON_TITLE}
        />
      </div>
    </div>
  )
}
