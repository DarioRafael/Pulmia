'use client'

import { useEffect, useRef } from 'react'
import type { Mensaje } from '../tipos'
import { MensajeBurbuja } from './mensaje-burbuja'
import { IndicadorEscribiendo } from './indicador-escribiendo'

interface ListaMensajesProps {
    readonly mensajes: readonly Mensaje[]
    readonly isTyping: boolean
}

export function ListaMensajes({ mensajes, isTyping }: ListaMensajesProps) {
    const bottomRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        const dist = container.scrollHeight - container.scrollTop - container.clientHeight
        if (dist < 140) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [mensajes, isTyping])

    function scrollToBottom() {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div
                ref={containerRef}
                style={{
                    flex: 1, overflowY: 'auto', padding: '22px 20px 16px',
                    display: 'flex', flexDirection: 'column', gap: 14,
                }}
                onScroll={e => {
                    const el = e.currentTarget
                    const d = el.scrollHeight - el.scrollTop - el.clientHeight
                    const btn = document.getElementById('chat-scroll-btn')
                    if (btn) btn.style.display = d > 140 ? 'flex' : 'none'
                }}
            >
                {mensajes.map(msg => (
                    <MensajeBurbuja key={msg.id} mensaje={msg} />
                ))}
                {isTyping && <IndicadorEscribiendo />}
                <div ref={bottomRef} />
            </div>

            <button
                id="chat-scroll-btn"
                onClick={scrollToBottom}
                style={{
                    display: 'none', position: 'absolute', right: 20, bottom: 16,
                    width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-2)',
                    border: '1px solid var(--border-h)', color: 'var(--t1)', cursor: 'pointer',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'var(--shadow-md)', zIndex: 30, transition: 'all var(--ta)',
                }}
            >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    )
}
