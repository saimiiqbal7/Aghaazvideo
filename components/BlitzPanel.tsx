'use client'

import { useRef, useEffect, useState } from 'react'
import type { BlitzMessage } from '@/types'

type Props = {
  isOpen: boolean
  onToggle: () => void
  messages: BlitzMessage[]
  isLoading: boolean
  onSend: (message: string) => void
  lessonTitle: string
}

export default function BlitzPanel({
  isOpen,
  onToggle,
  messages,
  isLoading,
  onSend,
  lessonTitle,
}: Props) {
  const [input, setInput] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTimeout(() => {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
    }, 100)
  }, [messages, isLoading])

  const handleSend = () => {
    const t = input.trim()
    if (!t || isLoading) return
    onSend(t)
    setInput('')
  }

  const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n) + '...' : s)

  return (
    <>
      {/* Chevron tab */}
      <div
        onClick={onToggle}
        style={{
          position: 'absolute',
          right: isOpen ? 300 : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          transition: `right var(--panel-transition)`,
          zIndex: 30,
          background: 'var(--bg-surface)',
          border: '0.5px solid var(--border-default)',
          borderRight: 'none',
          borderRadius: '8px 0 0 8px',
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
          stroke="var(--lime)"
          strokeWidth="2.5"
        >
          {isOpen ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
        </svg>
        <span style={{ fontSize: 11, color: 'var(--lime)' }}>⚡</span>
        <span
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: 9,
            letterSpacing: '0.2em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          Blitz AI
        </span>
      </div>

      {/* Panel */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 300,
          background: 'var(--bg-surface)',
          borderLeft: '0.5px solid var(--border-subtle)',
          zIndex: 20,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform var(--panel-transition)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            height: 52,
            borderBottom: '0.5px solid var(--border-subtle)',
            padding: '0 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              background: 'var(--lime-dim)',
              border: '0.5px solid var(--lime-border)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              flexShrink: 0,
            }}
          >
            ⚡
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lime)' }}>Blitz</div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              AI Tutor · {truncate(lessonTitle, 20)}
            </div>
          </div>
          <div
            className="blitz-pulse"
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 6px #22c55e',
              flexShrink: 0,
            }}
          />
        </div>

        {/* Chat */}
        <div
          ref={chatRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {messages.map(msg => {
            if (msg.role === 'system')
              return (
                <div
                  key={msg.id}
                  style={{
                    textAlign: 'center',
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    padding: '2px 0',
                  }}
                >
                  {msg.content}
                </div>
              )
            if (msg.role === 'blitz')
              return (
                <div
                  key={msg.id}
                  className="msg-animate"
                  style={{ alignSelf: 'flex-start', maxWidth: '88%' }}
                >
                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      borderRadius: '12px 12px 12px 3px',
                      border: '0.5px solid var(--lime-border)',
                      padding: '9px 12px',
                      fontSize: 12,
                      lineHeight: 1.65,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              )
            return (
              <div
                key={msg.id}
                className="msg-animate"
                style={{ alignSelf: 'flex-end', maxWidth: '88%' }}
              >
                <div
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px 12px 3px 12px',
                    border: '0.5px solid var(--border-default)',
                    padding: '9px 12px',
                    fontSize: 12,
                    lineHeight: 1.65,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            )
          })}

          {/* Typing indicator */}
          {isLoading && (
            <div style={{ alignSelf: 'flex-start' }}>
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '0.5px solid var(--lime-border)',
                  borderRadius: '12px 12px 12px 3px',
                  padding: '10px 14px',
                  display: 'flex',
                  gap: 4,
                  alignItems: 'center',
                }}
              >
                {[0, 150, 300].map((delay, i) => (
                  <div
                    key={i}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: 'var(--lime)',
                      animation: `dot-bounce 0.9s ease-in-out ${delay}ms infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div
          style={{
            borderTop: '0.5px solid var(--border-subtle)',
            padding: '10px 12px',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
            flexShrink: 0,
          }}
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask Blitz anything..."
            rows={1}
            style={{
              flex: 1,
              background: 'var(--bg-elevated)',
              border: '0.5px solid var(--border-default)',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 12,
              color: 'var(--text-primary)',
              lineHeight: 1.5,
              resize: 'none',
              minHeight: 36,
              maxHeight: 100,
              outline: 'none',
              fontFamily: 'inherit',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--lime-border)'
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'var(--border-default)'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              width: 32,
              height: 32,
              background: 'var(--lime-dim)',
              border: '0.5px solid var(--lime-border)',
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              opacity: !input.trim() || isLoading ? 0.4 : 1,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--lime)">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}

