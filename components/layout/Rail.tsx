'use client'

import { useTheme } from '@/lib/hooks/useTheme'

interface RailProps {
    onToggleSidebar: () => void
    onToggleSearch: () => void
    sidebarOpen: boolean
    searchOpen: boolean
    statusKey: 'idle' | 'thinking' | 'online'
}

const statusConfig = {
    online:   { color: 'var(--ok)',   label: 'Conectado',     pulse: false },
    thinking: { color: 'var(--warn)', label: 'Procesando...', pulse: true  },
    idle:     { color: 'var(--t2)',   label: 'En espera',     pulse: false },
}

export function Rail({ onToggleSidebar, onToggleSearch, sidebarOpen, searchOpen, statusKey }: RailProps) {
    const { toggleTheme } = useTheme()
    const st = statusConfig[statusKey]

    return (
        <nav
            style={{
                width: 48,
                flexShrink: 0,
                background: 'var(--bg-1)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '14px 0 12px',
                gap: 2,
                zIndex: 20,
            }}
        >
            {/* Logotipo del sistema */}
            <div
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: 'var(--r6)',
                    background: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                    flexShrink: 0,
                }}
            >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                        d="M7 2V7M4 7C4 9.2 2 10 2 12H6C6 10 7 9 7 7M10 7C10 9.2 12 10 12 12H8C8 10 7 9 7 7"
                        stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    />
                </svg>
            </div>

            <RailBtn tip="Sesiones" active={sidebarOpen} onClick={onToggleSidebar}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <rect x="2" y="2.5" width="11" height="1.4" rx="0.7" fill="currentColor" />
                    <rect x="2" y="6.8" width="11" height="1.4" rx="0.7" fill="currentColor" />
                    <rect x="2" y="11.1" width="7" height="1.4" rx="0.7" fill="currentColor" />
                </svg>
            </RailBtn>

            <RailBtn tip="Buscar (Ctrl+F)" active={searchOpen} onClick={onToggleSearch}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="9.8" y1="9.8" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </RailBtn>

            <div style={{ width: 20, height: '1px', background: 'var(--border)', margin: '6px 0' }} />

            <RailBtn tip="Cambiar tema" onClick={toggleTheme}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d="M7.5 2a5.5 5.5 0 0 1 0 11V2z" fill="currentColor" />
                    <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
            </RailBtn>

            <div style={{ flex: 1 }} />

            {/* Indicador de estado */}
            <div
                title={st.label}
                style={{
                    position: 'relative',
                    width: 8,
                    height: 8,
                    marginBottom: 4,
                }}
            >
                <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: st.color,
                    transition: 'background 0.4s',
                    animation: st.pulse ? 'status-pulse 1.4s ease-in-out infinite' : 'none',
                }} />
            </div>

            <style>{`
                @keyframes status-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.85); }
                }
            `}</style>
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
            title={tip}
            style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--r6)',
                background: active ? 'var(--accent-glow)' : 'transparent',
                border: active ? '1px solid var(--border-focus)' : '1px solid transparent',
                cursor: 'pointer',
                color: active ? 'var(--accent-h)' : 'var(--t2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all var(--ta)',
            }}
            onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement
                if (!active) {
                    el.style.color = 'var(--t0)'
                    el.style.background = 'var(--bg-3)'
                    el.style.borderColor = 'var(--border)'
                }
            }}
            onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.color = active ? 'var(--accent-h)' : 'var(--t2)'
                el.style.background = active ? 'var(--accent-glow)' : 'transparent'
                el.style.borderColor = active ? 'var(--border-focus)' : 'transparent'
            }}
        >
            {children}
        </button>
    )
}