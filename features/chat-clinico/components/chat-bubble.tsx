'use client'

// Ventana del chat clínico.
// Estado por defecto  = panel lateral pegado al borde derecho, altura completa.
// Estado flotante     = ventana 400×520 arrastrable libre (pop-out).
// Se controla desde fuera con ChatBubbleContext (useChatBubble).

import { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { ChatView } from './chat-view'

// ── Contexto ────────────────────────────────────────────────────────────────
interface ChatBubbleContextValue {
        open: boolean
        toggle: () => void
        openChat: () => void
        closeChat: () => void
        isAiTyping: boolean
        setIsAiTyping: (v: boolean) => void
        unreadCount: number
        setUnreadCount: (v: number) => void
}

const ChatBubbleContext = createContext<ChatBubbleContextValue | null>(null)

export function useChatBubble() {
        const ctx = useContext(ChatBubbleContext)
        if (!ctx) throw new Error('useChatBubble must be used inside ChatBubbleProvider')
        return ctx
}

// ── Provider + ventana ──────────────────────────────────────────────────────
export function ChatBubbleProvider({ children }: { children: React.ReactNode }) {
        const [open, setOpen]             = useState(false)
        const [closing, setClosing]       = useState(false)
        const [floating, setFloating]     = useState(false)
        const [pos, setPos]               = useState({ x: 0, y: 80 })
        const [isDragging, setIsDragging] = useState(false)
        const [isAiTyping, setIsAiTyping] = useState(false)
        const [unreadCount, setUnreadCount] = useState(0)
        const dragging                    = useRef(false)
        const dragOffset                  = useRef({ x: 0, y: 0 })
        const windowRef                   = useRef<HTMLDivElement>(null)

        // Usar pathname para distinguir entre /pacientes/[id] y /estudios/[id],
        // ya que ambas rutas usan el mismo nombre de parámetro: [id].
        const params   = useParams()
        const pathname = usePathname()
        const routeId  = typeof params?.id === 'string' ? params.id : null

        const enPaciente = Boolean(pathname?.match(/\/pacientes\/[^/]+(?:\/(?!editar).*)?$/))
        const enEstudio  = Boolean(pathname?.includes('/estudios/'))

        const routePacienteId = enPaciente ? routeId : null
        const routeEstudioId  = enEstudio  ? routeId : null

        // La key combina pathname completo para que ChatView se remonte
        // automáticamente cada vez que el usuario navega a una ruta distinta,
        // actualizando el contexto del asistente sin necesidad de cerrar el chat.
        const chatKey = pathname ?? 'default'

        const toggle    = useCallback(() => {
                if (open) {
                        setClosing(true)
                        setTimeout(() => { setOpen(false); setClosing(false); setFloating(false) }, 180)
                } else {
                        setOpen(true)
                        setUnreadCount(0)
                }
        }, [open])

        const openChat  = useCallback(() => { setOpen(true); setUnreadCount(0) }, [])

        const closeChat = useCallback(() => {
                setClosing(true)
                setTimeout(() => { setOpen(false); setClosing(false); setFloating(false) }, 180)
        }, [])

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
                setIsDragging(true)
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
                const onUp = () => { dragging.current = false; setIsDragging(false) }
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
                boxShadow:    isDragging
                    ? '0 24px 72px rgba(0,0,0,0.7), 0 8px 32px rgba(0,0,0,0.5)'
                    : '0 12px 48px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
                transform:    isDragging ? 'scale(1.01)' : 'scale(1)',
                transition:   isDragging ? 'none' : 'box-shadow 0.2s ease, transform 0.2s ease',
        }

        const containerStyle: React.CSSProperties = {
                ...(floating ? floatStyle : panelStyle),
                overflow:      'hidden',
                zIndex:        1000,
                display:       'flex',
                flexDirection: 'column',
                background:    'var(--bg-0)',
                animation:     closing
                    ? 'chat-bubble-out 0.18s ease both'
                    : 'chat-bubble-in 0.2s ease both',
        }

        return (
            <ChatBubbleContext.Provider value={{ open, toggle, openChat, closeChat, isAiTyping, setIsAiTyping, unreadCount, setUnreadCount }}>
                    {children}

                    {(open || closing) && (
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
                                                {/* Badge de estado animado */}
                                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span style={{
                                                                width: 7, height: 7, borderRadius: '50%',
                                                                background: isAiTyping ? 'var(--accent)' : '#2ecc71',
                                                                display: 'inline-block',
                                                                transition: 'background 0.3s ease',
                                                                boxShadow: isAiTyping
                                                                    ? '0 0 0 0 rgba(43,107,224,0.4)'
                                                                    : '0 0 0 0 rgba(46,204,113,0.4)',
                                                                animation: isAiTyping
                                                                    ? 'badge-pulse-blue 1s ease-in-out infinite'
                                                                    : 'badge-pulse-green 2s ease-in-out infinite',
                                                        }} />
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t0)', whiteSpace: 'nowrap' }}>
                                                        Asistente Médico
                                                </span>
                                                {isAiTyping && (
                                                    <span style={{
                                                            fontFamily: 'var(--mono)', fontSize: 9,
                                                            color: 'var(--accent)', letterSpacing: '0.04em',
                                                            animation: 'fade-in-out 1s ease-in-out infinite',
                                                    }}>
                                                                escribiendo...
                                                        </span>
                                                )}
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
                                                            transition: 'all 0.15s ease',
                                                            flexShrink: 0,
                                                    }}
                                                    onMouseEnter={e => {
                                                            (e.currentTarget as HTMLElement).style.transform = 'scale(1.12)'
                                                            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
                                                    }}
                                                    onMouseLeave={e => {
                                                            (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                                                            ;(e.currentTarget as HTMLElement).style.borderColor = floating ? 'var(--accent)' : 'var(--border)'
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
                                                            transition: 'all 0.15s ease',
                                                    }}
                                                    onMouseEnter={e => {
                                                            (e.currentTarget as HTMLElement).style.transform = 'scale(1.12)'
                                                            ;(e.currentTarget as HTMLElement).style.background = 'rgba(220,50,50,0.1)'
                                                            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,50,50,0.4)'
                                                            ;(e.currentTarget as HTMLElement).style.color = '#dc3232'
                                                    }}
                                                    onMouseLeave={e => {
                                                            (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                                                            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                                                            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                                                            ;(e.currentTarget as HTMLElement).style.color = 'var(--t2)'
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
                                        <ChatView
                                            key={chatKey}
                                            compacto
                                            pacienteIdInicial={routePacienteId ?? undefined}
                                            estudioIdInicial={routeEstudioId ?? undefined}
                                        />
                                </div>
                        </div>
                    )}

                    <style>{`
                @keyframes chat-bubble-in {
                    from { opacity: 0; transform: translateX(16px); }
                    to   { opacity: 1; transform: none; }
                }
                @keyframes chat-bubble-out {
                    from { opacity: 1; transform: none; }
                    to   { opacity: 0; transform: translateX(16px); }
                }
                @keyframes badge-pulse-green {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(46,204,113,0.5); }
                    50%      { box-shadow: 0 0 0 4px rgba(46,204,113,0); }
                }
                @keyframes badge-pulse-blue {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(43,107,224,0.6); }
                    50%      { box-shadow: 0 0 0 5px rgba(43,107,224,0); }
                }
                @keyframes fade-in-out {
                    0%, 100% { opacity: 0.4; }
                    50%      { opacity: 1; }
                }
            `}</style>
            </ChatBubbleContext.Provider>
        )
}