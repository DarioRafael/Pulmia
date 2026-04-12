'use client'

// Sidebar de navegación principal de la app clínica.
// Muestra las secciones del sistema y resalta features premium con candado.

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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M3 14C3 11.2 5.2 9 8 9C10.8 9 13 11.2 13 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        href: '/reportes',
        label: 'Reportes',
        icono: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 2H10L12 4V14H4V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M10 2V4H12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        href: '/configuracion',
        label: 'Configuración',
        icono: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 2V4M8 12V14M2 8H4M12 8H14M3.8 3.8L5.2 5.2M10.8 10.8L12.2 12.2M12.2 3.8L10.8 5.2M5.2 10.8L3.8 12.2"
                      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        ),
    },
]

export function SidebarApp() {
    const pathname = usePathname()
    const { can, plan } = usePlan()

    return (
        <nav style={{
            width: 220, flexShrink: 0, background: 'var(--bg-1)',
            borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            padding: '16px 0', height: '100%',
        }}>
            {/* Logo */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '0 16px', marginBottom: 24,
            }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 'var(--r8)',
                    background: 'var(--accent)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'var(--shadow-accent)',
                }}>
                    <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                        <path d="M7 2V7M4 7C4 9.2 2 10 2 12H6C6 10 7 9 7 7M10 7C10 9.2 12 10 12 12H8C8 10 7 9 7 7"
                              stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t0)', lineHeight: 1 }}>
                        Sistema IA
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', letterSpacing: '0.04em' }}>
                        Carcinoma Pulmonar
                    </div>
                </div>
            </div>

            {/* Sección principal */}
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', padding: '0 16px', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Principal
            </div>

            {NAV_ITEMS.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const locked = item.feature !== undefined && !can(item.feature)

                return (
                    <Link
                        key={item.href}
                        href={locked ? '/upgrade' : item.href}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 16px', margin: '1px 8px',
                            borderRadius: 8, textDecoration: 'none',
                            background: isActive ? 'var(--accent-glow)' : 'transparent',
                            color: locked ? 'var(--t2)' : isActive ? 'var(--accent-h)' : 'var(--t1)',
                            fontSize: 13, fontWeight: isActive ? 500 : 400,
                            transition: 'all var(--ta)',
                            opacity: locked ? 0.6 : 1,
                        }}
                    >
                        {item.icono}
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {locked && (
                            <span style={{ fontSize: 11 }}>🔒</span>
                        )}
                    </Link>
                )
            })}

            <div style={{ flex: 1 }} />

            {/* Badge del plan actual */}
            <div style={{ padding: '0 16px' }}>
                <PlanBadge />
            </div>
        </nav>
    )
}
