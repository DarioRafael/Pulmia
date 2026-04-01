'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/lib/types'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'

interface MessageListProps {
    messages: Message[]
    isTyping: boolean
}

export function MessageList({ messages, isTyping }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const showScrollBtnRef = useRef(false)

    // Auto-scroll al fondo cuando llegan mensajes nuevos o streaming
    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
        // Solo auto-scroll si el usuario ya estaba cerca del fondo
        if (distFromBottom < 120) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isTyping])

    function scrollToBottom() {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div
                ref={containerRef}
                id="chat"
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px 18px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                }}
                onScroll={e => {
                    const el = e.currentTarget
                    const d = el.scrollHeight - el.scrollTop - el.clientHeight
                    const btn = document.getElementById('scroll-btn')
                    if (btn) btn.style.display = d > 120 ? 'flex' : 'none'
                }}
            >
                {messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}

                {isTyping && <TypingIndicator />}

                <div ref={bottomRef} />
            </div>

            {/* Boton bajar al fondo */}
            <button
                id="scroll-btn"
                onClick={scrollToBottom}
                style={{
                    display: 'none',
                    position: 'absolute',
                    right: 18,
                    bottom: 16,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--bg-3)',
                    border: '1px solid var(--border-h)',
                    color: 'var(--t1)',
                    fontSize: 13,
                    cursor: 'pointer',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    zIndex: 30,
                    transition: 'transform var(--ta)',
                }}
                onMouseEnter={e => {
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
                    ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--t1)'
                    ;(e.currentTarget as HTMLButtonElement).style.transform = 'none'
                }}
            >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 4.5L6.5 9L11 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    )
}