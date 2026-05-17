'use client'

import { HeaderApp } from '@/components/layout/header-app'
import { usePlan } from '@/components/plan'
import { MedicalDisclaimer } from '@/components/medical/medical-disclaimer'
import Link from 'next/link'

interface ItemPlan {
    readonly id: string
    readonly etiqueta: string
    readonly incluido: boolean
    readonly detalle?: string
}

const styleSeccionLabel = {
    fontFamily: 'var(--mono)' as const,
    fontSize: 9,
    color: 'var(--t2)',
    letterSpacing: '0.08em' as const,
    textTransform: 'uppercase' as const,
    marginBottom: 12,
    fontWeight: 600,
}

const styleCard = {
    padding: '20px',
    borderRadius: 14,
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
}

function FilaItem({ item }: { item: ItemPlan }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '8px 0',
            borderBottom: '1px solid var(--border)',
        }}>
            <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: item.incluido ? 'var(--ok-bg)' : 'transparent',
                border: `1px solid ${item.incluido ? 'var(--ok)' : 'var(--t3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 1,
            }}>
                {item.incluido ? (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M3 6L5 8L9 4" stroke="var(--ok)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <line x1="1.5" y1="1.5" x2="6.5" y2="6.5" stroke="var(--t3)" strokeWidth="1.2" strokeLinecap="round" />
                        <line x1="6.5" y1="1.5" x2="1.5" y2="6.5" stroke="var(--t3)" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                    fontSize: 13,
                    color: item.incluido ? 'var(--t0)' : 'var(--t2)',
                    fontWeight: item.incluido ? 500 : 400,
                    textDecoration: item.incluido ? 'none' : 'line-through',
                    lineHeight: 1.45,
                }}>
                    {item.etiqueta}
                </div>
                {item.detalle && (
                    <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 2 }}>
                        {item.detalle}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ConfiguracionPage() {
    const { plan, definicion, limites } = usePlan()
    const esFree = plan === 'free'

    // Solo mostramos como "upsell" lo que el plan actual NO incluye.
    const tieneEstudiosIlimitados = limites.estudiosPorMes === null
    const tieneHistorialIlimitado = limites.estudiosEnHistorial === null

    const items: ItemPlan[] = [
        {
            id: 'estudios-mes',
            etiqueta: tieneEstudiosIlimitados
                ? 'Estudios ilimitados al mes'
                : `${limites.estudiosPorMes} estudios al mes`,
            incluido: true,
            detalle: tieneEstudiosIlimitados ? undefined : 'Se reinicia el primer día de cada mes',
        },
        {
            id: 'historial-plan',
            etiqueta: tieneHistorialIlimitado
                ? 'Historial completo sin límite'
                : `Historial de ${limites.estudiosEnHistorial} estudios`,
            incluido: true,
        },
        {
            id: 'exportar',
            etiqueta: 'Exportación a PDF y Word',
            incluido: true,
        },
        {
            id: 'chat',
            etiqueta: 'Asistente clínico (chat con IA)',
            incluido: true,
        },
        // Solo añadimos líneas "no incluidas" para features que realmente faltan en el plan
        ...(!tieneEstudiosIlimitados ? [{
            id: 'estudios-ilimitados-upsell',
            etiqueta: 'Estudios ilimitados',
            incluido: false,
            detalle: 'Disponible en plan superior',
        } as ItemPlan] : []),
        ...(!tieneHistorialIlimitado ? [{
            id: 'historial-ilimitado-upsell',
            etiqueta: 'Historial ilimitado',
            incluido: false,
            detalle: 'Disponible en plan superior',
        } as ItemPlan] : []),
    ]

    return (
        <>
            <HeaderApp titulo="Configuración" subtitulo="Plan, límites e información del sistema" />
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                maxWidth: 720,
                width: '100%',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
            }}>
                {/* ── Plan actual ───────────────────────────────────── */}
                <div style={styleCard}>
                    <div style={styleSeccionLabel}>Tu plan</div>

                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        marginBottom: 14,
                    }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 10,
                            background: esFree ? 'var(--bg-3)' : 'var(--accent-glow)',
                            border: `1px solid ${esFree ? 'var(--border-h)' : 'var(--accent)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, color: esFree ? 'var(--t1)' : 'var(--accent)',
                            flexShrink: 0,
                        }}>
                            {esFree ? '○' : '★'}
                        </div>
                        <div>
                            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t0)', letterSpacing: '-0.01em' }}>
                                {definicion.nombre}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--t1)', marginTop: 2 }}>
                                {definicion.descripcion}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                        {items.map((it) => <FilaItem key={it.id} item={it} />)}
                    </div>

                    {esFree && (
                        <Link href="/upgrade" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            marginTop: 16,
                            padding: '9px 18px', borderRadius: 10,
                            background: 'var(--accent)', color: '#fff',
                            fontSize: 13, fontWeight: 600,
                            textDecoration: 'none',
                            boxShadow: 'var(--shadow-accent)',
                        }}>
                            Comparar planes
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Link>
                    )}
                </div>

                {/* ── Acerca / Marco legal ─────────────────────────── */}
                <div style={styleCard}>
                    <div style={styleSeccionLabel}>Marco institucional</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t0)', marginBottom: 4 }}>
                        Pulmia · InnovaTecNM 2026
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--t1)', lineHeight: 1.65, marginBottom: 14 }}>
                        Proyecto académico del Instituto Tecnológico de Ciudad Victoria.
                        Sin registro sanitario ante COFEPRIS. Uso académico, demostrativo y de investigación.
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Link href="/legal" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 8,
                            background: 'var(--bg-3)', color: 'var(--t0)',
                            border: '1px solid var(--border-h)',
                            fontSize: 12.5, fontWeight: 500, textDecoration: 'none',
                            transition: 'all var(--ta)',
                        }}>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                <path d="M8 1.5L13 3.5V8C13 11 10.7 13.5 8 14.5C5.3 13.5 3 11 3 8V3.5L8 1.5Z"
                                    stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
                                <path d="M6 8L7.5 9.5L10.5 6.5" stroke="currentColor" strokeWidth="1.4"
                                    strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Marco legal completo
                        </Link>
                        <Link href="/legal" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 8,
                            background: 'var(--bg-3)', color: 'var(--t0)',
                            border: '1px solid var(--border-h)',
                            fontSize: 12.5, fontWeight: 500, textDecoration: 'none',
                        }}>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                <path d="M3 2H10L13 5V14H3V2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                                <path d="M10 2V5H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            </svg>
                            Bases científicas
                        </Link>
                    </div>
                </div>

                {/* ── Disclaimer recordatorio ──────────────────────── */}
                <MedicalDisclaimer variante="banner" storageKey="pulmia.configuracion.banner.cerrado" />
            </div>
        </>
    )
}
