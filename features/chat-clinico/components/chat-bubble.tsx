'use client'

// Burbuja flotante del chat — tipo Messenger / Facebook.
// Estado "minimizado" = ícono circular en la esquina inferior derecha.
// Estado "expandido"  = ventana flotante de ~400×520px con el ChatView completo.
// Click en la burbuja alterna entre ambos estados.

import { useState } from 'react'
import { ChatView } from './chat-view'

/**
 * Burbuja flotante del chat clínico.
 * Se monta en el layout de la app (app/(app)/layout.tsx) para que esté
 * disponible en toda la aplicación sin importar la ruta.
 */
export function ChatBubble() {
    const [open, setOpen] = useState(false)

    return (
        <>
            {/* Ventana flotante del chat */}
            {open && (
                <div style={{
                    position: 'fixed',
                    bottom: 80,
                    right: 24,
                    width: 400,
                    height: 520,
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: '1px solid var(--border-h)',
                    boxShadow: '0 12px 48px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'chat-bubble-in 0.2s ease both',
                }}>
                    {/* Header del popup con botón cerrar */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', background: 'var(--bg-1)',
                        borderBottom: '1px solid var(--border)', flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 24, height: 24, borderRadius: 'var(--r4)',
                                background: 'var(--accent)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                    <path d="M7 2V7M4 7C4 9.2 2 10 2 12H6C6 10 7 9 7 7M10 7C10 9.2 12 10 12 12H8C8 10 7 9 7 7"
                                          stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t0)' }}>
                                Chat Clínico
                            </span>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
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

                    {/* Chat embebido */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <ChatView compacto />
                    </div>
                </div>
            )}

            {/* Botón circular flotante */}
            <button
                onClick={() => setOpen(v => !v)}
                title={open ? 'Cerrar chat' : 'Abrir chat clínico'}
                style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: open ? 'var(--accent-d)' : 'var(--accent)',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(43, 107, 224, 0.4), 0 2px 8px rgba(0,0,0,0.3)',
                    zIndex: 1001,
                    transition: 'all var(--ts)',
                    transform: open ? 'scale(0.92)' : 'scale(1)',
                }}
            >
                {open ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <line x1="15" y1="3" x2="3" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M4 4H16V13H6L4 16V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="7" y1="7.5" x2="13" y2="7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        <line x1="7" y1="10.5" x2="11" y2="10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                )}
            </button>

            <style>{`
                @keyframes chat-bubble-in {
                    from { opacity: 0; transform: translateY(12px) scale(0.95); }
                    to   { opacity: 1; transform: none; }
                }
            `}</style>
        </>
    )
}
