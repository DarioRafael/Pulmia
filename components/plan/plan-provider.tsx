'use client'

// Provider del plan actual del usuario.
//
// En Fase 1 el plan viene fijo por prop (default: 'free') porque todavía no
// hay autenticación. Cuando se integre Supabase Auth (Fase 4), el plan se
// leerá del usuario en el server component raíz y se pasará a este provider
// vía prop — el resto del código cliente no necesita cambiar.

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import {
    can as canFn,
    canAll as canAllFn,
    canAny as canAnyFn,
    obtenerLimites,
    obtenerPlan,
    type FeatureId,
    type LimitesPlan,
    type PlanDefinicion,
    type PlanId,
} from '@/lib/plans'

/**
 * Forma del contexto expuesto por `PlanProvider`.
 * Incluye el plan actual, sus metadatos, sus límites y helpers de permisos
 * ya enlazados al plan — así los componentes no tienen que pasar el plan
 * en cada llamada.
 */
interface PlanContextValue {
    readonly plan: PlanId
    readonly definicion: PlanDefinicion
    readonly limites: LimitesPlan
    readonly can: (feature: FeatureId) => boolean
    readonly canAll: (features: readonly FeatureId[]) => boolean
    readonly canAny: (features: readonly FeatureId[]) => boolean
}

const PlanContext = createContext<PlanContextValue | null>(null)

interface PlanProviderProps {
    /**
     * Plan actual del usuario. En Fase 1 se pasa de forma estática desde el
     * layout raíz. Más adelante lo resolverá el server component que consulte
     * la sesión del usuario en Supabase.
     */
    readonly plan?: PlanId
    readonly children: ReactNode
}

/**
 * Envuelve la app con el contexto de plan.
 * Los componentes descendientes pueden consumirlo con `usePlan()` o declararlo
 * implícitamente usando `<FeatureGate>`.
 */
export function PlanProvider({ plan = 'free', children }: PlanProviderProps) {
    // useMemo evita recrear el value en cada render y así no invalidar
    // innecesariamente a los consumidores del contexto.
    const value = useMemo<PlanContextValue>(
        () => ({
            plan,
            definicion: obtenerPlan(plan),
            limites: obtenerLimites(plan),
            can: (feature) => canFn(plan, feature),
            canAll: (features) => canAllFn(plan, features),
            canAny: (features) => canAnyFn(plan, features),
        }),
        [plan],
    )

    return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

/**
 * Hook de consumo del contexto de plan.
 * Lanza un error si se usa fuera de `<PlanProvider>` — eso siempre es un bug
 * de integración y es mejor fallar ruidosamente que devolver un plan falso.
 */
export function usePlan(): PlanContextValue {
    const ctx = useContext(PlanContext)
    if (ctx === null) {
        throw new Error('usePlan() debe usarse dentro de <PlanProvider>.')
    }
    return ctx
}
