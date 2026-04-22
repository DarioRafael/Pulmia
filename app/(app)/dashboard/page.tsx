'use client'

// Dashboard del sistema clínico.
// Resumen rápido: estudios recientes, estado del plan, acceso a analizar.

import { HeaderApp } from '@/components/layout/header-app'
import { useEstudios } from '@/features/estudios'
import { usePlan } from '@/components/plan'
import { UpgradePrompt } from '@/components/plan'
import Link from 'next/link'

export default function DashboardPage() {
    const { estudios, estudiosEsteMes, puedoCrear } = useEstudios()
    const { plan, limites } = usePlan()

    return (
        <>
            <HeaderApp titulo="Dashboard" />
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                background: 'var(--bg-1)',
            }}>
                {plan === 'free' && (
                    <UpgradePrompt mensaje="Accede a pacientes, reportes PDF y comparación con Premium." />
                )}

                {/* Tarjetas de resumen */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <StatCard
                        titulo="Estudios este mes"
                        valor={`${estudiosEsteMes}`}
                        subtitulo={limites.estudiosPorMes !== null ? `de ${limites.estudiosPorMes}` : 'ilimitados'}
                    />
                    <StatCard
                        titulo="Estudios totales"
                        valor={`${estudios.length}`}
                        subtitulo="en historial"
                    />
                    <StatCard
                        titulo="Plan"
                        valor={plan === 'free' ? 'Free' : 'Premium'}
                        subtitulo={plan === 'free' ? 'Básico' : 'Todo incluido'}
                    />
                </div>

                {/* Acción principal */}
                <Link
                    href="/analizar"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        padding: '15px 24px',
                        borderRadius: 12,
                        /* Activo: fondo sutil azul + borde azul. Inactivo: superficie gris */
                        background: puedoCrear ? 'var(--accent-dim)' : 'var(--bg-2)',
                        border: `1px solid ${puedoCrear ? 'var(--accent)' : 'var(--border)'}`,
                        color: puedoCrear ? 'var(--t0)' : 'var(--t2)',
                        textDecoration: 'none',
                        fontSize: 14,
                        fontWeight: 600,
                        letterSpacing: '0.01em',
                        transition: 'all 0.15s ease',
                        pointerEvents: puedoCrear ? 'auto' : 'none',
                        opacity: puedoCrear ? 1 : 0.45,
                        boxShadow: puedoCrear
                            ? '0 0 0 0px var(--accent), inset 0 1px 0 rgba(255,255,255,0.04)'
                            : 'none',
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                        <rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
                        <line x1="9" y1="6" x2="9" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        <line x1="6" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                    Nuevo análisis
                </Link>

                {/* Estudios recientes */}
                {estudios.length > 0 && (
                    <div>
                        <div style={{
                            fontFamily: 'var(--mono)',
                            fontSize: 10,
                            color: 'var(--t2)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            marginBottom: 10,
                        }}>
                            Estudios recientes
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {estudios.slice(0, 3).map(e => (
                                <Link
                                    key={e.id}
                                    href={`/estudios/${e.id}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '10px 14px',
                                        borderRadius: 10,
                                        background: 'var(--bg-2)',
                                        /* Borde neutro por defecto; cambia a azul en :focus-visible */
                                        border: '1px solid var(--border)',
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        transition: 'border-color 0.15s ease, background 0.15s ease',
                                        outline: 'none',
                                        /* hover inline — ver clase en globals.css sugerida abajo */
                                    }}
                                    /* onMouseEnter/Leave para hover sin CSS externo */
                                    onMouseEnter={e2 => {
                                        const el = e2.currentTarget as HTMLAnchorElement
                                        el.style.borderColor = 'var(--border-h)'
                                        el.style.background = 'var(--bg-3)'
                                    }}
                                    onMouseLeave={e2 => {
                                        const el = e2.currentTarget as HTMLAnchorElement
                                        el.style.borderColor = 'var(--border)'
                                        el.style.background = 'var(--bg-2)'
                                    }}
                                    onFocus={e2 => {
                                        const el = e2.currentTarget as HTMLAnchorElement
                                        el.style.borderColor = 'var(--border-sel)'
                                        el.style.boxShadow = '0 0 0 3px var(--accent-dim)'
                                    }}
                                    onBlur={e2 => {
                                        const el = e2.currentTarget as HTMLAnchorElement
                                        el.style.borderColor = 'var(--border)'
                                        el.style.boxShadow = 'none'
                                    }}
                                >
                                    <img
                                        src={e.imagenDataUrl}
                                        alt=""
                                        style={{
                                            width: 36,
                                            height: 36,
                                            objectFit: 'cover',
                                            borderRadius: 6,
                                            border: '1px solid var(--border-h)',
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, color: 'var(--t0)', fontWeight: 500 }}>
                                            {e.nombreArchivo}
                                        </div>
                                        <div style={{
                                            fontFamily: 'var(--mono)',
                                            fontSize: 10,
                                            color: 'var(--t2)',
                                            marginTop: 2,
                                        }}>
                                            {e.informe.porcentajeCarcinoma}% — {e.informe.severidad}
                                        </div>
                                    </div>
                                    {/* Indicador de flecha sutil */}
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--t2)', flexShrink: 0 }}>
                                        <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

function StatCard({ titulo, valor, subtitulo }: { titulo: string; valor: string; subtitulo: string }) {
    return (
        <div style={{
            flex: 1,
            minWidth: 140,
            padding: '16px 18px',
            borderRadius: 12,
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            /* Sin sombra de color — solo volumen neutral */
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
        }}>
            <div style={{
                fontFamily: 'var(--mono)',
                fontSize: 9,
                color: 'var(--t2)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 8,
            }}>
                {titulo}
            </div>
            <div style={{
                fontSize: 26,
                fontWeight: 700,
                color: 'var(--t0)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
            }}>
                {valor}
            </div>
            <div style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                color: 'var(--t2)',
                marginTop: 5,
            }}>
                {subtitulo}
            </div>
        </div>
    )
}