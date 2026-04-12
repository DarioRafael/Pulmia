'use client'

import { HeaderApp } from '@/components/layout/header-app'
import { usePlan } from '@/components/plan'
import Link from 'next/link'

export default function ConfiguracionPage() {
    const { definicion, limites } = usePlan()

    return (
        <>
            <HeaderApp titulo="Configuración" />
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                    padding: '16px 20px', borderRadius: 12,
                    background: 'var(--bg-2)', border: '1px solid var(--border)',
                }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                        Tu plan
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--t0)', marginBottom: 4 }}>
                        {definicion.nombre}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t1)', marginBottom: 8 }}>
                        {definicion.descripcion}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t1)' }}>
                        Estudios/mes: {limites.estudiosPorMes ?? 'Ilimitados'} · Historial: {limites.estudiosEnHistorial ?? 'Ilimitado'}
                    </div>
                    <Link href="/upgrade" style={{
                        display: 'inline-block', marginTop: 12, fontSize: 12,
                        color: 'var(--accent)', textDecoration: 'none',
                    }}>
                        Gestionar plan →
                    </Link>
                </div>
            </div>
        </>
    )
}
