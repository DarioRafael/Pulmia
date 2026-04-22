'use client'

// Ventana flotante del chat clínico.
// Ya NO tiene botón circular propio — se controla desde afuera mediante
// ChatBubbleContext. El HeaderApp (u otro componente) llama a openChat()
// para abrir/cerrar la ventana.

import { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react'
import { ChatView } from './chat-view'

// ── Contexto ────────────────────────────────────────────────────────────────
interface ChatBubbleContextValue {
        open: boolean
        toggle: () => void
        openChat: () => void
        closeChat: () => void
}

const ChatBubbleContext = createContext<ChatBubbleContextValue | null>(null)

export function useChatBubble() {
        const ctx = useContext(ChatBubbleContext)
        if (!ctx) throw new Error('useChatBubble must be used inside ChatBubbleProvider')
        return ctx
}

// ── Provider + ventana flotante ─────────────────────────────────────────────
export function ChatBubbleProvider({ children }: { children: React.ReactNode }) {
        const [open, setOpen]       = useState(false)
        const [floating, setFloating] = useState(false)
        const [pos, setPos]         = useState({ x: 0, y: 80 })
        const dragging              = useRef(false)
        const dragOffset            = useRef({ x: 0, y: 0 })
        const windowRef             = useRef<HTMLDivElement>(null)
        const initialised           = useRef(false)

        // Posición inicial: esquina superior derecha
        useEffect(() => {
                if (!initialised.current) {
                        setPos({ x: window.innerWidth - 440, y: 80 })
                        initialised.current = true
                }
        }, [])

        const toggle    = useCallback(() => setOpen(v => !v), [])
        const openChat  = useCallback(() => setOpen(true), [])
        const closeChat = useCallback(() => setOpen(false), [])

        // ── Drag ──────────────────────────────────────────────────────────────────
        const onMouseDown = useCallback((e: React.MouseEvent) => {
                if (!floating) return
                dragging.current = true
                dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
                e.preventDefault()
        }, [floating, pos])

        useEffect(() => {
                const onMove = (e: MouseEvent) => {
                        if (!dragging.current) return
                        setPos({
                                x: Math.max(0, Math.min(window.innerWidth  - 400, e.clientX - dragOffset.current.x)),
                                y: Math.max(0, Math.min(window.innerHeight - 520, e.clientY - dragOffset.current.y)),
                        })
                }
                const onUp = () => { dragging.current = false }
                window.addEventListener('mousemove', onMove)
                window.addEventListener('mouseup',   onUp)
                return () => {
                        window.removeEventListener('mousemove', onMove)
                        window.removeEventListener('mouseup',   onUp)
                }
        }, [])

        const windowStyle: React.CSSProperties = floating
            ? { position: 'fixed', top: pos.y, left: pos.x, bottom: 'auto', right: 'auto' }
            : { position: 'fixed', bottom: 80, right: 24 }

        return (
            <ChatBubbleContext.Provider value={{ open, toggle, openChat, closeChat }}>
                    {children}

                    {open && (
                        <div
                            ref={windowRef}
                            style={{
                                    ...windowStyle,
                                    width: 400, height: 520,
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    border: '1px solid var(--border-h)',
                                    boxShadow: '0 12px 48px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
                                    zIndex: 1000,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    animation: 'chat-bubble-in 0.2s ease both',
                            }}
                        >
                                {/* Header ------------------------------------------------ */}
                                <div
                                    onMouseDown={onMouseDown}
                                    style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 14px', background: 'var(--bg-1)',
                                            borderBottom: '1px solid var(--border)', flexShrink: 0,
                                            cursor: floating ? 'grab' : 'default',
                                            userSelect: 'none',
                                    }}
                                >
                                        {/* Left: icon + title */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{
                                                        width: 24, height: 24, borderRadius: 'var(--r4)',
                                                        background: 'var(--accent)', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                }}>
                                                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                                                <path d="M7 2V7M4 7C4 9.2 2 10 2 12H6C6 10 7 9 7 7M10 7C10 9.2 12 10 12 12H8C8 10 7 9 7 7"
                                                                      stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t0)', whiteSpace: 'nowrap' }}>
                                Asistente Médico
                            </span>
                                        </div>

                                        {/* Right: pop-out toggle + close */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <button
                                                    onClick={() => setFloating(v => !v)}
                                                    title={floating ? 'Anclar ventana' : 'Hacer ventana libre'}
                                                    style={{
                                                            width: 26, height: 26, borderRadius: 'var(--r4)',
                                                            background: floating ? 'rgba(43,107,224,0.15)' : 'transparent',
                                                            border: `1px solid ${floating ? 'var(--accent)' : 'var(--border)'}`,
                                                            color: floating ? 'var(--accent)' : 'var(--t2)',
                                                            cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all var(--ta)', flexShrink: 0,
                                                    }}
                                                >
                                                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                                                <path d="M5 1H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V6"
                                                                      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                                                                <path d="M7 1h3v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                                                                <line x1="10" y1="1" x2="5.5" y2="5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                                                        </svg>
                                                </button>

                                                <button
                                                    onClick={closeChat}
                                                    style={{
                                                            width: 26, height: 26, borderRadius: 'var(--r4)',
                                                            background: 'transparent', border: '1px solid var(--border)',
                                                            color: 'var(--t2)', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all var(--ta)',
                                                    }}
                                                >
                                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                                <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                                <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                        </svg>
                                                </button>
                                        </div>
                                </div>

                                {/* Chat embebido ---------------------------------------- */}
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <ChatView compacto />
                                </div>
                        </div>
                    )}

                    <style>{`
                @keyframes chat-bubble-in {
                    from { opacity: 0; transform: translateY(12px) scale(0.95); }
                    to   { opacity: 1; transform: none; }
                }
            `}</style>
            </ChatBubbleContext.Provider>
        )
}