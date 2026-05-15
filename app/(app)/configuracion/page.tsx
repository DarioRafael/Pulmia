'use client'

import { HeaderApp } from '@/components/layout/header-app'
import { usePlan } from '@/components/plan'
import Link from 'next/link'

export default function ConfiguracionPage() {
    const { definicion, limites } = usePlan()
    const isPremium = definicion.nombre === 'Premium'

    return (
        <>
            <HeaderApp titulo="Configuración" />
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Grid de planes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>



                    {/* Tarjeta Premium */}
                    <div style={{
                        padding: '16px 20px', borderRadius: 12,
                        background: 'var(--bg-2)', border: `1px solid ${isPremium ? 'var(--accent)' : 'var(--border)'}`,
                        position: 'relative',
                    }}>
                        {isPremium && (
                            <div style={{
                                position: 'absolute', top: 10, right: 12,
                                fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--accent)',
                                background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                                padding: '2px 8px', borderRadius: 99, letterSpacing: '0.06em', textTransform: 'uppercase',
                            }}>
                                Plan actual
                            </div>
                        )}
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                            Premium
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--t0)', marginBottom: 4 }}>
                            Premium
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--t1)', marginBottom: 8 }}>
                            Incluye pacientes, reportes PDF, comparación e historial ilimitado.
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--t1)' }}>
                            Estudios/mes: Ilimitados · Historial: Ilimitado
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', marginTop: 12 }}>
                            $29/mes
                        </div>
                        {!isPremium && (
                            <Link href="/upgrade" style={{
                                display: 'inline-block', marginTop: 12, fontSize: 12,
                                color: 'var(--accent)', textDecoration: 'none',
                            }}>
                                Próximamente →
                            </Link>
                        )}
                    </div>

                </div>

                {/* Link gestionar plan */}
                <Link href="/upgrade" style={{
                    display: 'inline-block', fontSize: 12,
                    color: 'var(--accent)', textDecoration: 'none',
                }}>
                    Gestionar plan →
                </Link>
            </div>
        </>
    )
}