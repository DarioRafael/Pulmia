// Cuotas y límites cuantitativos aplicables a cada plan.
// Los límites se modelan como números (o `null` para "ilimitado") y se
// consumen vía `obtenerLimites(plan)`.

import type { LimitesPlan, PlanId } from './tipos'

/**
 * Tabla de límites indexada por `PlanId`.
 *
 * Convención: `null` significa "ilimitado". Preferimos `null` sobre
 * `Infinity` o un número mágico porque es serializable a JSON, distingue
 * limpiamente "no hay límite" de "el límite es un número grande" y permite
 * mostrar "ilimitado" en la UI con un simple check.
 */
export const LIMITES = {
    free: {
        estudiosPorMes: 5,
        estudiosEnHistorial: 3,
    },
    premium: {
        estudiosPorMes: null,
        estudiosEnHistorial: null,
    },
} as const satisfies Record<PlanId, LimitesPlan>

/**
 * Devuelve los límites aplicables a un plan.
 */
export function obtenerLimites(plan: PlanId): LimitesPlan {
    return LIMITES[plan]
}

/**
 * Indica si el plan tiene ilimitado un recurso determinado.
 * Atajo para evitar comparaciones con `null` repartidas por la UI.
 */
export function esIlimitado(limite: number | null): limite is null {
    return limite === null
}

/**
 * Comprueba si un `usoActual` está dentro del límite del plan.
 * Si el límite es `null` (ilimitado) siempre devuelve `true`.
 */
export function estaDentroDelLimite(usoActual: number, limite: number | null): boolean {
    if (limite === null) return true
    return usoActual < limite
}
