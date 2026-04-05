'use client'

import { useRef, useEffect } from 'react'

interface SearchBarProps {
    open: boolean
    query: string
    matchCount: number
    currentMatch: number
    onQueryChange: (q: string) => void
    onNext: () => void
    onPrev: () => void
    onClose: () => void
}

export function SearchBar({
                              open, query, matchCount, currentMatch,
                              onQueryChange, onNext, onPrev, onClose,
                          }: SearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) inputRef.current?.focus()
    }, [open])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) onClose()
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [open, onClose])

    const hasResults = matchCount > 0
    const noResults = query.length > 0 && matchCount === 0

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            left: 48,
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 14px',
            opacity: open ? 1 : 0,
            pointerEvents: open ? 'all' : 'none',
            transition: 'opacity 0.14s',
            zIndex: 10,
        }}>
            {/* Icono lupa */}
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ color: 'var(--t2)', flexShrink: 0 }}>
                <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4" />
                <line x1="9.5" y1="9.5" x2="12" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>

            <input
                ref={inputRef}
                value={query}
                onChange={e => onQueryChange(e.target.value)}
                placeholder="Buscar en la conversación..."
                autoComplete="off"
                style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--t0)',
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    letterSpacing: '0.01em',
                    caretColor: 'var(--accent)',
                    padding: '0',
                }}
            />

            {/* Contador */}
            {query && (
                <span style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 9,
                    color: noResults ? 'var(--err)' : 'var(--t2)',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.04em',
                    padding: '2px 8px',
                    background: noResults ? 'var(--err-bg)' : 'var(--bg-3)',
                    border: `1px solid ${noResults ? 'rgba(216,64,64,0.2)' : 'var(--border)'}`,
                    borderRadius: 'var(--r4)',
                }}>
                    {hasResults ? `${currentMatch + 1} / ${matchCount}` : '0 resultados'}
                </span>
            )}

            {/* Divider */}
            <div style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} />

            <NavBtn onClick={onPrev} title="Anterior (↑)">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M8 7L5 4L2 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </NavBtn>

            <NavBtn onClick={onNext} title="Siguiente (↓)">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 3L5 6L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </NavBtn>

            <NavBtn onClick={onClose} title="Cerrar (Esc)">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </NavBtn>
        </div>
    )
}

function NavBtn({ onClick, title, children }: {
    onClick: () => void
    title: string
    children: React.ReactNode
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                width: 26,
                height: 26,
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--t1)',
                borderRadius: 'var(--r4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all var(--ta)',
                flexShrink: 0,
            }}
            onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.color = 'var(--accent-h)'
                el.style.borderColor = 'var(--border-focus)'
                el.style.background = 'var(--accent-glow)'
            }}
            onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.color = 'var(--t1)'
                el.style.borderColor = 'var(--border)'
                el.style.background = 'transparent'
            }}
        >
            {children}
        </button>
    )
}