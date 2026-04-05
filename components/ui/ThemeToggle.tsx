'use client'

import { useTheme } from '@/lib/hooks/useTheme'

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()
    const isDark = theme === 'dark'

    return (
        <button
            onClick={toggleTheme}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--r6)',
                background: 'transparent',
                border: '1px solid transparent',
                cursor: 'pointer',
                color: 'var(--t2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all var(--ta)',
            }}
            onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.color = 'var(--t0)'
                el.style.background = 'var(--bg-3)'
                el.style.borderColor = 'var(--border)'
            }}
            onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.color = 'var(--t2)'
                el.style.background = 'transparent'
                el.style.borderColor = 'transparent'
            }}
        >
            {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
    )
}

function SunIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="2.8" stroke="currentColor" strokeWidth="1.4" />
            <line x1="7" y1="1" x2="7" y2="2.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="7" y1="11.6" x2="7" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="1" y1="7" x2="2.4" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="11.6" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="2.9" y1="2.9" x2="3.9" y2="3.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="10.1" y1="10.1" x2="11.1" y2="11.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="10.1" y1="3.9" x2="11.1" y2="2.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="2.9" y1="11.1" x2="3.9" y2="10.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    )
}

function MoonIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M11.5 9A6 6 0 0 1 5 2.5a6 6 0 1 0 6.5 6.5z"
                  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}