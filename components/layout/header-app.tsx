'use client'

// Header de la app clínica.
// Muestra el título de la sección actual y el toggle de tema.

import { useTheme } from '@/lib/hooks/useTheme'

interface HeaderAppProps {
    readonly titulo: string
    readonly subtitulo?: string
}

export function HeaderApp({ titulo, subtitulo }: HeaderAppProps) {
    const { toggleTheme } = useTheme()

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
        </header>
    )
}
