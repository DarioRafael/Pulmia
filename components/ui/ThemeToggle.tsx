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
                width: 36,
                height: 36,
                borderRadius: 'var(--r8)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--t2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all var(--ta)',
            }}
            onMouseEnter={e => {
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--t0)'
                ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-3)'
            }}
            onMouseLeave={e => {
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--t2)'
                ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            }}
        >
            {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
    )
}

function SunIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.4" />
            <line x1="7.5" y1="1"   x2="7.5" y2="2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="7.5" y1="12.5" x2="7.5" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="1"   y1="7.5" x2="2.5" y2="7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="12.5" y1="7.5" x2="14" y2="7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="3.05" y1="3.05" x2="4.1" y2="4.1"   stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="10.9" y1="10.9" x2="11.95" y2="11.95" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="10.9" y1="4.1"  x2="11.95" y2="3.05"  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="3.05" y1="11.95" x2="4.1" y2="10.9"   stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    )
}

function MoonIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path
                d="M12.5 9.5A6 6 0 0 1 5.5 2.5a6 6 0 1 0 7 7z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}