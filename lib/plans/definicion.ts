// Definición declarativa de los planes del producto.
// Cambiar qué features tiene un plan se hace editando ESTE archivo y nada más.
// Ningún componente ni ruta debería comparar strings de plan a mano: usa
// `can(plan, feature)` de `permisos.ts`.

import type { FeatureId, PlanDefinicion, PlanId } from './tipos'

/**
 * Features incluidas en el plan Free.
 * Si mueves una feature de aquí a Premium (o viceversa) no hace falta tocar
 * ningún otro archivo: el resto de la app reaccionará automáticamente.
 */
const FEATURES_FREE: readonly FeatureId[] = [
    'analizar',
    'ver_estudio',
    'chat_basico',
] as const

/**
 * Features incluidas en el plan Premium.
 * Por diseño, Premium hereda todas las features de Free. El spread lo hace
 * explícito en el código para que no haya forma de olvidar una feature Free
 * al configurar Premium.
 */
const FEATURES_PREMIUM: readonly FeatureId[] = [
    ...FEATURES_FREE,
    'pacientes',
    'reportes_pdf',
    'comparacion',
    'historial_ilimitado',
    'equipo',
] as const

/**
 * Catálogo de planes indexado por `PlanId`.
 *
 * La constante usa `satisfies` para que TypeScript valide que el diccionario
 * cubre todas las variantes de `PlanId` sin perder el tipado literal de cada
 * entrada.
 */
export const PLANES = {
    free: {
        id: 'free',
        nombre: 'Free',
        descripcion: 'Acceso a análisis básico y chat clínico.',
        features: FEATURES_FREE,
    },
    premium: {
        id: 'premium',
        nombre: 'Premium',
        descripcion: 'Incluye pacientes, reportes PDF, comparación e historial ilimitado.',
        features: FEATURES_PREMIUM,
    },
} as const satisfies Record<PlanId, PlanDefinicion>

/**
 * Devuelve la definición completa de un plan.
 * Útil cuando un componente necesita metadatos de presentación (nombre, etc.).
 */
export function obtenerPlan(plan: PlanId): PlanDefinicion {
    return PLANES[plan]
}
