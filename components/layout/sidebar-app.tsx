'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePlan } from '@/components/plan'
import { PlanBadge } from './plan-badge'

interface NavItem {
    readonly href: string
    readonly label: string
    readonly icono: React.ReactNode
    readonly feature?: Parameters<ReturnType<typeof usePlan>['can']>[0]
}

const NAV_ITEMS: NavItem[] = [
    {
        href: '/analizar',
        label: 'Analizar',
        icono: (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="8" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 12L7 9L9 10L11 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        href: '/estudios',
        label: 'Estudios',
        icono: (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <line x1="5.5" y1="5" x2="10.5" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="5.5" y1="7.5" x2="10.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="5.5" y1="10" x2="8.5" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        href: '/pacientes',
        label: 'Pacientes',
        icono: (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M3 14C3 11.2 5.2 9 8 9C10.8 9 13 11.2 13 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        href: '/reportes',
        label: 'Reportes',
        icono: (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M4 2H10L12 4V14H4V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M10 2V4H12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        href: '/configuracion',
        label: 'Configuración',
        icono: (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 2V4M8 12V14M2 8H4M12 8H14M3.8 3.8L5.2 5.2M10.8 10.8L12.2 12.2M12.2 3.8L10.8 5.2M5.2 10.8L3.8 12.2"
                      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        ),
    },
]

interface SidebarAppProps {
    collapsed: boolean
    onToggle: () => void
}

export function SidebarApp({ collapsed, onToggle }: SidebarAppProps) {
    const pathname = usePathname()
    const { can } = usePlan()

    return (
        <nav style={{
            width: collapsed ? 52 : 216,
            flexShrink: 0,
            background: 'var(--bg-1)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '14px 0 16px',
            height: '100%',
            overflow: 'hidden',
            transition: 'width 0.2s cubic-bezier(0.4,0,0.2,1)',
        }}>

            {/* Header: botón toggle donde estaba el ícono + texto logo al lado */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '0' : '0 16px',
                marginBottom: 28,
                gap: 10,
            }}>
                {/* Botón toggle — ocupa el lugar del ícono de pulmón */}
                <button
                    onClick={onToggle}
                    title={collapsed ? 'Expandir' : 'Colapsar'}
                    style={{
                        width: 30, height: 30,
                        borderRadius: 8,
                        border: '1px solid var(--border-h)',
                        background: 'var(--bg-3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--t2)',
                        flexShrink: 0,
                        transition: 'border-color var(--ta), color var(--ta)',
                        padding: 0,
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--border-sel)'
                        e.currentTarget.style.color = 'var(--t0)'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border-h)'
                        e.currentTarget.style.color = 'var(--t2)'
                    }}
                >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <rect x="1.5" y="1.5" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
                        <line x1="5" y1="1.5" x2="5" y2="13.5" stroke="currentColor" strokeWidth="1.2" />
                        {collapsed
                            ? <path d="M7.5 5.5L9.5 7.5L7.5 9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                            : <path d="M9.5 5.5L7.5 7.5L9.5 9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        }
                    </svg>
                </button>

                {/* Texto del logo — desaparece al colapsar */}
                {!collapsed && (
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t0)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                            SistemaCaPu
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', letterSpacing: '0.04em', marginTop: 2 }}>
                            Carcinoma Pulmonar
                        </div>
                    </div>
                )}
            </div>

            {/* Label sección */}
            {!collapsed && (
                <div style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 9,
                    color: 'var(--t3)',
                    padding: '0 16px',
                    marginBottom: 4,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                }}>
                    Principal
                </div>
            )}

            {/* Nav items */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                padding: collapsed ? '0 6px' : '0 8px',
            }}>
                {NAV_ITEMS.map(item => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    const locked = item.feature !== undefined && !can(item.feature)

                    return (
                        <Link
                            key={item.href}
                            href={locked ? '/upgrade' : item.href}
                            title={collapsed ? item.label : undefined}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                gap: 9,
                                padding: collapsed ? '8px' : '7px 10px',
                                borderRadius: 8,
                                textDecoration: 'none',
                                background: isActive ? 'var(--bg-3)' : 'transparent',
                                borderLeft: !collapsed && isActive
                                    ? '2px solid var(--accent)'
                                    : '2px solid transparent',
                                outline: collapsed && isActive ? '1px solid var(--border-sel)' : 'none',
                                color: locked ? 'var(--t3)' : isActive ? 'var(--t0)' : 'var(--t2)',
                                fontSize: 13,
                                fontWeight: isActive ? 500 : 400,
                                transition: 'all var(--ta)',
                                opacity: locked ? 0.5 : 1,
                                letterSpacing: '-0.005em',
                            }}
                            onMouseEnter={e => {
                                if (!isActive) {
                                    const el = e.currentTarget as HTMLAnchorElement
                                    el.style.background = 'var(--bg-2)'
                                    el.style.color = 'var(--t1)'
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isActive) {
                                    const el = e.currentTarget as HTMLAnchorElement
                                    el.style.background = 'transparent'
                                    el.style.color = locked ? 'var(--t3)' : 'var(--t2)'
                                }
                            }}
                        >
                            {item.icono}
                            {!collapsed && (
                                <>
                                    <span style={{ flex: 1 }}>{item.label}</span>
                                    {locked && (
                                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--t3)', flexShrink: 0 }}>
                                            <rect x="2" y="5" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                                            <path d="M4 5V3.5C4 2.4 4.9 1.5 6 1.5C7.1 1.5 8 2.4 8 3.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                        </svg>
                                    )}
                                </>
                            )}
                        </Link>
                    )
                })}
            </div>

            <div style={{ flex: 1 }} />

            <div style={{
                height: '1px',
                background: 'var(--border)',
                margin: collapsed ? '12px 8px' : '12px 16px',
            }} />

            {!collapsed && (
                <div style={{ padding: '0 12px' }}>
                    <PlanBadge />
                </div>
            )}
        </nav>
    )
}