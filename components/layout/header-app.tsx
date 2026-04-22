'use client'

// Header de la app clínica.
// El botón de chat abre/cierra la ventana flotante del ChatBubble
// usando el contexto compartido — sin panel lateral propio.

import { useTheme } from '@/lib/hooks/useTheme'
import { useChatBubble } from '@/features/chat-clinico'

interface HeaderAppProps {
    readonly titulo: string
    readonly subtitulo?: string
}

export function HeaderApp({ titulo, subtitulo }: HeaderAppProps) {
    const { toggleTheme } = useTheme()
    const { open, toggle } = useChatBubble()

    return (
        <header style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0 24px', height: 56, flexShrink: 0,
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-glass)', backdropFilter: 'blur(16px)',
        }}>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t0)', letterSpacing: '-0.02em' }}>
                    {titulo}
                </div>
                {subtitulo && (
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)', letterSpacing: '0.04em' }}>
                        {subtitulo}
                    </div>
                )}
            </div>

            {/* Toggle tema */}
            <button
                onClick={toggleTheme}
                title="Cambiar tema"
                style={{
                    width: 34, height: 34, borderRadius: 'var(--r6)',
                    background: 'transparent', border: '1px solid transparent',
                    cursor: 'pointer', color: 'var(--t2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all var(--ta)',
                }}
            >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d="M7.5 2a5.5 5.5 0 0 1 0 11V2z" fill="currentColor" />
                    <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
            </button>

            {/* Botón chat — abre la ventana flotante del ChatBubbleProvider */}
            <button
                onClick={toggle}
                title={open ? 'Cerrar chat' : 'Abrir chat clínico'}
                style={{
                    width: 34, height: 34,
                    borderRadius: 'var(--r4)',
                    background: open ? 'var(--accent)' : 'transparent',
                    border: `1px solid ${open ? 'var(--accent)' : 'transparent'}`,
                    cursor: 'pointer',
                    color: open ? '#fff' : 'var(--t2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all var(--ta)',
                    flexShrink: 0,
                }}
            >
                {open ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 3H13V11H5L3 14V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="5.5" y1="6.5" x2="10.5" y2="6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        <line x1="5.5" y1="8.5" x2="9" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                )}
            </button>
        </header>
    )
}