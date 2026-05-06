'use client'

// Ventana del chat clínico.
// Estado por defecto  = panel lateral pegado al borde derecho, altura completa.
// Estado flotante     = ventana 400×520 arrastrable libre (pop-out).
// Se controla desde fuera con ChatBubbleContext (useChatBubble).

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

// ── Provider + ventana ──────────────────────────────────────────────────────
export function ChatBubbleProvider({ children }: { children: React.ReactNode }) {
        const [open, setOpen]         = useState(false)
        const [floating, setFloating] = useState(false)
        const [pos, setPos]           = useState({ x: 0, y: 80 })
        const dragging                = useRef(false)
        const dragOffset              = useRef({ x: 0, y: 0 })
        const windowRef               = useRef<HTMLDivElement>(null)

        const toggle    = useCallback(() => setOpen(v => !v), [])
        const openChat  = useCallback(() => setOpen(true), [])
        const closeChat = useCallback(() => { setOpen(false); setFloating(false) }, [])

        // Al activar el modo flotante, centrar la ventana en pantalla
        const handlePopOut = useCallback(() => {
                setFloating(v => {
                        if (!v) {
                                setPos({
                                        x: window.innerWidth  / 2 - 200,
                                        y: window.innerHeight / 2 - 260,
                                })
                        }
                        return !v
                })
        }, [])

        // ── Drag (solo en modo flotante) ─────────────────────────────────────────
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

        // ── Estilos según modo ───────────────────────────────────────────────────
        const panelStyle: React.CSSProperties = {
                position:   'fixed',
                top:        56,
                right:      0,
                width:      400,
                height:     'calc(100vh - 56px)',
                borderLeft: '1px solid var(--border)',
                borderRadius: 0,
                boxShadow:  '-8px 0 32px rgba(0,0,0,0.3)',
        }

        const floatStyle: React.CSSProperties = {
                position:     'fixed',
                top:          pos.y,
                left:         pos.x,
                width:        400,
                height:       520,
                borderRadius: 16,
                border:       '1px solid var(--border-h)',
                boxShadow:    '0 12px 48px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
        }

        const containerStyle: React.CSSProperties = {
                ...(floating ? floatStyle : panelStyle),
                overflow:      'hidden',
                zIndex:        1000,
                display:       'flex',
                flexDirection: 'column',
                background:    'var(--bg-0)',
                animation:     'chat-bubble-in 0.2s ease both',
        }

        return (
            <ChatBubbleContext.Provider value={{ open, toggle, openChat, closeChat }}>
                    {children}

                    {open && (
                        <div ref={windowRef} style={containerStyle}>

                                {/* Header */}
                                <div
                                    onMouseDown={onMouseDown}
                                    style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 14px',
                                            background: 'var(--bg-1)',
                                            borderBottom: '1px solid var(--border)',
                                            flexShrink: 0,
                                            cursor: floating ? 'grab' : 'default',
                                            userSelect: 'none',
                                    }}
                                >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t0)', whiteSpace: 'nowrap' }}>
                                Asistente Médico
                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <button
                                                    onClick={handlePopOut}
                                                    title={floating ? 'Anclar panel' : 'Hacer ventana libre'}
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

                                {/* Chat embebido */}
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <ChatView compacto />
                                </div>
                        </div>
                    )}

                    <style>{`
                @keyframes chat-bubble-in {
                    from { opacity: 0; transform: translateX(16px); }
                    to   { opacity: 1; transform: none; }
                }
            `}</style>
            </ChatBubbleContext.Provider>
        )
}