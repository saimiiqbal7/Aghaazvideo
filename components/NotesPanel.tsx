'use client'

import type React from 'react'
import { useEffect, useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'

type Props = {
  isOpen: boolean
  onToggle: () => void
  currentTime: number
  noteMarkers: Array<{ id: string; time: number; text: string }>
  onSaveNote: (text: string) => void
}

function fmt(s: number): string {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

const LESSON_ID = 'aghaaz-lesson-main'

export default function NotesPanel({ isOpen, onToggle, currentTime, onSaveNote }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Highlight, Typography],
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        'data-placeholder':
          'Start typing — notes are saved automatically and timestamped to the video.',
      },
    },
  })

  const [saved, setSaved] = useState(false)

  // Restore from localStorage
  useEffect(() => {
    if (!editor) return
    const saved = localStorage.getItem(LESSON_ID)
    if (saved) {
      try {
        editor.commands.setContent(JSON.parse(saved).content)
      } catch {
        // ignore
      }
    }
  }, [editor])

  // Autosave
  useEffect(() => {
    if (!editor) return
    const interval = setInterval(() => {
      localStorage.setItem(LESSON_ID, JSON.stringify({ content: editor.getJSON() }))
    }, 2000)
    return () => clearInterval(interval)
  }, [editor])

  const insertTimestamp = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertContent(`<mark>[${fmt(currentTime)}]</mark> `).run()
  }, [editor, currentTime])

  const exportPDF = () => window.print()

  const btnStyle = (active: boolean): React.CSSProperties => ({
    width: 26,
    height: 26,
    borderRadius: 5,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    border: `0.5px solid ${active ? 'rgba(245,158,11,0.3)' : 'var(--border-subtle)'}`,
    background: active ? 'rgba(245,158,11,0.12)' : 'transparent',
    color: active ? '#f59e0b' : 'var(--text-muted)',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  })

  return (
    <>
      {/* Chevron tab */}
      <div
        onClick={onToggle}
        style={{
          position: 'absolute',
          left: isOpen ? 340 : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          transition: `left var(--panel-transition)`,
          zIndex: 30,
          background: 'var(--bg-surface)',
          border: '0.5px solid var(--border-default)',
          borderLeft: 'none',
          borderRadius: '0 8px 8px 0',
          padding: '14px 7px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          userSelect: 'none',
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.5"
        >
          {isOpen ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
        </svg>
        <span
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: 9,
            letterSpacing: '0.2em',
            color: '#f59e0b',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          Notes
        </span>
      </div>

      {/* Panel */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 340,
          background: 'var(--bg-surface)',
          borderRight: '0.5px solid var(--border-subtle)',
          zIndex: 20,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform var(--panel-transition)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            height: 44,
            borderBottom: '0.5px solid var(--border-subtle)',
            padding: '0 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 500, color: '#f59e0b' }}>
            My Notes
          </span>
          <div
            style={{
              background: 'rgba(245,158,11,0.12)',
              border: '0.5px solid rgba(245,158,11,0.3)',
              borderRadius: 4,
              padding: '2px 7px',
              fontSize: 10,
              color: '#f59e0b',
              fontWeight: 700,
            }}
          >
            [{fmt(currentTime)}]
          </div>
          <button
            onClick={exportPDF}
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Export PDF
          </button>
        </div>

        {/* Toolbar */}
        <div
          style={{
            padding: '6px 10px',
            borderBottom: '0.5px solid var(--border-subtle)',
            display: 'flex',
            gap: 4,
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          <button
            style={btnStyle(!!editor?.isActive('bold'))}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            B
          </button>
          <button
            style={{ ...btnStyle(!!editor?.isActive('italic')), fontStyle: 'italic' }}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            I
          </button>
          <button
            style={btnStyle(!!editor?.isActive('heading', { level: 2 }))}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </button>
          <button
            style={btnStyle(!!editor?.isActive('heading', { level: 3 }))}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </button>
          <button
            style={btnStyle(!!editor?.isActive('bulletList'))}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="4" cy="6" r="2" />
              <circle cx="4" cy="12" r="2" />
              <circle cx="4" cy="18" r="2" />
              <rect x="8" y="5" width="14" height="2" />
              <rect x="8" y="11" width="14" height="2" />
              <rect x="8" y="17" width="14" height="2" />
            </svg>
          </button>
          <button
            style={btnStyle(!!editor?.isActive('orderedList'))}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <text x="1" y="9" fontSize="9" fontFamily="sans-serif">
                1.
              </text>
              <text x="1" y="15" fontSize="9" fontFamily="sans-serif">
                2.
              </text>
              <rect x="12" y="5" width="11" height="2" />
              <rect x="12" y="11" width="11" height="2" />
              <rect x="12" y="17" width="11" height="2" />
            </svg>
          </button>
          <button
            style={btnStyle(!!editor?.isActive('highlight'))}
            onClick={() => editor?.chain().focus().toggleHighlight().run()}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 2.1L21.9 8.5l-9.9 9.9-6.4.4.4-6.4 9.5-10.3zm0 2.8l-8.2 8.9-.3 4 4-.3 8.9-8.2-4.4-4.4z" />
            </svg>
          </button>
          <div
            style={{
              width: 1,
              height: 16,
              background: 'rgba(255,255,255,0.08)',
              margin: '5px 2px',
            }}
          />
          <button
            title={`Insert [${fmt(currentTime)}]`}
            style={btnStyle(false)}
            onClick={insertTimestamp}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
        </div>

        {/* Save note */}
        <button
          onClick={() => {
            const text = editor?.getText() ?? ''
            if (!text.trim()) return
            onSaveNote(text)
            setSaved(true)
            setTimeout(() => setSaved(false), 1500)
          }}
          style={{
            margin: '8px 12px',
            padding: '8px',
            borderRadius: 8,
            border: '0.5px solid rgba(245,158,11,0.35)',
            background: saved ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.08)',
            color: '#f59e0b',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          {saved ? '📌 Note saved at ' + fmt(currentTime) : '📌 Save note at ' + fmt(currentTime)}
        </button>

        {/* Editor */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <EditorContent
            editor={editor}
            style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}
          />
        </div>
      </div>
    </>
  )
}

