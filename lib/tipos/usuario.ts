// Usuario del sistema clínico.
// En Fase 2 todavía no hay autenticación — este tipo define el contrato que
// se usará cuando se conecte Supabase Auth.

import type { PlanId } from '@/lib/plans'

export interface Usuario {
    readonly id: string
    readonly email: string
    /** Nombre a mostrar en UI. */
    readonly nombre?: string
    /** Plan actual del usuario. */
    readonly plan: PlanId
    readonly creadoEn: string
}
