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
                              open,
                              query,
                              matchCount,
                              currentMatch,
                              onQueryChange,
                              onNext,
                              onPrev,
                              onClose,
                          }: SearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) inputRef.current?.focus()
    }, [open])

    // Cerrar con Escape
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape' && open) onClose()
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [open, onClose])

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                left: 50,
                background: 'rgba(11,13,22,0.97)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 14px',
                opacity: open ? 1 : 0,
                pointerEvents: open ? 'all' : 'none',
                transition: 'opacity 0.15s',
                zIndex: 10,
            }}
        >
            <input
                ref={inputRef}
                value={query}
                onChange={e => onQueryChange(e.target.value)}
                placeholder="Buscar en la conversacion..."
                autoComplete="off"
                style={{
                    flex: 1,
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border-h)',
                    outline: 'none',
                    color: 'var(--t0)',
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    padding: '6px 12px',
                    borderRadius: 'var(--r6)',
                    caretColor: 'var(--accent)',
                    transition: 'border-color var(--ta)',
                }}
                onFocus={e => ((e.target as HTMLInputElement).style.borderColor = 'var(--accent)')}
                onBlur={e => ((e.target as HTMLInputElement).style.borderColor = 'var(--border-h)')}
            />

            <span
                style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 9,
                    color: 'var(--t2)',
                    whiteSpace: 'nowrap',
                }}
            >
        {matchCount > 0 ? `${currentMatch + 1}/${matchCount}` : query ? 'Sin resultados' : ''}
      </span>

            <NavBtn onClick={onPrev} title="Anterior">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M9 7.5L5.5 4L2 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </NavBtn>

            <NavBtn onClick={onNext} title="Siguiente">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M2 3.5L5.5 7L9 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </NavBtn>

            <NavBtn onClick={onClose} title="Cerrar">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <line x1="1" y1="1" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="10" y1="1" x2="1" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </NavBtn>
        </div>
    )
}

function NavBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--t1)',
                borderRadius: 'var(--r4)',
                padding: '3px 7px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all var(--ta)',
            }}
            onMouseEnter={e => {
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(91,107,240,0.4)'
            }}
            onMouseLeave={e => {
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--t1)'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
            }}
        >
            {children}
        </button>
    )
}