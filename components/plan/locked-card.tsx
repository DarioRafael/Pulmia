'use client'

// Tarjeta de "feature bloqueada".
// Aparece en lugar de la UI premium cuando el usuario actual no tiene acceso
// a una feature. El diseño clave del producto es que las features premium
// NO se esconden — se muestran bloqueadas con un candado que invita al upgrade.

import Link from 'next/link'
import type { ReactNode } from 'react'
import type { FeatureId } from '@/lib/plans'

interface LockedCardProps {
    /** Feature que se está bloqueando. Se muestra en el texto de invitación. */
    readonly feature: FeatureId
    /** Título visible de la tarjeta (ej: "Gestión de pacientes"). */
    readonly titulo?: string
    /** Descripción corta explicando el beneficio de la feature. */
    readonly descripcion?: string
    /** Contenido opcional (preview, imagen difuminada, etc.) mostrado tras el candado. */
    readonly children?: ReactNode
}

/**
 * Tarjeta bloqueada con candado + link a `/upgrade`.
 *
 * Uso típico:
 *   <FeatureGate feature="pacientes">
 *     <ListaPacientes />
 *   </FeatureGate>
 *
 * FeatureGate renderiza por defecto un LockedCard cuando el usuario no tiene
 * la feature. Solo pasa a usarse directamente cuando quieres personalizar el
 * título o la descripción.
 */
export function LockedCard({ feature, titulo, descripcion, children }: LockedCardProps) {
    return (
        <div
            role="region"
            aria-label={`Feature bloqueada: ${titulo ?? feature}`}
            style={{
                position: 'relative',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: 24,
                background: 'rgba(9, 12, 24, 0.6)',
                backdropFilter: 'blur(12px)',
                overflow: 'hidden',
            }}
        >
            {children !== undefined && (
                <div aria-hidden style={{ filter: 'blur(6px)', opacity: 0.4, pointerEvents: 'none' }}>
                    {children}
                </div>
            )}

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                    textAlign: 'center',
                    padding: '16px 0',
                }}
            >
                <span aria-hidden style={{ fontSize: 28, lineHeight: 1 }}>
                    🔒
                </span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                    {titulo ?? 'Feature Premium'}
                </h3>
                {descripcion !== undefined && (
                    <p style={{ margin: 0, fontSize: 14, opacity: 0.75, maxWidth: 360 }}>
                        {descripcion}
                    </p>
                )}
                <Link
                    href="/upgrade"
                    style={{
                        marginTop: 8,
                        display: 'inline-block',
                        padding: '8px 16px',
                        borderRadius: 8,
                        background: '#2b6be0',
                        color: '#fff',
                        textDecoration: 'none',
                        fontSize: 14,
                        fontWeight: 500,
                    }}
                >
                    Actualizar a Premium
                </Link>
            </div>
        </div>
    )
}
