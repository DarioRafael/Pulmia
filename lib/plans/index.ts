// Re-exports públicos del módulo `lib/plans`.
// Preferir importar desde `@/lib/plans` en el resto de la app en lugar de
// alcanzar los archivos internos directamente.

export type { FeatureId, LimitesPlan, PlanDefinicion, PlanId } from './tipos'
export { PLANES, obtenerPlan } from './definicion'
export { LIMITES, obtenerLimites, esIlimitado, estaDentroDelLimite } from './limites'
export { can, canAll, canAny } from './permisos'
