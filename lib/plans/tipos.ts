// Tipos base del sistema de planes.
// Esta es la fuente única de verdad para los identificadores de planes y features.
// Si necesitas agregar una feature nueva, añádela primero aquí y luego actualiza
// `definicion.ts` y `limites.ts`. TypeScript se encargará de avisar en cualquier
// otro lugar del código que deba reaccionar al cambio.

/**
 * Identificador de plan del usuario.
 * Free: plan gratuito por defecto.
 * Premium: plan de pago con todas las features desbloqueadas.
 */
export type PlanId = 'free' | 'premium'

/**
 * Identificador de feature del producto.
 * Una feature representa una capacidad de la app que puede estar permitida
 * o bloqueada según el plan. NO es lo mismo que una ruta — varias features
 * pueden convivir en una misma pantalla.
 */
export type FeatureId =
    // Features disponibles en Free
    | 'analizar'
    | 'ver_estudio'
    | 'chat_basico'
    // Features exclusivas de Premium
    | 'pacientes'
    | 'reportes_pdf'
    | 'comparacion'
    | 'historial_ilimitado'
    | 'equipo'

/**
 * Definición completa de un plan.
 * Contiene el conjunto de features que el plan incluye y metadatos de presentación.
 */
export interface PlanDefinicion {
    /** Identificador estable del plan. */
    readonly id: PlanId
    /** Nombre visible del plan (para UI). */
    readonly nombre: string
    /** Descripción corta del plan (para UI). */
    readonly descripcion: string
    /** Conjunto de features incluidas en el plan. */
    readonly features: readonly FeatureId[]
}

/**
 * Límites cuantitativos aplicables a un plan.
 *
 * Un valor de `null` significa "ilimitado" — se representa explícitamente como
 * null en vez de un número mágico (ej: Infinity) para que sea serializable a
 * JSON y fácil de mostrar en la UI ("ilimitado").
 */
export interface LimitesPlan {
    /** Máximo de estudios que el usuario puede crear por mes calendario. */
    readonly estudiosPorMes: number | null
    /** Máximo de estudios visibles en el historial del usuario. */
    readonly estudiosEnHistorial: number | null
}
