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
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {plan === 'free' && (
                    <UpgradePrompt mensaje="Accede a pacientes, reportes PDF y comparación con Premium." />
                )}

                {/* Tarjetas de resumen */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <StatCard
                        titulo="Estudios este mes"
                        valor={`${estudiosEsteMes}`}
                        subtitulo={limites.estudiosPorMes !== null ? `de ${limites.estudiosPorMes}` : 'ilimitados'}
                    />
                    <StatCard titulo="Estudios totales" valor={`${estudios.length}`} subtitulo="en historial" />
                    <StatCard titulo="Plan" valor={plan === 'free' ? 'Free' : 'Premium'} subtitulo={plan === 'free' ? 'Básico' : 'Todo incluido'} />
                </div>

                {/* Acción principal */}
                <Link
                    href="/analizar"
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        padding: '16px 24px', borderRadius: 14,
                        background: puedoCrear ? 'var(--accent)' : 'var(--bg-3)',
                        color: puedoCrear ? '#fff' : 'var(--t2)',
                        textDecoration: 'none', fontSize: 15, fontWeight: 600,
                        boxShadow: puedoCrear ? 'var(--shadow-accent)' : 'none',
                        transition: 'all var(--ts)',
                        pointerEvents: puedoCrear ? 'auto' : 'none',
                        opacity: puedoCrear ? 1 : 0.5,
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
                        <line x1="9" y1="6" x2="9" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        <line x1="6" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                    Nuevo análisis
                </Link>

                {/* Estudios recientes */}
                {estudios.length > 0 && (
                    <div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                            Estudios recientes
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {estudios.slice(0, 3).map(e => (
                                <Link
                                    key={e.id}
                                    href={`/estudios/${e.id}`}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '10px 14px', borderRadius: 10,
                                        background: 'var(--bg-2)', border: '1px solid var(--border)',
                                        textDecoration: 'none', color: 'inherit',
                                        transition: 'all var(--ta)',
                                    }}
                                >
                                    <img src={e.imagenDataUrl} alt="" style={{
                                        width: 36, height: 36, objectFit: 'cover', borderRadius: 6,
                                        border: '1px solid var(--border-h)',
                                    }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, color: 'var(--t0)' }}>{e.nombreArchivo}</div>
                                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)' }}>
                                            {e.informe.porcentajeCarcinoma}% — {e.informe.severidad}
                                        </div>
                                    </div>
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
            flex: 1, minWidth: 150, padding: '16px 18px', borderRadius: 12,
            background: 'var(--bg-2)', border: '1px solid var(--border)',
        }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                {titulo}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--t0)', lineHeight: 1 }}>
                {valor}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)', marginTop: 4 }}>
                {subtitulo}
            </div>
        </div>
    )
}
