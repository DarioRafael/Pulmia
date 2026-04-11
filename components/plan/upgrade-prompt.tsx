'use client'

// Banner inline de upgrade.
// A diferencia de `LockedCard` (que reemplaza una sección entera), este
// componente es un banner horizontal pensado para colocarse arriba o dentro
// de una pantalla como recordatorio de que hay features premium disponibles.

import Link from 'next/link'
import type { FeatureId } from '@/lib/plans'

interface UpgradePromptProps {
    /**
     * Feature opcional que motivó mostrar el prompt. Se puede usar para
     * mostrar un mensaje más específico ("desbloquea pacientes").
     */
    readonly feature?: FeatureId
    /** Mensaje personalizado. Si no se pasa, se usa uno por defecto. */
    readonly mensaje?: string
    /** Texto del botón. */
    readonly textoAccion?: string
}

/**
 * Banner de invitación a upgrade.
 * Colócalo arriba de una pantalla cuando haya features premium relacionadas
 * visibles en la misma vista.
 */
export function UpgradePrompt({
    feature,
    mensaje,
    textoAccion = 'Ver planes',
}: UpgradePromptProps) {
    const textoPorDefecto = feature
        ? `Desbloquea "${feature}" y más features clínicas con Premium.`
        : 'Desbloquea todas las features clínicas con Premium.'

    return (
        <div
            role="note"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid rgba(43, 107, 224, 0.35)',
                background: 'linear-gradient(90deg, rgba(43,107,224,0.12), rgba(43,107,224,0.04))',
                fontSize: 14,
            }}
        >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span aria-hidden style={{ fontSize: 16 }}>
                    ⭐
                </span>
                <span>{mensaje ?? textoPorDefecto}</span>
            </span>
            <Link
                href="/upgrade"
                style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    background: '#2b6be0',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                }}
            >
                {textoAccion}
            </Link>
        </div>
    )
}
