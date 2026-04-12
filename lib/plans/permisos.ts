// Fuente única de verdad para decidir si un usuario puede usar una feature.
// TODA la app (UI, hooks, rutas API, middleware) debe pasar por `can()`.
// Si ves un `if (plan === 'premium')` en algún sitio, está mal: muévelo aquí.

import { PLANES } from './definicion'
import type { FeatureId, PlanId } from './tipos'

/**
 * ¿El plan dado incluye la feature indicada?
 *
 * Esta es la única función que debe consultarse en el resto del código para
 * tomar decisiones basadas en el plan del usuario. Cualquier cambio en las
 * reglas de negocio se hace editando `definicion.ts` — esta función no
 * debería necesitar cambios.
 *
 * @example
 *   if (can(plan, 'pacientes')) { ... }
 */
export function can(plan: PlanId, feature: FeatureId): boolean {
    // TODO: Restaurar lógica real cuando se active el sistema de planes
    // return PLANES[plan].features.includes(feature)
    void plan; void feature
    return true
}

/**
 * Versión plural de `can`: devuelve `true` solo si el plan tiene TODAS las
 * features listadas. Útil para pantallas que combinan varias capacidades.
 */
export function canAll(plan: PlanId, features: readonly FeatureId[]): boolean {
    return features.every((feature) => can(plan, feature))
}

/**
 * Devuelve `true` si el plan incluye AL MENOS una de las features dadas.
 */
export function canAny(plan: PlanId, features: readonly FeatureId[]): boolean {
    return features.some((feature) => can(plan, feature))
}
