'use client'

// Página de planes y upgrade.
// Muestra la comparación Free vs Premium con features.

import { HeaderApp } from '@/components/layout/header-app'
import { usePlan } from '@/components/plan'
import { PLANES } from '@/lib/plans/definicion'
import { LIMITES } from '@/lib/plans/limites'

export default function UpgradePage() {
    const { plan } = usePlan()

    return (
        <>
            <HeaderApp titulo="Planes" subtitulo="Elige el plan que mejor se adapte a ti" />
            <div style={{
                flex: 1, overflowY: 'auto', padding: '32px 24px',
                display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap',
                alignItems: 'flex-start',
            }}>
                {/* Plan Free */}
                <PlanCard
                    nombre={PLANES.free.nombre}
                    descripcion={PLANES.free.descripcion}
                    features={PLANES.free.features as unknown as string[]}
                    limites={LIMITES.free}
                    actual={plan === 'free'}
                    precio="$0"
                />

                {/* Plan Premium */}
                <PlanCard
                    nombre={PLANES.premium.nombre}
                    descripcion={PLANES.premium.descripcion}
                    features={PLANES.premium.features as unknown as string[]}
                    limites={LIMITES.premium}
                    actual={plan === 'premium'}
                    precio="$29/mes"
                    destacado
                />
            </div>
        </>
    )
}

function PlanCard({
    nombre, descripcion, features, limites, actual, precio, destacado,
}: {
    nombre: string
    descripcion: string
    features: string[]
    limites: { estudiosPorMes: number | null; estudiosEnHistorial: number | null }
    actual: boolean
    precio: string
    destacado?: boolean
}) {
    return (
        <div style={{
            width: 300, padding: '24px', borderRadius: 16,
            background: 'var(--bg-2)',
            border: `1.5px solid ${destacado ? 'var(--accent)' : 'var(--border)'}`,
            display: 'flex', flexDirection: 'column', gap: 16,
            boxShadow: destacado ? '0 0 32px rgba(43,107,224,0.15)' : 'none',
        }}>
            <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t0)', marginBottom: 4 }}>
                    {nombre}
                </div>
                <div style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.5 }}>
                    {descripcion}
                </div>
            </div>

            <div style={{ fontSize: 28, fontWeight: 700, color: destacado ? 'var(--accent)' : 'var(--t0)' }}>
                {precio}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Límites
                </div>
                <div style={{ fontSize: 12, color: 'var(--t1)' }}>
                    Estudios/mes: <strong style={{ color: 'var(--t0)' }}>{limites.estudiosPorMes ?? 'Ilimitados'}</strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--t1)' }}>
                    Historial: <strong style={{ color: 'var(--t0)' }}>{limites.estudiosEnHistorial ?? 'Ilimitado'}</strong>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Features
                </div>
                {features.map(f => (
                    <div key={f} style={{ fontSize: 12, color: 'var(--t0)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: 'var(--ok)', fontSize: 11 }}>✓</span>
                        {f.replace(/_/g, ' ')}
                    </div>
                ))}
            </div>

            <button
                disabled={actual}
                style={{
                    padding: '10px 20px', borderRadius: 10, width: '100%',
                    background: actual ? 'var(--bg-3)' : destacado ? 'var(--accent)' : 'var(--bg-3)',
                    color: actual ? 'var(--t2)' : destacado ? '#fff' : 'var(--t0)',
                    border: actual ? '1px solid var(--border)' : destacado ? 'none' : '1px solid var(--border)',
                    fontSize: 13, fontWeight: 500, cursor: actual ? 'default' : 'pointer',
                    boxShadow: !actual && destacado ? 'var(--shadow-accent)' : 'none',
                }}
            >
                {actual ? 'Plan actual' : 'Próximamente'}
            </button>
        </div>
    )
}
