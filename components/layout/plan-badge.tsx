'use client'

// Badge que muestra el plan actual del usuario en la sidebar.
// Si es Free, incluye un link a /upgrade.

import Link from 'next/link'
import { usePlan } from '@/components/plan'

export function PlanBadge() {
    const { plan, definicion } = usePlan()

    const isFree = plan === 'free'

    return (
        <div style={{
            padding: '10px 12px', borderRadius: 10,
            background: isFree ? 'var(--bg-2)' : 'linear-gradient(135deg, rgba(43,107,224,0.15), rgba(43,107,224,0.05))',
            border: `1px solid ${isFree ? 'var(--border)' : 'rgba(43,107,224,0.3)'}`,
            display: 'flex', alignItems: 'center', gap: 8,
        }}>
            <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: isFree ? 'var(--bg-3)' : 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, flexShrink: 0,
            }}>
                {isFree ? '🆓' : '⭐'}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t0)' }}>
                    {definicion.nombre}
                </div>
                {isFree && (
                    <Link href="/upgrade" style={{
                        fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)',
                        textDecoration: 'none', letterSpacing: '0.03em',
                    }}>
                        Actualizar →
                    </Link>
                )}
            </div>
        </div>
    )
}
