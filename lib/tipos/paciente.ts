// Paciente clínico.
// Feature Premium — en Free los estudios no se asocian a pacientes.

/**
 * Paciente registrado en el sistema.
 * La estructura está pensada para crecer: en el MVP solo usamos nombre e id.
 */
export interface Paciente {
    readonly id: string
    readonly nombre: string
    /** ISO 8601 — fecha de nacimiento, para cálculo de edad en contexto clínico. */
    readonly fechaNacimiento?: string
    /** Notas libres mostradas en la ficha. */
    readonly notas?: string
    readonly creadoEn: string
}
