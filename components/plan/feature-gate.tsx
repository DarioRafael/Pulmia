'use client'

// Componente de control de acceso a features.
//
// Regla no negociable del diseño: cualquier UI premium debe envolverse en
// <FeatureGate feature="..."> en vez de `if (plan === 'premium')`. Así la
// app tiene un único punto donde decidir qué se muestra bloqueado.

import type { ReactNode } from 'react'
import type { FeatureId } from '@/lib/plans'
import { usePlan } from './plan-provider'
import { LockedCard } from './locked-card'

interface FeatureGateProps {
    /** Feature requerida para renderizar `children`. */
    readonly feature: FeatureId
    /** UI real que se muestra cuando el plan incluye la feature. */
    readonly children: ReactNode
    /**
     * UI alternativa cuando el plan NO incluye la feature.
     * Si se omite, por defecto se muestra un `<LockedCard>` genérico.
     */
    readonly fallback?: ReactNode
}

/**
 * Renderiza `children` si el plan del usuario actual incluye la feature.
 * En caso contrario, renderiza el `fallback` indicado (o un LockedCard por defecto).
 *
 * El componente DEBE usarse dentro de un `<PlanProvider>` — hoy eso ocurre
 * en `app/layout.tsx` por lo que cubre toda la app.
 */
export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
    const { can } = usePlan()

    if (can(feature)) {
        return <>{children}</>
    }

    return <>{fallback ?? <LockedCard feature={feature} />}</>
}
