'use client'

import { useTheme } from '@/lib/hooks/useTheme'

interface RailProps {
    onToggleSidebar: () => void
    onToggleSearch: () => void
    sidebarOpen: boolean
    searchOpen: boolean
    statusKey: 'idle' | 'thinking' | 'online'
}

export function Rail({ onToggleSidebar, onToggleSearch, sidebarOpen, searchOpen, statusKey }: RailProps) {
    const { toggleTheme } = useTheme()

    const statusClass =
        statusKey === 'online'
            ? 'bg-[var(--ok)] shadow-[0_0_8px_rgba(76,175,135,0.5)]'
            : statusKey === 'thinking'
                ? 'bg-[var(--warn)] shadow-[0_0_8px_rgba(212,168,67,0.5)] animate-pulse'
                : 'bg-[var(--t3)]'

    return (
        <nav
            style={{
                width: 52,
                flexShrink: 0,
                background: 'var(--bg-1)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px 0',
                gap: 2,
                zIndex: 20,
            }}
        >
            {/* Logo / marca del sistema */}
            <div
                style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--accent)',
                    marginBottom: 12,
                    letterSpacing: '0.04em',
                    userSelect: 'none',
                }}
            >
                IA
            </div>

            <RailBtn
                tip="Chats"
                active={sidebarOpen}
                onClick={onToggleSidebar}
            >
                {/* Icono lista */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3" width="12" height="1.5" rx="0.75" fill="currentColor" />
                    <rect x="2" y="7.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
                    <rect x="2" y="11.5" width="8" height="1.5" rx="0.75" fill="currentColor" />
                </svg>
            </RailBtn>

            <RailBtn
                tip="Buscar (Ctrl+F)"
                active={searchOpen}
                onClick={onToggleSearch}
            >
                {/* Icono lupa */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="10.5" y1="10.5" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </RailBtn>

            <div style={{ width: 24, height: 1, background: 'var(--border)', margin: '4px 0' }} />

            <RailBtn tip="Tema" onClick={toggleTheme}>
                {/* Icono mitad circulo */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2a6 6 0 0 1 0 12V2z" fill="currentColor" />
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
            </RailBtn>

            <div style={{ flex: 1 }} />

            {/* Indicador de estado de conexion con el backend */}
            <div
                className={statusClass}
                style={{ width: 6, height: 6, borderRadius: '50%', margin: '4px 0', transition: 'background 0.4s, box-shadow 0.4s' }}
                title={statusKey === 'online' ? 'Conectado' : statusKey === 'thinking' ? 'Procesando...' : 'En espera'}
            />
        </nav>
    )
}

interface RailBtnProps {
    tip: string
    active?: boolean
    onClick: () => void
    children: React.ReactNode
}

function RailBtn({ tip, active, onClick, children }: RailBtnProps) {
    return (
        <button
            onClick={onClick}
            data-tip={tip}
            title={tip}
            style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--r8)',
                background: active ? 'rgba(91,107,240,0.12)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: active ? 'var(--accent)' : 'var(--t2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all var(--ta)',
                position: 'relative',
            }}
            onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--t0)'
                ;(e.currentTarget as HTMLButtonElement).style.background = active ? 'rgba(91,107,240,0.12)' : 'var(--bg-3)'
            }}
            onMouseLeave={e => {
                ;(e.currentTarget as HTMLButtonElement).style.color = active ? 'var(--accent)' : 'var(--t2)'
                ;(e.currentTarget as HTMLButtonElement).style.background = active ? 'rgba(91,107,240,0.12)' : 'transparent'
            }}
        >
            {children}
        </button>
    )
}